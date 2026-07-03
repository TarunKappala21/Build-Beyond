require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const http = require("http");
const { Server } = require("socket.io");
const cloudinary = require("cloudinary").v2;
const authRoutes = require("./routes/authRoutes");
const companyRoutes = require("./routes/companyRoutes");
const customerRoutes = require("./routes/customerRoutes");
const projectRoutes = require("./routes/projectRoutes");
const workerRoutes = require("./routes/workerRoutes");
const adminRoutes = require("./routes/adminRoutes");
const chatRoutes = require("./routes/chatRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const platformManagerRoutes = require("./routes/platformManagerRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const { setupSwagger } = require("./config/swagger");
const { initRedis } = require("./utils/redisClient");

const {
  PORT,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  FRONTEND_ORIGINS,
} = require("./config/constants");
const { ChatRoom } = require("./models");
const { authorizeChatAccess } = require("./controllers/chatController");

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

const app = express();
const server = http.createServer(app);

const allowedOrigins = new Set(FRONTEND_ORIGINS || []);
const corsOriginValidator = (origin, callback) => {
  // Allow same-origin/server-to-server calls where Origin header may be absent.
  if (!origin) return callback(null, true);
  if (allowedOrigins.has(origin)) return callback(null, true);
  // Allow any vercel preview URL or the main vercel url
  if (origin.endsWith('.vercel.app')) return callback(null, true);
  // Optional: you can add other domains here if needed
  return callback(new Error(`CORS blocked for origin: ${origin}`));
};

const io = new Server(server, {
  cors: {
    origin: Array.from(allowedOrigins),
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const helmetMiddleware = require("./middlewares/helmetMiddleware");
const morganMiddleware = require("./middlewares/morganMiddleware");
const rateLimiter = require("./middlewares/rateLimitMiddleware");
app.use(helmetMiddleware);
app.use(morganMiddleware);
app.use(rateLimiter);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.json());
app.use(express.static("Final Pages"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(
  cors({
    origin: corsOriginValidator,
    credentials: true,
  }),
);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
connectDB();
initRedis();

app.get("/", (req, res) => {
  res.status(200).json({ view: "landing_page" });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/signin_up", (req, res) => {
  res.status(200).json({ view: "signin_up_" });
});

app.get("/adminpage", (req, res) => {
  res.status(200).json({ view: "adminlogin" });
});

app.get("/logout", (req, res) => {
  const isSecureEnv = process.env.NODE_ENV === "production" || process.env.RENDER === "true";
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: isSecureEnv ? "none" : "lax",
    secure: isSecureEnv,
    path: "/",
  });
  res.status(200).json({ redirect: "/" });
});

app.get("/platformadmindashboard", (req, res) => {
  res.status(200).json({ view: "platform_admin/platform_admin_dashboard" });
});

// app.js
const routeMounts = [
  { basePath: "/api", router: authRoutes },
  { basePath: "/api", router: customerRoutes },
  { basePath: "/api", router: companyRoutes },
  { basePath: "/api", router: workerRoutes },
  { basePath: "/api", router: projectRoutes },
  { basePath: "/api", router: adminRoutes },
  { basePath: "/api", router: platformManagerRoutes },
  { basePath: "/api", router: chatRoutes },
  { basePath: "/api", router: reviewRoutes },
  { basePath: "/api/complaints", router: complaintRoutes },
  { basePath: "/api/payment", router: paymentRoutes },
];

routeMounts.forEach(({ basePath, router }) => {
  app.use(basePath, router);
});

// Client-side error logging endpoint
const logErrorToFile = require("./utils/errorLogger");
app.post("/api/log-client-error", (req, res) => {
  const { message, status, url, userAgent } = req.body;
  const errorLog = {
    message: message || "Client-side error",
    status: status || "N/A",
    method: "CLIENT",
    url: url || "Unknown",
    ip: req.ip,
    userAgent: userAgent || req.get("user-agent"),
    timestamp: new Date().toISOString(),
  };
  logErrorToFile(errorLog);
  console.log(
    `[${errorLog.timestamp}] Client Error: ${errorLog.status} - ${errorLog.message} at ${errorLog.url}`,
  );
  res.status(200).json({ success: true });
});

setupSwagger(app, routeMounts);

// 404 Not Found handler - must be after all routes
app.use((req, res, next) => {
  const err = new Error("Not Found");
  err.status = 404;
  next(err);
});

// Error middleware - must be last
const errorMiddleware = require("./middlewares/errorMiddleware");
app.use(errorMiddleware);

const onlineUsers = {};

io.on("connection", (socket) => {
  socket.on("joinRoom", async ({ roomId, userId, userRole }) => {
    if (!userId || !roomId) return;
    socket.join(roomId);
    onlineUsers[userId] = { socketId: socket.id, roomId, userRole };
    socket.userId = userId;
    socket.roomId = roomId;

    const authResult = await authorizeChatAccess(roomId, userId, userRole);
    if (authResult.authorized && authResult.otherUserId) {
      const otherUserId = authResult.otherUserId.toString();
      const other = onlineUsers[otherUserId];
      if (other) {
        io.to(other.socketId).emit("userStatus", { isOnline: true });
        socket.emit("userStatus", { isOnline: true });
      } else {
        socket.emit("userStatus", { isOnline: false });
      }
    } else if (!authResult.authorized) {
      socket.emit("userStatus", { isOnline: false });
    }
  });

  socket.on(
    "chatMessage",
    async ({ roomId, senderId, senderModel, message }) => {
      try {
        const chatRoom = await ChatRoom.findOne({ roomId });
        if (chatRoom) {
          const newMessage = {
            sender: senderId,
            senderModel,
            message,
            timestamp: new Date(),
          };
          chatRoom.messages.push(newMessage);
          await chatRoom.save();

          const messageData = {
            sender: senderId,
            senderModel,
            message,
            timestamp: newMessage.timestamp,
          };

          socket.to(roomId).emit("message", messageData);
          socket.emit("message", messageData);
        }
      } catch (error) {
        console.error("Error saving message:", error);
      }
    },
  );

  socket.on("disconnect", async () => {
    const userId = socket.userId;
    const roomId = socket.roomId;
    if (userId && onlineUsers[userId]) {
      const authResult = await authorizeChatAccess(
        roomId,
        userId,
        onlineUsers[userId].userRole,
      );
      const otherUserId = authResult.authorized
        ? authResult.otherUserId.toString()
        : null;
      delete onlineUsers[userId];
      if (otherUserId && onlineUsers[otherUserId]) {
        io.to(onlineUsers[otherUserId].socketId).emit("userStatus", {
          isOnline: false,
        });
      }
    }
  });
});

const MAX_PORT_RETRIES = 10;
let currentPort = Number(PORT) || 3000;
let retryCount = 0;

server.on("error", (error) => {
  if (error && error.code === "EADDRINUSE") {
    if (retryCount >= MAX_PORT_RETRIES) {
      console.error(
        `Port ${currentPort} is in use and retry limit reached (${MAX_PORT_RETRIES}). Exiting.`,
      );
      process.exit(1);
    }

    const nextPort = currentPort + 1;
    retryCount += 1;
    console.warn(
      `Port ${currentPort} is in use. Retrying on http://localhost:${nextPort}...`,
    );
    currentPort = nextPort;
    setTimeout(() => server.listen(currentPort), 150);
    return;
  }

  throw error;
});

server.listen(currentPort, () => {
  console.log(`Server running at http://localhost:${currentPort}`);
  console.log(`Accepting requests from http://localhost:5173`);
});
