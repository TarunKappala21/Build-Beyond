import React from "react";

const DashboardStats = ({ active, completed, revenue }) => {
  return (
    <div className="cdb-stats-container">
      <div className="cdb-stat-card">
        <h3>Active Projects</h3>
        <div className="cdb-stat-value">{active}</div>
      </div>
      <div className="cdb-stat-card">
        <h3>Completed Projects</h3>
        <div className="cdb-stat-value">{completed}</div>
      </div>
      <div className="cdb-stat-card">
        <h3>Total Revenue</h3>
        <div className="cdb-stat-value">₹{revenue.toLocaleString("en-IN")}</div>
      </div>
    </div>
  );
};

export default DashboardStats;