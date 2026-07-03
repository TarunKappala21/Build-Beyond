import React, { useState, useEffect } from 'react';
import './InteriorDesignerJobs.css';
import JobListPanel from './sub-components/JobListPanel';
import JobDetailsPanel from './sub-components/JobDetailsPanel';

const InteriorDesignerJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [proposalData, setProposalData] = useState({ price: '', description: '' });
  const [proposalErrors, setProposalErrors] = useState({ price: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (searchTerm === '') {
      setFilteredJobs(jobs);
    } else {
      const filtered = jobs.filter(job => 
        job.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.projectDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.roomType?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredJobs(filtered);
    }
  }, [searchTerm, jobs]);

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/worker/jobs', {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }

      const data = await response.json();
      setUser(data.user);
      const jobList = data.jobs || [];
      setJobs(jobList);
      setFilteredJobs(jobList);
      
      if (selectedJob) {
        const stillExists = jobList.find(job => job._id === selectedJob._id);
        if (!stillExists) {
          setSelectedJob(jobList.length > 0 ? jobList[0] : null);
        }
      } else if (jobList.length > 0) {
        setSelectedJob(jobList[0]);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleJobSelect = (job) => {
    setSelectedJob(job);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const updateJobStatus = async (jobId, status) => {
    if (!confirm(`Are you sure you want to ${status.toLowerCase()} this job?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/jobs/${jobId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status, type: 'interior' })
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Job offer ${status.toLowerCase()} successfully.`);
        fetchJobs();
      } else {
        throw new Error(data.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred: ' + error.message);
    }
  };

  const handleCreateProposal = () => {
    setShowProposalModal(true);
  };

  const handleCloseProposalModal = () => {
    setShowProposalModal(false);
    setProposalData({ price: '', description: '' });
    setProposalErrors({ price: '', description: '' });
    setIsSubmitting(false);
  };

  const validatePrice = (value) => {
    const MIN_PRICE = 1000;
    const MAX_PRICE = 10000000;
    
    if (!value) {
      return 'Price is required';
    }
    
    const numValue = Number(value);
    
    if (isNaN(numValue) || numValue <= 0) {
      return 'Please enter a valid positive number';
    }
    
    if (numValue < MIN_PRICE) {
      return `Minimum price is ₹${MIN_PRICE.toLocaleString()}`;
    }
    
    if (numValue > MAX_PRICE) {
      return `Maximum price is ₹${MAX_PRICE.toLocaleString()}`;
    }
    
    // Check if resubmitting - new price must be lower than existing
    if (selectedJob && selectedJob.proposal && selectedJob.proposal.price) {
      const existingPrice = Number(selectedJob.proposal.price);
      if (numValue >= existingPrice) {
        return `New price must be lower than your current quote of ₹${existingPrice.toLocaleString()}`;
      }
    }
    
    return '';
  };

  const validateDescription = (value) => {
    const MIN_LENGTH = 100;
    const MAX_LENGTH = 2000;
    
    if (!value || value.trim().length === 0) {
      return 'Description is required';
    }
    
    const trimmedLength = value.trim().length;
    
    if (trimmedLength < MIN_LENGTH) {
      return `Description must be at least ${MIN_LENGTH} characters (${MIN_LENGTH - trimmedLength} more needed)`;
    }
    
    if (trimmedLength > MAX_LENGTH) {
      return `Description cannot exceed ${MAX_LENGTH} characters (${trimmedLength - MAX_LENGTH} over limit)`;
    }
    
    return '';
  };

  const handlePriceChange = (e) => {
    const value = e.target.value;
    setProposalData({...proposalData, price: value});
    
    if (value) {
      const error = validatePrice(value);
      setProposalErrors({...proposalErrors, price: error});
    } else {
      setProposalErrors({...proposalErrors, price: ''});
    }
  };

  const handleDescriptionChange = (e) => {
    const value = e.target.value;
    const MAX_LENGTH = 2000;
    
    if (value.length <= MAX_LENGTH) {
      setProposalData({...proposalData, description: value});
      
      if (value) {
        const error = validateDescription(value);
        setProposalErrors({...proposalErrors, description: error});
      } else {
        setProposalErrors({...proposalErrors, description: ''});
      }
    }
  };

  const handleProposalSubmit = async (e) => {
    e.preventDefault();
    
    const priceError = validatePrice(proposalData.price);
    const descriptionError = validateDescription(proposalData.description);
    
    setProposalErrors({
      price: priceError,
      description: descriptionError
    });
    
    if (priceError || descriptionError) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/worker/submit-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          projectId: selectedJob._id,
          projectType: 'interior',
          price: Number(proposalData.price),
          description: proposalData.description.trim()
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const isUpdate = selectedJob.proposal && selectedJob.proposal.sentAt;
        alert(isUpdate ? 'Proposal updated successfully with lower price!' : 'Proposal submitted successfully!');
        handleCloseProposalModal();
        fetchJobs();
      } else {
        if (data.alreadySubmitted || data.currentPrice) {
          alert(data.error || 'Please ensure your new price is lower than the current quote.');
        } else {
          throw new Error(data.error || 'Failed to submit proposal');
        }
      }
    } catch (error) {
      console.error('Error submitting proposal:', error);
      alert('An error occurred: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="wkidj-container">
        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading jobs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wkidj-container">
        <div style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>Error: {error}</div>
      </div>
    );
  }

  return (
    <main className="wkidj-container">
      <div className="wkidj-job-dashboard">
        <JobListPanel 
          searchTerm={searchTerm}
          onSearchChange={handleSearch}
          jobs={filteredJobs}
          selectedJob={selectedJob}
          onJobSelect={handleJobSelect}
        />
        <JobDetailsPanel 
          selectedJob={selectedJob}
          onAccept={() => updateJobStatus(selectedJob._id, 'Accepted')}
          onReject={() => updateJobStatus(selectedJob._id, 'Rejected')}
          onCreateProposal={handleCreateProposal}
          formatDate={formatDate}
        />
      </div>
      
      {/* Proposal Modal */}
      {showProposalModal && (
        <div className="wkidj-modal" onClick={handleCloseProposalModal}>
          <div className="wkidj-modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="wkidj-close-modal" onClick={handleCloseProposalModal}>&times;</span>
            <div className="wkidj-modal-header">
              <h2>{selectedJob.proposal && selectedJob.proposal.sentAt ? 'Update Proposal (Lower Price Only)' : 'Create Proposal'}</h2>
              {selectedJob.proposal && selectedJob.proposal.sentAt && (
                <p className="wkidj-update-notice">
                  <i className="fas fa-info-circle"></i> Current quote: ₹{selectedJob.proposal.price?.toLocaleString()} - You can only submit a lower price
                </p>
              )}
            </div>
            <div className="wkidj-modal-body">
              <form onSubmit={handleProposalSubmit}>
                <div className={`wkidj-form-group ${proposalErrors.price ? 'wkidj-error' : proposalData.price && !proposalErrors.price ? 'wkidj-success' : ''}`}>
                  <label htmlFor="proposalPrice">
                    Project Price (₹) <span className="wkidj-required">*</span>
                  </label>
                  <input 
                    type="number" 
                    id="proposalPrice" 
                    value={proposalData.price}
                    onChange={handlePriceChange}
                    placeholder={selectedJob.proposal && selectedJob.proposal.price ? `Current: ₹${selectedJob.proposal.price.toLocaleString()} - Enter lower amount` : "e.g., 50000"}
                    min="1000"
                    max={selectedJob.proposal && selectedJob.proposal.price ? selectedJob.proposal.price - 1 : 10000000}
                    step="1"
                    disabled={isSubmitting}
                    className={proposalErrors.price ? 'wkidj-input-error' : proposalData.price && !proposalErrors.price ? 'wkidj-input-success' : ''}
                  />
                  {proposalErrors.price && (
                    <span className="wkidj-error-message">
                      <i className="fas fa-exclamation-circle"></i> {proposalErrors.price}
                    </span>
                  )}
                  {proposalData.price && !proposalErrors.price && (
                    <span className="wkidj-success-message">
                      <i className="fas fa-check-circle"></i> Valid price
                    </span>
                  )}
                  <span className="wkidj-help-text">Range: ₹1,000 - ₹1,00,00,000</span>
                </div>
                <div className={`wkidj-form-group ${proposalErrors.description ? 'wkidj-error' : proposalData.description && !proposalErrors.description ? 'wkidj-success' : ''}`}>
                  <label htmlFor="proposalDescription">
                    Description of Services <span className="wkidj-required">*</span>
                  </label>
                  <div className="wkidj-char-counter">
                    <span className={proposalData.description.trim().length < 100 ? 'wkidj-counter-warning' : proposalData.description.trim().length > 1900 ? 'wkidj-counter-danger' : 'wkidj-counter-success'}>
                      {proposalData.description.trim().length} / 2000 characters
                    </span>
                  </div>
                  <textarea 
                    id="proposalDescription" 
                    rows="8"
                    value={proposalData.description}
                    onChange={handleDescriptionChange}
                    placeholder="Describe your services in detail. Include what you'll deliver, timeline, materials, revisions, etc. (Minimum 100 characters)

Example: I will provide complete interior design services for your living room including 3D visualization, material selection, furniture sourcing, and project management. The design will feature modern aesthetics with custom lighting solutions. Deliverables include detailed drawings, material boards, and 2 rounds of revisions. Estimated completion: 6 weeks."
                    disabled={isSubmitting}
                    className={proposalErrors.description ? 'wkidj-input-error' : proposalData.description && !proposalErrors.description ? 'wkidj-input-success' : ''}
                    style={{ minHeight: '250px' }}
                  />
                  {proposalErrors.description && (
                    <span className="wkidj-error-message">
                      <i className="fas fa-exclamation-circle"></i> {proposalErrors.description}
                    </span>
                  )}
                  {proposalData.description && !proposalErrors.description && (
                    <span className="wkidj-success-message">
                      <i className="fas fa-check-circle"></i> Excellent description
                    </span>
                  )}
                  <span className="wkidj-help-text">Minimum 100 characters. Be specific and professional.</span>
                </div>
                <button 
                  type="submit" 
                  className="wkidj-job-action-button wkidj-accept-button"
                  disabled={isSubmitting || proposalErrors.price || proposalErrors.description || !proposalData.price || !proposalData.description}
                >
                  {isSubmitting ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> {selectedJob.proposal && selectedJob.proposal.sentAt ? 'Updating...' : 'Submitting...'}
                    </>
                  ) : (
                    <>
                      <i className="fas fa-file-signature"></i> {selectedJob.proposal && selectedJob.proposal.sentAt ? 'Update Proposal' : 'Submit Proposal'}
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default InteriorDesignerJobs;
