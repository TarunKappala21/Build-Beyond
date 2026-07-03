import React from "react";
import { Link } from "react-router-dom";

const ProjectsList = ({ projects }) => {
  return (
    <>
      <div className="cdb-section-header">
        <h2 className="cdb-section-title">New Projects</h2>
        <div className="cdb-view-all">
          <Link to="/project_requests">View All</Link>
        </div>
      </div>
      <div className="cdb-cards-container">
        {projects.length === 0 ? (
          <p>No new project requests.</p>
        ) : (
          projects.map((project) => (
            <div key={project._id} className="cdb-bid-card">
              <h3>{project.projectName}</h3>
              <div className="cdb-bid-info">
                <p><span>Client:</span><span>{project.customerName}</span></p>
                <p><span>Location:</span><span>{project.projectAddress}</span></p>
                <p><span>Budget:</span><span>₹{project.estimatedBudget?.toLocaleString("en-IN") || "TBD"}</span></p>
                <p><span>Timeline:</span><span>{project.projectTimeline ? `${project.projectTimeline} months` : "TBD"}</span></p>
                <p><span>Due Date:</span><span>{new Date(project.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span></p>
              </div>
              <div className="cdb-bid-actions" style={{ display: "none" }}>
                <button className="cdb-btn cdb-btn-primary">View Details</button>
                <button className="cdb-btn cdb-btn-secondary">Decline</button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
};

export default ProjectsList;