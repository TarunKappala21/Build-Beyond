// src/pages/company/components/company-revenue/components/StatsCards.jsx
import React from 'react';

const StatsCards = ({ metrics, formatCurrency }) => {
  const totalValue = (metrics?.totalReceived || 0) + (metrics?.totalPending || 0);
  const collectionRate = totalValue > 0 ? ((metrics?.totalReceived || 0) / totalValue * 100).toFixed(1) : 0;

  return (
    <>
      {/* Main Stats Grid */}
      <div className="revenue-stats-grid">
        <div className="revenue-stat-card revenue-stat-primary">
          <div className="revenue-stat-icon">💰</div>
          <div className="revenue-stat-content">
            <h3>Total Received</h3>
            <div className="revenue-stat-value">{formatCurrency(metrics?.totalReceived || 0)}</div>
            <div className="revenue-stat-progress">
              <div className="revenue-stat-progress-bar" style={{width: `${collectionRate}%`, backgroundColor: '#4caf50'}}></div>
            </div>
            <p className="revenue-stat-subtitle">{collectionRate}% of total value collected</p>
          </div>
        </div>

        <div className="revenue-stat-card revenue-stat-warning">
          <div className="revenue-stat-icon">⏳</div>
          <div className="revenue-stat-content">
            <h3>Pending Payments</h3>
            <div className="revenue-stat-value">{formatCurrency(metrics?.totalPending || 0)}</div>
            <p className="revenue-stat-subtitle">Awaiting customer payment</p>
          </div>
        </div>

        <div className="revenue-stat-card revenue-stat-info">
          <div className="revenue-stat-icon">📊</div>
          <div className="revenue-stat-content">
            <h3>Active Projects</h3>
            <div className="revenue-stat-value">{metrics?.ongoingProjects || 0}</div>
            <p className="revenue-stat-subtitle">{formatCurrency(metrics?.ongoingProjectValue || 0)} total value</p>
          </div>
        </div>

        <div className="revenue-stat-card revenue-stat-success">
          <div className="revenue-stat-icon">✅</div>
          <div className="revenue-stat-content">
            <h3>Completed Projects</h3>
            <div className="revenue-stat-value">{metrics?.completedProjects || 0}</div>
            <p className="revenue-stat-subtitle">{formatCurrency(metrics?.averageProjectValue || 0)} avg value</p>
          </div>
        </div>
      </div>

      {/* Phase Analytics */}
      {metrics?.phaseAnalytics && Object.values(metrics.phaseAnalytics).some(d => d.count > 0) && (
        <div className="revenue-analytics-section">
          <div className="revenue-section-header">
            <h2>📈 Phase-wise Analytics</h2>
            <p>Revenue breakdown by project phases</p>
          </div>
          <div className="revenue-phase-grid">
            {Object.entries(metrics.phaseAnalytics)
              .filter(([_, data]) => data.count > 0)
              .map(([phaseKey, data]) => {
                const phaseName = phaseKey === 'final' ? 'Final Payment' : `Phase ${phaseKey.replace('phase', '')}`;
                const phaseIcon = phaseKey === 'final' ? '🎯' : '📍';
                const collectionRate = data.total > 0 ? (data.received / data.total * 100).toFixed(1) : 0;
                
                return (
                  <div key={phaseKey} className="revenue-phase-card">
                    <div className="revenue-phase-header">
                      <h4>{phaseIcon} {phaseName}</h4>
                      <span className="revenue-badge">{data.count}</span>
                    </div>
                    <div className="revenue-phase-body">
                      <div className="revenue-amount-row">
                        <span>Expected</span>
                        <strong>{formatCurrency(data.total)}</strong>
                      </div>
                      <div className="revenue-amount-row revenue-received">
                        <span>Received</span>
                        <strong>{formatCurrency(data.received)}</strong>
                      </div>
                      <div className="revenue-amount-row revenue-pending">
                        <span>Pending</span>
                        <strong>{formatCurrency(data.pending)}</strong>
                      </div>
                      <div className="revenue-phase-progress-wrapper">
                        <div className="revenue-phase-progress-bar">
                          <div 
                            className="revenue-phase-progress-fill" 
                            style={{width: `${collectionRate}%`}}
                          ></div>
                        </div>
                        <span className="revenue-progress-label">{collectionRate}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </>
  );
};

export default StatsCards;
