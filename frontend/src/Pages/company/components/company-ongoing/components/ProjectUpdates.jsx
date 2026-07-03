// src/pages/company/components/company-ongoing/components/ProjectUpdates.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE from "../../../../../api/backendBase";

const ENABLE_TEST_SKIP = import.meta.env.DEV || import.meta.env.VITE_ENABLE_TEST_PAYMENT_SKIP === 'true';

const getPhaseForMilestone = (project, milestonePercentage) => {
  const phases = project?.proposal?.phases;
  if (!Array.isArray(phases) || phases.length === 0) return null;
  const index = Math.min(
    Math.max(Math.floor(milestonePercentage / 25) - 1, 0),
    phases.length - 1
  );
  return phases[index] || null;
};

const ProjectUpdates = ({ project, expandedUpdates, onRefresh }) => {
  const navigate = useNavigate();
  const [invoiceFiles, setInvoiceFiles] = useState({});
  const [uploadingKey, setUploadingKey] = useState('');
  const [payingFeeKey, setPayingFeeKey] = useState('');
  const [testPayingFeeKey, setTestPayingFeeKey] = useState('');
  const [uploadError, setUploadError] = useState('');

  const makeFeeKey = (projectId, milestonePercentage) => `${projectId}_${milestonePercentage}`;

  useEffect(() => {
    if (document.getElementById('razorpay-script')) return;
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const handleInvoiceUpload = async (projectId, milestonePercentage) => {
    const key = makeFeeKey(projectId, milestonePercentage);
    const file = invoiceFiles[key];
    if (!file) {
      setUploadError('Please select an invoice before submitting.');
      return;
    }

    const formData = new FormData();
    formData.append('projectId', projectId);
    formData.append('milestonePercentage', milestonePercentage);
    formData.append('invoice', file);

    try {
      setUploadingKey(key);
      setUploadError('');
      const response = await fetch(`${API_BASE}/api/company/platform-fee-invoice`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to upload invoice');
      }
      setInvoiceFiles((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err) {
      setUploadError(err.message || String(err));
    } finally {
      setUploadingKey('');
    }
  };

  const handlePlatformFeePayment = async (projectId, milestonePercentage) => {
    const key = makeFeeKey(projectId, milestonePercentage);

    try {
      setPayingFeeKey(key);
      setUploadError('');

      const orderResponse = await fetch(`${API_BASE}/api/payment/company/platform-fee/create-order`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, milestonePercentage }),
      });

      const orderResult = await orderResponse.json();
      if (!orderResponse.ok || !orderResult.success) {
        throw new Error(orderResult.message || orderResult.error || 'Failed to create platform fee order');
      }

      if (!window.Razorpay) {
        throw new Error('Razorpay SDK not loaded. Please refresh and try again.');
      }

      const { razorpayOrderId, amountInPaise, currency, keyId, phaseName, amount } = orderResult.data;

      const rzp = new window.Razorpay({
        key: keyId,
        amount: amountInPaise,
        currency: currency || 'INR',
        order_id: razorpayOrderId,
        name: 'Build & Beyond',
        description: `Platform fee (${phaseName || `${milestonePercentage}% phase`})`,
        handler: async (response) => {
          try {
            const verifyResponse = await fetch(`${API_BASE}/api/payment/company/platform-fee/verify-payment`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                projectId,
                milestonePercentage,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyResult = await verifyResponse.json();
            if (!verifyResponse.ok || !verifyResult.success) {
              throw new Error(verifyResult.message || verifyResult.error || 'Platform fee verification failed');
            }

            if (onRefresh) {
              await onRefresh();
            }
          } catch (err) {
            setUploadError(err.message || String(err));
          } finally {
            setPayingFeeKey('');
          }
        },
        modal: {
          ondismiss: () => {
            setPayingFeeKey('');
          },
        },
        theme: { color: '#1d4ed8' },
      });

      rzp.open();
    } catch (err) {
      setUploadError(err.message || String(err));
      setPayingFeeKey('');
    }
  };

  const handlePlatformFeeTestMarkPaid = async (projectId, milestonePercentage) => {
    const key = makeFeeKey(projectId, milestonePercentage);
    try {
      setTestPayingFeeKey(key);
      setUploadError('');

      const response = await fetch(`${API_BASE}/api/payment/company/platform-fee/test-mark-paid`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, milestonePercentage }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || result.error || 'Failed to mark platform fee paid in test mode');
      }

      if (onRefresh) {
        await onRefresh();
      }
    } catch (err) {
      setUploadError(err.message || String(err));
    } finally {
      setTestPayingFeeKey('');
    }
  };

  if (!expandedUpdates[project._id]) return null;

  return (
    <div className="ongoing-project-updates ongoing-active">
      <h3>Project Progress & Updates</h3>
      
      {/* Milestone Progress Section (only checkpoints: 25/50/75/100) */}
      {project.milestones && project.milestones.length > 0 && (
        <>
          <h4 className="ongoing-updates-subtitle">Milestone Updates</h4>
          <div className="ongoing-milestones-list">
            {project.milestones
              .sort((a, b) => a.percentage - b.percentage)
              .filter((m) => m.isCheckpoint)
              .map((milestone, idx) => (
                <div 
                  key={idx} 
                  className={`ongoing-milestone-item ${
                    milestone.isApprovedByCustomer ? 'milestone-approved' : 
                    milestone.needsRevision ? 'milestone-revision' : 
                    'milestone-pending'
                  }`}
                >
                  <div className="ongoing-milestone-header">
                    <div>
                      <h4 className="ongoing-milestone-title">
                        {getPhaseForMilestone(project, milestone.percentage)?.name || `${milestone.percentage}% Milestone`}
                        <span className="milestone-status-label">
                          {` (${milestone.percentage}%)`}
                        </span>
                        {milestone.isApprovedByCustomer ? (
                          <span className="milestone-status milestone-status-approved">
                            ✓ Approved by Customer
                          </span>
                        ) : milestone.needsRevision ? (
                          <span className="milestone-status milestone-status-revision">
                            ⚠ Revision Requested - Update Required
                          </span>
                        ) : (
                          <span className="milestone-status milestone-status-pending">
                            ⏳ Awaiting Customer Approval
                          </span>
                        )}
                      </h4>
                      <div className="ongoing-milestone-dates">
                        Submitted: {new Date(milestone.submittedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                        {milestone.approvedAt && (
                          <span className="milestone-approved-date">
                            Approved: {new Date(milestone.approvedAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "long",
                              year: "numeric"
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="ongoing-milestone-message">
                    <strong>Latest Company Message:</strong>
                    <p>{milestone.companyMessage}</p>
                  </div>

                  {(() => {
                    const phase = getPhaseForMilestone(project, milestone.percentage);
                    if (!phase) return null;
                    return (
                      <div className="ongoing-milestone-message">
                        <strong>Company Proposed Details:</strong>
                        <p><strong>Phase:</strong> {phase.name || "Phase"}</p>
                        <p><strong>Required Months:</strong> {phase.requiredMonths || "N/A"}</p>
                        <p><strong>Phase Amount:</strong> <span style={{ color: "#d32f2f", fontWeight: "bold" }}>₹{phase.amount ? Number(phase.amount).toLocaleString('en-IN') : "0"}</span></p>
                        
                        {/* Payment Schedule */}
                        <div style={{ backgroundColor: "#f0f4ff", padding: "10px", borderRadius: "4px", marginTop: "10px", marginBottom: "10px" }}>
                          <p style={{ fontSize: "12px", fontWeight: "bold", color: "#1a73e8", margin: "0 0 8px 0" }}>
                            💰 Payment Schedule for this Phase:
                          </p>
                          <p style={{ fontSize: "12px", color: "#666", margin: "0 0 5px 0" }}>
                            🚀 Released at phase start: <strong>₹{phase.amount ? Math.round(Number(phase.amount) * 0.75).toLocaleString('en-IN') : "0"}</strong> (75%)
                          </p>
                          <p style={{ fontSize: "12px", color: "#666", margin: "0 0 5px 0" }}>
                            🔒 Held until customer approval: <strong>₹{phase.amount ? Math.round(Number(phase.amount) * 0.25).toLocaleString('en-IN') : "0"}</strong> (25%)
                          </p>
                          <p style={{ fontSize: "12px", color: "#7c2d12", margin: "0" }}>
                            🧾 Platform fee due after full payout: <strong>₹{phase.amount ? Math.round(Number(phase.amount) * 0.05).toLocaleString('en-IN') : "0"}</strong> (5%)
                          </p>
                        </div>

                        {/* Work Items */}
                        {phase.subdivisions && phase.subdivisions.length > 0 && (
                          <div className="ongoing-conversation-messages">
                            <p style={{ fontSize: "12px", fontWeight: "bold", color: "#333", marginBottom: "8px" }}>Work Items Breakdown:</p>
                            {phase.subdivisions.map((sub, sIdx) => (
                              <div key={sIdx} className="ongoing-conversation-msg msg-company">
                                <div className="msg-header">
                                  <strong className="msg-sender">🧱 {sub.category || "Work Item"}</strong>
                                </div>
                                <p className="msg-content">
                                  {sub.description || ""}
                                  {sub.amount ? ` - ₹${Number(sub.amount).toLocaleString('en-IN')}` : ""}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  
                  {/* Conversation History */}
                  {milestone.conversation && milestone.conversation.length > 0 && (
                    <div className="ongoing-conversation-history">
                      <strong className="conversation-title">
                        💬 Conversation History ({milestone.conversation.length} {milestone.conversation.length === 1 ? 'message' : 'messages'})
                      </strong>
                      <div className="ongoing-conversation-messages">
                        {milestone.conversation.map((msg, msgIdx) => (
                          <div 
                            key={msgIdx} 
                            className={`ongoing-conversation-msg ${msg.sender === 'company' ? 'msg-company' : 'msg-customer'}`}
                          >
                            <div className="msg-header">
                              <strong className="msg-sender">
                                {msg.sender === 'company' ? '🏢 Company' : '👤 Customer'}
                              </strong>
                              <span className="msg-timestamp">
                                {new Date(msg.timestamp).toLocaleString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </span>
                            </div>
                            <p className="msg-content">{msg.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {milestone.needsRevision && milestone.customerFeedback && (
                    <div className="ongoing-customer-feedback">
                      <strong>⚠ Action Required - Customer Feedback:</strong>
                      <p>{milestone.customerFeedback}</p>
                      <button
                        className="ongoing-edit-btn"
                        onClick={() => navigate(`../addnewproject?projectId=${project._id}&updateCheckpoint=${milestone.percentage}`)}
                      >
                        📝 Respond & Update
                      </button>
                    </div>
                  )}

                  {(() => {
                    const summary = (project.phasePaymentSummary || []).find(
                      (entry) => Number(entry.milestonePercentage) === Number(milestone.percentage),
                    );

                    const payout = (project.paymentDetails?.payouts || []).find(
                      (entry) => Number(entry.milestonePercentage) === Number(milestone.percentage),
                    );

                    const totalPhaseAmount = Number(payout?.amount || 0);
                    const paidSoFar = Number(payout?.customerPaidAmount || 0);
                    const upfrontTarget = Number(
                      payout?.immediateReleaseAmount || (totalPhaseAmount > 0 ? totalPhaseAmount * 0.75 : 0),
                    );
                    const completionTarget = Math.max(totalPhaseAmount - upfrontTarget, 0);
                    const completionPaidSoFar = Math.max(paidSoFar - upfrontTarget, 0);

                    const isUpfrontPaid = upfrontTarget > 0 && paidSoFar >= upfrontTarget;
                    const isCompletionPaid = completionTarget > 0
                      ? (payout?.status === 'released' || completionPaidSoFar >= completionTarget)
                      : false;

                    const fmt = (amount) => `Rs ${Number(amount || 0).toLocaleString('en-IN')}`;

                    const showPaymentBadges = Boolean(payout && totalPhaseAmount > 0);

                    const key = makeFeeKey(project._id, milestone.percentage);
                    const effectivePlatformFeeStatus =
                      summary?.platformFeeStatus ||
                      (payout?.status === 'released' && Number(payout?.platformFee || 0) > 0
                        ? (payout?.platformFeeStatus === 'not_due' ? 'pending' : payout?.platformFeeStatus)
                        : 'not_due');
                    const effectivePlatformFeeAmount = Number(summary?.platformFee ?? payout?.platformFee ?? 0);
                    const effectiveInvoiceUrl = summary?.platformFeeInvoiceUrl || payout?.platformFeeInvoiceUrl || null;
                    const hasInvoice = Boolean(effectiveInvoiceUrl);

                    return (
                      <>
                        {showPaymentBadges && (
                          <div
                            style={{
                              marginTop: '10px',
                              padding: '10px',
                              borderRadius: '6px',
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                            }}
                          >
                            <strong style={{ color: '#1e40af' }}>Phase Payment Status</strong>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                              <span
                                style={{
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  padding: '5px 10px',
                                  borderRadius: '999px',
                                  background: isUpfrontPaid ? '#dcfce7' : '#fef3c7',
                                  color: isUpfrontPaid ? '#166534' : '#92400e',
                                  border: `1px solid ${isUpfrontPaid ? '#86efac' : '#fcd34d'}`,
                                }}
                              >
                                75% Payment: {isUpfrontPaid ? 'Done' : 'Pending'} ({fmt(upfrontTarget)})
                              </span>
                              <span
                                style={{
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  padding: '5px 10px',
                                  borderRadius: '999px',
                                  background: isCompletionPaid ? '#dcfce7' : '#fef3c7',
                                  color: isCompletionPaid ? '#166534' : '#92400e',
                                  border: `1px solid ${isCompletionPaid ? '#86efac' : '#fcd34d'}`,
                                }}
                              >
                                25% Payment: {isCompletionPaid ? 'Done' : 'Pending'} ({fmt(completionTarget)})
                              </span>
                            </div>
                          </div>
                        )}

                        {['pending', 'collected'].includes(effectivePlatformFeeStatus) && (
                          <div
                            style={{
                              marginTop: '10px',
                              padding: '10px',
                              borderRadius: '6px',
                              background: '#fff7ed',
                              border: '1px solid #fed7aa',
                            }}
                          >
                            <strong style={{ color: '#9a3412' }}>Pay To Platform (5%)</strong>
                            <p style={{ margin: '6px 0', fontSize: '12px', color: '#7c2d12' }}>
                              Pay platform fee through Razorpay and upload invoice proof for records.
                            </p>
                            {effectivePlatformFeeStatus === 'pending' ? (
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '8px' }}>
                                <button
                                  className="ongoing-edit-btn"
                                  onClick={() => handlePlatformFeePayment(project._id, milestone.percentage)}
                                  disabled={payingFeeKey === key}
                                >
                                  {payingFeeKey === key
                                    ? 'Opening Razorpay...'
                                    : `Pay via Razorpay (Rs ${Number(effectivePlatformFeeAmount || 0).toLocaleString('en-IN')})`}
                                </button>
                                {ENABLE_TEST_SKIP && (
                                  <button
                                    className="ongoing-edit-btn"
                                    style={{ backgroundColor: '#7c3aed', color: '#fff' }}
                                    onClick={() => handlePlatformFeeTestMarkPaid(project._id, milestone.percentage)}
                                    disabled={testPayingFeeKey === key}
                                  >
                                    {testPayingFeeKey === key ? 'Marking Paid...' : 'Mark as Paid (Test Mode)'}
                                  </button>
                                )}
                              </div>
                            ) : (
                              <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#166534' }}>
                                Platform fee already paid.
                              </p>
                            )}
                            {ENABLE_TEST_SKIP && effectivePlatformFeeStatus === 'pending' && (
                              <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#6d28d9' }}>
                                Test mode shortcut is enabled for this environment.
                              </p>
                            )}
                            {hasInvoice ? (
                              <p style={{ margin: 0, fontSize: '12px', color: '#166534' }}>
                                Invoice uploaded.{' '}
                                <a href={effectiveInvoiceUrl} target="_blank" rel="noreferrer">View Invoice</a>
                              </p>
                            ) : (
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <input
                                  type="file"
                                  accept="image/*,application/pdf"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    setInvoiceFiles((prev) => ({ ...prev, [key]: file }));
                                  }}
                                />
                                <button
                                  className="ongoing-edit-btn"
                                  onClick={() => handleInvoiceUpload(project._id, milestone.percentage)}
                                  disabled={uploadingKey === key}
                                >
                                  {uploadingKey === key ? 'Uploading...' : 'Upload Invoice'}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              ))}
          </div>
        </>
      )}
      {uploadError && (
        <div style={{ marginTop: '8px', color: '#b91c1c', fontSize: '12px' }}>{uploadError}</div>
      )}
      
      {/* Completion Images & Customer Review Section */}
      {project.completionPercentage === 100 && (
        <>
          {/* Completion Images */}
          {project.completionImages && project.completionImages.length > 0 && (
            <div className="ongoing-completion-section">
              <h4 className="completion-title">📸 Project Completion Photos</h4>
              <div className="ongoing-completion-images">
                {project.completionImages.map((img, idx) => (
                  <img
                    key={idx}
                    src={`/${img}`}
                    alt={`Completion ${idx + 1}`}
                    className="completion-image"
                    onClick={() => window.open(`/${img}`, '_blank')}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Customer Review */}
          {project.customerReview?.rating && (
            <div className="ongoing-customer-review">
              <h4 className="review-title">⭐ Customer Review</h4>
              <div className="review-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span 
                    key={star} 
                    className={star <= project.customerReview.rating ? 'star-filled' : 'star-empty'}
                  >
                    ★
                  </span>
                ))}
                <span className="review-rating-value">
                  {project.customerReview.rating}/5
                </span>
              </div>
              {project.customerReview.reviewText && (
                <div className="review-text-container">
                  <p className="review-text">
                    "{project.customerReview.reviewText}"
                  </p>
                </div>
              )}
              <p className="review-date">
                <strong>Reviewed on:</strong> {new Date(project.customerReview.reviewDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric"
                })}
              </p>
            </div>
          )}
        </>
      )}
      
      <h4 className="ongoing-updates-subtitle">Recent Activity</h4>
      {project.recentUpdates && project.recentUpdates.length > 0 ? (
        project.recentUpdates.map((update, idx) => (
          <div key={idx} className="ongoing-update-item">
            <div className="ongoing-Updates-left-section">
              {update.updateImagePath && (
                <img src={update.updateImagePath} alt="Update" />
              )}
              <div className="ongoing-update-meta-date">
                {new Date(update.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
            </div>
            <div>
              <h4>Description:</h4>
              <p>{update.updateText}</p>
            </div>
          </div>
        ))
      ) : (
        <div className="ongoing-no-updates">
          <p>No recent updates for this project.</p>
        </div>
      )}
    </div>
  );
};

export default ProjectUpdates;
