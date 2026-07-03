const express = require("express");
const router = express.Router();
const {
  submitCustomerReview,
  submitWorkerReview,
  getProjectReviewStatus,
} = require("../controllers/reviewController");
const auth = require("../middlewares/auth");
const isAuthenticated = require("../middlewares/auth");
const { requireRole } = require("../middlewares/requireRole");

router.post("/customer/review", auth, requireRole("customer"), submitCustomerReview);

router.post("/worker/review", isAuthenticated, requireRole("worker"), submitWorkerReview);

router.get(
  "/project-review-status/:projectType/:projectId",
  isAuthenticated,
  requireRole("customer", "worker"),
  getProjectReviewStatus,
);

module.exports = router;
