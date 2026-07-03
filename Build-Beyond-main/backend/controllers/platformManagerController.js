const bcrypt = require('bcrypt');
const { 
  PlatformManager, 
  VerificationTask, 
  Complaint, 
  Customer,
  Company, 
  Worker,
  TaskAssignmentCounter,
  ConstructionProjectSchema,
  ArchitectHiring,
  DesignRequest,
  Transaction,
} = require('../models');
const { invalidateCacheByPrefix } = require('../utils/redisCache');

const ADMIN_REVENUE_INTELLIGENCE_CACHE_PREFIX = 'admin:platform-revenue-intelligence:v1';
const ADMIN_ANALYTICS_CACHE_PREFIX = 'admin:analytics:v1';

const invalidateAdminRevenueIntelligenceCache = async () => {
  try {
    await Promise.all([
      invalidateCacheByPrefix(ADMIN_REVENUE_INTELLIGENCE_CACHE_PREFIX),
      invalidateCacheByPrefix(ADMIN_ANALYTICS_CACHE_PREFIX),
    ]);
  } catch (error) {
    console.error('Failed to invalidate admin revenue intelligence cache:', error.message);
  }
};

// ============================================
// SUPERADMIN Functions - Manage Platform Managers
// ============================================

// Create a new platform manager
const createPlatformManager = async (req, res) => {
  try {
    const { name, email, username, password } = req.body;

    if (!name || !email || !username || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'All fields are required' 
      });
    }

    // Check if username or email already exists
    const existing = await PlatformManager.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email or username already exists' 
      });
    }

    const platformManager = new PlatformManager({
      name,
      email,
      username,
      password,
      createdBy: 'superadmin'
    });

    await platformManager.save();

    // Return platform manager without password
    const pmData = platformManager.toObject();
    delete pmData.password;

    res.status(201).json({
      success: true,
      message: 'Platform manager created successfully',
      platformManager: pmData,
      credentials: {
        username,
        password: req.body.password // Return only in creation response
      }
    });
  } catch (error) {
    console.error('Error creating platform manager:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all platform managers
const getAllPlatformManagers = async (req, res) => {
  try {
    const platformManagers = await PlatformManager.find({})
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      platformManagers,
      count: platformManagers.length
    });
  } catch (error) {
    console.error('Error fetching platform managers:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get platform manager performance
const getPlatformManagerPerformance = async (req, res) => {
  try {
    const { id } = req.params;
    
    const platformManager = await PlatformManager.findById(id).select('-password');
    if (!platformManager) {
      return res.status(404).json({ success: false, error: 'Platform manager not found' });
    }

    // Get task statistics
    const verificationTasks = await VerificationTask.find({ assignedTo: id });
    const complaints = await Complaint.find({ assignedTo: id });

    // Calculate performance metrics
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const lastWeekVerifications = verificationTasks.filter(
      t => t.completedAt && new Date(t.completedAt) >= lastWeek
    ).length;

    const lastMonthVerifications = verificationTasks.filter(
      t => t.completedAt && new Date(t.completedAt) >= lastMonth
    ).length;

    const lastWeekComplaints = complaints.filter(
      c => c.resolvedAt && new Date(c.resolvedAt) >= lastWeek
    ).length;

    const lastMonthComplaints = complaints.filter(
      c => c.resolvedAt && new Date(c.resolvedAt) >= lastMonth
    ).length;

    const performance = {
      platformManager,
      stats: platformManager.stats,
      recentActivity: {
        lastWeek: {
          verificationsCompleted: lastWeekVerifications,
          complaintsResolved: lastWeekComplaints,
          total: lastWeekVerifications + lastWeekComplaints
        },
        lastMonth: {
          verificationsCompleted: lastMonthVerifications,
          complaintsResolved: lastMonthComplaints,
          total: lastMonthVerifications + lastMonthComplaints
        }
      },
      currentTasks: {
        pendingVerifications: verificationTasks.filter(t => t.status === 'pending' || t.status === 'in-progress').length,
        pendingComplaints: complaints.filter(c => c.status === 'pending' || c.status === 'in-progress').length
      }
    };

    res.json({ success: true, performance });
  } catch (error) {
    console.error('Error fetching platform manager performance:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete platform manager
const deletePlatformManager = async (req, res) => {
  try {
    const { id } = req.params;
    
    const platformManager = await PlatformManager.findById(id);
    if (!platformManager) {
      return res.status(404).json({ success: false, error: 'Platform manager not found' });
    }

    // Reassign their pending tasks to unassigned
    await VerificationTask.updateMany(
      { assignedTo: id, status: { $in: ['pending', 'in-progress'] } },
      { $set: { assignedTo: null, status: 'unassigned' } }
    );

    await Complaint.updateMany(
      { assignedTo: id, status: { $in: ['pending', 'in-progress'] } },
      { $set: { assignedTo: null, status: 'unassigned' } }
    );

    await PlatformManager.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Platform manager deleted and tasks reassigned'
    });
  } catch (error) {
    console.error('Error deleting platform manager:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Toggle platform manager status (active/inactive)
const togglePlatformManagerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    const platformManager = await PlatformManager.findById(id);
    if (!platformManager) {
      return res.status(404).json({ success: false, error: 'Platform manager not found' });
    }

    platformManager.status = platformManager.status === 'active' ? 'inactive' : 'active';
    await platformManager.save();

    res.json({
      success: true,
      message: `Platform manager ${platformManager.status === 'active' ? 'activated' : 'deactivated'}`,
      platformManager: { ...platformManager.toObject(), password: undefined }
    });
  } catch (error) {
    console.error('Error toggling platform manager status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// AUTO-ASSIGNMENT ALGORITHM (Round-Robin)
// ============================================

const assignTaskRoundRobin = async (taskType) => {
  try {
    // Get all active platform managers
    const activePMs = await PlatformManager.find({ status: 'active' }).sort({ createdAt: 1 });
    
    if (activePMs.length === 0) {
      return null; // No platform managers available
    }

    // Get or create assignment counter
    let counter = await TaskAssignmentCounter.findOne({ type: taskType });
    if (!counter) {
      counter = new TaskAssignmentCounter({ type: taskType, lastAssignedIndex: -1 });
    }

    // Round-robin: move to next platform manager
    counter.lastAssignedIndex = (counter.lastAssignedIndex + 1) % activePMs.length;
    await counter.save();

    return activePMs[counter.lastAssignedIndex];
  } catch (error) {
    console.error('Error in round-robin assignment:', error);
    return null;
  }
};

// Auto-assign verification tasks when company/worker registers
const autoAssignVerification = async (type, entityId, entityName) => {
  try {
    const assignee = await assignTaskRoundRobin('verification');
    
    const task = new VerificationTask({
      type,
      entityId,
      entityName,
      assignedTo: assignee ? assignee._id : null,
      status: assignee ? 'pending' : 'unassigned',
      assignedAt: assignee ? new Date() : null
    });

    await task.save();

    // Update platform manager stats
    if (assignee) {
      assignee.stats.totalAssigned += 1;
      assignee.stats.pendingTasks += 1;
      await assignee.save();
    }

    return task;
  } catch (error) {
    console.error('Error auto-assigning verification:', error);
    throw error;
  }
};

// Auto-assign complaint
const autoAssignComplaint = async (complaintId) => {
  try {
    const assignee = await assignTaskRoundRobin('complaint');
    
    if (!assignee) {
      return null;
    }

    const complaint = await Complaint.findByIdAndUpdate(
      complaintId,
      {
        assignedTo: assignee._id,
        status: 'pending',
        assignedAt: new Date()
      },
      { new: true }
    );

    // Update platform manager stats
    assignee.stats.totalAssigned += 1;
    assignee.stats.pendingTasks += 1;
    await assignee.save();

    return complaint;
  } catch (error) {
    console.error('Error auto-assigning complaint:', error);
    throw error;
  }
};

// ============================================
// PLATFORM MANAGER Functions - Own Dashboard
// ============================================

// Get platform manager dashboard
const getPlatformManagerDashboard = async (req, res) => {
  try {
    const platformManagerId = req.admin.id;
    
    const platformManager = await PlatformManager.findById(platformManagerId).select('-password');
    if (!platformManager) {
      return res.status(404).json({ success: false, error: 'Platform manager not found' });
    }

    // Get assigned verifications
    const verificationTasks = await VerificationTask.find({ assignedTo: platformManagerId })
      .sort({ createdAt: -1 });

    // Populate verification tasks with company/worker details
    const pendingVerifications = [];
    const completedVerifications = [];

    for (const task of verificationTasks) {
      let entity;
      if (task.type === 'company') {
        entity = await Company.findById(task.entityId).select('-password');
      } else {
        entity = await Worker.findById(task.entityId).select('-password');
      }

      const taskData = {
        ...task.toObject(),
        entityData: entity
      };

      if (task.status === 'pending' || task.status === 'in-progress') {
        pendingVerifications.push(taskData);
      } else {
        completedVerifications.push(taskData);
      }
    }

    // Get assigned complaints
    const complaints = await Complaint.find({ assignedTo: platformManagerId })
      .populate('projectId')
      .sort({ createdAt: -1 });

    const customerSenderIds = complaints
      .filter((complaint) => complaint.senderType === 'customer' && complaint.senderId)
      .map((complaint) => complaint.senderId);

    const companySenderIds = complaints
      .filter((complaint) => complaint.senderType === 'company' && complaint.senderId)
      .map((complaint) => complaint.senderId);

    const projectCustomerIds = complaints
      .map((complaint) => complaint.projectId?.customerId)
      .filter(Boolean);

    const projectCompanyIds = complaints
      .map((complaint) => complaint.projectId?.companyId)
      .filter(Boolean);

    const [customers, companies] = await Promise.all([
      Customer.find({ _id: { $in: [...customerSenderIds, ...projectCustomerIds] } }).select('name email phone'),
      Company.find({ _id: { $in: [...companySenderIds, ...projectCompanyIds] } }).select('companyName contactPerson email phone')
    ]);

    const customerMap = new Map(customers.map((customer) => [customer._id.toString(), customer]));
    const companyMap = new Map(companies.map((company) => [company._id.toString(), company]));

    const complaintsWithSender = complaints.map((complaint) => {
      const complaintData = complaint.toObject();
      const projectCustomer = complaint.projectId?.customerId
        ? customerMap.get(complaint.projectId.customerId.toString())
        : null;
      const projectCompany = complaint.projectId?.companyId
        ? companyMap.get(complaint.projectId.companyId.toString())
        : null;

      if (complaint.senderType === 'customer') {
        complaintData.userId = customerMap.get(complaint.senderId?.toString()) || projectCustomer || null;
      } else if (complaint.senderType === 'company') {
        complaintData.userId = companyMap.get(complaint.senderId?.toString()) || projectCompany || null;
      } else {
        complaintData.userId = null;
      }

      complaintData.senderDisplayName =
        complaintData.userId?.name ||
        complaintData.userId?.companyName ||
        complaintData.userId?.contactPerson ||
        'Unknown';
      complaintData.projectName = complaint.projectId?.projectName || complaint.projectId?.title || complaint.projectId?.projectTitle || 'Untitled Project';

      return complaintData;
    });

    const pendingComplaints = complaintsWithSender.filter(c => c.status === 'pending' || c.status === 'in-progress');
    const resolvedComplaints = complaintsWithSender.filter(c => c.status === 'resolved');

    res.json({
      success: true,
      platformManager,
      stats: platformManager.stats,
      tasks: {
        verifications: {
          pending: pendingVerifications,
          completed: completedVerifications,
          totalPending: pendingVerifications.length,
          totalCompleted: completedVerifications.length
        },
        complaints: {
          pending: pendingComplaints,
          resolved: resolvedComplaints,
          totalPending: pendingComplaints.length,
          totalResolved: resolvedComplaints.length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching platform manager dashboard:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get full details for one verification task assigned to current platform manager
const getVerificationTaskDetails = async (req, res) => {
  try {
    const { taskId } = req.params;
    const platformManagerId = req.admin.id;

    const task = await VerificationTask.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Verification task not found' });
    }

    if (!task.assignedTo || task.assignedTo.toString() !== platformManagerId) {
      return res.status(403).json({ success: false, error: 'This task is not assigned to you' });
    }

    let entityData = null;
    if (task.type === 'company') {
      entityData = await Company.findById(task.entityId).select('-password');
    } else {
      entityData = await Worker.findById(task.entityId).select('-password');
    }

    res.json({
      success: true,
      task,
      entityData
    });
  } catch (error) {
    console.error('Error fetching verification task details:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get platform manager analytics
const getPlatformManagerAnalytics = async (req, res) => {
  try {
    const platformManagerId = req.admin.id;
    
    const platformManager = await PlatformManager.findById(platformManagerId);
    if (!platformManager) {
      return res.status(404).json({ success: false, error: 'Platform manager not found' });
    }

    const verificationTasks = await VerificationTask.find({ assignedTo: platformManagerId });
    const complaints = await Complaint.find({ assignedTo: platformManagerId });

    // Time-based analytics
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last3Months = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const getStatsForPeriod = (startDate) => {
      const verificationsCompleted = verificationTasks.filter(
        t => t.completedAt && new Date(t.completedAt) >= startDate && 
        (t.status === 'verified' || t.status === 'rejected')
      );
      
      const complaintsResolved = complaints.filter(
        c => c.resolvedAt && new Date(c.resolvedAt) >= startDate && 
        c.status === 'resolved'
      );

      return {
        verificationsCompleted: verificationsCompleted.length,
        companiesVerified: verificationsCompleted.filter(t => t.type === 'company' && t.status === 'verified').length,
        workersVerified: verificationsCompleted.filter(t => t.type === 'worker' && t.status === 'verified').length,
        complaintsResolved: complaintsResolved.length,
        totalTasksCompleted: verificationsCompleted.length + complaintsResolved.length
      };
    };

    const analytics = {
      overall: platformManager.stats,
      periods: {
        lastWeek: getStatsForPeriod(lastWeek),
        lastMonth: getStatsForPeriod(lastMonth),
        last3Months: getStatsForPeriod(last3Months)
      },
      currentLoad: {
        pendingVerifications: verificationTasks.filter(t => t.status === 'pending' || t.status === 'in-progress').length,
        pendingComplaints: complaints.filter(c => c.status === 'pending' || c.status === 'in-progress').length
      }
    };

    res.json({ success: true, analytics });
  } catch (error) {
    console.error('Error fetching platform manager analytics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Change platform manager password
const changePlatformManagerPassword = async (req, res) => {
  try {
    const platformManagerId = req.admin.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        error: 'Current password and new password are required' 
      });
    }

    const platformManager = await PlatformManager.findById(platformManagerId);
    if (!platformManager) {
      return res.status(404).json({ success: false, error: 'Platform manager not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, platformManager.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }

    // Update password
    platformManager.password = newPassword; // Will be hashed by pre-save hook
    await platformManager.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Process verification task (verify or reject)
const processVerificationTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { action, notes } = req.body; // action: 'verify' or 'reject'
    const platformManagerId = req.admin.id;

    if (!["verify", "reject"].includes(action)) {
      return res.status(400).json({ success: false, error: 'Invalid action' });
    }

    if (action === 'reject' && (!notes || notes.trim().length < 10)) {
      return res.status(400).json({
        success: false,
        error: 'A valid rejection reason is required (minimum 10 characters)'
      });
    }

    const task = await VerificationTask.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Verification task not found' });
    }

    if (task.assignedTo.toString() !== platformManagerId) {
      return res.status(403).json({ success: false, error: 'This task is not assigned to you' });
    }

    // Update entity status
    const status = action === 'verify' ? 'verified' : 'rejected';
    const entityUpdate = {
      status,
      verificationReviewedAt: new Date(),
      verificationReviewedBy: platformManagerId,
      rejectionReason: action === 'reject' ? notes.trim() : ''
    };

    if (task.type === 'company') {
      await Company.findByIdAndUpdate(task.entityId, entityUpdate);
    } else {
      await Worker.findByIdAndUpdate(task.entityId, entityUpdate);
    }

    // Update task
    task.status = status;
    task.completedAt = new Date();
    task.completedBy = platformManagerId;
    task.notes = notes || '';
    await task.save();

    // Update platform manager stats
    const platformManager = await PlatformManager.findById(platformManagerId);
    platformManager.stats.totalCompleted += 1;
    platformManager.stats.pendingTasks -= 1;
    if (action === 'verify') {
      if (task.type === 'company') {
        platformManager.stats.companiesVerified += 1;
      } else {
        platformManager.stats.workersVerified += 1;
      }
    }
    await platformManager.save();

    res.json({
      success: true,
      message: `${task.type} ${action === 'verify' ? 'verified' : 'rejected'} successfully`,
      task
    });
  } catch (error) {
    console.error('Error processing verification task:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Reply to complaint
const getComplaintDetailsPM = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const platformManagerId = req.admin.id;

    const complaint = await Complaint.findById(complaintId)
      .populate('projectId')
      .populate('assignedTo', 'name email username')
      .populate('resolvedBy', 'name email username');

    if (!complaint) {
      return res.status(404).json({ success: false, error: 'Complaint not found' });
    }

    if (!complaint.assignedTo || complaint.assignedTo._id.toString() !== platformManagerId) {
      return res.status(403).json({ success: false, error: 'This complaint is not assigned to you' });
    }

    let senderDetails = null;
    let customerDetails = null;
    let companyDetails = null;

    if (complaint.projectId?.customerId) {
      customerDetails = await Customer.findById(complaint.projectId.customerId).select('name email phone');
    }
    if (complaint.projectId?.companyId) {
      companyDetails = await Company.findById(complaint.projectId.companyId).select('companyName contactPerson email phone location');
    }

    if (complaint.senderType === 'customer') {
      senderDetails = await Customer.findById(complaint.senderId).select('name email phone');
      if (!senderDetails) senderDetails = customerDetails;
    } else if (complaint.senderType === 'company') {
      senderDetails = await Company.findById(complaint.senderId).select('companyName contactPerson email phone');
      if (!senderDetails) senderDetails = companyDetails;
    }

    const projectSummary = complaint.projectId
      ? {
          projectName: complaint.projectId.projectName || complaint.projectId.title || complaint.projectId.projectTitle || 'N/A',
          projectAddress: complaint.projectId.projectAddress || complaint.projectId.projectLocation || 'N/A',
          status: complaint.projectId.status || 'N/A',
          timeline: complaint.projectId.projectTimeline || 'N/A',
          estimatedBudget: complaint.projectId.estimatedBudget || complaint.projectId.proposal?.price || null
        }
      : null;

    const replyAdminIds = (complaint.replies || [])
      .map((reply) => reply.adminId)
      .filter(Boolean);

    const replyAdmins = await PlatformManager.find({ _id: { $in: replyAdminIds } }).select('name username');
    const replyAdminMap = new Map(replyAdmins.map((admin) => [admin._id.toString(), admin]));

    const replies = (complaint.replies || []).map((reply) => {
      const admin = reply.adminId ? replyAdminMap.get(reply.adminId.toString()) : null;
      return {
        ...reply.toObject(),
        adminName: admin?.name || 'Platform Manager',
        adminUsername: admin?.username || ''
      };
    });

    res.json({
      success: true,
      complaint,
      senderDetails,
      replies,
      projectSummary,
      projectParties: {
        customer: customerDetails,
        company: companyDetails
      }
    });
  } catch (error) {
    console.error('Error fetching complaint details:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const replyToComplaintPM = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { message, markResolved } = req.body;
    const platformManagerId = req.admin.id;

    if (!message) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({ success: false, error: 'Complaint not found' });
    }

    if (complaint.assignedTo.toString() !== platformManagerId) {
      return res.status(403).json({ success: false, error: 'This complaint is not assigned to you' });
    }

    // Add reply
    complaint.replies.push({
      adminId: platformManagerId,
      message,
      createdAt: new Date()
    });

    // Update status if resolved
    if (markResolved) {
      complaint.status = 'resolved';
      complaint.resolvedBy = platformManagerId;
      complaint.resolvedAt = new Date();

      // Update platform manager stats
      const platformManager = await PlatformManager.findById(platformManagerId);
      platformManager.stats.totalCompleted += 1;
      platformManager.stats.pendingTasks -= 1;
      platformManager.stats.complaintsResolved += 1;
      await platformManager.save();
    } else if (complaint.status === 'pending') {
      complaint.status = 'in-progress';
    }

    await complaint.save();

    res.json({
      success: true,
      message: markResolved ? 'Complaint resolved successfully' : 'Reply added successfully',
      complaint
    });
  } catch (error) {
    console.error('Error replying to complaint:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getCompanyPaymentQueue = async (req, res) => {
  try {
    const [constructionProjects, architectProjects, interiorProjects] = await Promise.all([
      ConstructionProjectSchema.find({
        'paymentDetails.payouts.platformFeeStatus': 'pending',
      })
        .populate('companyId', 'companyName contactPerson email')
        .populate('customerId', 'name email')
        .sort({ updatedAt: -1 })
        .lean(),
      ArchitectHiring.find({
        'paymentDetails.milestonePayments.platformFeeStatus': 'pending',
      })
        .populate('worker', 'name email')
        .populate('customer', 'name email')
        .sort({ updatedAt: -1 })
        .lean(),
      DesignRequest.find({
        'paymentDetails.milestonePayments.platformFeeStatus': 'pending',
      })
        .populate('workerId', 'name email')
        .populate('customerId', 'name email')
        .sort({ updatedAt: -1 })
        .lean(),
    ]);

    const items = [];
    constructionProjects.forEach((project) => {
      (project.paymentDetails?.payouts || []).forEach((payout) => {
        if (payout.platformFeeStatus !== 'pending') return;

        items.push({
          itemType: 'company',
          projectType: 'construction',
          projectId: project._id,
          projectName: project.projectName,
          assigneeName: project.companyId?.companyName || 'Unknown company',
          assigneeEmail: project.companyId?.email || '',
          customerName: project.customerId?.name || 'Unknown customer',
          milestonePercentage: payout.milestonePercentage,
          phaseName: payout.phaseName || `${payout.milestonePercentage}% Phase`,
          phaseAmount: payout.amount || 0,
          platformFee: payout.platformFee || 0,
          invoiceUrl: payout.platformFeeInvoiceUrl || null,
          invoiceUploadedAt: payout.platformFeeInvoiceUploadedAt || null,
          releasedAt: payout.releaseDate || null,
        });
      });
    });

    architectProjects.forEach((project) => {
      (project.paymentDetails?.milestonePayments || []).forEach((milestone) => {
        if ((milestone.platformFeeStatus || 'not_due') !== 'pending') return;

        items.push({
          itemType: 'worker',
          projectType: 'architect',
          projectId: project._id,
          projectName: project.projectName || 'Architect Project',
          assigneeName: project.worker?.name || 'Unknown worker',
          assigneeEmail: project.worker?.email || '',
          customerName: project.customer?.name || 'Unknown customer',
          milestonePercentage: milestone.percentage,
          phaseName: `${milestone.percentage}% Milestone`,
          phaseAmount: milestone.amount || 0,
          platformFee: milestone.platformFee || 0,
          releasedAt: milestone.releasedAt || null,
        });
      });
    });

    interiorProjects.forEach((project) => {
      (project.paymentDetails?.milestonePayments || []).forEach((milestone) => {
        if ((milestone.platformFeeStatus || 'not_due') !== 'pending') return;

        items.push({
          itemType: 'worker',
          projectType: 'interior',
          projectId: project._id,
          projectName: project.projectName || 'Interior Project',
          assigneeName: project.workerId?.name || 'Unknown worker',
          assigneeEmail: project.workerId?.email || '',
          customerName: project.customerId?.name || 'Unknown customer',
          milestonePercentage: milestone.percentage,
          phaseName: `${milestone.percentage}% Milestone`,
          phaseAmount: milestone.amount || 0,
          platformFee: milestone.platformFee || 0,
          releasedAt: milestone.releasedAt || null,
        });
      });
    });

    res.json({
      success: true,
      summary: {
        totalItems: items.length,
        totalPendingFees: items.reduce((sum, item) => sum + Number(item.platformFee || 0), 0),
      },
      items,
    });
  } catch (error) {
    console.error('Error fetching company payment queue:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const collectCompanyPlatformFee = async (req, res) => {
  try {
    const { projectId, milestonePercentage } = req.params;
    const { notes, projectType = 'construction' } = req.body || {};

    if (projectType === 'construction') {
      const project = await ConstructionProjectSchema.findById(projectId);
      if (!project) {
        return res.status(404).json({ success: false, error: 'Project not found' });
      }

      const payout = (project.paymentDetails?.payouts || []).find(
        (entry) => Number(entry.milestonePercentage) === Number(milestonePercentage),
      );
      if (!payout || payout.platformFeeStatus !== 'pending') {
        return res.status(400).json({ success: false, error: 'Pending platform fee not found for this phase' });
      }
      if (!payout.platformFeeInvoiceUrl) {
        return res.status(400).json({ success: false, error: 'Invoice proof is required before verification' });
      }

      payout.platformFeeStatus = 'collected';
      payout.platformFeeCollectedAt = new Date();
      payout.platformFeeCollectedBy = req.admin?.id || null;

      const allReleased = (project.paymentDetails?.payouts || []).every((entry) => entry.status === 'released');
      const allFeesCollected = (project.paymentDetails?.payouts || []).every(
        (entry) => ['collected', 'not_due'].includes(entry.platformFeeStatus || 'not_due'),
      );
      if (allReleased && allFeesCollected) {
        project.paymentDetails.paymentStatus = 'completed';
      }

      await project.save();

      const transaction = new Transaction({
        transactionType: 'platform_fee_collection',
        amount: payout.platformFee || 0,
        platformFee: payout.platformFee || 0,
        netAmount: 0,
        projectId: project._id,
        projectType: 'construction',
        companyId: project.companyId,
        customerId: project.customerId,
        milestonePercentage: Number(milestonePercentage),
        status: 'completed',
        paymentMethod: 'bank_transfer',
        description: `Platform fee collected — ${payout.phaseName || `${milestonePercentage}% phase`}`,
        notes: notes || '',
        processedAt: new Date(),
      });
      await transaction.save();

      await invalidateAdminRevenueIntelligenceCache();

      return res.json({
        success: true,
        message: 'Platform fee collected successfully',
        data: {
          projectId,
          projectType,
          milestonePercentage: Number(milestonePercentage),
          platformFee: payout.platformFee || 0,
        },
      });
    }

    const Project = projectType === 'architect' ? ArchitectHiring : projectType === 'interior' ? DesignRequest : null;
    if (!Project) {
      return res.status(400).json({ success: false, error: 'Invalid project type for worker fee collection' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const milestone = (project.paymentDetails?.milestonePayments || []).find(
      (entry) => Number(entry.percentage) === Number(milestonePercentage),
    );
    if (!milestone || (milestone.platformFeeStatus || 'not_due') !== 'pending') {
      return res.status(400).json({ success: false, error: 'Pending worker platform fee not found for this milestone' });
    }

    milestone.platformFeeStatus = 'collected';
    milestone.platformFeeCollectedAt = new Date();
    milestone.platformFeeCollectedBy = req.admin?.id || null;

    const allReleased = (project.paymentDetails?.milestonePayments || []).every((entry) => entry.status === 'released');
    const allFeesCollected = (project.paymentDetails?.milestonePayments || []).every(
      (entry) => ['collected', 'not_due'].includes(entry.platformFeeStatus || 'not_due'),
    );
    if (allReleased && allFeesCollected) {
      project.paymentDetails.escrowStatus = 'fully_released';
    }

    await project.save();

    const transaction = new Transaction({
      transactionType: 'platform_fee_collection',
      amount: milestone.platformFee || 0,
      platformFee: milestone.platformFee || 0,
      netAmount: 0,
      projectId: project._id,
      projectType,
      workerId: project.worker || project.workerId,
      customerId: project.customer || project.customerId,
      milestonePercentage: Number(milestonePercentage),
      status: 'completed',
      paymentMethod: 'bank_transfer',
      description: `Worker platform fee collected — ${milestonePercentage}% milestone`,
      notes: notes || '',
      processedAt: new Date(),
    });
    await transaction.save();

    await invalidateAdminRevenueIntelligenceCache();

    return res.json({
      success: true,
      message: 'Worker platform fee collected successfully',
      data: {
        projectId,
        projectType,
        milestonePercentage: Number(milestonePercentage),
        platformFee: milestone.platformFee || 0,
      },
    });
  } catch (error) {
    console.error('Error collecting company platform fee:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  // Superadmin functions
  createPlatformManager,
  getAllPlatformManagers,
  getPlatformManagerPerformance,
  deletePlatformManager,
  togglePlatformManagerStatus,
  
  // Auto-assignment functions
  autoAssignVerification,
  autoAssignComplaint,
  
  // Platform manager functions
  getPlatformManagerDashboard,
  getVerificationTaskDetails,
  getPlatformManagerAnalytics,
  changePlatformManagerPassword,
  processVerificationTask,
  getComplaintDetailsPM,
  replyToComplaintPM,
  getCompanyPaymentQueue,
  collectCompanyPlatformFee,
};
