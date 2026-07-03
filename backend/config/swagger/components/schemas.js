module.exports = {
  MessageResponse: {
    type: "object",
    properties: {
      message: { type: "string" },
    },
  },
  ErrorResponse: {
    type: "object",
    properties: {
      message: { type: "string" },
      error: { type: "string" },
    },
  },
  LoginRequest: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: { type: "string", format: "email" },
      password: { type: "string" },
    },
  },
  LoginSuccessResponse: {
    type: "object",
    properties: {
      message: { type: "string", example: "Login successful" },
      redirect: { type: "string", example: "/customerdashboard" },
    },
  },
  LoginTwoFactorChallengeResponse: {
    type: "object",
    properties: {
      requiresTwoFactor: { type: "boolean", example: true },
      twoFactorToken: { type: "string" },
      email: { type: "string", format: "email" },
      message: { type: "string" },
    },
  },
  LoginTwoFactorVerifyRequest: {
    type: "object",
    required: ["email", "otp", "twoFactorToken"],
    properties: {
      email: { type: "string", format: "email" },
      otp: { type: "string", minLength: 6, maxLength: 6 },
      twoFactorToken: { type: "string" },
    },
  },
  EmailOtpSendRequest: {
    type: "object",
    required: ["email", "purpose"],
    properties: {
      email: { type: "string", format: "email", example: "manideep70@gmail.com" },
      purpose: { type: "string", enum: ["signup", "forgot-password"], example: "signup" },
    },
  },
  EmailOtpVerifyRequest: {
    type: "object",
    required: ["email", "otp", "purpose"],
    properties: {
      email: { type: "string", format: "email" },
      otp: { type: "string", minLength: 6, maxLength: 6 },
      purpose: { type: "string", enum: ["signup", "forgot-password"] },
    },
  },
  VerificationTokenResponse: {
    type: "object",
    properties: {
      message: { type: "string", example: "OTP verified" },
      verificationToken: { type: "string" },
    },
  },
  ResetPasswordRequest: {
    type: "object",
    required: ["email", "newPassword", "verificationToken"],
    properties: {
      email: { type: "string", format: "email" },
      newPassword: { type: "string", minLength: 8 },
      verificationToken: { type: "string" },
    },
  },
  TwoFactorStatusResponse: {
    type: "object",
    properties: {
      twoFactorEnabled: { type: "boolean" },
    },
  },
  TwoFactorStatusUpdateRequest: {
    type: "object",
    required: ["enabled"],
    properties: {
      enabled: { type: "boolean" },
    },
  },
};
