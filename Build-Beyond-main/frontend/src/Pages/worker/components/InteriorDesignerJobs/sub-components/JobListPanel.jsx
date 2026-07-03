import React from 'react';

const JobListPanel = ({ searchTerm, onSearchChange, jobs, selectedJob, onJobSelect }) => {
  return (
    <section className="wkidj-job-list-panel">
      <div className="wkidj-search-container">
        <input 
          type="text" 
          id="searchInput" 
          placeholder="Search job offers..."
          value={searchTerm}
          onChange={onSearchChange}
        />
        <i className="fas fa-search wkidj-search-icon"></i>
      </div>
      <div className="wkidj-jobs-container">
        {jobs.length > 0 ? (
          jobs.map((job) => (
            <div 
              key={job._id} 
              className={`wkidj-job-card ${selectedJob?._id === job._id ? 'active' : ''}`}
              onClick={() => onJobSelect(job)}
            >
              <span className="wkidj-job-type wkidj-interior">
                {job.roomType || 'Interior'}
              </span>
              <h3 className="wkidj-job-title">{job.projectName || 'Untitled Project'}</h3>
              <p className="wkidj-job-budget">{job.budget || 'Budget not specified'}</p>
              <p className="wkidj-job-summary">
                {job.projectDescription 
                  ? (job.projectDescription.length > 100 
                    ? job.projectDescription.substring(0, 100) + '...'
                    : job.projectDescription)
                  : 'No description provided'}
              </p>
            </div>
          ))
        ) : (
          <div className="wkidj-no-jobs">
            <p>No job offers available at the moment.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default JobListPanel;
