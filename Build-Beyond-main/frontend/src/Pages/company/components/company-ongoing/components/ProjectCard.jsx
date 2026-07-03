// src/pages/company/components/company-ongoing/components/ProjectCard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const getPhaseLabel = (project) => {
  const phases = project?.proposal?.phases;
  if (!Array.isArray(phases) || phases.length === 0) {
    return project.currentPhase || "Not specified";
  }
  const progress = project.completionPercentage || 0;
  const index = Math.min(
    Math.max(Math.ceil(progress / 25) - 1, 0),
    phases.length - 1,
  );
  return phases[index]?.name || project.currentPhase || "Not specified";
};

const ProjectCard = ({
  project,
  unviewedComplaints,
  expandedDetails,
  toggleDetails,
  toggleUpdates,
  handleOpenComplaint,
  formatDate,
  onChatClick,
}) => {
  const navigate = useNavigate();

  return (
    <div className="ongoing-project-display" id={`project-card-${project._id}`}>
      {/* IMAGE */}
      <div className="ongoing-project-image">
        <img
          src={
            project.mainImagePath ||
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANdGcSqjSRsiV4Q22mOElSnkcct2oZmd-1iVrNOcQ&s"
          }
          alt={project.projectName}
        />
      </div>

      {/* DETAILS */}
      <div className="ongoing-project-details">
        {/* New Notification Box */}
        {unviewedComplaints[project._id] && (
          <div className="ongoing-notification-box">
            <span className="ongoing-notification-icon">🔔</span>
            <span>
              New notification from customer - Check milestone updates
            </span>
          </div>
        )}
        <h2>{project.projectName}</h2>

        <div className="ongoing-location">
          <svg
            className="ongoing-location-icon"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          {project.projectAddress}
        </div>

        <div className="ongoing-tags-container">
          <span className="ongoing-project-tag">
            {project.buildingType
              ? project.buildingType.charAt(0).toUpperCase() +
                project.buildingType.slice(1)
              : "Other"}
          </span>
          <span className="ongoing-status-tag">Under Construction</span>
          {project.blockedByPlatformFee && (
            <span
              className="ongoing-status-tag"
              style={{ backgroundColor: "#b91c1c" }}
            >
              Platform Fee Pending
            </span>
          )}
        </div>

        {/* PROGRESS BAR */}
        <div className="ongoing-progress-container">
          <div className="ongoing-progress-bar">
            <div
              className="ongoing-progress-fill"
              style={{ width: `${project.completionPercentage || 0}%` }}
            ></div>
          </div>
          <div className="ongoing-progress-text">
            <span>
              Project Completion:{" "}
              <span className="ongoing-progress-percentage">
                {project.completionPercentage || 0}%
              </span>
            </span>
            {project.targetCompletionDate && (
              <span>Target: {formatDate(project.targetCompletionDate)}</span>
            )}
          </div>
        </div>

        <p>
          Current phase: <span>{getPhaseLabel(project)}</span>
        </p>
        {project.blockedByPlatformFee && (
          <p style={{ color: "#b91c1c", fontWeight: 600, marginTop: "-6px" }}>
            Next phase is locked until the previous phase platform fee is
            collected.
          </p>
        )}

        {/* ACTION BUTTONS */}
        <div className="ongoing-action-buttons">
          <button
            className="ongoing-view-details-btn"
            onClick={() => toggleDetails(project._id)}
          >
            {expandedDetails[project._id] ? "Hide Details" : "View Details"}
          </button>
          <button
            className="ongoing-project-updates-btn"
            onClick={() => toggleUpdates(project._id)}
          >
            Progress & Updates
          </button>
          <button
            className="ongoing-edit-btn"
            onClick={() =>
              navigate(`../addnewproject?projectId=${project._id}`)
            }
          >
            Edit Project
          </button>
          <button
            className="ongoing-edit-btn ongoing-report-btn"
            onClick={() => handleOpenComplaint(project._id, "general")}
          >
            🚩 Report to Admin
          </button>
          {onChatClick && (
            <button
              className="ongoing-edit-btn ongoing-chat-btn"
              onClick={() => onChatClick(project)}
            >
              💬 Message
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
