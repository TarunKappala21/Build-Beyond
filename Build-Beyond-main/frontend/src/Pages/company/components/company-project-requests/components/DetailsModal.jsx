// src/pages/company/components/company-project-requests/components/DetailsModal.jsx
import React from 'react';

const DetailsModal = ({ 
  project, 
  isOpen, 
  onClose, 
  onOpenProposal, 
  onRejectProject,
  formatDate,
  getStatusText 
}) => {
  if (!isOpen || !project) return null;

  return (
    <div className="requests-modal-backdrop requests-modal-active" onClick={onClose}>
      <div className="requests-modal" onClick={(e) => e.stopPropagation()}>
        <div className="requests-modal-header">
          <div>
            <span className="requests-modal-title">{project.projectName}</span>
            <span className={`requests-modal-status requests-status-${project.status}`}>
              {getStatusText(project.status)}
            </span>
          </div>
          <button className="requests-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="requests-modal-body">
          {/* Customer Information */}
          <div className="requests-detail-section">
            <h3>Customer Information</h3>
            <div className="requests-detail-grid">
              <div className="requests-detail-item">
                <strong>Name:</strong>
                <span>{project.customerName}</span>
              </div>
              <div className="requests-detail-item">
                <strong>Email:</strong>
                <span>{project.customerEmail}</span>
              </div>
              <div className="requests-detail-item">
                <strong>Phone:</strong>
                <span>{project.customerPhone}</span>
              </div>
              <div className="requests-detail-item">
                <strong>Submission Date:</strong>
                <span>{formatDate(project.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Project Details */}
          <div className="requests-detail-section">
            <h3>Project Details</h3>
            <div className="requests-detail-grid">
              <div className="requests-detail-item">
                <strong>Building Type:</strong>
                <span>
                  {project.buildingType
                    ? project.buildingType.charAt(0).toUpperCase() +
                      project.buildingType.slice(1)
                    : "N/A"}
                </span>
              </div>
              <div className="requests-detail-item">
                <strong>Total Area:</strong>
                <span>{project.totalArea} sq.m</span>
              </div>
              {project.estimatedBudget && (
                <div className="requests-detail-item">
                  <strong>Budget:</strong>
                  <span className="requests-budget-highlight">
                    ₹{project.estimatedBudget.toLocaleString("en-IN")}
                  </span>
                </div>
              )}
              {project.projectTimeline && (
                <div className="requests-detail-item">
                  <strong>Timeline:</strong>
                  <span>{project.projectTimeline} months</span>
                </div>
              )}
              <div className="requests-detail-item requests-detail-full">
                <strong>Address:</strong>
                <span>{project.projectAddress}</span>
              </div>
            </div>
          </div>

          {/* Floor Plans */}
          <div className="requests-detail-section">
            <h3>Floor Plans ({project.floors ? project.floors.length : 0})</h3>
            {project.floors && project.floors.length > 0 ? (
              project.floors.map((floor, idx) => (
                <div key={idx} className="requests-floor-box">
                  <div className="requests-detail-grid">
                    <h4 className="requests-floor-header">
                      Floor {floor.floorNumber}
                      <span className="requests-floor-badge">
                        {floor.floorType
                          ? floor.floorType.charAt(0).toUpperCase() +
                            floor.floorType.slice(1)
                          : "N/A"}
                      </span>
                    </h4>
                    <div className="requests-detail-item">
                      <strong>Area:</strong>
                      <span>{floor.floorArea} sq.m</span>
                    </div>
                    <div className="requests-detail-item">
                      <strong>Floor Type:</strong>
                      <span>
                        {floor.floorType
                          ? floor.floorType.charAt(0).toUpperCase() +
                            floor.floorType.slice(1)
                          : "N/A"}
                      </span>
                    </div>
                    <div className="requests-detail-item requests-detail-full">
                      <strong>Description:</strong>
                      <span>{floor.floorDescription || "None provided"}</span>
                    </div>
                    {floor.floorImage && (
                      <div className="requests-detail-item requests-detail-full">
                        <strong>Floor Plan:</strong>
                        <img
                          src={floor.floorImage}
                          alt={`Floor ${floor.floorNumber} Plan`}
                          className="requests-floor-plan-image"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="requests-no-floor-plans">
                No detailed floor plans were provided.
              </p>
            )}
          </div>

          {/* Additional Requirements */}
          <div className="requests-detail-section">
            <h3>Additional Requirements</h3>
            <div className="requests-detail-grid">
              {project.specialRequirements && (
                <div className="requests-detail-item requests-detail-full">
                  <strong>Special Requirements:</strong>
                  <span>{project.specialRequirements}</span>
                </div>
              )}
              {project.accessibilityNeeds && (
                <div className="requests-detail-item">
                  <strong>Accessibility Needs:</strong>
                  <span>
                    {project.accessibilityNeeds.charAt(0).toUpperCase() +
                      project.accessibilityNeeds.slice(1)}
                  </span>
                </div>
              )}
              {project.energyEfficiency && (
                <div className="requests-detail-item">
                  <strong>Energy Efficiency:</strong>
                  <span>
                    {project.energyEfficiency.charAt(0).toUpperCase() +
                      project.energyEfficiency.slice(1)}
                  </span>
                </div>
              )}
              {project.siteFilepaths &&
                project.siteFilepaths.length > 0 && (
                  <div className="requests-detail-item requests-detail-full">
                    <strong>Site Plans:</strong>
                    <div className="requests-file-links-container">
                      {project.siteFilepaths.map((path, idx) => (
                        <a
                          key={idx}
                          href={path}
                          className="requests-file-link"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <i className="fas fa-file-alt"></i>{" "}
                          {path.split("/").pop()}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="requests-modal-actions">
            {project.status === "proposal_sent" ? (
              <div className="requests-proposal-sent-status">
                ✓ Proposal already sent
              </div>
            ) : (
              <>
                <button
                  className="requests-modal-btn requests-modal-btn-accept"
                  onClick={() => onOpenProposal(project)}
                >
                  <i className="fas fa-file-signature"></i> Create Proposal
                </button>
                <button
                  className="requests-modal-btn requests-modal-btn-reject"
                  onClick={() => {
                    onClose();
                    onRejectProject(project._id);
                  }}
                >
                  <i className="fas fa-times"></i> Reject Project
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailsModal;
