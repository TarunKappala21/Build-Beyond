const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'ConstructionProjectSchema', required: true },
  milestone: { type: Number, enum: [0, 25, 50, 75, 100], required: true },
  senderType: { type: String, enum: ['company', 'customer'], required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  message: { type: String, required: true },
  isViewed: { type: Boolean, default: false },
  hasUnviewedAdminReplyForCompany: { type: Boolean, default: false },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'PlatformManager' },
  status: { type: String, enum: ['pending', 'in-progress', 'resolved', 'unassigned'], default: 'unassigned' },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'PlatformManager' },
  resolvedAt: { type: Date },
  assignedAt: { type: Date },
  replies: [
    {
      adminId: { type: mongoose.Schema.Types.ObjectId },
      message: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

complaintSchema.index({ assignedTo: 1, status: 1, createdAt: -1 });
complaintSchema.index({ projectId: 1, milestone: 1 });
complaintSchema.index({ senderId: 1, createdAt: -1 });

module.exports =
  mongoose.models.Complaint ||
  mongoose.model('Complaint', complaintSchema);
