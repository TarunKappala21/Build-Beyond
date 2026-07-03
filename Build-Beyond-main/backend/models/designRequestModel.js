const mongoose = require('mongoose');

const designRequestSchema = new mongoose.Schema({
  projectName: { type: String, required: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  roomType: { type: String, required: true },
  roomSize: {
    length: { type: Number, required: true },
    width: { type: Number, required: true },
    unit: { type: String, required: true, enum: ['feet', 'meters'] },
  },
  ceilingHeight: {
    height: { type: Number },
    unit: { type: String, enum: ['feet', 'meters'] },
  },
  designPreference: { type: String },
  projectDescription: { type: String },
  currentRoomImages: [{ type: String }],
  inspirationImages: [{ type: String }],
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' },
  createdAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['pending', 'proposal_sent', 'pending_payment', 'accepted', 'rejected', 'completed'],
    default: 'pending',
  },
  finalAmount: { type: Number, default: 0 },
  proposal: {
    price: { type: Number },
    description: { type: String },
    sentAt: { type: Date },
  },
  projectUpdates: [
    {
      updateText: { type: String, required: true },
      updateImage: { type: String },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  milestones: [
    {
      percentage: { type: Number, required: true, min: 0, max: 100 },
      description: { type: String, required: true },
      status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Revision Requested', 'Under Review'], default: 'Pending' },
      image: { type: String },
      submittedAt: { type: Date, default: Date.now },
      approvedAt: { type: Date },
      rejectedAt: { type: Date },
      rejectionReason: { type: String },
      revisionRequestedAt: { type: Date },
      revisionNotes: { type: String },
      revisionHistory: [
        {
          requestedAt: { type: Date },
          notes: { type: String },
          resubmittedAt: { type: Date },
        },
      ],
      reportedToAdminAt: { type: Date },
      adminReport: { type: String },
      adminReviewNotes: { type: String },
    },
  ],
  review: {
    customerToWorker: {
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String },
      submittedAt: { type: Date },
    },
    workerToCustomer: {
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String },
      submittedAt: { type: Date },
    },
    isReviewCompleted: { type: Boolean, default: false },
  },
  paymentDetails: {
    totalAmount: { type: Number },
    platformCommission: { type: Number },
    workerAmount: { type: Number },
    escrowStatus: {
      type: String,
      enum: ['not_initiated', 'held', 'partially_released', 'fully_released'],
      default: 'not_initiated',
    },
    milestonePayments: [
      {
        percentage: { type: Number, required: true },
        amount: { type: Number, required: true },
        platformFee: { type: Number, required: true },
        workerPayout: { type: Number, required: true },
        paymentCollected: { type: Boolean, default: false },
        paymentCollectedAt: { type: Date },
        platformFeeStatus: { type: String, enum: ['not_due', 'pending', 'collected'], default: 'not_due' },
        platformFeeCollectedAt: { type: Date },
        platformFeeCollectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'PlatformManager' },
        status: {
          type: String,
          enum: ['pending', 'released', 'withdrawn'],
          default: 'pending',
        },
        releasedAt: { type: Date },
        withdrawnAt: { type: Date },
        transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
      },
    ],
    paymentInitiatedAt: { type: Date },
    stripeSessionId: { type: String },
    stripePaymentIntentId: { type: String },
  },
});

designRequestSchema.index({ customerId: 1, createdAt: -1 });
designRequestSchema.index({ workerId: 1, createdAt: -1 });
designRequestSchema.index({ status: 1, createdAt: -1 });
designRequestSchema.index({ projectName: 1 });
designRequestSchema.index({ createdAt: 1 });
designRequestSchema.index({ customerId: 1, status: 1, createdAt: -1 });
designRequestSchema.index({ workerId: 1, status: 1, createdAt: -1 });
designRequestSchema.index({ 'paymentDetails.milestonePayments.platformFeeStatus': 1, updatedAt: -1 });

module.exports =
  mongoose.models.DesignRequest ||
  mongoose.model('DesignRequest', designRequestSchema);
