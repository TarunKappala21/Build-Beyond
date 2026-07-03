import React from 'react';
import ProjectsSection from './ProjectsSection';

const CompanyInfoCard = ({ company, projects, onOpenChat, onLeaveCompany, chatId }) => {
  return (
    <div className="wkmc-company-card">
      <div className="wkmc-company-header">
        <div className="wkmc-company-icon">
          <i className="fas fa-building"></i>
        </div>
        <div className="wkmc-company-info">
          <h2>{company.companyName}</h2>
          <p className="wkmc-company-location">
            <i className="fas fa-map-marker-alt"></i> {typeof company.location === 'object' 
              ? `${company.location.city || ''}, ${company.location.state || ''}, ${company.location.country || ''}`.replace(/(^,\s*|,\s*$)/g, '').replace(/,\s*,/g, ',')
              : company.location || 'N/A'}
          </p>
        </div>
      </div>

      <div className="wkmc-company-body">
        <div className="wkmc-info-section">
          <h3>Company Details</h3>
          <div className="wkmc-info-grid">
            <div className="wkmc-info-item">
              <span className="wkmc-info-label">Company Name:</span>
              <span className="wkmc-info-value">{company.companyName}</span>
            </div>
            <div className="wkmc-info-item">
              <span className="wkmc-info-label">Location:</span>
              <span className="wkmc-info-value">{typeof company.location === 'object' 
                ? `${company.location.city || ''}, ${company.location.state || ''}, ${company.location.country || ''}`.replace(/(^,\s*|,\s*$)/g, '').replace(/,\s*,/g, ',')
                : company.location || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Active Projects Section */}
        <ProjectsSection projects={projects} />
      </div>

      <div className="wkmc-company-footer">
        <button 
          className="wkmc-btn wkmc-btn-secondary"
          onClick={onOpenChat}
          disabled={!chatId}
        >
          <i className="fas fa-comments"></i> Chat with Company
        </button>
        <button 
          className="wkmc-btn wkmc-btn-danger"
          onClick={onLeaveCompany}
        >
          <i className="fas fa-sign-out-alt"></i> Leave Company
        </button>
      </div>
    </div>
  );
};

export default CompanyInfoCard;
