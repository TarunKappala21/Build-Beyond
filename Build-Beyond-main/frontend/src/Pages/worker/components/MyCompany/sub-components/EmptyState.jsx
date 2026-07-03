import React from 'react';

const EmptyState = () => {
  return (
    <div className="wkmc-empty-state">
      <div className="wkmc-empty-icon">
        <i className="fas fa-building"></i>
      </div>
      <h3>Not Part of Any Company</h3>
      <p>You are not currently associated with any company. Visit the "Join a Company" page to explore opportunities.</p>
      <a href="/workerdashboard/join_company" className="wkmc-btn wkmc-btn-primary">
        <i className="fas fa-search"></i> Browse Companies
      </a>
    </div>
  );
};

export default EmptyState;
