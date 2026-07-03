const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    // Sender can be a Customer, Worker, or Company
    refPath: "senderModel",
  },
  senderModel: {
    type: String,
    required: true,
    enum: ["Customer", "Worker", "Company"],
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const chatRoomSchema = new mongoose.Schema(
  {
    // Unique ID for the chat room, e.g., 'room-60d0fe4f8b724c0015091d3d-architect'
    roomId: {
      type: String,
      required: true,
      unique: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Worker",
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    projectType: {
      type: String,
      enum: ["architect", "interior", "hiring", "company"],
      required: true,
    },
    messages: [messageSchema],
  },
  { timestamps: true },
);

module.exports =
  mongoose.models.ChatRoom || mongoose.model("ChatRoom", chatRoomSchema);
