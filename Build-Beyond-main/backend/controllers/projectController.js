const mongoose = require("mongoose");
const {
  ArchitectHiring,
  ConstructionProjectSchema,
  DesignRequest,
  Bid,
  CompanytoWorker,
  WorkerToCompany,
  Complaint,
} = require("../models");
const upload = require("../middlewares/upload").upload;

const parseArchitectFloorRequirements = (body) => {
  const jsonValue = body.floorRequirements;
  if (jsonValue) {
    try {
      const parsed =
        typeof jsonValue === "string" ? JSON.parse(jsonValue) : jsonValue;
      if (Array.isArray(parsed)) {
        return parsed
          .map((floor, index) => ({
            floorNumber: Number(floor.floorNumber || index + 1),
            details: (floor.details || "").toString(),
          }))
          .filter((floor) => floor.floorNumber > 0);
      }
    } catch (error) {
      // Fall through to bracket-format parsing
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

const submitArchitect = async (req, res) => {
  try {
    const customer = req.user.user_id;
    const worker =
      req.body.workerId && req.body.workerId !== ""
        ? new mongoose.Types.ObjectId(req.body.workerId)
        : null;
    const {
      projectName,
      fullName,
      contactNumber,
      email,
      streetAddress,
      city,
      state,
      zipCode,
      plotLocation,
      plotSize,
      plotOrientation,
      designType,
      numFloors,
      floorRequirements,
      specialFeatures,
      architecturalStyle,
      budget,
      completionDate,
    } = req.body;

    const parsedFloorRequirements = parseArchitectFloorRequirements(req.body);

    const referenceImages =
      req.files && req.files.length > 0
        ? req.files.map((file) => ({
            url: file.path,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
          }))
        : [];

    const architectHiring = new ArchitectHiring({
      projectName,
      status: "Pending",
      customer,
      worker,
      customerDetails: { fullName, contactNumber, email },
      customerAddress: { streetAddress, city, state, zipCode },
      plotInformation: { plotLocation, plotSize, plotOrientation },
      designRequirements: {
        designType,
        numFloors,
        floorRequirements: parsedFloorRequirements.map((floor, index) => ({
          floorNumber: floor.floorNumber || index + 1,
          details: floor.details || "",
        })),
        specialFeatures,
        architecturalStyle,
      },
      additionalDetails: {
        budget,
        completionDate: completionDate ? new Date(completionDate) : undefined,
        referenceImages,
      },
    });

    await architectHiring.save();
    res
      .status(200)
      .json({ message: "Form submitted successfully", redirect: "/architect" });
  } catch (error) {
    console.error("Error in /architect_submit:", error);
    res
      .status(400)
      .json({ message: error.message || "Failed to submit design request" });
  }
};

const submitDesignRequest = async (req, res) => {
  try {
    const customer = req.user.user_id;
    const worker =
      req.body.workerId && req.body.workerId !== ""
        ? new mongoose.Types.ObjectId(req.body.workerId)
        : null;
    const {
      projectName,
      fullName,
      email,
      phone,
      address,
      roomType,
      roomLength,
      roomWidth,
      dimensionUnit,
      ceilingHeight,
      heightUnit,
      designPreference,
      projectDescription,
    } = req.body;

    console.log("=== Design Request Debug ===");
    console.log("Received workerId:", req.body.workerId);
    console.log("Converted worker ObjectId:", worker);

    if (
      !projectName ||
      !fullName ||
      !email ||
      !phone ||
      !address ||
      !roomType ||
      !roomLength ||
      !roomWidth ||
      !dimensionUnit
    )
      return res.status(400).json({ error: "Missing required fields" });

    const currentRoomImages = req.files
      .filter((file) => file.fieldname === "currentRoomImages")
      .map((file) => file.path);
    const inspirationImages = req.files
      .filter((file) => file.fieldname === "inspirationImages")
      .map((file) => file.path);

    const designRequest = new DesignRequest({
      projectName,
      fullName,
      email,
      phone,
      address,
      roomType,
      roomSize: {
        length: parseFloat(roomLength),
        width: parseFloat(roomWidth),
        unit: dimensionUnit,
      },
      ceilingHeight: ceilingHeight
        ? { height: parseFloat(ceilingHeight), unit: heightUnit }
        : undefined,
      designPreference,
      projectDescription,
      currentRoomImages,
      customerId: customer,
      inspirationImages,
      workerId: worker,
    });
    await designRequest.save();

    console.log("Design request saved with workerId:", designRequest.workerId);

    res.status(201).json({
      message: "Design request submitted successfully",
      success: true,
    });
  } catch (error) {
    res.status(500).json({ error: "Server error", success: false });
  }
};

const submitConstructionForm = async (req, res) => {
  try {
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
      companyId,
    } = req.body;
    const customerId = req.user.user_id;
    const floors = [];
    for (let i = 1; i <= parseInt(totalFloors); i++) {
      const floorType = req.body[`floorType-${i}`];
      const floorArea = req.body[`floorArea-${i}`];
      const floorDescription = req.body[`floorDescription-${i}`];
      const floorImageFile = req.files.find(
        (file) => file.fieldname === `floorImage-${i}`,
      );
      const floorImagePath = floorImageFile ? floorImageFile.path : "";
      floors.push({
        floorNumber: i,
        floorType,
        floorArea,
        floorDescription,
        floorImagePath,
      });
    }
    const siteFilepaths = req.files
      .filter((file) => file.fieldname === "siteFiles")
      .map((file) => file.path);
    const newProject = new ConstructionProjectSchema({
      projectName,
      customerName,
      customerEmail,
      customerPhone,
      projectAddress,
      projectLocationPincode: projectLocation,
      totalArea,
      buildingType,
      estimatedBudget,
      projectTimeline,
      totalFloors,
      floors,
      specialRequirements,
      accessibilityNeeds,
      energyEfficiency,
      siteFilepaths,
      companyId,
      customerId,
    });
    await newProject.save();
    res.status(201).json({
      success: true,
      message: "Project submitted successfully",
      projectId: newProject._id,
    });
  } catch (error) {
    console.error("Error submitting project:", error);
    res.status(500).json({
      success: false,
      message: "Error submitting project",
      error: error.message,
    });
  }
};

const getProjects = async (req, res) => {
  try {
    const projects = await ConstructionProjectSchema.find({
      status: "pending",
    }).lean();
    // routed file : projects
    res.status(200).json({ projects });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
};

const getProjectById = async (req, res) => {
  try {
    const project = await ConstructionProjectSchema.findById(
      req.params.id,
    ).lean();
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    res.status(500).json({ error: "Failed to fetch project" });
  }
};

const getEditProject = async (req, res) => {
  try {
    const project = await ConstructionProjectSchema.findById(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    // routed file : company/addnewproject_form
    res.status(200).json({ project });
  } catch (error) {
    console.error("Error fetching project:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const updateProject = async (req, res) => {
  try {
    const {
      projectId,
      completionPercentage, // fallback support from older clients
      targetCompletionDate,
      currentPhase,
      updates,
      milestonePercentage,
      milestoneMessage,
    } = req.body;

    if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }
    const project = await ConstructionProjectSchema.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    // Handle milestone updates with validation
    if (milestonePercentage) {
      const milestonePercent = parseInt(milestonePercentage);
      const checkpoints = [25, 50, 75, 100];
      const isCheckpoint = checkpoints.includes(milestonePercent);

      // Message is required only for checkpoint values
      if (isCheckpoint && !milestoneMessage) {
        return res
          .status(400)
          .json({
            message: `Checkpoint ${milestonePercent}% requires a message for the customer.`,
          });
      }

      // Check if milestone is valid
      if (milestonePercent < 0 || milestonePercent > 100) {
        return res
          .status(400)
          .json({
            message: "Invalid milestone percentage. Must be between 0 and 100.",
          });
      }

      // Check if this is an update to a checkpoint that needs revision
      const checkpointNeedingRevision = project.milestones.find(
        (m) =>
          m.percentage === milestonePercent &&
          m.isCheckpoint &&
          m.needsRevision,
      );

      // Check for backward progression (allow same percentage if checkpoint needs revision)
      const maxCompletedPercentage = project.completionPercentage || 0;

      if (
        !checkpointNeedingRevision &&
        milestonePercent < maxCompletedPercentage
      ) {
        return res.status(400).json({
          message: `Cannot move backward. Current progress is at ${maxCompletedPercentage}%. Please select a higher percentage.`,
        });
      }

      // Find the last checkpoint that needs approval
      const lastApprovedCheckpoint = checkpoints.reduce(
        (lastApproved, checkpoint) => {
          const checkpointMilestone = project.milestones.find(
            (m) => m.percentage === checkpoint && m.isCheckpoint,
          );
          if (checkpointMilestone && checkpointMilestone.isApprovedByCustomer) {
            return checkpoint;
          }
          return lastApproved;
        },
        0,
      );

      // Find next checkpoint that needs approval
      const nextCheckpoint =
        checkpoints.find((c) => c > lastApprovedCheckpoint) || 100;

      const previousCheckpoints = checkpoints.filter(
        (checkpoint) => checkpoint < milestonePercent,
      );
      const blockedCheckpoint = previousCheckpoints.find((checkpoint) => {
        const payout = (project.paymentDetails?.payouts || []).find(
          (entry) => Number(entry.milestonePercentage) === Number(checkpoint),
        );
        return (
          payout &&
          payout.status === "released" &&
          payout.platformFeeStatus === "pending"
        );
      });

      if (blockedCheckpoint) {
        return res.status(400).json({
          message: `Cannot proceed beyond ${blockedCheckpoint}%. The platform fee for that phase is still pending collection.`,
        });
      }

      // Check if trying to cross a checkpoint without approval
      if (milestonePercent > nextCheckpoint) {
        const pendingCheckpoint = project.milestones.find(
          (m) =>
            m.percentage === nextCheckpoint &&
            m.isCheckpoint &&
            !m.isApprovedByCustomer,
        );

        if (pendingCheckpoint) {
          return res.status(400).json({
            message: `Cannot proceed beyond ${nextCheckpoint}%. The ${nextCheckpoint}% checkpoint needs customer approval first.`,
          });
        }

        return res.status(400).json({
          message: `Cannot proceed beyond ${nextCheckpoint}%. You must reach the ${nextCheckpoint}% checkpoint and get customer approval first.`,
        });
      }

      // If this is a checkpoint, check if it exists
      if (isCheckpoint) {
        const existingCheckpoint = project.milestones.find(
          (m) => m.percentage === milestonePercent && m.isCheckpoint,
        );

        if (existingCheckpoint) {
          // If checkpoint exists and needs revision or was auto-generated, allow update
          if (
            existingCheckpoint.needsRevision ||
            existingCheckpoint.isAutoGenerated
          ) {
            // Add company response to conversation
            existingCheckpoint.conversation =
              existingCheckpoint.conversation || [];
            existingCheckpoint.conversation.push({
              sender: "company",
              message: milestoneMessage,
              timestamp: new Date(),
            });
            // Update the existing checkpoint message
            existingCheckpoint.companyMessage = milestoneMessage;
            existingCheckpoint.needsRevision = false;
            existingCheckpoint.isAutoGenerated = false;
            existingCheckpoint.customerFeedback = "";
            existingCheckpoint.submittedAt = new Date();
          } else if (existingCheckpoint.isApprovedByCustomer) {
            // Already approved, cannot update
            return res.status(400).json({
              message: `Checkpoint ${milestonePercent}% has already been approved by the customer. Cannot update.`,
            });
          } else {
            // Still pending approval, cannot resubmit
            return res.status(400).json({
              message: `Checkpoint ${milestonePercent}% has already been submitted and is awaiting customer approval.`,
            });
          }
        } else {
          // New checkpoint - add it
          project.milestones.push({
            percentage: milestonePercent,
            companyMessage:
              milestoneMessage || `Progress update to ${milestonePercent}%`,
            isApprovedByCustomer: false,
            needsRevision: false,
            submittedAt: new Date(),
            isCheckpoint: isCheckpoint,
            conversation: [
              {
                sender: "company",
                message:
                  milestoneMessage || `Progress update to ${milestonePercent}%`,
                timestamp: new Date(),
              },
            ],
          });
        }
      } else {
        // Non-checkpoint milestone, just add it if message provided
        if (milestoneMessage) {
          project.milestones.push({
            percentage: milestonePercent,
            companyMessage: milestoneMessage,
            isApprovedByCustomer: false,
            needsRevision: false,
            submittedAt: new Date(),
            isCheckpoint: false,
            conversation: [
              {
                sender: "company",
                message: milestoneMessage,
                timestamp: new Date(),
              },
            ],
          });
        }
      }

      // Update completion percentage
      project.completionPercentage = milestonePercent;
    }

    // Determine incoming progress value (support legacy completionPercentage field)
    const incomingProgressRaw = milestonePercentage ?? completionPercentage;
    if (
      incomingProgressRaw !== undefined &&
      incomingProgressRaw !== null &&
      incomingProgressRaw !== ""
    ) {
      const progressValue = parseInt(incomingProgressRaw, 10);
      if (Number.isNaN(progressValue)) {
        return res
          .status(400)
          .json({ message: "Progress value must be a number." });
      }
      if (progressValue < 0 || progressValue > 100) {
        return res
          .status(400)
          .json({ message: "Progress must be between 0 and 100." });
      }

      const checkpoints = [25, 50, 75, 100];
      const isCheckpoint = checkpoints.includes(progressValue);

      // Floor = highest checkpoint reached (approved or not)
      const reachedCheckpoints = project.milestones
        .filter((m) => m.isCheckpoint)
        .map((m) => m.percentage);
      const floor = reachedCheckpoints.length
        ? Math.max(...reachedCheckpoints)
        : 0;
      const nextCheckpoint = checkpoints.find((c) => c > floor) || 100;

      // Cannot go below floor
      if (progressValue < floor) {
        return res
          .status(400)
          .json({
            message: `Progress cannot go below ${floor}% (last checkpoint).`,
          });
      }
      // Cannot exceed next checkpoint band
      if (progressValue > nextCheckpoint) {
        return res
          .status(400)
          .json({
            message: `You may adjust only between ${floor}% and ${nextCheckpoint}%. Reach ${nextCheckpoint}% to create the checkpoint.`,
          });
      }

      // Require message at checkpoint
      if (isCheckpoint && !milestoneMessage) {
        return res
          .status(400)
          .json({
            message: `Please include a message for the ${progressValue}% checkpoint.`,
          });
      }

      if (isCheckpoint) {
        const existingCheckpoint = project.milestones.find(
          (m) => m.isCheckpoint && m.percentage === progressValue,
        );
        if (!existingCheckpoint) {
          // Create new checkpoint
          project.milestones.push({
            percentage: progressValue,
            companyMessage: milestoneMessage,
            isApprovedByCustomer: false,
            submittedAt: new Date(),
            isCheckpoint: true,
            needsRevision: false,
          });
        } else {
          // Allow re-submission if customer requested revision
          if (existingCheckpoint.needsRevision) {
            existingCheckpoint.companyMessage = milestoneMessage;
            existingCheckpoint.submittedAt = new Date();
            existingCheckpoint.needsRevision = false;
            existingCheckpoint.customerFeedback = undefined;
            existingCheckpoint.feedbackAt = undefined;
          } else if (project.completionPercentage !== progressValue) {
            // Duplicate checkpoint attempt that differs from stored completion -> block
            return res
              .status(400)
              .json({
                message: `Checkpoint ${progressValue}% already recorded and waiting for customer review.`,
              });
          }
          // else allow silent re-save without duplicating milestone
        }
      } else if (milestoneMessage) {
        // Non-checkpoint progress update with an optional message recorded as recent update
        project.recentUpdates.push({
          updateText: milestoneMessage,
          updateImagePath: null,
          createdAt: new Date(),
        });
      }

      // Set current completion
      project.completionPercentage = progressValue;
    }

    if (targetCompletionDate)
      project.targetCompletionDate = new Date(targetCompletionDate);
    if (currentPhase) project.currentPhase = currentPhase;

    if (req.files && req.files.mainImage)
      project.mainImagePath = req.files.mainImage[0].path.replace(/\\/g, "/");
    if (req.files && req.files.additionalImages)
      project.additionalImagePaths = req.files.additionalImages.map((file) =>
        file.path.replace(/\\/g, "/"),
      );

    // Handle completion images when project reaches 100%
    if (
      req.files &&
      req.files.completionImages &&
      project.completionPercentage === 100
    ) {
      const completionImagePaths = req.files.completionImages.map((file) =>
        file.path.replace(/\\/g, "/"),
      );
      // Append to existing completion images or create new array
      if (project.completionImages && project.completionImages.length > 0) {
        project.completionImages = [
          ...project.completionImages,
          ...completionImagePaths,
        ];
      } else {
        project.completionImages = completionImagePaths;
      }
    }

    if (updates) {
      const updateImages =
        req.files && req.files.updateImages ? req.files.updateImages : [];
      const updatesArray = Array.isArray(updates) ? updates : [updates];
      project.recentUpdates = updatesArray.map((updateText, index) => ({
        updateText: updateText || "",
        updateImagePath: updateImages[0]
          ? updateImages[0].path.replace(/\\/g, "/")
          : null,
        createdAt: new Date(),
      }));
    }

    await project.save();
    res.status(200).json({ message: "Project updated successfully", project });
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const submitBid = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { bidPrice, bidId } = req.body;
    const companyId = req.user.user_id;
    const company = await Company.findById(companyId).session(session);
    if (!company) throw new Error("Company not found");
    const bidProject = await Bid.findById(bidId).session(session);
    if (!bidProject) throw new Error("Bid not found");

    const hasExistingBid = bidProject.companyBids.some(
      (bid) => bid.companyId.toString() === companyId.toString(),
    );
    if (hasExistingBid) {
      await Bid.updateOne(
        { _id: bidId, "companyBids.companyId": companyId },
        {
          $set: {
            "companyBids.$.bidPrice": Number(bidPrice),
            "companyBids.$.bidDate": new Date(),
          },
        },
        { session },
      );
    } else {
      const newBid = {
        companyId,
        companyName: company.companyName,
        bidPrice: Number(bidPrice),
        bidDate: new Date(),
      };
      await Bid.updateOne(
        { _id: bidId },
        { $push: { companyBids: newBid } },
        { session },
      );
    }

    await session.commitTransaction();
    session.endSession();
    res.status(200).json({
      success: true,
      message: "Bid submitted successfully",
      redirect: `/companybids?bidId=${bidId}&success=bid_submitted`,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error submitting bid:", error);
    res.status(500).json({
      error: "Server error",
      redirect: `/companybids?error=server_error`,
    });
  }
};

const acceptBid = async (req, res) => {
  try {
    const { bidId, companyBidId } = req.body;
    const customerId = req.user.user_id;
    const bid = await Bid.findOne({ _id: bidId, customerId });
    if (!bid)
      return res.status(404).json({ error: "Bid not found or unauthorized" });
    const companyBid = bid.companyBids.id(companyBidId);
    if (!companyBid)
      return res.status(404).json({ error: "Company bid not found" });

    // Update bid status
    bid.status = "awarded";
    bid.winningBidId = companyBidId;
    await bid.save();

    // Create a corresponding ConstructionProject so it appears in ongoing_projects
    const platformFeeRate = 5; // 5% platform fee
    const totalAmount = companyBid.bidPrice;
    const platformFee = (totalAmount * platformFeeRate) / 100;

    const constructionProject = new ConstructionProjectSchema({
      projectName: bid.projectName,
      status: "accepted", // Set to accepted so it appears in ongoing_projects
      customerId: bid.customerId,
      companyId: companyBid.companyId,
      customerName: bid.customerName,
      customerEmail: bid.customerEmail,
      customerPhone: bid.customerPhone,
      projectAddress: bid.projectAddress,
      projectLocationPincode: bid.projectLocation,
      totalArea: bid.totalArea,
      buildingType: bid.buildingType,
      estimatedBudget: bid.estimatedBudget,
      projectTimeline: bid.projectTimeline,
      totalFloors: bid.totalFloors,
      floors: bid.floors,
      specialRequirements: bid.specialRequirements,
      accessibilityNeeds: bid.accessibilityNeeds,
      energyEfficiency: bid.energyEfficiency,
      siteFilepaths: bid.siteFiles || [],
      paymentDetails: {
        totalAmount: totalAmount,
        platformFee: platformFee,
        platformFeeRate: platformFeeRate,
        paymentStatus: "unpaid",
        payouts: [],
      },
      proposal: {
        price: totalAmount,
        description: `Bid accepted from ${companyBid.companyName}`,
        phases: [],
        sentAt: new Date(),
      },
    });

    await constructionProject.save();

    res.json({
      success: true,
      message: "Bid accepted successfully",
      projectId: constructionProject._id,
    });
  } catch (error) {
    console.error("Error accepting bid:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const declineBid = async (req, res) => {
  try {
    const { bidId, companyBidId } = req.body;
    const customerId = req.user.user_id;
    const bid = await Bid.findOne({ _id: bidId, customerId });
    if (!bid)
      return res.status(404).json({ error: "Bid not found or unauthorized" });
    const companyBid = bid.companyBids.id(companyBidId);
    if (!companyBid)
      return res.status(404).json({ error: "Company bid not found" });
    companyBid.status = "rejected";
    companyBid.statusChangedAt = Date.now();
    await bid.save();
    res.json({ success: true, message: "Bid declined successfully" });
  } catch (error) {
    console.error("Error declining bid:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const acceptWorkerRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    const request = await WorkerToCompany.findOne({
      _id: requestId,
      companyId: req.user.user_id,
    });
    if (!request)
      return res
        .status(404)
        .json({ error: "Request not found or not authorized" });
    request.status = "accepted";
    await request.save();
    res.status(200).json({ message: "Request accepted successfully" });
  } catch (err) {
    console.error("Error accepting request:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const rejectWorkerRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    const request = await WorkerToCompany.findOne({
      _id: requestId,
      companyId: req.user.user_id,
    });
    if (!request)
      return res
        .status(404)
        .json({ error: "Request not found or not authorized" });
    request.status = "rejected";
    await request.save();
    res.status(200).json({ message: "Request rejected successfully" });
  } catch (err) {
    console.error("Error rejecting request:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const approveMilestone = async (req, res) => {
  try {
    const { projectId, milestonePercentage } = req.body;
    const customerId = req.user.user_id;

    if (!projectId || !milestonePercentage) {
      return res
        .status(400)
        .json({ error: "Project ID and milestone percentage are required" });
    }

    const project = await ConstructionProjectSchema.findOne({
      _id: projectId,
      customerId: customerId,
    });

    if (!project) {
      return res
        .status(404)
        .json({
          error: "Project not found or you don't have permission to approve",
        });
    }

    const milestone = project.milestones.find(
      (m) => m.percentage === parseInt(milestonePercentage),
    );

    if (!milestone) {
      return res
        .status(404)
        .json({ error: `Milestone ${milestonePercentage}% not found` });
    }

    if (milestone.isApprovedByCustomer) {
      return res.status(400).json({ error: "Milestone already approved" });
    }

    milestone.isApprovedByCustomer = true;
    milestone.approvedAt = new Date();
    milestone.needsRevision = false;
    milestone.customerFeedback = undefined;

    await project.save();

    let paymentReleaseInfo = null;
    try {
      const { releaseCompanyMilestonePayment } = require("./paymentController");
      paymentReleaseInfo = await new Promise((resolve, reject) => {
        const mockReq = {
          body: {
            projectId,
            milestonePercentage: Number(milestonePercentage),
          },
        };

        const mockRes = {
          json: (data) => resolve(data),
          status: () => ({
            json: (data) => reject(data),
          }),
        };

        releaseCompanyMilestonePayment(mockReq, mockRes).catch(reject);
      });
    } catch (paymentError) {
      console.error("Error releasing company milestone payment:", paymentError);
    }

    res.status(200).json({
      success: true,
      message:
        paymentReleaseInfo?.message ||
        `Milestone ${milestonePercentage}% approved successfully`,
      milestone,
      paymentInfo: paymentReleaseInfo?.data || null,
    });
  } catch (error) {
    console.error("Error approving milestone:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const requestMilestoneRevision = async (req, res) => {
  try {
    const { projectId, milestonePercentage, feedback } = req.body;
    const customerId = req.user.user_id;

    if (!projectId || !milestonePercentage) {
      return res
        .status(400)
        .json({ error: "Project ID and milestone percentage are required" });
    }

    if (!feedback || feedback.trim() === "") {
      return res
        .status(400)
        .json({ error: "Please provide feedback for the revision request" });
    }

    const project = await ConstructionProjectSchema.findOne({
      _id: projectId,
      customerId: customerId,
    });

    if (!project) {
      return res
        .status(404)
        .json({ error: "Project not found or you don't have permission" });
    }

    const milestone = project.milestones.find(
      (m) => m.percentage === parseInt(milestonePercentage) && m.isCheckpoint,
    );

    if (!milestone) {
      return res
        .status(404)
        .json({ error: `Checkpoint ${milestonePercentage}% not found` });
    }

    if (milestone.isApprovedByCustomer) {
      return res
        .status(400)
        .json({
          error: "Cannot request revision for already approved milestone",
        });
    }

    milestone.needsRevision = true;
    milestone.customerFeedback = feedback;

    // Add customer feedback to conversation
    milestone.conversation = milestone.conversation || [];
    milestone.conversation.push({
      sender: "customer",
      message: feedback,
      timestamp: new Date(),
    });

    await project.save();

    res.status(200).json({
      success: true,
      message: `Revision requested for ${milestonePercentage}% milestone. Company can now update their message.`,
      milestone,
    });
  } catch (error) {
    console.error("Error requesting milestone revision:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const resolvePhaseForPercentage = (project, milestonePercentage) => {
  const phases = project?.proposal?.phases;
  if (!Array.isArray(phases) || phases.length === 0) return null;
  const index = Math.min(
    Math.max(Math.floor(milestonePercentage / 25) - 1, 0),
    phases.length - 1,
  );
  return phases[index] || null;
};

const payMilestone = async (req, res) => {
  try {
    const { projectId, milestonePercentage, paymentStage } = req.body;
    const customerId = req.user.user_id;

    if (!projectId || milestonePercentage === undefined || !paymentStage) {
      return res
        .status(400)
        .json({
          error:
            "Project ID, milestone percentage, and payment stage are required",
        });
    }

    // Validate payment stage
    const validStages = ["upfront", "completion", "final"];
    if (!validStages.includes(paymentStage)) {
      return res
        .status(400)
        .json({
          error:
            "Invalid payment stage. Must be: upfront, completion, or final",
        });
    }

    const milestonePercent = parseInt(milestonePercentage, 10);
    if (Number.isNaN(milestonePercent)) {
      return res
        .status(400)
        .json({ error: "Milestone percentage must be a number" });
    }

    const project = await ConstructionProjectSchema.findOne({
      _id: projectId,
      customerId: customerId,
    });

    if (!project) {
      return res
        .status(404)
        .json({ error: "Project not found or you don't have permission" });
    }

    let milestone = project.milestones.find(
      (m) => m.percentage === milestonePercent && m.isCheckpoint,
    );
    if (!milestone) {
      // Allow upfront payment for initial phase (25%) even before milestone submission
      if (milestonePercent === 25 && paymentStage === "upfront") {
        milestone = {
          percentage: milestonePercent,
          companyMessage: "Upfront payment initiated by customer",
          isApprovedByCustomer: false,
          needsRevision: false,
          submittedAt: new Date(),
          isCheckpoint: true,
          isAutoGenerated: true,
          conversation: [
            {
              sender: "customer",
              message: "Upfront payment initiated by customer",
              timestamp: new Date(),
            },
          ],
        };
        project.milestones.push(milestone);
        milestone = project.milestones[project.milestones.length - 1];
      } else {
        return res
          .status(404)
          .json({ error: `Milestone ${milestonePercent}% not found` });
      }
    }

    if (
      !milestone.isApprovedByCustomer &&
      !(paymentStage === "upfront" && milestonePercent === 25)
    ) {
      return res
        .status(400)
        .json({ error: "Milestone must be approved before payment" });
    }

    // Get the phase information
    const phase = resolvePhaseForPercentage(project, milestonePercent);
    const phaseAmount =
      phase?.amount ||
      (project.proposal?.price * (phase?.percentage || 25)) / 100;

    if (!phaseAmount || phaseAmount <= 0) {
      return res
        .status(400)
        .json({
          error: "Unable to calculate payout amount for this milestone",
        });
    }

    const isFinalPhase = phase?.isFinal === true;

    // Initialize milestone.payments if it doesn't exist
    if (!milestone.payments) {
      milestone.payments = {
        upfront: {
          amount: 0,
          status: "pending",
          releasedAt: null,
          billUrl: null,
        },
        completion: {
          amount: 0,
          status: "pending",
          releasedAt: null,
          billUrl: null,
        },
        final: {
          amount: 0,
          status: "pending",
          releasedAt: null,
          billUrl: null,
        },
      };
    }

    let paymentAmount = 0;

    if (isFinalPhase) {
      // Final phase: only completion payment exists (100% of phase amount)
      if (paymentStage !== "completion") {
        return res
          .status(400)
          .json({
            error:
              "Only completion payment is applicable for the Final Touching phase",
          });
      }

      if (milestone.payments.completion.status === "released") {
        return res
          .status(400)
          .json({ error: "Final payment already released" });
      }

      paymentAmount = phaseAmount;
      milestone.payments.completion.amount = paymentAmount;
      milestone.payments.completion.status = "released";
      milestone.payments.completion.releasedAt = new Date();
    } else {
      // Work phases: 40% upfront, 60% completion
      if (paymentStage === "upfront") {
        if (milestone.payments.upfront.status === "released") {
          return res
            .status(400)
            .json({ error: "Upfront payment already released" });
        }
        paymentAmount = phaseAmount * 0.4;
        milestone.payments.upfront.amount = paymentAmount;
        milestone.payments.upfront.status = "released";
        milestone.payments.upfront.releasedAt = new Date();
      } else if (paymentStage === "completion") {
        if (milestone.payments.completion.status === "released") {
          return res
            .status(400)
            .json({ error: "Completion payment already released" });
        }
        paymentAmount = phaseAmount * 0.6;
        milestone.payments.completion.amount = paymentAmount;
        milestone.payments.completion.status = "released";
        milestone.payments.completion.releasedAt = new Date();
      } else {
        return res
          .status(400)
          .json({
            error:
              "Invalid payment stage for work phases. Use 'upfront' or 'completion'",
          });
      }
    }

    // Record the payout
    project.paymentDetails = project.paymentDetails || {};
    project.paymentDetails.totalAmount =
      project.paymentDetails.totalAmount || project.proposal?.price || 0;
    project.paymentDetails.amountPaidToCompany =
      (project.paymentDetails.amountPaidToCompany || 0) + paymentAmount;
    project.paymentDetails.payouts = project.paymentDetails.payouts || [];

    project.paymentDetails.payouts.push({
      amount: paymentAmount,
      status: "released",
      releaseDate: new Date(),
      milestonePercentage: milestonePercent,
      phaseName: phase?.name,
      paymentStage: paymentStage, // Track which stage was paid
    });

    // Update overall payment status
    if (project.paymentDetails.totalAmount > 0) {
      project.paymentDetails.paymentStatus =
        project.paymentDetails.amountPaidToCompany >=
        project.paymentDetails.totalAmount
          ? "completed"
          : "partially_paid";
    }

    // Mark milestone as fully paid only if all stages are released
    const allPaymentsReleased = isFinalPhase
      ? milestone.payments.completion.status === "released"
      : milestone.payments.upfront.status === "released" &&
        milestone.payments.completion.status === "released";

    if (allPaymentsReleased) {
      milestone.isPaid = true;
      milestone.paidAt = new Date();
    }

    await project.save();

    res.status(200).json({
      success: true,
      message: `${paymentStage.charAt(0).toUpperCase() + paymentStage.slice(1)} payment released for ${milestonePercent}% milestone`,
      milestone,
      paymentStage,
      paymentAmount,
      paymentDetails: project.paymentDetails,
    });
  } catch (error) {
    console.error("Error releasing milestone payment:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const submitProjectReview = async (req, res) => {
  try {
    const { projectId, rating, reviewText } = req.body;
    const customerId = req.user.user_id;

    if (!projectId || !rating) {
      return res
        .status(400)
        .json({ error: "Project ID and rating are required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    const project = await ConstructionProjectSchema.findOne({
      _id: projectId,
      customerId: customerId,
    });

    if (!project) {
      return res
        .status(404)
        .json({ error: "Project not found or you don't have permission" });
    }

    if (project.completionPercentage !== 100) {
      return res
        .status(400)
        .json({ error: "Project must be 100% complete to submit a review" });
    }

    if (project.customerReview && project.customerReview.rating) {
      return res
        .status(400)
        .json({ error: "Review already submitted for this project" });
    }

    project.customerReview = {
      rating: parseInt(rating),
      reviewText: reviewText || "",
      reviewDate: new Date(),
    };

    await project.save();

    res.status(200).json({
      success: true,
      message: "Review submitted successfully",
      review: project.customerReview,
    });
  } catch (error) {
    console.error("Error submitting review:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get projects with unviewed customer messages
const getProjectsWithUnviewedCustomerMessages = async (req, res) => {
  try {
    const projects = await ConstructionProjectSchema.find({
      companyId: req.user.user_id,
      "milestones.conversation": { $exists: true, $ne: [] },
    });

    const projectsWithUnviewed = [];

    projects.forEach((project) => {
      let hasUnviewedMessages = false;

      project.milestones.forEach((milestone) => {
        if (milestone.conversation && milestone.conversation.length > 0) {
          // Check for customer messages that haven't been viewed
          const unviewedCustomerMessages = milestone.conversation.filter(
            (msg) => msg.sender === "customer" && !msg.viewedByCompany,
          );

          if (unviewedCustomerMessages.length > 0) {
            hasUnviewedMessages = true;
          }
        }
      });

      if (hasUnviewedMessages) {
        projectsWithUnviewed.push({
          _id: project._id,
          count: 1, // Just indicate there are unviewed messages
        });
      }
    });

    res.json({ success: true, unviewedByProject: projectsWithUnviewed });
  } catch (err) {
    console.error("Error getting unviewed messages:", err);
    res.status(500).json({ error: "Failed to get unviewed messages" });
  }
};

// Mark customer messages as viewed
const markCustomerMessagesViewed = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await ConstructionProjectSchema.findOne({
      _id: projectId,
      companyId: req.user.user_id,
    });
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Mark all customer messages in all milestones as viewed
    project.milestones.forEach((milestone) => {
      if (milestone.conversation && milestone.conversation.length > 0) {
        milestone.conversation.forEach((msg) => {
          if (msg.sender === "customer") {
            msg.viewedByCompany = true;
          }
        });
      }
    });

    await project.save();
    await Complaint.updateMany(
      {
        projectId,
        hasUnviewedAdminReplyForCompany: true,
      },
      {
        $set: { hasUnviewedAdminReplyForCompany: false },
      },
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Error marking messages as viewed:", err);
    res.status(500).json({ error: "Failed to mark messages as viewed" });
  }
};

// Get projects with unviewed company messages (for customer)
const getProjectsWithUnviewedCompanyMessages = async (req, res) => {
  try {
    const projects = await ConstructionProjectSchema.find({
      customerId: req.user.user_id,
      "milestones.conversation": { $exists: true, $ne: [] },
    });

    const projectsWithUnviewed = [];

    projects.forEach((project) => {
      let hasUnviewedMessages = false;

      project.milestones.forEach((milestone) => {
        if (milestone.conversation && milestone.conversation.length > 0) {
          // Check for company messages that haven't been viewed
          const unviewedCompanyMessages = milestone.conversation.filter(
            (msg) => msg.sender === "company" && !msg.viewedByCustomer,
          );

          if (unviewedCompanyMessages.length > 0) {
            hasUnviewedMessages = true;
          }
        }
      });

      if (hasUnviewedMessages) {
        projectsWithUnviewed.push({
          _id: project._id,
          count: 1,
        });
      }
    });

    res.json({ success: true, unviewedByProject: projectsWithUnviewed });
  } catch (err) {
    console.error("Error getting unviewed company messages:", err);
    res.status(500).json({ error: "Failed to get unviewed messages" });
  }
};

// Mark company messages as viewed (for customer)
const markCompanyMessagesViewed = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await ConstructionProjectSchema.findOne({
      _id: projectId,
      customerId: req.user.user_id,
    });
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Mark all company messages in all milestones as viewed
    project.milestones.forEach((milestone) => {
      if (milestone.conversation && milestone.conversation.length > 0) {
        milestone.conversation.forEach((msg) => {
          if (msg.sender === "company") {
            msg.viewedByCustomer = true;
          }
        });
      }
    });

    await project.save();
    res.json({ success: true });
  } catch (err) {
    console.error("Error marking company messages as viewed:", err);
    res.status(500).json({ error: "Failed to mark messages as viewed" });
  }
};

const getCompanyNotifications = async (req, res) => {
  try {
    const companyId = req.user.user_id;
    const projects = await ConstructionProjectSchema.find({ companyId }).select(
      "_id projectName milestones.percentage milestones.conversation",
    );

    const projectNameMap = new Map();
    const projectIds = [];
    const notifications = [];

    projects.forEach((project) => {
      const projectId = project._id.toString();
      projectIds.push(project._id);
      projectNameMap.set(projectId, project.projectName || "Project");

      (project.milestones || []).forEach((milestone) => {
        (milestone.conversation || []).forEach((message, messageIndex) => {
          if (message.sender !== "customer" || message.viewedByCompany) return;

          notifications.push({
            id: `customer-${projectId}-${milestone.percentage}-${messageIndex}`,
            type: "customer_message",
            title: "New message from customer",
            message: message.message,
            projectId,
            projectName: project.projectName || "Project",
            milestone: milestone.percentage,
            createdAt: message.timestamp || new Date(),
          });
        });
      });
    });

    if (projectIds.length > 0) {
      const complaintDocs = await Complaint.find({
        projectId: { $in: projectIds },
        hasUnviewedAdminReplyForCompany: true,
      }).select("projectId milestone replies updatedAt");

      complaintDocs.forEach((complaint) => {
        const reply = (complaint.replies || []).slice().sort((a, b) => {
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        })[0];

        if (!reply) return;

        const projectId = complaint.projectId?.toString();
        notifications.push({
          id: `admin-reply-${complaint._id}`,
          type: "platform_reply",
          title: "Reply from platform admin",
          message: reply.message,
          projectId,
          projectName: projectNameMap.get(projectId) || "Project",
          milestone: complaint.milestone,
          createdAt: reply.createdAt || complaint.updatedAt || new Date(),
        });
      });
    }

    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const limitedNotifications = notifications.slice(0, 30);

    return res.json({
      success: true,
      totalUnread: limitedNotifications.length,
      notifications: limitedNotifications,
    });
  } catch (err) {
    console.error("Error getting company notifications:", err);
    return res.status(500).json({ error: "Failed to get company notifications" });
  }
};

module.exports = {
  submitArchitect,
  submitDesignRequest,
  submitConstructionForm,
  getProjects,
  getProjectById,
  getEditProject,
  updateProject,
  submitBid,
  acceptBid,
  declineBid,
  acceptWorkerRequest,
  rejectWorkerRequest,
  approveMilestone,
  requestMilestoneRevision,
  payMilestone,
  submitProjectReview,
  getProjectsWithUnviewedCustomerMessages,
  markCustomerMessagesViewed,
  getProjectsWithUnviewedCompanyMessages,
  markCompanyMessagesViewed,
  getCompanyNotifications,
};
