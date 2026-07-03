const fs = require("fs");
const { spawn } = require("child_process");

fs.mkdirSync("test-results", { recursive: true });

const child = spawn(
  process.execPath,
  [
    "--test",
    "--test-reporter=junit",
    "--test-reporter-destination=./test-results/junit.xml",
    "tests/**/*.test.js",
  ],
  {
    stdio: "inherit",
  },
);

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
