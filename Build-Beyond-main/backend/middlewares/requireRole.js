const requireRole = (role) => {
  return (req, res, next) => {
    if (req.user?.role === role) {
      return next();
    }
    const err = new Error(`Forbidden: ${role} access required`);
    err.status = 403;
    return next(err);
  };
};

module.exports = { requireRole };
