import React from 'react';
import './CompanyDetailsModal.css';

const CompanyDetailsModal = ({ company, onClose, onApplyNow }) => {
  if (!company) return null;

  return (
    <div className="wkjc-modal" onClick={onClose}>
      <div className="wkjc-modal-content" onClick={(e) => e.stopPropagation()}>
        <span className="wkjc-close-modal" onClick={onClose}>×</span>
        <div className="wkjc-modal-header">
          <h2>{company.companyName}</h2>
        </div>
        <div className="wkjc-modal-body">
          <div className="wkjc-company-details">
            {company.companyLogo && (
              <img 
                src={company.companyLogo} 
                alt="Company Logo" 
                className="wkjc-company-logo" 
              />
            )}
            <div className="wkjc-company-info">
              <div className="wkjc-detail-row">
                <div className="wkjc-detail-label">Location:</div>
                <div className="wkjc-detail-value">{company.location?.city}, {company.location?.state}</div>
              </div>
              <div className="wkjc-detail-row">
                <div className="wkjc-detail-label">Company Size:</div>
                <div className="wkjc-detail-value">{company.size}</div>
              </div>
              <div className="wkjc-detail-row">
                <div className="wkjc-detail-label">Founded:</div>
                <div className="wkjc-detail-value">{company.yearsInBusiness} years in business</div>
              </div>
              <div className="wkjc-detail-row">
                <div className="wkjc-detail-label">Specializations:</div>
                <div className="wkjc-detail-value">{company.specialization?.join(', ')}</div>
              </div>
              <div className="wkjc-detail-row">
                <div className="wkjc-detail-label">Current Openings:</div>
                <div className="wkjc-detail-value">{company.currentOpenings?.join(', ')}</div>
              </div>
            </div>
          </div>

          <div className="wkjc-company-description">
            <h3>About the Company</h3>
            <p>{company.aboutCompany || 'No description available'}</p>
          </div>

          {company.whyJoinUs && (
            <div className="wkjc-company-benefits">
              <h3>Why Join Our Team?</h3>
              <ul>
                {company.whyJoinUs.split(',').map((benefit, index) => (
                  <li key={index}>{benefit.trim()}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="wkjc-modal-footer">
          <button 
            className="wkjc-btn wkjc-btn-primary wkjc-btn-large" 
            onClick={() => onApplyNow(company)}
          >
            Apply Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompanyDetailsModal;
