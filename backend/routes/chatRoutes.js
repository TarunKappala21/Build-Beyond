const express = require("express");
const router = express.Router();
const {
  getChatPage,
  getChatRoomByProject,
} = require("../controllers/chatController");
const isAuthenticated = require("../middlewares/auth");
const { requireRole } = require("../middlewares/requireRole");

// Get or create customer-worker chat room by project context
router.get(
  "/chat/room/:projectId/:projectType",
  isAuthenticated,
  getChatRoomByProject
);

// Render the chat page for a specific room ID
router.get("/chat/:roomId", isAuthenticated, getChatPage);

module.exports = router;
