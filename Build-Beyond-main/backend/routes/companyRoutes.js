const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  getDashboard,
  getOngoingProjects,
  getProjectRequests,
  updateProjectStatusController,
  getHiring,
  getSettings,
  getBids,
  getCompanyRevenue,
  createHireRequest,
  updateCompanyProfile,
  handleWorkerRequest,
  submitBidController,
  submitProjectProposal,
  getEmployees,
  updatePassword,
  uploadPlatformFeeInvoice,
} = require("../controllers/companyController");
const isAuthenticated = require("../middlewares/auth");
const { requireRole } = require("../middlewares/requireRole");
const { upload: cloudUpload } = require("../middlewares/upload");

// Create a Multer instance for handling FormData
const upload = multer();

router.get('/companydashboard', isAuthenticated, requireRole('company'), getDashboard);
router.get('/companyongoing_projects', isAuthenticated, requireRole('company'), getOngoingProjects);
router.get('/project_requests', isAuthenticated, requireRole('company'), getProjectRequests);
router.patch('/projects/:projectId/:status', isAuthenticated, requireRole('company'), updateProjectStatusController);
router.get('/companyhiring', isAuthenticated, requireRole('company'), getHiring);

// Add upload.any() middleware to parse FormData
router.post(
  "/companytoworker",
  isAuthenticated,
  requireRole('company'),
  upload.any(),
  createHireRequest,
);

router.get("/companysettings", isAuthenticated, requireRole('company'), getSettings);
router.get("/companybids", isAuthenticated, requireRole('company'), getBids);
router.get("/companyrevenue", isAuthenticated, requireRole('company'), getCompanyRevenue);
router.get("/my-employees", isAuthenticated, requireRole('company'), getEmployees);
router.get("/revenue_form", isAuthenticated, requireRole('company'), (req, res) => {
  res.status(200).json({ view: "company/revenue_form" });
});
router.patch(
  "/worker-request/:requestId",
  isAuthenticated,
  requireRole('company'),
  handleWorkerRequest,
);
router.post(
  "/update-company-profile",
  isAuthenticated,
  requireRole('company'),
  upload.any(),
  updateCompanyProfile,
);
router.post("/submit-bid", isAuthenticated, requireRole('company'), submitBidController);
router.post("/company/submit-proposal", isAuthenticated, requireRole('company'), submitProjectProposal);
router.post("/company/password/update", isAuthenticated, requireRole('company'), updatePassword);
router.post("/company/platform-fee-invoice", isAuthenticated, requireRole('company'), cloudUpload.single('invoice'), uploadPlatformFeeInvoice);

module.exports = router;
