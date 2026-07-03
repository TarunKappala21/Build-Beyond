// errorLogger.js
const fs = require("fs");
const path = require("path");

const logFilePath = path.join(__dirname, "../log/error.log");

// Ensure log directory exists
const logDir = path.dirname(logFilePath);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

function logErrorToFile(errorObj) {
  const logEntry = `[${new Date().toISOString()}] ${JSON.stringify(errorObj, null, 2)}\n${"=".repeat(80)}\n`;

  fs.appendFile(logFilePath, logEntry, (err) => {
    if (err) {
      console.error("Failed to write error log:", err);
    }
  });
}

module.exports = logErrorToFile;
