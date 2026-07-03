// src/pages/company/components/company-revenue/components/SidebarStats.jsx
import React from 'react';

const SidebarStats = ({ metrics, formatCurrency }) => {
  return (
    <div className="revenue-sidebar">
      <div className="revenue-stat-card">
        <h3>Revenue (This Month)</h3>
        <div className="revenue-stat-value">
          {formatCurrency(metrics?.revenueThisMonth || 0)}
        </div>
      </div>
      <div className="revenue-stat-card">
        <h3>Revenue (This Quarter)</h3>
        <div className="revenue-stat-value">
          {formatCurrency(metrics?.revenueThisQuarter || 0)}
        </div>
      </div>
      <div className="revenue-stat-card">
        <h3>Annual Revenue (YTD)</h3>
        <div className="revenue-stat-value">
          {formatCurrency(metrics?.revenueThisYear || 0)}
        </div>
      </div>
    </div>
  );
};

export default SidebarStats;
