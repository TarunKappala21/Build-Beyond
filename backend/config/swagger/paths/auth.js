module.exports = {
  "/api/signup": {
    post: {
      tags: ["auth"],
      summary: "Register a new user",
      description:
        "Use /api/email-otp/send and /api/email-otp/verify first. Put verificationToken from OTP verify response into emailVerificationToken here.",
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              required: ["role", "email", "password", "termsAccepted", "emailVerificationToken"],
              properties: {
                role: {
                  type: "string",
                  enum: ["customer", "company", "worker"],
                  description: "Select signup role",
                },
                email: { type: "string", format: "email" },
                password: { type: "string", minLength: 8 },
                termsAccepted: { type: "boolean" },
                emailVerificationToken: {
                  type: "string",
                  description: "Value from /api/email-otp/verify response field verificationToken",
                },

                name: { type: "string", description: "Required for customer and worker" },
                dob: { type: "string", format: "date", description: "Required for customer and worker" },
                phone: { type: "string", description: "Required for all roles" },

                companyName: { type: "string", description: "Required for company" },
                contactPerson: { type: "string", description: "Required for company" },

                aadharNumber: { type: "string", description: "Required for worker" },
                specialization: { type: "string", description: "Required for worker" },
                experience: { type: "number", description: "Optional for worker" },

                documents: {
                  type: "array",
                  description: "Optional for company and worker",
                  items: { type: "string", format: "binary" },
                },
              },
              oneOf: [
                {
                  description: "Customer signup",
                  required: ["role", "name", "email", "dob", "phone", "password", "termsAccepted", "emailVerificationToken"],
                  properties: {
                    role: { enum: ["customer"] },
                  },
                },
                {
                  description: "Company signup",
                  required: ["role", "companyName", "contactPerson", "email", "phone", "password", "termsAccepted", "emailVerificationToken"],
                  properties: {
                    role: { enum: ["company"] },
                  },
                },
                {
                  description: "Worker signup",
                  required: ["role", "name", "email", "dob", "aadharNumber", "phone", "specialization", "password", "termsAccepted", "emailVerificationToken"],
                  properties: {
                    role: { enum: ["worker"] },
                  },
                },
              ],
            },
          },
        },
      },
      responses: {
        201: { description: "Signup successful" },
        400: { $ref: "#/components/responses/BadRequest" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/login": {
    post: {
      tags: ["auth"],
      summary: "Login with email/password",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/LoginRequest" },
          },
        },
      },
      responses: {
        200: {
          description: "Login success or 2FA challenge",
          content: {
            "application/json": {
              schema: {
                oneOf: [
                  { $ref: "#/components/schemas/LoginSuccessResponse" },
                  { $ref: "#/components/schemas/LoginTwoFactorChallengeResponse" },
                ],
              },
            },
          },
        },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/login/google": {
    post: {
      tags: ["auth"],
      summary: "Login using Google identity token",
      description:
        "This endpoint logs in existing accounts only. If account does not exist, backend returns 404 with accountExists false.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["credential"],
              properties: {
                credential: { type: "string", description: "Google ID token from frontend Google Sign-In" },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Login success or 2FA challenge",
          content: {
            "application/json": {
              schema: {
                oneOf: [
                  { $ref: "#/components/schemas/LoginSuccessResponse" },
                  { $ref: "#/components/schemas/LoginTwoFactorChallengeResponse" },
                ],
              },
            },
          },
        },
        401: { $ref: "#/components/responses/Unauthorized" },
        403: { description: "Company/worker pending or rejected" },
        404: { description: "Account not found" },
      },
    },
  },
  "/api/login/2fa/verify": {
    post: {
      tags: ["auth"],
      summary: "Verify login OTP and complete 2FA login",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/LoginTwoFactorVerifyRequest" },
          },
        },
      },
      responses: {
        200: {
          description: "Login successful",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginSuccessResponse" },
            },
          },
        },
        400: { $ref: "#/components/responses/BadRequest" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/login/2fa/resend": {
    post: {
      tags: ["auth"],
      summary: "Resend login OTP during 2FA flow",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["twoFactorToken"],
              properties: {
                twoFactorToken: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "OTP resent" },
        400: { $ref: "#/components/responses/BadRequest" },
        401: { $ref: "#/components/responses/Unauthorized" },
        429: { description: "Rate limited" },
      },
    },
  },
  "/api/email-otp/send": {
    post: {
      tags: ["auth"],
      summary: "Send email OTP",
      description: "purpose must be signup or forgot-password.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email", "purpose"],
              properties: {
                email: { type: "string", format: "email", example: "manideep70@gmail.com" },
                purpose: {
                  type: "string",
                  enum: ["signup", "forgot-password"],
                  example: "signup",
                  default: "signup",
                },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "OTP sent" },
        400: { $ref: "#/components/responses/BadRequest" },
        404: { description: "Account not found (forgot-password)" },
        429: { description: "Rate limited" },
      },
    },
  },
  "/api/email-otp/verify": {
    post: {
      tags: ["auth"],
      summary: "Verify email OTP and get verification token",
      description: "Use the same purpose used in /api/email-otp/send.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email", "otp", "purpose"],
              properties: {
                email: { type: "string", format: "email", example: "manideep70@gmail.com" },
                otp: { type: "string", minLength: 6, maxLength: 6, example: "123456" },
                purpose: {
                  type: "string",
                  enum: ["signup", "forgot-password"],
                  example: "signup",
                  default: "signup",
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "OTP verified",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/VerificationTokenResponse" },
            },
          },
        },
        400: { $ref: "#/components/responses/BadRequest" },
      },
    },
  },
  "/api/reset-password": {
    post: {
      tags: ["auth"],
      summary: "Reset password using verification token from OTP verify",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ResetPasswordRequest" },
          },
        },
      },
      responses: {
        200: { description: "Password reset successful" },
        400: { $ref: "#/components/responses/BadRequest" },
        401: { $ref: "#/components/responses/Unauthorized" },
        404: { description: "Account not found" },
      },
    },
  },
  "/api/2fa/status": {
    get: {
      tags: ["auth"],
      summary: "Get current user 2FA status",
      security: [{ cookieAuth: [] }],
      responses: {
        200: {
          description: "2FA status",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/TwoFactorStatusResponse" },
            },
          },
        },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
    put: {
      tags: ["auth"],
      summary: "Enable or disable 2FA",
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/TwoFactorStatusUpdateRequest" },
          },
        },
      },
      responses: {
        200: { description: "2FA setting updated" },
        400: { $ref: "#/components/responses/BadRequest" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/logout": {
    get: {
      tags: ["auth"],
      summary: "Logout and clear auth cookie",
      responses: {
        200: { description: "Logged out successfully" },
      },
    },
  },
  "/api/session": {
    get: {
      tags: ["auth"],
      summary: "Get current session authentication state",
      responses: {
        200: {
          description: "Session state",
          content: {
            "application/json": {
              schema: {
                oneOf: [
                  {
                    type: "object",
                    properties: {
                      authenticated: { type: "boolean", example: false },
                    },
                  },
                  {
                    type: "object",
                    properties: {
                      authenticated: { type: "boolean", example: true },
                      user: {
                        type: "object",
                        properties: {
                          user_id: { type: "string" },
                          role: { type: "string", enum: ["customer", "company", "worker"] },
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
    },
  },
};
