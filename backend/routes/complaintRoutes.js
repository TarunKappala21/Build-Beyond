const express = require("express");
const router = express.Router();
const complaintController = require("../controllers/complaintController");
const auth = require("../middlewares/auth");

// submit a complaint by company or customer
router.post("/", auth, complaintController.submitComplaint);

// count of unviewed complaints for the admin dashboard
router.get("/unviewed/count", complaintController.getUnviewedComplaintsCount);

// count of unviewed complaints for a company (only customer complaints)
router.get(
  "/company/unviewed/count",
  complaintController.getCompanyUnviewedComplaintsCount,
);

// get all complaints for a project
router.get("/:projectId", auth, complaintController.getProjectComplaints);

// admin to reply to a complaint
router.post("/:complaintId/reply", complaintController.replyToComplaint);

module.exports = router;
