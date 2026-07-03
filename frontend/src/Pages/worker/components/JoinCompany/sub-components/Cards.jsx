import React from 'react';
import './Cards.css';

// Company Card Component
export const CompanyCard = ({ company, onViewDetails, onApplyNow }) => {
  return (
    <div className="wkjc-card">
      <h3>{company.companyName}</h3>
      <p><strong>Location:</strong> {company.location?.city}</p>
      <p><strong>Company Size:</strong> {company.size}</p>
      <p><strong>Project types:</strong> {company.specialization?.join(', ')}</p>
      <p><strong>Looking for:</strong> {company.currentOpenings?.join(', ')}</p>
      <div className="wkjc-card-footer">
        <button 
          className="wkjc-btn wkjc-btn-primary" 
          onClick={() => onViewDetails(company)}
        >
          View Details
        </button>
        <button 
          className="wkjc-btn wkjc-btn-primary" 
          onClick={() => onApplyNow(company)}
        >
          Apply Now
        </button>
      </div>
    </div>
  );
};

// Offer Card Component
export const OfferCard = ({ offer, onAccept, onDecline }) => {
  return (
    <div className="wkjc-card">
      <h3>{offer.company?.companyName}</h3>
      <p><strong>Position:</strong> {offer.position}</p>
      <p><strong>Location:</strong> {offer.location}</p>
      <p><strong>Salary Range:</strong> ₹{offer.salary?.toLocaleString('en-IN')}</p>
      <div className="wkjc-card-footer">
        <button 
          className="wkjc-btn wkjc-btn-outline" 
          onClick={() => onDecline(offer._id)}
        >
          Decline
        </button>
        <button 
          className="wkjc-btn wkjc-btn-primary" 
          onClick={() => onAccept(offer._id)}
        >
          Accept Offer
        </button>
      </div>
    </div>
  );
};

// Application Card Component
export const ApplicationCard = ({ application }) => {
  return (
    <div className="wkjc-card">
      <span className={`wkjc-status-badge wkjc-status-${application.status?.toLowerCase()}`}>
        {application.status}
      </span>
      <h3>{application.compName}</h3>
      <p><strong>Position:</strong> {application.positionApplying}</p>
      <p><strong>Location:</strong> {application.location}</p>
      <p><strong>Expected Salary:</strong> ₹{application.expectedSalary?.toLocaleString()}</p>
      <p><strong>Specializations:</strong> {application.primarySkills?.join(', ')}</p>
      <p><strong>Applied On:</strong> {new Date(application.createdAt).toLocaleDateString()}</p>
    </div>
  );
};
