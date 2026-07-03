import React from "react";

const TargetCompletionDateInput = ({ targetCompletionDate, setTargetCompletionDate }) => (
  <div className="form-group">
    <label htmlFor="targetCompletionDate">Target Completion Date</label>
    <input
      type="date"
      id="targetCompletionDate"
      name="targetCompletionDate"
      value={targetCompletionDate}
      onChange={(e) => setTargetCompletionDate(e.target.value)}
      required
    />
  </div>
);

export default TargetCompletionDateInput;
