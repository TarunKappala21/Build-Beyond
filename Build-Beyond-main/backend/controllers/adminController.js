const verifyCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { status: "verified" },
      { new: true },
    );
    if (!company)
      return res
        .status(404)
        .json({ success: false, error: "Company not found" });
    res.json({
      success: true,
      message: "Company verified successfully",
      company,
    });
  } catch (error) {
    console.error("Error verifying company:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const rejectCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true },
    );
    if (!company)
      return res
        .status(404)
        .json({ success: false, error: "Company not found" });
    res.json({ success: true, message: "Company rejected", company });
  } catch (error) {
    console.error("Error rejecting company:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const verifyWorker = async (req, res) => {
  try {
    const worker = await Worker.findByIdAndUpdate(
      req.params.id,
      { status: "verified" },
      { new: true },
    );
    if (!worker)
      return res
        .status(404)
        .json({ success: false, error: "Worker not found" });
    res.json({
      success: true,
      message: "Worker verified successfully",
      worker,
    });
  } catch (error) {
    console.error("Error verifying worker:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const rejectWorker = async (req, res) => {
  try {
    const worker = await Worker.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true },
    );
    if (!worker)
      return res
        .status(404)
        .json({ success: false, error: "Worker not found" });
    res.json({ success: true, message: "Worker rejected", worker });
  } catch (error) {
    console.error("Error rejecting worker:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
const {
  Customer,
  Company,
  Worker,
  ArchitectHiring,
  ConstructionProjectSchema,
  DesignRequest,
  Bid,
  WorkerToCompany,
  CompanytoWorker,
  Transaction,
} = require("../models");
const {
  buildCacheKey,
  getCacheJson,
  setCacheJson,
  logRedisEndpointCache,
  getRedisCacheStats,
  resetRedisCacheStats,
} = require("../utils/redisCache");

const getAdminDashboard = async (req, res) => {
  try {
    const [
      customers,
      companies,
      workers,
      architectHirings,
      constructionProjects,
      designRequests,
      bids,
      jobApplications,
    ] = await Promise.all([
      Customer.find({}).sort({ createdAt: -1 }).lean(),
      Company.find({}).sort({ createdAt: -1 }).lean(),
      Worker.find({}).sort({ createdAt: -1 }).lean(),
      ArchitectHiring.find({})
        .populate("customer", "name email")
        .populate("worker", "name email")
        .sort({ createdAt: -1 })
        .lean(),
      ConstructionProjectSchema.find({})
        .populate("customerId", "name email")
        .populate("companyId", "companyName")
        .sort({ createdAt: -1 })
        .lean(),
      DesignRequest.find({})
        .populate("customerId", "name email")
        .populate("workerId", "name email")
        .sort({ createdAt: -1 })
        .lean(),
      Bid.find({})
        .populate("customerId", "name email")
        .sort({ createdAt: -1 })
        .lean(),
      WorkerToCompany.find({})
        .populate("workerId", "name email")
        .populate("companyId", "companyName")
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const customersCount = customers.length;
    const companiesCount = companies.length;
    const workersCount = workers.length;

    const activeProjects = constructionProjects.filter(
      (p) => p.status === "accepted",
    ).length;
    const pendingArchitectHirings = architectHirings.filter(
      (h) => h.status === "Pending",
    ).length;
    const pendingDesignRequests = designRequests.filter(
      (d) => d.status === "pending",
    ).length;
    const pendingRequests = pendingArchitectHirings + pendingDesignRequests;
    const openBids = bids.filter((b) => b.status === "open").length;

    // Calculate revenue from Architect Hirings
    let architectHiringRevenue = {
      totalProjects: architectHirings.length,
      totalRevenue: 0,
      platformCommission: 0,
      workerPayout: 0,
      activeProjects: 0,
      completedProjects: 0,
    };

    architectHirings.forEach((hiring) => {
      if (hiring.paymentDetails && hiring.paymentDetails.totalAmount) {
        architectHiringRevenue.totalRevenue +=
          hiring.paymentDetails.totalAmount || 0;
        architectHiringRevenue.platformCommission +=
          hiring.paymentDetails.platformCommission || 0;
        architectHiringRevenue.workerPayout +=
          hiring.paymentDetails.workerAmount || 0;

        if (hiring.status === "accepted" || hiring.status === "In-Progress") {
          architectHiringRevenue.activeProjects++;
        } else if (hiring.status === "Completed") {
          architectHiringRevenue.completedProjects++;
        }
      }
    });

    // Calculate revenue from Design Requests
    let designRequestRevenue = {
      totalProjects: designRequests.length,
      totalRevenue: 0,
      platformCommission: 0,
      workerPayout: 0,
      activeProjects: 0,
      completedProjects: 0,
    };

    designRequests.forEach((request) => {
      if (request.paymentDetails && request.paymentDetails.totalAmount) {
        designRequestRevenue.totalRevenue +=
          request.paymentDetails.totalAmount || 0;
        designRequestRevenue.platformCommission +=
          request.paymentDetails.platformCommission || 0;
        designRequestRevenue.workerPayout +=
          request.paymentDetails.workerAmount || 0;

        if (request.status === "accepted" || request.status === "In-Progress") {
          designRequestRevenue.activeProjects++;
        } else if (request.status === "Completed") {
          designRequestRevenue.completedProjects++;
        }
      }
    });

    // Combined revenue metrics
    const totalPlatformRevenue =
      architectHiringRevenue.platformCommission +
      designRequestRevenue.platformCommission;
    const totalProjectRevenue =
      architectHiringRevenue.totalRevenue + designRequestRevenue.totalRevenue;

    res.status(200).json({
      counts: {
        customers: customersCount,
        companies: companiesCount,
        workers: workersCount,
      },
      stats: {
        activeProjects,
        pendingRequests,
        openBids,
      },
      revenue: {
        architectHiring: architectHiringRevenue,
        designRequest: designRequestRevenue,
        combined: {
          totalPlatformCommission: totalPlatformRevenue,
          totalProjectRevenue: totalProjectRevenue,
          totalProjects:
            architectHiringRevenue.totalProjects +
            designRequestRevenue.totalProjects,
        },
      },
      data: {
        customers,
        companies,
        workers,
        architectHirings,
        constructionProjects,
        designRequests,
        bids,
        jobApplications,
      },
    });
  } catch (err) {
    console.error("Error fetching admin dashboard data:", err);
    res.status(500).send("Server Error");
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) {
      return res
        .status(404)
        .json({ success: false, error: "Customer not found" });
    }
    res.json({ success: true, message: "Customer deleted successfully" });
  } catch (error) {
    console.error("Error deleting customer:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);
    if (!company) {
      return res
        .status(404)
        .json({ success: false, error: "Company not found" });
    }
    res.json({ success: true, message: "Company deleted successfully" });
  } catch (error) {
    console.error("Error deleting company:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteWorker = async (req, res) => {
  try {
    const worker = await Worker.findByIdAndDelete(req.params.id);
    if (!worker) {
      return res
        .status(404)
        .json({ success: false, error: "Worker not found" });
    }
    res.json({ success: true, message: "Worker deleted successfully" });
  } catch (error) {
    console.error("Error deleting worker:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteArchitectHiring = async (req, res) => {
  try {
    const hiring = await ArchitectHiring.findByIdAndDelete(req.params.id);
    if (!hiring) {
      return res
        .status(404)
        .json({ success: false, error: "Architect hiring not found" });
    }
    res.json({
      success: true,
      message: "Architect hiring deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting architect hiring:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteConstructionProject = async (req, res) => {
  try {
    const project = await ConstructionProjectSchema.findByIdAndDelete(
      req.params.id,
    );
    if (!project) {
      return res
        .status(404)
        .json({ success: false, error: "Construction project not found" });
    }
    res.json({
      success: true,
      message: "Construction project deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting construction project:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteDesignRequest = async (req, res) => {
  try {
    const request = await DesignRequest.findByIdAndDelete(req.params.id);
    if (!request) {
      return res
        .status(404)
        .json({ success: false, error: "Design request not found" });
    }
    res.json({ success: true, message: "Design request deleted successfully" });
  } catch (error) {
    console.error("Error deleting design request:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteBid = async (req, res) => {
  try {
    const bid = await Bid.findByIdAndDelete(req.params.id);
    if (!bid) {
      return res.status(404).json({ success: false, error: "Bid not found" });
    }
    res.json({ success: true, message: "Bid deleted successfully" });
  } catch (error) {
    console.error("Error deleting bid:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteJobApplication = async (req, res) => {
  try {
    const application = await WorkerToCompany.findByIdAndDelete(req.params.id);
    if (!application) {
      return res
        .status(404)
        .json({ success: false, error: "Job application not found" });
    }
    res.json({
      success: true,
      message: "Job application deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting job application:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getCustomerDetail = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).lean();
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const [constructionProjects, architectHirings, designRequests, bids] =
      await Promise.all([
        ConstructionProjectSchema.find({ customerId: req.params.id })
          .populate("companyId", "companyName email contactPerson")
          .sort({ createdAt: -1 })
          .lean(),
        ArchitectHiring.find({ customer: req.params.id })
          .populate("worker", "name email specialization")
          .sort({ createdAt: -1 })
          .lean(),
        DesignRequest.find({ customerId: req.params.id })
          .populate("workerId", "name email specialization")
          .sort({ createdAt: -1 })
          .lean(),
        Bid.find({ customerId: req.params.id })
          .populate("companyBids.companyId", "companyName email")
          .sort({ createdAt: -1 })
          .lean(),
      ]);

    res.json({
      customer,
      relatedData: {
        constructionProjects,
        architectHirings,
        designRequests,
        bids,
        totalProjects:
          constructionProjects.length +
          architectHirings.length +
          designRequests.length,
        activeBids: bids.filter((b) => b.status === "open").length,
      },
    });
  } catch (error) {
    console.error("Error fetching customer:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

const normalizeStatus = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]/g, " ");

const getArchitectProgress = (hiring) => {
  if (normalizeStatus(hiring?.status) === "completed") return 100;
  const milestones = Array.isArray(hiring?.milestones) ? hiring.milestones : [];
  if (!milestones.length) {
    return normalizeStatus(hiring?.status) === "accepted" ? 50 : 0;
  }
  const approved = milestones.filter(
    (item) => normalizeStatus(item?.status) === "approved",
  ).length;
  return Math.round((approved / milestones.length) * 100);
};

const getInteriorProgress = (request) => {
  if (normalizeStatus(request?.status) === "completed") return 100;
  const milestones = Array.isArray(request?.milestones)
    ? request.milestones
    : [];
  if (!milestones.length) {
    return normalizeStatus(request?.status) === "accepted" ? 50 : 0;
  }
  const approved = milestones.filter(
    (item) => normalizeStatus(item?.status) === "approved",
  ).length;
  return Math.round((approved / milestones.length) * 100);
};

const getCustomerFullDetail = async (req, res) => {
  try {
    const customerId = req.params.customerId;
    const [
      customer,
      constructionProjects,
      architectHirings,
      designRequests,
      bids,
    ] = await Promise.all([
      Customer.findById(customerId).lean(),
      ConstructionProjectSchema.find({ customerId })
        .populate("companyId", "companyName email contactPerson")
        .sort({ createdAt: -1 })
        .lean(),
      ArchitectHiring.find({ customer: customerId })
        .populate("worker", "name email specialization profileImage")
        .sort({ createdAt: -1 })
        .lean(),
      DesignRequest.find({ customerId })
        .populate("workerId", "name email specialization profileImage")
        .sort({ createdAt: -1 })
        .lean(),
      Bid.find({ customerId })
        .populate("companyBids.companyId", "companyName")
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    if (!customer) {
      return res
        .status(404)
        .json({ success: false, error: "Customer not found" });
    }

    const customerReviews = Array.isArray(customer.reviews)
      ? customer.reviews
      : [];

    const reviewByProjectId = new Map();
    const reviewByWorkerId = new Map();
    customerReviews.forEach((review) => {
      const projectKey = review?.projectId ? String(review.projectId) : null;
      const workerKey = review?.workerId ? String(review.workerId) : null;
      if (projectKey && !reviewByProjectId.has(projectKey)) {
        reviewByProjectId.set(projectKey, review);
      }
      if (workerKey && !reviewByWorkerId.has(workerKey)) {
        reviewByWorkerId.set(workerKey, review);
      }
    });

    const fromConstruction = constructionProjects.map((project) => ({
      _id: project._id,
      type: "construction",
      typeLabel: "Construction",
      projectName: project.projectName || "Construction Project",
      partnerType: "company",
      partnerName: project.companyId?.companyName || "Not Assigned",
      partnerId: project.companyId?._id || null,
      status: project.status || "pending",
      amount:
        project.paymentDetails?.totalAmount ||
        project.proposal?.price ||
        project.estimatedBudget ||
        0,
      createdAt: project.createdAt,
      startDate: project.createdAt,
      expectedCompletion: project.targetCompletionDate || null,
      progress: Number(project.completionPercentage || 0),
      completionDate: project.customerReview?.reviewDate || null,
      rating: project.customerReview?.rating || null,
      reviewComment: project.customerReview?.reviewText || "",
      routePath: `/construction-project/${project._id}`,
    }));

    const fromArchitect = architectHirings.map((hiring) => {
      const inlineReview = hiring.review?.customerToWorker || {};
      const fallbackReview =
        reviewByProjectId.get(String(hiring._id || "")) ||
        reviewByWorkerId.get(String(hiring.worker?._id || ""));

      return {
        _id: hiring._id,
        type: "architect",
        typeLabel: "Architect Hiring",
        projectName: hiring.projectName || "Architecture Project",
        partnerType: "worker",
        partnerName: hiring.worker?.name || "Not Assigned",
        partnerId: hiring.worker?._id || null,
        status: hiring.status || "Pending",
        amount:
          hiring.finalAmount ||
          hiring.paymentDetails?.totalAmount ||
          hiring.proposal?.price ||
          0,
        createdAt: hiring.createdAt,
        startDate: hiring.createdAt,
        expectedCompletion: hiring.additionalDetails?.completionDate || null,
        progress: getArchitectProgress(hiring),
        completionDate:
          inlineReview.submittedAt || fallbackReview?.reviewedAt || null,
        rating: inlineReview.rating || fallbackReview?.rating || null,
        reviewComment: inlineReview.comment || fallbackReview?.comment || "",
        avatar: hiring.worker?.profileImage || "",
        routePath: `/architect-hiring/${hiring._id}`,
      };
    });

    const fromInterior = designRequests.map((request) => {
      const inlineReview = request.review?.customerToWorker || {};
      const fallbackReview =
        reviewByProjectId.get(String(request._id || "")) ||
        reviewByWorkerId.get(String(request.workerId?._id || ""));

      return {
        _id: request._id,
        type: "interior",
        typeLabel: "Interior Design",
        projectName:
          request.projectName || `${request.roomType || "Interior"} Design`,
        partnerType: "worker",
        partnerName: request.workerId?.name || "Not Assigned",
        partnerId: request.workerId?._id || null,
        status: request.status || "pending",
        amount:
          request.finalAmount ||
          request.paymentDetails?.totalAmount ||
          request.proposal?.price ||
          0,
        createdAt: request.createdAt,
        startDate: request.createdAt,
        expectedCompletion: null,
        progress: getInteriorProgress(request),
        completionDate:
          inlineReview.submittedAt || fallbackReview?.reviewedAt || null,
        rating: inlineReview.rating || fallbackReview?.rating || null,
        reviewComment: inlineReview.comment || fallbackReview?.comment || "",
        avatar: request.workerId?.profileImage || "",
        routePath: `/design-request/${request._id}`,
      };
    });

    const bidsPlaced = bids.map((bid) => {
      const winningBid =
        bid.companyBids?.find(
          (companyBid) =>
            String(companyBid._id || "") === String(bid.winningBidId || "") ||
            normalizeStatus(companyBid.status) === "accepted",
        ) || null;

      return {
        _id: bid._id,
        projectName: bid.projectName || "Bid",
        location: bid.projectLocation || "—",
        totalArea: bid.totalArea || 0,
        estimatedBudget: bid.estimatedBudget || 0,
        bidsReceived: Array.isArray(bid.companyBids)
          ? bid.companyBids.length
          : 0,
        status: bid.status || "open",
        createdAt: bid.createdAt,
        winningBid: winningBid
          ? {
              companyName:
                winningBid.companyName ||
                winningBid.companyId?.companyName ||
                "—",
              amount: winningBid.bidPrice || 0,
            }
          : null,
        routePath: `/bid/${bid._id}`,
      };
    });

    const unifiedProjects = [
      ...fromConstruction,
      ...fromArchitect,
      ...fromInterior,
    ];

    const ongoingProjects = unifiedProjects.filter((project) => {
      const status = normalizeStatus(project.status);
      return ![
        "accepted",
        "completed",
        "rejected",
        "cancelled",
        "closed",
        "awarded",
      ].includes(status);
    });

    const completedProjects = unifiedProjects.filter((project) => {
      const status = normalizeStatus(project.status);
      return ["accepted", "completed"].includes(status);
    });

    const hiredProfessionals = {
      architects: fromArchitect
        .filter((project) => project.partnerId)
        .map((project) => ({
          professionalId: project.partnerId,
          professionalName: project.partnerName,
          avatar: project.avatar || "",
          specialization: "Architect",
          projectName: project.projectName,
          fixedAmount: project.amount,
          status: project.status,
          hiredOn: project.createdAt,
          ratingGiven: project.rating,
          routePath: project.routePath,
        })),
      interiorDesigners: fromInterior
        .filter((project) => project.partnerId)
        .map((project) => ({
          professionalId: project.partnerId,
          professionalName: project.partnerName,
          avatar: project.avatar || "",
          specialization: "Interior Designer",
          projectName: project.projectName,
          fixedAmount: project.amount,
          status: project.status,
          hiredOn: project.createdAt,
          ratingGiven: project.rating,
          routePath: project.routePath,
        })),
    };

    const reviewMap = new Map();
    customerReviews.forEach((review, index) => {
      const key = `${review.projectId || review.projectName || "review"}-${index}`;
      reviewMap.set(key, {
        projectName: review.projectName || "Project",
        partnerName: review.workerName || "Professional",
        rating: review.rating || 0,
        comment: review.comment || "",
        reviewedOn: review.reviewedAt || null,
      });
    });

    unifiedProjects.forEach((project, index) => {
      if (project.rating || project.reviewComment) {
        const key = `${project._id}-${index}`;
        reviewMap.set(key, {
          projectName: project.projectName,
          partnerName: project.partnerName,
          rating: project.rating || 0,
          comment: project.reviewComment || "",
          reviewedOn: project.completionDate || project.createdAt,
        });
      }
    });

    const reviewsGiven = Array.from(reviewMap.values()).sort(
      (a, b) => new Date(b.reviewedOn || 0) - new Date(a.reviewedOn || 0),
    );

    const paymentHistory = [
      ...constructionProjects.map((project) => ({
        date: project.updatedAt || project.createdAt,
        project: project.projectName || "Construction Project",
        amountPaid:
          project.paymentDetails?.totalAmount || project.proposal?.price || 0,
        platformCommission: project.paymentDetails?.platformFee || 0,
        status: project.paymentDetails?.paymentStatus || "unpaid",
        paymentMethod: project.paymentDetails?.stripeSessionId ? "Stripe" : "—",
        routePath: `/construction-project/${project._id}`,
      })),
      ...architectHirings.map((hiring) => ({
        date:
          hiring.paymentDetails?.paymentInitiatedAt ||
          hiring.updatedAt ||
          hiring.createdAt,
        project: hiring.projectName || "Architecture Project",
        amountPaid:
          hiring.paymentDetails?.totalAmount || hiring.finalAmount || 0,
        platformCommission: hiring.paymentDetails?.platformCommission || 0,
        status: hiring.paymentDetails?.escrowStatus || "not_initiated",
        paymentMethod: hiring.paymentDetails?.stripeSessionId ? "Stripe" : "—",
        routePath: `/architect-hiring/${hiring._id}`,
      })),
      ...designRequests.map((request) => ({
        date:
          request.paymentDetails?.paymentInitiatedAt ||
          request.updatedAt ||
          request.createdAt,
        project:
          request.projectName || `${request.roomType || "Interior"} Design`,
        amountPaid:
          request.paymentDetails?.totalAmount || request.finalAmount || 0,
        platformCommission: request.paymentDetails?.platformCommission || 0,
        status: request.paymentDetails?.escrowStatus || "not_initiated",
        paymentMethod: request.paymentDetails?.stripeSessionId ? "Stripe" : "—",
        routePath: `/design-request/${request._id}`,
      })),
      ...bids.map((bid) => ({
        date: bid.updatedAt || bid.createdAt,
        project: bid.projectName || "Bid",
        amountPaid: bid.paymentDetails?.totalAmount || 0,
        platformCommission: bid.paymentDetails?.platformFee || 0,
        status: bid.paymentDetails?.paymentStatus || "unpaid",
        paymentMethod: bid.paymentDetails?.stripeSessionId ? "Stripe" : "—",
        routePath: `/bid/${bid._id}`,
      })),
    ]
      .filter((payment) => Number(payment.amountPaid || 0) > 0)
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    res.json({
      success: true,
      customer,
      summary: {
        totalProjects: unifiedProjects.length + bids.length,
        projectsOnly: unifiedProjects.length,
        bidsOnly: bids.length,
        memberSince: customer.createdAt,
      },
      ongoingProjects,
      completedProjects,
      hiredProfessionals,
      bidsPlaced,
      reviewsGiven,
      paymentHistory,
      timestamps: {
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching full customer detail:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

const getCompanyDetail = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    // Fetch all related projects and connections
    const constructionProjects = await ConstructionProjectSchema.find({
      companyId: req.params.id,
    })
      .populate("customerId", "name email phone")
      .sort({ createdAt: -1 });

    const jobApplications = await WorkerToCompany.find({
      companyId: req.params.id,
    })
      .populate("workerId", "name email phone specialization")
      .sort({ createdAt: -1 });

    // Get bids where this company has submitted proposals
    const bidsWithCompany = await Bid.find({
      "companyBids.companyId": req.params.id,
    })
      .populate("customerId", "name email phone")
      .sort({ createdAt: -1 });

    res.json({
      company,
      relatedData: {
        constructionProjects,
        jobApplications,
        bids: bidsWithCompany,
        ongoingProjects: constructionProjects.filter(
          (p) => p.status === "accepted" || p.status === "ongoing",
        ).length,
        completedProjects: constructionProjects.filter(
          (p) => p.status === "completed",
        ).length,
        totalApplications: jobApplications.length,
        acceptedApplications: jobApplications.filter(
          (app) => app.status === "accepted",
        ).length,
      },
    });
  } catch (error) {
    console.error("Error fetching company:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

const getCompanyFullDetail = async (req, res) => {
  try {
    const companyId = req.params.companyId;
    const [company, constructionProjects, bids, jobPostings, jobApplications] =
      await Promise.all([
        Company.findById(companyId).lean(),
        ConstructionProjectSchema.find({ companyId })
          .select(
            "projectName customerId customerName status proposal.price paymentDetails.totalAmount paymentDetails.platformFee paymentDetails.payouts completionPercentage currentPhase createdAt targetCompletionDate specialRequirements mainImagePath completionImages projectAddress updatedAt customerReview",
          )
          .populate("customerId", "name email phone")
          .sort({ createdAt: -1 })
          .lean(),
        Bid.find({ "companyBids.companyId": companyId })
          .select(
            "projectName customerId customerName companyBids winningBidId status totalArea createdAt updatedAt paymentDetails.platformFee paymentDetails.payouts",
          )
          .populate("customerId", "name email phone")
          .sort({ createdAt: -1 })
          .lean(),
        CompanytoWorker.find({ company: companyId })
          .select("position location salary status worker createdAt")
          .populate(
            "worker",
            "name email phone specialization experience status",
          )
          .sort({ _id: -1 })
          .lean(),
        WorkerToCompany.find({ companyId })
          .select(
            "fullName workerId positionApplying experience expectedSalary status createdAt",
          )
          .populate("workerId", "name email phone specialization experience")
          .sort({ createdAt: -1 })
          .lean(),
      ]);

    if (!company) {
      return res
        .status(404)
        .json({ success: false, error: "Company not found" });
    }

    const activeConstructionProjects = constructionProjects
      .filter((project) => {
        const status = normalizeStatus(project.status);
        return !["completed", "closed", "rejected", "cancelled"].includes(
          status,
        );
      })
      .map((project) => ({
        _id: project._id,
        type: "construction",
        projectName: project.projectName || "Construction Project",
        customerName:
          project.customerId?.name || project.customerName || "Unknown",
        status: project.status || "pending",
        amount:
          project.proposal?.price || project.paymentDetails?.totalAmount || 0,
        progress: project.completionPercentage || 0,
        currentPhase: project.currentPhase || "—",
        startDate: project.createdAt,
        targetCompletionDate: project.targetCompletionDate || null,
        routePath: `/construction-project/${project._id}`,
      }));

    const bidsWithCompany = bids.map((bid) => {
      const companyBid = (bid.companyBids || []).find(
        (entry) => String(entry.companyId) === String(companyId),
      );

      const isWinning =
        companyBid &&
        bid.winningBidId &&
        String(companyBid._id) === String(bid.winningBidId);

      return {
        _id: bid._id,
        projectName: bid.projectName || "Bid",
        customerName: bid.customerId?.name || bid.customerName || "Unknown",
        bidAmount: companyBid?.bidPrice || 0,
        winningBidDate: companyBid?.bidDate || bid.updatedAt || bid.createdAt,
        status: bid.status || "open",
        totalArea: bid.totalArea || 0,
        isWinning,
        routePath: `/bid/${bid._id}`,
      };
    });

    const wonBidsWithCompany = bidsWithCompany.filter((bid) => bid.isWinning);

    const activeBidProjects = wonBidsWithCompany.map((bid) => ({
      _id: bid._id,
      type: "bid_awarded",
      projectName: bid.projectName,
      customerName: bid.customerName,
      status: bid.status,
      amount: bid.bidAmount,
      progress: 100,
      currentPhase: "Awarded",
      startDate: bid.winningBidDate,
      targetCompletionDate: null,
      routePath: bid.routePath,
    }));

    const ongoingProjects = [
      ...activeConstructionProjects,
      ...activeBidProjects,
    ];

    const completedShowcase = [
      ...(company.completedProjects || []).map((item, index) => ({
        _id: `${company._id}-showcase-${index}`,
        title: item.title || `Completed Project ${index + 1}`,
        description: item.description || "—",
        beforeImage: item.beforeImage || "",
        afterImage: item.afterImage || "",
        location: item.location || "—",
        completionYear:
          item.completionYear ||
          (item.updatedAt ? new Date(item.updatedAt).getFullYear() : null),
        materialCertificate: item.materialCertificate || "",
        gpsLink: item.gpsLink || "",
      })),
      ...constructionProjects
        .filter((project) => normalizeStatus(project.status) === "completed")
        .map((project) => ({
          _id: project._id,
          title: project.projectName || "Construction Project",
          description: project.specialRequirements || "Completed construction",
          beforeImage: project.mainImagePath || "",
          afterImage:
            Array.isArray(project.completionImages) &&
            project.completionImages.length
              ? project.completionImages[0]
              : "",
          location: project.projectAddress || "—",
          completionYear: project.updatedAt
            ? new Date(project.updatedAt).getFullYear()
            : null,
          materialCertificate: "",
          gpsLink: "",
        })),
    ];

    const jobPostingsCreated = jobPostings.map((posting) => {
      const populatedWorkerId = posting.worker?._id || posting.worker;
      const workerId = populatedWorkerId ? String(populatedWorkerId) : null;
      const workerProfile = posting.worker || null;

      return {
        _id: posting._id,
        position: posting.position || "—",
        location: posting.location || "—",
        salary: posting.salary || 0,
        status: posting.status || "Pending",
        postedOn: posting.createdAt || posting._id?.getTimestamp?.() || null,
        workerId,
        workerName: workerProfile?.name || "—",
        workerEmail: workerProfile?.email || "—",
        workerPhone: workerProfile?.phone || "—",
        workerSpecialization: workerProfile?.specialization || "—",
        workerExperience: Number(workerProfile?.experience || 0),
        workerProfileStatus: workerProfile?.status || "pending",
        workerRoutePath: workerId ? `/worker/${workerId}` : null,
      };
    });

    const receivedJobApplications = jobApplications.map((application) => ({
      _id: application._id,
      applicantName: application.fullName || application.workerId?.name || "—",
      position: application.positionApplying || "—",
      experience:
        application.experience ?? application.workerId?.experience ?? 0,
      expectedSalary: application.expectedSalary || 0,
      status: application.status || "Pending",
      appliedOn: application.createdAt || null,
      routePath: `/job-application/${application._id}`,
    }));

    const constructionValue = constructionProjects.reduce((sum, project) => {
      const status = normalizeStatus(project.status);
      if (
        ["accepted", "completed", "ongoing", "in progress"].includes(status)
      ) {
        return (
          sum +
          Number(
            project.paymentDetails?.totalAmount || project.proposal?.price || 0,
          )
        );
      }
      return sum;
    }, 0);

    const bidValue = wonBidsWithCompany.reduce(
      (sum, bid) => sum + Number(bid.bidAmount || 0),
      0,
    );

    let totalAmountReceived = 0;
    let pendingPayouts = 0;
    let lastPayoutDate = null;
    let lastPayoutAmount = 0;

    const constructionFinanceDetails = constructionProjects.map((project) => {
      const payouts = project.paymentDetails?.payouts || [];
      const releasedPayouts = payouts.filter(
        (payout) => normalizeStatus(payout.status) === "released",
      );
      const pendingProjectPayouts = payouts.filter(
        (payout) => normalizeStatus(payout.status) === "pending",
      );

      const totalReleasedForProject = releasedPayouts.reduce(
        (sum, payout) => sum + Number(payout.amount || 0),
        0,
      );
      const pendingForProject = pendingProjectPayouts.reduce(
        (sum, payout) => sum + Number(payout.amount || 0),
        0,
      );

      const commissionFee = Number(project.paymentDetails?.platformFee || 0);
      const companyNetAmount = Math.max(
        Number(
          project.paymentDetails?.totalAmount || project.proposal?.price || 0,
        ) - commissionFee,
        0,
      );
      const commissionReceived = companyNetAmount
        ? Math.min(
            commissionFee,
            (totalReleasedForProject / companyNetAmount) * commissionFee,
          )
        : totalReleasedForProject > 0
          ? commissionFee
          : 0;

      const projectLastPayoutDate = releasedPayouts.length
        ? releasedPayouts
            .map((payout) => payout.releaseDate)
            .filter(Boolean)
            .sort((left, right) => new Date(right) - new Date(left))[0] || null
        : null;

      return {
        id: project._id,
        projectName: project.projectName || "Construction Project",
        type: "construction",
        status: project.status || "pending",
        contractValue: Number(
          project.paymentDetails?.totalAmount || project.proposal?.price || 0,
        ),
        totalReleased: totalReleasedForProject,
        pendingPayout: pendingForProject,
        commissionFee,
        commissionReceived,
        payoutCount: payouts.length,
        releasedCount: releasedPayouts.length,
        pendingCount: pendingProjectPayouts.length,
        lastPayoutDate: projectLastPayoutDate,
        routePath: `/construction-project/${project._id}`,
      };
    });

    const bidByIdMap = new Map(bids.map((entry) => [String(entry._id), entry]));

    const bidFinanceDetails = wonBidsWithCompany.map((bid) => {
      const sourceBid = bidByIdMap.get(String(bid._id));
      const payouts = sourceBid?.paymentDetails?.payouts || [];
      const releasedPayouts = payouts.filter(
        (payout) => normalizeStatus(payout.status) === "released",
      );
      const pendingProjectPayouts = payouts.filter(
        (payout) => normalizeStatus(payout.status) === "pending",
      );

      const totalReleasedForProject = releasedPayouts.reduce(
        (sum, payout) => sum + Number(payout.amount || 0),
        0,
      );
      const pendingForProject = pendingProjectPayouts.reduce(
        (sum, payout) => sum + Number(payout.amount || 0),
        0,
      );

      const commissionFee = Number(sourceBid?.paymentDetails?.platformFee || 0);
      const companyNetAmount = Math.max(
        Number(bid.bidAmount || 0) - commissionFee,
        0,
      );
      const commissionReceived = companyNetAmount
        ? Math.min(
            commissionFee,
            (totalReleasedForProject / companyNetAmount) * commissionFee,
          )
        : totalReleasedForProject > 0
          ? commissionFee
          : 0;

      const projectLastPayoutDate = releasedPayouts.length
        ? releasedPayouts
            .map((payout) => payout.releaseDate)
            .filter(Boolean)
            .sort((left, right) => new Date(right) - new Date(left))[0] || null
        : null;

      return {
        id: bid._id,
        projectName: bid.projectName || "Bid",
        type: "bid",
        status: bid.status || "open",
        contractValue: Number(bid.bidAmount || 0),
        totalReleased: totalReleasedForProject,
        pendingPayout: pendingForProject,
        commissionFee,
        commissionReceived,
        payoutCount: payouts.length,
        releasedCount: releasedPayouts.length,
        pendingCount: pendingProjectPayouts.length,
        lastPayoutDate: projectLastPayoutDate,
        routePath: bid.routePath,
      };
    });

    constructionProjects.forEach((project) => {
      (project.paymentDetails?.payouts || []).forEach((payout) => {
        const value = Number(payout.amount || 0);
        const payoutStatus = normalizeStatus(payout.status);
        if (payoutStatus === "released") {
          totalAmountReceived += value;
          const releaseAt = payout.releaseDate
            ? new Date(payout.releaseDate)
            : null;
          if (releaseAt && (!lastPayoutDate || releaseAt > lastPayoutDate)) {
            lastPayoutDate = releaseAt;
            lastPayoutAmount = value;
          }
        } else if (payoutStatus === "pending") {
          pendingPayouts += value;
        }
      });
    });

    bids.forEach((bid) => {
      (bid.paymentDetails?.payouts || []).forEach((payout) => {
        const value = Number(payout.amount || 0);
        const payoutStatus = normalizeStatus(payout.status);
        if (payoutStatus === "released") {
          totalAmountReceived += value;
          const releaseAt = payout.releaseDate
            ? new Date(payout.releaseDate)
            : null;
          if (releaseAt && (!lastPayoutDate || releaseAt > lastPayoutDate)) {
            lastPayoutDate = releaseAt;
            lastPayoutAmount = value;
          }
        } else if (payoutStatus === "pending") {
          pendingPayouts += value;
        }
      });
    });

    const totalCommissionReceived =
      constructionFinanceDetails.reduce(
        (sum, row) => sum + Number(row.commissionReceived || 0),
        0,
      ) +
      bidFinanceDetails.reduce(
        (sum, row) => sum + Number(row.commissionReceived || 0),
        0,
      );

    const reviewsReceived = constructionProjects
      .filter((project) => project.customerReview?.rating)
      .map((project) => ({
        _id: project._id,
        projectName: project.projectName || "Project",
        customerName:
          project.customerId?.name || project.customerName || "Customer",
        rating: Number(project.customerReview?.rating || 0),
        comment: project.customerReview?.reviewText || "",
        reviewedOn: project.customerReview?.reviewDate || project.updatedAt,
      }))
      .sort((left, right) => {
        return new Date(right.reviewedOn || 0) - new Date(left.reviewedOn || 0);
      });

    const companyDocuments = Array.isArray(company.companyDocuments)
      ? company.companyDocuments
      : [];

    res.json({
      success: true,
      company,
      summary: {
        activeProjectsCount: ongoingProjects.length,
        completedProjectsCount: completedShowcase.length,
        totalProjectsCount:
          Number(company.completedProjects?.length || 0) +
          ongoingProjects.length,
        documentsCount: companyDocuments.length,
      },
      verification: {
        status: company.status || "pending",
        verifiedOn: company.status === "verified" ? company.updatedAt : null,
        rejectionReason: company.rejectionReason || "",
        documents: companyDocuments,
      },
      ongoingProjects,
      completedShowcase,
      bidsWon: wonBidsWithCompany,
      recruitment: {
        jobPostingsCreated,
        receivedJobApplications,
      },
      finance: {
        totalProjectValueHandled: constructionValue + bidValue,
        totalAmountReceived,
        pendingPayouts,
        totalCommissionReceived,
        lastPayoutDate,
        lastPayoutAmount,
        constructionDetails: constructionFinanceDetails,
        bidDetails: bidFinanceDetails,
      },
      reviewsReceived,
      timestamps: {
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching full company detail:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

const getWorkerDetail = async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id).lean();
    if (!worker) {
      return res.status(404).json({ error: "Worker not found" });
    }

    const [architectHirings, designRequests, jobApplications] =
      await Promise.all([
        ArchitectHiring.find({ worker: req.params.id })
          .populate("customer", "name email phone")
          .sort({ createdAt: -1 })
          .lean(),
        DesignRequest.find({ workerId: req.params.id })
          .populate("customerId", "name email phone")
          .sort({ createdAt: -1 })
          .lean(),
        WorkerToCompany.find({ workerId: req.params.id })
          .populate("companyId", "companyName email contactPerson")
          .sort({ createdAt: -1 })
          .lean(),
      ]);

    res.json({
      worker,
      relatedData: {
        architectHirings,
        designRequests,
        jobApplications,
        totalProjects: architectHirings.length + designRequests.length,
        activeProjects: [
          ...architectHirings.filter(
            (h) => h.status === "accepted" || h.status === "In-Progress",
          ),
          ...designRequests.filter(
            (d) => d.status === "accepted" || d.status === "In-Progress",
          ),
        ].length,
        completedProjects: [
          ...architectHirings.filter((h) => h.status === "Completed"),
          ...designRequests.filter((d) => d.status === "Completed"),
        ].length,
        totalApplications: jobApplications.length,
        acceptedApplications: jobApplications.filter(
          (app) => app.status === "accepted",
        ).length,
      },
    });
  } catch (error) {
    console.error("Error fetching worker:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

const getWorkerFullDetail = async (req, res) => {
  try {
    const workerId = req.params.workerId;
    const worker = await Worker.findById(workerId).lean();

    if (!worker) {
      return res
        .status(404)
        .json({ success: false, error: "Worker not found" });
    }

    const [
      architectHirings,
      designRequests,
      transactions,
      commissionAggregation,
    ] = await Promise.all([
      ArchitectHiring.find({ worker: workerId })
        .select(
          "projectName customer customerDetails.fullName status finalAmount proposal.price milestones review.customerToWorker paymentDetails.workerAmount paymentDetails.totalAmount createdAt updatedAt",
        )
        .populate("customer", "name email phone")
        .sort({ createdAt: -1 })
        .lean(),
      DesignRequest.find({ workerId })
        .select(
          "projectName customerId fullName status finalAmount proposal.price milestones review.customerToWorker paymentDetails.workerAmount paymentDetails.totalAmount createdAt updatedAt",
        )
        .populate("customerId", "name email phone")
        .sort({ createdAt: -1 })
        .lean(),
      Transaction.find({ workerId })
        .select(
          "createdAt transactionType amount netAmount platformFee status description",
        )
        .sort({ createdAt: -1 })
        .limit(12)
        .lean(),
      Transaction.aggregate([
        { $match: { workerId: worker._id } },
        {
          $group: {
            _id: null,
            totalPlatformFee: { $sum: { $ifNull: ["$platformFee", 0] } },
            totalCommissionTransactions: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $eq: ["$transactionType", "platform_commission"] },
                      { $eq: ["$transactionType", "platform_fee_collection"] },
                    ],
                  },
                  { $ifNull: ["$amount", 0] },
                  0,
                ],
              },
            },
          },
        },
      ]),
    ]);

    const workerSafe = { ...worker };
    delete workerSafe.password;

    const architectProjects = architectHirings.map((item) => {
      const amount =
        Number(item?.finalAmount || 0) ||
        Number(item?.proposal?.price || 0) ||
        Number(item?.paymentDetails?.workerAmount || 0) ||
        Number(item?.paymentDetails?.totalAmount || 0);

      const milestones = Array.isArray(item?.milestones) ? item.milestones : [];
      const approvedMilestones = milestones.filter(
        (milestone) => normalizeStatus(milestone?.status) === "approved",
      ).length;

      return {
        _id: item._id,
        type: "architect",
        typeLabel: "Architect Hiring",
        projectName: item.projectName || "Architect Hiring",
        customerName:
          item.customer?.name || item.customerDetails?.fullName || "—",
        status: item.status || "Pending",
        amount,
        progress: getArchitectProgress(item),
        milestoneLabel: milestones.length
          ? `${approvedMilestones}/${milestones.length} approved`
          : "No milestones",
        hiredOn: item.createdAt,
        completionDate:
          normalizeStatus(item.status) === "completed" ? item.updatedAt : null,
        rating: Number(item.review?.customerToWorker?.rating || 0),
        reviewComment: item.review?.customerToWorker?.comment || "",
        routePath: `/architect-hiring/${item._id}`,
      };
    });

    const interiorProjects = designRequests.map((item) => {
      const amount =
        Number(item?.finalAmount || 0) ||
        Number(item?.proposal?.price || 0) ||
        Number(item?.paymentDetails?.workerAmount || 0) ||
        Number(item?.paymentDetails?.totalAmount || 0);

      const milestones = Array.isArray(item?.milestones) ? item.milestones : [];
      const approvedMilestones = milestones.filter(
        (milestone) => normalizeStatus(milestone?.status) === "approved",
      ).length;

      return {
        _id: item._id,
        type: "interior",
        typeLabel: "Interior Design",
        projectName: item.projectName || "Interior Design",
        customerName: item.customerId?.name || item.fullName || "—",
        status: item.status || "pending",
        amount,
        progress: getInteriorProgress(item),
        milestoneLabel: milestones.length
          ? `${approvedMilestones}/${milestones.length} approved`
          : "No milestones",
        hiredOn: item.createdAt,
        completionDate:
          normalizeStatus(item.status) === "completed" ? item.updatedAt : null,
        rating: Number(item.review?.customerToWorker?.rating || 0),
        reviewComment: item.review?.customerToWorker?.comment || "",
        routePath: `/design-request/${item._id}`,
      };
    });

    const allProjects = [...architectProjects, ...interiorProjects].sort(
      (left, right) =>
        new Date(right.hiredOn || 0).getTime() -
        new Date(left.hiredOn || 0).getTime(),
    );

    const ongoingProjects = allProjects.filter((project) => {
      const status = normalizeStatus(project.status);
      return ![
        "completed",
        "rejected",
        "cancelled",
        "denied",
        "closed",
      ].includes(status);
    });

    const completedProjects = allProjects.filter(
      (project) => normalizeStatus(project.status) === "completed",
    );

    const reviewsReceived = (worker.reviews || [])
      .map((review, index) => ({
        _id: review._id || `${worker._id}-review-${index}`,
        projectId: review.projectId,
        projectName: review.projectName || "Project",
        projectType: review.projectType || "worker",
        customerName: review.customerName || "Customer",
        rating: Number(review.rating || 0),
        comment: review.comment || "",
        reviewedOn: review.reviewedAt || worker.updatedAt,
      }))
      .sort(
        (left, right) =>
          new Date(right.reviewedOn || 0).getTime() -
          new Date(left.reviewedOn || 0).getTime(),
      );

    const computedAverage = reviewsReceived.length
      ? reviewsReceived.reduce(
          (sum, review) => sum + Number(review.rating || 0),
          0,
        ) / reviewsReceived.length
      : 0;

    const totalCommission = Number(
      commissionAggregation?.[0]?.totalPlatformFee ||
        commissionAggregation?.[0]?.totalCommissionTransactions ||
        0,
    );

    const earnings = {
      totalEarnings: Number(worker.earnings?.totalEarnings || 0),
      availableBalance: Number(worker.earnings?.availableBalance || 0),
      pendingBalance: Number(worker.earnings?.pendingBalance || 0),
      withdrawnAmount: Number(worker.earnings?.withdrawnAmount || 0),
      monthlyEarnings: Number(worker.earnings?.monthlyEarnings || 0),
      yearlyEarnings: Number(worker.earnings?.yearlyEarnings || 0),
      subscriptionPlan: String(worker.subscriptionPlan || "basic"),
      commissionRate: Number(worker.commissionRate || 0),
      totalCommission,
    };

    const recentTransactions = transactions.map((transaction) => ({
      _id: transaction._id,
      date: transaction.createdAt,
      type: transaction.transactionType || "payment",
      amount: Number(transaction.amount || 0),
      netAmount: Number(transaction.netAmount || 0),
      platformFee: Number(transaction.platformFee || 0),
      status: transaction.status || "pending",
      description: transaction.description || "",
    }));

    res.json({
      success: true,
      worker: workerSafe,
      summary: {
        activeProjectsCount: ongoingProjects.length,
        completedProjectsCount: completedProjects.length,
        totalProjectsCount: allProjects.length,
        averageRating:
          Number(worker.rating || 0) > 0
            ? Number(worker.rating || 0)
            : Number(computedAverage.toFixed(1)),
        totalReviews: Number(worker.totalReviews || reviewsReceived.length),
        memberSince: worker.createdAt,
        totalEarnings: earnings.totalEarnings,
      },
      verification: {
        status: worker.status || "pending",
        aadhaarVerified: Boolean(worker.aadharNumber),
        aadhaarLast4: String(worker.aadharNumber || "").slice(-4),
        certificateFiles: Array.isArray(worker.certificateFiles)
          ? worker.certificateFiles
          : [],
        rejectionReason: worker.rejectionReason || "",
      },
      ongoingProjects,
      completedProjects,
      earnings: {
        ...earnings,
        recentTransactions,
      },
      reviewsReceived,
      previousEmployment: Array.isArray(worker.previousCompanies)
        ? worker.previousCompanies
        : [],
      portfolio: Array.isArray(worker.projects) ? worker.projects : [],
      timestamps: {
        createdAt: worker.createdAt,
        updatedAt: worker.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching full worker detail:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

const getArchitectHiringDetail = async (req, res) => {
  try {
    const hiring = await ArchitectHiring.findById(req.params.id)
      .populate("customer", "name email phone")
      .populate("worker", "name email specialization")
      .lean();
    if (!hiring) {
      return res.status(404).json({ error: "Architect hiring not found" });
    }
    res.json({ hiring });
  } catch (error) {
    console.error("Error fetching architect hiring:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

const getArchitectHiringFullDetail = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const hiring = await ArchitectHiring.findById(projectId)
      .populate("customer", "name email phone")
      .populate("worker", "name email phone specialization")
      .lean();

    if (!hiring) {
      return res
        .status(404)
        .json({ success: false, error: "Architect hiring not found" });
    }

    const milestonePayments = Array.isArray(
      hiring.paymentDetails?.milestonePayments,
    )
      ? hiring.paymentDetails.milestonePayments
      : [];

    const lastPaymentCollectedAt = milestonePayments.reduce((latest, item) => {
      if (!item?.paymentCollectedAt) return latest;
      if (!latest) return item.paymentCollectedAt;
      return new Date(item.paymentCollectedAt) > new Date(latest)
        ? item.paymentCollectedAt
        : latest;
    }, null);

    const paymentSummary = {
      totalAmount: Number(hiring.paymentDetails?.totalAmount || 0),
      platformCommission: Number(
        hiring.paymentDetails?.platformCommission || 0,
      ),
      workerAmount: Number(hiring.paymentDetails?.workerAmount || 0),
      escrowStatus: hiring.paymentDetails?.escrowStatus || "not_initiated",
      stripeSessionId: hiring.paymentDetails?.stripeSessionId || "",
      stripePaymentIntentId: hiring.paymentDetails?.stripePaymentIntentId || "",
      paymentInitiatedAt: hiring.paymentDetails?.paymentInitiatedAt || null,
      lastPaymentCollectedAt,
      milestonePayments: milestonePayments.map((item, index) => ({
        _id: item._id || `${hiring._id}-milestone-payment-${index}`,
        percentage: Number(item.percentage || 0),
        amount: Number(item.amount || 0),
        platformFee: Number(item.platformFee || 0),
        workerPayout: Number(item.workerPayout || 0),
        paymentCollected: Boolean(item.paymentCollected),
        paymentCollectedAt: item.paymentCollectedAt || null,
        status: item.status || "pending",
        releasedAt: item.releasedAt || null,
        withdrawnAt: item.withdrawnAt || null,
      })),
    };

    const summary = {
      projectName: hiring.projectName || "Architect Hiring",
      status: hiring.status || "Pending",
      customerName:
        hiring.customer?.name || hiring.customerDetails?.fullName || "Unknown",
      customerId: hiring.customer?._id || null,
      architectName: hiring.worker?.name || "Not Assigned",
      architectId: hiring.worker?._id || null,
      finalAmount:
        Number(hiring.finalAmount || 0) ||
        Number(hiring.proposal?.price || 0) ||
        Number(paymentSummary.totalAmount || 0),
      platformCommission: paymentSummary.platformCommission,
      commissionRate:
        paymentSummary.totalAmount > 0 && paymentSummary.platformCommission > 0
          ? Number(
              (
                (paymentSummary.platformCommission /
                  paymentSummary.totalAmount) *
                100
              ).toFixed(2),
            )
          : 0,
    };

    const milestones = (
      Array.isArray(hiring.milestones) ? hiring.milestones : []
    ).map((item, index) => ({
      _id: item._id || `${hiring._id}-milestone-${index}`,
      percentage: Number(item.percentage || 0),
      description: item.description || "",
      status: item.status || "Pending",
      image: item.image || "",
      submittedAt: item.submittedAt || null,
      approvedAt: item.approvedAt || null,
      rejectedAt: item.rejectedAt || null,
      rejectionReason: item.rejectionReason || "",
      revisionRequestedAt: item.revisionRequestedAt || null,
      revisionNotes: item.revisionNotes || "",
      adminReport: item.adminReport || "",
      adminReviewNotes: item.adminReviewNotes || "",
    }));

    const projectUpdates = (
      Array.isArray(hiring.projectUpdates) ? hiring.projectUpdates : []
    )
      .map((item, index) => ({
        _id: item._id || `${hiring._id}-update-${index}`,
        updateText: item.updateText || "",
        updateImage: item.updateImage || "",
        createdAt: item.createdAt || hiring.updatedAt,
      }))
      .sort(
        (left, right) => new Date(right.createdAt) - new Date(left.createdAt),
      );

    const proposal = {
      price: Number(hiring.proposal?.price || 0),
      description: hiring.proposal?.description || "",
      sentAt: hiring.proposal?.sentAt || null,
      phases: Array.isArray(hiring.proposal?.phases)
        ? hiring.proposal.phases.map((phase, index) => ({
            _id: phase._id || `${hiring._id}-phase-${index}`,
            name: phase.name || `Phase ${index + 1}`,
            percentage: Number(phase.percentage || 0),
            requiredMonths: Number(phase.requiredMonths || 0),
            amount: Number(phase.amount || 0),
            subdivisions: Array.isArray(phase.subdivisions)
              ? phase.subdivisions.map((subdivision, subIndex) => ({
                  _id:
                    subdivision._id ||
                    `${hiring._id}-phase-${index}-sub-${subIndex}`,
                  category: subdivision.category || "",
                  description: subdivision.description || "",
                  amount: Number(subdivision.amount || 0),
                }))
              : [],
          }))
        : [],
    };

    const references = Array.isArray(hiring.additionalDetails?.referenceImages)
      ? hiring.additionalDetails.referenceImages
      : [];

    res.json({
      success: true,
      hiring,
      summary,
      proposal,
      milestones,
      paymentSummary,
      projectUpdates,
      references,
      review: hiring.review || {
        customerToWorker: null,
        workerToCustomer: null,
        isReviewCompleted: false,
      },
      timestamps: {
        createdAt: hiring.createdAt,
        updatedAt: hiring.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching full architect hiring detail:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

const getConstructionProjectDetail = async (req, res) => {
  try {
    const project = await ConstructionProjectSchema.findById(req.params.id)
      .populate("customerId", "name email phone")
      .populate("companyId", "companyName contactPerson email")
      .lean();
    if (!project) {
      return res.status(404).json({ error: "Construction project not found" });
    }
    res.json({ project });
  } catch (error) {
    console.error("Error fetching construction project:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

const getConstructionProjectFullDetail = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const project = await ConstructionProjectSchema.findById(projectId)
      .populate("customerId", "name email phone")
      .populate("companyId", "companyName contactPerson email phone")
      .lean();

    if (!project) {
      return res
        .status(404)
        .json({ success: false, error: "Construction project not found" });
    }

    const totalAmount = Number(
      project.paymentDetails?.totalAmount ||
        project.proposal?.price ||
        project.estimatedBudget ||
        0,
    );
    const platformFee = Number(project.paymentDetails?.platformFee || 0);
    const commissionRate =
      totalAmount > 0 && platformFee > 0
        ? Number(((platformFee / totalAmount) * 100).toFixed(2))
        : 0;

    const payoutEntries = Array.isArray(project.paymentDetails?.payouts)
      ? project.paymentDetails.payouts
      : [];
    const payoutReleased = payoutEntries.filter(
      (entry) => normalizeStatus(entry.status) === "released",
    );

    const siteFiles = [
      ...(Array.isArray(project.siteFilepaths) ? project.siteFilepaths : []),
      ...(project.mainImagePath ? [project.mainImagePath] : []),
      ...(Array.isArray(project.additionalImagePaths)
        ? project.additionalImagePaths
        : []),
    ].filter(Boolean);

    const completionImages = Array.isArray(project.completionImages)
      ? project.completionImages.filter(Boolean)
      : [];

    const floorBreakdown = Array.isArray(project.floors)
      ? project.floors.map((floor, index) => ({
          _id: floor._id || `${project._id}-floor-${index}`,
          floorNumber: floor.floorNumber ?? index + 1,
          floorType: floor.floorType || "other",
          floorArea: Number(floor.floorArea || 0),
          floorDescription: floor.floorDescription || "",
          floorImagePath: floor.floorImagePath || "",
        }))
      : [];

    const proposal = {
      price: Number(project.proposal?.price || 0),
      description: project.proposal?.description || "",
      sentAt: project.proposal?.sentAt || null,
      phases: Array.isArray(project.proposal?.phases)
        ? project.proposal.phases.map((phase, index) => ({
            _id: phase._id || `${project._id}-phase-${index}`,
            name: phase.name || `Phase ${index + 1}`,
            percentage: Number(phase.percentage || 0),
            requiredMonths: Number(phase.requiredMonths || 0),
            amount: Number(phase.amount || 0),
            paymentSchedule: {
              upfrontPercentage: Number(
                phase.paymentSchedule?.upfrontPercentage || 0,
              ),
              completionPercentage: Number(
                phase.paymentSchedule?.completionPercentage || 0,
              ),
              finalPercentage: Number(
                phase.paymentSchedule?.finalPercentage || 0,
              ),
            },
            subdivisions: Array.isArray(phase.subdivisions)
              ? phase.subdivisions.map((subdivision, subIndex) => ({
                  _id:
                    subdivision._id ||
                    `${project._id}-phase-${index}-sub-${subIndex}`,
                  category: subdivision.category || "",
                  description: subdivision.description || "",
                  amount: Number(subdivision.amount || 0),
                }))
              : [],
            bills: Array.isArray(phase.bills)
              ? phase.bills.map((bill, billIndex) => ({
                  _id:
                    bill._id ||
                    `${project._id}-phase-${index}-bill-${billIndex}`,
                  fileName: bill.fileName || `Bill ${billIndex + 1}`,
                  fileUrl: bill.fileUrl || "",
                  uploadedAt: bill.uploadedAt || null,
                  uploadedBy: bill.uploadedBy || "company",
                }))
              : [],
          }))
        : [],
    };

    const milestones = Array.isArray(project.milestones)
      ? project.milestones.map((milestone, index) => ({
          _id: milestone._id || `${project._id}-milestone-${index}`,
          percentage: Number(milestone.percentage || 0),
          phaseName: milestone.phaseName || "",
          companyMessage: milestone.companyMessage || "",
          isApprovedByCustomer: Boolean(milestone.isApprovedByCustomer),
          submittedAt: milestone.submittedAt || null,
          approvedAt: milestone.approvedAt || null,
          isCheckpoint: Boolean(milestone.isCheckpoint),
          isAutoGenerated: Boolean(milestone.isAutoGenerated),
          needsRevision: Boolean(milestone.needsRevision),
          customerFeedback: milestone.customerFeedback || "",
          payments: {
            upfront: {
              amount: Number(milestone.payments?.upfront?.amount || 0),
              status: milestone.payments?.upfront?.status || "pending",
              releasedAt: milestone.payments?.upfront?.releasedAt || null,
              billUrl: milestone.payments?.upfront?.billUrl || "",
            },
            completion: {
              amount: Number(milestone.payments?.completion?.amount || 0),
              status: milestone.payments?.completion?.status || "pending",
              releasedAt: milestone.payments?.completion?.releasedAt || null,
              billUrl: milestone.payments?.completion?.billUrl || "",
            },
            final: {
              amount: Number(milestone.payments?.final?.amount || 0),
              status: milestone.payments?.final?.status || "pending",
              releasedAt: milestone.payments?.final?.releasedAt || null,
              billUrl: milestone.payments?.final?.billUrl || "",
            },
          },
          conversation: Array.isArray(milestone.conversation)
            ? milestone.conversation.map((message, messageIndex) => ({
                _id:
                  message._id ||
                  `${project._id}-milestone-${index}-msg-${messageIndex}`,
                sender: message.sender || "company",
                message: message.message || "",
                timestamp: message.timestamp || null,
                viewedByCompany: Boolean(message.viewedByCompany),
                viewedByCustomer: Boolean(message.viewedByCustomer),
              }))
            : [],
        }))
      : [];

    const milestonePayments = milestones.flatMap((milestone) => {
      const phaseLabel = milestone.phaseName || `${milestone.percentage}%`;
      return [
        {
          _id: `${milestone._id}-upfront`,
          milestonePercentage: milestone.percentage,
          phaseName: `${phaseLabel} · Upfront`,
          amount: milestone.payments.upfront.amount,
          platformFee: 0,
          companyPayout: milestone.payments.upfront.amount,
          status: milestone.payments.upfront.status,
          billUrl: milestone.payments.upfront.billUrl,
        },
        {
          _id: `${milestone._id}-completion`,
          milestonePercentage: milestone.percentage,
          phaseName: `${phaseLabel} · Completion`,
          amount: milestone.payments.completion.amount,
          platformFee: 0,
          companyPayout: milestone.payments.completion.amount,
          status: milestone.payments.completion.status,
          billUrl: milestone.payments.completion.billUrl,
        },
        {
          _id: `${milestone._id}-final`,
          milestonePercentage: milestone.percentage,
          phaseName: `${phaseLabel} · Final`,
          amount: milestone.payments.final.amount,
          platformFee: 0,
          companyPayout: milestone.payments.final.amount,
          status: milestone.payments.final.status,
          billUrl: milestone.payments.final.billUrl,
        },
      ].filter((entry) => Number(entry.amount || 0) > 0 || entry.billUrl);
    });

    const projectUpdates = Array.isArray(project.recentUpdates)
      ? project.recentUpdates
          .map((update, index) => ({
            _id: update._id || `${project._id}-update-${index}`,
            updateText: update.updateText || "",
            updateImagePath: update.updateImagePath || "",
            createdAt: update.createdAt || null,
          }))
          .sort(
            (left, right) =>
              new Date(right.createdAt) - new Date(left.createdAt),
          )
      : [];

    const conversation = milestones
      .flatMap((milestone) =>
        (milestone.conversation || []).map((message) => ({
          ...message,
          milestonePercentage: milestone.percentage,
          phaseName: milestone.phaseName || "",
        })),
      )
      .sort(
        (left, right) => new Date(right.timestamp) - new Date(left.timestamp),
      );

    res.json({
      success: true,
      project,
      summary: {
        projectName: project.projectName || "Construction Project",
        status: project.status || "pending",
        customerName:
          project.customerName || project.customerId?.name || "Unknown",
        customerId: project.customerId?._id || null,
        companyName:
          project.companyId?.companyName ||
          project.companyName ||
          "Not Assigned",
        companyId: project.companyId?._id || null,
        contractAmount: totalAmount,
        platformFee,
        commissionRate,
      },
      basicInfo: {
        buildingType: project.buildingType || "other",
        totalArea: Number(project.totalArea || 0),
        totalFloors: Number(project.totalFloors || 0),
        projectAddress: project.projectAddress || "",
        projectLocationPincode: project.projectLocationPincode || "",
        estimatedBudget: Number(project.estimatedBudget || 0),
        projectTimeline: Number(project.projectTimeline || 0),
        specialRequirements: project.specialRequirements || "",
        accessibilityNeeds: project.accessibilityNeeds || "none",
        energyEfficiency: project.energyEfficiency || "standard",
        completionPercentage: Number(project.completionPercentage || 0),
        currentPhase: project.currentPhase || "",
        targetCompletionDate: project.targetCompletionDate || null,
      },
      floorBreakdown,
      proposal,
      milestones,
      paymentSummary: {
        totalAmount,
        platformFee,
        amountPaidToCompany: Number(
          project.paymentDetails?.amountPaidToCompany || 0,
        ),
        paymentStatus: project.paymentDetails?.paymentStatus || "unpaid",
        payouts: payoutEntries.map((entry, index) => ({
          _id: entry._id || `${project._id}-payout-${index}`,
          amount: Number(entry.amount || 0),
          status: entry.status || "pending",
          releaseDate: entry.releaseDate || null,
          milestonePercentage: Number(entry.milestonePercentage || 0),
          phaseName: entry.phaseName || "",
        })),
        releasedPayouts: payoutReleased.map((entry, index) => ({
          _id: entry._id || `${project._id}-released-${index}`,
          amount: Number(entry.amount || 0),
          releaseDate: entry.releaseDate || null,
          milestonePercentage: Number(entry.milestonePercentage || 0),
          phaseName: entry.phaseName || "",
        })),
        milestonePayments,
        stripeSessionId: project.paymentDetails?.stripeSessionId || "",
        stripePaymentIntentId:
          project.paymentDetails?.stripePaymentIntentId || "",
      },
      updates: projectUpdates,
      conversation,
      media: {
        siteFiles,
        completionImages,
      },
      customerReview: project.customerReview || {
        rating: null,
        reviewText: "",
        reviewDate: null,
      },
      timestamps: {
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching full construction project detail:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

const getDesignRequestDetail = async (req, res) => {
  try {
    const request = await DesignRequest.findById(req.params.id)
      .populate("customerId", "name email phone")
      .populate("workerId", "name email specialization")
      .lean();
    if (!request) {
      return res.status(404).json({ error: "Design request not found" });
    }
    res.json({ request });
  } catch (error) {
    console.error("Error fetching design request:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

const getDesignRequestFullDetail = async (req, res) => {
  try {
    const request = await DesignRequest.findById(req.params.requestId)
      .populate("customerId", "name email phone")
      .populate("workerId", "name email phone specialization")
      .lean();

    if (!request) {
      return res.status(404).json({ error: "Design request not found" });
    }

    const totalAmount = Number(
      request.paymentDetails?.totalAmount ||
        request.finalAmount ||
        request.proposal?.price ||
        0,
    );
    const platformCommission = Number(
      request.paymentDetails?.platformCommission || 0,
    );
    const commissionRate =
      totalAmount > 0 && platformCommission > 0
        ? Number(((platformCommission / totalAmount) * 100).toFixed(2))
        : 0;

    const milestones = Array.isArray(request.milestones)
      ? request.milestones.map((milestone, index) => ({
          _id: milestone._id || `${request._id}-milestone-${index}`,
          percentage: Number(milestone.percentage || 0),
          description: milestone.description || "",
          status: milestone.status || "Pending",
          image: milestone.image || "",
          submittedAt: milestone.submittedAt || null,
          approvedAt: milestone.approvedAt || null,
          rejectedAt: milestone.rejectedAt || null,
          rejectionReason: milestone.rejectionReason || "",
          revisionRequestedAt: milestone.revisionRequestedAt || null,
          revisionNotes: milestone.revisionNotes || "",
          adminReport: milestone.adminReport || "",
          adminReviewNotes: milestone.adminReviewNotes || "",
        }))
      : [];

    const projectUpdates = Array.isArray(request.projectUpdates)
      ? request.projectUpdates
          .map((update, index) => ({
            _id: update._id || `${request._id}-update-${index}`,
            updateText: update.updateText || "",
            updateImage: update.updateImage || "",
            createdAt: update.createdAt || null,
          }))
          .sort(
            (left, right) =>
              new Date(right.createdAt) - new Date(left.createdAt),
          )
      : [];

    const referenceImageList = Array.isArray(request.inspirationImages)
      ? request.inspirationImages.filter(Boolean)
      : [];

    const references = referenceImageList.map((image, index) => ({
      originalName: `Reference ${index + 1}`,
      url: image,
    }));

    const milestonePayments = Array.isArray(
      request.paymentDetails?.milestonePayments,
    )
      ? request.paymentDetails.milestonePayments.map((payment, index) => ({
          _id: payment._id || `${request._id}-payment-${index}`,
          percentage: Number(payment.percentage || 0),
          amount: Number(payment.amount || 0),
          platformFee: Number(payment.platformFee || 0),
          workerPayout: Number(payment.workerPayout || 0),
          paymentCollected: Boolean(payment.paymentCollected),
          status: payment.status || "pending",
          paymentCollectedAt: payment.paymentCollectedAt || null,
          releasedAt: payment.releasedAt || null,
          withdrawnAt: payment.withdrawnAt || null,
        }))
      : [];

    const paymentInitiatedAt =
      request.paymentDetails?.paymentInitiatedAt || null;
    const lastPaymentCollectedAt = milestonePayments.reduce((latest, item) => {
      if (!item?.paymentCollectedAt) return latest;
      if (!latest) return item.paymentCollectedAt;
      return new Date(item.paymentCollectedAt) > new Date(latest)
        ? item.paymentCollectedAt
        : latest;
    }, null);

    res.json({
      request,
      summary: {
        projectName: request.projectName || "Interior Design Request",
        status: request.status || "Pending",
        customerName: request.customerId?.name || request.fullName || "Unknown",
        customerId: request.customerId?._id || null,
        architectName: request.workerId?.name || "Not Assigned",
        architectId: request.workerId?._id || null,
        finalAmount: totalAmount,
        platformCommission,
        commissionRate,
      },
      proposal: {
        price: Number(request.proposal?.price || 0),
        description: request.proposal?.description || "",
        sentAt: request.proposal?.sentAt || null,
        phases: [],
      },
      milestones,
      paymentSummary: {
        totalAmount,
        platformCommission,
        workerAmount: Number(request.paymentDetails?.workerAmount || 0),
        escrowStatus: request.paymentDetails?.escrowStatus || "not_initiated",
        milestonePayments,
        stripeSessionId: request.paymentDetails?.stripeSessionId || "",
        stripePaymentIntentId:
          request.paymentDetails?.stripePaymentIntentId || "",
        paymentInitiatedAt,
        lastPaymentCollectedAt,
      },
      projectUpdates,
      review: request.review || {
        customerToWorker: null,
        workerToCustomer: null,
        isReviewCompleted: false,
      },
      references,
      timestamps: {
        createdAt: request.createdAt || null,
        updatedAt: request.updatedAt || request.createdAt || null,
      },
    });
  } catch (error) {
    console.error("Error fetching full design request detail:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

const getBidDetail = async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.id)
      .populate("customerId", "name email phone")
      .populate("companyBids.companyId", "companyName email")
      .lean();
    if (!bid) {
      return res.status(404).json({ error: "Bid not found" });
    }
    // routed file : admin/bid-detail
    res.json({ bid });
  } catch (error) {
    console.error("Error fetching bid:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

const getJobApplicationDetail = async (req, res) => {
  try {
    const application = await WorkerToCompany.findById(req.params.id)
      .populate("workerId", "name email phone specialization")
      .populate("companyId", "companyName contactPerson email")
      .lean();
    if (!application) {
      return res.status(404).json({ error: "Job application not found" });
    }
    // routed file : admin/job-application-detail
    res.json({ application });
  } catch (error) {
    console.error("Error fetching job application:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

const getAdminRevenue = async (req, res) => {
  try {
    const {
      Transaction,
      Bid,
      ConstructionProjectSchema,
      ArchitectHiring,
      DesignRequest,
      Customer,
      Worker,
      Company,
    } = require("../models");

    // 1. Setup Timeframe Boundaries
    const { timeframe } = req.query;
    let dateFilter = {};
    if (timeframe && timeframe !== "all") {
      const now = new Date();
      let start = new Date();
      if (timeframe === "week") start.setDate(now.getDate() - 7);
      else if (timeframe === "month") start.setMonth(now.getMonth() - 1);
      else if (timeframe === "quarter") start.setMonth(now.getMonth() - 3);
      else if (timeframe === "year") start.setFullYear(now.getFullYear() - 1);
      dateFilter = { createdAt: { $gte: start } };
    }

    // Fetch records with date filter applied
    const constructionProjects = await ConstructionProjectSchema.find(
      dateFilter,
    )
      .populate("customerId", "name email phone profileImage")
      .populate("companyId", "companyName email contactPerson logo")
      .sort({ createdAt: -1 });

    const architectHirings = await ArchitectHiring.find(dateFilter)
      .populate("customer", "name email phone profileImage")
      .populate("worker", "name email specialization profileImage")
      .sort({ createdAt: -1 });

    const designRequests = await DesignRequest.find(dateFilter)
      .populate("customerId", "name email phone profileImage")
      .populate("workerId", "name email specialization profileImage")
      .sort({ createdAt: -1 });

    const bids = await Bid.find(dateFilter)
      .populate("customerId", "name email phone")

      .sort({ createdAt: -1 });

    // Track transactions within timeframe
    const transactions = await Transaction.find({
      ...dateFilter,
      status: { $ne: "failed" },
    }).sort({ createdAt: 1 });

    // Users (Total overall, not necessarily bounded by time, for overall platform stats)
    const totalsUsers = {
      companies: await Company.countDocuments(),
      workers: await Worker.countDocuments(),
      customers: await Customer.countDocuments(),
    };

    let metrics = {
      totalPlatformRevenue: 0,
      receivedRevenue: 0,
      pendingRevenue: 0,
      totalProjects:
        constructionProjects.length +
        architectHirings.length +
        designRequests.length,
      activeProjects: 0,
      completedProjects: 0,
      collectionRate: 0,
      totalUsers: totalsUsers,
    };

    let revenueByType = {
      construction: {
        totalProjects: 0,
        platformRevenue: 0,
        receivedRevenue: 0,
        pendingRevenue: 0,
        activeProjects: 0,
        completedProjects: 0,
      },
      architect: {
        totalProjects: 0,
        platformRevenue: 0,
        receivedRevenue: 0,
        pendingRevenue: 0,
        activeProjects: 0,
        completedProjects: 0,
      },
      interior: {
        totalProjects: 0,
        platformRevenue: 0,
        receivedRevenue: 0,
        pendingRevenue: 0,
        activeProjects: 0,
        completedProjects: 0,
      },
      bids: {
        totalProjects: 0,
        platformRevenue: 0,
        receivedRevenue: 0,
        pendingRevenue: 0,
        activeProjects: 0,
        completedProjects: 0,
      },
    };

    let phaseAnalytics = {
      phase1: { total: 0, received: 0, pending: 0 },
      phase2: { total: 0, received: 0, pending: 0 },
      phase3: { total: 0, received: 0, pending: 0 },
      phase4: { total: 0, received: 0, pending: 0 },
      final: { total: 0, received: 0, pending: 0 },
    };

    const projectsList = [];

    // Trackers for Star Members
    const customerSpend = {};
    const companyRevenue = {};
    const workerRevenue = {};

    // Helper map to quickly find transactions for a given project ID
    const transactionsByProject = {};
    transactions.forEach((t) => {
      const pid = t.projectId ? t.projectId.toString() : null;
      if (pid) {
        if (!transactionsByProject[pid]) transactionsByProject[pid] = [];
        transactionsByProject[pid].push(t);
      }
    });

    // Populate construction projects
    constructionProjects.forEach((cp) => {
      const tA = cp.paymentDetails?.totalAmount || cp.proposal?.price || 0;
      const payouts = Array.isArray(cp.paymentDetails?.payouts)
        ? cp.paymentDetails.payouts
        : [];
      const pc = payouts.reduce(
        (sum, payout) => sum + Number(payout.platformFee || 0),
        0,
      );
      const prx = transactionsByProject[cp._id.toString()] || [];

      let rec = payouts
        .filter((payout) => payout.platformFeeStatus === "collected")
        .reduce((sum, payout) => sum + Number(payout.platformFee || 0), 0);
      let pend = payouts
        .filter((payout) => payout.platformFeeStatus === "pending")
        .reduce((sum, payout) => sum + Number(payout.platformFee || 0), 0);
      if (cp.status === "completed") {
        revenueByType.construction.completedProjects++;
        metrics.completedProjects++;
      } else if (cp.status === "ongoing" || cp.status === "accepted") {
        revenueByType.construction.activeProjects++;
        metrics.activeProjects++;
      }

      revenueByType.construction.totalProjects++;
      revenueByType.construction.platformRevenue += pc;
      revenueByType.construction.receivedRevenue += rec;
      revenueByType.construction.pendingRevenue += pend;

      metrics.totalPlatformRevenue += pc;
      metrics.receivedRevenue += rec;
      metrics.pendingRevenue += pend;

      // Track Star Members
      if (cp.customerId) {
        if (!customerSpend[cp.customerId._id])
          customerSpend[cp.customerId._id] = {
            user: cp.customerId,
            totalSpent: 0,
            projectsCount: 0,
          };
        customerSpend[cp.customerId._id].totalSpent += tA;
        customerSpend[cp.customerId._id].projectsCount += 1;
      }
      if (cp.companyId) {
        if (!companyRevenue[cp.companyId._id])
          companyRevenue[cp.companyId._id] = {
            user: cp.companyId,
            totalEarned: 0,
            platformGenerated: 0,
            projectsCount: 0,
          };
        companyRevenue[cp.companyId._id].totalEarned += tA - pc;
        companyRevenue[cp.companyId._id].platformGenerated += pc;
        companyRevenue[cp.companyId._id].projectsCount += 1;
      }

      // Extract phase analytics
      payouts.forEach((payout, idx) => {
        const key = idx < 4 ? `phase${idx + 1}` : null;
        if (!key || !phaseAnalytics[key]) return;
        const pf = Number(payout.platformFee || 0);
        phaseAnalytics[key].total += pf;
        if (payout.platformFeeStatus === "collected") {
          phaseAnalytics[key].received += pf;
        } else if (payout.platformFeeStatus === "pending") {
          phaseAnalytics[key].pending += pf;
        }
      });

      projectsList.push({
        _id: cp._id,
        createdAt: cp.createdAt,
        projectName:
          cp.projectName || cp.projectTitle || "Construction Project",
        projectType: "construction",
        status: cp.status,
        company: {
          name: cp.companyId?.companyName,
          contactPerson: cp.companyId?.contactPerson,
          email: cp.companyId?.email,
        },
        customer: {
          name: cp.customerId?.name,
          phone: cp.customerId?.phone,
          email: cp.customerId?.email,
        },
        totalAmount: tA,
        platformCommission: pc,
        receivedAmount: rec,
        pendingAmount: pend,
        transactions: prx,
        phaseBreakdown: cp.paymentDetails?.phases || [],
      });
    });

    // Populate Architect Hirings
    architectHirings.forEach((ah) => {
      const tA = ah.paymentDetails?.totalAmount || 0;
      const pc = ah.paymentDetails?.platformCommission || tA * 0.1;
      const prx = transactionsByProject[ah._id.toString()] || [];

      let rec = 0;
      let pend = pc;
      if (ah.status === "completed") {
        rec = pc;
        pend = 0;
        revenueByType.architect.completedProjects++;
        metrics.completedProjects++;
      } else {
        revenueByType.architect.activeProjects++;
        metrics.activeProjects++;
      }

      revenueByType.architect.totalProjects++;
      revenueByType.architect.platformRevenue += pc;
      revenueByType.architect.receivedRevenue += rec;
      revenueByType.architect.pendingRevenue += pend;

      metrics.totalPlatformRevenue += pc;
      metrics.receivedRevenue += rec;
      metrics.pendingRevenue += pend;

      // Track Star Members
      if (ah.customer) {
        if (!customerSpend[ah.customer._id])
          customerSpend[ah.customer._id] = {
            user: ah.customer,
            totalSpent: 0,
            projectsCount: 0,
          };
        customerSpend[ah.customer._id].totalSpent += tA;
        customerSpend[ah.customer._id].projectsCount += 1;
      }
      if (ah.worker) {
        if (!workerRevenue[ah.worker._id])
          workerRevenue[ah.worker._id] = {
            user: ah.worker,
            totalEarned: 0,
            platformGenerated: 0,
            projectsCount: 0,
          };
        workerRevenue[ah.worker._id].totalEarned += tA - pc;
        workerRevenue[ah.worker._id].platformGenerated += pc;
        workerRevenue[ah.worker._id].projectsCount += 1;
      }

      projectsList.push({
        _id: ah._id,
        createdAt: ah.createdAt,
        projectName: `Architect Design - ${ah.customer?.name || "Client"}`,
        projectType: "architect",
        status: ah.status,
        worker: {
          name: ah.worker?.name,
          email: ah.worker?.email,
          specialization: ah.worker?.specialization,
        },
        customer: {
          name: ah.customer?.name,
          phone: ah.customer?.phone,
          email: ah.customer?.email,
        },
        totalAmount: tA,
        platformCommission: pc,
        receivedAmount: rec,
        pendingAmount: pend,
        transactions: prx,
        workerAmount: ah.paymentDetails?.workerAmount || 0,
        roomType: ah.roomType || null,
      });
    });

    // Populate Design Requests
    designRequests.forEach((dr) => {
      const tA = dr.paymentDetails?.totalAmount || 0;
      const pc = dr.paymentDetails?.platformCommission || tA * 0.1;
      const prx = transactionsByProject[dr._id.toString()] || [];

      let rec = 0;
      let pend = pc;
      if (dr.status === "completed") {
        rec = pc;
        pend = 0;
        revenueByType.interior.completedProjects++;
        metrics.completedProjects++;
      } else {
        revenueByType.interior.activeProjects++;
        metrics.activeProjects++;
      }

      revenueByType.interior.totalProjects++;
      revenueByType.interior.platformRevenue += pc;
      revenueByType.interior.receivedRevenue += rec;
      revenueByType.interior.pendingRevenue += pend;

      metrics.totalPlatformRevenue += pc;
      metrics.receivedRevenue += rec;
      metrics.pendingRevenue += pend;

      // Track Star Members
      if (dr.customerId) {
        if (!customerSpend[dr.customerId._id])
          customerSpend[dr.customerId._id] = {
            user: dr.customerId,
            totalSpent: 0,
            projectsCount: 0,
          };
        customerSpend[dr.customerId._id].totalSpent += tA;
        customerSpend[dr.customerId._id].projectsCount += 1;
      }
      if (dr.workerId) {
        if (!workerRevenue[dr.workerId._id])
          workerRevenue[dr.workerId._id] = {
            user: dr.workerId,
            totalEarned: 0,
            platformGenerated: 0,
            projectsCount: 0,
          };
        workerRevenue[dr.workerId._id].totalEarned += tA - pc;
        workerRevenue[dr.workerId._id].platformGenerated += pc;
        workerRevenue[dr.workerId._id].projectsCount += 1;
      }

      projectsList.push({
        _id: dr._id,
        createdAt: dr.createdAt,
        projectName: `Interior Design - ${dr.customerId?.name || "Client"}`,
        projectType: "interior",
        status: dr.status,
        worker: {
          name: dr.workerId?.name,
          email: dr.workerId?.email,
          specialization: dr.workerId?.specialization,
        },
        customer: {
          name: dr.customerId?.name,
          phone: dr.customerId?.phone,
          email: dr.customerId?.email,
        },
        totalAmount: tA,
        platformCommission: pc,
        receivedAmount: rec,
        pendingAmount: pend,
        transactions: prx,
        workerAmount: dr.paymentDetails?.workerAmount || 0,
        roomType: dr.roomType || null,
      });
    });

    metrics.collectionRate = metrics.totalPlatformRevenue
      ? Math.round(
          (metrics.receivedRevenue / metrics.totalPlatformRevenue) * 100,
        )
      : 0;

    const monthlyMap = {};
    const typeMap = {
      construction: revenueByType.construction.platformRevenue,
      architect: revenueByType.architect.platformRevenue,
      interior: revenueByType.interior.platformRevenue,
      bid: 0,
      subscription_fee: 0,
    };

    transactions.forEach((t) => {
      const d = new Date(t.createdAt);
      const mId = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const mName = d.toLocaleString("default", {
        month: "short",
        year: "numeric",
      });

      if (!monthlyMap[mId])
        monthlyMap[mId] = {
          month: mName,
          ts: d.getTime(),
          revenue: 0,
          pending: 0,
        };

      const rev =
        t.transactionType === "platform_commission" ||
        t.transactionType === "platform_fee_collection" ||
        t.transactionType === "subscription_fee"
          ? t.amount || t.netAmount || 0
          : t.platformFee || 0;

      if (rev > 0) {
        monthlyMap[mId].revenue += rev;
        if (t.transactionType === "subscription_fee")
          typeMap.subscription_fee += rev;
        if (t.transactionType === "bid_fee") typeMap.bid += rev;
      }
    });

    const monthlyData = Object.values(monthlyMap)
      .sort((a, b) => a.ts - b.ts)
      .map((m) => ({ month: m.month, revenue: m.revenue }));

    // Find Top Contributors (Star Members)
    const topCustomer =
      Object.values(customerSpend).sort(
        (a, b) => b.totalSpent - a.totalSpent,
      )[0] || null;
    const topCompany =
      Object.values(companyRevenue).sort(
        (a, b) => b.platformGenerated - a.platformGenerated,
      )[0] || null;
    const topWorker =
      Object.values(workerRevenue).sort(
        (a, b) => b.platformGenerated - a.platformGenerated,
      )[0] || null;

    res.json({
      success: true,
      timeframe: timeframe || "all",
      metrics,
      revenueByType,
      phaseAnalytics,
      topContributors: {
        customer: topCustomer,
        company: topCompany,
        worker: topWorker,
      },
      projects: projectsList,
      charts: {
        monthlyRevenue:
          monthlyData.length > 0
            ? monthlyData
            : [{ month: "Current", revenue: metrics.totalPlatformRevenue }],
        revenueByType: [
          { name: "Construction", value: typeMap.construction || 0 },
          { name: "Architecture", value: typeMap.architect || 0 },
          { name: "Design/Interior", value: typeMap.interior || 0 },
          { name: "Bids", value: typeMap.bid || 0 },
          { name: "Subscriptions", value: typeMap.subscription_fee || 0 },
        ].filter((i) => i.value > 0),
      },
    });
  } catch (error) {
    console.error("Superadmin Details Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getPlatformRevenueIntelligence = async (req, res) => {
  try {
    const startedAt = process.hrtime.bigint();
    const {
      timeframe = "all",
      startDate,
      endDate,
      projectType = "all",
      feeStatus = "all",
      search = "",
      page = 1,
      limit = 20,
    } = req.query;

    const cacheKey = buildCacheKey("admin:platform-revenue-intelligence:v1", {
      timeframe,
      startDate,
      endDate,
      projectType,
      feeStatus,
      search,
      page,
      limit,
    });

    const cachedPayload = await getCacheJson(cacheKey);
    if (cachedPayload) {
      logRedisEndpointCache("hit", req.originalUrl, startedAt);
      return res.json(cachedPayload);
    }

    const now = new Date();
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        if (!Number.isNaN(start.getTime())) dateFilter.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (!Number.isNaN(end.getTime())) {
          end.setHours(23, 59, 59, 999);
          dateFilter.createdAt.$lte = end;
        }
      }
      if (Object.keys(dateFilter.createdAt).length === 0)
        delete dateFilter.createdAt;
    } else if (timeframe !== "all") {
      const start = new Date();
      if (timeframe === "week") start.setDate(now.getDate() - 7);
      else if (timeframe === "month") start.setMonth(now.getMonth() - 1);
      else if (timeframe === "quarter") start.setMonth(now.getMonth() - 3);
      else if (timeframe === "year") start.setFullYear(now.getFullYear() - 1);
      dateFilter = { createdAt: { $gte: start } };
    }

    const [
      constructionProjects,
      architectProjects,
      interiorProjects,
      transactions,
    ] = await Promise.all([
      ConstructionProjectSchema.find(dateFilter)
        .populate("customerId", "name email phone")
        .populate("companyId", "companyName contactPerson email")
        .lean(),
      ArchitectHiring.find(dateFilter)
        .populate("customer", "name email phone")
        .populate("worker", "name email specialization")
        .lean(),
      DesignRequest.find(dateFilter)
        .populate("customerId", "name email phone")
        .populate("workerId", "name email specialization")
        .lean(),
      Transaction.find({ ...dateFilter, status: { $ne: "failed" } })
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const projectRows = [];

    const pushProjectRow = (row) => {
      projectRows.push(row);
    };

    constructionProjects.forEach((project) => {
      const payouts = Array.isArray(project?.paymentDetails?.payouts)
        ? project.paymentDetails.payouts
        : [];
      const totalFee = payouts.reduce(
        (sum, p) => sum + Number(p.platformFee || 0),
        0,
      );
      const collected = payouts
        .filter((p) => p.platformFeeStatus === "collected")
        .reduce((sum, p) => sum + Number(p.platformFee || 0), 0);
      const pending = payouts
        .filter((p) => p.platformFeeStatus === "pending")
        .reduce((sum, p) => sum + Number(p.platformFee || 0), 0);
      const yetToCome = payouts
        .filter((p) => (p.platformFeeStatus || "not_due") === "not_due")
        .reduce((sum, p) => sum + Number(p.platformFee || 0), 0);

      pushProjectRow({
        projectId: project._id,
        projectType: "construction",
        projectName: project.projectName || "Construction Project",
        fromParty: project.companyId?.companyName || "Company",
        fromPartyType: "company",
        toParty: "Platform",
        customerName: project.customerId?.name || "Customer",
        totalFee,
        collected,
        pending,
        yetToCome,
        status: project.status,
        feeTimeline: payouts.map((payout, index) => ({
          label: payout.phaseName || `Phase ${index + 1}`,
          milestonePercentage: Number(
            payout.milestonePercentage || (index + 1) * 25,
          ),
          platformFee: Number(payout.platformFee || 0),
          feeStatus: payout.platformFeeStatus || "not_due",
          collectedAt: payout.platformFeeCollectedAt || null,
          invoiceUrl: payout.platformFeeInvoiceUrl || null,
        })),
      });
    });

    const workerProjectRowsBuilder = (project, type) => {
      const milestones = Array.isArray(
        project?.paymentDetails?.milestonePayments,
      )
        ? project.paymentDetails.milestonePayments
        : [];
      const totalFee = milestones.reduce(
        (sum, m) => sum + Number(m.platformFee || 0),
        0,
      );
      const collected = milestones
        .filter((m) => (m.platformFeeStatus || "not_due") === "collected")
        .reduce((sum, m) => sum + Number(m.platformFee || 0), 0);
      const pending = milestones
        .filter((m) => (m.platformFeeStatus || "not_due") === "pending")
        .reduce((sum, m) => sum + Number(m.platformFee || 0), 0);
      const yetToCome = milestones
        .filter((m) => (m.platformFeeStatus || "not_due") === "not_due")
        .reduce((sum, m) => sum + Number(m.platformFee || 0), 0);

      pushProjectRow({
        projectId: project._id,
        projectType: type,
        projectName:
          project.projectName ||
          (type === "architect" ? "Architect Project" : "Interior Project"),
        fromParty:
          (type === "architect"
            ? project.worker?.name
            : project.workerId?.name) || "Worker",
        fromPartyType: "worker",
        toParty: "Platform",
        customerName:
          (type === "architect"
            ? project.customer?.name
            : project.customerId?.name) || "Customer",
        totalFee,
        collected,
        pending,
        yetToCome,
        status: project.status,
        feeTimeline: milestones.map((milestone, index) => ({
          label: `${Number(milestone.percentage || (index + 1) * 25)}% Milestone`,
          milestonePercentage: Number(milestone.percentage || (index + 1) * 25),
          platformFee: Number(milestone.platformFee || 0),
          feeStatus: milestone.platformFeeStatus || "not_due",
          collectedAt: milestone.platformFeeCollectedAt || null,
          invoiceUrl: null,
        })),
      });
    };

    architectProjects.forEach((project) =>
      workerProjectRowsBuilder(project, "architect"),
    );
    interiorProjects.forEach((project) =>
      workerProjectRowsBuilder(project, "interior"),
    );

    let filteredProjects = projectRows;
    if (projectType !== "all") {
      filteredProjects = filteredProjects.filter(
        (row) => row.projectType === projectType,
      );
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filteredProjects = filteredProjects.filter(
        (row) =>
          String(row.projectName || "")
            .toLowerCase()
            .includes(q) ||
          String(row.fromParty || "")
            .toLowerCase()
            .includes(q) ||
          String(row.customerName || "")
            .toLowerCase()
            .includes(q),
      );
    }

    const getLifecycleStatus = (row) => {
      if (row.pending > 0) return "pending";
      if (row.yetToCome > 0) return "yet_to_come";
      if (row.collected > 0) return "collected";
      return "none";
    };

    if (feeStatus !== "all") {
      filteredProjects = filteredProjects.filter(
        (row) => getLifecycleStatus(row) === feeStatus,
      );
    }

    const statusBreakdown = {
      collected: filteredProjects.reduce(
        (sum, row) => sum + Number(row.collected || 0),
        0,
      ),
      pending: filteredProjects.reduce(
        (sum, row) => sum + Number(row.pending || 0),
        0,
      ),
      yetToCome: filteredProjects.reduce(
        (sum, row) => sum + Number(row.yetToCome || 0),
        0,
      ),
    };

    const typeBreakdownMap = {
      construction: { collected: 0, pending: 0, yetToCome: 0 },
      architect: { collected: 0, pending: 0, yetToCome: 0 },
      interior: { collected: 0, pending: 0, yetToCome: 0 },
    };
    filteredProjects.forEach((row) => {
      if (!typeBreakdownMap[row.projectType]) return;
      typeBreakdownMap[row.projectType].collected += Number(row.collected || 0);
      typeBreakdownMap[row.projectType].pending += Number(row.pending || 0);
      typeBreakdownMap[row.projectType].yetToCome += Number(row.yetToCome || 0);
    });

    const invoiceMap = {};
    constructionProjects.forEach((project) => {
      (project.paymentDetails?.payouts || []).forEach((payout) => {
        const key = `${project._id}_${Number(payout.milestonePercentage || 0)}`;
        invoiceMap[key] = payout.platformFeeInvoiceUrl || null;
      });
    });

    const relatedTransactions = transactions.filter((transaction) => {
      const txType = transaction.transactionType;
      const allowed = [
        "platform_fee_due",
        "platform_fee_collection",
        "platform_commission",
        "escrow_hold",
        "milestone_release",
      ].includes(txType);
      if (!allowed) return false;
      if (projectType !== "all" && transaction.projectType !== projectType)
        return false;
      return true;
    });

    const monthlyMap = {};
    relatedTransactions.forEach((transaction) => {
      const dt = new Date(transaction.createdAt);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyMap[key]) {
        monthlyMap[key] = {
          month: dt.toLocaleString("default", {
            month: "short",
            year: "numeric",
          }),
          ts: dt.getTime(),
          collected: 0,
          pending: 0,
        };
      }
      const amount = Number(transaction.platformFee || transaction.amount || 0);
      if (
        transaction.transactionType === "platform_fee_collection" ||
        transaction.transactionType === "platform_commission"
      ) {
        monthlyMap[key].collected += amount;
      } else if (transaction.transactionType === "platform_fee_due") {
        monthlyMap[key].pending += amount;
      }
    });

    const detailedTransactions = relatedTransactions.map((transaction) => {
      const txProjectType = transaction.projectType || "unknown";
      const txMilestone = Number(transaction.milestonePercentage || 0);
      const invoiceKey = `${transaction.projectId}_${txMilestone}`;
      const feeStatusValue =
        transaction.transactionType === "platform_fee_collection" ||
        transaction.transactionType === "platform_commission"
          ? "collected"
          : transaction.transactionType === "platform_fee_due"
            ? "pending"
            : "flow";

      return {
        _id: transaction._id,
        createdAt: transaction.createdAt,
        projectId: transaction.projectId,
        projectType: txProjectType,
        milestonePercentage: txMilestone || null,
        transactionType: transaction.transactionType,
        amount: Number(transaction.amount || 0),
        platformFee: Number(transaction.platformFee || 0),
        netAmount: Number(transaction.netAmount || 0),
        status: transaction.status,
        paymentMethod: transaction.paymentMethod || "na",
        description: transaction.description || "",
        fromPartyType: transaction.companyId
          ? "company"
          : transaction.workerId
            ? "worker"
            : transaction.customerId
              ? "customer"
              : "system",
        toPartyType: "platform",
        feeStatus: feeStatusValue,
        invoiceUrl:
          txProjectType === "construction"
            ? invoiceMap[invoiceKey] || null
            : null,
        razorpayOrderId: transaction.razorpayOrderId || null,
        razorpayPaymentId: transaction.razorpayPaymentId || null,
      };
    });

    const offset = (Number(page) - 1) * Number(limit);
    const paginatedTransactions = detailedTransactions.slice(
      offset,
      offset + Number(limit),
    );

    const responsePayload = {
      success: true,
      filters: {
        timeframe,
        startDate: startDate || null,
        endDate: endDate || null,
        projectType,
        feeStatus,
        search,
        page: Number(page),
        limit: Number(limit),
      },
      metrics: {
        totalCollected: statusBreakdown.collected,
        totalPending: statusBreakdown.pending,
        totalYetToCome: statusBreakdown.yetToCome,
        totalExpected:
          statusBreakdown.collected +
          statusBreakdown.pending +
          statusBreakdown.yetToCome,
        activeFeeProjects: filteredProjects.filter(
          (row) => row.pending > 0 || row.yetToCome > 0,
        ).length,
        totalTrackedProjects: filteredProjects.length,
        collectionRate:
          statusBreakdown.collected +
            statusBreakdown.pending +
            statusBreakdown.yetToCome >
          0
            ? Math.round(
                (statusBreakdown.collected /
                  (statusBreakdown.collected +
                    statusBreakdown.pending +
                    statusBreakdown.yetToCome)) *
                  100,
              )
            : 0,
      },
      charts: {
        monthlyFeeFlow: Object.values(monthlyMap)
          .sort((a, b) => a.ts - b.ts)
          .map((m) => ({
            month: m.month,
            collected: m.collected,
            pending: m.pending,
          })),
        feeStatusDistribution: [
          { name: "Collected", value: statusBreakdown.collected },
          { name: "Pending", value: statusBreakdown.pending },
          { name: "Yet To Come", value: statusBreakdown.yetToCome },
        ],
        feeByProjectType: [
          {
            type: "Construction",
            collected: typeBreakdownMap.construction.collected,
            pending: typeBreakdownMap.construction.pending,
            yetToCome: typeBreakdownMap.construction.yetToCome,
          },
          {
            type: "Architect",
            collected: typeBreakdownMap.architect.collected,
            pending: typeBreakdownMap.architect.pending,
            yetToCome: typeBreakdownMap.architect.yetToCome,
          },
          {
            type: "Interior",
            collected: typeBreakdownMap.interior.collected,
            pending: typeBreakdownMap.interior.pending,
            yetToCome: typeBreakdownMap.interior.yetToCome,
          },
        ],
      },
      projects: filteredProjects,
      transactions: {
        total: detailedTransactions.length,
        page: Number(page),
        limit: Number(limit),
        items: paginatedTransactions,
      },
    };

    await setCacheJson(cacheKey, responsePayload, 180);
    logRedisEndpointCache("miss", req.originalUrl, startedAt);

    res.json(responsePayload);
  } catch (error) {
    console.error("Platform revenue intelligence error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getRedisCacheStatsAdmin = async (_req, res) => {
  try {
    const stats = getRedisCacheStats();
    res.json({ success: true, stats });
  } catch (error) {
    console.error("Get Redis cache stats error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const resetRedisCacheStatsAdmin = async (_req, res) => {
  try {
    const before = getRedisCacheStats();
    resetRedisCacheStats();
    const after = getRedisCacheStats();

    res.json({
      success: true,
      message: "Redis cache stats reset successfully",
      before,
      after,
    });
  } catch (error) {
    console.error("Reset Redis cache stats error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAdminDashboard,
  deleteCustomer,
  deleteCompany,
  deleteWorker,
  deleteArchitectHiring,
  deleteConstructionProject,
  deleteDesignRequest,
  deleteBid,
  deleteJobApplication,
  getCustomerDetail,
  getCustomerFullDetail,
  getCompanyDetail,
  getCompanyFullDetail,
  getWorkerDetail,
  getWorkerFullDetail,
  getArchitectHiringDetail,
  getArchitectHiringFullDetail,
  getConstructionProjectDetail,
  getConstructionProjectFullDetail,
  getDesignRequestDetail,
  getDesignRequestFullDetail,
  getBidDetail,
  getJobApplicationDetail,
  verifyCompany,
  rejectCompany,
  verifyWorker,
  rejectWorker,
  getAdminRevenue,
  getPlatformRevenueIntelligence,
  getRedisCacheStatsAdmin,
  resetRedisCacheStatsAdmin,
};
