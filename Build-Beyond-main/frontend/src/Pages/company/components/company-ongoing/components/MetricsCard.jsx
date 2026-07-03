// src/pages/company/components/company-ongoing/components/MetricsCard.jsx
import React from 'react';

const MetricsCard = ({ metrics }) => {
  if (!metrics) return null;

  return (
    <div className="ongoing-dashboard-metrics">
      <div className="ongoing-metric-card">
        <div className="ongoing-metric-title">Total Active Projects</div>
        <div className="ongoing-metric-value">{metrics.totalActiveProjects}</div>
      </div>
      <div className="ongoing-metric-card">
        <div className="ongoing-metric-title">Monthly Revenue</div>
        <div className="ongoing-metric-value">₹{metrics.monthlyRevenue} Cr</div>
      </div>
      <div className="ongoing-metric-card">
        <div className="ongoing-metric-title">Customer Satisfaction</div>
        <div className="ongoing-metric-value">{metrics.customerSatisfaction}/5</div>
      </div>
      <div className="ongoing-metric-card">
        <div className="ongoing-metric-title">Projects On Schedule</div>
        <div className="ongoing-metric-value">{metrics.projectsOnSchedule}%</div>
      </div>
    </div>
  );
};

export default MetricsCard;
