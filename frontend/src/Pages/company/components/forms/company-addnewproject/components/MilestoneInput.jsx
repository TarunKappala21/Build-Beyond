import React from "react";

const MilestoneInput = ({
  selectedMilestone,
  handleMilestoneChange,
  getCheckpointFloor,
  getMaxAllowedPercentage,
  completionPercentage
}) => (
  <div className="form-group">
    <label htmlFor="milestoneSelection">Update Project Progress (%)</label>
    <input
      type="number"
      id="milestoneSelection"
      value={selectedMilestone}
      onChange={(e) => handleMilestoneChange(e.target.value)}
      className="form-control"
      min={getCheckpointFloor()}
      max={getMaxAllowedPercentage() ?? getCheckpointFloor()}
      placeholder={`Enter progress (${getCheckpointFloor()} - ${(getMaxAllowedPercentage() ?? getCheckpointFloor())})`}
    />
    {getMaxAllowedPercentage() === null && (
      <small style={{ color: "#ff6b6b", display: "block", marginTop: "5px" }}>
        Waiting for customer approval of checkpoint before proceeding
      </small>
    )}
    {getMaxAllowedPercentage() !== null && (
      <small style={{ color: "#666", display: "block", marginTop: "5px" }}>
        You may adjust progress between {getCheckpointFloor()}% and {getMaxAllowedPercentage()}%. Reaching {getMaxAllowedPercentage()}% creates a checkpoint requiring approval.
      </small>
    )}
    {completionPercentage === 100 && (
      <small style={{ color: "#51cf66", display: "block", marginTop: "5px" }}>
        Project fully completed!
      </small>
    )}
  </div>
);

export default MilestoneInput;
