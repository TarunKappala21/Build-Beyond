// src/Pages/customer/components/customer-payments/PaymentStatusBar.jsx
import React from 'react';
import './PaymentStatusBar.css';

const PaymentStatusBar = ({ project, onPayNow }) => {
  if (!project.paymentDetails) return null;

  const { milestonePayments, totalAmount } = project.paymentDetails;

  // Calculate payment progress
  const paidMilestones = milestonePayments.filter(m => m.paymentCollected).length;
  const totalMilestones = milestonePayments.length;
  const progressPercentage = (paidMilestones / totalMilestones) * 100;

  // Find next unpaid milestone
  const nextUnpaidMilestone = milestonePayments.find(m => !m.paymentCollected);

  // Calculate total paid and remaining
  const totalPaid = milestonePayments
    .filter(m => m.paymentCollected)
    .reduce((sum, m) => sum + m.amount, 0);
  const totalRemaining = totalAmount - totalPaid;

  return (
    <div className="copsb-container">
      <div className="copsb-header">
        <h4>Payment Status</h4>
        <span className="copsb-progress-text">
          {paidMilestones} of {totalMilestones} payments completed
        </span>
      </div>

      {/* Progress Bar */}
      <div className="copsb-progress-bar">
        <div 
          className="copsb-progress-fill" 
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Milestone Circles */}
      <div className="copsb-milestones">
        {milestonePayments.map((milestone, index) => (
          <div 
            key={index} 
            className={`copsb-milestone ${milestone.paymentCollected ? 'paid' : ''} ${milestone.status === 'released' ? 'completed' : ''}`}
            title={`${milestone.percentage}% - ${milestone.paymentCollected ? 'Paid' : 'Unpaid'}`}
          >
            <div className="copsb-milestone-circle">
              {milestone.status === 'released' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                </svg>
              ) : milestone.paymentCollected ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                </svg>
              ) : (
                <span>{milestone.percentage}%</span>
              )}
            </div>
            <span className="copsb-milestone-label">{milestone.percentage}%</span>
          </div>
        ))}
      </div>

      {/* Payment Summary */}
      <div className="copsb-summary">
        <div className="copsb-summary-row">
          <span>Total Project Cost:</span>
          <strong>₹{totalAmount.toLocaleString()}</strong>
        </div>
        <div className="copsb-summary-row success">
          <span>Total Paid:</span>
          <strong>₹{totalPaid.toLocaleString()}</strong>
        </div>
        <div className="copsb-summary-row warning">
          <span>Remaining:</span>
          <strong>₹{totalRemaining.toLocaleString()}</strong>
        </div>
      </div>

      {/* Next Payment Due */}
      {nextUnpaidMilestone && (
        <div className="copsb-next-payment">
          <div className="copsb-next-payment-info">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
            </svg>
            <div>
              <strong>Next Payment Due: {nextUnpaidMilestone.percentage}% Milestone</strong>
              <span>Amount: ₹{nextUnpaidMilestone.amount.toLocaleString()}</span>
            </div>
          </div>
          <button 
            className="copsb-pay-btn"
            onClick={() => onPayNow(nextUnpaidMilestone)}
          >
            Pay Now
          </button>
        </div>
      )}

      {!nextUnpaidMilestone && paidMilestones === totalMilestones && (
        <div className="copsb-complete-message">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <span>All payments completed!</span>
        </div>
      )}
    </div>
  );
};

export default PaymentStatusBar;
