module.exports = function requirePlatformManager(req, res, next) {
  if (req.admin?.role === "platform_manager") {
    return next();
  }
  const err = new Error("Forbidden: Platform manager access required");
  err.status = 403;
  return next(err);
};
