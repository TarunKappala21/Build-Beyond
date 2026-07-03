const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    transactionType: {
      type: String,
      enum: [
        "escrow_hold",
        "milestone_release",
        "worker_withdrawal",
        "platform_commission",
        "platform_fee_due",
        "platform_fee_collection",
        "refund",
        "subscription_fee",
      ],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    platformFee: { type: Number, default: 0 },
    netAmount: { type: Number, required: true },

    projectId: { type: mongoose.Schema.Types.ObjectId },
    projectType: {
      type: String,
      enum: ["architect", "interior", "construction", "bid"],
    },
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: "Worker" },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },

    milestonePercentage: { type: Number, enum: [25, 50, 75, 100] },

    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },

    paymentMethod: {
      type: String,
      enum: ["stripe", "razorpay", "bank_transfer", "wallet"],
      default: "razorpay",
    },
    stripePaymentIntentId: { type: String },
    stripeSessionId: { type: String },
    razorpayOrderId: { type: String, index: true },
    razorpayPaymentId: { type: String },
    paymentGatewayResponse: { type: mongoose.Schema.Types.Mixed },

    bankDetails: {
      accountHolderName: { type: String },
      accountNumber: { type: String },
      ifscCode: { type: String },
      bankName: { type: String },
      transferId: { type: String },
    },

    description: { type: String },
    notes: { type: String },
    processedAt: { type: Date },
    failureReason: { type: String },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

transactionSchema.index({ workerId: 1, createdAt: -1 });
transactionSchema.index({ workerId: 1, status: 1, createdAt: -1 });
transactionSchema.index({ workerId: 1, transactionType: 1, createdAt: -1 });
transactionSchema.index({
  workerId: 1,
  status: 1,
  transactionType: 1,
  createdAt: -1,
});
transactionSchema.index({ companyId: 1, createdAt: -1 });
transactionSchema.index({ customerId: 1, createdAt: -1 });
transactionSchema.index({ projectId: 1 });
transactionSchema.index({ transactionType: 1, status: 1 });
transactionSchema.index({ projectType: 1, transactionType: 1, createdAt: -1 });
transactionSchema.index({ projectId: 1, projectType: 1, createdAt: -1 });
transactionSchema.index({ createdAt: 1 });

module.exports =
  mongoose.models.Transaction ||
  mongoose.model("Transaction", transactionSchema);
