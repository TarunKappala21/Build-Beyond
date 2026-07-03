import React from "react";

const CurrentPhaseSelect = ({ currentPhase, setCurrentPhase }) => (
  <div className="form-group">
    <label htmlFor="currentPhase">Current Phase</label>
    <select id="currentPhase" name="currentPhase" value={currentPhase} onChange={(e) => setCurrentPhase(e.target.value)} required>
      <option value="">Select current phase</option>
      <option value="Foundation">Foundation</option>
      <option value="Structure">Structure</option>
      <option value="Interior work">Interior work</option>
      <option value="Finishing">Finishing</option>
    </select>
  </div>
);

export default CurrentPhaseSelect;
