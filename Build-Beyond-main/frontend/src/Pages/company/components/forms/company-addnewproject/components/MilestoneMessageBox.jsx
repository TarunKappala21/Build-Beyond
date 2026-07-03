import React from "react";

const MilestoneMessageBox = ({
  selectedMilestone,
  milestoneMessage,
  setMilestoneMessage
}) => (
  <div className="form-group milestone-message-box" style={{
    backgroundColor: "#f8f9fa",
    padding: "15px",
    borderRadius: "8px",
    border: "2px solid #4CAF50"
  }}>
    <label htmlFor="milestoneMessage">
      Progress Update Message for {selectedMilestone}% Completion
      <span style={{ color: "#666", fontSize: "0.9em", display: "block", marginTop: "5px" }}>
        {[25, 50, 75, 100].includes(parseInt(selectedMilestone))
          ? `This is a CHECKPOINT at ${selectedMilestone}%. Customer approval required before proceeding further.`
          : "Describe what has been completed and any queries for the customer"}
      </span>
    </label>
    <textarea
      id="milestoneMessage"
      value={milestoneMessage}
      onChange={(e) => setMilestoneMessage(e.target.value)}
      rows="4"
      placeholder={`Example: We have reached ${selectedMilestone}% completion. ${[25, 50, 75, 100].includes(parseInt(selectedMilestone)) ? 'This is a checkpoint milestone. ' : ''}Describe the work completed and any questions for the customer.`}
      maxLength="500"
      required={!!selectedMilestone}
      style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #ddd" }}
    />
    <small style={{ color: "#666", display: "block", marginTop: "5px" }}>
      {milestoneMessage.length}/500 characters
    </small>
  </div>
);

export default MilestoneMessageBox;
