const express = require('express');
const router = express.Router();

const {
  createPlatformManager,
  getAllPlatformManagers,
  getPlatformManagerPerformance,
  deletePlatformManager,
  togglePlatformManagerStatus,
  getPlatformManagerDashboard,
  getVerificationTaskDetails,
  getPlatformManagerAnalytics,
  changePlatformManagerPassword,
  processVerificationTask,
  getComplaintDetailsPM,
  replyToComplaintPM,
  getCompanyPaymentQueue,
  collectCompanyPlatformFee,
} = require('../controllers/platformManagerController');

const authadmin = require('../middlewares/authadmin');
const requireSuperadmin = require('../middlewares/requireSuperadmin');

// ============================================
// PLATFORM MANAGER LOGIN ROUTE
// ============================================
router.post('/platform-manager/login', authadmin);

// Platform manager session verification
router.get('/platform-manager/verify-session', authadmin, (req, res) => {
  res.json({ 
    authenticated: true, 
    role: req.admin?.role || 'platform_manager',
    user: {
      id: req.admin?.id,
      name: req.admin?.name,
      username: req.admin?.username
    }
  });
});

// Platform manager logout
router.post('/platform-manager/logout', (req, res) => {
  res.clearCookie('admin_token', { path: '/' });
  res.json({ message: 'Logged out successfully' });
});

// ============================================
// SUPERADMIN ROUTES - Manage Platform Managers
// ============================================
router.post('/admin/platform-managers', authadmin, requireSuperadmin, createPlatformManager);
router.get('/admin/platform-managers', authadmin, requireSuperadmin, getAllPlatformManagers);
router.get('/admin/platform-managers/:id/performance', authadmin, requireSuperadmin, getPlatformManagerPerformance);
router.delete('/admin/platform-managers/:id', authadmin, requireSuperadmin, deletePlatformManager);
router.patch('/admin/platform-managers/:id/toggle-status', authadmin, requireSuperadmin, togglePlatformManagerStatus);

// ============================================
// PLATFORM MANAGER ROUTES - Own Dashboard
// ============================================
router.get('/platform-manager/dashboard', authadmin, getPlatformManagerDashboard);
router.get('/platform-manager/analytics', authadmin, getPlatformManagerAnalytics);
router.post('/platform-manager/change-password', authadmin, changePlatformManagerPassword);

// Process verification tasks
router.get('/platform-manager/verification/:taskId', authadmin, getVerificationTaskDetails);
router.post('/platform-manager/verification/:taskId/process', authadmin, processVerificationTask);

// Reply to complaints
router.get('/platform-manager/complaint/:complaintId', authadmin, getComplaintDetailsPM);
router.post('/platform-manager/complaint/:complaintId/reply', authadmin, replyToComplaintPM);

// Company phase payment queue
router.get('/platform-manager/company-payments', authadmin, getCompanyPaymentQueue);
router.post('/platform-manager/company-payments/:projectId/:milestonePercentage/collect', authadmin, collectCompanyPlatformFee);

module.exports = router;
