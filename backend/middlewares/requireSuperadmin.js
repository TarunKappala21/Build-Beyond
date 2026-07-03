module.exports = function requireSuperadmin(req, res, next) {
  if (req.admin?.role === "superadmin") {
    return next();
  }
  const err = new Error("Forbidden: Superadmin access required");
  err.status = 403;
  return next(err);
};
