import React from "react";

export default function CustomerProfileForm({
  customerForm,
  onFormChange,
  onSubmit,
  onCancel,
  onAddProject,
  onUpdateProject,
  onRemoveProject,
  onBeforeImageChange,
  onAfterImageChange,
  onCertificateChange
}) {
  return (
    <form className="cs-form" onSubmit={onSubmit}>
      <div className="cs-form-row">
        <label>Company Name</label>
        <input className="cs-input" value={customerForm.companyName} readOnly />
      </div>

      <div className="cs-form-row">
        <label>Location</label>
        <input
          className="cs-input"
          name="companyLocation"
          value={customerForm.companyLocation}
          onChange={onFormChange}
        />
      </div>

      <div className="cs-form-row">
        <label>Projects Completed</label>
        <input
          type="number"
          className="cs-input"
          name="projectsCompleted"
          value={customerForm.projectsCompleted}
          onChange={onFormChange}
        />
      </div>

      <div className="cs-form-row">
        <label>Years in Business</label>
        <input
          type="number"
          className="cs-input"
          name="yearsInBusiness"
          value={customerForm.yearsInBusiness}
          onChange={onFormChange}
        />
      </div>

      <div className="cs-form-row">
        <label>About the Company</label>
        <textarea
          className="cs-textarea"
          name="customerAboutCompany"
          value={customerForm.customerAboutCompany}
          onChange={onFormChange}
        />
      </div>

      <div className="cs-form-row">
        <label>Completed Projects</label>
        <div className="cs-dynamic-list">
          {customerForm.completedProjects.map((proj, idx) => (
            <div key={idx} className="cs-dynamic-row cs-project-edit-row">
              <div className="cs-project-edit-left">
                <div className="cs-file-input-group">
                  <label>Before Construction Image</label>
                  <img
                    className="cs-project-img"
                    src={proj.beforeImage || "https://via.placeholder.com/120x80"}
                    alt="Before"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => onBeforeImageChange(e, idx)}
                  />
                </div>
                <div className="cs-file-input-group">
                  <label>After Construction Image</label>
                  <img
                    className="cs-project-img"
                    src={proj.afterImage || "https://via.placeholder.com/120x80"}
                    alt="After"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => onAfterImageChange(e, idx)}
                  />
                </div>
                <div className="cs-file-input-group">
                  <label>Material Certificate</label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => onCertificateChange(e, idx)}
                  />
                  {proj.materialCertificate && <small>Certificate uploaded</small>}
                </div>
              </div>
              <div className="cs-project-edit-right">
                <input
                  className="cs-input"
                  placeholder="Project Title"
                  value={proj.title || ""}
                  onChange={(e) => onUpdateProject(idx, "title", e.target.value)}
                />
                <textarea
                  className="cs-textarea"
                  placeholder="Project Description"
                  value={proj.description || ""}
                  onChange={(e) => onUpdateProject(idx, "description", e.target.value)}
                />
                <input
                  className="cs-input"
                  placeholder="Project Location"
                  value={proj.location || ""}
                  onChange={(e) => onUpdateProject(idx, "location", e.target.value)}
                />
                <input
                  className="cs-input"
                  placeholder="Tender ID (if applicable)"
                  value={proj.tenderId || ""}
                  onChange={(e) => onUpdateProject(idx, "tenderId", e.target.value)}
                />
                <input
                  className="cs-input"
                  placeholder="GPS Link (Google Maps URL)"
                  value={proj.gpsLink || ""}
                  onChange={(e) => onUpdateProject(idx, "gpsLink", e.target.value)}
                />
                <div className="cs-team-row-actions">
                  <button
                    type="button"
                    className="cs-btn-danger"
                    onClick={() => onRemoveProject(idx)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
          <div>
            <button type="button" className="cs-btn-secondary" onClick={onAddProject}>
              + Add Project
            </button>
          </div>
        </div>
      </div>

      <div className="cs-form-row">
        <label>Did You Know?</label>
        <textarea
          className="cs-textarea"
          name="didYouKnow"
          value={customerForm.didYouKnow}
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
