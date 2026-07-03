// src/pages/company/components/company-revenue/components/ProjectsTable.jsx
import React from 'react';

const ProjectsTable = ({ projects, formatCurrency, formatDate, onViewDetails }) => {
  if (!projects || projects.length === 0) {
    return (
      <div className="revenue-empty-state">
        <div className="revenue-empty-icon">📊</div>
        <h3>No Projects Yet</h3>
        <p>Your accepted and completed projects will appear here</p>
      </div>
    );
  }

  return (
    <div className="revenue-table-container">
      <table className="revenue-table">
        <thead>
          <tr>
            <th>Project</th>
            <th>Status</th>
            <th>Total Value</th>
            <th>Received</th>
            <th>Pending</th>
            <th>Progress</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => {
            const totalAmount = project.totalAmount || 0;
            const received = project.receivedAmount || 0;
            const pending = project.pendingAmount || 0;
            const collectionRate = totalAmount > 0 ? (received / totalAmount * 100).toFixed(0) : 0;
            
            return (
              <tr key={project._id} className="revenue-table-row">
                <td>
                  <div className="revenue-project-info">
                    <strong>{project.projectName}</strong>
                    <span className="revenue-client-name">{project.customerName}</span>
                  </div>
                </td>
                <td>
                  <span className={`revenue-status-badge status-${project.status}`}>
                    {project.status === 'accepted' ? '🔄 Ongoing' : '✅ Completed'}
                  </span>
                </td>
                <td className="revenue-amount">{formatCurrency(totalAmount)}</td>
                <td className="revenue-amount revenue-received">{formatCurrency(received)}</td>
                <td className="revenue-amount revenue-pending">{formatCurrency(pending)}</td>
                <td>
                  <div className="revenue-progress-cell">
                    <div className="revenue-mini-progress">
                      <div 
                        className="revenue-mini-progress-fill" 
                        style={{
                          width: `${collectionRate}%`,
                          backgroundColor: collectionRate >= 75 ? '#4caf50' : collectionRate >= 50 ? '#ff9800' : '#f44336'
                        }}
                      ></div>
                    </div>
                    <span className="revenue-progress-text">{collectionRate}%</span>
                  </div>
                </td>
                <td>
                  <button
                    className="revenue-details-btn"
                    onClick={() => onViewDetails(project)}
                  >
                    View
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ProjectsTable;
