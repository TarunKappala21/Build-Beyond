import React, { useState } from 'react';

const WithdrawalForm = ({ availableBalance, onSuccess }) => {
  const [formData, setFormData] = useState({
    amount: '',
    accountHolderName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    bankName: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({ type: '', text: '' });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const validateForm = () => {
    const newErrors = {};

    // Amount validation
    const amount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amount)) {
      newErrors.amount = 'Please enter a valid amount';
    } else if (amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    } else if (amount > availableBalance) {
      newErrors.amount = `Amount cannot exceed available balance (${formatCurrency(availableBalance)})`;
    } else if (amount < 100) {
      newErrors.amount = 'Minimum withdrawal amount is ₹100';
    }

    // Account holder name
    if (!formData.accountHolderName.trim()) {
      newErrors.accountHolderName = 'Account holder name is required';
    } else if (formData.accountHolderName.trim().length < 3) {
      newErrors.accountHolderName = 'Name must be at least 3 characters';
    }

    // Account number
    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = 'Account number is required';
    } else if (!/^\d{9,18}$/.test(formData.accountNumber.trim())) {
      newErrors.accountNumber = 'Account number must be 9-18 digits';
    }

    // Confirm account number
    if (formData.accountNumber !== formData.confirmAccountNumber) {
      newErrors.confirmAccountNumber = 'Account numbers do not match';
    }

    // IFSC Code
    if (!formData.ifscCode.trim()) {
      newErrors.ifscCode = 'IFSC code is required';
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode.trim())) {
      newErrors.ifscCode = 'Invalid IFSC code format (e.g., SBIN0001234)';
    }

    // Bank name
    if (!formData.bankName.trim()) {
      newErrors.bankName = 'Bank name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Clear submit message
    if (submitMessage.text) {
      setSubmitMessage({ type: '', text: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!confirm(`Confirm withdrawal of ${formatCurrency(parseFloat(formData.amount))} to account ending in ${formData.accountNumber.slice(-4)}?`)) {
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/payment/worker/withdraw', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: parseFloat(formData.amount),
          bankDetails: {
            accountHolderName: formData.accountHolderName.trim(),
            accountNumber: formData.accountNumber.trim(),
            ifscCode: formData.ifscCode.trim().toUpperCase(),
            bankName: formData.bankName.trim()
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        setSubmitMessage({
          type: 'success',
          text: 'Withdrawal request submitted successfully! Processing takes 2-3 business days.'
        });
        
        // Reset form
        setFormData({
          amount: '',
          accountHolderName: '',
          accountNumber: '',
          confirmAccountNumber: '',
          ifscCode: '',
          bankName: ''
        });

        // Notify parent component
        if (onSuccess) {
          setTimeout(() => onSuccess(), 2000);
        }
      } else {
        setSubmitMessage({
          type: 'error',
          text: data.message || 'Failed to submit withdrawal request'
        });
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
      setSubmitMessage({
        type: 'error',
        text: 'An error occurred. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const setMaxAmount = () => {
    setFormData(prev => ({ ...prev, amount: availableBalance.toString() }));
    if (errors.amount) {
      setErrors(prev => ({ ...prev, amount: '' }));
    }
  };

  return (
    <div className="wkrev-withdrawal-container">
      <div className="wkrev-withdrawal-header">
        <h3>Request Withdrawal</h3>
        <div className="wkrev-available-balance">
          <span>Available Balance:</span>
          <strong>{formatCurrency(availableBalance)}</strong>
        </div>
      </div>

      {submitMessage.text && (
        <div className={`wkrev-submit-message ${submitMessage.type}`}>
          {submitMessage.type === 'success' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          )}
          <span>{submitMessage.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="wkrev-withdrawal-form">
        <div className="wkrev-form-section">
          <h4>Withdrawal Amount</h4>
          <div className="wkrev-form-group">
            <label htmlFor="amount">Amount (₹) *</label>
            <div className="wkrev-amount-input-group">
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="Enter amount"
                min="100"
                max={availableBalance}
                step="0.01"
                className={errors.amount ? 'error' : ''}
              />
              <button
                type="button"
                onClick={setMaxAmount}
                className="wkrev-max-btn"
              >
                MAX
              </button>
            </div>
            {errors.amount && <span className="wkrev-error">{errors.amount}</span>}
            <p className="wkrev-helper-text">Minimum withdrawal: ₹100</p>
          </div>
        </div>

        <div className="wkrev-form-section">
          <h4>Bank Account Details</h4>
          
          <div className="wkrev-form-group">
            <label htmlFor="accountHolderName">Account Holder Name *</label>
            <input
              type="text"
              id="accountHolderName"
              name="accountHolderName"
              value={formData.accountHolderName}
              onChange={handleChange}
              placeholder="Full name as per bank account"
              className={errors.accountHolderName ? 'error' : ''}
            />
            {errors.accountHolderName && <span className="wkrev-error">{errors.accountHolderName}</span>}
          </div>

          <div className="wkrev-form-row">
            <div className="wkrev-form-group">
              <label htmlFor="accountNumber">Account Number *</label>
              <input
                type="text"
                id="accountNumber"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
                placeholder="Enter account number"
                className={errors.accountNumber ? 'error' : ''}
              />
              {errors.accountNumber && <span className="wkrev-error">{errors.accountNumber}</span>}
            </div>

            <div className="wkrev-form-group">
              <label htmlFor="confirmAccountNumber">Confirm Account Number *</label>
              <input
                type="text"
                id="confirmAccountNumber"
                name="confirmAccountNumber"
                value={formData.confirmAccountNumber}
                onChange={handleChange}
                placeholder="Re-enter account number"
                className={errors.confirmAccountNumber ? 'error' : ''}
              />
              {errors.confirmAccountNumber && <span className="wkrev-error">{errors.confirmAccountNumber}</span>}
            </div>
          </div>

          <div className="wkrev-form-row">
            <div className="wkrev-form-group">
              <label htmlFor="ifscCode">IFSC Code *</label>
              <input
                type="text"
                id="ifscCode"
                name="ifscCode"
                value={formData.ifscCode}
                onChange={handleChange}
                placeholder="e.g., SBIN0001234"
                maxLength="11"
                className={errors.ifscCode ? 'error' : ''}
              />
              {errors.ifscCode && <span className="wkrev-error">{errors.ifscCode}</span>}
            </div>

            <div className="wkrev-form-group">
              <label htmlFor="bankName">Bank Name *</label>
              <input
                type="text"
                id="bankName"
                name="bankName"
                value={formData.bankName}
                onChange={handleChange}
                placeholder="e.g., State Bank of India"
                className={errors.bankName ? 'error' : ''}
              />
              {errors.bankName && <span className="wkrev-error">{errors.bankName}</span>}
            </div>
          </div>
        </div>

        <div className="wkrev-form-footer">
          <p className="wkrev-footer-note">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            Withdrawal processing typically takes 2-3 business days. Ensure all bank details are correct.
          </p>
          <button
            type="submit"
            className="wkrev-submit-btn"
            disabled={isSubmitting || availableBalance <= 0}
          >
            {isSubmitting ? (
              <>
                <span className="wkrev-spinner-small"></span>
                Processing...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Submit Withdrawal Request
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default WithdrawalForm;
