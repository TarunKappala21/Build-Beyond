// src/pages/company/components/company-public-profile/components/Specializations.jsx
import React from 'react';

const Specializations = ({ specializations }) => {
  if (!specializations || specializations.length === 0) {
    return null;
  }

  return (
    <div className="profile-specializations-section">
      <h2 className="profile-section-title">
        <i className="fas fa-tools"></i> Our Specializations
      </h2>
      <div className="profile-specializations-grid">
        {specializations.map((spec, index) => (
          <div key={index} className="profile-specialization-card">
            <i className="fas fa-check-circle profile-spec-icon"></i>
            <span className="profile-spec-text">{spec}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Specializations;
