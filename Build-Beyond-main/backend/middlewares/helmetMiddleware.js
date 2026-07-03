const helmet = require("helmet");

module.exports = helmet({
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
});
