import React from 'react';

const JobDetailsPanel = ({ selectedJob, onAccept, onReject, onCreateProposal, formatDate }) => {
  if (!selectedJob) {
    return (
      <section className="wkj-job-details-panel">
        <div className="wkj-empty-state">
          <i className="fas fa-clipboard-list wkj-empty-icon"></i>
          <h2>No Job Selected</h2>
          <p>Click on a job offer from the list to view its details</p>
        </div>
      </section>
    );
  }

  return (
    <section className="wkj-job-details-panel">
      <div className="wkj-job-details-content">
        <div className="wkj-details-header">
          <div className="wkj-details-header-left">
            <h2>{selectedJob.projectName}</h2>
            <span className={`wkj-job-type ${selectedJob.designRequirements?.designType?.toLowerCase() || 'other'}`}>
              {selectedJob.designRequirements?.designType?.toLowerCase() || 'other'}
            </span>
            <p className="wkj-job-budget">₹{selectedJob.additionalDetails?.budget}</p>
          </div>
          <div className="wkj-details-header-right">
            <p className="wkj-detail-label">Preferred Completion</p>
            <p className="wkj-detail-value">
              {selectedJob.additionalDetails?.completionDate 
                ? formatDate(selectedJob.additionalDetails.completionDate)
                : 'Not specified'}
            </p>
          </div>
        </div>

        <div className="wkj-details-section">
          <h3><i className="fas fa-user"></i> Customer Details</h3>
          <div className="wkj-details-grid">
            <div className="wkj-detail-item">
              <p className="wkj-detail-label">Name</p>
              <p className="wkj-detail-value">{selectedJob.customerDetails?.fullName || 'N/A'}</p>
            </div>
            <div className="wkj-detail-item">
              <p className="wkj-detail-label">Contact</p>
              <p className="wkj-detail-value">{selectedJob.customerDetails?.contactNumber || 'N/A'}</p>
            </div>
            <div className="wkj-detail-item">
              <p className="wkj-detail-label">Email</p>
              <p className="wkj-detail-value">{selectedJob.customerDetails?.email || 'N/A'}</p>
            </div>
            <div className="wkj-detail-item">
              <p className="wkj-detail-label">Address</p>
              <p className="wkj-detail-value">
                {selectedJob.customerAddress ? (
                  <>
                    {selectedJob.customerAddress.streetAddress}, 
                    {selectedJob.customerAddress.city}, 
                    {selectedJob.customerAddress.state} 
                    {selectedJob.customerAddress.zipCode}
                  </>
                ) : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="wkj-details-section">
          <h3><i className="fas fa-map-marker-alt"></i> Plot Information</h3>
          <div className="wkj-details-grid">
            <div className="wkj-detail-item">
              <p className="wkj-detail-label">Location</p>
              <p className="wkj-detail-value">{selectedJob.plotInformation?.plotLocation || 'N/A'}</p>
            </div>
            <div className="wkj-detail-item">
              <p className="wkj-detail-label">Size</p>
              <p className="wkj-detail-value">{selectedJob.plotInformation?.plotSize || 'N/A'}</p>
            </div>
            <div className="wkj-detail-item">
              <p className="wkj-detail-label">Orientation</p>
              <p className="wkj-detail-value">{selectedJob.plotInformation?.plotOrientation || 'N/A'}</p>
            </div>
            <div className="wkj-detail-item">
              <p className="wkj-detail-label">Floors</p>
              <p className="wkj-detail-value">{selectedJob.designRequirements?.numFloors || 'N/A'}</p>
            </div>
            <div className="wkj-detail-item">
              <p className="wkj-detail-label">Room Requirements</p>
              <p className="wkj-detail-value">
                {selectedJob.designRequirements?.floorRequirements?.length > 0 
                  ? selectedJob.designRequirements.floorRequirements.map((floor, i) => (
                      <span key={i}>
                        Floor {floor.floorNumber}: {floor.details}
                        {i < selectedJob.designRequirements.floorRequirements.length - 1 ? ', ' : ''}
                      </span>
                    ))
                  : 'No specific requirements provided'}
              </p>
            </div>
            <div className="wkj-detail-item">
              <p className="wkj-detail-label">Preferred Style</p>
              <p className="wkj-detail-value">{selectedJob.designRequirements?.architecturalStyle || 'N/A'}</p>
            </div>
          </div>
          <div className="wkj-special-features">
            <p className="wkj-detail-label">Special Features</p>
            <p className="wkj-detail-value">
              {selectedJob.designRequirements?.specialFeatures || 'None specified'}
            </p>
          </div>
        </div>

        {selectedJob.additionalDetails?.referenceImages?.length > 0 && (
          <div className="wkj-details-section">
            <h3><i className="fas fa-images"></i> Reference Images</h3>
            <div className="wkj-reference-images">
              {selectedJob.additionalDetails.referenceImages.map((image, index) => (
                <div 
                  key={index}
                  className="wkj-reference-image" 
                  style={{ backgroundImage: `url('${image.url}')` }}
                ></div>
              ))}
            </div>
          </div>
        )}

        <div className="wkj-job-action-buttons">
          {selectedJob.status === 'Pending' ? (
            <>
              <button 
                className="wkj-job-action-button wkj-accept-button" 
                onClick={onCreateProposal}
              >
                <i className="fas fa-file-signature"></i> Create Proposal
              </button>
              <button 
                className="wkj-job-action-button wkj-deny-button" 
                onClick={onReject}
              >
                <i className="fas fa-times"></i> Deny Job
              </button>
            </>
          ) : selectedJob.status === 'Proposal Sent' || selectedJob.status === 'proposal_sent' ? (
            <button 
              className="wkj-job-action-button" 
              disabled
              style={{ backgroundColor: '#7f8c8d', cursor: 'not-allowed' }}
            >
              <i className="fas fa-check"></i> Proposal Submitted
            </button>
          ) : (
            <button 
              className="wkj-job-action-button" 
              disabled
              style={{ backgroundColor: '#95a5a6', cursor: 'not-allowed' }}
            >
              <i className="fas fa-info-circle"></i> {selectedJob.status}
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default JobDetailsPanel;
