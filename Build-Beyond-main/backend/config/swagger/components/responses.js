module.exports = {
  BadRequest: {
    description: "Bad request",
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            message: { type: "string" },
            error: { type: "string" },
          },
        },
      },
    },
  },
  Unauthorized: {
    description: "Unauthorized",
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            message: { type: "string" },
            error: { type: "string" },
          },
        },
      },
    },
  },
};
