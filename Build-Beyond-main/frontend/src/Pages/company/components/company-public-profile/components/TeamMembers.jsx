// src/pages/company/components/company-public-profile/components/TeamMembers.jsx
import React from 'react';

const TeamMembers = ({ teamMembers }) => {
  if (!teamMembers || teamMembers.length === 0) {
    return null;
  }

  return (
    <div className="profile-team-section">
      <h2 className="profile-section-title">
        <i className="fas fa-users"></i> Our Team
      </h2>
      <div className="profile-team-grid">
        {teamMembers.map((member, index) => (
          <div key={index} className="profile-team-card">
            <div className="profile-team-image-wrapper">
              {member.image ? (
                <img 
                  src={member.image} 
                  alt={member.name} 
                  className="profile-team-image"
                />
              ) : (
                <div className="profile-team-placeholder">
                  <i className="fas fa-user"></i>
                </div>
              )}
            </div>
            <div className="profile-team-info">
              <h3 className="profile-team-name">{member.name}</h3>
              <p className="profile-team-role">{member.role}</p>
              {member.bio && (
                <p className="profile-team-bio">{member.bio}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamMembers;
