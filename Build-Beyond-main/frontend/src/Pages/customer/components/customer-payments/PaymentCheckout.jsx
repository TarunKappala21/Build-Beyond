// src/Pages/customer/components/customer-payments/PaymentCheckout.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import axiosInstance from '../../../../api/axiosInstance';
import CustomerPageLoader from "../common/CustomerPageLoader";
import "./PaymentCheckout.css";

const PLATFORM_FEE_COMMISSION = 5;
const ENABLE_TEST_SKIP =
  import.meta.env.DEV ||
  import.meta.env.VITE_ENABLE_TEST_PAYMENT_SKIP === "true";

const PaymentCheckout = () => {
  const { projectId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const projectType = searchParams.get("type"); // 'architect' or 'interior'
  const paymentType = searchParams.get("payment"); // 'deposit' or 'milestone'
  const milestonePercentage = searchParams.get("milestone"); // 25, 50, 75, 100

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  // Load Razorpay script
  useEffect(() => {
    if (document.getElementById("razorpay-script")) return;
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    fetchProjectDetails();
  }, [projectId, projectType]);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const endpoint =
        projectType === "architect"
          ? `/api/architect-hiring/${projectId}`
          : `/api/design-request/${projectId}`;

      const res = await axiosInstance.get(endpoint, { withCredentials: true });
      setProject(res.data);
    } catch (err) {
      setError("Failed to load project details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentDetails = () => {
    if (!project) return null;

    // Get the proposal price which is the total project cost
    // For architect hiring: use proposal.price
    // For interior design: use finalAmount
    const finalAmount =
      projectType === "architect"
        ? project.proposal?.price || 0
        : project.finalAmount || 0;

    if (!finalAmount) {
      console.error("No valid price found in project:", project);
      return null;
    }

    if (paymentType === "deposit") {
      // Initial 25% deposit
      const depositAmount = (finalAmount * 25) / 100;
      const platformFee = (depositAmount * PLATFORM_FEE_COMMISSION) / 100;
      const workerAmount = depositAmount - platformFee;
      const immediateToWorker = workerAmount * 0.6; // 60% of worker portion released immediately
      const heldForMilestone = workerAmount * 0.4; // 40% held for first milestone

      return {
        title: "Initial Deposit Payment",
        subtitle: "Pay 25% to start your project",
        amount: depositAmount,
        percentage: 25,
        description:
          "Worker receives a portion immediately to start work. Remaining held for milestone approval.",
        breakdown: [
          { label: "Total Project Cost", value: finalAmount },
          {
            label: "Deposit Required (25%)",
            value: depositAmount,
            highlight: true,
          },
          {
            label: "Platform Fee (" + PLATFORM_FEE_COMMISSION + "%)",
            value: platformFee,
            info: true,
          },
          { label: "Worker Receives", value: workerAmount, info: true },
          {
            label: "Remaining Amount",
            value: finalAmount - depositAmount,
            muted: true,
          },
        ],
      };
    } else if (paymentType === "milestone") {
      // Milestone payment
      const milestonePerc = parseFloat(milestonePercentage);
      const milestoneAmount = finalAmount / 4;
      const platformFee = (milestoneAmount * PLATFORM_FEE_COMMISSION) / 100;
      const workerAmount = milestoneAmount - platformFee;

      const milestoneOrder = [25, 50, 75, 100];
      const milestoneIndex = Math.max(0, milestoneOrder.indexOf(milestonePerc));
      const alreadyPaid = (finalAmount / 4) * milestoneIndex;
      const alreadyPaidPercentage = milestoneIndex * 25;
      const remainingAfterThis = finalAmount - alreadyPaid - milestoneAmount;

      return {
        title: `Milestone ${milestonePercentage}% Payment`,
        subtitle: `Payment for ${milestonePercentage}% milestone completion`,
        amount: milestoneAmount,
        percentage: milestonePerc,
        description:
          "This payment will be held in escrow until you approve the milestone work.",
        breakdown: [
          { label: "Total Project Cost", value: finalAmount },
          {
            label: `Already Paid (${alreadyPaidPercentage}%)`,
            value: alreadyPaid,
            muted: true,
          },
          {
            label: `This Payment (${milestonePerc}% milestone)`,
            value: milestoneAmount,
            highlight: true,
          },
          {
            label: "Platform Fee (" + PLATFORM_FEE_COMMISSION + "%)",
            value: platformFee,
            info: true,
          },
          { label: "Worker Receives", value: workerAmount, info: true },
          {
            label: "Remaining After This",
            value: remainingAfterThis,
            muted: true,
          },
        ],
      };
    }

    return null;
  };

  const fmt = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

  const handleBackNavigation = () => {
    if (paymentType === "milestone") {
      navigate("/customerdashboard/ongoing_projects");
      return;
    }
    navigate("/customerdashboard/job_status");
  };

  const handleConfirmPayment = async () => {
    setProcessing(true);
    setError(null);

    try {
      const milestoneValue =
        paymentType === "deposit" ? 25 : Number(milestonePercentage);

      const orderPayload = {
        projectId,
        projectType,
        paymentType,
        ...(paymentType === "milestone" && {
          milestonePercentage: milestoneValue,
        }),
      };

      const orderRes = await axiosInstance.post(
        "/api/payment/worker/create-order",
        orderPayload,
        { withCredentials: true },
      );
      const { razorpayOrderId, amountInPaise, currency, keyId } =
        orderRes.data.data;

      const rzp = new window.Razorpay({
        key: keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: amountInPaise,
        currency: currency || "INR",
        name: "Build & Beyond",
        description:
          paymentType === "deposit"
            ? "Initial Deposit Payment"
            : `${milestoneValue}% Milestone Payment`,
        order_id: razorpayOrderId,
        handler: async (response) => {
          try {
            const verifyPayload = {
              projectId,
              projectType,
              paymentType,
              milestonePercentage: milestoneValue,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            };

            const verifyRes = await axiosInstance.post(
              "/api/payment/worker/verify-payment",
              verifyPayload,
              { withCredentials: true },
            );
            if (!verifyRes.data?.success) {
              throw new Error(
                verifyRes.data?.message || "Payment verification failed",
              );
            }

            navigate("/customerdashboard/ongoing_projects", {
              state: {
                message:
                  "Payment successful! Funds are held in escrow for this milestone.",
                type: "success",
              },
            });
          } catch (verifyErr) {
            setProcessing(false);
            setError(
              verifyErr.response?.data?.message ||
                verifyErr.message ||
                "Payment verification failed",
            );
          }
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
          },
        },
        theme: { color: "#2563eb" },
      });

      rzp.open();
    } catch (err) {
      setError(err.response?.data?.message || "Payment processing failed");
      setProcessing(false);
    }
  };

  const handleTestMarkPaid = async () => {
    setProcessing(true);
    setError(null);

    try {
      const milestoneValue =
        paymentType === "deposit" ? 25 : Number(milestonePercentage);

      const payload = {
        projectId,
        projectType,
        paymentType,
        ...(paymentType === "milestone" && {
          milestonePercentage: milestoneValue,
        }),
      };

      const testRes = await axiosInstance.post(
        "/api/payment/worker/test-mark-paid",
        payload,
        {
          withCredentials: true,
        },
      );

      if (!testRes.data?.success) {
        throw new Error(testRes.data?.message || "Test payment failed");
      }

      navigate("/customerdashboard/ongoing_projects", {
        state: {
          message:
            testRes.data?.message ||
            "Test payment marked successfully. Funds are held in escrow for this milestone.",
          type: "success",
        },
      });
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Test payment failed",
      );
      setProcessing(false);
    }
  };

  if (loading) {
    return <CustomerPageLoader message="Loading payment details..." />;
  }

  if (error && !project) {
    return (
      <div className="copck-container">
        <div className="copck-error">
          <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          <h3>Error Loading Payment</h3>
          <p>{error}</p>
          <button className="copck-back-btn" onClick={handleBackNavigation}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const paymentDetails = getPaymentDetails();

  if (!paymentDetails) {
    return <div className="copck-container">Invalid payment type</div>;
  }

  return (
    <div className="copck-container">
      <div className="copck-content">
        {/* Header */}
        <div className="copck-header">
          <button className="copck-back-link" onClick={handleBackNavigation}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
            Back
          </button>
        </div>

        {/* Main Card */}
        <div className="copck-card">
          <div className="copck-title-section">
            <h1>{paymentDetails.title}</h1>
            <p className="copck-subtitle">{paymentDetails.subtitle}</p>
          </div>

          {/* Project Info */}
          <div className="copck-project-info">
            <h3>Project Details</h3>
            <div className="copck-info-grid">
              <div className="copck-info-item">
                <span className="copck-info-label">Project Name:</span>
                <span className="copck-info-value">
                  {project.projectName ||
                    project.projectType ||
                    project.location ||
                    "Project"}
                </span>
              </div>
              <div className="copck-info-item">
                <span className="copck-info-label">Project Type:</span>
                <span className="copck-info-value">
                  {projectType === "architect"
                    ? "Architect Hiring"
                    : "Interior Design"}
                </span>
              </div>
              <div className="copck-info-item">
                <span className="copck-info-label">Worker:</span>
                <span className="copck-info-value">
                  {(projectType === "architect"
                    ? project.worker?.name
                    : project.workerId?.name) || "Professional Worker"}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Breakdown */}
          <div className="copck-breakdown">
            <h3>Payment Breakdown</h3>
            <div className="copck-breakdown-list">
              {paymentDetails.breakdown.map((item, index) => (
                <div
                  key={index}
                  className={`copck-breakdown-row ${item.highlight ? "highlight" : ""} ${item.muted ? "muted" : ""} ${item.info ? "info" : ""}`}
                >
                  <span>{item.label}</span>
                  <strong>₹{item.value.toLocaleString()}</strong>
                </div>
              ))}
            </div>
          </div>

          {/* Escrow Info */}
          <div className="copck-escrow-info">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
            </svg>
            <div>
              <strong>Secure Escrow Protection</strong>
              <p>{paymentDetails.description}</p>
            </div>
          </div>

          {error && (
            <div className="copck-error-message">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              {error}
            </div>
          )}

          {/* Payment Total */}
          <div className="copck-total">
            <div className="copck-total-label">
              <span>Total Amount to Pay</span>
              <small>Including all charges</small>
            </div>
            <div className="copck-total-amount">
              ₹{paymentDetails.amount.toLocaleString()}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="copck-actions">
            <button
              className="copck-cancel-btn"
              onClick={handleBackNavigation}
              disabled={processing}
            >
              Cancel
            </button>
            <button
              className="copck-confirm-btn"
              onClick={handleConfirmPayment}
              disabled={processing}
            >
              {processing ? (
                <>
                  <div className="copck-btn-spinner"></div>
                  Processing...
                </>
              ) : (
                <>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
                  </svg>
                  Confirm and Pay ₹{paymentDetails.amount.toLocaleString()}
                </>
              )}
            </button>
            {ENABLE_TEST_SKIP && (
              <button
                className="copck-cancel-btn"
                onClick={handleTestMarkPaid}
                disabled={processing}
              >
                Mark as Paid (Test Mode)
              </button>
            )}
          </div>

          {/* Payment Gateway Note */}
          <div className="copck-gateway-note">
            <p>
              <strong>Note:</strong> Payments are processed securely via
              Razorpay and held in escrow based on milestone rules.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCheckout;
