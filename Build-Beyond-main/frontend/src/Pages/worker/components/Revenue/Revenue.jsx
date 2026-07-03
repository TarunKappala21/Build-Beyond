import React, { useState, useEffect } from 'react';
import './Revenue.css';
import EarningsSummary from './sub-components/EarningsSummary';
import ProjectEarningsTable from './sub-components/ProjectEarningsTable';
import TransactionHistory from './sub-components/TransactionHistory';
import RevenueChart from './sub-components/RevenueChart';

const Revenue = () => {
  const [revenueData, setRevenueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    fetchRevenueData();
  }, [refreshTrigger]);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/payment/worker/earnings', {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch revenue data');
      }

      const data = await response.json();
      if (data.success) {
        setRevenueData(data.data);
      } else {
        throw new Error(data.message || 'Failed to load revenue data');
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching revenue:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="wkrev-container">
        <div className="wkrev-loading">
          <div className="wkrev-spinner"></div>
          <p>Loading revenue data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wkrev-container">
        <div className="wkrev-error">
          <h3>Error Loading Revenue</h3>
          <p>{error}</p>
          <button onClick={handleRefresh} className="wkrev-retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!revenueData) {
    return (
      <div className="wkrev-container">
        <div className="wkrev-no-data">
          <h3>No Revenue Data Available</h3>
          <p>Start working on projects to see your earnings here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="wkrev-container">
      <div className="wkrev-header">
        <div className="wkrev-title-section">
          <h1 className="wkrev-title">Revenue Dashboard</h1>
          <p className="wkrev-subtitle">Track your earnings and project revenue</p>
        </div>
        <button onClick={handleRefresh} className="wkrev-refresh-btn" title="Refresh">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
          </svg>
          Refresh
        </button>
      </div>

      {/* Earnings Summary Cards */}
      <EarningsSummary 
        earnings={revenueData.earnings}
      />

      {/* Navigation Tabs */}
      <div className="wkrev-tabs">
        <button 
          className={`wkrev-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
          Overview
        </button>
        <button 
          className={`wkrev-tab ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/>
          </svg>
          Projects ({revenueData.projectEarnings?.length || 0})
        </button>
        <button 
          className={`wkrev-tab ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
          Transactions
        </button>
      </div>

      {/* Tab Content */}
      <div className="wkrev-tab-content">
        {activeTab === 'overview' && (
          <div className="wkrev-overview">
            <RevenueChart 
              projectEarnings={revenueData.projectEarnings}
              monthlyEarnings={revenueData.earnings.monthlyEarnings}
              yearlyEarnings={revenueData.earnings.yearlyEarnings}
            />
            <div className="wkrev-recent-section">
              <h3 className="wkrev-section-title">Recent Projects</h3>
              <ProjectEarningsTable 
                projects={revenueData.projectEarnings.slice(0, 5)} 
                compact={true}
              />
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="wkrev-projects">
            <ProjectEarningsTable projects={revenueData.projectEarnings} />
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="wkrev-transactions">
            <TransactionHistory transactions={revenueData.recentTransactions} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Revenue;
