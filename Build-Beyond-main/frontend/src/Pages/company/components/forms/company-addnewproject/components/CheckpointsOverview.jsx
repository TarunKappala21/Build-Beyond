import React from "react";

const CheckpointsOverview = ({ existingMilestones }) => (
  <div className="form-group">
    <label htmlFor="completionPercentage">Checkpoint Progress Overview</label>
    <div className="milestones-overview" style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
      {[25, 50, 75, 100].map(milestone => {
        const isCompleted = existingMilestones.some(m => m.percentage === milestone && m.isCheckpoint);
        const milestoneData = existingMilestones.find(m => m.percentage === milestone && m.isCheckpoint);
        const isApproved = milestoneData?.isApprovedByCustomer;
        return (
          <div
            key={milestone}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "6px",
              textAlign: "center",
              backgroundColor: isCompleted ? (isApproved ? "#d4edda" : "#fff3cd") : "#e9ecef",
              border: `2px solid ${isCompleted ? (isApproved ? "#28a745" : "#ffc107") : "#dee2e6"}`,
              fontSize: "0.9em"
            }}
          >
            <strong>{milestone}%</strong>
            <div style={{ fontSize: "0.8em", marginTop: "5px" }}>
              {isCompleted ? (isApproved ? "✓ Approved" : "⏳ Pending") : "○ Not Started"}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

export default CheckpointsOverview;
