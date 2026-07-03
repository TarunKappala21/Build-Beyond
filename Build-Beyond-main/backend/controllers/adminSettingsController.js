const { SystemSettings } = require('../models');

exports.getSettings = async (req, res) => {
  try {
    const settings = await SystemSettings.getSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching system settings", error: error.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const updateData = req.body;
    let settings = await SystemSettings.getSettings();
    
    // Update individual fields
    if (updateData.platformFeePercentage !== undefined) settings.platformFeePercentage = updateData.platformFeePercentage;
    if (updateData.autoApprovalThreshold !== undefined) settings.autoApprovalThreshold = updateData.autoApprovalThreshold;
    if (updateData.maxUploadSizeBytes !== undefined) settings.maxUploadSizeBytes = updateData.maxUploadSizeBytes;
    if (updateData.maintenanceMode !== undefined) settings.maintenanceMode = updateData.maintenanceMode;
    if (updateData.announcementMessage !== undefined) settings.announcementMessage = updateData.announcementMessage;

    await settings.save();
    
    res.json({ message: "Settings updated successfully", settings });
  } catch (error) {
    res.status(500).json({ message: "Error updating system settings", error: error.message });
  }
};