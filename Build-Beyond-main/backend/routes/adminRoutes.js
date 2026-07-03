const express = require("express");
const router = express.Router();
const {
  buildCacheKey,
  getCacheJson,
  setCacheJson,
  logRedisEndpointCache,
  invalidateCacheByPrefix,
} = require("../utils/redisCache");

const {
  getAdminDashboard,
  deleteCustomer,
  deleteCompany,
  deleteWorker,
  deleteArchitectHiring,
  deleteConstructionProject,
  deleteDesignRequest,
  deleteBid,
  deleteJobApplication,
  getCustomerDetail,
  getCustomerFullDetail,
  getCompanyDetail,
  getCompanyFullDetail,
  getWorkerDetail,
  getWorkerFullDetail,
  getArchitectHiringDetail,
  getArchitectHiringFullDetail,
  getConstructionProjectDetail,
  getConstructionProjectFullDetail,
  getDesignRequestDetail,
  getDesignRequestFullDetail,
  getBidDetail,
  getJobApplicationDetail,
  getAdminRevenue,
  getPlatformRevenueIntelligence,
  getRedisCacheStatsAdmin,
  resetRedisCacheStatsAdmin,
} = require("../controllers/adminController");
const {
  getAdminAnalytics,
} = require("../controllers/adminanalyticsController");

const {
  getSettings,
  updateSettings
} = require("../controllers/adminSettingsController");

const authadmin = require("../middlewares/authadmin");

const ADMIN_ROUTE_CACHE_PREFIX = "admin:http-cache:v1";

const cacheAdminGet = (ttlSeconds = 90) => async (req, res, next) => {
  try {
    const startedAt = process.hrtime.bigint();
    const adminScope = req.admin?.id || req.admin?._id || req.admin?.email || "admin";
    const cacheKey = buildCacheKey(ADMIN_ROUTE_CACHE_PREFIX, {
      adminScope: String(adminScope),
      route: req.originalUrl,
    });

    const cachedPayload = await getCacheJson(cacheKey);
    if (cachedPayload) {
      logRedisEndpointCache("hit", req.originalUrl, startedAt);
      return res
        .status(Number(cachedPayload.statusCode || 200))
        .json(cachedPayload.body);
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      setCacheJson(
        cacheKey,
        {
          statusCode: Number(res.statusCode || 200),
          body,
        },
        ttlSeconds,
      ).catch((error) => {
        console.error("Failed to set admin route cache:", error.message);
      });
      logRedisEndpointCache("miss", req.originalUrl, startedAt);
      return originalJson(body);
    };

    return next();
  } catch (error) {
    console.error("Admin route cache middleware error:", error.message);
    return next();
  }
};

const invalidateAdminGetCacheOnSuccess = async (req, res, next) => {
  try {
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (Number(res.statusCode || 200) < 400) {
        invalidateCacheByPrefix(ADMIN_ROUTE_CACHE_PREFIX).catch((error) => {
          console.error("Failed to invalidate admin route cache:", error.message);
        });
      }
      return originalJson(body);
    };
    return next();
  } catch (error) {
    console.error("Admin route invalidation middleware error:", error.message);
    return next();
  }
};

// Admin login route
router.post("/admin/login", authadmin);

// Admin session verification route
router.get("/admin/verify-session", authadmin, (req, res) => {
  res.json({ authenticated: true, role: req.admin?.role || "admin" });
});

// Admin logout route
router.post("/admin/logout", (req, res) => {
  const isProduction = process.env.NODE_ENV === "production";
  res.clearCookie("admin_token", {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    path: "/",
  });
  res.json({ message: "Logged out successfully" });
});

// Admin dashboard route (protected)
router.get("/admindashboard", authadmin, cacheAdminGet(90), getAdminDashboard);
router.get("/admin/analytics", authadmin, cacheAdminGet(90), getAdminAnalytics);

// Admin revenue analytics route (protected)
router.get("/admin/revenue", authadmin, cacheAdminGet(90), getAdminRevenue);
router.get("/admin/revenue/platform-intelligence", authadmin, cacheAdminGet(90), getPlatformRevenueIntelligence);
router.get("/admin/cache/redis-stats", authadmin, cacheAdminGet(30), getRedisCacheStatsAdmin);
router.post("/admin/cache/redis-stats/reset", authadmin, invalidateAdminGetCacheOnSuccess, resetRedisCacheStatsAdmin);

// Admin System Settings routes
router.get("/admin/settings", authadmin, cacheAdminGet(60), getSettings);
router.put("/admin/settings", authadmin, invalidateAdminGetCacheOnSuccess, updateSettings);

// Delete routes
router.delete("/admin/delete-customer/:id", authadmin, invalidateAdminGetCacheOnSuccess, deleteCustomer);
router.delete("/admin/delete-company/:id", authadmin, invalidateAdminGetCacheOnSuccess, deleteCompany);
router.delete("/admin/delete-worker/:id", authadmin, invalidateAdminGetCacheOnSuccess, deleteWorker);
router.delete("/admin/delete-architectHiring/:id", authadmin, invalidateAdminGetCacheOnSuccess, deleteArchitectHiring);
router.delete("/admin/delete-constructionProject/:id", authadmin, invalidateAdminGetCacheOnSuccess, deleteConstructionProject);
router.delete("/admin/delete-designRequest/:id", authadmin, invalidateAdminGetCacheOnSuccess, deleteDesignRequest);
router.delete("/admin/delete-bid/:id", authadmin, invalidateAdminGetCacheOnSuccess, deleteBid);
router.delete("/admin/delete-jobApplication/:id", authadmin, invalidateAdminGetCacheOnSuccess, deleteJobApplication);

// Detail view routes
router.get("/admin/customer/:id", authadmin, cacheAdminGet(90), getCustomerDetail);
router.get("/admin/customers/:customerId/full", authadmin, cacheAdminGet(90), getCustomerFullDetail);
router.get("/admin/companies/:companyId/full", authadmin, cacheAdminGet(90), getCompanyFullDetail);
router.get("/admin/workers/:workerId/full", authadmin, cacheAdminGet(90), getWorkerFullDetail);
router.get("/admin/company/:id", authadmin, cacheAdminGet(90), getCompanyDetail);
router.get("/admin/worker/:id", authadmin, cacheAdminGet(90), getWorkerDetail);
router.get("/admin/architect-hirings/:projectId/full", authadmin, cacheAdminGet(90), getArchitectHiringFullDetail);
router.get("/admin/architect-hiring/:id", authadmin, cacheAdminGet(90), getArchitectHiringDetail);
router.get("/admin/construction-project/:id", authadmin, cacheAdminGet(90), getConstructionProjectDetail);
router.get("/admin/construction-projects/:projectId/full", authadmin, cacheAdminGet(90), getConstructionProjectFullDetail);
router.get("/admin/design-requests/:requestId/full", authadmin, cacheAdminGet(90), getDesignRequestFullDetail);
router.get("/admin/design-request/:id", authadmin, cacheAdminGet(90), getDesignRequestDetail);
router.get("/admin/bid/:id", authadmin, cacheAdminGet(90), getBidDetail);
router.get("/admin/job-application/:id", authadmin, cacheAdminGet(90), getJobApplicationDetail);

module.exports = router;
