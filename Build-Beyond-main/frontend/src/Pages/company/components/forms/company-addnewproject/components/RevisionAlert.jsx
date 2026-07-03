import React from "react";

const RevisionAlert = ({ customerFeedback, conversationHistory }) => (
  <div style={{
    backgroundColor: "#fff3cd",
    border: "2px solid #ffc107",
    borderRadius: "8px",
    padding: "20px",
    marginBottom: "20px"
  }}>
    <h3 style={{ marginTop: 0, color: "#856404" }}>⚠ Customer Revision Request</h3>
    {conversationHistory && conversationHistory.length > 0 && (
      <div style={{
        backgroundColor: "#f8f9fa",
        padding: "15px",
        borderRadius: "6px",
        marginBottom: "15px",
        border: "1px solid #dee2e6"
      }}>
        <strong style={{ display: "block", marginBottom: "12px", color: "#555" }}>
          💬 Conversation History ({conversationHistory.length} {conversationHistory.length === 1 ? 'message' : 'messages'})
        </strong>
        <div style={{ maxHeight: "250px", overflowY: "auto" }}>
          {conversationHistory.map((msg, idx) => (
            <div key={idx} style={{
              backgroundColor: msg.sender === 'company' ? "#e3f2fd" : "#fff3e0",
              padding: "10px",
              borderRadius: "8px",
              marginBottom: "8px",
              borderLeft: `4px solid ${msg.sender === 'company' ? "#2196f3" : "#ff9800"}`
            }}>
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                marginBottom: "6px",
                fontSize: "0.85em",
                color: "#666"
              }}>
                <strong style={{ color: msg.sender === 'company' ? "#1976d2" : "#f57c00" }}>
                  {msg.sender === 'company' ? '🏢 Your Company' : '👤 Customer'}
                </strong>
                <span>
                  {new Date(msg.timestamp).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </span>
              </div>
              <p style={{ margin: 0, lineHeight: "1.5", color: "#333" }}>{msg.message}</p>
            </div>
          ))}
        </div>
      </div>
    )}
    <p style={{ marginBottom: "10px" }}>
      <strong>Latest Customer Feedback:</strong>
    </p>
    <p style={{ 
      backgroundColor: "white", 
      padding: "15px", 
      borderRadius: "6px",
      marginBottom: "10px",
      lineHeight: "1.6"
    }}>
      {customerFeedback}
    </p>
    <p style={{ margin: 0, color: "#666", fontSize: "0.95em" }}>
      Please update your message below to address the customer's concerns. Your response will be added to the conversation history.
    </p>
  </div>
);

export default RevisionAlert;
