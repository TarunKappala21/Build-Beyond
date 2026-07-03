module.exports = {
  "/api/architect_submit": {
    post: {
      tags: ["project-customer-accessed"],
      summary: "Submit architect hiring request",
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              required: [
                "projectName",
                "fullName",
                "contactNumber",
                "email",
                "streetAddress",
                "city",
                "state",
                "zipCode",
                "plotLocation",
                "plotSize",
                "plotOrientation",
                "designType",
                "numFloors",
                "specialFeatures",
                "architecturalStyle",
                "budget",
              ],
              properties: {
                projectName: { type: "string" },
                fullName: { type: "string" },
                contactNumber: { type: "string" },
                email: { type: "string", format: "email" },
                streetAddress: { type: "string" },
                city: { type: "string" },
                state: { type: "string" },
                zipCode: { type: "string" },
                plotLocation: { type: "string" },
                plotSize: { type: "string" },
                plotOrientation: { type: "string" },
                designType: { type: "string" },
                numFloors: { type: "integer", minimum: 1 },
                floorRequirements: {
                  type: "string",
                  description: "JSON stringified floor requirements array",
                },
                specialFeatures: { type: "string" },
                architecturalStyle: { type: "string" },
                budget: { type: "number" },
                completionDate: { type: "string", format: "date" },
                workerId: { type: "string" },
                referenceImages: {
                  type: "array",
                  items: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
      },
      responses: {
        201: { description: "Architect request submitted successfully" },
        400: { $ref: "#/components/responses/BadRequest" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/design_request": {
    post: {
      tags: ["project-customer-accessed"],
      summary: "Submit design request (interior/graphic)",
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              required: [
                "projectName",
                "fullName",
                "email",
                "phone",
                "address",
                "roomType",
                "roomLength",
                "roomWidth",
                "dimensionUnit",
              ],
              properties: {
                projectName: { type: "string" },
                fullName: { type: "string" },
                email: { type: "string", format: "email" },
                phone: { type: "string" },
                address: { type: "string" },
                roomType: { type: "string" },
                roomLength: { type: "number" },
                roomWidth: { type: "number" },
                dimensionUnit: { type: "string" },
                ceilingHeight: { type: "number" },
                heightUnit: { type: "string" },
                designPreference: { type: "string" },
                projectDescription: { type: "string" },
                workerId: { type: "string" },
                currentRoomImages: {
                  type: "array",
                  items: { type: "string", format: "binary" },
                },
                inspirationImages: {
                  type: "array",
                  items: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
      },
      responses: {
        201: { description: "Design request submitted successfully" },
        400: { $ref: "#/components/responses/BadRequest" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/construction_form": {
    post: {
      tags: ["project-customer-accessed"],
      summary:
        "Submit construction project form with company details and floor specifications",
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              required: [
                "projectName",
                "customerName",
                "customerEmail",
                "customerPhone",
                "projectAddress",
                "projectLocation",
                "totalArea",
                "buildingType",
                "totalFloors",
                "companyId",
              ],
              properties: {
                projectName: {
                  type: "string",
                  description: "Name of the construction project",
                },
                customerName: {
                  type: "string",
                  description: "Full name of the customer",
                },
                customerEmail: {
                  type: "string",
                  format: "email",
                  description: "Email address of the customer",
                },
                customerPhone: {
                  type: "string",
                  description: "Phone number of the customer",
                },
                projectAddress: {
                  type: "string",
                  description: "Full address of the project site",
                },
                projectLocation: {
                  type: "string",
                  description: "Pincode or location identifier of the project",
                },
                totalArea: {
                  type: "number",
                  description: "Total area of the project in square meters",
                },
                buildingType: {
                  type: "string",
                  enum: [
                    "residential",
                    "commercial",
                    "industrial",
                    "mixedUse",
                    "other",
                  ],
                  description: "Type of building",
                },
                totalFloors: {
                  type: "number",
                  description: "Total number of floors",
                  minimum: 1,
                },
                companyId: {
                  type: "string",
                  description: "ObjectId of the construction company",
                },
                estimatedBudget: {
                  type: "number",
                  description: "Estimated budget for the project (optional)",
                },
                projectTimeline: {
                  type: "number",
                  description: "Project timeline in months (optional)",
                },
                specialRequirements: {
                  type: "string",
                  description: "Any special requirements or notes (optional)",
                },
                accessibilityNeeds: {
                  type: "string",
                  enum: ["wheelchair", "elevators", "ramps", "other", "none"],
                  description: "Accessibility requirements (optional)",
                },
                energyEfficiency: {
                  type: "string",
                  enum: ["standard", "leed", "passive", "netZero", "other"],
                  description: "Energy efficiency standards (optional)",
                },
                "floorType-{i}": {
                  type: "string",
                  description:
                    "Type of floor i (e.g., residential, commercial, parking)",
                },
                "floorArea-{i}": {
                  type: "number",
                  description: "Area of floor i in square meters",
                },
                "floorDescription-{i}": {
                  type: "string",
                  description: "Description of floor i",
                },
                "floorImage-{i}": {
                  type: "string",
                  format: "binary",
                  description: "Image file for floor i",
                },
                siteFiles: {
                  type: "array",
                  items: { type: "string", format: "binary" },
                  description:
                    "Site plan, architectural plans, or other documents",
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "Construction project submitted successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  message: { type: "string" },
                  projectId: { type: "string" },
                },
              },
            },
          },
        },
        400: { $ref: "#/components/responses/BadRequest" },
        401: { $ref: "#/components/responses/Unauthorized" },
        500: { description: "Error submitting project" },
      },
    },
  },
  "/api/projects": {
    get: {
      tags: ["project-company-accessed"],
      summary: "Get all projects (public)",
      responses: {
        200: { description: "Projects list retrieved" },
      },
    },
  },
  "/api/projects/{id}": {
    get: {
      tags: ["project-company-accessed"],
      summary: "Get project details by ID",
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string" } },
      ],
      responses: {
        200: { description: "Project details retrieved" },
        404: { description: "Project not found" },
      },
    },
  },
  "/api/edit-project/{id}": {
    get: {
      tags: ["project-company-accessed"],
      summary: "Get project details for editing",
      security: [{ cookieAuth: [] }],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string" } },
      ],
      responses: {
        200: { description: "Project edit data retrieved" },
        401: { $ref: "#/components/responses/Unauthorized" },
        404: { description: "Project not found" },
      },
    },
  },
  "/api/projects/update": {
    post: {
      tags: ["project-company-accessed"],
      summary: "Update project details",
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              required: ["projectId"],
              properties: {
                projectId: { type: "string" },
                projectName: { type: "string" },
                description: { type: "string" },
                mainImage: { type: "string", format: "binary" },
                additionalImages: {
                  type: "array",
                  items: { type: "string", format: "binary" },
                },
                completionImages: {
                  type: "array",
                  items: { type: "string", format: "binary" },
                },
                updateImages: {
                  type: "array",
                  items: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Project updated successfully" },
        400: { $ref: "#/components/responses/BadRequest" },
      },
    },
  },
  "/api/customer/submit-bid": {
    post: {
      tags: ["project-company-accessed"],
      summary: "Customer submits bid for project",
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["bidId", "bidPrice"],
              properties: {
                bidId: { type: "string" },
                bidPrice: { type: "number" },
              },
            },
          },
        },
      },
      responses: {
        201: { description: "Bid submitted successfully" },
        400: { $ref: "#/components/responses/BadRequest" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/customer/accept-bid": {
    post: {
      tags: ["project-customer-accessed"],
      summary: "Customer accepts a bid",
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["bidId", "companyBidId"],
              properties: {
                bidId: { type: "string" },
                companyBidId: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Bid accepted successfully" },
        400: { $ref: "#/components/responses/BadRequest" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/customer/decline-bid": {
    post: {
      tags: ["project-customer-accessed"],
      summary: "Customer declines a bid",
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["bidId", "companyBidId"],
              properties: {
                bidId: { type: "string" },
                companyBidId: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Bid declined successfully" },
        400: { $ref: "#/components/responses/BadRequest" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/customer/approve-milestone": {
    post: {
      tags: ["project-customer-accessed"],
      summary: "Customer approves milestone",
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["projectId", "milestonePercentage"],
              properties: {
                projectId: { type: "string" },
                milestonePercentage: {
                  type: "number",
                  enum: [25, 50, 75, 100],
                },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Milestone approved successfully" },
        400: { $ref: "#/components/responses/BadRequest" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/customer/request-milestone-revision": {
    post: {
      tags: ["project-customer-accessed"],
      summary: "Customer requests milestone revision",
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["projectId", "milestonePercentage", "feedback"],
              properties: {
                projectId: { type: "string" },
                milestonePercentage: {
                  type: "number",
                  enum: [25, 50, 75, 100],
                },
                feedback: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Revision requested successfully" },
        400: { $ref: "#/components/responses/BadRequest" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/customer/pay-milestone": {
    post: {
      tags: ["project-customer-accessed"],
      summary: "Customer pays for milestone",
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["projectId", "milestonePercentage", "paymentStage"],
              properties: {
                projectId: { type: "string" },
                milestonePercentage: {
                  type: "number",
                  enum: [25, 50, 75, 100],
                },
                paymentStage: {
                  type: "string",
                  enum: ["upfront", "completion", "final"],
                },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Milestone payment initiated" },
        400: { $ref: "#/components/responses/BadRequest" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/company/unviewed-customer-messages": {
    get: {
      tags: ["project-company-accessed"],
      summary: "Get projects with unviewed customer messages (company view)",
      security: [{ cookieAuth: [] }],
      responses: {
        200: { description: "Projects with unviewed messages retrieved" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/company/mark-messages-viewed/{projectId}": {
    post: {
      tags: ["project-company-accessed"],
      summary: "Mark customer messages as viewed (company)",
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
        200: { description: "Messages marked as viewed" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/customer/submit-project-review": {
    post: {
      tags: ["project-customer-accessed"],
      summary: "Customer submits project review",
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["projectId", "rating"],
              properties: {
                projectId: { type: "string" },
                rating: { type: "number", minimum: 1, maximum: 5 },
                reviewText: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        201: { description: "Project review submitted successfully" },
        400: { $ref: "#/components/responses/BadRequest" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/company/worker-request/accept": {
    post: {
      tags: ["project-company-accessed"],
      summary: "Company accepts worker request",
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["requestId"],
              properties: {
                requestId: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Worker request accepted" },
        400: { $ref: "#/components/responses/BadRequest" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/company/worker-request/reject": {
    post: {
      tags: ["project-company-accessed"],
      summary: "Company rejects worker request",
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["requestId"],
              properties: {
                requestId: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Worker request rejected" },
        400: { $ref: "#/components/responses/BadRequest" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
};
