const express = require("express");
const router = express.Router();
const {
  getJobs,
  getJoinCompany,
  getSettings,
  getEditProfile,
  getDashboard,
  getWorkerById,
  deleteWorkerRequest,
  createWorkerRequest,
  updateWorkerProfile,
  updateAvailability,
  acceptOffer,
  declineOffer,
  updateJobStatus,
  getOngoingProjects,
  postProjectUpdate,
  markProjectAsCompleted,
  submitProposal,
  updatePassword,
  getMyCompany,
  leaveCompany,
  submitMilestone,
} = require("../controllers/workerController");

const {
  submitWorkerReview,
  getProjectReviewStatus,
} = require("../controllers/reviewController");

const isAuthenticated = require("../middlewares/auth");
const { requireRole } = require("../middlewares/requireRole");
const { upload } = require("../middlewares/upload");

router.get("/workerjoin_company", isAuthenticated, requireRole("worker"), getJoinCompany);
router.get("/workersettings", isAuthenticated, requireRole("worker"), getSettings);
router.get("/worker_edit", isAuthenticated, requireRole("worker"), getEditProfile); // Protected this route
router.get("/worker/dashboard", isAuthenticated, requireRole("worker"), getDashboard);
router.get("/worker/jobs", isAuthenticated, requireRole("worker"), getJobs);
router.get("/worker/my-company", isAuthenticated, requireRole("worker"), getMyCompany);

router.get("/workers/:id", isAuthenticated, requireRole("worker"), getWorkerById);
router.delete("/worker-requests/:id", isAuthenticated, requireRole("company"), deleteWorkerRequest);

router.post(
  "/worker_request/:companyId",
  isAuthenticated,
  requireRole("worker"),
  upload.single("resume"),
  createWorkerRequest,
);

router.post(
  "/worker/profile/update",
  isAuthenticated,
  requireRole("worker"),
  upload.any(),
  updateWorkerProfile,
);

router.post("/worker/availability", isAuthenticated, requireRole("worker"), updateAvailability);

router.post("/offers/:id/accept", isAuthenticated, requireRole("worker"), acceptOffer);
router.post("/offers/:id/decline", isAuthenticated, requireRole("worker"), declineOffer);

router.post("/jobs/:id/status", isAuthenticated, requireRole("worker"), updateJobStatus);
router.get("/worker/ongoing-projects", isAuthenticated, requireRole("worker"), getOngoingProjects);
router.post(
  "/worker/project-update",
  isAuthenticated,
  requireRole("worker"),
  upload.single("updateImage"),
  postProjectUpdate,
);
router.post(
  "/worker/project-complete",
  isAuthenticated,
  requireRole("worker"),
  markProjectAsCompleted,
);
router.post("/worker/submit-proposal", isAuthenticated, requireRole("worker"), submitProposal);
router.post("/worker/password/update", isAuthenticated, requireRole("worker"), updatePassword);
router.post("/worker/leave-company", isAuthenticated, requireRole("worker"), leaveCompany);
router.post(
  "/worker/submit-milestone",
  isAuthenticated,
  requireRole("worker"),
  upload.single("image"),
  submitMilestone,
);

// Review routes
router.post("/worker/review", isAuthenticated, requireRole("worker"), submitWorkerReview);
router.get(
  "/worker/review-status/:projectType/:projectId",
  isAuthenticated,
  requireRole("worker"),
  getProjectReviewStatus,
);

module.exports = router;
