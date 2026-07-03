const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const {
  JWT_SECRET,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  ADMIN_PASSKEY,
} = require("../config/constants");
const { PlatformManager } = require("../models");

const isProduction = process.env.NODE_ENV === "production";
const adminCookieOptions = {
  httpOnly: true,
  sameSite: isProduction ? "none" : "lax",
  secure: isProduction,
  maxAge: 8 * 60 * 60 * 1000,
  path: "/",
};

module.exports = async function authAdmin(req, res, next) {
  try {
    // Handle admin/platform-manager login
    if (req.path === "/admin/login" || req.url === "/admin/login") {
      const { email, password, role } = req.body;

      // Check if this is superadmin login
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        const token = jwt.sign({ role: "superadmin", email: ADMIN_EMAIL }, JWT_SECRET, {
          expiresIn: "8h",
        });
        res.cookie("admin_token", token, adminCookieOptions);
        return res.json({ message: "Superadmin authenticated", token, role: "superadmin" });
      }

      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    // Handle platform manager login
    if (req.path === "/platform-manager/login" || req.url === "/platform-manager/login") {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const platformManager = await PlatformManager.findOne({ username, status: 'active' });
      if (!platformManager) {
        return res.status(401).json({ message: "Invalid credentials or account inactive" });
      }

      const isMatch = await bcrypt.compare(password, platformManager.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Update last login
      platformManager.lastLogin = new Date();
      await platformManager.save();

      const token = jwt.sign(
        { 
          role: "platform_manager", 
          id: platformManager._id, 
          username: platformManager.username,
          name: platformManager.name 
        }, 
        JWT_SECRET, 
        { expiresIn: "8h" }
      );
      
      res.cookie("admin_token", token, adminCookieOptions);
      
      return res.json({ 
        message: "Platform manager authenticated", 
        token, 
        role: "platform_manager",
        user: {
          id: platformManager._id,
          name: platformManager.name,
          username: platformManager.username,
          email: platformManager.email
        }
      });
    }

    // Verify token for protected routes
    const headerToken = req.header("Authorization")?.replace("Bearer ", "");
    const cookieToken = req.cookies?.admin_token;
    const token = headerToken || cookieToken;

    if (!token) {
      const err = new Error("Access Denied: No token provided");
      err.status = 401;
      return next(err);
    }

    const verified = jwt.verify(token, JWT_SECRET);
    if (verified.role !== "platform_manager" && verified.role !== "superadmin") {
      const err = new Error("Forbidden: Not an admin or platform manager");
      err.status = 403;
      return next(err);
    }

    req.admin = verified;
    next();
  } catch (err) {
    const error = new Error("Invalid or expired token");
    error.status = 401;
    return next(error);
  }
};
