const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      unique: true,
      required: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email'],
    },
    dob: { type: Date, required: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    twoFactorEnabled: { type: Boolean, default: false },
    role: { type: String, default: 'customer' },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    reviews: [
      {
        projectId: { type: mongoose.Schema.Types.ObjectId },
        projectName: { type: String },
        projectType: { type: String, enum: ['architect', 'interior'] },
        workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' },
        workerName: { type: String },
        rating: { type: Number, min: 1, max: 5 },
        comment: { type: String },
        reviewedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

customerSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

customerSchema.index({ phone: 1 });
customerSchema.index({ createdAt: -1 });

module.exports =
  mongoose.models.Customer ||
  mongoose.model('Customer', customerSchema);
