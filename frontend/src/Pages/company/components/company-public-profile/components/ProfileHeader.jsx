// src/pages/company/components/company-public-profile/components/ProfileHeader.jsx
import React from 'react';

const ProfileHeader = ({ company }) => {
  return (
    <div className="profile-header">
      <div className="profile-hero">
        <div className="profile-hero-content">
          <h1 className="profile-company-name">{company.name}</h1>
          <p className="profile-location">
            <i className="fas fa-map-marker-alt profile-location-icon"></i>
            {company.location}
          </p>
        </div>
      </div>
      
      <div className="profile-stats-container">
        <div className="profile-stat-card">
          <div className="profile-stat-icon">
            <i className="fas fa-calendar-alt"></i>
          </div>
          <div className="profile-stat-info">
            <h3 className="profile-stat-value">{company.yearsInBusiness}+</h3>
            <p className="profile-stat-label">Years in Business</p>
          </div>
        </div>
        
        <div className="profile-stat-card">
          <div className="profile-stat-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="profile-stat-info">
            <h3 className="profile-stat-value">{company.projectsCompleted}</h3>
            <p className="profile-stat-label">Projects Completed</p>
          </div>
        </div>
        
        <div className="profile-stat-card">
          <div className="profile-stat-icon">
            <i className="fas fa-users"></i>
          </div>
          <div className="profile-stat-info">
            <h3 className="profile-stat-value">{company.teamMembers?.length || 0}</h3>
            <p className="profile-stat-label">Team Members</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
