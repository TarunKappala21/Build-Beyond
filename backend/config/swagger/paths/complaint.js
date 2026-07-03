module.exports = {
  "/api/complaints": {
    post: {
      tags: ["complaint"],
      summary: "Submit a complaint (customer or company)",
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["projectId", "milestone", "message"],
              properties: {
                projectId: { type: "string" },
                milestone: { type: "number", enum: [0, 25, 50, 75, 100] },
                message: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        201: { description: "Complaint submitted successfully" },
        400: { $ref: "#/components/responses/BadRequest" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/complaints/unviewed/count": {
    get: {
      tags: ["complaint"],
      summary: "Get count of unviewed complaints (admin dashboard)",
      responses: {
        200: { description: "Unviewed complaints count retrieved" },
      },
    },
  },
  "/api/complaints/company/unviewed/count": {
    get: {
      tags: ["complaint"],
      summary: "Get count of unviewed complaints for company",
      responses: {
        200: { description: "Company unviewed complaints count retrieved" },
      },
    },
  },
  "/api/complaints/{projectId}": {
    get: {
      tags: ["complaint"],
      summary: "Get all complaints for a project",
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
        200: { description: "Project complaints retrieved" },
        401: { $ref: "#/components/responses/Unauthorized" },
        404: { description: "Project not found" },
      },
    },
  },
  "/api/complaints/{complaintId}/reply": {
    post: {
      tags: ["complaint"],
      summary: "Reply to a complaint (admin/platformManager)",
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
                adminId: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Reply added successfully" },
        400: { $ref: "#/components/responses/BadRequest" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
};
