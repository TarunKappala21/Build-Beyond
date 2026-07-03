const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const companySchema = new mongoose.Schema(
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
    companyName: { type: String, required: true },
    contactPerson: { type: String, required: true },
    email: {
      type: String,
      unique: true,
      required: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email'],
    },
    phone: { type: String, required: true },
    companyDocuments: [{ type: String, default: [] }],
    password: { type: String, required: true },
    twoFactorEnabled: { type: Boolean, default: false },
    role: { type: String, default: 'company' },
    location: {
      address: { type: String, default: '' },
      city: { type: String, default: 'Not specified' },
      state: { type: String, default: '' },
      country: { type: String, default: '' },
      postalCode: { type: String, default: '' },
    },
    description: { type: String },
    aboutCompany: { type: String },
    aboutForCustomers: { type: String },
    whyJoinUs: { type: String },
    currentOpenings: [{ type: String }],
    specialization: [{ type: String }],
    size: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'],
    },
    projectsCompleted: { type: String },
    yearsInBusiness: { type: String },
    completedProjects: [
      {
        title: { type: String },
        description: { type: String },
        beforeImage: { type: String },
        afterImage: { type: String },
        location: { type: String },
        tenderId: { type: String },
        materialCertificate: { type: String },
        gpsLink: { type: String },
      },
    ],
    didYouKnow: { type: String },
    profileType: {
      type: String,
      enum: ['worker', 'customer'],
      default: 'worker',
    },
  },
  { timestamps: true }
);

companySchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

companySchema.index({ status: 1, createdAt: -1 });
companySchema.index({ createdAt: -1 });
companySchema.index({ companyName: 1 });
companySchema.index({ profileType: 1 });

module.exports =
  mongoose.models.Company ||
  mongoose.model('Company', companySchema);
