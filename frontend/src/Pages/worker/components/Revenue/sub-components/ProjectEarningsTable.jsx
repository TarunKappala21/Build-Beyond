import React, { useState } from 'react';

const ProjectEarningsTable = ({ projects, compact = false }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [filterStatus, setFilterStatus] = useState('all');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusClass = (status) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower === 'completed') return 'status-completed';
    if (statusLower === 'accepted') return 'status-active';
    return 'status-pending';
  };

  const getTypeIcon = (type) => {
    if (type === 'architect') {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        </svg>
      );
    }
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect>
        <polyline points="17 2 12 7 7 2"></polyline>
      </svg>
    );
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedProjects = [...projects].sort((a, b) => {
    if (sortConfig.key === 'createdAt') {
      return sortConfig.direction === 'asc'
        ? new Date(a.createdAt) - new Date(b.createdAt)
        : new Date(b.createdAt) - new Date(a.createdAt);
    }
    if (sortConfig.key === 'earned') {
      return sortConfig.direction === 'asc' ? a.earned - b.earned : b.earned - a.earned;
    }
    if (sortConfig.key === 'total') {
      return sortConfig.direction === 'asc' ? a.total - b.total : b.total - a.total;
    }
    return 0;
  });

  const filteredProjects = filterStatus === 'all'
    ? sortedProjects
    : sortedProjects.filter(p => p.status?.toLowerCase() === filterStatus);

  if (!projects || projects.length === 0) {
    return (
      <div className="wkrev-no-projects">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
        <p>No project earnings yet</p>
      </div>
    );
  }

  return (
    <div className="wkrev-projects-table-container">
      {!compact && (
        <div className="wkrev-table-controls">
          <div className="wkrev-filter-buttons">
            <button
              className={`wkrev-filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
              onClick={() => setFilterStatus('all')}
            >
              All ({projects.length})
            </button>
            <button
              className={`wkrev-filter-btn ${filterStatus === 'accepted' ? 'active' : ''}`}
              onClick={() => setFilterStatus('accepted')}
            >
              Active ({projects.filter(p => p.status?.toLowerCase() === 'accepted').length})
            </button>
            <button
              className={`wkrev-filter-btn ${filterStatus === 'completed' ? 'active' : ''}`}
              onClick={() => setFilterStatus('completed')}
            >
              Completed ({projects.filter(p => p.status?.toLowerCase() === 'completed').length})
            </button>
          </div>
        </div>
      )}

      <div className="wkrev-table-wrapper">
        <table className="wkrev-projects-table">
          <thead>
            <tr>
              <th>Project Name</th>
              <th>Type</th>
              <th 
                className="sortable" 
                onClick={() => handleSort('total')}
              >
                Total Amount
                {sortConfig.key === 'total' && (
                  <span className="sort-arrow">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className="sortable" 
                onClick={() => handleSort('earned')}
              >
                Earned
                {sortConfig.key === 'earned' && (
                  <span className="sort-arrow">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th>Pending</th>
              <th>Status</th>
              {!compact && (
                <th 
                  className="sortable" 
                  onClick={() => handleSort('createdAt')}
                >
                  Date
                  {sortConfig.key === 'createdAt' && (
                    <span className="sort-arrow">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredProjects.map((project) => (
              <tr key={project.projectId}>
                <td>
                  <div className="wkrev-project-name">
                    {project.projectName || 'Unnamed Project'}
                  </div>
                </td>
                <td>
                  <div className="wkrev-project-type">
                    {getTypeIcon(project.projectType)}
                    <span>{project.projectType === 'architect' ? 'Architect' : 'Interior'}</span>
                  </div>
                </td>
                <td>
                  <strong>{formatCurrency(project.total)}</strong>
                </td>
                <td>
                  <span className="wkrev-amount-earned">{formatCurrency(project.earned)}</span>
                </td>
                <td>
                  <span className="wkrev-amount-pending">{formatCurrency(project.pending)}</span>
                </td>
                <td>
                  <span className={`wkrev-status-badge ${getStatusClass(project.status)}`}>
                    {project.status || 'Unknown'}
                  </span>
                </td>
                {!compact && (
                  <td className="wkrev-date-cell">
                    {formatDate(project.createdAt)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!compact && (
        <div className="wkrev-table-summary">
          <div className="wkrev-summary-item">
            <span>Total Projects:</span>
            <strong>{filteredProjects.length}</strong>
          </div>
          <div className="wkrev-summary-item">
            <span>Total Earned:</span>
            <strong className="success">{formatCurrency(filteredProjects.reduce((sum, p) => sum + p.earned, 0))}</strong>
          </div>
          <div className="wkrev-summary-item">
            <span>Total Pending:</span>
            <strong className="warning">{formatCurrency(filteredProjects.reduce((sum, p) => sum + p.pending, 0))}</strong>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectEarningsTable;
