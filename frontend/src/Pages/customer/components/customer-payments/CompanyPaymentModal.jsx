// src/Pages/customer/components/customer-payments/CompanyPaymentModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../../../api/axiosInstance';
import './CompanyPaymentModal.css';

const INITIAL_RELEASE_PERCENT = 75;
const HOLD_PERCENT = 25;
const MAX_RAZORPAY_ORDER_AMOUNT_INR = 500000;
const ENABLE_TEST_SKIP = import.meta.env.DEV || import.meta.env.VITE_ENABLE_TEST_PAYMENT_SKIP === 'true';

/**
 * CompanyPaymentModal
 *
 * Props:
 *  isOpen              – boolean
 *  onClose             – () => void
 *  onSuccess           – () => void   (called after payment verified; parent should refresh projects)
 *  project             – ConstructionProject object
 *  milestonePercentage – 25 | 50 | 75 | 100
 */
const CompanyPaymentModal = ({ isOpen, onClose, onSuccess, project, milestonePercentage }) => {
  const [step, setStep] = useState('confirm'); // 'confirm' | 'processing' | 'success'
  const [error, setError] = useState(null);

  // Reset when reopened
  useEffect(() => {
    if (isOpen) { setStep('confirm'); setError(null); }
  }, [isOpen]);

  // Load Razorpay script once
  useEffect(() => {
    if (document.getElementById('razorpay-script')) return;
    const s = document.createElement('script');
    s.id = 'razorpay-script';
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.async = true;
    document.body.appendChild(s);
  }, []);

  // ─── Derived payment details ──────────────────────────────
  const getDetails = useCallback(() => {
    if (!project || !milestonePercentage) return null;

    const totalAmount = parseFloat(project.proposal?.price) || 0;
    if (totalAmount <= 0) return null;

    const proposalPhases = Array.isArray(project.proposal?.phases) ? project.proposal.phases : [];
    const phaseIndex = [25, 50, 75, 100].indexOf(Number(milestonePercentage));
    const configuredPhaseAmount = Number(proposalPhases[phaseIndex]?.amount || 0);
    const phaseAmount = Math.round(configuredPhaseAmount > 0 ? configuredPhaseAmount : (totalAmount * milestonePercentage) / 100);
    const existingPayout = (project.paymentDetails?.payouts || []).find(
      (entry) => Number(entry.milestonePercentage) === Number(milestonePercentage),
    );

    const isFinalStage = existingPayout && existingPayout.status === 'held';
    const amountPaidSoFar = Number(existingPayout?.customerPaidAmount || 0);
    const initialStageTarget = Math.round((phaseAmount * INITIAL_RELEASE_PERCENT) / 100);
    const stageTargetAmount = isFinalStage
      ? Math.max(phaseAmount - initialStageTarget, 0)
      : initialStageTarget;

    const stagePaidSoFar = isFinalStage
      ? Math.max(amountPaidSoFar - initialStageTarget, 0)
      : Math.min(amountPaidSoFar, initialStageTarget);

    const stageRemainingAmount = Math.max(stageTargetAmount - stagePaidSoFar, 0);
    const remainingAmount = Math.max(phaseAmount - amountPaidSoFar, 0);
    const amount = Math.min(Math.round(stageRemainingAmount), MAX_RAZORPAY_ORDER_AMOUNT_INR);
    const installmentCountForStage = Math.max(1, Math.ceil(stageTargetAmount / MAX_RAZORPAY_ORDER_AMOUNT_INR));
    const currentInstallmentNumber = stageTargetAmount > 0
      ? Math.min(installmentCountForStage, Math.floor(stagePaidSoFar / MAX_RAZORPAY_ORDER_AMOUNT_INR) + 1)
      : 1;

    const initialReleaseAmount = amount;
    const heldAmount = 0;

    const stageLabel = isFinalStage
      ? `Final payment for ${milestonePercentage}% phase (after approval)`
      : `Initial payment for ${milestonePercentage}% phase (${INITIAL_RELEASE_PERCENT}% now)`;

    return {
      projectName: project.projectName,
      milestone: `${milestonePercentage}% Milestone`,
      stageLabel,
      amount,
      phaseAmount,
      amountPaidSoFar,
      remainingAmount,
      stageTargetAmount,
      stagePaidSoFar,
      stageRemainingAmount,
      installmentCountForStage,
      currentInstallmentNumber,
      isFinalStage,
      initialReleaseAmount,
      heldAmount,
      totalAmount,
      milestonePercentage,
    };
  }, [project, milestonePercentage]);

  const fmt = (n) => `₹${Number(n).toLocaleString('en-IN')}`;
  const details = getDetails();

  // ─── Payment handler ─────────────────────────────────────
  const handlePay = async () => {
    if (!details) return;
    if (details.amount <= 0) {
      setError('No payable amount is pending for this phase.');
      return;
    }
    setError(null);
    setStep('processing');

    try {
      // 1. Create Razorpay order
      const orderRes = await axiosInstance.post(
        '/api/payment/company/create-order',
        { projectId: project._id, milestonePercentage },
        { withCredentials: true }
      );

      if (!orderRes.data.success) throw new Error(orderRes.data.message);
      const { razorpayOrderId, amountInPaise, currency, keyId } = orderRes.data.data;

      // 2. Open Razorpay checkout
      const rzp = new window.Razorpay({
        key: keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: amountInPaise,
        currency: currency || 'INR',
        name: 'Build & Beyond',
        description: `${details.milestone} — ${details.stageLabel}`,
        order_id: razorpayOrderId,
        prefill: {},
        theme: { color: '#1565c0' },
        modal: {
          ondismiss: () => {
            setStep('confirm');
            setError('Payment cancelled. You can try again.');
          }
        },
        handler: async (response) => {
          try {
            // 3. Verify payment with backend
            const verifyRes = await axiosInstance.post(
              '/api/payment/company/verify-payment',
              {
                projectId: project._id,
                milestonePercentage,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              { withCredentials: true }
            );

            if (verifyRes.data.success) {
              setStep('success');
              setTimeout(() => {
                onSuccess?.();
                onClose?.();
              }, 2200);
            } else {
              setStep('confirm');
              setError(verifyRes.data.message || 'Payment verification failed');
            }
          } catch (err) {
            setStep('confirm');
            setError(err.response?.data?.message || 'Payment verification failed. Contact support with your payment ID: ' + response.razorpay_payment_id);
          }
        },
      });

      rzp.open();
      // While Razorpay popup is open keep "processing" state quiet — will change on handler/dismiss
      setStep('confirm'); // Reset so user sees "processing" only before checkout opens

    } catch (err) {
      setStep('confirm');
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Failed to initiate payment'
      );
    }
  };

  const handleTestSkip = async () => {
    if (!details) return;
    if (details.amount <= 0) {
      setError('No payable amount is pending for this phase.');
      return;
    }

    setError(null);
    setStep('processing');

    try {
      const testRes = await axiosInstance.post(
        '/api/payment/company/test-mark-paid',
        {
          projectId: project._id,
          milestonePercentage,
          testAmount: details.amount,
        },
        { withCredentials: true }
      );

      if (testRes.data.success) {
        setStep('success');
        setTimeout(() => {
          onSuccess?.();
          onClose?.();
        }, 1500);
      } else {
        setStep('confirm');
        setError(testRes.data.message || 'Failed to mark payment in test mode');
      }
    } catch (err) {
      setStep('confirm');
      setError(
        err.response?.data?.message ||
        err.message ||
        'Failed to mark payment in test mode'
      );
    }
  };

  if (!isOpen) return null;
  if (!details) return null;

  return (
    <div className="cpm-overlay" onClick={(e) => e.target === e.currentTarget && step !== 'processing' && onClose?.()}>
      <div className="cpm-modal">

        {/* ── Header ── */}
        <div className="cpm-header">
          <div className="cpm-header-left">
            <span className="cpm-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
              </svg>
              Secured by Razorpay
            </span>
            <h2 className="cpm-title">Complete Payment</h2>
            <p className="cpm-subtitle">{details.stageLabel}</p>
          </div>
          {step !== 'processing' && step !== 'success' && (
            <button className="cpm-close" onClick={onClose}>×</button>
          )}
        </div>

        {/* ── Success state ── */}
        {step === 'success' && (
          <div className="cpm-success-state">
            <div className="cpm-success-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            </div>
            <h3 className="cpm-success-title">Payment Successful!</h3>
            <p className="cpm-success-msg">
              {fmt(details.initialReleaseAmount)} has been paid and released to the company.<br />
              {details.isFinalStage
                ? 'This phase is now fully paid.'
                : 'Pay the remaining 25% after milestone approval.'}
            </p>
          </div>
        )}

        {/* ── Confirm / processing state ── */}
        {step !== 'success' && (
          <>
            <div className="cpm-body">
              {/* Project info */}
              <div className="cpm-project-info">
                <span className="cpm-project-name">{details.projectName}</span>
                <span className="cpm-project-meta">{details.milestone} · {milestonePercentage}% of total project</span>
              </div>

              {/* Amount hero */}
              <div className="cpm-amount-hero">
                <p className="cpm-amount-label">Amount to Pay</p>
                <p className="cpm-amount-value">{fmt(details.amount)}</p>
                <p className="cpm-amount-note">
                  {details.isFinalStage
                    ? 'Final stage payment is collected in installment(s) if needed.'
                    : `Initial ${INITIAL_RELEASE_PERCENT}% is paid now. Remaining ${HOLD_PERCENT}% is paid after approval.`}
                </p>
                {details.installmentCountForStage > 1 && (
                  <p className="cpm-amount-note">
                    Installment {details.currentInstallmentNumber} of {details.installmentCountForStage} for this stage.
                  </p>
                )}
              </div>

              {/* Breakdown */}
              <div className="cpm-breakdown">
                <p className="cpm-breakdown-title">Payment Breakdown</p>
                <div className="cpm-breakdown-row highlight">
                  <span>You Pay</span>
                  <span>{fmt(details.amount)}</span>
                </div>
                <div className="cpm-breakdown-row company-row">
                  <span>{details.isFinalStage ? 'Released to Company (Final Stage)' : `Released to Company Now (${INITIAL_RELEASE_PERCENT}%)`}</span>
                  <span>{fmt(details.initialReleaseAmount)}</span>
                </div>
                <div className="cpm-breakdown-row platform-row">
                  <span>Current Stage Total</span>
                  <span>{fmt(details.stageTargetAmount)}</span>
                </div>
                <div className="cpm-breakdown-row platform-row">
                  <span>Stage Remaining After This Installment</span>
                  <span>{fmt(Math.max(details.stageRemainingAmount - details.amount, 0))}</span>
                </div>
                <div className="cpm-breakdown-row platform-row">
                  <span>Total Phase Remaining</span>
                  <span>{fmt(Math.max(details.remainingAmount - details.amount, 0))}</span>
                </div>
              </div>

              {/* Info note */}
              <div className="cpm-info-note">
                <span className="cpm-info-icon">🔒</span>
                <span>
                  Phase payments are collected in two steps: 75% now and remaining 25% after your approval.
                  Your payment is only for company phase delivery.
                </span>
              </div>

              {/* Error */}
              {error && <div className="cpm-error">{error}</div>}
            </div>

            {/* Footer */}
            <div className="cpm-footer">
              <button
                className="cpm-pay-btn"
                onClick={handlePay}
                disabled={step === 'processing' || details.amount <= 0}
              >
                {step === 'processing' ? (
                  <><div className="cpm-spinner" /> Processing…</>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
                    </svg>
                    {details.amount > 0 ? `Pay ${fmt(details.amount)}` : 'No Payment Due'}
                  </>
                )}
              </button>
              {ENABLE_TEST_SKIP && (
                <button
                  className="cpm-test-btn"
                  onClick={handleTestSkip}
                  disabled={step === 'processing' || details.amount <= 0}
                >
                  Mark as Paid (Test Mode)
                </button>
              )}
              <button className="cpm-cancel-btn" onClick={onClose} disabled={step === 'processing'}>
                Cancel
              </button>
              {ENABLE_TEST_SKIP && (
                <div className="cpm-test-note">
                  Test mode shortcut: skips Razorpay form and marks current installment as paid.
                </div>
              )}
              <div className="cpm-razorpay-note">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                </svg>
                256-bit SSL encrypted · Powered by Razorpay
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CompanyPaymentModal;
