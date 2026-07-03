module.exports = {
  "/api/customer/review": {
    post: {
      tags: ["review"],
      summary: "Submit a review as a customer for a worker",
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["projectId", "projectType", "rating", "comment"],
              properties: {
                projectId: { type: "string", description: "Project ID" },
                projectType: {
                  type: "string",
                  enum: ["architect", "design"],
                  description: "Type of project",
                },
                rating: {
                  type: "number",
                  minimum: 1,
                  maximum: 5,
                  description: "Rating from 1 to 5",
                },
                comment: { type: "string", description: "Review comment" },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "Customer review submitted successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string" },
                  isProjectCompleted: { type: "boolean" },
                },
              },
            },
          },
        },
        400: { $ref: "#/components/responses/BadRequest" },
        401: { $ref: "#/components/responses/Unauthorized" },
        404: { description: "Project or worker not found" },
      },
    },
  },
  "/api/worker/review": {
    post: {
      tags: ["review"],
      summary: "Submit a review as a worker for a customer",
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["projectId", "projectType", "rating", "comment"],
              properties: {
                projectId: { type: "string", description: "Project ID" },
                projectType: {
                  type: "string",
                  enum: ["architect", "design"],
                  description: "Type of project",
                },
                rating: {
                  type: "number",
                  minimum: 1,
                  maximum: 5,
                  description: "Rating from 1 to 5",
                },
                comment: { type: "string", description: "Review comment" },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "Worker review submitted successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string" },
                  isProjectCompleted: { type: "boolean" },
                },
              },
            },
          },
        },
        400: { $ref: "#/components/responses/BadRequest" },
        401: { $ref: "#/components/responses/Unauthorized" },
        404: { description: "Project or customer not found" },
      },
    },
  },
  "/api/project-review-status/{projectType}/{projectId}": {
    get: {
      tags: ["review"],
      summary: "Get review submission status for a project",
      parameters: [
        {
          name: "projectType",
          in: "path",
          required: true,
          schema: { type: "string", enum: ["architect", "design"] },
          description: "Type of project",
        },
        {
          name: "projectId",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "Project ID",
        },
      ],
      responses: {
        200: {
          description: "Review status retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  projectId: { type: "string" },
                  projectType: { type: "string" },
                  customerReviewSubmitted: { type: "boolean" },
                  workerReviewSubmitted: { type: "boolean" },
                  bothReviewsCompleted: { type: "boolean" },
                },
              },
            },
          },
        },
        404: { description: "Project not found" },
      },
    },
  },
};
