const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const platformManagerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email'],
    },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    createdBy: { type: String, default: 'superadmin' },
    lastLogin: { type: Date },
    stats: {
      totalAssigned: { type: Number, default: 0 },
      totalCompleted: { type: Number, default: 0 },
      pendingTasks: { type: Number, default: 0 },
      companiesVerified: { type: Number, default: 0 },
      workersVerified: { type: Number, default: 0 },
      complaintsResolved: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

platformManagerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

platformManagerSchema.index({ status: 1, createdAt: -1 });

module.exports =
  mongoose.models.PlatformManager ||
  mongoose.model('PlatformManager', platformManagerSchema);
