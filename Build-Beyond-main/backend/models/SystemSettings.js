const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  platformFeePercentage: {
    type: Number,
    default: 5.0,
    required: true
  },
  autoApprovalThreshold: {
    type: Number,
    default: 1000,
    required: true
  },
  maxUploadSizeBytes: {
    type: Number,
    default: 5242880, // 5MB
    required: true
  },
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  announcementMessage: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// Always return a single instance
systemSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);

module.exports = SystemSettings;