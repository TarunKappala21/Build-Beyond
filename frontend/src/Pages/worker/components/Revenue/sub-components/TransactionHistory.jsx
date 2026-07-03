import React, { useState } from 'react';

const TransactionHistory = ({ transactions }) => {
  const [filterType, setFilterType] = useState('all');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'escrow_hold':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        );
      case 'milestone_release':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
        );
      case 'worker_withdrawal':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
        );
      case 'platform_commission':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        );
      default:
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="16"></line>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
        );
    }
  };

  const getTransactionLabel = (type) => {
    const labels = {
      'escrow_hold': 'Escrow Hold',
      'milestone_release': 'Milestone Payment',
      'worker_withdrawal': 'Withdrawal',
      'platform_commission': 'Platform Fee',
      'refund': 'Refund',
      'subscription_fee': 'Subscription'
    };
    return labels[type] || type;
  };

  const getStatusClass = (status) => {
    return `wkrev-tx-status ${status?.toLowerCase() || 'pending'}`;
  };

  const getTransactionTypeClass = (type) => {
    if (type === 'milestone_release') return 'credit';
    if (type === 'worker_withdrawal' || type === 'platform_commission') return 'debit';
    return 'neutral';
  };

  const filteredTransactions = filterType === 'all'
    ? transactions
    : transactions.filter(tx => tx.transactionType === filterType);

  if (!transactions || transactions.length === 0) {
    return (
      <div className="wkrev-no-transactions">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="1" x2="12" y2="23"></line>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
        <p>No transactions yet</p>
      </div>
    );
  }

  return (
    <div className="wkrev-transactions-container">
      <div className="wkrev-transactions-header">
        <h3>Transaction History</h3>
        <div className="wkrev-tx-filter">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="wkrev-tx-filter-select"
          >
            <option value="all">All Transactions</option>
            <option value="milestone_release">Milestone Payments</option>
            <option value="worker_withdrawal">Withdrawals</option>
            <option value="escrow_hold">Escrow Holds</option>
            <option value="platform_commission">Platform Fees</option>
          </select>
        </div>
      </div>

      <div className="wkrev-transactions-list">
        {filteredTransactions.map((transaction) => (
          <div key={transaction._id} className={`wkrev-transaction-card ${getTransactionTypeClass(transaction.transactionType)}`}>
            <div className="wkrev-tx-icon">
              {getTransactionIcon(transaction.transactionType)}
            </div>
            
            <div className="wkrev-tx-details">
              <div className="wkrev-tx-main">
                <h4>{getTransactionLabel(transaction.transactionType)}</h4>
                <span className={getStatusClass(transaction.status)}>
                  {transaction.status || 'Pending'}
                </span>
              </div>
              
              <div className="wkrev-tx-description">
                <p>{transaction.description || 'No description'}</p>
                {transaction.milestonePercentage && (
                  <span className="wkrev-tx-milestone-badge">
                    {transaction.milestonePercentage}% Milestone
                  </span>
                )}
              </div>
              
              <div className="wkrev-tx-meta">
                <span className="wkrev-tx-date">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  {formatDate(transaction.processedAt || transaction.createdAt)}
                </span>
                {transaction.paymentMethod && (
                  <span className="wkrev-tx-method">
                    {transaction.paymentMethod.replace('_', ' ')}
                  </span>
                )}
              </div>
            </div>

            <div className="wkrev-tx-amount">
              <div className="wkrev-amount-main">
                {transaction.transactionType === 'platform_commission' ? '-' : ''}
                {formatCurrency(transaction.amount)}
              </div>
              {transaction.platformFee > 0 && transaction.transactionType !== 'platform_commission' && (
                <div className="wkrev-amount-net">
                  Net: {formatCurrency(transaction.netAmount)}
                  <span className="wkrev-fee-info">(-{formatCurrency(transaction.platformFee)} fee)</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredTransactions.length === 0 && (
        <div className="wkrev-no-filtered-results">
          <p>No {filterType !== 'all' ? getTransactionLabel(filterType).toLowerCase() + 's' : 'transactions'} found</p>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
