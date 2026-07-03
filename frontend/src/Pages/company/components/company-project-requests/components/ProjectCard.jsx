// src/pages/company/components/company-project-requests/components/ProjectCard.jsx
import React from 'react';

const ProjectCard = ({ 
  project, 
  onViewDetails, 
  onOpenProposal, 
  onRejectProject 
}) => {
  return (
    <div className="requests-card">
      <div className="requests-card-header">
        <h3>{project.projectName}</h3>
      </div>
      <div className="requests-card-body">
        <div className="requests-card-info">
          <p>
            <strong>Customer</strong>
            <span>{project.customerName}</span>
          </p>
          <p>
            <strong>Contact</strong>
            <span>{project.customerPhone}</span>
          </p>
          <p>
            <strong>Building Type</strong>
            <span>
              {project.buildingType
                ? project.buildingType.charAt(0).toUpperCase() +
                  project.buildingType.slice(1)
                : "N/A"}
            </span>
          </p>
          <p>
            <strong>Total Area</strong>
            <span>{project.totalArea} sq.m</span>
          </p>
        </div>
        <div className="requests-card-actions">
          <button
            className="requests-card-btn requests-btn-view"
            onClick={() => onViewDetails(project)}
          >
            <i className="fas fa-eye"></i> View Details
          </button>
        </div>
        <div className="requests-card-actions requests-card-actions-bottom">
          {project.status === "proposal_sent" ? (
            <div className="requests-proposal-sent-status">
              ✓ Proposal already sent
            </div>
          ) : (
            <>
              <button
                className="requests-card-btn requests-btn-accept requests-proposal-create-btn"
                onClick={() => onOpenProposal(project)}
              >
                <i className="fas fa-file-signature"></i> Create Proposal
              </button>
              <button
                className="requests-card-btn requests-btn-reject"
                onClick={() => onRejectProject(project._id)}
              >
                <i className="fas fa-times"></i> Reject
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
