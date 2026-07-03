import React from "react";

export default function WorkerProfileDisplay({ company, onEdit }) {
  return (
    <div className="cs-display">
      <div className="cs-row">
        <label>Company Name</label>
        <p>{company.workerProfile.name}</p>
      </div>
      <div className="cs-row">
        <label>Location</label>
        <p>{company.workerProfile.location}</p>
      </div>
      <div className="cs-row">
        <label>Company Size</label>
        <p>{company.workerProfile.size}</p>
      </div>
      <div className="cs-row">
        <label>Specializations</label>
        <div className="cs-tags">
          {(company.workerProfile.specializations || []).map((s, i) => (
            <span className="cs-tag" key={i}>{s}</span>
          ))}
        </div>
      </div>
      <div className="cs-row">
        <label>Current Openings</label>
        <div>
          {(company.workerProfile.currentOpenings || []).map((op, i) => (
            <div className="cs-opening" key={i}>{op}</div>
          ))}
        </div>
      </div>
      <div className="cs-row">
        <label>About the Company</label>
        <p>{company.workerProfile.about}</p>
      </div>
      <div className="cs-row">
        <label>Why Join Our Team?</label>
        <p>{company.workerProfile.whyJoin}</p>
      </div>

      <div className="cs-actions">
        <button className="cs-btn-primary" onClick={onEdit}>
          Edit Worker Profile
        </button>
      </div>
    </div>
  );
}
