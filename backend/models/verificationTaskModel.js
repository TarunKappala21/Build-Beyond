const mongoose = require('mongoose');

const verificationTaskSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['company', 'worker'], required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    entityName: { type: String, required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'PlatformManager' },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'verified', 'rejected', 'unassigned'],
      default: 'unassigned',
    },
    assignedAt: { type: Date },
    completedAt: { type: Date },
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'PlatformManager' },
    notes: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

verificationTaskSchema.index({ status: 1, assignedTo: 1, createdAt: -1 });
verificationTaskSchema.index({ type: 1, entityId: 1 });
verificationTaskSchema.index({ assignedTo: 1, status: 1, createdAt: -1 });

module.exports =
  mongoose.models.VerificationTask ||
  mongoose.model('VerificationTask', verificationTaskSchema);
