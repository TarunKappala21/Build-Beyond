const { Complaint, ConstructionProjectSchema, PlatformManager } = require('../models');
const { autoAssignComplaint } = require('./platformManagerController');

// Submit a complaint (company or customer)
exports.submitComplaint = async (req, res) => {
  try {
    const { projectId, milestone, message } = req.body;

    if (!req.user || !req.user.user_id || !req.user.role) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const senderType = req.user.role === 'company' ? 'company' : req.user.role === 'customer' ? 'customer' : null;
    if (!senderType) {
      return res.status(403).json({ error: 'Only company or customer can submit complaints' });
    }

    const senderId = req.user.user_id;

    console.log('📝 Submitting complaint:', { projectId, milestone, senderType, senderId, message });
    if (![0, 25, 50, 75, 100].includes(Number(milestone))) {
      return res.status(400).json({ error: 'Invalid milestone' });
    }

    const project = await ConstructionProjectSchema.findById(projectId).select('customerId companyId');
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const senderMatchesProject =
      (senderType === 'customer' && project.customerId?.toString() === senderId.toString()) ||
      (senderType === 'company' && project.companyId?.toString() === senderId.toString());

    if (!senderMatchesProject) {
      return res.status(403).json({ error: 'You are not allowed to submit complaint for this project' });
    }

    const complaint = new Complaint({
      projectId,
      milestone: Number(milestone),
      senderType,
      senderId,
      message,
      replies: []
    });
    await complaint.save();
    console.log('✅ Complaint saved:', complaint);

    // Auto-assign complaint to platform manager
    try {
      await autoAssignComplaint(complaint._id);
    } catch (error) {
      console.error('Error auto-assigning complaint:', error);
      // Don't fail complaint submission if assignment fails
    }

    res.json({ success: true, complaint });
  } catch (err) {
    console.error('❌ Error saving complaint:', err);
    res.status(500).json({ error: 'Failed to submit complaint' });
  }
};

// Get all complaints for a project (admin)
exports.getProjectComplaints = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await ConstructionProjectSchema.findById(projectId).select('companyId customerId');
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (req.user?.role === 'company' && project.companyId?.toString() !== req.user.user_id?.toString()) {
      return res.status(403).json({ error: 'Unauthorized for this project' });
    }

    if (req.user?.role === 'customer' && project.customerId?.toString() !== req.user.user_id?.toString()) {
      return res.status(403).json({ error: 'Unauthorized for this project' });
    }

    const complaints = await Complaint.find({ projectId })
      .sort({ createdAt: -1 });

    const replyAdminIds = complaints
      .flatMap((complaint) => complaint.replies || [])
      .map((reply) => reply.adminId)
      .filter(Boolean);

    const replyAdmins = await PlatformManager.find({ _id: { $in: replyAdminIds } }).select('name username');
    const replyAdminMap = new Map(replyAdmins.map((admin) => [admin._id.toString(), admin]));

    const complaintsWithReplyDetails = complaints.map((complaint) => {
      const complaintData = complaint.toObject();
      complaintData.replies = (complaint.replies || []).map((reply) => {
        const admin = reply.adminId ? replyAdminMap.get(reply.adminId.toString()) : null;
        return {
          ...reply.toObject(),
          adminName: admin?.name || 'Platform Manager',
          adminUsername: admin?.username || ''
        };
      });
      return complaintData;
    });
    
    // Mark all complaints as viewed
    const markViewedUpdate = { isViewed: true };
    if (req.user?.role === 'company') {
      markViewedUpdate.hasUnviewedAdminReplyForCompany = false;
    }

    await Complaint.updateMany({ projectId }, { $set: markViewedUpdate });
    
    res.json({ success: true, complaints: complaintsWithReplyDetails });
  } catch (err) {
    console.error('Error fetching complaints:', err);
    res.status(500).json({ error: 'Failed to fetch complaints', details: err.message });
  }
};

// Get unviewed complaints count for admin dashboard
exports.getUnviewedComplaintsCount = async (req, res) => {
  try {
    const unviewedByProject = await Complaint.aggregate([
      { $match: { isViewed: false } },
      { $group: { _id: '$projectId', count: { $sum: 1 } } }
    ]);
    res.json({ success: true, unviewedByProject });
  } catch (err) {
    console.error('Error fetching unviewed complaints:', err);
    res.status(500).json({ error: 'Failed to fetch unviewed complaints count' });
  }
};

// Get unviewed complaints count for company (only from customers)
exports.getCompanyUnviewedComplaintsCount = async (req, res) => {
  try {
    console.log('🔍 Getting unviewed complaints for company (customer complaints only)');
    
    // First, let's see ALL complaints
    const allComplaints = await Complaint.find({});
    console.log('📊 Total complaints in DB:', allComplaints.length);
    console.log('📊 All complaints:', allComplaints.map(c => ({
      id: c._id,
      projectId: c.projectId,
      milestone: c.milestone,
      senderType: c.senderType,
      isViewed: c.isViewed
    })));
    
    const unviewedByProject = await Complaint.aggregate([
      { $match: { isViewed: false, senderType: 'customer' } },
      { $group: { _id: '$projectId', count: { $sum: 1 } } }
    ]);
    console.log('🔍 Found unviewed complaints:', unviewedByProject);
    res.json({ success: true, unviewedByProject });
  } catch (err) {
    console.error('Error fetching unviewed complaints:', err);
    res.status(500).json({ error: 'Failed to fetch unviewed complaints count' });
  }
};

// Admin reply to a complaint
exports.replyToComplaint = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { adminId, message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    complaint.replies.push({ adminId, message });
    complaint.hasUnviewedAdminReplyForCompany = true;
    await complaint.save();
    res.json({ success: true, complaint });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reply to complaint' });
  }
};
