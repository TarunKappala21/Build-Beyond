// errorMiddleware.js
const logErrorToFile = require("../utils/errorLogger");

module.exports = (err, req, res, next) => {
  const errorLog = {
    message: err.message || "Internal Server Error",
    status: err.status || 500,
    method: req.method,
    url: req.originalUrl,
    stack: err.stack,
    ip: req.ip,
    userAgent: req.get("user-agent"),
    timestamp: new Date().toISOString(),
  };

  logErrorToFile(errorLog);

  console.error(
    `[${errorLog.timestamp}] ${errorLog.status} ${errorLog.method} ${errorLog.url} - ${errorLog.message}`,
  );
  res.status(err.status || 500).json({
    error: {
      message: err.message || "Internal Server Error",
      status: err.status || 500,
    },
  });
};
