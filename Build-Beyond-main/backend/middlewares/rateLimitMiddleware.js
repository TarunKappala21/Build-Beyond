// rateLimitMiddleware.js
const rateLimit = require("express-rate-limit");

// Single rate limiter for all requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3000, 
  message: {
    error: "Too many requests from this IP, please try again later.",
    status: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    const logErrorToFile = require("../utils/errorLogger");
    const errorLog = {
      message: "Rate limit exceeded",
      status: 429,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get("user-agent"),
      timestamp: new Date().toISOString(),
    };
    logErrorToFile(errorLog);
    console.log(
      `[${errorLog.timestamp}] Rate limit exceeded: ${req.ip} - ${req.method} ${req.originalUrl}`,
    );
    res.status(options.statusCode).json(options.message);
  },
});

module.exports = limiter;
