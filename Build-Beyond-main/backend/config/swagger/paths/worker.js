module.exports = {
  "/api/workerjoin_company": {
    get: {
      tags: ["worker"],
      summary: "Get worker company-join page data",
      security: [{ cookieAuth: [] }],
      responses: {
        200: { description: "Join company data retrieved" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/workersettings": {
    get: {
      tags: ["worker"],
      summary: "Get worker settings",
      security: [{ cookieAuth: [] }],
      responses: {
        200: { description: "Settings retrieved" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/worker_edit": {
    get: {
      tags: ["worker"],
      summary: "Get worker editable profile data",
      security: [{ cookieAuth: [] }],
      responses: {
        200: { description: "Edit profile data retrieved" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/worker/dashboard": {
    get: {
      tags: ["worker"],
      summary: "Get worker dashboard (alternate route)",
      security: [{ cookieAuth: [] }],
      responses: {
        200: { description: "Dashboard retrieved" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/worker/jobs": {
    get: {
      tags: ["worker"],
      summary: "Get worker jobs (alternate route)",
      security: [{ cookieAuth: [] }],
      responses: {
        200: { description: "Jobs retrieved" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/worker/my-company": {
    get: {
      tags: ["worker"],
      summary: "Get worker current company",
      security: [{ cookieAuth: [] }],
      responses: {
        200: { description: "My company retrieved" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/workers/{id}": {
    get: {
      tags: ["worker"],
      summary: "Get worker by id",
      security: [{ cookieAuth: [] }],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string" } },
      ],
      responses: {
        200: { description: "Worker retrieved" },
        401: { $ref: "#/components/responses/Unauthorized" },
        404: { description: "Worker not found" },
      },
    },
  },
  "/api/worker-requests/{id}": {
    delete: {
      tags: ["worker"],
      summary: "Delete worker request by id",
      security: [{ cookieAuth: [] }],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string" } },
      ],
      responses: {
        200: { description: "Worker request deleted" },
        401: { $ref: "#/components/responses/Unauthorized" },
        404: { description: "Worker request not found" },
      },
    },
  },
  "/api/worker_request/{companyId}": {
    post: {
      tags: ["worker"],
      summary: "Create worker request to join a company",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "companyId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              required: [
                "fullName",
                "email",
                "location",
                "experience",
                "expectedSalary",
                "positionApplying",
                "primarySkills",
                "workExperience",
                "termsAgree",
                "resume",
              ],
              properties: {
                fullName: { type: "string" },
                email: { type: "string", format: "email" },
                location: { type: "string" },
                linkedin: { type: "string" },
                experience: { type: "number" },
                expectedSalary: { type: "number" },
                positionApplying: { type: "string" },
                primarySkills: {
                  type: "string",
                  description: "Comma-separated skills",
                },
                workExperience: { type: "string" },
                termsAgree: { type: "boolean" },
                resume: { type: "string", format: "binary" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Worker request created" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/worker/profile/update": {
    post: {
      tags: ["worker"],
      summary: "Update worker profile",
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              additionalProperties: true,
            },
          },
        },
      },
      responses: {
        200: { description: "Profile updated" },
        400: { $ref: "#/components/responses/BadRequest" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/worker/availability": {
    post: {
      tags: ["worker"],
      summary: "Update worker availability",
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["availability"],
              properties: {
                availability: {
                  type: "string",
                  enum: ["available", "busy", "unavailable"],
                },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Availability updated" },
        400: { $ref: "#/components/responses/BadRequest" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/offers/{id}/accept": {
    post: {
      tags: ["worker"],
      summary: "Accept offer",
      security: [{ cookieAuth: [] }],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string" } },
      ],
      responses: {
        200: { description: "Offer accepted" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/offers/{id}/decline": {
    post: {
      tags: ["worker"],
      summary: "Decline offer",
      security: [{ cookieAuth: [] }],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string" } },
      ],
      responses: {
        200: { description: "Offer declined" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/jobs/{id}/status": {
    post: {
      tags: ["worker"],
      summary: "Update job status",
      security: [{ cookieAuth: [] }],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string" } },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["status", "type"],
              properties: {
                status: { type: "string", enum: ["Accepted", "Rejected"] },
                type: { type: "string", enum: ["architect", "interior"] },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Job status updated" },
        400: { $ref: "#/components/responses/BadRequest" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/worker/ongoing-projects": {
    get: {
      tags: ["worker"],
      summary: "Get worker ongoing projects",
      security: [{ cookieAuth: [] }],
      responses: {
        200: { description: "Ongoing projects retrieved" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/worker/project-update": {
    post: {
      tags: ["worker"],
      summary: "Submit worker project update",
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              required: ["projectId", "projectType", "updateText"],
              properties: {
                projectId: { type: "string" },
                projectType: {
                  type: "string",
                  enum: ["architect", "interior"],
                },
                updateText: { type: "string" },
                updateImage: { type: "string", format: "binary" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Project update submitted" },
        400: { $ref: "#/components/responses/BadRequest" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/worker/project-complete": {
    post: {
      tags: ["worker"],
      summary: "Mark worker project as completed",
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["projectId", "projectType"],
              properties: {
                projectId: { type: "string" },
                projectType: {
                  type: "string",
                  enum: ["architect", "interior"],
                },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Project marked complete" },
        400: { $ref: "#/components/responses/BadRequest" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/worker/submit-proposal": {
    post: {
      tags: ["worker"],
      summary: "Submit worker proposal",
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["projectId", "projectType", "price", "description"],
              properties: {
                projectId: { type: "string" },
                projectType: {
                  type: "string",
                  enum: ["architect", "interior"],
                },
                price: { type: "number" },
                description: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Proposal submitted" },
        400: { $ref: "#/components/responses/BadRequest" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/worker/password/update": {
    post: {
      tags: ["worker"],
      summary: "Update worker password",
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
  "/api/worker/leave-company": {
    post: {
      tags: ["worker"],
      summary: "Leave current company",
      security: [{ cookieAuth: [] }],
      responses: {
        200: { description: "Left company successfully" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/worker/submit-milestone": {
    post: {
      tags: ["worker"],
      summary: "Submit worker milestone",
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              required: [
                "projectId",
                "projectType",
                "percentage",
                "description",
              ],
              properties: {
                projectId: { type: "string" },
                projectType: {
                  type: "string",
                  enum: ["architect", "interior"],
                },
                percentage: { type: "number", enum: [25, 50, 75, 100] },
                description: { type: "string" },
                image: { type: "string", format: "binary" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Milestone submitted" },
        400: { $ref: "#/components/responses/BadRequest" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/worker/review": {
    post: {
      tags: ["worker"],
      summary: "Submit worker review",
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["projectType", "projectId", "rating"],
              properties: {
                projectType: {
                  type: "string",
                  enum: ["architect", "interior"],
                },
                projectId: { type: "string" },
                rating: { type: "number", minimum: 1, maximum: 5 },
                comment: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        201: { description: "Review submitted" },
        400: { $ref: "#/components/responses/BadRequest" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/worker/review-status/{projectType}/{projectId}": {
    get: {
      tags: ["worker"],
      summary: "Get worker review status",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "projectType",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
        {
          name: "projectId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: { description: "Review status retrieved" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
};
