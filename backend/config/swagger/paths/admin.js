module.exports = {
  "/api/admin/login": {
    post: {
      tags: ["admin"],
      summary: "Authenticate admin session",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email", "password"],
              properties: {
                email: { type: "string", format: "email" },
                password: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Admin authenticated" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/admin/verify-session": {
    get: {
      tags: ["admin"],
      summary: "Verify current admin session",
      security: [{ cookieAuth: [] }],
      responses: {
        200: { description: "Session is valid" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/admin/logout": {
    post: {
      tags: ["admin"],
      summary: "Logout admin and clear session cookie",
      responses: {
        200: { description: "Logged out successfully" },
      },
    },
  },
  "/api/admindashboard": {
    get: {
      tags: ["admin"],
      summary: "Get admin dashboard overview",
      security: [{ cookieAuth: [] }],
      responses: {
        200: { description: "Dashboard data retrieved" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/admin/analytics": {
    get: {
      tags: ["admin"],
      summary: "Get admin analytics metrics",
      security: [{ cookieAuth: [] }],
      responses: {
        200: { description: "Analytics data retrieved" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/admin/revenue": {
    get: {
      tags: ["admin"],
      summary: "Get high-level admin revenue analytics",
      security: [{ cookieAuth: [] }],
      responses: {
        200: { description: "Revenue analytics payload" },
        401: { $ref: "#/components/responses/Unauthorized" },
        500: { description: "Server error" },
      },
    },
  },
  "/api/admin/revenue/platform-intelligence": {
    get: {
      tags: ["admin"],
      summary:
        "Get detailed platform revenue intelligence with filters, charts and transaction ledger",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "timeframe",
          in: "query",
          required: false,
          schema: {
            type: "string",
            enum: ["all", "week", "month", "quarter", "year"],
          },
        },
        {
          name: "startDate",
          in: "query",
          required: false,
          schema: { type: "string", format: "date" },
        },
        {
          name: "endDate",
          in: "query",
          required: false,
          schema: { type: "string", format: "date" },
        },
        {
          name: "projectType",
          in: "query",
          required: false,
          schema: {
            type: "string",
            enum: ["all", "construction", "architect", "interior"],
          },
        },
        {
          name: "feeStatus",
          in: "query",
          required: false,
          schema: {
            type: "string",
            enum: ["all", "collected", "pending", "yet_to_come"],
          },
        },
        {
          name: "search",
          in: "query",
          required: false,
          schema: { type: "string" },
        },
        {
          name: "page",
          in: "query",
          required: false,
          schema: { type: "integer", minimum: 1, default: 1 },
        },
        {
          name: "limit",
          in: "query",
          required: false,
          schema: { type: "integer", minimum: 1, default: 20 },
        },
      ],
      responses: {
        200: { description: "Intelligence payload" },
        401: { $ref: "#/components/responses/Unauthorized" },
        500: { description: "Server error" },
      },
    },
  },
  "/api/admin/cache/redis-stats": {
    get: {
      tags: ["admin"],
      summary: "Get Redis cache statistics for admin monitoring",
      security: [{ cookieAuth: [] }],
      responses: {
        200: { description: "Redis cache stats retrieved" },
        401: { $ref: "#/components/responses/Unauthorized" },
        500: { description: "Server error" },
      },
    },
  },
  "/api/admin/cache/redis-stats/reset": {
    post: {
      tags: ["admin"],
      summary: "Reset Redis cache statistics counters",
      security: [{ cookieAuth: [] }],
      responses: {
        200: { description: "Redis cache stats reset" },
        401: { $ref: "#/components/responses/Unauthorized" },
        500: { description: "Server error" },
      },
    },
  },
  "/api/admin/settings": {
    get: {
      tags: ["admin"],
      summary: "Get platform system settings",
      security: [{ cookieAuth: [] }],
      responses: {
        200: { description: "System settings retrieved" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
    put: {
      tags: ["admin"],
      summary: "Update platform system settings",
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              additionalProperties: true,
            },
          },
        },
      },
      responses: {
        200: { description: "System settings updated" },
        400: { $ref: "#/components/responses/BadRequest" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/admin/delete-customer/{id}": {
    delete: {
      tags: ["admin"],
      summary: "Delete a customer account",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: { description: "Customer deleted" },
        401: { $ref: "#/components/responses/Unauthorized" },
        404: { description: "Customer not found" },
      },
    },
  },
  "/api/admin/delete-company/{id}": {
    delete: {
      tags: ["admin"],
      summary: "Delete a company account",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: { description: "Company deleted" },
        401: { $ref: "#/components/responses/Unauthorized" },
        404: { description: "Company not found" },
      },
    },
  },
  "/api/admin/delete-worker/{id}": {
    delete: {
      tags: ["admin"],
      summary: "Delete a worker account",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: { description: "Worker deleted" },
        401: { $ref: "#/components/responses/Unauthorized" },
        404: { description: "Worker not found" },
      },
    },
  },
  "/api/admin/delete-architectHiring/{id}": {
    delete: {
      tags: ["admin"],
      summary: "Delete an architect hiring record",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: { description: "Architect hiring record deleted" },
        401: { $ref: "#/components/responses/Unauthorized" },
        404: { description: "Architect hiring record not found" },
      },
    },
  },
  "/api/admin/delete-constructionProject/{id}": {
    delete: {
      tags: ["admin"],
      summary: "Delete a construction project",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: { description: "Construction project deleted" },
        401: { $ref: "#/components/responses/Unauthorized" },
        404: { description: "Construction project not found" },
      },
    },
  },
  "/api/admin/delete-designRequest/{id}": {
    delete: {
      tags: ["admin"],
      summary: "Delete a design request",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: { description: "Design request deleted" },
        401: { $ref: "#/components/responses/Unauthorized" },
        404: { description: "Design request not found" },
      },
    },
  },
  "/api/admin/delete-bid/{id}": {
    delete: {
      tags: ["admin"],
      summary: "Delete a bid record",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: { description: "Bid record deleted" },
        401: { $ref: "#/components/responses/Unauthorized" },
        404: { description: "Bid record not found" },
      },
    },
  },
  "/api/admin/delete-jobApplication/{id}": {
    delete: {
      tags: ["admin"],
      summary: "Delete a job application",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: { description: "Job application deleted" },
        401: { $ref: "#/components/responses/Unauthorized" },
        404: { description: "Job application not found" },
      },
    },
  },
  "/api/admin/customer/{id}": {
    get: {
      tags: ["admin"],
      summary: "Get basic customer detail by id",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: { description: "Customer detail retrieved" },
        401: { $ref: "#/components/responses/Unauthorized" },
        404: { description: "Customer not found" },
      },
    },
  },
  "/api/admin/customers/{customerId}/full": {
    get: {
      tags: ["admin"],
      summary: "Get full customer profile by id",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "customerId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: { description: "Full customer profile retrieved" },
        401: { $ref: "#/components/responses/Unauthorized" },
        404: { description: "Customer not found" },
      },
    },
  },
  "/api/admin/companies/{companyId}/full": {
    get: {
      tags: ["admin"],
      summary: "Get full company profile by id",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "companyId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: { description: "Full company profile retrieved" },
        401: { $ref: "#/components/responses/Unauthorized" },
        404: { description: "Company not found" },
      },
    },
  },
  "/api/admin/workers/{workerId}/full": {
    get: {
      tags: ["admin"],
      summary: "Get full worker profile by id",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "workerId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: { description: "Full worker profile retrieved" },
        401: { $ref: "#/components/responses/Unauthorized" },
        404: { description: "Worker not found" },
      },
    },
  },
  "/api/admin/company/{id}": {
    get: {
      tags: ["admin"],
      summary: "Get basic company detail by id",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: { description: "Company detail retrieved" },
        401: { $ref: "#/components/responses/Unauthorized" },
        404: { description: "Company not found" },
      },
    },
  },
  "/api/admin/worker/{id}": {
    get: {
      tags: ["admin"],
      summary: "Get basic worker detail by id",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: { description: "Worker detail retrieved" },
        401: { $ref: "#/components/responses/Unauthorized" },
        404: { description: "Worker not found" },
      },
    },
  },
  "/api/admin/architect-hirings/{projectId}/full": {
    get: {
      tags: ["admin"],
      summary: "Get full architect hiring detail by project id",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "projectId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: { description: "Full architect hiring detail retrieved" },
        401: { $ref: "#/components/responses/Unauthorized" },
        404: { description: "Architect hiring project not found" },
      },
    },
  },
  "/api/admin/architect-hiring/{id}": {
    get: {
      tags: ["admin"],
      summary: "Get architect hiring detail by id",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: { description: "Architect hiring detail retrieved" },
        401: { $ref: "#/components/responses/Unauthorized" },
        404: { description: "Architect hiring not found" },
      },
    },
  },
  "/api/admin/construction-project/{id}": {
    get: {
      tags: ["admin"],
      summary: "Get construction project detail by id",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: { description: "Construction project detail retrieved" },
        401: { $ref: "#/components/responses/Unauthorized" },
        404: { description: "Construction project not found" },
      },
    },
  },
  "/api/admin/construction-projects/{projectId}/full": {
    get: {
      tags: ["admin"],
      summary: "Get full construction project detail by project id",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "projectId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: { description: "Full construction project detail retrieved" },
        401: { $ref: "#/components/responses/Unauthorized" },
        404: { description: "Construction project not found" },
      },
    },
  },
  "/api/admin/design-requests/{requestId}/full": {
    get: {
      tags: ["admin"],
      summary: "Get full design request detail by request id",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "requestId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: { description: "Full design request detail retrieved" },
        401: { $ref: "#/components/responses/Unauthorized" },
        404: { description: "Design request not found" },
      },
    },
  },
  "/api/admin/design-request/{id}": {
    get: {
      tags: ["admin"],
      summary: "Get design request detail by id",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: { description: "Design request detail retrieved" },
        401: { $ref: "#/components/responses/Unauthorized" },
        404: { description: "Design request not found" },
      },
    },
  },
  "/api/admin/bid/{id}": {
    get: {
      tags: ["admin"],
      summary: "Get bid detail by id",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: { description: "Bid detail retrieved" },
        401: { $ref: "#/components/responses/Unauthorized" },
        404: { description: "Bid not found" },
      },
    },
  },
  "/api/admin/job-application/{id}": {
    get: {
      tags: ["admin"],
      summary: "Get job application detail by id",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: { description: "Job application detail retrieved" },
        401: { $ref: "#/components/responses/Unauthorized" },
        404: { description: "Job application not found" },
      },
    },
  },
  "/api/admin/platform-managers": {
    post: {
      tags: ["admin"],
      summary: "Create a new platform manager (superadmin only)",
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["name", "email", "username", "password"],
              properties: {
                name: { type: "string" },
                email: { type: "string", format: "email" },
                username: { type: "string" },
                password: { type: "string", minLength: 8 },
              },
            },
          },
        },
      },
      responses: {
        201: { description: "Platform manager created" },
        400: { $ref: "#/components/responses/BadRequest" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
    get: {
      tags: ["admin"],
      summary: "Get all platform managers (superadmin only)",
      security: [{ cookieAuth: [] }],
      responses: {
        200: { description: "Platform managers retrieved" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/admin/platform-managers/{id}/performance": {
    get: {
      tags: ["admin"],
      summary: "Get platform manager performance metrics",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: { description: "Performance metrics retrieved" },
        401: { $ref: "#/components/responses/Unauthorized" },
        404: { description: "Platform manager not found" },
      },
    },
  },
  "/api/admin/platform-managers/{id}": {
    delete: {
      tags: ["admin"],
      summary: "Delete platform manager (superadmin only)",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: { description: "Platform manager deleted" },
        401: { $ref: "#/components/responses/Unauthorized" },
        404: { description: "Platform manager not found" },
      },
    },
  },
  "/api/admin/platform-managers/{id}/toggle-status": {
    patch: {
      tags: ["admin"],
      summary: "Toggle platform manager active status",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: { description: "Status updated" },
        401: { $ref: "#/components/responses/Unauthorized" },
        404: { description: "Platform manager not found" },
      },
    },
  },
};
