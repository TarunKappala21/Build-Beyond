const { extractPathParams } = require("./pathUtils");

const AUTH_FREE_OPERATIONS = new Set([
  "post /api/signup",
  "post /api/login",
  "post /api/login/2fa/verify",
  "post /api/login/2fa/resend",
  "post /api/email-otp/send",
  "post /api/email-otp/verify",
  "post /api/reset-password",
  "get /api/session",
  "get /api-docs",
  "get /api-docs.json",
]);

const requiresCookieAuth = (method, pathKey) => {
  const operationKey = `${method.toLowerCase()} ${pathKey}`;
  if (AUTH_FREE_OPERATIONS.has(operationKey)) return false;
  return pathKey.startsWith("/api");
};

const routeTagFromPath = (pathKey) => {
  const parts = pathKey.split("/").filter(Boolean);
  if (!parts.length) return "general";
  if (parts[0] !== "api") return parts[0];
  if (parts[1] === "payment") return "payment";
  if (parts[1] === "complaints") return "complaints";
  if (parts[1]) return parts[1];
  return "api";
};

const buildOperation = (method, pathKey) => {
  const params = extractPathParams(pathKey);
  const operation = {
    tags: [routeTagFromPath(pathKey)],
    summary: `${method.toUpperCase()} ${pathKey}`,
    parameters: params,
    responses: {
      200: { description: "Success" },
      400: { description: "Bad request" },
      401: { description: "Unauthorized" },
      404: { description: "Not found" },
      500: { description: "Server error" },
    },
  };

  if (!params.length) {
    delete operation.parameters;
  }

  if (requiresCookieAuth(method, pathKey)) {
    operation.security = [{ cookieAuth: [] }];
  }

  if (["post", "put", "patch"].includes(method)) {
    operation.requestBody = {
      required: false,
      content: {
        "application/json": {
          schema: {
            type: "object",
            additionalProperties: true,
          },
        },
      },
    };
  }

  return operation;
};

module.exports = {
  AUTH_FREE_OPERATIONS,
  requiresCookieAuth,
  routeTagFromPath,
  buildOperation,
};
