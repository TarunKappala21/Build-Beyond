import React from 'react';

const RevenueChart = ({ projectEarnings, monthlyEarnings, yearlyEarnings }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Calculate statistics
  const totalProjects = projectEarnings?.length || 0;
  const activeProjects = projectEarnings?.filter(p => p.status?.toLowerCase() === 'accepted').length || 0;
  const completedProjects = projectEarnings?.filter(p => p.status?.toLowerCase() === 'completed').length || 0;
  
  const totalRevenue = projectEarnings?.reduce((sum, p) => sum + (p.earned || 0), 0) || 0;
  const pendingRevenue = projectEarnings?.reduce((sum, p) => sum + (p.pending || 0), 0) || 0;
  
  const avgProjectValue = totalProjects > 0 ? totalRevenue / totalProjects : 0;

  // Get top 3 earning projects
  const topProjects = [...(projectEarnings || [])]
    .sort((a, b) => (b.earned || 0) - (a.earned || 0))
    .slice(0, 3);

  return (
    <div className="wkrev-chart-container">
      {/* Quick Stats Grid */}
      <div className="wkrev-chart-stats-grid">
        <div className="wkrev-stat-card">
          <div className="wkrev-stat-icon blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
          </div>
          <div className="wkrev-stat-content">
            <p className="wkrev-stat-label">Total Projects</p>
            <h3 className="wkrev-stat-value">{totalProjects}</h3>
            <p className="wkrev-stat-detail">{activeProjects} active, {completedProjects} completed</p>
          </div>
        </div>

        <div className="wkrev-stat-card">
          <div className="wkrev-stat-icon green">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
          </div>
          <div className="wkrev-stat-content">
            <p className="wkrev-stat-label">Total Revenue</p>
            <h3 className="wkrev-stat-value">{formatCurrency(totalRevenue)}</h3>
            <p className="wkrev-stat-detail">Across all projects</p>
          </div>
        </div>

        <div className="wkrev-stat-card">
          <div className="wkrev-stat-icon orange">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div className="wkrev-stat-content">
            <p className="wkrev-stat-label">Pending Revenue</p>
            <h3 className="wkrev-stat-value">{formatCurrency(pendingRevenue)}</h3>
            <p className="wkrev-stat-detail">Awaiting release</p>
          </div>
        </div>

        <div className="wkrev-stat-card">
          <div className="wkrev-stat-icon purple">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <div className="wkrev-stat-content">
            <p className="wkrev-stat-label">Avg. Project Value</p>
            <h3 className="wkrev-stat-value">{formatCurrency(avgProjectValue)}</h3>
            <p className="wkrev-stat-detail">Per project</p>
          </div>
        </div>
      </div>

      {/* Top Earning Projects */}
      {topProjects.length > 0 && (
        <div className="wkrev-top-projects">
          <h3 className="wkrev-section-subtitle">Top Earning Projects</h3>
          <div className="wkrev-top-projects-list">
            {topProjects.map((project, index) => (
              <div key={project.projectId} className="wkrev-top-project-item">
                <div className="wkrev-top-project-rank">
                  <span className={`rank-badge rank-${index + 1}`}>
                    #{index + 1}
                  </span>
                </div>
                <div className="wkrev-top-project-info">
                  <h4>{project.projectName || 'Unnamed Project'}</h4>
                  <p>
                    <span className="project-type-badge">
                      {project.projectType === 'architect' ? 'Architect' : 'Interior'}
                    </span>
                    <span className="project-status">
                      {project.status}
                    </span>
                  </p>
                </div>
                <div className="wkrev-top-project-earnings">
                  <div className="earned-amount">
                    {formatCurrency(project.earned)}
                  </div>
                  <div className="project-progress">
                    <div className="progress-bar-bg">
                      <div 
                        className="progress-bar-fill"
                        style={{ 
                          width: `${project.total > 0 ? (project.earned / project.total) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                    <span className="progress-text">
                      {project.total > 0 ? Math.round((project.earned / project.total) * 100) : 0}% earned
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly vs Yearly */}
      <div className="wkrev-period-comparison">
        <div className="wkrev-period-card monthly">
          <div className="wkrev-period-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <h4>This Month</h4>
          </div>
          <div className="wkrev-period-amount">
            {formatCurrency(monthlyEarnings || 0)}
          </div>
        </div>

        <div className="wkrev-period-card yearly">
          <div className="wkrev-period-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
              <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"></path>
            </svg>
            <h4>This Year</h4>
          </div>
          <div className="wkrev-period-amount">
            {formatCurrency(yearlyEarnings || 0)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueChart;
