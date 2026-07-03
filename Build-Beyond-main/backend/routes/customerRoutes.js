const express = require("express");
const router = express.Router();
const {
  submitBidForm,
  getDashboard,
  postConstructionForm,
  getJobRequestStatus,
  getConstructionCompaniesList,
  getArchitects,
  getArchitectForm,
  getOngoingProjects,
  getDesignIdeas,
  getInteriorDesignForm,
  getInteriorDesigners,
  getConstructionForm,
  getBidForm,
  getSettings,
  getBidSpace,
  acceptProposal,
  acceptCompanyBid,
  acceptCompanyProposal,
  acceptConstructionProposal,
  rejectCompanyProposal,
  rejectProposal,
  updateCustomerSettings,
  updatePassword,
  approveMilestone,
  rejectMilestone,
  requestMilestoneRevision,
  reportMilestoneToAdmin,
  getArchitectHiringDetails,
  getDesignRequestDetails,
  getPaymentHistory,
  getEditableRequestDetails,
  updateEditableRequest,
} = require("../controllers/customerController");

const {
  submitCustomerReview,
  getProjectReviewStatus,
} = require("../controllers/reviewController");
const { upload } = require("../middlewares/upload");
const auth = require("../middlewares/auth");
const { requireRole } = require("../middlewares/requireRole");

// Route to get logged-in customer profile
router.get("/customer/profile", auth, requireRole("customer"), async (req, res) => {
  try {
    const { Customer } = require("../models");
    const user = await Customer.findById(req.user.user_id).lean();
    if (!user) return res.status(404).json({ error: "Customer not found" });
    const { name, email, phone } = user;
    res.json({ name, email, phone });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// Public routes (no authentication required)
router.get("/home", getDashboard);
router.get("/customerdashboard", getDashboard);
router.get("/architect", getArchitects);
router.get("/architect_form", getArchitectForm);
router.get("/design_ideas", getDesignIdeas);
router.get("/constructionform", getConstructionForm);
router.post(
  "/constructionform",
  auth,
  requireRole("customer"),
  upload.any(),
  postConstructionForm,
);
router.post(
  "/bidForm_Submit",
  auth,
  requireRole("customer"),
  upload.fields([
    { name: "siteFiles", maxCount: 10 },
    { name: "floorImages", maxCount: 100 },
  ]),
  submitBidForm,
);
router.get("/bidform", getBidForm);

// Protected routes (require authentication)
router.get("/job_status", auth, requireRole("customer"), getJobRequestStatus);
router.get("/construction_companies_list", auth, requireRole("customer"), getConstructionCompaniesList);
router.get("/ongoing_projects", auth, requireRole("customer"), getOngoingProjects);
router.get("/interiordesign_form", auth, requireRole("customer"), getInteriorDesignForm);
router.get("/interior_designer", auth, requireRole("customer"), getInteriorDesigners);
router.get("/customersettings", auth, requireRole("customer"), getSettings);
router.post("/customersettings/update", auth, requireRole("customer"), updateCustomerSettings);
router.get("/bidspace", auth, requireRole("customer"), getBidSpace);
router.get("/customer/accept-proposal/:type/:id", auth, requireRole("customer"), acceptProposal);
router.get("/customer/accept-bid/:bidId/:companyBidId", auth, requireRole("customer"), acceptCompanyBid);
router.get(
  "/customer/accept-company-proposal/:projectId",
  auth,
  requireRole("customer"),
  acceptCompanyProposal,
);
router.post("/customer/accept-proposal", auth, requireRole("customer"), acceptConstructionProposal);
router.post(
  "/customer/reject-company-proposal/:projectId",
  auth,
  requireRole("customer"),
  rejectCompanyProposal,
);
router.post("/customer/reject-proposal/:type/:projectId", auth, requireRole("customer"), rejectProposal);
router.post("/customer/password/update", auth, requireRole("customer"), updatePassword);
router.post(
  "/customer/milestone/approve/:projectId/:milestoneId",
  auth,
  requireRole("customer"),
  approveMilestone,
);
router.post(
  "/customer/milestone/reject/:projectId/:milestoneId",
  auth,
  requireRole("customer"),
  rejectMilestone,
);
router.post(
  "/customer/milestone/request-revision/:projectId/:milestoneId",
  auth,
  requireRole("customer"),
  requestMilestoneRevision,
);
router.post(
  "/customer/milestone/report-to-admin/:projectId/:milestoneId",
  auth,
  requireRole("customer"),
  reportMilestoneToAdmin,
);

// Review routes
router.post("/customer/review", auth, requireRole("customer"), submitCustomerReview);
router.get(
  "/customer/review-status/:projectType/:projectId",
  auth,
  requireRole("customer"),
  getProjectReviewStatus,
);

// Payment checkout - get project details
router.get("/architect-hiring/:projectId", auth, requireRole("customer"), getArchitectHiringDetails);
router.get("/design-request/:projectId", auth, requireRole("customer"), getDesignRequestDetails);

// Payment history
router.get("/customer/payment-history", auth, requireRole("customer"), getPaymentHistory);

// Editable request routes
router.get(
  "/customer/editable-request/:type/:projectId",
  auth,
  requireRole("customer"),
  getEditableRequestDetails,
);
router.put(
  "/customer/editable-request/:type/:projectId",
  auth,
  requireRole("customer"),
  upload.any(),
  updateEditableRequest,
);

module.exports = router;
