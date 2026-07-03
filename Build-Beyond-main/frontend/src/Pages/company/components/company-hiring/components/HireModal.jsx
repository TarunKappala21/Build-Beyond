import React from "react";

const HireModal = ({ open, form, onChange, onSubmit, onCancel }) => {
  if (!open) return null;
  return (
    <div className="comhiring_modalBackdrop" onClick={onCancel}>
      <div className="comhiring_modal" onClick={(e) => e.stopPropagation()}>
        <button className="comhiring_modalClose" onClick={onCancel}>×</button>
        <div className="comhiring_modalHeader">
          <h2>Hire Worker</h2>
          <p>Sending hire request to <strong>{form.workerName}</strong></p>
        </div>
        <form className="comhiring_modalBody" onSubmit={onSubmit}>
          <label className="comhiring_label">Position</label>
          <input
            className="comhiring_input"
            value={form.position}
            onChange={(e) => onChange("position", e.target.value)}
            required
            minLength={2}
          />
          <label className="comhiring_label">Location</label>
            <input
              className="comhiring_input"
              value={form.location}
              onChange={(e) => onChange("location", e.target.value)}
              required
              minLength={2}
            />
          <label className="comhiring_label">Salary (₹/month)</label>
          <input
            className="comhiring_input"
            type="number"
            value={form.salary}
            onChange={(e) => onChange("salary", e.target.value)}
            required
            min={10}
          />
          <div className="comhiring_modalFooter">
            <button type="button" className="comhiring_btnCancel" onClick={onCancel}>Cancel</button>
            <button type="submit" className="comhiring_btnHire">Send Request</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HireModal;
