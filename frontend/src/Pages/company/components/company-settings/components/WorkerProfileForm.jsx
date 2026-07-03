import React from "react";

export default function WorkerProfileForm({
  workerForm,
  onFormChange,
  onSubmit,
  onCancel,
  onAddOpening,
  onUpdateOpening,
  onRemoveOpening
}) {
  return (
    <form className="cs-form" onSubmit={onSubmit}>
      <div className="cs-form-row">
        <label>Company Name</label>
        <input
          type="text"
          className="cs-input"
          name="companyName"
          value={workerForm.companyName}
          readOnly
        />
      </div>
      <div className="cs-form-row">
        <label>Location</label>
        <input
          className="cs-input"
          name="companyLocation"
          value={workerForm.companyLocation}
          onChange={onFormChange}
          required
        />
      </div>
      <div className="cs-form-row">
        <label>Company Size</label>
        <select
          name="companySize"
          className="cs-input"
          value={workerForm.companySize}
          onChange={onFormChange}
          required
        >
          <option value="">Select size</option>
          <option value="1-10">1-10</option>
          <option value="11-50">11-50</option>
          <option value="51-200">51-200</option>
          <option value="201-1000">201-1000</option>
          <option value="1000+">1000+</option>
        </select>
      </div>

      <div className="cs-form-row">
        <label>Specializations (comma separated)</label>
        <input
          className="cs-input"
          name="specializations"
          value={workerForm.specializations}
          onChange={onFormChange}
        />
      </div>

      <div className="cs-form-row">
        <label>Current Openings</label>
        <div className="cs-dynamic-list">
          {workerForm.currentOpenings.map((op, i) => (
            <div key={i} className="cs-dynamic-row">
              <input
                className="cs-input"
                value={op}
                onChange={(e) => onUpdateOpening(i, e.target.value)}
              />
              <button
                type="button"
                className="cs-btn-danger"
                onClick={() => onRemoveOpening(i)}
              >
                Remove
              </button>
            </div>
          ))}
          <button type="button" className="cs-btn-secondary" onClick={onAddOpening}>
            + Add Opening
          </button>
        </div>
      </div>

      <div className="cs-form-row">
        <label>About the Company</label>
        <textarea
          className="cs-textarea"
          name="aboutCompany"
          value={workerForm.aboutCompany}
          onChange={onFormChange}
        />
      </div>

      <div className="cs-form-row">
        <label>Why Join Our Team?</label>
        <textarea
          className="cs-textarea"
          name="whyJoinUs"
          value={workerForm.whyJoinUs}
          onChange={onFormChange}
        />
      </div>

      <div className="cs-actions">
        <button type="button" className="cs-btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="cs-btn-primary">
          Save Changes
        </button>
      </div>
    </form>
  );
}
