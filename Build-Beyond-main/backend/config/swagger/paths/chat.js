module.exports = {
  "/api/chat/{roomId}": {
    get: {
      tags: ["chat"],
      summary: "Get chat page for a specific room",
      security: [{ cookieAuth: [] }],
      parameters: [
        { name: "roomId", in: "path", required: true, schema: { type: "string" } },
      ],
      responses: {
        200: { description: "Chat page loaded successfully" },
        401: { $ref: "#/components/responses/Unauthorized" },
        404: { description: "Chat room not found" },
      },
    },
  },
};
