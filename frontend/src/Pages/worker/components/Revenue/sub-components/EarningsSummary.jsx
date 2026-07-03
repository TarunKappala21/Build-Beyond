import React from 'react';

const EarningsSummary = ({ earnings }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  return (
    <div className="wkrev-summary-grid">
      {/* Total Earnings Card */}
      <div className="wkrev-summary-card total">
        <div className="wkrev-card-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        </div>
        <div className="wkrev-card-content">
          <p className="wkrev-card-label">Total Earnings</p>
          <h2 className="wkrev-card-value">{formatCurrency(earnings.totalEarnings)}</h2>
          <p className="wkrev-card-description">Lifetime earnings</p>
        </div>
      </div>

      {/* Available Balance Card */}
      <div className="wkrev-summary-card available">
        <div className="wkrev-card-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
            <line x1="1" y1="10" x2="23" y2="10"></line>
          </svg>
        </div>
        <div className="wkrev-card-content">
          <p className="wkrev-card-label">Available to Withdraw</p>
          <h2 className="wkrev-card-value">{formatCurrency(earnings.availableBalance)}</h2>
          <p className="wkrev-card-description">Ready for withdrawal</p>
        </div>
      </div>

      {/* Pending Balance Card */}
      <div className="wkrev-summary-card pending">
        <div className="wkrev-card-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <div className="wkrev-card-content">
          <p className="wkrev-card-label">Pending Release</p>
          <h2 className="wkrev-card-value">{formatCurrency(earnings.pendingBalance)}</h2>
          <p className="wkrev-card-description">In escrow</p>
        </div>
      </div>

      {/* Monthly Earnings Card */}
      <div className="wkrev-summary-card monthly">
        <div className="wkrev-card-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </div>
        <div className="wkrev-card-content">
          <p className="wkrev-card-label">This Month</p>
          <h2 className="wkrev-card-value">{formatCurrency(earnings.monthlyEarnings)}</h2>
          <p className="wkrev-card-description">Current month earnings</p>
        </div>
      </div>

      {/* Yearly Earnings Card */}
      <div className="wkrev-summary-card yearly">
        <div className="wkrev-card-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </div>
        <div className="wkrev-card-content">
          <p className="wkrev-card-label">This Year</p>
          <h2 className="wkrev-card-value">{formatCurrency(earnings.yearlyEarnings)}</h2>
          <p className="wkrev-card-description">Current year earnings</p>
        </div>
      </div>
    </div>
  );
};

export default EarningsSummary;
