const {
  Customer,
  Worker,
  ArchitectHiring,
  DesignRequest,
  ConstructionProjectSchema,
  Bid,
  Company,
} = require("../models/index");
const { getTargetDate } = require("../utils/helpers");
const {
  buildCacheKey,
  getCacheJson,
  setCacheJson,
  logRedisEndpointCache,
  invalidateCacheByPrefix,
} = require("../utils/redisCache");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const { findOrCreateChatRoom } = require("./chatController");

const CUSTOMER_ONGOING_CACHE_PREFIX = "customer:ongoing-projects:v1";
const COMPANY_ONGOING_CACHE_PREFIX = "company:ongoing-projects:v1";

const invalidateOngoingProjectCaches = async ({ customerId, companyId } = {}) => {
  try {
    const invalidations = [];
    if (customerId) {
      invalidations.push(
        invalidateCacheByPrefix(
          buildCacheKey(CUSTOMER_ONGOING_CACHE_PREFIX, { customerId }),
        ),
      );
    }
    if (companyId) {
      invalidations.push(
        invalidateCacheByPrefix(
          buildCacheKey(COMPANY_ONGOING_CACHE_PREFIX, { companyId }),
        ),
      );
    }
    if (invalidations.length) {
      await Promise.all(invalidations);
    }
  } catch (error) {
    console.error("Failed to invalidate ongoing project caches:", error.message);
  }
};

const getDashboard = (req, res) => {
  // routed file : customer/customer_dashboard
  res.status(200).json({ view: "customer/customer_dashboard" });
};

const normalizeStatus = (status) => (status || "").toString().toLowerCase();

const getEditLockReason = (type, project) => {
  const status = normalizeStatus(project?.status);

  if (status !== "pending") {
    return "Editing is allowed only while the request is pending.";
  }

  if (type === "architect") {
    if (project?.proposal?.price || project?.proposal?.description) {
      return "Editing is locked after a proposal is created.";
    }
    if ((project?.milestones || []).length > 0) {
      return "Editing is locked once milestone activity starts.";
    }
    if ((project?.projectUpdates || []).length > 0) {
      return "Editing is locked once project updates are added.";
    }
    return null;
  }

  if (type === "interior") {
    if (project?.proposal?.price || project?.proposal?.description) {
      return "Editing is locked after a proposal is created.";
    }
    if ((project?.milestones || []).length > 0) {
      return "Editing is locked once milestone activity starts.";
    }
    if ((project?.projectUpdates || []).length > 0) {
      return "Editing is locked once project updates are added.";
    }
    return null;
  }

  if (type === "company") {
    if (project?.proposal?.price || project?.proposal?.description) {
      return "Editing is locked after a proposal is created.";
    }
    if ((project?.milestones || []).length > 0) {
      return "Editing is locked once milestone activity starts.";
    }
    if ((project?.recentUpdates || []).length > 0) {
      return "Editing is locked once project updates are added.";
    }
    if ((project?.completionPercentage || 0) > 0) {
      return "Editing is locked once progress has started.";
    }
    return null;
  }

  return "Unsupported request type.";
};

const parseJsonIfString = (value, fallback) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }
  return value;
};

const extractArchitectFloorRequirements = (body) => {
  if (body.floorRequirements) {
    const parsed = parseJsonIfString(
      body.floorRequirements,
      body.floorRequirements,
    );
    if (Array.isArray(parsed)) {
      return parsed
        .map((floor, index) => ({
          floorNumber: Number(floor.floorNumber || index + 1),
          details: (floor.details || "").toString(),
        }))
        .filter((floor) => floor.floorNumber > 0);
    }
  }

  const floorMap = {};
  Object.keys(body || {}).forEach((key) => {
    const match = key.match(
      /^floorRequirements\[(\d+)\]\[(floorNumber|details)\]$/,
    );
    if (!match) return;

    const index = Number(match[1]);
    const field = match[2];
    if (!floorMap[index]) floorMap[index] = {};
    floorMap[index][field] = body[key];
  });

  return Object.keys(floorMap)
    .sort((a, b) => Number(a) - Number(b))
    .map((k, idx) => {
      const floor = floorMap[k];
      return {
        floorNumber: Number(floor.floorNumber || idx + 1),
        details: (floor.details || "").toString(),
      };
    })
    .filter((floor) => floor.floorNumber > 0);
};

const getJobRequestStatus = async (req, res) => {
  try {
    if (!req.user || !req.user.user_id)
      return res.status(401).json({ error: "Unauthorized" });

    const rawArchitectApplications = await ArchitectHiring.find({
      customer: req.user.user_id,
    })
      .select("+milestones +projectUpdates")
      .populate("worker", "name email phone specialization experience")
      .lean();
    const rawInteriorApplications = await DesignRequest.find({
      customerId: req.user.user_id,
    })
      .select("+milestones +projectUpdates")
      .populate("workerId", "name email phone specialization experience")
      .lean();
    const companyApplications = await ConstructionProjectSchema.find({
      customerId: req.user.user_id,
    })
      .populate("companyId", "companyName contactPerson email phone location")
      .lean();

    const workerIds = [
      ...rawArchitectApplications
        .map((app) => app.worker?._id || app.worker)
        .filter(Boolean),
      ...rawInteriorApplications
        .map((app) => app.workerId?._id || app.workerId)
        .filter(Boolean),
    ].map((id) => id.toString());

    const companyIds = companyApplications
      .map((app) => app.companyId?._id || app.companyId)
      .filter(Boolean)
      .map((id) => id.toString());

    const [workers, companies] = await Promise.all([
      workerIds.length
        ? Worker.find({ _id: { $in: workerIds } })
            .select("name email phone specialization experience")
            .lean()
        : [],
      companyIds.length
        ? Company.find({ _id: { $in: companyIds } })
            .select("companyName contactPerson email phone location")
            .lean()
        : [],
    ]);

    const workerMap = new Map(workers.map((w) => [String(w._id), w]));
    const companyMap = new Map(companies.map((c) => [String(c._id), c]));

    const architectApplications = await Promise.all(
      rawArchitectApplications.map(async (app) => {
        const workerId = app.worker?._id || app.worker;
        const assignedWorkerDetails = workerId
          ? workerMap.get(String(workerId)) || null
          : null;

        if (app.status === "Accepted" && app.worker) {
          const chatRoom = await findOrCreateChatRoom(app._id, "architect");
          return {
            ...app,
            chatId: chatRoom ? chatRoom.roomId : null,
            assignedWorkerDetails,
          };
        }

        return {
          ...app,
          assignedWorkerDetails,
        };
      }),
    );

    const interiorApplications = await Promise.all(
      rawInteriorApplications.map(async (app) => {
        const workerId = app.workerId?._id || app.workerId;
        const assignedWorkerDetails = workerId
          ? workerMap.get(String(workerId)) || null
          : null;

        if (app.status === "accepted" && app.workerId) {
          const chatRoom = await findOrCreateChatRoom(app._id, "interior");
          return {
            ...app,
            chatId: chatRoom ? chatRoom.roomId : null,
            assignedWorkerDetails,
          };
        }

        return {
          ...app,
          assignedWorkerDetails,
        };
      }),
    );

    const enrichedCompanyApplications = companyApplications.map((app) => {
      const companyId = app.companyId?._id || app.companyId;
      const assignedCompanyDetails = companyId
        ? companyMap.get(String(companyId)) || null
        : null;

      return {
        ...app,
        assignedCompanyDetails,
      };
    });

    // routed file : customer/Job_Status
    res.status(200).json({
      architectApplications,
      interiorApplications,
      companyApplications: enrichedCompanyApplications,
    });
  } catch (error) {
    console.error("Error fetching job request status:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getConstructionCompaniesList = async (req, res) => {
  try {
    const companies = await Company.find({}).lean();

    const companiesWithReviews = await Promise.all(
      companies.map(async (company) => {
        const completedProjects = await ConstructionProjectSchema.find({
          companyId: company._id,
          status: "accepted",
          completionPercentage: 100,
          "customerReview.rating": { $exists: true, $ne: null },
        })
          .select("projectName customerReview completionImages")
          .lean();

        // Calculate average rating
        let averageRating = 0;
        let totalReviews = completedProjects.length;

        if (totalReviews > 0) {
          const sumRatings = completedProjects.reduce((sum, project) => {
            return sum + (project.customerReview?.rating || 0);
          }, 0);
          averageRating = (sumRatings / totalReviews).toFixed(1);
        }

        return {
          ...company,
          completedProjectsWithReviews: completedProjects,
          averageRating: parseFloat(averageRating),
          totalReviews,
        };
      }),
    );

    // routed file : customer/construction_companies_list
    res.status(200).json({ companies: companiesWithReviews, user: req.user });
  } catch (error) {
    console.error("Error fetching companies:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const getArchitects = async (req, res) => {
  try {
    const architects = await Worker.find({ isArchitect: true }).lean();
    // routed file : customer/architect
    res.status(200).json({ architects });
  } catch (error) {
    console.error("Error fetching architects:", error);
    res.status(500).json({ message: "Failed to fetch architects" });
  }
};

const getArchitectForm = (req, res) => {
  const { workerId } = req.query;
  // routed file : customer/architect_form
  res.status(200).json({ workerId });
};

const getOngoingProjects = async (req, res) => {
  try {
    const startedAt = process.hrtime.bigint();
    const customerId = req.user.user_id;
    if (!customerId)
      return res
        .status(401)
        .json({ error: "Unauthorized", redirect: "/login" });

    const cacheKey = buildCacheKey(CUSTOMER_ONGOING_CACHE_PREFIX, {
      customerId,
    });
    const cachedPayload = await getCacheJson(cacheKey);
    if (cachedPayload) {
      logRedisEndpointCache("hit", req.originalUrl, startedAt);
      return res.status(200).json(cachedPayload);
    }

    const projects = await ConstructionProjectSchema.find({
      customerId,
      status: "accepted",
    })
      .populate("companyId", "companyName")
      .lean();

    const totalActiveProjects = projects.length;
    const metrics = {
      totalActiveProjects,
      monthlyRevenue: "4.8",
      customerSatisfaction: "4.7",
      projectsOnSchedule: "85",
    };

    const enhancedProjects = projects.map((project) => {
      let completion = 0;
      let currentPhase = "Planning";

      if (project.currentPhase) {
        const phases = [
          "Foundation",
          "Structure",
          "Interior work",
          "Finishing",
        ];
        const phaseIndex = phases.indexOf(project.currentPhase);
        completion = phaseIndex >= 0 ? (phaseIndex + 1) * 25 : 0;
        currentPhase = project.currentPhase;
      }

      completion = project.completionPercentage || completion;

      let targetDate = "Not specified";
      if (project.targetCompletionDate) {
        targetDate = new Date(project.targetCompletionDate).toLocaleDateString(
          "en-US",
          { year: "numeric", month: "short", day: "numeric" },
        );
      } else if (project.projectTimeline && project.createdAt) {
        targetDate = getTargetDate(project.createdAt, project.projectTimeline);
      }

      return {
        ...project,
        completion,
        targetDate,
        currentPhase,
        updates: (project.recentUpdates || []).map((update) => ({
          description: update.updateText || "No description",
          image: update.updateImagePath || "/images/update-default.jpg",
        })),
        siteFilepaths:
          project.siteFilepaths ||
          (project.mainImagePath ? [project.mainImagePath] : []),
        floors: project.floors || [],
        specialRequirements: project.specialRequirements || "None specified",
        accessibilityNeeds: project.accessibilityNeeds || "none",
        energyEfficiency: project.energyEfficiency || "standard",
        companyName: project.companyId
          ? project.companyId.companyName
          : "Not assigned",
      };
    });

    const responsePayload = { projects: enhancedProjects, metrics };
    await setCacheJson(cacheKey, responsePayload, 90);
    logRedisEndpointCache("miss", req.originalUrl, startedAt);

    // routed file : customer/ongoing_projects
    res.status(200).json(responsePayload);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const getDesignIdeas = (req, res) => {
  // routed file : customer/design_ideas
  res.status(200).json({ view: "customer/design_ideas" });
};

const getInteriorDesignForm = (req, res) => {
  const { workerId } = req.query;
  // routed file : customer/interiordesign_form
  res.status(200).json({ workerId });
};

const getInteriorDesigners = async (req, res) => {
  try {
    const designers = await Worker.find({ isArchitect: false }).lean();
    // routed file : customer/interior_design
    res.status(200).json({ designers });
  } catch (error) {
    console.error("Error fetching designers:", error);
    res.status(500).json({ message: "Failed to fetch designers" });
  }
};

const getConstructionForm = (req, res) => {
  // routed file : customer/construction_form
  res.status(200).json({ view: "customer/construction_form" });
};

const getBidForm = (req, res) => {
  // routed file : customer/bid_form
  res.status(200).json({ view: "customer/bid_form" });
};

const submitBidForm = async (req, res) => {
  const siteFiles = req.files.siteFiles || [];
  const floorImages = req.files.floorImages || [];
  const siteFilepaths = siteFiles.map((file) => file.path);

  const {
    projectName,
    customerName,
    customerEmail,
    customerPhone,
    projectAddress,
    projectLocation,
    totalArea,
    buildingType,
    estimatedBudget,
    projectTimeline,
    totalFloors,
    specialRequirements,
    accessibilityNeeds,
    energyEfficiency,
    floors,
  } = req.body;
  const MIN_BID_BUDGET = 10000000;

  try {
    if (!req.user || !req.user.user_id) {
      return res
        .status(401)
        .json({ error: "Authentication required to submit a bid request." });
    }

    const budgetValue = Number(estimatedBudget);
    if (!Number.isFinite(budgetValue) || budgetValue < MIN_BID_BUDGET) {
      return res.status(400).json({
        error: "Minimum bid budget is ₹1,00,00,000.",
      });
    }

    let parsedFloors = floors || [];
    if (!Array.isArray(parsedFloors)) {
      parsedFloors = Object.values(parsedFloors);
    }

    const finalFloors = parsedFloors.map((floor, index) => ({
      ...floor,
      floorArea: Number(floor.floorArea),
      floorNumber: Number(floor.floorNumber),
      floorImagePath: floorImages[index] ? floorImages[index].path : null,
    }));

    const newBid = new Bid({
      projectName,
      customerId: req.user.user_id,
      customerName,
      customerEmail,
      customerPhone,
      projectAddress,
      projectLocation,
      totalArea: Number(totalArea),
      buildingType,
      estimatedBudget: budgetValue,
      projectTimeline: Number(projectTimeline) || 0,
      totalFloors: Number(totalFloors),
      floors: finalFloors,
      specialRequirements,
      accessibilityNeeds,
      energyEfficiency,
      siteFiles: siteFilepaths,
      status: "open",
      companyBids: [],
    });

    await newBid.save();
    res.status(200).json({
      success: true,
      message: "Bid submitted",
      redirect: "/job_status",
    });
  } catch (error) {
    console.error("Error in submitBidForm:", error);
    res.status(500).json({
      error:
        "Error submitting project request. Please check the fields and try again.",
    });
  }
};

const getSettings = async (req, res) => {
  try {
    const user = await Customer.findById(req.user.user_id).lean();
    // routed file : customer/customer_settings
    res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching user settings:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const getBidSpace = async (req, res) => {
  try {
    const customerId = req.user.user_id;
    const customerBids = await Bid.find({ customerId }).lean();
    // routed file : customer/bid_space
    res.status(200).json({ customerBids, user: req.user });
  } catch (error) {
    console.error("Error fetching bids:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const postConstructionForm = async (req, res) => {
  try {
    const {
      companyId,
      projectName,
      customerName,
      customerEmail,
      customerPhone,
      projectAddress,
      projectLocationPincode,
      totalArea,
      buildingType,
      estimatedBudget,
      projectTimeline,
      totalFloors,
      specialRequirements,
      accessibilityNeeds,
      energyEfficiency,
      floors,
    } = req.body;

    if (!companyId) {
      return res.status(400).json({ error: "companyId is required" });
    }

    const siteFilepaths = req.files ? req.files.map((file) => file.path) : [];

    let parsedFloors = [];
    if (typeof floors === "string") {
      try {
        parsedFloors = JSON.parse(floors);
      } catch (e) {
        console.error("Error parsing floors:", e);
        return res.status(400).json({ error: "Invalid floors data" });
      }
    } else if (Array.isArray(floors)) {
      parsedFloors = floors;
    }

    const newProject = new ConstructionProjectSchema({
      projectName,
      customerName,
      customerEmail,
      customerPhone,
      projectAddress,
      projectLocationPincode,
      totalArea: Number(totalArea),
      buildingType,
      estimatedBudget: Number(estimatedBudget) || 0,
      projectTimeline: Number(projectTimeline) || 0,
      totalFloors: Number(totalFloors),
      floors: parsedFloors,
      specialRequirements,
      accessibilityNeeds,
      energyEfficiency,
      siteFilepaths,
      companyId,
      customerId: req.user ? req.user.user_id : null,
      status: "pending",
    });

    await newProject.save();
    res.status(200).json({ success: true, redirect: "/ongoing_projects" });
  } catch (error) {
    console.error("Error in postConstructionForm:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

const acceptProposal = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const customerId = req.user.user_id;

    let project;

    if (type === "architect") {
      project = await ArchitectHiring.findOne({
        _id: id,
        customer: customerId,
      }).populate("worker");
      if (!project) {
        const err = new Error("Project not found or you are not authorized.");
        err.status = 404;
        return next(err);
      }
      if (project.proposal && project.proposal.price)
        project.finalAmount = project.proposal.price;
      project.status = "Pending Payment"; // Changed from "Accepted" - payment must be completed first
    } else if (type === "interior") {
      const projectToUpdate = await DesignRequest.findOne({
        _id: id,
        customerId: customerId,
      }).populate("workerId");
      if (!projectToUpdate) {
        const err = new Error("Project not found or you are not authorized.");
        err.status = 404;
        return next(err);
      }
      project = projectToUpdate;
      if (project.proposal && project.proposal.price)
        project.finalAmount = project.proposal.price;
      project.status = "pending_payment"; // Changed from "accepted" - payment must be completed first
    } else {
      return res.status(400).json({ error: "Invalid project type." });
    }

    await project.save();

    // Return success with redirect to payment checkout page
    // Customer will be redirected to professional payment page
    res.status(200).json({
      success: true,
      redirect: `/customerdashboard/payment-checkout/${project._id}?type=${type}&payment=deposit`,
      message:
        "Proposal accepted! Please complete the payment to start your project.",
    });
  } catch (error) {
    console.error("Error accepting proposal:", error);
    next(error);
  }
};

const acceptCompanyBid = async (req, res, next) => {
  try {
    const { bidId, companyBidId } = req.params;
    const customerId = req.user.user_id;

    const bid = await Bid.findOne({ _id: bidId, customerId: customerId });
    if (!bid) {
      const err = new Error("Bid not found or you are not authorized.");
      err.status = 404;
      return next(err);
    }

    const companyBid = bid.companyBids.id(companyBidId);
    if (!companyBid) {
      const err = new Error("Company bid not found.");
      err.status = 404;
      return next(err);
    }

    bid.status = "awarded";
    bid.winningBidId = companyBidId;

    const platformFeePercentage = 0.05;
    bid.paymentDetails.totalAmount = companyBid.bidPrice;
    bid.paymentDetails.platformFee =
      companyBid.bidPrice * platformFeePercentage;
    bid.paymentDetails.paymentStatus = "paid";

    const advancePayout = companyBid.bidPrice * 0.2;
    bid.paymentDetails.payouts.push({
      amount: advancePayout,
      status: "pending",
    });

    await UpdateOngoingProjectsSchema(bid, companyBid);
    await bid.save();
    await invalidateOngoingProjectCaches({
      customerId,
      companyId: companyBid.companyId,
    });

    res.status(200).json({ success: true, redirect: "/ongoing_projects" });
  } catch (error) {
    console.error("Error accepting company bid:", error);
    next(error);
  }
};

const UpdateOngoingProjectsSchema = async (bid, companyBid) => {
  const initialStatus = "accepted";
  await ConstructionProjectSchema.create({
    projectName: bid.projectName,
    customerId: bid.customerId,
    companyId: companyBid.companyId,
    customerName: bid.customerName,
    customerEmail: bid.customerEmail,
    customerPhone: bid.customerPhone,
    projectAddress: bid.projectAddress,
    totalArea: bid.totalArea,
    buildingType: bid.buildingType,
    totalFloors: bid.totalFloors,
    projectLocationPincode: bid.projectLocation,
    estimatedBudget: bid.estimatedBudget,
    projectTimeline: bid.projectTimeline,
    floors: bid.floors,
    specialRequirements: bid.specialRequirements,
    accessibilityNeeds: bid.accessibilityNeeds,
    energyEfficiency: bid.energyEfficiency,
    siteFilepaths: bid.siteFiles,
    status: initialStatus,
    completionPercentage: 0,
    additionalImagePaths: [],
    recentUpdates: [],
    proposal: {
      price: companyBid.bidPrice,
      description: "Accepted Bid Price of " + companyBid.bidPrice,
      sentAt: companyBid.bidDate,
    },
    paymentDetails: {
      totalAmount: bid.paymentDetails.totalAmount,
      platformFee: bid.paymentDetails.platformFee,
      amountPaidToCompany: bid.paymentDetails.amountPaidToCompany,
      paymentStatus: bid.paymentDetails.paymentStatus,
      payouts: bid.paymentDetails.payouts,
    },
  });
};

const acceptCompanyProposal = async (req, res) => {
  try {
    const { projectId } = req.params;
    const customerId = req.user.user_id;

    const project = await ConstructionProjectSchema.findOne({
      _id: projectId,
      customerId: customerId,
    });
    if (!project || project.status !== "proposal_sent") {
      return res
        .status(404)
        .json({ error: "Project not found or proposal not available." });
    }

    project.status = "accepted";
    const platformFeePercentage = 0.05;
    project.paymentDetails.totalAmount = project.proposal.price;
    project.paymentDetails.platformFee =
      project.proposal.price * platformFeePercentage;
    project.paymentDetails.paymentStatus = "paid";

    const advancePayout = project.proposal.price * 0.2;
    project.paymentDetails.payouts.push({
      amount: advancePayout,
      status: "pending",
    });

    await project.save();
    await invalidateOngoingProjectCaches({
      customerId,
      companyId: project.companyId,
    });
    res.status(200).json({ success: true, redirect: "/ongoing_projects" });
  } catch (error) {
    console.error("Error accepting company proposal:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

const rejectCompanyProposal = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { reason } = req.body;
    const customerId = req.user.user_id;

    const project = await ConstructionProjectSchema.findOne({
      _id: projectId,
      customerId: customerId,
    });
    if (!project || project.status !== "proposal_sent") {
      return res
        .status(404)
        .json({ error: "Project not found or proposal not available." });
    }

    project.status = "rejected";
    if (reason) {
      project.rejectionReason = reason;
    }

    await project.save();
    res
      .status(200)
      .json({ success: true, message: "Proposal rejected successfully" });
  } catch (error) {
    console.error("Error rejecting company proposal:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

const rejectProposal = async (req, res, next) => {
  try {
    const { type, projectId } = req.params;
    const { reason } = req.body;
    const customerId = req.user.user_id;

    if (type === "company") {
      req.params.projectId = projectId;
      return rejectCompanyProposal(req, res, next);
    }

    let project;

    if (type === "architect") {
      project = await ArchitectHiring.findOne({
        _id: projectId,
        customer: customerId,
      });

      if (!project) {
        return res
          .status(404)
          .json({ error: "Project not found or you are not authorized." });
      }

      project.status = "Rejected";
    } else if (type === "interior") {
      project = await DesignRequest.findOne({
        _id: projectId,
        customerId,
      });

      if (!project) {
        return res
          .status(404)
          .json({ error: "Project not found or you are not authorized." });
      }

      project.status = "rejected";
    } else {
      return res.status(400).json({ error: "Invalid project type." });
    }

    if (reason) {
      project.rejectionReason = reason;
    }

    await project.save();
    return res
      .status(200)
      .json({ success: true, message: "Proposal rejected successfully" });
  } catch (error) {
    console.error("Error rejecting proposal:", error);
    return next(error);
  }
};

const updateCustomerSettings = async (req, res) => {
  try {
    const customerId = req.user.user_id;
    const { name, email, phone } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    if (typeof name === "string") customer.name = name.trim();
    if (typeof email === "string") customer.email = email.trim().toLowerCase();
    if (typeof phone === "string") customer.phone = phone.trim();

    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
    });
  } catch (error) {
    console.error("Error updating customer settings:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

const acceptConstructionProposal = async (req, res) => {
  try {
    const { projectId } = req.body;
    const customerId = req.user.user_id;

    const project = await ConstructionProjectSchema.findOne({
      _id: projectId,
      customerId: customerId,
    });

    if (!project || project.status !== "proposal_sent") {
      return res
        .status(404)
        .json({ error: "Project not found or proposal not available." });
    }

    // Update project status to accepted
    project.status = "accepted";
    project.proposalAcceptedAt = new Date();

    await project.save();
    await invalidateOngoingProjectCaches({
      customerId,
      companyId: project.companyId,
    });
    res
      .status(200)
      .json({ success: true, message: "Proposal accepted successfully" });
  } catch (error) {
    console.error("Error accepting construction proposal:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

const updatePassword = async (req, res) => {
  try {
    const customerId = req.user.user_id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Both current and new passwords are required." });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }

    const isMatch = await bcrypt.compare(currentPassword, customer.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password." });
    }

    const isSameAsOld = await bcrypt.compare(newPassword, customer.password);
    if (isSameAsOld) {
      return res
        .status(400)
        .json({ message: "New password cannot be same as current password." });
    }

    customer.password = newPassword;
    await customer.save();

    res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ message: "Server error while updating password." });
  }
};

const approveMilestone = async (req, res) => {
  try {
    const { projectId, milestoneId } = req.params;
    const { projectType } = req.body;

    let project;
    if (projectType === "architect") {
      project = await ArchitectHiring.findById(projectId);
    } else if (projectType === "interior") {
      project = await DesignRequest.findById(projectId);
    }

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const milestone = project.milestones.id(milestoneId);
    if (!milestone) {
      return res.status(404).json({ error: "Milestone not found" });
    }

    milestone.status = "Approved";
    milestone.approvedAt = new Date();
    await project.save();

    // Automatically release payment for this milestone
    let paymentReleaseInfo = null;
    try {
      const { releaseMilestonePayment } = require("./paymentController");
      const mockReq = {
        body: {
          projectId: projectId,
          projectType: projectType,
          milestonePercentage: milestone.percentage,
        },
      };

      // Create promise to capture payment release response
      const paymentPromise = new Promise((resolve, reject) => {
        const mockRes = {
          json: (data) => {
            console.log("Milestone payment released:", data);
            resolve(data);
          },
          status: (code) => ({
            json: (data) => {
              console.error("Failed to release milestone payment:", data);
              reject(data);
            },
          }),
        };

        releaseMilestonePayment(mockReq, mockRes).catch(reject);
      });

      // Wait for payment release to complete
      paymentReleaseInfo = await paymentPromise;
    } catch (paymentError) {
      console.error("Error in milestone payment release:", paymentError);
      // Don't fail the approval if payment release fails
    }

    // Check if there's a next milestone that needs payment
    const nextMilestone = paymentReleaseInfo?.data?.nextPayment;

    if (nextMilestone && nextMilestone.milestone) {
      // Redirect to payment checkout page for next milestone
      const redirectUrl = `/customerdashboard/payment-checkout/${projectId}?type=${projectType}&payment=milestone&milestone=${nextMilestone.milestone}`;

      res.status(200).json({
        success: true,
        message: `Milestone approved and payment released! Please complete payment for next milestone (${nextMilestone.milestone}%).`,
        redirect: redirectUrl,
        paymentInfo: paymentReleaseInfo?.data,
      });
    } else {
      // No more milestones - project complete
      res.status(200).json({
        success: true,
        message: "Milestone approved and payment released! Project completed.",
        paymentInfo: paymentReleaseInfo?.data,
      });
    }
  } catch (error) {
    console.error("Error approving milestone:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const rejectMilestone = async (req, res) => {
  try {
    const { projectId, milestoneId } = req.params;
    const { projectType, reason } = req.body;

    let project;
    if (projectType === "architect") {
      project = await ArchitectHiring.findById(projectId);
    } else if (projectType === "interior") {
      project = await DesignRequest.findById(projectId);
    }

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const milestone = project.milestones.id(milestoneId);
    if (!milestone) {
      return res.status(404).json({ error: "Milestone not found" });
    }

    milestone.status = "Rejected";
    milestone.rejectedAt = new Date();
    if (reason) milestone.rejectionReason = reason;
    await project.save();

    res.status(200).json({ success: true, message: "Milestone rejected" });
  } catch (error) {
    console.error("Error rejecting milestone:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const requestMilestoneRevision = async (req, res) => {
  try {
    const { projectId, milestoneId } = req.params;
    const { projectType, revisionNotes } = req.body;

    if (!revisionNotes || !revisionNotes.trim()) {
      return res.status(400).json({ error: "Revision notes are required" });
    }

    let project;
    if (projectType === "architect") {
      project = await ArchitectHiring.findById(projectId);
    } else if (projectType === "interior") {
      project = await DesignRequest.findById(projectId);
    }

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const milestone = project.milestones.id(milestoneId);
    if (!milestone) {
      return res.status(404).json({ error: "Milestone not found" });
    }

    // Add to revision history
    if (!milestone.revisionHistory) {
      milestone.revisionHistory = [];
    }
    milestone.revisionHistory.push({
      requestedAt: new Date(),
      notes: revisionNotes,
    });

    milestone.status = "Revision Requested";
    milestone.revisionRequestedAt = new Date();
    milestone.revisionNotes = revisionNotes;

    await project.save();

    res
      .status(200)
      .json({ success: true, message: "Revision request sent to worker" });
  } catch (error) {
    console.error("Error requesting milestone revision:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const reportMilestoneToAdmin = async (req, res) => {
  try {
    const { projectId, milestoneId } = req.params;
    const { projectType, reportReason } = req.body;

    if (!reportReason || !reportReason.trim()) {
      return res.status(400).json({ error: "Report reason is required" });
    }

    let project;
    if (projectType === "architect") {
      project = await ArchitectHiring.findById(projectId);
    } else if (projectType === "interior") {
      project = await DesignRequest.findById(projectId);
    }

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const milestone = project.milestones.id(milestoneId);
    if (!milestone) {
      return res.status(404).json({ error: "Milestone not found" });
    }

    milestone.status = "Under Review";
    milestone.reportedToAdminAt = new Date();
    milestone.adminReport = reportReason;

    await project.save();

    // TODO: Send notification to admin
    res.status(200).json({
      success: true,
      message: "Milestone reported to admin for review",
    });
  } catch (error) {
    console.error("Error reporting milestone to admin:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get Architect Hiring Project Details
const getArchitectHiringDetails = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!req.user || !req.user.user_id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const project = await ArchitectHiring.findOne({
      _id: projectId,
      customer: req.user.user_id,
    })
      .populate("worker", "name email phone specialization")
      .lean();

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json(project);
  } catch (error) {
    console.error("Error fetching architect hiring details:", error);
    res.status(500).json({ error: "Failed to fetch project details" });
  }
};

// Get Design Request Details
const getDesignRequestDetails = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!req.user || !req.user.user_id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const project = await DesignRequest.findOne({
      _id: projectId,
      customerId: req.user.user_id,
    })
      .populate("workerId", "name email phone specialization")
      .lean();

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json(project);
  } catch (error) {
    console.error("Error fetching design request details:", error);
    res.status(500).json({ error: "Failed to fetch project details" });
  }
};

const getEditableRequestDetails = async (req, res) => {
  try {
    const { type, projectId } = req.params;
    const customerId = req.user?.user_id;

    if (!customerId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    let project = null;
    let mappedRequest = null;

    if (type === "architect") {
      project = await ArchitectHiring.findOne({
        _id: projectId,
        customer: customerId,
      }).lean();

      if (!project) return res.status(404).json({ error: "Project not found" });

      const lockReason = getEditLockReason(type, project);
      if (lockReason) {
        return res.status(403).json({ error: lockReason, editable: false });
      }

      mappedRequest = {
        _id: project._id,
        workerId: project.worker ? String(project.worker) : "",
        projectName: project.projectName || "",
        designType: project.designRequirements?.designType || "",
        architecturalStyle:
          project.designRequirements?.architecturalStyle || "",
        fullName: project.customerDetails?.fullName || "",
        contactNumber: project.customerDetails?.contactNumber || "",
        email: project.customerDetails?.email || "",
        streetAddress: project.customerAddress?.streetAddress || "",
        city: project.customerAddress?.city || "",
        state: project.customerAddress?.state || "",
        zipCode: project.customerAddress?.zipCode || "",
        plotLocation: project.plotInformation?.plotLocation || "",
        plotSize: project.plotInformation?.plotSize || "",
        plotOrientation: project.plotInformation?.plotOrientation || "",
        numFloors: project.designRequirements?.numFloors || "",
        budget: project.additionalDetails?.budget || "",
        completionDate: project.additionalDetails?.completionDate
          ? new Date(project.additionalDetails.completionDate)
              .toISOString()
              .split("T")[0]
          : "",
        specialFeatures: project.designRequirements?.specialFeatures || "",
        floorRequirements: project.designRequirements?.floorRequirements || [],
      };
    } else if (type === "interior") {
      project = await DesignRequest.findOne({
        _id: projectId,
        customerId,
      }).lean();

      if (!project) return res.status(404).json({ error: "Project not found" });

      const lockReason = getEditLockReason(type, project);
      if (lockReason) {
        return res.status(403).json({ error: lockReason, editable: false });
      }

      mappedRequest = {
        _id: project._id,
        workerId: project.workerId ? String(project.workerId) : "",
        projectName: project.projectName || "",
        fullName: project.fullName || "",
        email: project.email || "",
        phone: project.phone || "",
        address: project.address || "",
        roomType: project.roomType || "",
        roomLength: project.roomSize?.length ?? "",
        roomWidth: project.roomSize?.width ?? "",
        dimensionUnit: project.roomSize?.unit || "feet",
        ceilingHeight: project.ceilingHeight?.height ?? "",
        heightUnit:
          project.ceilingHeight?.unit || project.roomSize?.unit || "feet",
        designPreference: project.designPreference || "",
        projectDescription: project.projectDescription || "",
        currentRoomImages: project.currentRoomImages || [],
        inspirationImages: project.inspirationImages || [],
        floorRequirements: project.floorRequirements || [
          { floorNumber: 1, details: "" },
        ],
      };
    } else if (type === "company") {
      project = await ConstructionProjectSchema.findOne({
        _id: projectId,
        customerId,
      }).lean();

      if (!project) return res.status(404).json({ error: "Project not found" });

      const lockReason = getEditLockReason(type, project);
      if (lockReason) {
        return res.status(403).json({ error: lockReason, editable: false });
      }

      mappedRequest = {
        _id: project._id,
        companyId: project.companyId ? String(project.companyId) : "",
        projectName: project.projectName || "",
        buildingType: project.buildingType || "",
        customerName: project.customerName || "",
        customerEmail: project.customerEmail || "",
        customerPhone: project.customerPhone || "",
        totalArea: project.totalArea ?? "",
        estimatedBudget: project.estimatedBudget ?? "",
        projectTimeline: project.projectTimeline ?? "",
        projectLocation: project.projectLocationPincode || "",
        projectAddress: project.projectAddress || "",
        totalFloors: project.totalFloors ?? "",
        accessibilityNeeds: project.accessibilityNeeds || "",
        energyEfficiency: project.energyEfficiency || "",
        specialRequirements: project.specialRequirements || "",
        floors: project.floors || [],
        siteFilepaths: project.siteFilepaths || [],
      };
    } else {
      return res.status(400).json({ error: "Invalid request type" });
    }

    return res.status(200).json({
      success: true,
      editable: true,
      request: mappedRequest,
    });
  } catch (error) {
    console.error("Error fetching editable request details:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch editable request details" });
  }
};

const updateEditableRequest = async (req, res) => {
  try {
    const { type, projectId } = req.params;
    const customerId = req.user?.user_id;

    if (!customerId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (type === "architect") {
      const project = await ArchitectHiring.findOne({
        _id: projectId,
        customer: customerId,
      });
      if (!project) return res.status(404).json({ error: "Project not found" });

      const lockReason = getEditLockReason(type, project);
      if (lockReason) return res.status(403).json({ error: lockReason });

      const floorRequirements = extractArchitectFloorRequirements(req.body);

      const newReferenceImages = (req.files || [])
        .filter((file) => file.fieldname === "referenceImages")
        .map((file) => ({
          url: file.path,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
        }));

      project.projectName = req.body.projectName || project.projectName;
      if (req.body.workerId !== undefined) {
        project.worker = req.body.workerId
          ? new mongoose.Types.ObjectId(req.body.workerId)
          : null;
      }

      project.customerDetails = {
        fullName: req.body.fullName || project.customerDetails?.fullName || "",
        contactNumber:
          req.body.contactNumber ||
          project.customerDetails?.contactNumber ||
          "",
        email: req.body.email || project.customerDetails?.email || "",
      };

      project.customerAddress = {
        streetAddress:
          req.body.streetAddress ||
          project.customerAddress?.streetAddress ||
          "",
        city: req.body.city || project.customerAddress?.city || "",
        state: req.body.state || project.customerAddress?.state || "",
        zipCode: req.body.zipCode || project.customerAddress?.zipCode || "",
      };

      project.plotInformation = {
        plotLocation:
          req.body.plotLocation || project.plotInformation?.plotLocation || "",
        plotSize: req.body.plotSize || project.plotInformation?.plotSize || "",
        plotOrientation:
          req.body.plotOrientation ||
          project.plotInformation?.plotOrientation ||
          "",
      };

      project.designRequirements = {
        designType:
          req.body.designType || project.designRequirements?.designType || "",
        numFloors:
          req.body.numFloors || project.designRequirements?.numFloors || "",
        floorRequirements:
          floorRequirements.length > 0
            ? floorRequirements
            : project.designRequirements?.floorRequirements || [],
        specialFeatures:
          req.body.specialFeatures ||
          project.designRequirements?.specialFeatures ||
          "",
        architecturalStyle:
          req.body.architecturalStyle ||
          project.designRequirements?.architecturalStyle ||
          "",
      };

      const existingReferenceImages =
        project.additionalDetails?.referenceImages || [];
      project.additionalDetails = {
        budget: req.body.budget || project.additionalDetails?.budget || "",
        completionDate: req.body.completionDate
          ? new Date(req.body.completionDate)
          : project.additionalDetails?.completionDate,
        referenceImages:
          newReferenceImages.length > 0
            ? [...existingReferenceImages, ...newReferenceImages]
            : existingReferenceImages,
      };

      await project.save();
      return res.status(200).json({
        success: true,
        message: "Architect request updated successfully",
      });
    }

    if (type === "interior") {
      const project = await DesignRequest.findOne({
        _id: projectId,
        customerId,
      });
      if (!project) return res.status(404).json({ error: "Project not found" });

      const lockReason = getEditLockReason(type, project);
      if (lockReason) return res.status(403).json({ error: lockReason });

      if (req.body.workerId !== undefined) {
        project.workerId = req.body.workerId
          ? new mongoose.Types.ObjectId(req.body.workerId)
          : null;
      }

      project.projectName = req.body.projectName || project.projectName;
      project.fullName = req.body.fullName || project.fullName;
      project.email = req.body.email || project.email;
      project.phone = req.body.phone || project.phone;
      project.address = req.body.address || project.address;
      project.roomType = req.body.roomType || project.roomType;
      project.roomSize = {
        length: req.body.roomLength
          ? parseFloat(req.body.roomLength)
          : project.roomSize?.length,
        width: req.body.roomWidth
          ? parseFloat(req.body.roomWidth)
          : project.roomSize?.width,
        unit: req.body.dimensionUnit || project.roomSize?.unit || "feet",
      };
      project.ceilingHeight = {
        height: req.body.ceilingHeight
          ? parseFloat(req.body.ceilingHeight)
          : project.ceilingHeight?.height,
        unit:
          req.body.heightUnit ||
          req.body.dimensionUnit ||
          project.ceilingHeight?.unit ||
          "feet",
      };
      project.designPreference =
        req.body.designPreference || project.designPreference;
      project.projectDescription =
        req.body.projectDescription || project.projectDescription;

      const existingCurrent = parseJsonIfString(
        req.body.existingCurrentRoomImages,
        project.currentRoomImages || [],
      );
      const existingInspiration = parseJsonIfString(
        req.body.existingInspirationImages,
        project.inspirationImages || [],
      );

      const uploadedCurrent = (req.files || [])
        .filter((file) => file.fieldname === "currentRoomImages")
        .map((file) => file.path);
      const uploadedInspiration = (req.files || [])
        .filter((file) => file.fieldname === "inspirationImages")
        .map((file) => file.path);

      project.currentRoomImages = [
        ...(Array.isArray(existingCurrent) ? existingCurrent : []),
        ...uploadedCurrent,
      ];
      project.inspirationImages = [
        ...(Array.isArray(existingInspiration) ? existingInspiration : []),
        ...uploadedInspiration,
      ];

      await project.save();
      return res.status(200).json({
        success: true,
        message: "Interior request updated successfully",
      });
    }

    if (type === "company") {
      const project = await ConstructionProjectSchema.findOne({
        _id: projectId,
        customerId,
      });
      if (!project) return res.status(404).json({ error: "Project not found" });

      const lockReason = getEditLockReason(type, project);
      if (lockReason) return res.status(403).json({ error: lockReason });

      project.projectName = req.body.projectName || project.projectName;
      project.buildingType = req.body.buildingType || project.buildingType;
      project.customerName = req.body.customerName || project.customerName;
      project.customerEmail = req.body.customerEmail || project.customerEmail;
      project.customerPhone = req.body.customerPhone || project.customerPhone;
      project.totalArea = req.body.totalArea
        ? Number(req.body.totalArea)
        : project.totalArea;
      project.estimatedBudget = req.body.estimatedBudget
        ? Number(req.body.estimatedBudget)
        : project.estimatedBudget;
      project.projectTimeline = req.body.projectTimeline
        ? Number(req.body.projectTimeline)
        : project.projectTimeline;
      project.projectLocationPincode =
        req.body.projectLocation || project.projectLocationPincode;
      project.projectAddress =
        req.body.projectAddress || project.projectAddress;
      project.totalFloors = req.body.totalFloors
        ? Number(req.body.totalFloors)
        : project.totalFloors;
      project.specialRequirements =
        req.body.specialRequirements || project.specialRequirements;
      project.accessibilityNeeds =
        req.body.accessibilityNeeds || project.accessibilityNeeds;
      project.energyEfficiency =
        req.body.energyEfficiency || project.energyEfficiency;

      if (req.body.companyId !== undefined) {
        project.companyId = req.body.companyId
          ? new mongoose.Types.ObjectId(req.body.companyId)
          : project.companyId;
      }

      const totalFloors = Number(
        req.body.totalFloors || project.totalFloors || 0,
      );
      const floors = [];
      for (let i = 1; i <= totalFloors; i++) {
        const floorImageFile = (req.files || []).find(
          (file) => file.fieldname === `floorImage-${i}`,
        );
        floors.push({
          floorNumber: i,
          floorType: req.body[`floorType-${i}`] || "",
          floorArea: req.body[`floorArea-${i}`]
            ? Number(req.body[`floorArea-${i}`])
            : 0,
          floorDescription: req.body[`floorDescription-${i}`] || "",
          floorImagePath:
            (floorImageFile && floorImageFile.path) ||
            req.body[`existingFloorImage-${i}`] ||
            "",
        });
      }
      if (floors.length > 0) {
        project.floors = floors;
      }

      const uploadedSiteFiles = (req.files || [])
        .filter((file) => file.fieldname === "siteFiles")
        .map((file) => file.path);
      if (uploadedSiteFiles.length > 0) {
        project.siteFilepaths = uploadedSiteFiles;
      }

      await project.save();
      return res.status(200).json({
        success: true,
        message: "Construction request updated successfully",
      });
    }

    return res.status(400).json({ error: "Invalid request type" });
  } catch (error) {
    console.error("Error updating editable request:", error);
    return res.status(500).json({ error: "Failed to update request" });
  }
};

// Get Payment History for Customer
const getPaymentHistory = async (req, res) => {
  try {
    if (!req.user || !req.user.user_id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const customerId = req.user.user_id;
    const { Transaction } = require("../models/index");
    const customerPaymentTypes = [
      "escrow_hold",
      "milestone_release",
      "platform_fee_collection",
      "subscription_fee",
      "refund",
    ];

    const normalizeHiredType = (projectType) => {
      const normalized = (projectType || "").toLowerCase();
      if (normalized === "architect") return "architect";
      if (normalized === "interior") return "interior";
      if (normalized === "construction" || normalized === "company") {
        return "company";
      }
      return "other";
    };

    const getHiredTypeLabel = (hiredType) => {
      if (hiredType === "architect") return "Architect";
      if (hiredType === "interior") return "Interior Designer";
      if (hiredType === "company") return "Company";
      return "Other";
    };

    const getPaymentPurpose = (transaction) => {
      const transactionType = transaction.transactionType;
      const description = transaction.description || "";
      const milestoneValue =
        transaction.milestonePercentage ||
        transaction.metadata?.percentage ||
        transaction.metadata?.milestone;

      if (transactionType === "escrow_hold") {
        if (
          transaction.metadata?.type === "deposit" ||
          /initial deposit/i.test(description)
        ) {
          return "Initial Deposit";
        }

        if (milestoneValue) {
          return `${milestoneValue}% Milestone Payment`;
        }

        return "Project Payment";
      }

      if (transactionType === "platform_fee_collection") {
        return "Platform Fee Payment";
      }

      if (transactionType === "milestone_release") {
        if (milestoneValue) {
          return `${milestoneValue}% Stage Payment`;
        }
        return "Stage Payment";
      }

      if (transactionType === "subscription_fee") {
        return "Subscription Payment";
      }

      if (transactionType === "refund") {
        return "Refund Received";
      }

      return description || "Payment";
    };

    // Get all customer-paid transactions for this customer
    const transactions = await Transaction.find({
      customerId: customerId,
      transactionType: { $in: customerPaymentTypes },
      status: { $in: ["completed", "refunded"] },
    })
      .populate("workerId", "name email")
      .populate("companyId", "companyName contactPerson email")
      .sort({ createdAt: -1 })
      .lean();

    const architectProjectIds = [];
    const interiorProjectIds = [];
    const companyProjectIds = [];

    transactions.forEach((transaction) => {
      if (!transaction.projectId) return;
      const normalizedType = normalizeHiredType(transaction.projectType);
      const projectId = String(transaction.projectId);

      if (normalizedType === "architect") architectProjectIds.push(projectId);
      if (normalizedType === "interior") interiorProjectIds.push(projectId);
      if (normalizedType === "company") companyProjectIds.push(projectId);
    });

    const [architectProjects, interiorProjects, companyProjects] =
      await Promise.all([
        architectProjectIds.length
          ? ArchitectHiring.find({
              _id: { $in: architectProjectIds },
              customer: customerId,
            })
              .select("projectName worker")
              .populate("worker", "name email")
              .lean()
          : [],
        interiorProjectIds.length
          ? DesignRequest.find({
              _id: { $in: interiorProjectIds },
              customerId: customerId,
            })
              .select("projectName workerId")
              .populate("workerId", "name email")
              .lean()
          : [],
        companyProjectIds.length
          ? ConstructionProjectSchema.find({
              _id: { $in: companyProjectIds },
              customerId: customerId,
            })
              .select("projectName companyId")
              .populate("companyId", "companyName contactPerson email")
              .lean()
          : [],
      ]);

    const architectProjectMap = new Map(
      architectProjects.map((project) => [String(project._id), project]),
    );
    const interiorProjectMap = new Map(
      interiorProjects.map((project) => [String(project._id), project]),
    );
    const companyProjectMap = new Map(
      companyProjects.map((project) => [String(project._id), project]),
    );

    const enrichedTransactions = transactions.map((transaction) => {
      const hiredType = normalizeHiredType(transaction.projectType);
      const projectId = transaction.projectId
        ? String(transaction.projectId)
        : null;

      let projectName = "Project";
      let providerName = null;

      if (hiredType === "architect" && projectId) {
        const project = architectProjectMap.get(projectId);
        if (project) {
          projectName = project.projectName || projectName;
          providerName = project.worker?.name || null;
        }
      }

      if (hiredType === "interior" && projectId) {
        const project = interiorProjectMap.get(projectId);
        if (project) {
          projectName = project.projectName || projectName;
          providerName = project.workerId?.name || null;
        }
      }

      if (hiredType === "company" && projectId) {
        const project = companyProjectMap.get(projectId);
        if (project) {
          projectName = project.projectName || projectName;
          providerName =
            project.companyId?.companyName ||
            project.companyId?.contactPerson ||
            null;
        }
      }

      if (!providerName) {
        providerName =
          transaction.workerId?.name ||
          transaction.companyId?.companyName ||
          transaction.companyId?.contactPerson ||
          null;
      }

      return {
        ...transaction,
        hiredType,
        hiredTypeLabel: getHiredTypeLabel(hiredType),
        projectName,
        providerName,
        paymentPurpose: getPaymentPurpose(transaction),
      };
    });

    // Calculate stats
    const totalPaid = enrichedTransactions
      .filter((t) => t.transactionType !== "refund")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalRefunded = enrichedTransactions
      .filter((t) => t.transactionType === "refund")
      .reduce((sum, t) => sum + t.amount, 0);

    // Get unique projects
    const uniqueProjects = [
      ...new Set(
        enrichedTransactions
          .map((t) => (t.projectId ? String(t.projectId) : null))
          .filter(Boolean),
      ),
    ];
    const totalProjects = uniqueProjects.length;

    // Get pending payments (projects with Accepted status but not all milestones paid)
    const pendingArchitectProjects = await ArchitectHiring.find({
      customer: customerId,
      status: "Accepted",
    }).lean();

    const pendingInteriorProjects = await DesignRequest.find({
      customerId: customerId,
      status: "accepted",
    }).lean();

    let pendingPayments = 0;

    [...pendingArchitectProjects, ...pendingInteriorProjects].forEach(
      (project) => {
        if (
          project.paymentDetails &&
          project.paymentDetails.milestonePayments
        ) {
          const unpaidMilestones =
            project.paymentDetails.milestonePayments.filter(
              (mp) => !mp.paymentCollected && mp.status === "pending",
            );
          pendingPayments += unpaidMilestones.reduce(
            (sum, mp) => sum + mp.amount,
            0,
          );
        }
      },
    );

    res.json({
      success: true,
      transactions: enrichedTransactions,
      stats: {
        totalPaid: totalPaid,
        totalRefunded,
        netPaid: totalPaid - totalRefunded,
        totalProjects: totalProjects,
        pendingPayments: pendingPayments,
      },
    });
  } catch (error) {
    console.error("Error fetching payment history:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch payment history",
    });
  }
};

module.exports = {
  submitBidForm,
  getDashboard,
  getJobRequestStatus,
  getConstructionCompaniesList,
  getArchitects,
  getArchitectForm,
  getOngoingProjects,
  getDesignIdeas,
  getInteriorDesignForm,
  getInteriorDesigners,
  getConstructionForm,
  getBidForm,
  getSettings,
  getBidSpace,
  postConstructionForm,
  acceptProposal,
  acceptCompanyBid,
  acceptCompanyProposal,
  acceptConstructionProposal,
  rejectCompanyProposal,
  rejectProposal,
  updateCustomerSettings,
  updatePassword,
  approveMilestone,
  rejectMilestone,
  requestMilestoneRevision,
  reportMilestoneToAdmin,
  getEditableRequestDetails,
  updateEditableRequest,
  getArchitectHiringDetails,
  getDesignRequestDetails,
  getPaymentHistory,
};
