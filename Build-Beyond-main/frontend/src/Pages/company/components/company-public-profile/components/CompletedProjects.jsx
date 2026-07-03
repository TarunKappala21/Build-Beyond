// src/pages/company/components/company-public-profile/components/CompletedProjects.jsx
import React from 'react';

const CompletedProjects = ({ projects }) => {
  if (!projects || projects.length === 0) {
    return null;
  }

  return (
    <div className="profile-projects-section">
      <h2 className="profile-section-title">
        <i className="fas fa-building"></i> Our Portfolio
      </h2>
      <div className="profile-projects-grid">
        {projects.map((project, index) => (
          <div key={index} className="profile-project-card">
            <div className="profile-project-image-wrapper">
              {project.image ? (
                <img 
                  src={project.image} 
                  alt={project.title} 
                  className="profile-project-image"
                />
              ) : (
                <div className="profile-project-placeholder">
                  <i className="fas fa-image"></i>
                </div>
              )}
              {project.category && (
                <div className="profile-project-category">{project.category}</div>
              )}
            </div>
            <div className="profile-project-info">
              <h3 className="profile-project-title">{project.title}</h3>
              {project.location && (
                <p className="profile-project-location">
                  <i className="fas fa-map-marker-alt"></i> {project.location}
                </p>
              )}
              {project.description && (
                <p className="profile-project-description">{project.description}</p>
              )}
              {project.completionDate && (
                <p className="profile-project-date">
                  <i className="fas fa-calendar-check"></i> Completed: {project.completionDate}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompletedProjects;
