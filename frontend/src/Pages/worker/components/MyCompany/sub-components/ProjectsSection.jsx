import React from 'react';

const ProjectsSection = ({ projects }) => {
  return (
    <div className="wkmc-projects-section">
      <h3>Active Company Projects</h3>
      {projects.length > 0 ? (
        <div className="wkmc-projects-list">
          {projects.map((project) => (
            <div key={project._id} className="wkmc-project-item">
              <div className="wkmc-project-icon">
                <i className="fas fa-folder-open"></i>
              </div>
              <div className="wkmc-project-info">
                <h4>{project.projectName}</h4>
                <span className={`wkmc-project-status wkmc-status-${project.status.toLowerCase()}`}>
                  {project.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="wkmc-no-projects">No active projects at the moment.</p>
      )}
    </div>
  );
};

export default ProjectsSection;
