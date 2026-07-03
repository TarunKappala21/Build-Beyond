const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const workerSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    rejectionReason: { type: String, default: '' },
    verificationReviewedAt: { type: Date },
    verificationReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlatformManager',
    },
    name: { type: String, required: true },
    email: {
      type: String,
      unique: true,
      required: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email'],
    },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    twoFactorEnabled: { type: Boolean, default: false },
    aadharNumber: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^\d{12}$/.test(v);
        },
        message: 'Aadhaar number must be 12 digits',
      },
    },
    dob: { type: Date, required: true },
    specialization: { type: String, required: true },
    experience: { type: Number, default: 0, min: 0 },
    certificateFiles: [{ type: String }],
    role: { type: String, default: 'worker' },
    profileImage: { type: String },
    professionalTitle: { type: String },
    about: { type: String },
    languages: [{ type: String, default: [] }],
    specialties: [{ type: String, default: [] }],
    previousCompanies: [
      {
        companyName: { type: String, required: true },
        location: { type: String, required: true },
        role: { type: String, required: true },
        duration: { type: String, required: true },
        proofs: [{ type: String, default: [] }],
        createdAt: { type: Date, default: Date.now },
      },
    ],
    projects: [
      {
        name: { type: String, required: true },
        year: { type: Number, min: 1900, max: 2100 },
        yearRange: { type: String },
        location: { type: String },
        description: { type: String },
        image: { type: String },
        images: [{ type: String, default: [] }],
        invoiceOrCertificate: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    reviews: [
      {
        projectId: { type: mongoose.Schema.Types.ObjectId },
        projectName: { type: String },
        projectType: { type: String, enum: ['architect', 'interior'] },
        customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
        customerName: { type: String },
        rating: { type: Number, min: 1, max: 5 },
        comment: { type: String },
        reviewedAt: { type: Date, default: Date.now },
      },
    ],
    isArchitect: { type: Boolean, default: false },
    servicesOffered: [{ type: String, default: [] }],
    availability: {
      type: String,
      enum: ['available', 'busy', 'unavailable'],
      default: 'available',
    },
    expectedPrice: { type: String },
    subscriptionPlan: {
      type: String,
      enum: ['basic', 'pro', 'premium'],
      default: 'basic',
    },
    commissionRate: {
      type: Number,
      default: 15,
      min: 0,
      max: 100,
    },
    earnings: {
      totalEarnings: { type: Number, default: 0 },
      pendingBalance: { type: Number, default: 0 },
      availableBalance: { type: Number, default: 0 },
      withdrawnAmount: { type: Number, default: 0 },
      monthlyEarnings: { type: Number, default: 0 },
      yearlyEarnings: { type: Number, default: 0 },
      lastResetMonth: { type: Number, default: new Date().getMonth() },
      lastResetYear: { type: Number, default: new Date().getFullYear() },
    },
  },
  { timestamps: true }
);

workerSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

workerSchema.index({ specialization: 1 });
workerSchema.index({ status: 1, createdAt: -1 });
workerSchema.index({ createdAt: -1 });
workerSchema.index({ isArchitect: 1 });
workerSchema.index({ availability: 1 });
workerSchema.index({ isArchitect: 1, status: 1, createdAt: -1 });
workerSchema.index({ specialization: 1, status: 1, createdAt: -1 });

module.exports =
  mongoose.models.Worker ||
  mongoose.model('Worker', workerSchema);
