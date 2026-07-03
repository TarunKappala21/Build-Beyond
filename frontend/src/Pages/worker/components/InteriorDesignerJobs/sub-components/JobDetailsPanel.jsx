import React from 'react';

const JobDetailsPanel = ({ selectedJob, onReject, onCreateProposal, formatDate }) => {
  if (!selectedJob) {
    return (
      <section className="wkidj-job-details-panel">
        <div className="wkidj-empty-state">
          <i className="fas fa-clipboard-list wkidj-empty-icon"></i>
          <h2>No Job Selected</h2>
          <p>Click on a job offer from the list to view its details</p>
        </div>
      </section>
    );
  }

  const roomSize = selectedJob.roomSize
    ? `${selectedJob.roomSize.length || 'N/A'} x ${selectedJob.roomSize.width || 'N/A'} ${selectedJob.roomSize.unit || ''}`
    : 'Not specified';

  const ceilingHeight = selectedJob.ceilingHeight
    ? `${selectedJob.ceilingHeight.height || 'N/A'} ${selectedJob.ceilingHeight.unit || ''}`
    : 'Not specified';

  return (
    <section className="wkidj-job-details-panel">
      <div className="wkidj-job-details-content">
        <div className="wkidj-details-header">
          <div className="wkidj-details-header-left">
            <h2>{selectedJob.projectName || 'Interior Project'}</h2>
            <span className="wkidj-job-type wkidj-interior">
              {selectedJob.roomType || 'Interior'}
            </span>
            <p className="wkidj-job-budget">
              Preference: {selectedJob.designPreference || 'Not specified'}
            </p>
          </div>
          <div className="wkidj-details-header-right">
            <p className="wkidj-detail-label">Submitted On</p>
            <p className="wkidj-detail-value">
              {selectedJob.createdAt ? formatDate(selectedJob.createdAt) : 'Not specified'}
            </p>
          </div>
        </div>

        <div className="wkidj-details-section">
          <h3><i className="fas fa-user"></i> Customer Details</h3>
          <div className="wkidj-details-grid">
            <div className="wkidj-detail-item">
              <p className="wkidj-detail-label">Name</p>
              <p className="wkidj-detail-value">{selectedJob.fullName || 'N/A'}</p>
            </div>
            <div className="wkidj-detail-item">
              <p className="wkidj-detail-label">Contact</p>
              <p className="wkidj-detail-value">{selectedJob.phone || 'N/A'}</p>
            </div>
            <div className="wkidj-detail-item">
              <p className="wkidj-detail-label">Email</p>
              <p className="wkidj-detail-value">{selectedJob.email || 'N/A'}</p>
            </div>
            <div className="wkidj-detail-item">
              <p className="wkidj-detail-label">Address</p>
              <p className="wkidj-detail-value">{selectedJob.address || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="wkidj-details-section">
          <h3><i className="fas fa-ruler-combined"></i> Project Details</h3>
          <div className="wkidj-details-grid">
            <div className="wkidj-detail-item">
              <p className="wkidj-detail-label">Room Type</p>
              <p className="wkidj-detail-value">{selectedJob.roomType || 'N/A'}</p>
            </div>
            <div className="wkidj-detail-item">
              <p className="wkidj-detail-label">Room Size</p>
              <p className="wkidj-detail-value">{roomSize}</p>
            </div>
            <div className="wkidj-detail-item">
              <p className="wkidj-detail-label">Ceiling Height</p>
              <p className="wkidj-detail-value">{ceilingHeight}</p>
            </div>
          </div>
          <div className="wkidj-special-features">
            <p className="wkidj-detail-label">Project Description</p>
            <p className="wkidj-detail-value">
              {selectedJob.projectDescription || 'No description provided'}
            </p>
          </div>
        </div>

        {selectedJob.currentRoomImages?.length > 0 && (
          <div className="wkidj-details-section">
            <h3><i className="fas fa-home"></i> Current Room Images</h3>
            <div className="wkidj-reference-images">
              {selectedJob.currentRoomImages.map((image, index) => (
                <div
                  key={index}
                  className="wkidj-reference-image"
                  style={{ backgroundImage: `url('${image}')` }}
                ></div>
              ))}
            </div>
          </div>
        )}

        {selectedJob.inspirationImages?.length > 0 && (
          <div className="wkidj-details-section">
            <h3><i className="fas fa-lightbulb"></i> Inspiration Images</h3>
            <div className="wkidj-reference-images">
              {selectedJob.inspirationImages.map((image, index) => (
                <div
                  key={index}
                  className="wkidj-reference-image"
                  style={{ backgroundImage: `url('${image}')` }}
                ></div>
              ))}
            </div>
          </div>
        )}

        <div className="wkidj-job-action-buttons">
          {selectedJob.status === 'pending' ? (
            <>
              <button
                className="wkidj-job-action-button wkidj-accept-button"
                onClick={onCreateProposal}
              >
                <i className="fas fa-file-signature"></i> Create Proposal
              </button>
              <button
                className="wkidj-job-action-button wkidj-deny-button"
                onClick={onReject}
              >
                <i className="fas fa-times"></i> Deny Job
              </button>
            </>
          ) : selectedJob.status === 'Proposal Sent' || selectedJob.status === 'proposal_sent' ? (
            <>
              <div className="wkidj-proposal-submitted-info">
                <div className="wkidj-proposal-header">
                  <i className="fas fa-check-circle"></i>
                  <h3>Proposal Submitted</h3>
                </div>
                {selectedJob.proposal && (
                  <div className="wkidj-proposal-details">
                    <div className="wkidj-proposal-detail-item">
                      <span className="wkidj-proposal-label">Quoted Price:</span>
                      <span className="wkidj-proposal-value">₹{selectedJob.proposal.price?.toLocaleString()}</span>
                    </div>
                    <div className="wkidj-proposal-detail-item">
                      <span className="wkidj-proposal-label">Description:</span>
                      <p className="wkidj-proposal-description">{selectedJob.proposal.description}</p>
                    </div>
                    <div className="wkidj-proposal-detail-item">
                      <span className="wkidj-proposal-label">Submitted:</span>
                      <span className="wkidj-proposal-value">
                        {selectedJob.proposal.sentAt ? formatDate(selectedJob.proposal.sentAt) : 'N/A'}
                      </span>
                    </div>
                  </div>
                )}
                <p className="wkidj-proposal-status-text">
                  <i className="fas fa-hourglass-half"></i> Waiting for customer response
                </p>
              </div>
              <button
                className="wkidj-job-action-button wkidj-update-button"
                onClick={onCreateProposal}
                style={{ marginTop: '1rem' }}
              >
                <i className="fas fa-edit"></i> Update Proposal (Lower Price)
              </button>
            </>
          ) : (
            <button
              className="wkidj-job-action-button"
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
