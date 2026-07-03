const path = require("path");
const assert = require("node:assert/strict");
const test = require("node:test");
const express = require("express");
const request = require("supertest");

const ROOT_DIR = path.resolve(__dirname, "..");

const passThrough = (req, _res, next) => {
  if (!req.user) {
    req.user = { user_id: "test-user", role: "test" };
  }
  next();
};

const authAdminMock = (req, res, next) => {
  if (req.path === "/admin/login" || req.path === "/platform-manager/login") {
    return res.status(200).json({ ok: true, handler: "authadmin.login" });
  }

  req.admin = {
    id: "admin-1",
    role: "admin",
    username: "admin",
    name: "Admin User",
  };
  return next();
};

const requireRoleMock = {
  requireRole: () => (_req, _res, next) => next(),
};

const uploadMock = {
  upload: {
    any: () => (_req, _res, next) => next(),
    array: () => (_req, _res, next) => next(),
    fields: () => (_req, _res, next) => next(),
    single: () => (_req, _res, next) => next(),
  },
};

function createControllerMock(moduleName) {
  return new Proxy(
    {},
    {
      get(_target, prop) {
        return (req, res) => {
          res.status(200).json({
            ok: true,
            handler: `${moduleName}.${String(prop)}`,
            method: req.method,
            path: req.originalUrl,
          });
        };
      },
    },
  );
}

function loadRouteApp({ routeFile, mountPath, mocks }) {
  const routeAbsolutePath = path.resolve(ROOT_DIR, routeFile);
  const touched = [];

  for (const [modulePath, mockExports] of Object.entries(mocks || {})) {
    const absoluteModulePath = path.resolve(ROOT_DIR, modulePath);
    touched.push({
      absoluteModulePath,
      previous: require.cache[absoluteModulePath],
    });

    require.cache[absoluteModulePath] = {
      id: absoluteModulePath,
      filename: absoluteModulePath,
      loaded: true,
      exports: mockExports,
    };
  }

  delete require.cache[routeAbsolutePath];
  const router = require(routeAbsolutePath);

  for (const { absoluteModulePath, previous } of touched) {
    if (previous) {
      require.cache[absoluteModulePath] = previous;
    } else {
      delete require.cache[absoluteModulePath];
    }
  }

  const app = express();
  app.use(express.json());
  app.use(mountPath, router);
  return app;
}

function joinRoutePath(basePath, endpointPath) {
  const normalizedBase = basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;
  const normalizedEndpoint = endpointPath.startsWith("/") ? endpointPath : `/${endpointPath}`;
  return `${normalizedBase}${normalizedEndpoint}`;
}

async function runSmokeRequest(app, mountPath, endpoint) {
  const fullPath = joinRoutePath(mountPath, endpoint.path);
  let req = request(app)[endpoint.method.toLowerCase()](fullPath);
  if (endpoint.body) req = req.send(endpoint.body);
  return req;
}

const routeGroups = [
  {
    name: "auth",
    routeFile: "routes/authRoutes.js",
    mountPath: "/api",
    mocks: {
      "controllers/authController.js": createControllerMock("authController"),
      "middlewares/auth.js": passThrough,
      "middlewares/upload.js": uploadMock,
    },
    endpoints: [
      { method: "POST", path: "/signup", body: { email: "a@b.com" } },
      { method: "POST", path: "/login", body: { email: "a@b.com", password: "x" } },
      { method: "GET", path: "/session" },
      { method: "GET", path: "/2fa/status" },
      { method: "GET", path: "/logout" },
    ],
  },
  {
    name: "admin",
    routeFile: "routes/adminRoutes.js",
    mountPath: "/api",
    mocks: {
      "controllers/adminController.js": createControllerMock("adminController"),
      "controllers/adminanalyticsController.js": createControllerMock("adminanalyticsController"),
      "controllers/adminSettingsController.js": createControllerMock("adminSettingsController"),
      "middlewares/authadmin.js": authAdminMock,
    },
    endpoints: [
      { method: "POST", path: "/admin/login", body: { username: "admin", password: "x" } },
      { method: "GET", path: "/admindashboard" },
      { method: "GET", path: "/admin/settings" },
      { method: "GET", path: "/admin/analytics" },
    ],
  },
  {
    name: "company",
    routeFile: "routes/companyRoutes.js",
    mountPath: "/api",
    mocks: {
      "controllers/companyController.js": createControllerMock("companyController"),
      "middlewares/auth.js": passThrough,
      "middlewares/requireRole.js": requireRoleMock,
      "middlewares/upload.js": uploadMock,
    },
    endpoints: [
      { method: "GET", path: "/companydashboard" },
      { method: "GET", path: "/companyrevenue" },
      { method: "POST", path: "/companytoworker", body: { workerId: "w1" } },
      { method: "POST", path: "/company/password/update", body: { currentPassword: "a", newPassword: "b" } },
    ],
  },
  {
    name: "customer",
    routeFile: "routes/customerRoutes.js",
    mountPath: "/api/customer",
    mocks: {
      "controllers/customerController.js": createControllerMock("customerController"),
      "controllers/reviewController.js": createControllerMock("reviewController"),
      "middlewares/auth.js": passThrough,
      "middlewares/requireRole.js": requireRoleMock,
      "middlewares/upload.js": uploadMock,
    },
    endpoints: [
      { method: "GET", path: "/home" },
      { method: "GET", path: "/architect" },
      { method: "GET", path: "/job_status" },
      { method: "POST", path: "/customer/password/update", body: { currentPassword: "a", newPassword: "b" } },
      { method: "GET", path: "/customer/payment-history" },
    ],
  },
  {
    name: "worker",
    routeFile: "routes/workerRoutes.js",
    mountPath: "/api",
    mocks: {
      "controllers/workerController.js": createControllerMock("workerController"),
      "controllers/reviewController.js": createControllerMock("reviewController"),
      "middlewares/auth.js": passThrough,
      "middlewares/requireRole.js": requireRoleMock,
      "middlewares/upload.js": uploadMock,
    },
    endpoints: [
      { method: "GET", path: "/worker/dashboard" },
      { method: "GET", path: "/worker/jobs" },
      { method: "POST", path: "/worker/submit-proposal", body: { projectId: "p1" } },
      { method: "POST", path: "/worker/password/update", body: { currentPassword: "a", newPassword: "b" } },
    ],
  },
  {
    name: "project",
    routeFile: "routes/projectRoutes.js",
    mountPath: "/api",
    mocks: {
      "controllers/projectController.js": createControllerMock("projectController"),
      "middlewares/auth.js": passThrough,
      "middlewares/requireRole.js": requireRoleMock,
      "middlewares/upload.js": uploadMock,
    },
    endpoints: [
      { method: "GET", path: "/projects" },
      { method: "GET", path: "/projects/123" },
      { method: "POST", path: "/customer/pay-milestone", body: { projectId: "p1", milestoneId: "m1" } },
      { method: "GET", path: "/company/notifications" },
    ],
  },
  {
    name: "payment",
    routeFile: "routes/paymentRoutes.js",
    mountPath: "/api/payment",
    mocks: {
      "controllers/paymentController.js": createControllerMock("paymentController"),
      "middlewares/auth.js": passThrough,
      "middlewares/requireRole.js": requireRoleMock,
    },
    endpoints: [
      { method: "POST", path: "/company/create-order", body: { projectId: "p1", milestonePercentage: 25 } },
      { method: "GET", path: "/company/summary/p1" },
      { method: "GET", path: "/worker/transactions" },
    ],
  },
  {
    name: "platform-manager",
    routeFile: "routes/platformManagerRoutes.js",
    mountPath: "/api",
    mocks: {
      "controllers/platformManagerController.js": createControllerMock("platformManagerController"),
      "middlewares/authadmin.js": authAdminMock,
      "middlewares/requireSuperadmin.js": (_req, _res, next) => next(),
    },
    endpoints: [
      { method: "POST", path: "/platform-manager/login", body: { username: "pm", password: "x" } },
      { method: "GET", path: "/platform-manager/dashboard" },
      { method: "GET", path: "/admin/platform-managers" },
      { method: "POST", path: "/platform-manager/company-payments/p1/25/collect" },
    ],
  },
  {
    name: "chat",
    routeFile: "routes/chatRoutes.js",
    mountPath: "/api",
    mocks: {
      "controllers/chatController.js": createControllerMock("chatController"),
      "middlewares/auth.js": passThrough,
      "middlewares/requireRole.js": requireRoleMock,
    },
    endpoints: [
      { method: "GET", path: "/chat/room/project-1/design" },
      { method: "GET", path: "/chat/room/2/construction" },
      { method: "GET", path: "/chat/room-1" },
    ],
  },
  {
    name: "review",
    routeFile: "routes/reviewRoutes.js",
    mountPath: "/api",
    mocks: {
      "controllers/reviewController.js": createControllerMock("reviewController"),
      "middlewares/auth.js": passThrough,
      "middlewares/requireRole.js": requireRoleMock,
    },
    endpoints: [
      { method: "POST", path: "/customer/review", body: { projectId: "p1" } },
      { method: "POST", path: "/worker/review", body: { projectId: "p2" } },
      { method: "GET", path: "/project-review-status/design/p1" },
    ],
  },
  {
    name: "complaint",
    routeFile: "routes/complaintRoutes.js",
    mountPath: "/api/complaints",
    mocks: {
      "controllers/complaintController.js": createControllerMock("complaintController"),
      "middlewares/auth.js": passThrough,
    },
    endpoints: [
      { method: "POST", path: "/", body: { projectId: "p1", message: "Need help" } },
      { method: "GET", path: "/unviewed/count" },
      { method: "GET", path: "/project-1" },
      { method: "POST", path: "/complaint-1/reply", body: { message: "Ack" } },
    ],
  },
];

for (const group of routeGroups) {
  for (const endpoint of group.endpoints) {
    test(
      `route smoke: ${group.name} ${endpoint.method} ${endpoint.path}`,
      async () => {
        const app = loadRouteApp(group);
        const response = await runSmokeRequest(app, group.mountPath, endpoint);

        assert.equal(
          response.status,
          200,
          `${group.name} ${endpoint.method} ${endpoint.path} expected 200, got ${response.status}`,
        );
      },
    );
  }
}
