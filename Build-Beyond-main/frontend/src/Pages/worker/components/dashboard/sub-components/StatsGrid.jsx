import React from 'react';

const StatsGrid = ({ stats, availability }) => {
  return (
    <div className="wkd-stats-grid">
      <div className="wkd-stat-card">
        <h3>Pending Offers</h3>
        <div className="wkd-stat-value">{stats.pendingOffers}</div>
      </div>
      <div className="wkd-stat-card">
        <h3>Active Applications</h3>
        <div className="wkd-stat-value">{stats.activeApplications}</div>
      </div>
      <div className="wkd-stat-card">
        <h3>Availability</h3>
        <div
          className="wkd-stat-value"
          style={{ fontSize: '1.75rem', textTransform: 'capitalize' }}
        >
          {availability}
        </div>
      </div>
    </div>
  );
};

export default StatsGrid;
