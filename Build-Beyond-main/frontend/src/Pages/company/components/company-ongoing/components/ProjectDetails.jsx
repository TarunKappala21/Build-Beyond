// src/pages/company/components/company-ongoing/components/ProjectDetails.jsx
import React from 'react';

const ProjectDetails = ({ project, expandedDetails }) => {
  if (!expandedDetails[project._id]) return null;

  const phases = project?.proposal?.phases || [];

  return (
    <div className="ongoing-view-details ongoing-active">
      <h3>Project Submission Details</h3>

      <div className="ongoing-section">
        <h4>Customer Information</h4>
        <div className="ongoing-details-grid">
          <p><strong>Full Name:</strong> {project.customerName}</p>
          <p><strong>Email Address:</strong> {project.customerEmail}</p>
          <p><strong>Phone Number:</strong> {project.customerPhone}</p>
        </div>
      </div>

      <div className="ongoing-section">
        <h4>Project Details</h4>
        <div className="ongoing-details-grid">
          <p><strong>Project Address:</strong> {project.projectAddress}</p>
          <p><strong>Project Location:</strong> {project.projectLocation}</p>
          <p><strong>Total Building Area:</strong> {project.totalArea} sq meters</p>
          <p>
            <strong>Building Type:</strong>{" "}
            {project.buildingType ? project.buildingType.charAt(0).toUpperCase() + project.buildingType.slice(1) : "Other"}
          </p>
          <p>
            <strong>Estimated Budget:</strong>{" "}
            {project.estimatedBudget ? `$${project.estimatedBudget.toLocaleString()}` : "None specified"}
          </p>
          <p>
            <strong>Expected Timeline:</strong>{" "}
            {project.projectTimeline ? `${project.projectTimeline} months` : "None specified"}
          </p>
        </div>
      </div>

      <div className="ongoing-section">
        <h4>Floor Plans</h4>
        <p><strong>Total Floors:</strong> {project.totalFloors}</p>
        {project.floors && project.floors.length > 0 ? (
          project.floors.map((floor, idx) => (
            <div key={idx} className="ongoing-floor-plan">
              <p><strong>Floor {floor.floorNumber || "Unknown"}</strong></p>
              <p>
                <strong>Floor Type:</strong>{" "}
                {floor.floorType ? floor.floorType.charAt(0).toUpperCase() + floor.floorType.slice(1) : "Other"}
              </p>
              <p><strong>Floor Area:</strong> {floor.floorArea || "None specified"} sq meters</p>
              <p><strong>Floor Description:</strong> {floor.floorDescription || "None specified"}</p>
              {floor.floorImage ? (
                <img src={floor.floorImage} alt={`Floor ${floor.floorNumber} Plan`} />
              ) : (
                <img src="/images/floor-default.jpg" alt="Default Floor Plan" />
              )}
            </div>
          ))
        ) : (
          <div className="ongoing-floor-plan">
            <p><strong>Floor plans not yet available</strong></p>
          </div>
        )}
      </div>

      <div className="ongoing-section">
        <h4>Additional Requirements</h4>
        <div className="ongoing-details-grid">
          <p><strong>Special Requirements:</strong> {project.specialRequirements || "None specified"}</p>
          <p>
            <strong>Accessibility Needs:</strong>{" "}
            {project.accessibilityNeeds ? project.accessibilityNeeds.charAt(0).toUpperCase() + project.accessibilityNeeds.slice(1) : "None specified"}
          </p>
          <p>
            <strong>Energy Efficiency Goals:</strong>{" "}
            {project.energyEfficiency ? project.energyEfficiency.charAt(0).toUpperCase() + project.energyEfficiency.slice(1) : "Standard"}
          </p>
        </div>
      </div>

      {phases.length > 0 && (
        <div className="ongoing-section">
          <h4>Company Proposed Details (Phases) - 5 Phase System</h4>
          {phases.map((phase, idx) => {
            const isFinal = phase.isFinal === true;
            return (
              <div key={idx} className="ongoing-floor-plan" style={{ borderLeft: isFinal ? "4px solid #d32f2f" : "4px solid #1a73e8" }}>
                <p><strong>{isFinal ? "🎯 " : ""}{phase.name || `Phase ${idx + 1}`}</strong></p>
                <p><strong>Percentage of Total:</strong> {phase.percentage || 25}%</p>
                {!isFinal && <p><strong>Required Months:</strong> {phase.requiredMonths || "N/A"}</p>}
                <p><strong>Phase Amount:</strong> <span style={{ fontWeight: "bold", color: "#d32f2f" }}>₹{phase.amount ? Number(phase.amount).toLocaleString('en-IN') : "0"}</span></p>

                {/* Work Items Breakdown */}
                {phase.subdivisions && phase.subdivisions.length > 0 && (
                  <div style={{ marginTop: "10px" }}>
                    <p style={{ fontSize: "13px", fontWeight: "bold", color: "#333", marginBottom: "8px" }}>Work Items:</p>
                    <div className="ongoing-details-grid">
                      {phase.subdivisions.map((sub, sIdx) => (
                        <p key={sIdx} style={{ fontSize: "12px", marginBottom: "5px" }}>
                          <strong>{sub.category || "Work Item"}:</strong> {sub.description || ""} {sub.amount ? `- ₹${Number(sub.amount).toLocaleString('en-IN')}` : ""}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
