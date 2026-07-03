const express = require("express");
const router = express.Router();
const {
  submitArchitect,
  submitDesignRequest,
  submitConstructionForm,
  getProjects,
  getProjectById,
  getEditProject,
  updateProject,
  submitBid,
  acceptBid,
  declineBid,
  acceptWorkerRequest,
  rejectWorkerRequest,
  approveMilestone,
  requestMilestoneRevision,
  payMilestone,
  submitProjectReview,
  getProjectsWithUnviewedCustomerMessages,
  markCustomerMessagesViewed,
  getProjectsWithUnviewedCompanyMessages,
  markCompanyMessagesViewed,
  getCompanyNotifications,
} = require("../controllers/projectController");

const isAuthenticated = require("../middlewares/auth");
const { requireRole } = require("../middlewares/requireRole");
const { upload } = require("../middlewares/upload");

router.post(
  "/architect_submit",
  isAuthenticated,
  requireRole("customer"),
  upload.array("referenceImages", 10),
  submitArchitect,
);
router.post(
  "/design_request",
  isAuthenticated,
  requireRole("customer"),
  upload.any(),
  submitDesignRequest,
);
router.post(
  "/construction_form",
  isAuthenticated,
  requireRole("customer"),
  upload.any(),
  submitConstructionForm,
);
router.get("/projects", getProjects);
router.get("/projects/:id", getProjectById);
router.get("/edit-project/:id", isAuthenticated, requireRole("company"), getEditProject);
router.post(
  "/projects/update",
  isAuthenticated,
  requireRole("company"),
  upload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "additionalImages", maxCount: 10 },
    { name: "completionImages", maxCount: 10 },
    { name: "updateImages", maxCount: 1 },
  ]),
  updateProject,
);
router.post("/customer/submit-bid", isAuthenticated, requireRole("customer"), submitBid);
router.post("/customer/accept-bid", isAuthenticated, requireRole("customer"), acceptBid);
router.post("/customer/decline-bid", isAuthenticated, requireRole("customer"), declineBid);

router.post("/customer/approve-milestone", isAuthenticated, requireRole("customer"), approveMilestone);
router.post(
  "/customer/request-milestone-revision",
  isAuthenticated,
  requireRole("customer"),
  requestMilestoneRevision,
);
router.post("/customer/pay-milestone", isAuthenticated, requireRole("customer"), payMilestone);

router.get(
  "/company/unviewed-customer-messages",
  isAuthenticated,
  requireRole("company"),
  getProjectsWithUnviewedCustomerMessages,
);
router.get(
  "/company/notifications",
  isAuthenticated,
  requireRole("company"),
  getCompanyNotifications,
);
router.post(
  "/company/mark-messages-viewed/:projectId",
  isAuthenticated,
  requireRole("company"),
  markCustomerMessagesViewed,
);
router.get(
  "/customer/unviewed-company-messages",
  isAuthenticated,
  requireRole("customer"),
  getProjectsWithUnviewedCompanyMessages,
);
router.post(
  "/customer/mark-messages-viewed/:projectId",
  isAuthenticated,
  requireRole("customer"),
  markCompanyMessagesViewed,
);
router.post(
  "/customer/submit-project-review",
  isAuthenticated,
  requireRole("customer"),
  submitProjectReview,
);

router.post(
  "/company/worker-request/accept",
  isAuthenticated,
  requireRole("company"),
  acceptWorkerRequest,
);
router.post(
  "/company/worker-request/reject",
  isAuthenticated,
  requireRole("company"),
  rejectWorkerRequest,
);

module.exports = router;
