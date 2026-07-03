import React from "react";
import { Link } from "react-router-dom";

const TimelineProjects = ({ projects, calcProgress, calcDays }) => {
  return (
    <>
      <div className="cdb-section-header" style={{ marginTop: "2rem" }}>
        <h2 className="cdb-section-title">Project Timeline</h2>
        <div className="cdb-view-all">
          <Link to="/companyongoing_projects">View All Projects</Link>
        </div>
      </div>
      <div className="cdb-timeline-container">
        {projects.length === 0 ? (
          <p>No ongoing projects.</p>
        ) : (
          projects.map((project) => {
            const progress = calcProgress(project.createdAt, project.projectTimeline);
            const daysLeft = calcDays(project.createdAt, project.projectTimeline);
            const isDelayed = progress < 50;
            const endDate = project.projectTimeline
              ? new Date(new Date(project.createdAt).setMonth(new Date(project.createdAt).getMonth() + project.projectTimeline))
                  .toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
              : "TBD";
            return (
              <div key={project._id} className="cdb-timeline-project">
                <div className="cdb-project-info">
                  <h3>{project.projectName}</h3>
                  <div className="cdb-project-details">
                    <p>Client: <span>{project.customerName}</span></p>
                    <p>Start: <span>{new Date(project.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span></p>
                    <p>End: <span>{endDate}</span></p>
                  </div>
                  <div className="cdb-progress-container">
                    <div className="cdb-progress-bar" style={{ "--progress": progress }}></div>
                  </div>
                  <div className="cdb-progress-info">
                    <span>Progress: {progress}%</span>
                    <span>{daysLeft} days remaining</span>
                  </div>
                </div>
                <div className={`cdb-project-status ${isDelayed ? "status-delayed" : ""}`}>
                  {isDelayed ? "Delayed" : "On Track"}
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
};

export default TimelineProjects;