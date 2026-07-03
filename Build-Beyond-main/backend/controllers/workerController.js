const {
  Worker,
  ArchitectHiring,
  DesignRequest,
  Company,
  CompanytoWorker,
  WorkerToCompany,
  ConstructionProjectSchema,
} = require("../models");
const mongoose = require("mongoose");
const ChatRoom = require("../models/chatModel");
const { findOrCreateChatRoom } = require("./chatController");
const bcrypt = require("bcrypt");
const {
  buildCacheKey,
  getCacheJson,
  setCacheJson,
  logRedisEndpointCache,
  invalidateCacheByPrefix,
} = require("../utils/redisCache");

const WORKER_ONGOING_CACHE_PREFIX = "worker:ongoing-projects:v1";

const invalidateWorkerOngoingProjectsCache = async (workerId) => {
  try {
    if (!workerId) return;
    await invalidateCacheByPrefix(
      buildCacheKey(WORKER_ONGOING_CACHE_PREFIX, { workerId }),
    );
  } catch (error) {
    console.error(
      "Failed to invalidate worker ongoing projects cache:",
      error.message,
    );
  }
};

const getJobs = async (req, res) => {
  try {
    if (!req.user || !req.user.user_id) {
      return res.status(401).json({ error: "Unauthorized: User not found" });
    }

    const worker = await Worker.findById(req.user.user_id).lean();

    if (!worker) {
      return res.status(404).json({ error: "Worker not found" });
    }

    if (worker.isArchitect) {
      const Jobs = await ArchitectHiring.find({
        worker: req.user.user_id,
        status: { $in: ["Pending", "Proposal Sent"] },
      }).sort({ updatedAt: -1 });
      // routed file : worker/worker_jobs
      return res
        .status(200)
        .json({ user: worker, jobOffers: Jobs, activePage: "jobs" });
    } else {
      const Jobs = await DesignRequest.find({
        workerId: req.user.user_id,
        status: { $in: ["pending", "proposal_sent"] },
      }).sort({ updatedAt: -1 });
      // routed file : worker/InteriorDesigner_Jobs
      return res
        .status(200)
        .json({ user: worker, jobs: Jobs, activePage: "jobs" });
    }
  } catch (error) {
    console.error("Error fetching accepted projects:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getJoinCompany = async (req, res) => {
  try {
    const workerId = req.user.user_id;
    const { search, location, specialization } = req.query;

    const companyFilter = {};
    if (search) {
      companyFilter.$or = [
        { companyName: { $regex: search, $options: "i" } },
        { specialization: { $regex: search, $options: "i" } },
      ];
    }
    if (location) {
      companyFilter["location.city"] = location;
    }
    if (specialization) {
      companyFilter.specialization = specialization;
    }

    const user = await Worker.findById(workerId).lean();
    const companies = await Company.find(companyFilter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const offers = await CompanytoWorker.find({
      worker: workerId,
      status: "Pending",
    })
      .populate(
        "company",
        "companyName description aboutCompany location specialization size yearsInBusiness currentOpenings whyJoinUs",
      )
      .sort({ createdAt: -1 })
      .lean();
    const jobApplications = await WorkerToCompany.find({
      workerId: workerId,
    }).lean();

    const isEmployed =
      (await CompanytoWorker.findOne({
        worker: workerId,
        status: "Accepted",
      })) ||
      (await WorkerToCompany.findOne({
        workerId: workerId,
        status: "Accepted",
      }));

    // routed file : worker/workers_join_company
    res.status(200).json({
      user,
      companies,
      offers,
      jobApplications,
      activePage: "join",
      query: req.query,
      isEmployed: !!isEmployed,
    });
  } catch (error) {
    console.error("Error fetching data for Join Company page:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const getSettings = async (req, res) => {
  const user = await Worker.findById(req.user.user_id);
  // routed file : worker/worker_settings
  res.status(200).json({ user });
};

const getEditProfile = (req, res) => {
  // routed file : worker/worker_profile_edit
  res.status(200).json({ view: "worker/worker_profile_edit" });
};

const getDashboard = async (req, res) => {
  try {
    if (!req.user || !req.user.user_id)
      return res
        .status(401)
        .json({ error: "Unauthorized: User not authenticated" });

    const workerId = req.user.user_id;
    const worker = await Worker.findById(workerId).lean();
    if (!worker) return res.status(404).json({ error: "Worker not found" });

    let jobsQuery;
    if (worker.isArchitect) {
      jobsQuery = ArchitectHiring.find({ worker: workerId, status: "Pending" })
        .sort({ createdAt: -1 })
        .limit(3)
        .lean();
    } else {
      jobsQuery = DesignRequest.find({ workerId: workerId, status: "pending" })
        .sort({ createdAt: -1 })
        .limit(3)
        .lean();
    }

    const [offers, companies, jobs, offerCount, applicationCount] =
      await Promise.all([
        CompanytoWorker.find({ worker: workerId, status: "Pending" })
          .populate("company", "companyName")
          .sort({ createdAt: -1 })
          .limit(3)
          .lean(),
        Company.find({}).sort({ createdAt: -1 }).limit(3).lean(),
        jobsQuery,
        CompanytoWorker.countDocuments({ worker: workerId, status: "Pending" }),
        WorkerToCompany.countDocuments({
          workerId: workerId,
          status: "Pending",
        }),
      ]);

    const enhancedJobs = jobs.map((job) => {
      if (worker.isArchitect) {
        return {
          ...job,
          projectName: job.projectName,
          address: job.customerAddress
            ? `${job.customerAddress.city}, ${job.customerAddress.state}`
            : "Not specified",
          projectDescription:
            job.designRequirements.specialFeatures ||
            "No special features described.",
          timeline: "Varies",
          budget: job.additionalDetails.budget
            ? parseFloat(job.additionalDetails.budget.replace(/[^0-9.-]+/g, ""))
            : "TBD",
        };
      } else {
        const roomType =
          job.roomType || job.roomType === 0
            ? String(job.roomType).toLowerCase()
            : null;
        let timeline = null;
        if (roomType === "residential") timeline = "2 weeks";
        else if (roomType === "commercial") timeline = "1 month";
        else if (roomType) timeline = "TBD";

        let budget = null;
        try {
          const length =
            job.roomSize && typeof job.roomSize.length === "number"
              ? job.roomSize.length
              : null;
          const width =
            job.roomSize && typeof job.roomSize.width === "number"
              ? job.roomSize.width
              : null;
          if (length != null && width != null) {
            budget = Math.round(length * width * 1000);
          }
        } catch (e) {
          budget = null;
        }

        return { ...job, timeline: timeline || "Not specified", budget };
      }
    });

    // routed file : worker/worker_dashboard
    res.status(200).json({
      workerName: worker.name || "Builder",
      offers,
      companies,
      jobs: enhancedJobs,
      user: worker,
      activePage: "dashboard",
      stats: {
        pendingOffers: offerCount,
        activeApplications: applicationCount,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res
      .status(500)
      .json({
        error: "Dashboard Loading Failed",
        details: process.env.NODE_ENV === "development" ? error : {},
      });
  }
};

const getWorkerById = async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id)
      .select(
        "name email title rating about specialties projects contact location linkedin previousWork profileImage",
      )
      .lean();
    if (!worker) return res.status(404).json({ error: "Worker not found" });
    worker.profileImage =
      worker.profileImage ||
      `https://api.dicebear.com/9.x/male/svg?seed=${encodeURIComponent(worker.name.replace(/\s+/g, ""))}&mouth=smile`;
    res.json(worker);
  } catch (err) {
    console.error("Error fetching worker:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const deleteWorkerRequest = async (req, res) => {
  try {
    const request = await WorkerToCompany.findOneAndDelete({
      _id: req.params.id,
      companyId: req.user.user_id,
      status: "pending",
    });
    if (!request)
      return res
        .status(404)
        .json({ error: "Request not found or cannot be cancelled" });
    res.json({ message: "Request cancelled successfully" });
  } catch (err) {
    console.error("Error cancelling request:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const createWorkerRequest = async (req, res) => {
  try {
    const workerId = req.user.user_id;

    const isEmployed =
      (await CompanytoWorker.findOne({
        worker: workerId,
        status: "Accepted",
      })) ||
      (await WorkerToCompany.findOne({
        workerId: workerId,
        status: "Accepted",
      }));
    if (isEmployed) {
      return res
        .status(403)
        .json({
          error:
            "You are already employed and cannot apply for another company.",
        });
    }
    const {
      fullName,
      email,
      location,
      linkedin,
      experience,
      expectedSalary,
      positionApplying,
      primarySkills,
      workExperience,
      termsAgree,
    } = req.body;

    const resolvedCompanyId = req.params.companyId;

    if (
      !fullName ||
      !email ||
      !location ||
      !experience ||
      !expectedSalary ||
      !positionApplying ||
      !primarySkills ||
      !workExperience ||
      !termsAgree ||
      !workerId ||
      !resolvedCompanyId ||
      !req.file
    ) {
      return res.status(400).json({
        error: "Missing required fields",
        missing: {
          fullName: !fullName,
          email: !email,
          location: !location,
          experience: !experience,
          expectedSalary: !expectedSalary,
          positionApplying: !positionApplying,
          primarySkills: !primarySkills,
          workExperience: !workExperience,
          termsAgree: !termsAgree,
          workerId: !workerId,
          companyId: !resolvedCompanyId,
          resume: !req.file,
        },
      });
    }

    if (!mongoose.Types.ObjectId.isValid(resolvedCompanyId)) {
      return res.status(400).json({ error: "Invalid companyId format" });
    }

    const company = await Company.findById(resolvedCompanyId);
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    const compName = company.name || company.companyName;
    const skillsArray = primarySkills.split(",").map((s) => s.trim());

    const jobApplication = new WorkerToCompany({
      fullName,
      email,
      location,
      linkedin: linkedin || null,
      experience: parseInt(experience),
      expectedSalary: parseInt(expectedSalary),
      positionApplying,
      primarySkills: skillsArray,
      workExperience,
      resume: req.file.path,
      termsAgree: termsAgree === "true" || termsAgree === true,
      workerId,
      companyId: resolvedCompanyId,
      compName,
    });

    await jobApplication.save();
    res.status(200).json({ success: true, redirect: "/workerjoin_company" });
  } catch (error) {
    console.error("Error in createWorkerRequest:", {
      message: error.message,
      stack: error.stack,
      body: req.body,
      file: req.file,
    });
    if (error.name === "MulterError") {
      return res.status(400).json({ error: `Multer error: ${error.message}` });
    }
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json({ error: `Validation error: ${error.message}` });
    }
    res
      .status(500)
      .json({
        error: "Server error while processing application",
        details: error.message,
      });
  }
};

const updateWorkerProfile = async (req, res) => {
  try {
    const workerId = req.user.user_id;
    const {
      name,
      email,
      phone,
      title,
      experience,
      about,
      specialties,
      languages,
      expectedPrice,
    } = req.body;

    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ message: "Worker not found." });
    }

    // Basic fields
    worker.name = name || worker.name;
    worker.email = email || worker.email;
    worker.phone = phone || worker.phone;
    worker.professionalTitle = title || worker.professionalTitle;
    if (experience !== undefined) {
      const expNum = isNaN(Number(experience))
        ? worker.experience
        : Number(experience);
      worker.experience = expNum;
    }
    worker.about = about || worker.about;
    worker.expectedPrice = expectedPrice || worker.expectedPrice;

    // Arrays: specialties and languages (accept comma-separated or array)
    const toArray = (val) =>
      Array.isArray(val)
        ? val.filter(Boolean)
        : typeof val === "string"
          ? val
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean)
          : [];

    worker.specialties = toArray(specialties);
    worker.languages = toArray(languages);

    // Files
    const allFiles = Array.isArray(req.files) ? req.files : [];
    const firstByField = (field) => allFiles.find((f) => f.fieldname === field);
    const manyByField = (field) =>
      allFiles.filter((f) => f.fieldname === field);

    // Profile image
    const profileImageFile = firstByField("profileImage");
    if (profileImageFile) {
      worker.profileImage = profileImageFile.path;
    }

    // Previously worked companies (repeatable)
    const previousCompanies = [];
    let c = 1;
    while (req.body[`companyName-${c}`] || req.body[`companyLocation-${c}`]) {
      const companyName = req.body[`companyName-${c}`];
      const location = req.body[`companyLocation-${c}`];
      const role = req.body[`companyRole-${c}`];
      const duration = req.body[`companyDuration-${c}`];
      const proofs = manyByField(`companyProof-${c}`).map((f) => f.path);
      if (companyName || location || role || duration || proofs.length) {
        previousCompanies.push({
          companyName,
          location,
          role,
          duration,
          proofs,
        });
      }
      c++;
    }
    if (previousCompanies.length) {
      worker.previousCompanies = previousCompanies;
    }

    // Projects (repeatable)
    const projects = [];
    let i = 1;
    while (
      req.body[`projectName-${i}`] ||
      req.body[`projectYear-${i}`] ||
      req.body[`projectYearRange-${i}`] ||
      req.body[`projectLocation-${i}`] ||
      req.body[`projectDescription-${i}`]
    ) {
      const nameVal = req.body[`projectName-${i}`];
      const yearVal = req.body[`projectYear-${i}`];
      const yearRangeVal = req.body[`projectYearRange-${i}`];
      const locationVal = req.body[`projectLocation-${i}`];
      const descriptionVal = req.body[`projectDescription-${i}`];
      const imageSingle = firstByField(`projectImage-${i}`)?.path; // backward compatibility
      const imagesMulti = manyByField(`projectImages-${i}`).map((f) => f.path);
      const invoice = firstByField(`projectInvoice-${i}`)?.path;

      const existing =
        worker.projects && worker.projects[i - 1] ? worker.projects[i - 1] : {};
      projects.push({
        name: nameVal || existing.name,
        year: yearVal ? Number(yearVal) : existing.year,
        yearRange: yearRangeVal || existing.yearRange,
        location: locationVal || existing.location,
        description: descriptionVal || existing.description,
        image: imageSingle || existing.image,
        images: imagesMulti.length ? imagesMulti : existing.images || [],
        invoiceOrCertificate: invoice || existing.invoiceOrCertificate,
      });
      i++;
    }
    if (projects.length > 0) {
      worker.projects = projects;
    }

    await worker.save();

    res
      .status(200)
      .json({
        message: "Profile updated successfully!",
        redirect: "/workersettings",
      });
  } catch (error) {
    console.error("Error updating worker profile:", error);
    res.status(500).json({ message: "Server error while updating profile." });
  }
};

const updateAvailability = async (req, res) => {
  try {
    const workerId = req.user.user_id;
    const { availability } = req.body;

    if (!["available", "busy", "unavailable"].includes(availability)) {
      return res.status(400).json({ message: "Invalid availability status." });
    }

    await Worker.findByIdAndUpdate(workerId, { availability });
    res
      .status(200)
      .json({ success: true, message: "Availability updated successfully." });
  } catch (error) {
    console.error("Error updating availability:", error);
    res
      .status(500)
      .json({ message: "Server error while updating availability." });
  }
};

const acceptOffer = async (req, res, next) => {
  try {
    const offer = await CompanytoWorker.findById(req.params.id);
    if (!offer || offer.worker.toString() !== req.user.user_id) {
      const err = new Error("Offer not found or you are not authorized.");
      err.status = 404;
      return next(err);
    }
    offer.status = "Accepted";
    await offer.save();
    await findOrCreateChatRoom(offer._id, "hiring");
    res.status(200).json({ success: true, redirect: "/worker/my-company" });
  } catch (error) {
    console.error("Error accepting offer:", error);
    next(error);
  }
};

const declineOffer = async (req, res, next) => {
  try {
    const offer = await CompanytoWorker.findById(req.params.id);
    if (!offer || offer.worker.toString() !== req.user.user_id) {
      const err = new Error("Offer not found or you are not authorized.");
      err.status = 404;
      return next(err);
    }
    offer.status = "Denied";
    await offer.save();
    res.status(200).json({ success: true, redirect: "/workerjoin_company" });
  } catch (error) {
    console.error("Error declining offer:", error);
    next(error);
  }
};

const updateJobStatus = async (req, res) => {
  try {
    const { id } = req.params;
    let { status, type } = req.body;
    const workerId = req.user.user_id;

    if (!["Accepted", "Rejected"].includes(status)) {
      return res.status(400).json({ success: false, error: "Invalid status" });
    }

    let job;

    if (type === "architect") {
      job = await ArchitectHiring.findById(id);
      if (!job || (job.worker && job.worker.toString() !== workerId)) {
        return res
          .status(404)
          .json({ success: false, error: "Job not found or unauthorized" });
      }
    } else if (type === "interior") {
      status = status.toLowerCase();
      job = await DesignRequest.findById(id);
      if (!job || (job.workerId && job.workerId.toString() !== workerId)) {
        return res
          .status(404)
          .json({ success: false, error: "Job not found or unauthorized" });
      }
    } else {
      return res
        .status(400)
        .json({ success: false, error: "Invalid job type" });
    }

    job.status = status;
    await job.save();

    if (status === "Accepted" || status === "accepted") {
      await findOrCreateChatRoom(job._id, type);
    }

    await invalidateWorkerOngoingProjectsCache(workerId);

    res.json({
      success: true,
      message: `Job has been ${status.toLowerCase()}.`,
    });
  } catch (error) {
    console.error(`Error updating ${req.body.type} job status:`, error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

const getOngoingProjects = async (req, res) => {
  try {
    const startedAt = process.hrtime.bigint();
    const workerId = req.user.user_id;

    const cacheKey = buildCacheKey(WORKER_ONGOING_CACHE_PREFIX, {
      workerId,
    });
    const cachedPayload = await getCacheJson(cacheKey);
    if (cachedPayload) {
      logRedisEndpointCache("hit", req.originalUrl, startedAt);
      return res.status(200).json(cachedPayload);
    }

    const worker = await Worker.findById(workerId).lean();
    if (!worker) {
      return res.status(404).json({ error: "Worker not found" });
    }

    let allProjects = [];
    let rawProjects = [];

    if (worker.isArchitect) {
      rawProjects = await ArchitectHiring.find({
        worker: workerId,
        status: { $in: ["Accepted", "Completed", "Rejected"] },
      }).lean();

      allProjects = await Promise.all(
        rawProjects.map(async (project) => {
          if (project.status === "Accepted") {
            const chatRoom = await findOrCreateChatRoom(
              project._id,
              "architect",
            );
            return {
              ...project,
              projectType: "architect",
              chatId: chatRoom ? chatRoom.roomId : null,
            };
          }
          return { ...project, projectType: "architect", chatId: null };
        }),
      );
    } else {
      rawProjects = await DesignRequest.find({
        workerId: workerId,
        status: { $in: ["accepted", "completed", "rejected"] },
      }).lean();

      allProjects = await Promise.all(
        rawProjects.map(async (project) => {
          if (project.status === "accepted") {
            const chatRoom = await findOrCreateChatRoom(
              project._id,
              "interior",
            );
            return {
              ...project,
              projectType: "interior",
              chatId: chatRoom ? chatRoom.roomId : null,
            };
          }
          return { ...project, projectType: "interior", chatId: null };
        }),
      );
    }

    const responsePayload = {
      user: worker,
      projects: allProjects,
      activePage: "ongoing",
    };
    await setCacheJson(cacheKey, responsePayload, 90);
    logRedisEndpointCache("miss", req.originalUrl, startedAt);

    // routed file : worker/worker_ongoing_projects
    res.status(200).json(responsePayload);
  } catch (error) {
    console.error("Error fetching ongoing projects:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

const postProjectUpdate = async (req, res) => {
  try {
    const { projectId, projectType, updateText } = req.body;
    const workerId = req.user.user_id;

    let project;
    const newUpdate = { updateText, createdAt: new Date() };
    if (req.file) {
      newUpdate.updateImage = req.file.path;
    }

    if (projectType === "architect") {
      project = await ArchitectHiring.findById(projectId);
      if (
        !project ||
        (project.worker && project.worker.toString() !== workerId)
      ) {
        return res
          .status(404)
          .json({ error: "Project not found or unauthorized." });
      }
    } else if (projectType === "interior") {
      project = await DesignRequest.findById(projectId);
      if (
        !project ||
        (project.workerId && project.workerId.toString() !== workerId)
      ) {
        return res
          .status(404)
          .json({ error: "Project not found or unauthorized." });
      }
    } else {
      return res.status(400).json({ error: "Invalid project type." });
    }

    project.projectUpdates.unshift(newUpdate);
    await project.save();
    await invalidateWorkerOngoingProjectsCache(workerId);
    res
      .status(200)
      .json({ success: true, redirect: "/worker/ongoing-projects" });
  } catch (error) {
    console.error("Error posting project update:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

const markProjectAsCompleted = async (req, res) => {
  try {
    const { projectId, projectType } = req.body;
    const workerId = req.user.user_id;

    let project;
    if (projectType === "architect") {
      project = await ArchitectHiring.findById(projectId);
      if (!project || project.worker.toString() !== workerId) {
        return res
          .status(404)
          .json({ error: "Project not found or unauthorized." });
      }
      project.status = "Completed";
    } else if (projectType === "interior") {
      project = await DesignRequest.findById(projectId);
      if (!project || project.workerId.toString() !== workerId) {
        return res
          .status(404)
          .json({ error: "Project not found or unauthorized." });
      }
      project.status = "completed";
    } else {
      return res.status(400).json({ error: "Invalid project type." });
    }

    await project.save();
    await invalidateWorkerOngoingProjectsCache(workerId);
    res
      .status(200)
      .json({ success: true, redirect: "/worker/ongoing-projects" });
  } catch (error) {
    console.error("Error marking project as completed:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

const submitProposal = async (req, res) => {
  try {
    const { projectId, projectType, price, description } = req.body;
    const workerId = req.user.user_id;

    if (!projectId || !projectType || !price || !description) {
      return res
        .status(400)
        .json({ error: "Missing required proposal fields." });
    }

    let project;

    if (projectType === "architect") {
      project = await ArchitectHiring.findById(projectId);
      if (
        !project ||
        (project.worker && project.worker.toString() !== workerId)
      ) {
        return res
          .status(404)
          .json({ error: "Project not found or you are not authorized." });
      }

      // Check if proposal already exists - allow resubmission only if new price is lower
      if (project.proposal && project.proposal.sentAt) {
        const newPrice = parseFloat(price);
        const oldPrice = parseFloat(project.proposal.price);

        if (newPrice >= oldPrice) {
          return res.status(400).json({
            error: `You can only resubmit with a lower price. Current: ₹${oldPrice.toLocaleString()}, Your new quote: ₹${newPrice.toLocaleString()}`,
            alreadySubmitted: true,
            currentPrice: oldPrice,
          });
        }

        // Store old proposal in history
        if (!project.proposalHistory) {
          project.proposalHistory = [];
        }
        project.proposalHistory.push({
          price: project.proposal.price,
          description: project.proposal.description,
          sentAt: project.proposal.sentAt,
        });
      }

      project.status = "Proposal Sent";
    } else if (projectType === "interior") {
      project = await DesignRequest.findById(projectId);
      if (
        !project ||
        (project.workerId && project.workerId.toString() !== workerId)
      ) {
        return res
          .status(404)
          .json({ error: "Project not found or you are not authorized." });
      }

      // Check if proposal already exists - allow resubmission only if new price is lower
      if (project.proposal && project.proposal.sentAt) {
        const newPrice = parseFloat(price);
        const oldPrice = parseFloat(project.proposal.price);

        if (newPrice >= oldPrice) {
          return res.status(400).json({
            error: `You can only resubmit with a lower price. Current: ₹${oldPrice.toLocaleString()}, Your new quote: ₹${newPrice.toLocaleString()}`,
            alreadySubmitted: true,
            currentPrice: oldPrice,
          });
        }

        // Store old proposal in history
        if (!project.proposalHistory) {
          project.proposalHistory = [];
        }
        project.proposalHistory.push({
          price: project.proposal.price,
          description: project.proposal.description,
          sentAt: project.proposal.sentAt,
        });
      }

      project.status = "proposal_sent";
    } else {
      return res.status(400).json({ error: "Invalid project type." });
    }

    project.proposal = {
      price: parseFloat(price),
      description: description,
      sentAt: new Date(),
    };

    await project.save();
    await invalidateWorkerOngoingProjectsCache(workerId);
    res.status(200).json({ success: true, redirect: "/workerjobs" });
  } catch (error) {
    console.error("Error submitting proposal:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

const updatePassword = async (req, res) => {
  try {
    const workerId = req.user.user_id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Both current and new passwords are required." });
    }

    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ message: "Worker not found." });
    }

    const isMatch = await bcrypt.compare(currentPassword, worker.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password." });
    }

    const isSameAsOld = await bcrypt.compare(newPassword, worker.password);
    if (isSameAsOld) {
      return res.status(400).json({ message: "New password cannot be same as current password." });
    }

    worker.password = newPassword;
    await worker.save();

    res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ message: "Server error while updating password." });
  }
};

const getMyCompany = async (req, res) => {
  try {
    const workerId = req.user.user_id;
    const user = await Worker.findById(workerId).lean();
    if (!user) {
      return res.status(404).json({ error: "Worker not found" });
    }

    let company, acceptedRequest;

    acceptedRequest = await CompanytoWorker.findOne({
      worker: workerId,
      status: "Accepted",
    })
      .populate("company", "companyName location")
      .lean();

    if (!acceptedRequest) {
      acceptedRequest = await WorkerToCompany.findOne({
        workerId: workerId,
        status: "accepted",
      })
        .populate("companyId", "companyName location")
        .lean();
      if (acceptedRequest) {
        acceptedRequest.company = acceptedRequest.companyId;
      }
    }

    if (!acceptedRequest) {
      // routed file : worker/my_company
      return res
        .status(200)
        .json({ user, company: null, projects: [], chatId: null });
    }

    company = acceptedRequest.company;
    const projects = await ConstructionProjectSchema.find({
      companyId: company._id,
      status: "accepted",
    })
      .select("projectName status")
      .lean();

    let chatId = null;
    try {
      const projectId = acceptedRequest._id;
      let chatRoom = await ChatRoom.findOne({
        projectId: projectId,
        projectType: "hiring",
      }).populate("messages.sender");

      if (!chatRoom) {
        const roomId = `company-hiring-${projectId}`;
        chatRoom = new ChatRoom({
          roomId,
          workerId: workerId,
          companyId: company._id,
          projectId: projectId,
          projectType: "hiring",
        });
        await chatRoom.save();
        console.log("New company chat room created:", roomId);
      } else {
        console.log("Existing company chat room found:", chatRoom.roomId);
      }

      chatId = chatRoom.roomId;
    } catch (chatError) {
      console.error("Error setting up company chat room:", chatError);
    }

    // routed file : worker/my_company
    res.status(200).json({ user, company, projects, chatId });
  } catch (error) {
    console.error("Error fetching my company:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

const leaveCompany = async (req, res) => {
  try {
    const workerId = req.user.user_id;
    const statusRegex = new RegExp("^Accepted$", "i");

    await CompanytoWorker.findOneAndDelete({
      worker: workerId,
      status: statusRegex,
    });
    await WorkerToCompany.findOneAndDelete({
      workerId: workerId,
      status: statusRegex,
    });

    res.status(200).json({ success: true, redirect: "/worker/my-company" });
  } catch (error) {
    console.error("Error leaving company:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

const submitMilestone = async (req, res) => {
  try {
    const { projectId, projectType, percentage, description } = req.body;
    const workerId = req.user.user_id;

    // Validate required fields
    if (!projectId || !projectType || !percentage || !description) {
      return res
        .status(400)
        .json({
          error:
            "Missing required fields: projectId, projectType, percentage, description",
        });
    }

    // Validate percentage
    const milestonePercentage = parseInt(percentage);
    if (![25, 50, 75, 100].includes(milestonePercentage)) {
      return res
        .status(400)
        .json({ error: "Milestone percentage must be 25, 50, 75, or 100" });
    }

    let project;

    // Find project based on type
    if (projectType === "architect") {
      project = await ArchitectHiring.findById(projectId);
      if (
        !project ||
        (project.worker && project.worker.toString() !== workerId)
      ) {
        return res
          .status(404)
          .json({ error: "Project not found or you are not authorized." });
      }
    } else if (projectType === "interior") {
      project = await DesignRequest.findById(projectId);
      if (
        !project ||
        (project.workerId && project.workerId.toString() !== workerId)
      ) {
        return res
          .status(404)
          .json({ error: "Project not found or you are not authorized." });
      }
    } else {
      return res
        .status(400)
        .json({
          error: 'Invalid project type. Must be "architect" or "interior".',
        });
    }

    if (milestonePercentage > 25 && project?.paymentDetails?.milestonePayments?.length) {
      const previousPercentage = milestonePercentage - 25;
      const previousPayment = project.paymentDetails.milestonePayments.find(
        (payment) => Number(payment.percentage) === previousPercentage,
      );

      if (previousPayment && (previousPayment.platformFeeStatus || "not_due") !== "collected") {
        return res.status(400).json({
          error: `Cannot move to ${milestonePercentage}% milestone until ${previousPercentage}% milestone platform fee is collected.`,
        });
      }
    }

    // Check if milestone with this percentage already exists
    const existingMilestone = project.milestones.find(
      (m) => m.percentage === milestonePercentage,
    );
    if (existingMilestone) {
      // Allow resubmission only if status is "Revision Requested" or "Rejected"
      if (
        existingMilestone.status === "Revision Requested" ||
        existingMilestone.status === "Rejected"
      ) {
        // Update the existing milestone
        existingMilestone.description = description;
        existingMilestone.status = "Pending";
        existingMilestone.submittedAt = new Date();

        // Update image if new one is uploaded
        if (req.file) {
          existingMilestone.image = req.file.path;
        }

        // Clear previous rejection/revision data
        existingMilestone.rejectedAt = undefined;
        existingMilestone.rejectionReason = undefined;
        existingMilestone.revisionRequestedAt = undefined;
        existingMilestone.revisionNotes = undefined;

        await project.save();
        await invalidateWorkerOngoingProjectsCache(workerId);

        return res.status(200).json({
          success: true,
          message: "Milestone resubmitted successfully!",
          milestone: existingMilestone,
        });
      } else {
        return res.status(400).json({
          error: `A milestone for ${milestonePercentage}% already exists with status "${existingMilestone.status}". You can only resubmit rejected or revision-requested milestones.`,
        });
      }
    }

    // Create new milestone object
    const newMilestone = {
      percentage: milestonePercentage,
      description: description,
      status: "Pending",
      submittedAt: new Date(),
    };

    // Add image if uploaded
    if (req.file) {
      newMilestone.image = req.file.path;
    }

    // Add milestone to project
    project.milestones.push(newMilestone);
    await project.save();
    await invalidateWorkerOngoingProjectsCache(workerId);

    res.status(200).json({
      success: true,
      message: "Milestone submitted successfully!",
      milestone: newMilestone,
    });
  } catch (error) {
    console.error("Error submitting milestone:", error);
    res.status(500).json({ error: "Server Error while submitting milestone" });
  }
};

module.exports = {
  getJobs,
  getJoinCompany,
  getSettings,
  getEditProfile,
  getDashboard,
  getWorkerById,
  deleteWorkerRequest,
  createWorkerRequest,
  updateWorkerProfile,
  updateAvailability,
  acceptOffer,
  declineOffer,
  updateJobStatus,
  getOngoingProjects,
  postProjectUpdate,
  markProjectAsCompleted,
  submitProposal,
  updatePassword,
  getMyCompany,
  leaveCompany,
  submitMilestone,
};
