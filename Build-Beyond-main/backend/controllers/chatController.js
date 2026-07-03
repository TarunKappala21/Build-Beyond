const ChatRoom = require("../models/chatModel");
const mongoose = require("mongoose");
const {
  ArchitectHiring,
  ConstructionProjectSchema,
  DesignRequest,
  Customer,
  Worker,
  Company,
  CompanytoWorker,
  WorkerToCompany,
} = require("../models");

const capitalize = (s) =>
  typeof s === "string" && s.length > 0
    ? s.charAt(0).toUpperCase() + s.slice(1)
    : "";

const authorizeChatAccess = async (roomId, userId, userRole) => {
  const chatRoom = await ChatRoom.findOne({ roomId }).lean();
  if (!chatRoom) return { authorized: false, message: "Chat room not found." };

  const isCustomer =
    chatRoom.customerId?.toString() === userId.toString() &&
    userRole === "customer";
  const isWorker =
    chatRoom.workerId?.toString() === userId.toString() &&
    userRole === "worker";
  const isCompany =
    chatRoom.companyId?.toString() === userId.toString() &&
    userRole === "company";

  if (!isCustomer && !isWorker && !isCompany) {
    return {
      authorized: false,
      message: "Unauthorized access to this chat room.",
    };
  }

  let otherUserId, otherUserModel;
  if (isCustomer) {
    otherUserId = chatRoom.workerId || chatRoom.companyId;
    otherUserModel = chatRoom.workerId ? "Worker" : "Company";
  } else if (isWorker) {
    otherUserId = chatRoom.customerId || chatRoom.companyId;
    otherUserModel = chatRoom.customerId ? "Customer" : "Company";
  } else {
    otherUserId = chatRoom.customerId;
    otherUserModel = "Customer";
  }

  return { authorized: true, chatRoom, otherUserId, otherUserModel };
};

const getChatPage = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user?.user_id;
    const userRole = req.user?.role;

    if (!userId || !userRole)
      return res.status(401).json({ error: "Unauthorized" });

    const { authorized, message, chatRoom, otherUserId, otherUserModel } =
      await authorizeChatAccess(roomId, userId, userRole);
    if (!authorized) return res.status(403).json({ error: message });

    const OtherUser = mongoose.model(otherUserModel);
    const otherUser =
      (await OtherUser.findById(otherUserId)
        .select("name companyName")
        .lean()) || {};
    const CurrentUser = mongoose.model(capitalize(userRole));
    const currentUser = await CurrentUser.findById(userId)
      .select("name companyName")
      .lean();

    if (!currentUser)
      return res.status(404).json({ error: "Current user profile not found." });

    const chatData = {
      roomId: chatRoom.roomId,
      userId: userId.toString(),
      userName: currentUser.name || currentUser.companyName || "You",
      userRole,
      otherUserName: otherUser.name || otherUser.companyName || "Other User",
      messages: chatRoom.messages,
      activePage: "chat",
    };

    // routed file : chat
    res.status(200).json(chatData);
  } catch (error) {
    console.error("Error fetching chat page:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

const findOrCreateChatRoom = async (projectId, projectType) => {
  try {
    const roomId = `room-${projectId}-${projectType}`;
    let project, customerId, workerId, companyId;

    if (projectType === "architect") {
      project = await ArchitectHiring.findById(projectId).lean();
      if (!project || project.status.toLowerCase() !== "accepted") return null;
      customerId = project.customer;
      workerId = project.worker;
    } else if (projectType === "interior") {
      project = await DesignRequest.findById(projectId).lean();
      if (!project || project.status.toLowerCase() !== "accepted") return null;
      customerId = project.customerId;
      workerId = project.workerId;
    } else if (projectType === "hiring") {
      project =
        (await CompanytoWorker.findById(projectId).lean()) ||
        (await WorkerToCompany.findById(projectId).lean());
      if (!project || project.status.toLowerCase() !== "accepted") return null;
      companyId = project.company || project.companyId;
      workerId = project.worker || project.workerId;
    } else if (projectType === "company") {
      project = await ConstructionProjectSchema.findById(projectId).lean();
      if (!project) return null;

      const projectStatus = (project.status || "").toLowerCase();
      if (
        ![
          "accepted",
          "pending payment",
          "pending_payment",
          "completed",
        ].includes(projectStatus)
      ) {
        return null;
      }

      customerId = project.customerId;
      companyId = project.companyId;
    }

    if (!project) return null;

    let chatRoom = await ChatRoom.findOne({ roomId });
    if (!chatRoom) {
      chatRoom = new ChatRoom({
        roomId,
        customerId,
        workerId,
        companyId,
        projectId,
        projectType,
        messages: [],
      });
      await chatRoom.save();
    }

    return chatRoom;
  } catch (error) {
    console.error("Error in findOrCreateChatRoom:", error);
    return null;
  }
};

const getChatRoomByProject = async (req, res) => {
  try {
    const { projectId, projectType } = req.params;
    const userId = req.user?.user_id;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!["architect", "interior", "company"].includes(projectType)) {
      return res
        .status(400)
        .json({ error: "Unsupported project type for this chat." });
    }

    if (!["customer", "worker", "company"].includes(userRole)) {
      return res
        .status(403)
        .json({ error: "Unauthorized role for this chat." });
    }

    const chatRoom = await findOrCreateChatRoom(projectId, projectType);
    if (!chatRoom) {
      return res
        .status(404)
        .json({ error: "Project not found or not accepted" });
    }

    const isAuthorized =
      (chatRoom.customerId?.toString() === userId && userRole === "customer") ||
      (chatRoom.workerId?.toString() === userId && userRole === "worker") ||
      (chatRoom.companyId?.toString() === userId && userRole === "company");

    if (!isAuthorized) {
      return res
        .status(403)
        .json({ error: "Unauthorized access to this chat" });
    }

    const otherUserModel =
      userRole === "customer"
        ? chatRoom.workerId
          ? "Worker"
          : "Company"
        : "Customer";
    const otherUserId =
      userRole === "customer"
        ? chatRoom.workerId || chatRoom.companyId
        : chatRoom.customerId;

    const OtherUser = mongoose.model(otherUserModel);
    const otherUser =
      (await OtherUser.findById(otherUserId)
        .select("name companyName")
        .lean()) || {};

    const CurrentUser = mongoose.model(capitalize(userRole));
    const currentUser = await CurrentUser.findById(userId)
      .select("name companyName")
      .lean();

    if (!currentUser) {
      return res.status(404).json({ error: "Current user profile not found" });
    }

    return res.status(200).json({
      roomId: chatRoom.roomId,
      userId: userId.toString(),
      userName: currentUser.name || currentUser.companyName || "You",
      userRole,
      otherUserName: otherUser.name || otherUser.companyName || "Other User",
      messages: chatRoom.messages || [],
    });
  } catch (error) {
    console.error("Error fetching chat room by project:", error);
    return res.status(500).json({ error: "Server Error" });
  }
};

module.exports = {
  getChatPage,
  findOrCreateChatRoom,
  authorizeChatAccess,
  getChatRoomByProject,
};
