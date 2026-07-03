// src/Pages/customer/components/customer-payments/PaymentModal.jsx
import React, { useState } from 'react';
import Modal from 'react-modal';
import axios from 'axios';
import './PaymentModal.css';

Modal.setAppElement('#root');

const PaymentModal = ({ isOpen, onClose, project, paymentType, milestonePercentage, onPaymentSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Calculate payment amount based on type
  const getPaymentDetails = () => {
    if (!project || !project.paymentDetails) return null;

    if (paymentType === 'deposit') {
      // Initial 25% deposit
      const milestone = project.paymentDetails.milestonePayments[0];
      return {
        title: 'Initial Deposit (25%)',
        amount: milestone.amount,
        description: `Pay 25% deposit to start the project "${project.projectName}"`,
        milestone: milestone
      };
    } else if (paymentType === 'milestone') {
      // Milestone payment
      const milestone = project.paymentDetails.milestonePayments.find(
        m => m.percentage === milestonePercentage
      );
      return {
        title: `Milestone ${milestonePercentage}% Payment`,
        amount: milestone.amount,
        description: `Pay for ${milestonePercentage}% milestone completion`,
        milestone: milestone
      };
    }
    return null;
  };

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      // Simulate payment processing
      // In real implementation, this would integrate with payment gateway
      const paymentDetails = getPaymentDetails();

      // Call backend to mark payment as collected
      // This is a placeholder - actual payment gateway integration will be added later
      await new Promise(resolve => setTimeout(resolve, 1500));

      setSuccess(true);
      setTimeout(() => {
        onPaymentSuccess();
        onClose();
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const paymentDetails = getPaymentDetails();

  if (!paymentDetails) return null;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="cop-payment-modal"
      overlayClassName="cop-payment-overlay"
    >
      <div className="cop-payment-header">
        <h2>{paymentDetails.title}</h2>
        <button className="cop-close-btn" onClick={onClose}>&times;</button>
      </div>

      <div className="cop-payment-body">
        {error && (
          <div className="cop-error-message">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.477 10-10S15.523 0 10 0zm1 15H9v-2h2v2zm0-4H9V5h2v6z"/>
            </svg>
            {error}
          </div>
        )}

        {success && (
          <div className="cop-success-message">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.477 10-10S15.523 0 10 0zm-1 15l-5-5 1.41-1.41L9 12.17l7.59-7.59L18 6l-9 9z"/>
            </svg>
            Payment successful!
          </div>
        )}

        <div className="cop-project-info">
          <h3>{project.projectName}</h3>
          <p>{paymentDetails.description}</p>
        </div>

        <div className="cop-payment-breakdown">
          <h4>Payment Breakdown</h4>
          
          <div className="cop-breakdown-row">
            <span>Project Amount:</span>
            <strong>₹{project.paymentDetails.totalAmount.toLocaleString()}</strong>
          </div>

          <div className="cop-breakdown-row">
            <span>This Payment ({paymentDetails.milestone.percentage}%):</span>
            <strong>₹{paymentDetails.amount.toLocaleString()}</strong>
          </div>

          <div className="cop-breakdown-row cop-highlight">
            <span>Amount to Pay:</span>
            <strong className="cop-amount-large">₹{paymentDetails.amount.toLocaleString()}</strong>
          </div>

          <div className="cop-breakdown-note">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm1 12H7V7h2v5zm0-6H7V4h2v2z"/>
            </svg>
            <span>Payment will be held in escrow and released upon milestone approval</span>
          </div>
        </div>

        <div className="cop-payment-method">
          <h4>Payment Method</h4>
          <div className="cop-method-note">
            <p>Payment gateway integration (Razorpay/PayU/Stripe) will be activated soon.</p>
            <p>For now, payments are processed automatically.</p>
          </div>
        </div>
      </div>

      <div className="cop-payment-footer">
        <button 
          className="cop-cancel-btn" 
          onClick={onClose}
          disabled={loading || success}
        >
          Cancel
        </button>
        <button 
          className="cop-pay-btn" 
          onClick={handlePayment}
          disabled={loading || success}
        >
          {loading ? (
            <>
              <div className="cop-spinner"></div>
              Processing...
            </>
          ) : success ? (
            'Payment Successful!'
          ) : (
            `Pay ₹${paymentDetails.amount.toLocaleString()}`
          )}
        </button>
      </div>
    </Modal>
  );
};

export default PaymentModal;
