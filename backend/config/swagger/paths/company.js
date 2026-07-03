module.exports = {
  "/api/companydashboard": {
    get: {
      tags: ["company"],
      summary: "Get company dashboard data",
      security: [{ cookieAuth: [] }],
      responses: {
        200: { description: "Company dashboard retrieved" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/companyongoing_projects": {
    get: {
      tags: ["company"],
      summary: "Get ongoing projects for company",
      security: [{ cookieAuth: [] }],
      responses: {
        200: { description: "Ongoing projects list retrieved" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/project_requests": {
    get: {
      tags: ["company"],
      summary: "Get project requests for company",
      security: [{ cookieAuth: [] }],
      responses: {
        200: { description: "Project requests retrieved" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/projects/{projectId}/{status}": {
    patch: {
      tags: ["company"],
      summary: "Update project status",
      security: [{ cookieAuth: [] }],
      parameters: [
        { name: "projectId", in: "path", required: true, schema: { type: "string" } },
        { name: "status", in: "path", required: true, schema: { type: "string" } },
      ],
      responses: {
        200: { description: "Project status updated" },
        400: { $ref: "#/components/responses/BadRequest" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/companyhiring": {
    get: {
      tags: ["company"],
      summary: "Get hiring requests for company",
      security: [{ cookieAuth: [] }],
      responses: {
        200: { description: "Hiring requests retrieved" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/companytoworker": {
    post: {
      tags: ["company"],
      summary: "Create hire request for worker",
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                workerId: { type: "string" },
                projectId: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Hire request created" },
        400: { $ref: "#/components/responses/BadRequest" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/companysettings": {
    get: {
      tags: ["company"],
      summary: "Get company settings",
      security: [{ cookieAuth: [] }],
      responses: {
        200: { description: "Company settings retrieved" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/companybids": {
    get: {
      tags: ["company"],
      summary: "Get bids for company projects",
      security: [{ cookieAuth: [] }],
      responses: {
        200: { description: "Bids retrieved" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/companyrevenue": {
    get: {
      tags: ["company"],
      summary: "Get company revenue summary",
      security: [{ cookieAuth: [] }],
      responses: {
        200: { description: "Revenue data retrieved" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/my-employees": {
    get: {
      tags: ["company"],
      summary: "Get company employees list",
      security: [{ cookieAuth: [] }],
      responses: {
        200: { description: "Employees list retrieved" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/revenue_form": {
    get: {
      tags: ["company"],
      summary: "Get revenue form view",
      security: [{ cookieAuth: [] }],
      responses: {
        200: { description: "Revenue form view retrieved" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/worker-request/{requestId}": {
    patch: {
      tags: ["company"],
      summary: "Handle worker request (accept/reject)",
      security: [{ cookieAuth: [] }],
      parameters: [
        { name: "requestId", in: "path", required: true, schema: { type: "string" } },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["action"],
              properties: {
                action: { type: "string", enum: ["accept", "reject"] },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Worker request handled" },
        400: { $ref: "#/components/responses/BadRequest" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/update-company-profile": {
    post: {
      tags: ["company"],
      summary: "Update company profile",
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                companyName: { type: "string" },
                businessType: { type: "string" },
                description: { type: "string" },
                phone: { type: "string" },
                avatar: { type: "string", format: "binary" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Company profile updated" },
        400: { $ref: "#/components/responses/BadRequest" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/submit-bid": {
    post: {
      tags: ["company"],
      summary: "Submit bid for architecture design request",
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["designRequestId", "bidAmount", "deliveryDays"],
              properties: {
                designRequestId: { type: "string" },
                bidAmount: { type: "number" },
                deliveryDays: { type: "number" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Bid submitted successfully" },
        400: { $ref: "#/components/responses/BadRequest" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/company/submit-proposal": {
    post: {
      tags: ["company"],
      summary: "Submit project proposal",
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["projectId", "proposalAmount", "timeline"],
              properties: {
                projectId: { type: "string" },
                proposalAmount: { type: "number" },
                timeline: { type: "string" },
                notes: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Proposal submitted successfully" },
        400: { $ref: "#/components/responses/BadRequest" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/company/password/update": {
    post: {
      tags: ["company"],
      summary: "Update company password",
      description:
        "Company is resolved from authenticated user token (req.user.user_id). Do not send companyId in request body.",
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
        200: { description: "Password updated successfully" },
        400: { $ref: "#/components/responses/BadRequest" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/company/platform-fee-invoice": {
    post: {
      tags: ["company"],
      summary: "Upload invoice proof for company platform fee payment",
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              required: ["projectId", "milestonePercentage", "invoice"],
              properties: {
                projectId: { type: "string" },
                milestonePercentage: { type: "number", enum: [25, 50, 75, 100] },
                invoice: { type: "string", format: "binary" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Invoice uploaded successfully" },
        400: { $ref: "#/components/responses/BadRequest" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
};
