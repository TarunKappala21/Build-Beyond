const mongoose = require('mongoose');

const architectHiringSchema = new mongoose.Schema({
  projectName: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Proposal Sent', 'Pending Payment', 'Accepted', 'Rejected', 'Completed'],
    default: 'Pending',
  },
  finalAmount: { type: Number, default: 0 },
  proposal: {
    price: { type: Number },
    description: { type: String },
    phases: [
      {
        name: { type: String },
        percentage: { type: Number, min: 0, max: 100 },
        requiredMonths: { type: Number },
        amount: { type: Number },
        subdivisions: [
          {
            category: { type: String },
            description: { type: String },
            amount: { type: Number },
          },
        ],
      },
    ],
    sentAt: { type: Date },
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  worker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worker',
    required: false,
  },
  customerDetails: {
    fullName: { type: String, required: true, trim: true },
    contactNumber: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
  },
  customerAddress: {
    streetAddress: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    zipCode: { type: String, required: true, trim: true },
  },
  plotInformation: {
    plotLocation: { type: String, required: true, trim: true },
    plotSize: { type: String, required: true, trim: true },
    plotOrientation: {
      type: String,
      required: true,
      enum: ['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West'],
    },
  },
  designRequirements: {
    designType: {
      type: String,
      required: true,
      enum: ['Residential', 'Commercial', 'Landscape', 'Mixed-Use', 'Industrial', 'Other'],
    },
    numFloors: { type: String, required: true, enum: ['1', '2', '3', '4', '5+'] },
    floorRequirements: [
      {
        floorNumber: { type: Number, required: true },
        details: { type: String, trim: true },
      },
    ],
    specialFeatures: { type: String, trim: true },
    architecturalStyle: {
      type: String,
      required: true,
      enum: ['Modern', 'Traditional', 'Contemporary', 'Minimalist', 'Mediterranean', 'Victorian', 'Colonial', 'Industrial', 'Other'],
    },
  },
  additionalDetails: {
    budget: { type: String, trim: true },
    completionDate: { type: Date },
    referenceImages: [
      {
        url: { type: String, required: true },
        originalName: { type: String, required: true },
        mimeType: { type: String, required: true, enum: ['image/jpeg', 'image/png', 'application/pdf'] },
        size: { type: Number, required: true },
      },
    ],
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
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

architectHiringSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

architectHiringSchema.index({ customer: 1, createdAt: -1 });
architectHiringSchema.index({ worker: 1, createdAt: -1 });
architectHiringSchema.index({ status: 1, createdAt: -1 });
architectHiringSchema.index({ projectName: 1 });
architectHiringSchema.index({ customer: 1, status: 1, createdAt: -1 });
architectHiringSchema.index({ worker: 1, status: 1, createdAt: -1 });
architectHiringSchema.index({ 'paymentDetails.milestonePayments.platformFeeStatus': 1, updatedAt: -1 });

module.exports =
  mongoose.models.ArchitectHiring ||
  mongoose.model('ArchitectHiring', architectHiringSchema);
