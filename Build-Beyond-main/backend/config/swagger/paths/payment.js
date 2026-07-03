module.exports = {
  "/api/payment/initialize-escrow": {
    post: {
      tags: ["payment", "customer"],
      summary: "Customer initializes escrow for architect/interior project",
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
        200: { description: "Escrow initialized" },
        400: { $ref: "#/components/responses/BadRequest" },
      },
    },
  },
  "/api/payment/worker/create-order": {
    post: {
      tags: ["payment", "customer"],
      summary: "Customer creates Razorpay order for worker deposit or milestone",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["projectId", "projectType", "paymentType"],
              properties: {
                projectId: { type: "string" },
                projectType: {
                  type: "string",
                  enum: ["architect", "interior"],
                },
                paymentType: { type: "string", enum: ["deposit", "milestone"] },
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
        200: { description: "Order created" },
        400: { $ref: "#/components/responses/BadRequest" },
      },
    },
  },
  "/api/payment/worker/verify-payment": {
    post: {
      tags: ["payment", "customer"],
      summary: "Customer verifies worker payment and updates escrow",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: [
                "projectId",
                "projectType",
                "paymentType",
                "razorpay_order_id",
                "razorpay_payment_id",
                "razorpay_signature",
              ],
              properties: {
                projectId: { type: "string" },
                projectType: {
                  type: "string",
                  enum: ["architect", "interior"],
                },
                paymentType: { type: "string", enum: ["deposit", "milestone"] },
                milestonePercentage: {
                  type: "number",
                  enum: [25, 50, 75, 100],
                },
                razorpay_order_id: { type: "string" },
                razorpay_payment_id: { type: "string" },
                razorpay_signature: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Payment verified and escrow updated" },
        400: { $ref: "#/components/responses/BadRequest" },
      },
    },
  },
  "/api/payment/worker/test-mark-paid": {
    post: {
      tags: ["payment", "customer"],
      summary:
        "Test mode shortcut to mark worker deposit/milestone payment as paid",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["projectId", "projectType", "paymentType"],
              properties: {
                projectId: { type: "string" },
                projectType: {
                  type: "string",
                  enum: ["architect", "interior"],
                },
                paymentType: { type: "string", enum: ["deposit", "milestone"] },
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
        200: { description: "Payment marked as paid in test mode" },
        400: { $ref: "#/components/responses/BadRequest" },
      },
    },
  },
  "/api/payment/collect-milestone": {
    post: {
      tags: ["payment", "customer"],
      summary: "Customer collects milestone payment into escrow",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["projectId", "projectType", "milestonePercentage"],
              properties: {
                projectId: { type: "string" },
                projectType: {
                  type: "string",
                  enum: ["architect", "interior"],
                },
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
        200: { description: "Milestone collected" },
        400: { $ref: "#/components/responses/BadRequest" },
      },
    },
  },
  "/api/payment/release-milestone": {
    post: {
      tags: ["payment", "customer"],
      summary: "Customer releases escrowed milestone payment",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["projectId", "projectType", "milestonePercentage"],
              properties: {
                projectId: { type: "string" },
                projectType: {
                  type: "string",
                  enum: ["architect", "interior"],
                },
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
        200: { description: "Milestone released" },
        400: { $ref: "#/components/responses/BadRequest" },
      },
    },
  },
  "/api/payment/worker/earnings": {
    get: {
      tags: ["payment"],
      summary: "Get worker earnings summary",
      security: [{ cookieAuth: [] }],
      responses: {
        200: { description: "Worker earnings retrieved" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/payment/worker/withdraw": {
    post: {
      tags: ["payment"],
      summary: "Request worker withdrawal",
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["amount", "bankDetails"],
              properties: {
                amount: { type: "number" },
                bankDetails: {
                  type: "object",
                  required: ["accountNumber", "ifscCode"],
                  properties: {
                    accountHolderName: { type: "string" },
                    accountNumber: { type: "string" },
                    ifscCode: { type: "string" },
                    bankName: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Withdrawal request submitted" },
        400: { $ref: "#/components/responses/BadRequest" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/payment/worker/transactions": {
    get: {
      tags: ["payment"],
      summary: "Get worker transaction history",
      security: [{ cookieAuth: [] }],
      parameters: [
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
        {
          name: "type",
          in: "query",
          required: false,
          schema: { type: "string" },
        },
        {
          name: "status",
          in: "query",
          required: false,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: { description: "Transaction history retrieved" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/payment/company/create-order": {
    post: {
      tags: ["payment", "customer"],
      summary:
        "Create Razorpay order for company phase payment (75/25 split, 5% platform fee)",
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
        200: { description: "Razorpay order created" },
        400: { $ref: "#/components/responses/BadRequest" },
      },
    },
  },
  "/api/payment/company/verify-payment": {
    post: {
      tags: ["payment", "customer"],
      summary: "Verify company Razorpay payment and process phase payout",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: [
                "projectId",
                "razorpay_order_id",
                "razorpay_payment_id",
                "razorpay_signature",
              ],
              properties: {
                projectId: { type: "string" },
                milestonePercentage: {
                  type: "number",
                  enum: [25, 50, 75, 100],
                  description:
                    "Optional for normal verify flow (resolved by order ID). Required when using test bypass endpoint.",
                },
                razorpay_order_id: { type: "string" },
                razorpay_payment_id: { type: "string" },
                razorpay_signature: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Payment verified" },
        400: { $ref: "#/components/responses/BadRequest" },
      },
    },
  },
  "/api/payment/company/test-mark-paid": {
    post: {
      tags: ["payment", "customer"],
      summary: "Test-mode mark installment as paid",
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
                testAmount: { type: "number" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Installment marked paid in test mode" },
        400: { $ref: "#/components/responses/BadRequest" },
      },
    },
  },
  "/api/payment/company/release-milestone": {
    post: {
      tags: ["payment", "customer"],
      summary: "Release held 25% to company and mark platform fee due",
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
        200: { description: "Milestone released" },
        400: { $ref: "#/components/responses/BadRequest" },
      },
    },
  },
  "/api/payment/company/platform-fee/create-order": {
    post: {
      tags: ["payment"],
      summary: "Create platform fee payment order for company",
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
        200: { description: "Platform fee order created" },
        400: { $ref: "#/components/responses/BadRequest" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/payment/company/platform-fee/verify-payment": {
    post: {
      tags: ["payment"],
      summary: "Verify company platform fee payment",
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: [
                "projectId",
                "milestonePercentage",
                "razorpay_order_id",
                "razorpay_payment_id",
                "razorpay_signature",
              ],
              properties: {
                projectId: { type: "string" },
                milestonePercentage: {
                  type: "number",
                  enum: [25, 50, 75, 100],
                },
                razorpay_order_id: { type: "string" },
                razorpay_payment_id: { type: "string" },
                razorpay_signature: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Platform fee payment verified" },
        400: { $ref: "#/components/responses/BadRequest" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/payment/company/platform-fee/test-mark-paid": {
    post: {
      tags: ["payment"],
      summary: "Test-mode mark company platform fee as paid",
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
                testAmount: { type: "number" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Platform fee marked paid in test mode" },
        400: { $ref: "#/components/responses/BadRequest" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/payment/company/summary/{projectId}": {
    get: {
      tags: ["payment", "customer"],
      summary: "Customer view of company project payment summary",
      parameters: [
        {
          name: "projectId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: { description: "Payment summary" },
        404: { description: "Not found" },
      },
    },
  },
};
