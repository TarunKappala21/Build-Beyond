const Razorpay = require("razorpay");
const crypto = require("crypto");
const {
  Worker,
  ArchitectHiring,
  DesignRequest,
  Transaction,
  ConstructionProjectSchema,
  Company,
} = require("../models");
const { invalidateCacheByPrefix } = require("../utils/redisCache");

const COMPANY_PLATFORM_FEE_PERCENT =
  parseFloat(
    process.env.COMPANY_PLATFORM_FEE_PERCENT ||
      process.env.PLATFORM_FEE_PERCENT,
  ) || 5;
const COMPANY_INITIAL_RELEASE_PERCENT = 75;
const COMPANY_HOLD_PERCENT = 25;
const WORKER_PLATFORM_FEE_PERCENT = 5;
const RAZORPAY_MAX_ORDER_AMOUNT_INR = Number(
  process.env.RAZORPAY_MAX_ORDER_AMOUNT_INR || 500000,
);
const ADMIN_REVENUE_INTELLIGENCE_CACHE_PREFIX =
  "admin:platform-revenue-intelligence:v1";
const ADMIN_ANALYTICS_CACHE_PREFIX = "admin:analytics:v1";

const invalidateAdminRevenueIntelligenceCache = async () => {
  try {
    await Promise.all([
      invalidateCacheByPrefix(ADMIN_REVENUE_INTELLIGENCE_CACHE_PREFIX),
      invalidateCacheByPrefix(ADMIN_ANALYTICS_CACHE_PREFIX),
    ]);
  } catch (error) {
    console.error(
      "Failed to invalidate admin revenue intelligence cache:",
      error.message,
    );
  }
};

const getRazorpay = () =>
  new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

// ============================================================================
// PAYMENT CONFIGURATION
// ============================================================================
const COMMISSION_RATES = {
  basic: 15, // 15% commission for basic plan
  pro: 10, // 10% commission for pro plan (₹999/month)
  premium: 5, // 5% commission for premium plan (₹1999/month)
};

const MILESTONE_PERCENTAGES = [25, 50, 75, 100];

const resolveCompanyPhase = (project, milestonePercentage) => {
  const phases = Array.isArray(project?.proposal?.phases)
    ? project.proposal.phases
    : [];
  const phaseIndex = MILESTONE_PERCENTAGES.indexOf(Number(milestonePercentage));
  if (phaseIndex === -1 || !phases[phaseIndex]) return null;

  return {
    phase: phases[phaseIndex],
    phaseIndex,
  };
};

const findCompanyPayout = (project, milestonePercentage) =>
  (project.paymentDetails?.payouts || []).find(
    (entry) =>
      Number(entry.milestonePercentage) === Number(milestonePercentage),
  );

const ensureCompanyPaymentDetails = (project) => {
  if (!project.paymentDetails) {
    project.paymentDetails = {};
  }

  if (!Array.isArray(project.paymentDetails.payouts)) {
    project.paymentDetails.payouts = [];
  }

  if (typeof project.paymentDetails.amountPaidToCompany !== "number") {
    project.paymentDetails.amountPaidToCompany = 0;
  }

  if (!project.paymentDetails.paymentStatus) {
    project.paymentDetails.paymentStatus = "unpaid";
  }
};

const roundCurrency = (value) => Math.round(Number(value || 0) * 100) / 100;
const CURRENCY_EPSILON = 0.01;

const appendCustomerMilestoneNotification = (
  project,
  milestonePercentage,
  message,
  now = new Date(),
) => {
  const milestone = (project.milestones || []).find(
    (entry) =>
      Number(entry.percentage) === Number(milestonePercentage) &&
      entry.isCheckpoint,
  );
  if (!milestone || !message) return;

  milestone.conversation = milestone.conversation || [];
  milestone.conversation.push({
    sender: "customer",
    message,
    timestamp: now,
    viewedByCompany: false,
    viewedByCustomer: true,
  });

  project.recentUpdates = project.recentUpdates || [];
  project.recentUpdates.push({
    updateText: `Customer payment update (${milestonePercentage}%): ${message}`,
    createdAt: now,
  });
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate commission and worker payout for a given amount
 */
const calculatePaymentBreakdown = (amount, commissionRate) => {
  const platformCommission = (amount * commissionRate) / 100;
  const workerAmount = amount - platformCommission;

  return {
    totalAmount: amount,
    platformCommission: Math.round(platformCommission * 100) / 100,
    workerAmount: Math.round(workerAmount * 100) / 100,
  };
};

/**
 * Calculate milestone payment breakdowns
 */
const calculateMilestonePayments = (totalAmount, commissionRate) => {
  const payments = [];
  const perMilestoneAmount = totalAmount / MILESTONE_PERCENTAGES.length;

  MILESTONE_PERCENTAGES.forEach((percentage) => {
    const milestoneAmount = perMilestoneAmount;
    const platformFee = (milestoneAmount * commissionRate) / 100;
    const workerPayout = milestoneAmount - platformFee;

    payments.push({
      percentage,
      amount: Math.round(milestoneAmount * 100) / 100,
      platformFee: Math.round(platformFee * 100) / 100,
      workerPayout: Math.round(workerPayout * 100) / 100,
      platformFeeStatus: "not_due",
      status: "pending",
    });
  });

  return payments;
};

/**
 * Reset monthly/yearly earnings if needed
 */
const resetPeriodicEarnings = (worker) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Reset monthly earnings if month changed
  if (worker.earnings.lastResetMonth !== currentMonth) {
    worker.earnings.monthlyEarnings = 0;
    worker.earnings.lastResetMonth = currentMonth;
  }

  // Reset yearly earnings if year changed
  if (worker.earnings.lastResetYear !== currentYear) {
    worker.earnings.yearlyEarnings = 0;
    worker.earnings.lastResetYear = currentYear;
  }

  return worker;
};

// ============================================================================
// ESCROW INITIALIZATION (Called when customer accepts proposal)
// ============================================================================

/**
 * Initialize escrow when customer accepts a proposal
 * UPDATED: Only collects 25% deposit (first milestone) upfront
 * Remaining milestones will be collected as work progresses
 */
const initializeEscrow = async (req, res) => {
  try {
    const { projectId, projectType } = req.body;

    if (!projectId || !projectType) {
      return res.status(400).json({
        success: false,
        message: "Project ID and type are required",
      });
    }

    // Get the project model based on type
    let Project;
    if (projectType === "architect") {
      Project = ArchitectHiring;
    } else if (projectType === "interior") {
      Project = DesignRequest;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid project type. Must be "architect" or "interior"',
      });
    }

    // Find the project and populate worker details
    const project = await Project.findById(projectId).populate("worker");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (!project.worker) {
      return res.status(400).json({
        success: false,
        message: "No worker assigned to this project",
      });
    }

    if (!project.finalAmount || project.finalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Project must have a valid final amount",
      });
    }

    // Get worker's commission rate
    const worker = await Worker.findById(project.worker._id);
    const commissionRate = WORKER_PLATFORM_FEE_PERCENT;

    // Calculate payment breakdown
    const breakdown = calculatePaymentBreakdown(
      project.finalAmount,
      commissionRate,
    );

    // Calculate milestone payments (each milestone is 25%)
    const milestonePayments = calculateMilestonePayments(
      project.finalAmount,
      commissionRate,
    );

    // Mark ONLY first milestone (25%) as paid - this is the deposit
    milestonePayments[0].paymentCollected = true;
    milestonePayments[0].paymentCollectedAt = new Date();

    // Calculate deposit amount (first milestone only)
    const depositAmount = milestonePayments[0].amount;
    const depositWorkerPayout = milestonePayments[0].workerPayout;
    const depositPlatformFee = milestonePayments[0].platformFee;

    // Change status to Accepted now that payment is completed
    if (projectType === "architect") {
      project.status = "Accepted";
    } else if (projectType === "interior") {
      project.status = "accepted";
    }

    // Initialize payment details
    project.paymentDetails = {
      totalAmount: breakdown.totalAmount,
      platformCommission: breakdown.platformCommission,
      workerAmount: breakdown.workerAmount,
      escrowStatus: "held",
      milestonePayments: milestonePayments,
      paymentInitiatedAt: new Date(),
    };

    await project.save();

    // Split the first milestone worker payout: 60% immediate + 40% held
    const immediateAdvancePercent = 0.6;
    const immediateAdvance = depositWorkerPayout * immediateAdvancePercent;
    const heldForMilestone =
      depositWorkerPayout * (1 - immediateAdvancePercent);

    // Create deposit transaction (25% only)
    const depositTransaction = new Transaction({
      transactionType: "escrow_hold",
      amount: depositAmount,
      platformFee: depositPlatformFee,
      netAmount: depositWorkerPayout,
      projectId: project._id,
      projectType: projectType,
      workerId: worker._id,
      customerId: project.customer,
      status: "completed",
      description: `Initial deposit (25%) collected for ${projectType} project: ${project.projectName || "N/A"}`,
      metadata: { milestone: 1, percentage: 25, type: "deposit" },
      processedAt: new Date(),
    });

    await depositTransaction.save();

    // Immediately release 60% of deposit (15% of total) to worker as starting advance
    const advanceTransaction = new Transaction({
      transactionType: "milestone_release",
      amount: immediateAdvance + depositPlatformFee * immediateAdvancePercent,
      platformFee: depositPlatformFee * immediateAdvancePercent,
      netAmount: immediateAdvance,
      projectId: project._id,
      projectType: projectType,
      workerId: worker._id,
      customerId: project.customer,
      status: "completed",
      description: `Starting advance released to worker for ${projectType} project: ${project.projectName || "N/A"}`,
      metadata: { milestone: 0, percentage: 15, type: "starting_advance" },
      processedAt: new Date(),
    });

    await advanceTransaction.save();

    // Update worker's balances
    worker.earnings.pendingBalance += heldForMilestone; // 10% held for milestone approval
    worker.earnings.availableBalance += immediateAdvance; // 15% available immediately
    worker.earnings.totalEarnings += immediateAdvance;

    // Update monthly/yearly earnings
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    if (
      worker.earnings.lastResetMonth !== currentMonth ||
      worker.earnings.lastResetYear !== currentYear
    ) {
      worker.earnings.monthlyEarnings = immediateAdvance;
      worker.earnings.lastResetMonth = currentMonth;
      if (worker.earnings.lastResetYear !== currentYear) {
        worker.earnings.yearlyEarnings = immediateAdvance;
        worker.earnings.lastResetYear = currentYear;
      } else {
        worker.earnings.yearlyEarnings += immediateAdvance;
      }
    } else {
      worker.earnings.monthlyEarnings += immediateAdvance;
      worker.earnings.yearlyEarnings += immediateAdvance;
    }

    await worker.save();

    await invalidateAdminRevenueIntelligenceCache();

    res.json({
      success: true,
      message:
        "Payment successful! Worker received 15% starting advance. Remaining 10% will be released when first milestone is approved.",
      data: {
        paymentDetails: project.paymentDetails,
        breakdown: breakdown,
        commissionRate: commissionRate,
        depositAmount: depositAmount,
        depositCollected: true,
        immediateAdvance: immediateAdvance,
        heldForFirstMilestone: heldForMilestone,
        nextPaymentDue:
          "When Milestone 1 (25%) is approved, held amount is released. Platform fee must be collected before the next milestone payment.",
      },
    });
  } catch (error) {
    console.error("Error initializing escrow:", error);
    res.status(500).json({
      success: false,
      message: "Failed to initialize deposit",
      error: error.message,
    });
  }
};

// ============================================================================
// COLLECT MILESTONE PAYMENT (Customer confirms milestone payment)
// ============================================================================

const collectMilestonePayment = async (req, res) => {
  try {
    const { projectId, projectType, milestonePercentage } = req.body;

    if (!projectId || !projectType || !milestonePercentage) {
      return res.status(400).json({
        success: false,
        message: "Project ID, type, and milestone percentage are required",
      });
    }

    // Get the project model based on type
    let Project;
    if (projectType === "architect") {
      Project = ArchitectHiring;
    } else if (projectType === "interior") {
      Project = DesignRequest;
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid project type",
      });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (
      !project.paymentDetails ||
      project.paymentDetails.escrowStatus === "not_initiated"
    ) {
      return res.status(400).json({
        success: false,
        message: "Escrow not initialized for this project",
      });
    }

    // Find the milestone payment
    const milestonePayment = project.paymentDetails.milestonePayments.find(
      (mp) => Number(mp.percentage) === Number(milestonePercentage),
    );

    if (!milestonePayment) {
      return res.status(404).json({
        success: false,
        message: "Milestone payment not found",
      });
    }

    if (milestonePayment.paymentCollected) {
      return res.status(400).json({
        success: false,
        message: "Payment for this milestone has already been collected",
      });
    }

    const milestoneIndex = project.paymentDetails.milestonePayments.findIndex(
      (mp) => Number(mp.percentage) === Number(milestonePercentage),
    );

    if (milestoneIndex > 0) {
      const previousMilestone =
        project.paymentDetails.milestonePayments[milestoneIndex - 1];
      if ((previousMilestone?.platformFeeStatus || "not_due") !== "collected") {
        return res.status(400).json({
          success: false,
          message: `Cannot collect ${milestonePercentage}% milestone payment until ${previousMilestone.percentage}% milestone platform fee is collected.`,
        });
      }
    }

    // Get the worker
    const worker = await Worker.findById(project.worker || project.workerId);

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Worker not found",
      });
    }

    // Mark milestone as paid
    milestonePayment.paymentCollected = true;
    milestonePayment.paymentCollectedAt = new Date();

    // TODO: In production, integrate with payment gateway (Stripe/Razorpay)
    // For now, we're simulating successful payment

    // Create transaction for milestone payment collection
    const transaction = new Transaction({
      transactionType: "escrow_hold",
      amount: milestonePayment.amount,
      platformFee: milestonePayment.platformFee,
      netAmount: milestonePayment.workerPayout,
      projectId: project._id,
      projectType: projectType,
      workerId: worker._id,
      customerId: project.customer || project.customerId,
      status: "completed",
      description: `Milestone ${milestonePercentage}% payment collected from customer`,
      metadata: {
        milestone: Number(milestonePercentage),
        type: "milestone_payment",
      },
      processedAt: new Date(),
    });

    await transaction.save();

    // Add to worker's pending balance
    worker.earnings.pendingBalance += milestonePayment.workerPayout;
    await worker.save();

    await project.save();

    await invalidateAdminRevenueIntelligenceCache();

    console.log(
      `✓ Milestone ${milestonePercentage}% payment collected: ₹${milestonePayment.amount}`,
    );

    res.json({
      success: true,
      message: `Payment for ${milestonePercentage}% milestone collected successfully! Funds held in escrow until milestone is completed.`,
      data: {
        amount: milestonePayment.amount,
        platformFee: milestonePayment.platformFee,
        workerPayout: milestonePayment.workerPayout,
        milestonePercentage: milestonePercentage,
        transaction: transaction,
      },
    });
  } catch (error) {
    console.error("Error collecting milestone payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to collect milestone payment",
      error: error.message,
    });
  }
};

const createWorkerPaymentOrder = async (req, res) => {
  try {
    const { projectId, projectType, paymentType, milestonePercentage } =
      req.body;

    if (!projectId || !projectType || !paymentType) {
      return res.status(400).json({
        success: false,
        message: "projectId, projectType and paymentType are required",
      });
    }

    if (!["architect", "interior"].includes(projectType)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid projectType" });
    }

    if (!["deposit", "milestone"].includes(paymentType)) {
      return res.status(400).json({
        success: false,
        message: "paymentType must be deposit or milestone",
      });
    }

    const Project =
      projectType === "architect" ? ArchitectHiring : DesignRequest;
    const project = await Project.findById(projectId);
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    const targetPercentage =
      paymentType === "deposit" ? 25 : Number(milestonePercentage);
    if (!MILESTONE_PERCENTAGES.includes(targetPercentage)) {
      return res.status(400).json({
        success: false,
        message: "Invalid milestone percentage. Must be 25, 50, 75, or 100",
      });
    }

    const isEscrowInitialized = Boolean(
      project.paymentDetails &&
      project.paymentDetails.escrowStatus !== "not_initiated",
    );

    let amount = 0;

    if (isEscrowInitialized) {
      const milestonePayment = project.paymentDetails.milestonePayments.find(
        (mp) => Number(mp.percentage) === targetPercentage,
      );
      if (!milestonePayment) {
        return res
          .status(404)
          .json({ success: false, message: "Milestone payment not found" });
      }

      if (milestonePayment.paymentCollected) {
        return res.status(400).json({
          success: false,
          message: `Payment for ${targetPercentage}% milestone has already been collected`,
        });
      }

      const milestoneIndex = project.paymentDetails.milestonePayments.findIndex(
        (mp) => Number(mp.percentage) === targetPercentage,
      );
      if (milestoneIndex > 0) {
        const previousMilestone =
          project.paymentDetails.milestonePayments[milestoneIndex - 1];
        if (
          (previousMilestone?.platformFeeStatus || "not_due") !== "collected"
        ) {
          return res.status(400).json({
            success: false,
            message: `Cannot collect ${targetPercentage}% milestone payment until ${previousMilestone.percentage}% milestone platform fee is collected.`,
          });
        }
      }

      amount = Math.round(Number(milestonePayment.amount || 0));
    } else {
      if (paymentType !== "deposit") {
        return res.status(400).json({
          success: false,
          message: "Escrow not initialized for this project",
        });
      }

      const finalAmount = Number(
        project.finalAmount || project.proposal?.price || 0,
      );
      if (finalAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Project must have a valid final amount before payment",
        });
      }

      amount = Math.round((finalAmount * 25) / 100);
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid milestone amount configured",
      });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Razorpay credentials are not configured on server",
      });
    }

    const razorpay = getRazorpay();
    const shortReceipt = `w${String(projectId).slice(-8)}m${targetPercentage}${Date.now().toString().slice(-6)}`;
    const rawNotes = {
      projectId: projectId.toString(),
      projectType,
      paymentType,
      milestonePercentage: String(targetPercentage),
      workerId: String(project.worker || project.workerId || ""),
      customerId: String(project.customer || project.customerId || ""),
    };
    const notes = Object.fromEntries(
      Object.entries(rawNotes)
        .filter(([, value]) => typeof value === "string" && value.length > 0)
        .map(([key, value]) => [key, value.slice(0, 255)]),
    );

    let order;
    try {
      order = await razorpay.orders.create({
        amount: Math.round(amount * 100),
        currency: "INR",
        receipt: shortReceipt,
        notes,
      });
    } catch (gatewayError) {
      const gatewayMessage =
        gatewayError?.error?.description ||
        gatewayError?.description ||
        gatewayError?.message ||
        "Unknown gateway error";
      const gatewayCode =
        gatewayError?.error?.code || gatewayError?.code || null;

      console.error("Razorpay create worker order failed:", {
        message: gatewayMessage,
        code: gatewayCode,
        amount,
        receipt: shortReceipt,
        notes,
      });

      return res.status(502).json({
        success: false,
        message: "Failed to create worker payment order",
        error: gatewayMessage,
        code: gatewayCode,
      });
    }

    return res.json({
      success: true,
      message: "Worker payment order created",
      data: {
        razorpayOrderId: order.id,
        amount,
        amountInPaise: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        milestonePercentage: targetPercentage,
        paymentType,
      },
    });
  } catch (error) {
    console.error("Error creating worker payment order:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create worker payment order",
      error: error.message,
    });
  }
};

const verifyWorkerPayment = async (req, res) => {
  try {
    const {
      projectId,
      projectType,
      paymentType,
      milestonePercentage,
      testBypass,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!projectId || !projectType || !paymentType) {
      return res.status(400).json({
        success: false,
        message: "projectId, projectType and paymentType are required",
      });
    }

    const isTestBypass = Boolean(testBypass);

    if (
      !isTestBypass &&
      (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature)
    ) {
      return res.status(400).json({
        success: false,
        message: "Razorpay verification fields are required",
      });
    }

    if (isTestBypass && process.env.NODE_ENV === "production") {
      return res.status(403).json({
        success: false,
        message: "Test bypass is disabled in production",
      });
    }

    if (!["architect", "interior"].includes(projectType)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid projectType" });
    }

    if (!["deposit", "milestone"].includes(paymentType)) {
      return res.status(400).json({
        success: false,
        message: "paymentType must be deposit or milestone",
      });
    }

    if (!isTestBypass) {
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({
          success: false,
          message: "Payment verification failed - invalid signature",
        });
      }
    }

    const Project =
      projectType === "architect" ? ArchitectHiring : DesignRequest;
    const project = await Project.findById(projectId);
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    const isEscrowInitialized = Boolean(
      project.paymentDetails &&
      project.paymentDetails.escrowStatus !== "not_initiated",
    );

    if (paymentType === "deposit" && !isEscrowInitialized) {
      return initializeEscrow(req, res);
    }

    if (paymentType === "milestone" && !isEscrowInitialized) {
      return res.status(400).json({
        success: false,
        message: "Escrow not initialized for this project",
      });
    }

    const targetPercentage =
      paymentType === "deposit" ? 25 : Number(milestonePercentage);
    req.body.milestonePercentage = targetPercentage;

    return collectMilestonePayment(req, res);
  } catch (error) {
    console.error("Error verifying worker payment:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify worker payment",
      error: error.message,
    });
  }
};

// ============================================================================
// MILESTONE PAYMENT RELEASE (Called when milestone is approved)
// ============================================================================

/**
 * Collect payment for next milestone from customer
 * Called after approving current milestone
 */
const collectNextMilestonePayment = async (
  project,
  projectType,
  currentMilestoneIndex,
) => {
  try {
    const nextMilestoneIndex = currentMilestoneIndex + 1;
    const milestonePayments = project.paymentDetails.milestonePayments;

    // Check if there's a next milestone
    if (nextMilestoneIndex >= milestonePayments.length) {
      console.log("No more milestones to collect payment for");
      return {
        success: true,
        collected: false,
        message: "No more milestones to collect",
      };
    }

    const nextMilestone = milestonePayments[nextMilestoneIndex];

    // Check if already paid
    if (nextMilestone.paymentCollected) {
      console.log(`Milestone ${nextMilestone.percentage}% already paid`);
      return {
        success: true,
        collected: false,
        message: "Next milestone already paid",
      };
    }

    console.log(
      `Collecting payment for milestone ${nextMilestone.percentage}%...`,
    );

    // TODO: In production, integrate with payment gateway (Stripe/Razorpay)
    // For now, we're automatically collecting (simulating successful payment)

    // Mark next milestone as paid
    nextMilestone.paymentCollected = true;
    nextMilestone.paymentCollectedAt = new Date();

    // Get worker for pending balance update
    const worker = await Worker.findById(project.worker || project.workerId);

    if (!worker) {
      console.error("Worker not found for payment collection");
      return { success: false, collected: false, message: "Worker not found" };
    }

    // Create transaction for next milestone payment collection
    const transaction = new Transaction({
      transactionType: "escrow_hold",
      amount: nextMilestone.amount,
      platformFee: nextMilestone.platformFee,
      netAmount: nextMilestone.workerPayout,
      projectId: project._id,
      projectType: projectType,
      workerId: worker._id,
      customerId: project.customer || project.customerId,
      status: "completed",
      description: `Milestone ${nextMilestoneIndex + 1} (${nextMilestone.percentage}%) payment collected`,
      metadata: {
        milestone: nextMilestoneIndex + 1,
        percentage: nextMilestone.percentage,
        collectedAfterMilestone: currentMilestoneIndex + 1,
      },
      processedAt: new Date(),
    });

    await transaction.save();

    // Add to worker's pending balance
    worker.earnings.pendingBalance += nextMilestone.workerPayout;
    await worker.save();

    console.log(
      `✓ Payment collected for milestone ${nextMilestone.percentage}%: ₹${nextMilestone.amount}`,
    );

    return {
      success: true,
      collected: true,
      amount: nextMilestone.amount,
      milestone: nextMilestone.percentage,
      message: `Payment for ${nextMilestone.percentage}% milestone collected successfully`,
    };
  } catch (error) {
    console.error("Error collecting next milestone payment:", error);
    return { success: false, collected: false, error: error.message };
  }
};

/**
 * Release payment for an approved milestone
 * UPDATED: Now also triggers collection of next milestone payment
 */
const releaseMilestonePayment = async (req, res) => {
  try {
    const { projectId, projectType, milestonePercentage } = req.body;

    if (!projectId || !projectType || !milestonePercentage) {
      return res.status(400).json({
        success: false,
        message: "Project ID, type, and milestone percentage are required",
      });
    }

    if (!MILESTONE_PERCENTAGES.includes(Number(milestonePercentage))) {
      return res.status(400).json({
        success: false,
        message: "Invalid milestone percentage. Must be 25, 50, 75, or 100",
      });
    }

    // Get the project model based on type
    let Project;
    if (projectType === "architect") {
      Project = ArchitectHiring;
    } else if (projectType === "interior") {
      Project = DesignRequest;
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid project type",
      });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (
      !project.paymentDetails ||
      project.paymentDetails.escrowStatus === "not_initiated"
    ) {
      return res.status(400).json({
        success: false,
        message: "Escrow not initialized for this project",
      });
    }

    // Find the milestone payment index
    const milestoneIndex = project.paymentDetails.milestonePayments.findIndex(
      (mp) => Number(mp.percentage) === Number(milestonePercentage),
    );

    if (milestoneIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Milestone payment not found",
      });
    }

    const milestonePayment =
      project.paymentDetails.milestonePayments[milestoneIndex];

    if (milestonePayment.status === "released") {
      return res.status(400).json({
        success: false,
        message: `Payment for ${milestonePercentage}% milestone has already been released. Move to the next milestone.`,
      });
    }

    // Check if customer has paid for this milestone
    if (!milestonePayment.paymentCollected) {
      return res.status(400).json({
        success: false,
        message: `Customer has not paid for the ${milestonePercentage}% milestone yet. Payment collection is required before release.`,
      });
    }

    // Get the worker
    const worker = await Worker.findById(project.worker);

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Worker not found",
      });
    }

    // Reset periodic earnings if needed
    resetPeriodicEarnings(worker);

    // Update milestone payment status
    milestonePayment.status = "released";
    milestonePayment.releasedAt = new Date();
    milestonePayment.platformFeeStatus = "pending";

    // Create milestone release transaction
    const transaction = new Transaction({
      transactionType: "milestone_release",
      amount: milestonePayment.amount,
      platformFee: milestonePayment.platformFee,
      netAmount: milestonePayment.workerPayout,
      projectId: project._id,
      projectType: projectType,
      workerId: worker._id,
      customerId: project.customer,
      milestonePercentage: milestonePercentage,
      status: "completed",
      description: `${milestonePercentage}% milestone payment released`,
      processedAt: new Date(),
    });

    await transaction.save();

    // Link transaction to milestone
    milestonePayment.transactionId = transaction._id;

    // For first milestone (25%), only release the held portion (40% of 25% = 10%)
    // Because 60% was already released as starting advance
    let amountToRelease = milestonePayment.workerPayout;
    if (Number(milestonePercentage) === 25) {
      // Only 40% of first milestone is in pending (15% was released immediately)
      amountToRelease = milestonePayment.workerPayout * 0.4; // This is the 10% held portion
    }

    // Update worker balances
    worker.earnings.pendingBalance -= amountToRelease;
    worker.earnings.availableBalance += amountToRelease;
    worker.earnings.totalEarnings += amountToRelease;
    worker.earnings.monthlyEarnings += amountToRelease;
    worker.earnings.yearlyEarnings += amountToRelease;

    // Create platform commission transaction
    const feeDueTransaction = new Transaction({
      transactionType: "platform_fee_due",
      amount: milestonePayment.platformFee,
      platformFee: milestonePayment.platformFee,
      netAmount: 0,
      projectId: project._id,
      projectType: projectType,
      workerId: worker._id,
      customerId: project.customer,
      milestonePercentage: milestonePercentage,
      status: "pending",
      description: `Worker platform fee due for ${milestonePercentage}% milestone`,
      processedAt: new Date(),
    });

    await feeDueTransaction.save();

    // Update escrow status
    const allReleased = project.paymentDetails.milestonePayments.every(
      (mp) => mp.status === "released" || mp.status === "withdrawn",
    );

    if (allReleased) {
      project.paymentDetails.escrowStatus = "fully_released";
    } else {
      project.paymentDetails.escrowStatus = "partially_released";
    }

    await project.save();
    await worker.save();

    await invalidateAdminRevenueIntelligenceCache();

    // Check if there's a next milestone (don't auto-collect, just inform)
    const nextMilestoneIndex = milestoneIndex + 1;
    const milestonePayments = project.paymentDetails.milestonePayments;
    let nextMilestoneInfo = null;

    if (nextMilestoneIndex < milestonePayments.length) {
      const nextMilestone = milestonePayments[nextMilestoneIndex];
      if (!nextMilestone.paymentCollected) {
        nextMilestoneInfo = {
          milestone: nextMilestone.percentage,
          amount: nextMilestone.amount,
          needsPayment: true,
        };
      }
    }

    res.json({
      success: true,
      message: `Payment for ${milestonePercentage}% milestone released successfully. Platform fee is now pending collection.`,
      data: {
        releasedAmount: milestonePayment.workerPayout,
        platformFee: milestonePayment.platformFee,
        platformFeeStatus: milestonePayment.platformFeeStatus,
        newAvailableBalance: worker.earnings.availableBalance,
        escrowStatus: project.paymentDetails.escrowStatus,
        transaction: transaction,
        nextPayment: nextMilestoneInfo || { needsPayment: false },
      },
    });
  } catch (error) {
    console.error("Error releasing milestone payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to release milestone payment",
      error: error.message,
    });
  }
};

// ============================================================================
// WORKER EARNINGS & REVENUE
// ============================================================================

/**
 * Get worker's earnings summary
 */
const getWorkerEarnings = async (req, res) => {
  try {
    // Worker auth uses req.user.user_id
    if (!req.user || !req.user.user_id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const workerId = req.user.user_id;

    const worker = await Worker.findById(workerId);

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Worker not found",
      });
    }

    // Reset periodic earnings if needed
    resetPeriodicEarnings(worker);
    await worker.save();

    // Get all transactions for this worker
    const transactions = await Transaction.find({
      workerId: workerId,
      status: "completed",
    })
      .sort({ createdAt: -1 })
      .limit(20);

    // Get ongoing projects with payment details
    const architectProjects = await ArchitectHiring.find({
      worker: workerId,
      status: { $in: ["Accepted", "Completed"] },
    }).select("projectName status paymentDetails createdAt");

    const interiorProjects = await DesignRequest.find({
      workerId: workerId,
      status: { $in: ["accepted", "completed"] },
    }).select("projectName status paymentDetails createdAt");

    // Calculate project-wise earnings
    const projectEarnings = [];

    architectProjects.forEach((project) => {
      if (project.paymentDetails && project.paymentDetails.milestonePayments) {
        const earned = project.paymentDetails.milestonePayments
          .filter((mp) => mp.status === "released" || mp.status === "withdrawn")
          .reduce((sum, mp) => sum + mp.workerPayout, 0);

        const pending = project.paymentDetails.milestonePayments
          .filter((mp) => mp.status === "pending")
          .reduce((sum, mp) => sum + mp.workerPayout, 0);

        if (earned > 0 || pending > 0) {
          projectEarnings.push({
            projectId: project._id,
            projectName: project.projectName,
            projectType: "architect",
            earned: earned,
            pending: pending,
            total: project.paymentDetails.totalAmount,
            status: project.status,
            createdAt: project.createdAt,
          });
        }
      }
    });

    interiorProjects.forEach((project) => {
      if (project.paymentDetails && project.paymentDetails.milestonePayments) {
        const earned = project.paymentDetails.milestonePayments
          .filter((mp) => mp.status === "released" || mp.status === "withdrawn")
          .reduce((sum, mp) => sum + mp.workerPayout, 0);

        const pending = project.paymentDetails.milestonePayments
          .filter((mp) => mp.status === "pending")
          .reduce((sum, mp) => sum + mp.workerPayout, 0);

        if (earned > 0 || pending > 0) {
          projectEarnings.push({
            projectId: project._id,
            projectName: project.projectName,
            projectType: "interior",
            earned: earned,
            pending: pending,
            total: project.paymentDetails.totalAmount,
            status: project.status,
            createdAt: project.createdAt,
          });
        }
      }
    });

    res.json({
      success: true,
      data: {
        earnings: worker.earnings,
        subscriptionPlan: worker.subscriptionPlan,
        commissionRate: worker.commissionRate,
        recentTransactions: transactions,
        projectEarnings: projectEarnings.sort(
          (a, b) => b.createdAt - a.createdAt,
        ),
      },
    });
  } catch (error) {
    console.error("Error fetching worker earnings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch earnings",
      error: error.message,
    });
  }
};

/**
 * Request withdrawal of available balance
 */
const requestWithdrawal = async (req, res) => {
  try {
    // Worker auth uses req.user.user_id
    if (!req.user || !req.user.user_id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const workerId = req.user.user_id;
    const { amount, bankDetails } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid withdrawal amount is required",
      });
    }

    if (!bankDetails || !bankDetails.accountNumber || !bankDetails.ifscCode) {
      return res.status(400).json({
        success: false,
        message: "Complete bank details are required",
      });
    }

    const worker = await Worker.findById(workerId);

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Worker not found",
      });
    }

    if (worker.earnings.availableBalance < amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available: ₹${worker.earnings.availableBalance}`,
      });
    }

    // Create withdrawal transaction
    const transaction = new Transaction({
      transactionType: "worker_withdrawal",
      amount: amount,
      platformFee: 0,
      netAmount: amount,
      workerId: worker._id,
      status: "pending",
      paymentMethod: "bank_transfer",
      bankDetails: {
        accountHolderName: bankDetails.accountHolderName || worker.name,
        accountNumber: bankDetails.accountNumber,
        ifscCode: bankDetails.ifscCode,
        bankName: bankDetails.bankName,
      },
      description: "Withdrawal request to bank account",
      notes: `Requested by worker: ${worker.name}`,
    });

    await transaction.save();

    // Update worker balance
    worker.earnings.availableBalance -= amount;
    worker.earnings.withdrawnAmount += amount;

    await worker.save();

    res.json({
      success: true,
      message:
        "Withdrawal request submitted successfully. Processing usually takes 2-3 business days.",
      data: {
        transaction: transaction,
        newAvailableBalance: worker.earnings.availableBalance,
        totalWithdrawn: worker.earnings.withdrawnAmount,
      },
    });
  } catch (error) {
    console.error("Error requesting withdrawal:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process withdrawal request",
      error: error.message,
    });
  }
};

/**
 * Get transaction history for worker
 */
const getTransactionHistory = async (req, res) => {
  try {
    // Worker auth uses req.user.user_id
    if (!req.user || !req.user.user_id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const workerId = req.user.user_id;
    const { page = 1, limit = 20, type, status } = req.query;

    const query = { workerId: workerId };

    if (type) {
      query.transactionType = type;
    }

    if (status) {
      query.status = status;
    }

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Transaction.countDocuments(query);

    res.json({
      success: true,
      data: {
        transactions: transactions,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalTransactions: count,
      },
    });
  } catch (error) {
    console.error("Error fetching transaction history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch transaction history",
      error: error.message,
    });
  }
};

// ============================================================================
// COMPANY PROJECT PAYMENTS (Razorpay + 75/25 settlement + 5% platform fee)
// ============================================================================

/**
 * Step 1 — Create a Razorpay order for a construction phase payment.
 * Customer pays 100% of the phase amount. 75% is released immediately,
 * 25% stays on hold until customer approval.
 *
 * Body: { projectId, milestonePercentage }
 *   milestonePercentage: 25 | 50 | 75 | 100
 */
const createCompanyPaymentOrder = async (req, res) => {
  try {
    const { projectId, milestonePercentage } = req.body;
    const targetMilestone = Number(milestonePercentage);

    if (!projectId || !milestonePercentage) {
      return res.status(400).json({
        success: false,
        message: "projectId and milestonePercentage are required",
      });
    }
    if (![25, 50, 75, 100].includes(targetMilestone)) {
      return res.status(400).json({
        success: false,
        message: "milestonePercentage must be 25, 50, 75, or 100",
      });
    }

    const project = await ConstructionProjectSchema.findById(projectId);
    if (!project)
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    if (project.status !== "accepted") {
      return res.status(400).json({
        success: false,
        message: "Payments can only be made on accepted projects",
      });
    }

    const resolvedPhase = resolveCompanyPhase(project, milestonePercentage);
    if (!resolvedPhase) {
      return res.status(400).json({
        success: false,
        message: "Phase configuration not found for this milestone",
      });
    }

    ensureCompanyPaymentDetails(project);

    const { phase, phaseIndex } = resolvedPhase;
    const amount = Math.round(Number(phase.amount || 0));
    if (amount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Phase amount is not configured" });
    }

    const previousMilestone = MILESTONE_PERCENTAGES[phaseIndex - 1] || null;
    const existingPayout = findCompanyPayout(project, targetMilestone);

    if (previousMilestone && !existingPayout) {
      const previousPayout = findCompanyPayout(project, previousMilestone);
      if (
        !previousPayout ||
        previousPayout.status !== "released" ||
        previousPayout.platformFeeStatus !== "collected"
      ) {
        return res.status(400).json({
          success: false,
          message: `Phase ${previousMilestone}% must be completed and platform fee collected before ${targetMilestone}% can start`,
        });
      }
    }

    const immediateReleaseAmount = roundCurrency(
      (amount * COMPANY_INITIAL_RELEASE_PERCENT) / 100,
    );
    const completionAmount = roundCurrency(amount - immediateReleaseAmount);
    const platformFee = roundCurrency(
      (amount * COMPANY_PLATFORM_FEE_PERCENT) / 100,
    );

    let amountToCharge = 0;
    let paymentStage = "upfront";
    let stageRemainingAmount = 0;

    if (!existingPayout) {
      stageRemainingAmount = immediateReleaseAmount;
      amountToCharge = Math.min(
        stageRemainingAmount,
        RAZORPAY_MAX_ORDER_AMOUNT_INR,
      );
    } else if (existingPayout.status === "pending") {
      const remainingUpfrontAmount = roundCurrency(
        Number(existingPayout.immediateReleaseAmount || 0) -
          Number(existingPayout.customerPaidAmount || 0),
      );

      if (remainingUpfrontAmount <= CURRENCY_EPSILON) {
        return res.status(400).json({
          success: false,
          message: `Initial 75% payment is already complete for ${targetMilestone}% phase`,
        });
      }

      stageRemainingAmount = remainingUpfrontAmount;
      amountToCharge = Math.min(
        stageRemainingAmount,
        RAZORPAY_MAX_ORDER_AMOUNT_INR,
      );
    } else if (existingPayout.status === "held") {
      const milestone = (project.milestones || []).find(
        (entry) =>
          Number(entry.percentage) === targetMilestone && entry.isCheckpoint,
      );

      if (!milestone?.isApprovedByCustomer) {
        return res.status(400).json({
          success: false,
          message: `Customer approval is required before collecting the remaining payment for ${targetMilestone}% phase`,
        });
      }

      const remainingAmount = roundCurrency(
        Number(existingPayout.amount || 0) -
          Number(existingPayout.customerPaidAmount || 0),
      );
      if (remainingAmount <= CURRENCY_EPSILON) {
        return res.status(400).json({
          success: false,
          message: `Remaining payment for ${targetMilestone}% phase is already completed`,
        });
      }

      stageRemainingAmount = remainingAmount;
      amountToCharge = Math.min(
        stageRemainingAmount,
        RAZORPAY_MAX_ORDER_AMOUNT_INR,
      );
      paymentStage = "completion";
    } else {
      return res.status(400).json({
        success: false,
        message: `Payment for ${targetMilestone}% phase is already completed`,
      });
    }

    if (amountToCharge <= CURRENCY_EPSILON) {
      return res.status(400).json({
        success: false,
        message: "Computed payable amount is invalid for this phase",
      });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Razorpay credentials are not configured on server",
      });
    }

    // Create Razorpay order (amount in paise)
    const razorpay = getRazorpay();
    const shortReceipt = `p${String(projectId).slice(-8)}m${targetMilestone}${paymentStage === "completion" ? "c" : "u"}${Date.now().toString().slice(-6)}`;
    const rawNotes = {
      projectId: projectId.toString(),
      milestonePercentage: targetMilestone.toString(),
      phaseName: String(phase.name || `Phase ${phaseIndex + 1}`),
      paymentStage,
      companyId: project.companyId ? project.companyId.toString() : "",
      customerId: project.customerId ? project.customerId.toString() : "",
    };
    const notes = Object.fromEntries(
      Object.entries(rawNotes)
        .filter(([, value]) => typeof value === "string" && value.length > 0)
        .map(([key, value]) => [key, value.slice(0, 255)]),
    );

    let order;
    try {
      order = await razorpay.orders.create({
        amount: Math.round(amountToCharge * 100),
        currency: "INR",
        receipt: shortReceipt,
        notes,
      });
    } catch (gatewayError) {
      const gatewayMessage =
        gatewayError?.error?.description ||
        gatewayError?.description ||
        gatewayError?.message ||
        "Unknown gateway error";
      const gatewayCode =
        gatewayError?.error?.code || gatewayError?.code || null;

      console.error("Razorpay create order failed:", {
        message: gatewayMessage,
        code: gatewayCode,
        amountToCharge,
        receipt: shortReceipt,
        notes,
      });

      return res.status(502).json({
        success: false,
        message: "Failed to create payment order",
        error: gatewayMessage,
        code: gatewayCode,
      });
    }

    if (!existingPayout) {
      project.paymentDetails.payouts.push({
        amount,
        customerPaidAmount: 0,
        immediateReleaseAmount,
        heldAmount: 0,
        platformFee,
        netAmount: amount,
        status: "pending",
        milestonePercentage: targetMilestone,
        phaseName: phase.name || `Phase ${phaseIndex + 1}`,
        phaseIndex,
        paymentStage,
        platformFeeStatus: "not_due",
        razorpayOrderId: order.id,
      });
    } else {
      existingPayout.paymentStage = paymentStage;
      existingPayout.razorpayOrderId = order.id;
    }

    // Initialise totalAmount on first payment
    if (!project.paymentDetails.totalAmount) {
      project.paymentDetails.totalAmount = Number(project.proposal?.price || 0);
    }
    project.paymentDetails.platformFeeRate = COMPANY_PLATFORM_FEE_PERCENT;

    await project.save();

    await invalidateAdminRevenueIntelligenceCache();

    res.json({
      success: true,
      message: "Razorpay order created",
      data: {
        razorpayOrderId: order.id,
        amount: amountToCharge,
        amountInPaise: order.amount,
        currency: "INR",
        keyId: process.env.RAZORPAY_KEY_ID,
        milestone: `${targetMilestone}% Milestone`,
        phaseName: phase.name || `Phase ${phaseIndex + 1}`,
        immediateReleaseAmount,
        completionAmount,
        stageRemainingAmount,
        remainingAfterThisOrder: roundCurrency(
          stageRemainingAmount - amountToCharge,
        ),
        installmentCountForCurrentStage: Math.max(
          1,
          Math.ceil(stageRemainingAmount / RAZORPAY_MAX_ORDER_AMOUNT_INR),
        ),
        paymentStage,
        platformFeePercent: COMPANY_PLATFORM_FEE_PERCENT,
      },
    });
  } catch (error) {
    console.error("Error creating company payment order:", {
      message: error?.message,
      stack: error?.stack,
    });
    res.status(500).json({
      success: false,
      message: "Failed to create payment order",
      error: error.message,
    });
  }
};

/**
 * Step 2 — Verify Razorpay payment signature, release 75% immediately,
 * and hold 25% in escrow until customer approval.
 * Called by frontend after customer completes payment on Razorpay checkout.
 *
 * Body: { projectId, milestonePercentage, razorpay_order_id, razorpay_payment_id, razorpay_signature }
 */
const verifyCompanyPayment = async (req, res) => {
  try {
    const {
      projectId,
      milestonePercentage,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      testBypass,
      testAmount,
    } = req.body;

    const isTestBypass = Boolean(testBypass);

    if (!projectId) {
      return res
        .status(400)
        .json({ success: false, message: "projectId is required" });
    }

    if (
      !isTestBypass &&
      (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "projectId, razorpay_order_id, razorpay_payment_id and razorpay_signature are required",
      });
    }

    if (isTestBypass && process.env.NODE_ENV === "production") {
      return res.status(403).json({
        success: false,
        message: "Test payment bypass is disabled in production",
      });
    }

    if (!isTestBypass) {
      // Verify HMAC signature
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({
          success: false,
          message: "Payment verification failed — invalid signature",
        });
      }
    }

    const project = await ConstructionProjectSchema.findById(projectId);
    if (!project)
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });

    ensureCompanyPaymentDetails(project);

    const requestedMilestone = Number(milestonePercentage || 0);
    // Find matching payout for this order (upfront or completion stage)
    const payout = isTestBypass
      ? project.paymentDetails.payouts.find(
          (p) =>
            Number(p.milestonePercentage) === requestedMilestone &&
            ["pending", "held"].includes(p.status),
        )
      : project.paymentDetails.payouts.find(
          (p) =>
            p.razorpayOrderId === razorpay_order_id &&
            ["pending", "held"].includes(p.status),
        );
    if (!payout) {
      return res
        .status(404)
        .json({ success: false, message: "Matching payout order not found" });
    }

    const effectiveMilestone = Number(
      milestonePercentage || payout.milestonePercentage,
    );
    const now = new Date();
    const milestone = (project.milestones || []).find(
      (m) => Number(m.percentage) === effectiveMilestone && m.isCheckpoint,
    );

    let paidChunkAmount = 0;
    if (isTestBypass) {
      paidChunkAmount = roundCurrency(Number(testAmount || 0));
    } else {
      try {
        const orderDetails = await razorpay.orders.fetch(razorpay_order_id);
        paidChunkAmount = roundCurrency(
          Number(orderDetails?.amount || 0) / 100,
        );
      } catch (orderFetchError) {
        console.warn(
          "Unable to fetch Razorpay order during verification, using computed fallback amount.",
          {
            message: orderFetchError?.message,
            razorpay_order_id,
          },
        );
      }
    }

    if (paidChunkAmount <= CURRENCY_EPSILON) {
      const fallbackRemaining = roundCurrency(
        Number(payout.amount || 0) - Number(payout.customerPaidAmount || 0),
      );
      paidChunkAmount = fallbackRemaining;
    }

    if (paidChunkAmount <= CURRENCY_EPSILON) {
      return res.status(400).json({
        success: false,
        message: "Unable to determine paid amount for this payment",
      });
    }

    const totalPhaseAmount = roundCurrency(Number(payout.amount || 0));
    const upfrontTarget = roundCurrency(
      Number(
        payout.immediateReleaseAmount ||
          (totalPhaseAmount * COMPANY_INITIAL_RELEASE_PERCENT) / 100,
      ),
    );
    const completionTarget = roundCurrency(totalPhaseAmount - upfrontTarget);
    const transactionOrderId = razorpay_order_id || `test_order_${Date.now()}`;
    const transactionPaymentId =
      razorpay_payment_id || `test_payment_${Date.now()}`;

    let releasedAmount = 0;
    let responseMessage = "";
    let releaseTransaction = null;

    if (payout.status === "pending") {
      if (upfrontTarget <= CURRENCY_EPSILON) {
        return res.status(400).json({
          success: false,
          message: "Invalid initial amount configured for this phase",
        });
      }

      const remainingUpfront = roundCurrency(
        upfrontTarget - Number(payout.customerPaidAmount || 0),
      );
      const appliedUpfrontAmount = roundCurrency(
        Math.min(remainingUpfront, paidChunkAmount),
      );

      if (appliedUpfrontAmount <= CURRENCY_EPSILON) {
        return res.status(400).json({
          success: false,
          message: "Initial payment is already complete for this phase",
        });
      }

      payout.razorpayPaymentId = razorpay_payment_id;
      payout.customerPaidAt = now;
      payout.initialReleaseDate = now;
      payout.customerPaidAmount = roundCurrency(
        Number(payout.customerPaidAmount || 0) + appliedUpfrontAmount,
      );
      payout.platformFeeStatus = "not_due";

      const remainingAfterUpfront = roundCurrency(
        upfrontTarget - Number(payout.customerPaidAmount || 0),
      );
      payout.status =
        remainingAfterUpfront <= CURRENCY_EPSILON ? "held" : "pending";

      releasedAmount = appliedUpfrontAmount;
      project.paymentDetails.amountPaidToCompany = roundCurrency(
        Number(project.paymentDetails.amountPaidToCompany || 0) +
          releasedAmount,
      );
      if (milestone && milestone.payments) {
        const paidUpfrontSoFar = roundCurrency(
          Math.min(Number(payout.customerPaidAmount || 0), upfrontTarget),
        );
        milestone.payments.upfront.amount = paidUpfrontSoFar;
        milestone.payments.upfront.status =
          paidUpfrontSoFar >= upfrontTarget ? "released" : "pending";
        if (paidUpfrontSoFar >= upfrontTarget) {
          milestone.payments.upfront.releasedAt = now;
        }
        milestone.payments.completion.amount = completionTarget;
        milestone.payments.completion.status = "pending";
      }

      if (payout.status === "held") {
        appendCustomerMilestoneNotification(
          project,
          effectiveMilestone,
          `Initial ${COMPANY_INITIAL_RELEASE_PERCENT}% payment completed for ${effectiveMilestone}% phase.`,
          now,
        );
      }

      releaseTransaction = new Transaction({
        transactionType: "milestone_release",
        amount: releasedAmount,
        platformFee: 0,
        netAmount: releasedAmount,
        projectId: project._id,
        projectType: "construction",
        companyId: project.companyId,
        customerId: project.customerId,
        status: "completed",
        paymentMethod: "razorpay",
        razorpayOrderId: transactionOrderId,
        razorpayPaymentId: transactionPaymentId,
        description:
          payout.status === "held"
            ? `Initial ${COMPANY_INITIAL_RELEASE_PERCENT}% fully paid and released to company — ${effectiveMilestone}% phase`
            : `Initial ${COMPANY_INITIAL_RELEASE_PERCENT}% installment received and released to company — ${effectiveMilestone}% phase`,
        milestonePercentage: effectiveMilestone,
        processedAt: now,
      });
      await releaseTransaction.save();

      responseMessage =
        payout.status === "held"
          ? `Initial ${COMPANY_INITIAL_RELEASE_PERCENT}% payment is complete for ${effectiveMilestone}% phase. Remaining ${100 - COMPANY_INITIAL_RELEASE_PERCENT}% can be paid after customer approval.`
          : `Installment received for initial ${COMPANY_INITIAL_RELEASE_PERCENT}% payment of ${effectiveMilestone}% phase. Continue paying remaining installment(s).`;
    } else {
      const remainingCompletionAmount = roundCurrency(
        Number(payout.amount || 0) - Number(payout.customerPaidAmount || 0),
      );
      if (remainingCompletionAmount <= CURRENCY_EPSILON) {
        return res.status(400).json({
          success: false,
          message: "Remaining amount is already paid for this phase",
        });
      }

      const appliedCompletionAmount = roundCurrency(
        Math.min(remainingCompletionAmount, paidChunkAmount),
      );
      if (appliedCompletionAmount <= CURRENCY_EPSILON) {
        return res.status(400).json({
          success: false,
          message: "Unable to apply installment for completion payment",
        });
      }

      payout.razorpayPaymentId = razorpay_payment_id;
      payout.customerPaidAt = payout.customerPaidAt || now;
      payout.customerPaidAmount = roundCurrency(
        Number(payout.customerPaidAmount || 0) + appliedCompletionAmount,
      );

      const remainingAfterCompletion = roundCurrency(
        Number(payout.amount || 0) - Number(payout.customerPaidAmount || 0),
      );
      payout.status =
        remainingAfterCompletion <= CURRENCY_EPSILON ? "released" : "held";
      if (payout.status === "released") {
        payout.releaseDate = now;
        payout.platformFeeStatus = "pending";
      } else {
        payout.platformFeeStatus = "not_due";
      }

      releasedAmount = appliedCompletionAmount;
      project.paymentDetails.amountPaidToCompany = roundCurrency(
        Number(project.paymentDetails.amountPaidToCompany || 0) +
          releasedAmount,
      );

      if (milestone && milestone.payments) {
        const paidCompletionSoFar = roundCurrency(
          Math.min(
            completionTarget,
            Math.max(0, Number(payout.customerPaidAmount || 0) - upfrontTarget),
          ),
        );
        milestone.payments.completion.amount = paidCompletionSoFar;
        milestone.payments.completion.status =
          paidCompletionSoFar >= completionTarget ? "released" : "pending";
        if (paidCompletionSoFar >= completionTarget) {
          milestone.payments.completion.releasedAt = now;
        }
      }

      if (payout.status === "released") {
        appendCustomerMilestoneNotification(
          project,
          effectiveMilestone,
          `Final ${100 - COMPANY_INITIAL_RELEASE_PERCENT}% payment completed for ${effectiveMilestone}% phase.`,
          now,
        );
      }

      releaseTransaction = new Transaction({
        transactionType: "milestone_release",
        amount: appliedCompletionAmount,
        platformFee: 0,
        netAmount: appliedCompletionAmount,
        projectId: project._id,
        projectType: "construction",
        companyId: project.companyId,
        customerId: project.customerId,
        status: "completed",
        paymentMethod: "razorpay",
        razorpayOrderId: transactionOrderId,
        razorpayPaymentId: transactionPaymentId,
        description:
          payout.status === "released"
            ? `Final ${100 - COMPANY_INITIAL_RELEASE_PERCENT}% paid and released to company — ${effectiveMilestone}% phase`
            : `Installment received for final ${100 - COMPANY_INITIAL_RELEASE_PERCENT}% payment — ${effectiveMilestone}% phase`,
        milestonePercentage: effectiveMilestone,
        processedAt: now,
      });
      await releaseTransaction.save();

      if (payout.status === "released") {
        const feeDueTransaction = new Transaction({
          transactionType: "platform_fee_due",
          amount: payout.platformFee || 0,
          platformFee: payout.platformFee || 0,
          netAmount: 0,
          projectId: project._id,
          projectType: "construction",
          companyId: project.companyId,
          customerId: project.customerId,
          milestonePercentage: effectiveMilestone,
          status: "pending",
          description: `Platform fee due (${COMPANY_PLATFORM_FEE_PERCENT}%) — ${effectiveMilestone}% phase`,
          processedAt: now,
        });
        await feeDueTransaction.save();
      }

      responseMessage =
        payout.status === "released"
          ? `Final ${100 - COMPANY_INITIAL_RELEASE_PERCENT}% payment is complete and released for ${effectiveMilestone}% phase.`
          : `Installment received for final ${100 - COMPANY_INITIAL_RELEASE_PERCENT}% payment of ${effectiveMilestone}% phase. Continue paying remaining installment(s).`;
    }

    const allReleased = project.paymentDetails.payouts.every(
      (p) => p.status === "released",
    );
    const allFeesCollected = project.paymentDetails.payouts.every((p) =>
      ["collected", "not_due"].includes(p.platformFeeStatus || "not_due"),
    );
    project.paymentDetails.paymentStatus =
      allReleased && allFeesCollected ? "completed" : "partially_paid";

    await project.save();

    await invalidateAdminRevenueIntelligenceCache();

    res.json({
      success: true,
      message: responseMessage,
      data: {
        amount: releasedAmount,
        phaseAmount: payout.amount,
        paidSoFar: payout.customerPaidAmount || 0,
        remainingAmount: roundCurrency(
          Number(payout.amount || 0) - Number(payout.customerPaidAmount || 0),
        ),
        immediateReleaseAmount: payout.immediateReleaseAmount || 0,
        heldAmount: payout.heldAmount || 0,
        platformFee: payout.platformFee,
        netAmountForCompany: payout.customerPaidAmount || 0,
        payoutStatus: payout.status,
        milestone: `${effectiveMilestone}%`,
        transactionId: releaseTransaction?._id,
        isTestBypass,
      },
    });
  } catch (error) {
    console.error("Error verifying company payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify payment",
      error: error.message,
    });
  }
};

/**
 * Step 3 — Release the remaining 25% to company after customer approval.
 * The 5% platform fee becomes due after the full phase payout is complete.
 *
 * Body: { projectId, milestonePercentage }
 */
const releaseCompanyMilestonePayment = async (req, res) => {
  try {
    const { projectId, milestonePercentage } = req.body;

    if (!projectId || !milestonePercentage) {
      return res.status(400).json({
        success: false,
        message: "projectId and milestonePercentage are required",
      });
    }

    const project = await ConstructionProjectSchema.findById(projectId);
    if (!project)
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });

    ensureCompanyPaymentDetails(project);

    const payout = project.paymentDetails.payouts.find(
      (p) => Number(p.milestonePercentage) === Number(milestonePercentage),
    );
    if (!payout) {
      return res.status(404).json({
        success: false,
        message: "No payment record found for this milestone.",
      });
    }

    if (payout.status === "released") {
      return res.json({
        success: true,
        message: `Milestone ${milestonePercentage}% payment is already fully released.`,
        data: {
          releasedToCompany: Number(payout.customerPaidAmount || 0),
          platformFee: Number(payout.platformFee || 0),
          totalPaidToCompany: project.paymentDetails.amountPaidToCompany || 0,
          paymentStatus: project.paymentDetails.paymentStatus,
        },
      });
    }

    const remainingAmount = roundCurrency(
      Number(payout.amount || 0) - Number(payout.customerPaidAmount || 0),
    );
    if (remainingAmount > 0) {
      return res.status(400).json({
        success: false,
        message: `Remaining payment of ₹${remainingAmount} must be collected before milestone release`,
      });
    }

    const holdAmount = 0;
    const platformFee = Number(payout.platformFee || 0);

    // Release the held 25%.
    payout.status = "released";
    payout.releaseDate = new Date();
    payout.platformFeeStatus = "pending";

    // Update milestone.payments status if milestone exists
    const milestone = project.milestones.find(
      (m) => m.percentage === milestonePercentage && m.isCheckpoint,
    );
    if (milestone && milestone.payments) {
      milestone.payments.completion.status = "released";
      milestone.payments.completion.releasedAt = new Date();
    }

    // Update total paid to company
    project.paymentDetails.amountPaidToCompany =
      (project.paymentDetails.amountPaidToCompany || 0) + holdAmount;

    // Project is complete only when funds are released and platform fees are collected.
    const allReleased = project.paymentDetails.payouts.every(
      (p) => p.status === "released",
    );
    const allFeesCollected = project.paymentDetails.payouts.every((p) =>
      ["collected", "not_due"].includes(p.platformFeeStatus || "not_due"),
    );
    if (allReleased && allFeesCollected)
      project.paymentDetails.paymentStatus = "completed";
    else project.paymentDetails.paymentStatus = "partially_paid";

    await project.save();

    // Milestone release transaction
    const releaseTransaction = new Transaction({
      transactionType: "milestone_release",
      amount: holdAmount,
      platformFee: 0,
      netAmount: holdAmount,
      projectId: project._id,
      projectType: "construction",
      companyId: project.companyId,
      customerId: project.customerId,
      razorpayOrderId: payout.razorpayOrderId,
      razorpayPaymentId: payout.razorpayPaymentId,
      status: "completed",
      paymentMethod: "razorpay",
      description: `Held 25% released to company — ${milestonePercentage}% phase`,
      milestonePercentage,
      metadata: { milestonePercentage },
      processedAt: new Date(),
    });
    await releaseTransaction.save();

    const feeDueTransaction = new Transaction({
      transactionType: "platform_fee_due",
      amount: platformFee,
      platformFee,
      netAmount: 0,
      projectId: project._id,
      projectType: "construction",
      companyId: project.companyId,
      customerId: project.customerId,
      milestonePercentage,
      status: "pending",
      description: `Platform fee due (${COMPANY_PLATFORM_FEE_PERCENT}%) — ${milestonePercentage}% phase`,
      processedAt: new Date(),
    });
    await feeDueTransaction.save();

    await invalidateAdminRevenueIntelligenceCache();

    res.json({
      success: true,
      message: `₹${holdAmount} released to company. Platform fee of ₹${platformFee} is now due before the next phase can start.`,
      data: {
        releasedToCompany: holdAmount,
        platformFee,
        totalPaidToCompany: project.paymentDetails.amountPaidToCompany,
        paymentStatus: project.paymentDetails.paymentStatus,
        releaseTransactionId: releaseTransaction._id,
      },
    });
  } catch (error) {
    console.error("Error releasing company payout:", error);
    res.status(500).json({
      success: false,
      message: "Failed to release payout",
      error: error.message,
    });
  }
};

const getPendingCompanyPlatformFees = async (req, res) => {
  try {
    const projects = await ConstructionProjectSchema.find({
      "paymentDetails.payouts.platformFeeStatus": "pending",
    })
      .populate("customerId", "name email phone")
      .populate("companyId", "companyName email contactPerson")
      .sort({ updatedAt: -1 });

    const items = [];
    projects.forEach((project) => {
      (project.paymentDetails?.payouts || []).forEach((payout) => {
        if (payout.platformFeeStatus !== "pending") return;

        items.push({
          projectId: project._id,
          projectName: project.projectName,
          milestonePercentage: payout.milestonePercentage,
          phaseName: payout.phaseName || `${payout.milestonePercentage}% Phase`,
          phaseAmount: payout.amount || 0,
          platformFee: payout.platformFee || 0,
          companyName: project.companyId?.companyName || "Unknown company",
          companyContact: project.companyId?.contactPerson || "",
          customerName: project.customerId?.name || "Unknown customer",
          releasedAt: payout.releaseDate || null,
          paymentStatus:
            project.paymentDetails?.paymentStatus || "partially_paid",
        });
      });
    });

    res.json({
      success: true,
      summary: {
        totalItems: items.length,
        totalPendingFees: items.reduce(
          (sum, item) => sum + Number(item.platformFee || 0),
          0,
        ),
      },
      items,
    });
  } catch (error) {
    console.error("Error fetching pending company platform fees:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch platform fee queue",
      error: error.message,
    });
  }
};

const collectCompanyPlatformFee = async (req, res) => {
  try {
    const { projectId, milestonePercentage, notes } = req.body;

    if (!projectId || !milestonePercentage) {
      return res.status(400).json({
        success: false,
        message: "projectId and milestonePercentage are required",
      });
    }

    const project = await ConstructionProjectSchema.findById(projectId);
    if (!project)
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });

    const payout = findCompanyPayout(project, milestonePercentage);
    if (
      !payout ||
      payout.status !== "released" ||
      payout.platformFeeStatus !== "pending"
    ) {
      return res.status(400).json({
        success: false,
        message: "No pending platform fee found for this phase",
      });
    }

    payout.platformFeeStatus = "collected";
    payout.platformFeeCollectedAt = new Date();
    payout.platformFeeCollectedBy = req.admin?.id || null;

    const allReleased = project.paymentDetails.payouts.every(
      (entry) => entry.status === "released",
    );
    const allFeesCollected = project.paymentDetails.payouts.every((entry) =>
      ["collected", "not_due"].includes(entry.platformFeeStatus || "not_due"),
    );
    if (allReleased && allFeesCollected) {
      project.paymentDetails.paymentStatus = "completed";
    }

    await project.save();

    const transaction = new Transaction({
      transactionType: "platform_fee_collection",
      amount: payout.platformFee || 0,
      platformFee: payout.platformFee || 0,
      netAmount: 0,
      projectId: project._id,
      projectType: "construction",
      companyId: project.companyId,
      customerId: project.customerId,
      milestonePercentage: Number(milestonePercentage),
      status: "completed",
      paymentMethod: "bank_transfer",
      description: `Platform fee collected (${COMPANY_PLATFORM_FEE_PERCENT}%) — ${payout.phaseName || `${milestonePercentage}% phase`}`,
      notes: notes || "",
      processedAt: new Date(),
    });
    await transaction.save();

    await invalidateAdminRevenueIntelligenceCache();

    res.json({
      success: true,
      message: "Platform fee marked as collected",
      data: {
        projectId,
        milestonePercentage: Number(milestonePercentage),
        platformFee: payout.platformFee || 0,
        paymentStatus: project.paymentDetails.paymentStatus,
        transactionId: transaction._id,
      },
    });
  } catch (error) {
    console.error("Error collecting company platform fee:", error);
    res.status(500).json({
      success: false,
      message: "Failed to collect platform fee",
      error: error.message,
    });
  }
};

const createCompanyPlatformFeeOrder = async (req, res) => {
  try {
    const { projectId, milestonePercentage } = req.body;

    if (!projectId || !milestonePercentage) {
      return res.status(400).json({
        success: false,
        message: "projectId and milestonePercentage are required",
      });
    }

    const project = await ConstructionProjectSchema.findById(projectId);
    if (!project)
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });

    const requesterId = req.user?.user_id ? String(req.user.user_id) : null;
    if (!requesterId || String(project.companyId) !== requesterId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to pay platform fee for this project",
      });
    }

    ensureCompanyPaymentDetails(project);

    const payout = findCompanyPayout(project, milestonePercentage);
    if (!payout || payout.status !== "released") {
      return res.status(400).json({
        success: false,
        message: "Platform fee is available only after phase payout release",
      });
    }

    if (
      payout.status === "released" &&
      Number(payout.platformFee || 0) > 0 &&
      payout.platformFeeStatus === "not_due"
    ) {
      payout.platformFeeStatus = "pending";
    }

    if (payout.platformFeeStatus === "collected") {
      return res.status(400).json({
        success: false,
        message: "Platform fee is already paid for this phase",
      });
    }

    const platformFeeAmount = roundCurrency(Number(payout.platformFee || 0));
    if (platformFeeAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Platform fee amount is invalid for this phase",
      });
    }

    if (platformFeeAmount > RAZORPAY_MAX_ORDER_AMOUNT_INR) {
      return res.status(400).json({
        success: false,
        message: `Platform fee exceeds maximum allowed per Razorpay order (Rs ${RAZORPAY_MAX_ORDER_AMOUNT_INR.toLocaleString("en-IN")})`,
      });
    }

    const razorpay = getRazorpay();
    const nowToken = `${Date.now()}`.slice(-8);
    const receipt = `pf_${String(project._id).slice(-6)}_${String(milestonePercentage)}_${nowToken}`;

    const rawNotes = {
      flow: "company_platform_fee",
      projectId: String(project._id),
      milestonePercentage: String(milestonePercentage),
      companyId: String(project.companyId || ""),
      customerId: String(project.customerId || ""),
      phaseName: String(payout.phaseName || `${milestonePercentage}% phase`),
    };
    const notes = Object.fromEntries(
      Object.entries(rawNotes)
        .filter(([, value]) => typeof value === "string" && value.length > 0)
        .map(([key, value]) => [key, value.slice(0, 255)]),
    );

    const order = await razorpay.orders.create({
      amount: Math.round(platformFeeAmount * 100),
      currency: "INR",
      receipt,
      notes,
    });

    payout.platformFeeRazorpayOrderId = order.id;
    await project.save();

    res.json({
      success: true,
      message: "Platform fee Razorpay order created",
      data: {
        razorpayOrderId: order.id,
        amount: platformFeeAmount,
        amountInPaise: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        projectName: project.projectName,
        milestone: `${Number(milestonePercentage)}%`,
        phaseName: payout.phaseName || `${milestonePercentage}% phase`,
      },
    });
  } catch (error) {
    console.error("Error creating company platform fee order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create platform fee order",
      error: error.message,
    });
  }
};

const verifyCompanyPlatformFeePayment = async (req, res) => {
  try {
    const {
      projectId,
      milestonePercentage,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      testBypass,
    } = req.body;

    const isTestBypass = Boolean(testBypass);

    if (!projectId || !milestonePercentage) {
      return res.status(400).json({
        success: false,
        message: "projectId and milestonePercentage are required",
      });
    }

    if (
      !isTestBypass &&
      (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "projectId, milestonePercentage, razorpay_order_id, razorpay_payment_id and razorpay_signature are required",
      });
    }

    if (isTestBypass && process.env.NODE_ENV === "production") {
      return res.status(403).json({
        success: false,
        message: "Test payment bypass is disabled in production",
      });
    }

    if (!isTestBypass) {
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({
          success: false,
          message: "Payment verification failed - invalid signature",
        });
      }
    }

    const project = await ConstructionProjectSchema.findById(projectId);
    if (!project)
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });

    const requesterId = req.user?.user_id ? String(req.user.user_id) : null;
    if (!requesterId || String(project.companyId) !== requesterId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to verify platform fee for this project",
      });
    }

    ensureCompanyPaymentDetails(project);

    const payout = findCompanyPayout(project, milestonePercentage);
    if (
      payout &&
      payout.status === "released" &&
      Number(payout.platformFee || 0) > 0 &&
      payout.platformFeeStatus === "not_due"
    ) {
      payout.platformFeeStatus = "pending";
    }

    if (
      !payout ||
      payout.status !== "released" ||
      payout.platformFeeStatus !== "pending"
    ) {
      return res.status(400).json({
        success: false,
        message: "No pending platform fee found for this phase",
      });
    }

    if (
      !isTestBypass &&
      payout.platformFeeRazorpayOrderId &&
      payout.platformFeeRazorpayOrderId !== razorpay_order_id
    ) {
      return res.status(400).json({
        success: false,
        message: "Order mismatch for this platform fee payment",
      });
    }

    const transactionOrderId =
      razorpay_order_id || `test_pf_order_${Date.now()}`;
    const transactionPaymentId =
      razorpay_payment_id || `test_pf_payment_${Date.now()}`;

    payout.platformFeeStatus = "collected";
    payout.platformFeeCollectedAt = new Date();
    payout.platformFeeRazorpayOrderId = transactionOrderId;
    payout.platformFeeRazorpayPaymentId = transactionPaymentId;

    const allReleased = project.paymentDetails.payouts.every(
      (entry) => entry.status === "released",
    );
    const allFeesCollected = project.paymentDetails.payouts.every((entry) =>
      ["collected", "not_due"].includes(entry.platformFeeStatus || "not_due"),
    );
    if (allReleased && allFeesCollected) {
      project.paymentDetails.paymentStatus = "completed";
    } else {
      project.paymentDetails.paymentStatus = "partially_paid";
    }

    await project.save();

    const transaction = new Transaction({
      transactionType: "platform_fee_collection",
      amount: Number(payout.platformFee || 0),
      platformFee: Number(payout.platformFee || 0),
      netAmount: 0,
      projectId: project._id,
      projectType: "construction",
      companyId: project.companyId,
      customerId: project.customerId,
      milestonePercentage: Number(milestonePercentage),
      status: "completed",
      paymentMethod: isTestBypass ? "bank_transfer" : "razorpay",
      razorpayOrderId: transactionOrderId,
      razorpayPaymentId: transactionPaymentId,
      description: `Platform fee paid via Razorpay (${COMPANY_PLATFORM_FEE_PERCENT}%) - ${payout.phaseName || `${milestonePercentage}% phase`}`,
      processedAt: new Date(),
    });
    await transaction.save();

    await invalidateAdminRevenueIntelligenceCache();

    res.json({
      success: true,
      message: "Platform fee payment verified successfully",
      data: {
        projectId,
        milestonePercentage: Number(milestonePercentage),
        platformFee: Number(payout.platformFee || 0),
        platformFeeStatus: payout.platformFeeStatus,
        paymentStatus: project.paymentDetails.paymentStatus,
        transactionId: transaction._id,
        isTestBypass,
      },
    });
  } catch (error) {
    console.error("Error verifying company platform fee payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify platform fee payment",
      error: error.message,
    });
  }
};

/**
 * Get full payment summary for a construction project.
 * GET /api/payment/company/summary/:projectId
 */
const getCompanyProjectPaymentSummary = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await ConstructionProjectSchema.findById(projectId).select(
      "projectName proposal paymentDetails milestones customerId companyId status",
    );
    if (!project)
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });

    const transactions = await Transaction.find({
      projectId,
      projectType: "construction",
    }).sort({ createdAt: -1 });

    const totalHeld = project.paymentDetails.payouts
      .filter((p) => p.status === "held")
      .reduce((s, p) => s + Number(p.heldAmount || 0), 0);

    const totalReleased = project.paymentDetails.payouts
      .filter((p) => p.status === "released")
      .reduce(
        (s, p) =>
          s + Number((p.immediateReleaseAmount || 0) + (p.heldAmount || 0)),
        0,
      );

    const platformEarned = project.paymentDetails.payouts
      .filter((p) => p.platformFeeStatus === "collected")
      .reduce((s, p) => s + (p.platformFee || 0), 0);

    const platformPending = project.paymentDetails.payouts
      .filter((p) => p.platformFeeStatus === "pending")
      .reduce((s, p) => s + (p.platformFee || 0), 0);

    res.json({
      success: true,
      data: {
        projectName: project.projectName,
        status: project.status,
        totalProjectAmount:
          project.paymentDetails.totalAmount || project.proposal?.price || 0,
        platformFeePercent: COMPANY_PLATFORM_FEE_PERCENT,
        totalHeldInEscrow: totalHeld,
        totalReleasedToCompany: project.paymentDetails.amountPaidToCompany || 0,
        totalPlatformEarned: platformEarned,
        totalPlatformPending: platformPending,
        paymentStatus: project.paymentDetails.paymentStatus,
        payouts: project.paymentDetails.payouts,
        recentTransactions: transactions.slice(0, 10),
      },
    });
  } catch (error) {
    console.error("Error fetching company payment summary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment summary",
      error: error.message,
    });
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  initializeEscrow,
  createWorkerPaymentOrder,
  verifyWorkerPayment,
  collectMilestonePayment,
  releaseMilestonePayment,
  getWorkerEarnings,
  requestWithdrawal,
  getTransactionHistory,

  // Company / construction project payments (Razorpay)
  createCompanyPaymentOrder,
  verifyCompanyPayment,
  releaseCompanyMilestonePayment,
  getPendingCompanyPlatformFees,
  collectCompanyPlatformFee,
  createCompanyPlatformFeeOrder,
  verifyCompanyPlatformFeePayment,
  getCompanyProjectPaymentSummary,

  // Helper exports for use in other controllers
  calculatePaymentBreakdown,
  calculateMilestonePayments,
  COMMISSION_RATES,
  MILESTONE_PERCENTAGES,
};
