import React from 'react';

const JobListPanel = ({ searchTerm, onSearchChange, jobs, selectedJob, onJobSelect }) => {
  return (
    <section className="wkj-job-list-panel">
      <div className="wkj-search-container">
        <input 
          type="text" 
          id="searchInput" 
          placeholder="Search job offers..."
          value={searchTerm}
          onChange={onSearchChange}
        />
        <i className="fas fa-search wkj-search-icon"></i>
      </div>
      <div className="wkj-jobs-container">
        {jobs.length > 0 ? (
          jobs.map((job) => (
            <div 
              key={job._id} 
              className={`wkj-job-card ${selectedJob?._id === job._id ? 'active' : ''}`}
              onClick={() => onJobSelect(job)}
            >
              <span className={`wkj-job-type ${job.designRequirements?.designType?.toLowerCase() || 'other'}`}>
                {job.designRequirements?.designType?.toLowerCase() || 'other'}
              </span>
              <h3 className="wkj-job-title">{job.projectName}</h3>
              <p className="wkj-job-budget">₹{job.additionalDetails?.budget}</p>
              <p className="wkj-job-summary">
                {job.designRequirements?.specialFeatures 
                  ? (job.designRequirements.specialFeatures.length > 100 
                    ? job.designRequirements.specialFeatures.substring(0, 100) + '...'
                    : job.designRequirements.specialFeatures)
                  : 'No details provided'}
              </p>
            </div>
          ))
        ) : (
          <div className="wkj-no-jobs">
            <p>No job offers available at the moment.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default JobListPanel;
