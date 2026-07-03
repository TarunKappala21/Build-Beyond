const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/constants");

module.exports = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    const err = new Error("Unauthorized. Please login.");
    err.status = 401;
    return next(err);
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    const err = new Error("Invalid token. Please login again.");
    err.status = 401;
    return next(err);
  }
};
