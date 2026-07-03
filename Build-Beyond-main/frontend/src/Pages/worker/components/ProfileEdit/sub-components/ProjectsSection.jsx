import React from 'react';
import './ProjectsSection.css';

const ProjectsSection = ({ 
  projects, 
  onAddProject, 
  onRemoveProject, 
  onProjectChange, 
  onProjectImageChange 
}) => {
  return (
    <div className="wkpe-form-section">
      <h2>Notable Projects</h2>
      <button type="button" className="wkpe-add-project-btn" onClick={onAddProject}>
        + Add Project
      </button>

      <div className="wkpe-projects-container">
        {projects.map((project, index) => (
          <div key={index} className="wkpe-project-item">
            <div className="wkpe-form-group">
              <label htmlFor={`projectName-${index}`}>Project Name</label>
              <input
                type="text"
                id={`projectName-${index}`}
                value={project.name}
                onChange={(e) => onProjectChange(index, 'name', e.target.value)}
                required
              />
            </div>

            <div className="wkpe-form-group">
              <label htmlFor={`projectYear-${index}`}>Year</label>
              <input
                type="number"
                id={`projectYear-${index}`}
                min="1900"
                max="2100"
                value={project.year}
                onChange={(e) => onProjectChange(index, 'year', e.target.value)}
                required
              />
            </div>

            <div className="wkpe-form-group">
              <label htmlFor={`projectLocation-${index}`}>Location</label>
              <input
                type="text"
                id={`projectLocation-${index}`}
                value={project.location}
                onChange={(e) => onProjectChange(index, 'location', e.target.value)}
                required
              />
            </div>

            <div className="wkpe-form-group">
              <label htmlFor={`projectDescription-${index}`}>Description</label>
              <textarea
                id={`projectDescription-${index}`}
                value={project.description}
                onChange={(e) => onProjectChange(index, 'description', e.target.value)}
                required
              />
            </div>

            <div className="wkpe-form-group">
              <label htmlFor={`projectImage-${index}`}>Project Image</label>
              <input
                type="file"
                id={`projectImage-${index}`}
                accept="image/*"
                onChange={(e) => onProjectImageChange(index, e.target.files[0])}
              />
              <div className="wkpe-project-image-preview">
                {project.imagePreview || project.image ? (
                  <img src={project.imagePreview || project.image} alt="Project" />
                ) : (
                  <span>Project Image</span>
                )}
              </div>
            </div>

            <button
              type="button"
              className="wkpe-remove-project-btn"
              onClick={() => onRemoveProject(index)}
            >
              Remove Project
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectsSection;
