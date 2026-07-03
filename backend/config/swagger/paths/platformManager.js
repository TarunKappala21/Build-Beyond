module.exports = {
  "/api/platform-manager/login": {
    post: {
      tags: ["platform-manager"],
      summary: "Authenticate platform manager or superadmin session",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["username", "password"],
              properties: {
                username: { type: "string" },
                password: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Login successful" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/platform-manager/verify-session": {
    get: {
      tags: ["platform-manager"],
      summary: "Verify platform manager session",
      security: [{ cookieAuth: [] }],
      responses: {
        200: { description: "Session is valid" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/platform-manager/logout": {
    post: {
      tags: ["platform-manager"],
      summary: "Logout platform manager and clear auth cookie",
      responses: {
        200: { description: "Logged out successfully" },
      },
    },
  },

  "/api/platform-manager/dashboard": {
    get: {
      tags: ["platform-manager"],
      summary: "Get platform manager dashboard",
      security: [{ cookieAuth: [] }],
      responses: {
        200: { description: "Dashboard data retrieved" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/platform-manager/analytics": {
    get: {
      tags: ["platform-manager"],
      summary: "Get platform manager analytics",
      security: [{ cookieAuth: [] }],
      responses: {
        200: { description: "Analytics data retrieved" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/platform-manager/change-password": {
    post: {
      tags: ["platform-manager"],
      summary: "Change platform manager password",
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["currentPassword", "newPassword"],
              properties: {
                currentPassword: { type: "string" },
                newPassword: { type: "string", minLength: 8 },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Password updated" },
        400: { $ref: "#/components/responses/BadRequest" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/platform-manager/verification/{taskId}": {
    get: {
      tags: ["platform-manager"],
      summary: "Get verification task details",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "taskId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: { description: "Verification task details retrieved" },
        401: { $ref: "#/components/responses/Unauthorized" },
        404: { description: "Task not found" },
      },
    },
  },
  "/api/platform-manager/verification/{taskId}/process": {
    post: {
      tags: ["platform-manager"],
      summary: "Approve or reject verification task",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "taskId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["action"],
              properties: {
                action: { type: "string", enum: ["verify", "reject"] },
                notes: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Verification task processed" },
        400: { $ref: "#/components/responses/BadRequest" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/platform-manager/complaint/{complaintId}": {
    get: {
      tags: ["platform-manager"],
      summary: "Get complaint details",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "complaintId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: { description: "Complaint details retrieved" },
        401: { $ref: "#/components/responses/Unauthorized" },
        404: { description: "Complaint not found" },
      },
    },
  },
  "/api/platform-manager/complaint/{complaintId}/reply": {
    post: {
      tags: ["platform-manager"],
      summary: "Reply to complaint as platform manager",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "complaintId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["message"],
              properties: {
                message: { type: "string" },
                markResolved: { type: "boolean" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Reply submitted" },
        400: { $ref: "#/components/responses/BadRequest" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/platform-manager/company-payments": {
    get: {
      tags: ["platform-manager"],
      summary:
        "Get unified pending platform fee queue for company and worker projects",
      security: [{ cookieAuth: [] }],
      responses: {
        200: { description: "Queue items" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/platform-manager/company-payments/{projectId}/{milestonePercentage}/collect":
    {
      post: {
        tags: ["platform-manager"],
        summary:
          "Verify and mark platform fee collected for company/worker milestone",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "projectId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "milestonePercentage",
            in: "path",
            required: true,
            schema: { type: "number" },
          },
        ],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  projectType: {
                    type: "string",
                    enum: ["construction", "architect", "interior"],
                  },
                  notes: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Platform fee collected" },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
};
