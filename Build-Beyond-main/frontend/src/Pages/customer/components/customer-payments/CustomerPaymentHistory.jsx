// src/Pages/customer/components/customer-payments/CustomerPaymentHistory.jsx
import React, { useState, useEffect } from "react";
import axiosInstance from '../../../../api/axiosInstance';
import { useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";
import CustomerPageLoader from "../common/CustomerPageLoader";
import "./CustomerPaymentHistory.css";

const CustomerPaymentHistory = () => {
  const [searchParams] = useSearchParams();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, architect, interior, company
  const [stats, setStats] = useState({
    totalPaid: 0,
    totalRefunded: 0,
    netPaid: 0,
    totalProjects: 0,
    pendingPayments: 0,
  });

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  useEffect(() => {
    const transactionId = searchParams.get("transactionId");
    if (!transactionId || payments.length === 0) return;

    const scrollTimer = window.setTimeout(() => {
      document.getElementById(`coph-${transactionId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);

    const highlightTimer = window.setTimeout(() => {
      const targetElement = document.getElementById(`coph-${transactionId}`);
      if (!targetElement) return;

      targetElement.classList.add("coph-notification-highlight");
      window.setTimeout(() => {
        targetElement.classList.remove("coph-notification-highlight");
      }, 3500);
    }, 200);

    return () => {
      window.clearTimeout(scrollTimer);
      window.clearTimeout(highlightTimer);
    };
  }, [searchParams, payments]);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      // Fetch customer's payment transactions
      const res = await axiosInstance.get("/api/customer/payment-history", {
        withCredentials: true,
      });

      if (res.data.success) {
        setPayments(res.data.transactions || []);
        setStats(res.data.stats || stats);
      }
    } catch (err) {
      console.error("Error fetching payment history:", err);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case "escrow_hold":
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
          </svg>
        );
      case "milestone_release":
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
          </svg>
        );
      case "refund":
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 11v2h10v-2H7zm5-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
          </svg>
        );
      default:
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="black">
            <text
              x="4"
              y="20"
              font-size="18"
              fill="white"
              font-family="Arial, sans-serif"
            >
              ₹
            </text>
          </svg>
        );
    }
  };

  const getTypeBadgeClass = (hiredType) => {
    if (hiredType === "architect") return "coph-type-architect";
    if (hiredType === "interior") return "coph-type-interior";
    if (hiredType === "company") return "coph-type-company";
    return "coph-type-other";
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      completed: { label: "Completed", className: "coph-status-completed" },
      pending: { label: "Pending", className: "coph-status-pending" },
      failed: { label: "Failed", className: "coph-status-failed" },
      refunded: { label: "Refunded", className: "coph-status-refunded" },
    };

    const statusInfo = statusMap[status] || { label: status, className: "" };
    return (
      <span className={`coph-status-badge ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFilteredPayments = () => {
    if (filter === "all") return payments;
    return payments.filter((p) => p.hiredType === filter);
  };

  const filteredPayments = getFilteredPayments();

  const groupedPayments = filteredPayments.reduce((acc, payment) => {
    const key = payment.hiredType || "other";
    if (!acc[key]) {
      acc[key] = {
        label: payment.hiredTypeLabel || "Other",
        items: [],
      };
    }
    acc[key].items.push(payment);
    return acc;
  }, {});

  const groupOrder = ["architect", "interior", "company", "other"];

  const getProjectRoute = (payment) => {
    if (!payment?.projectId) return null;

    if (payment.hiredType === "architect" || payment.hiredType === "interior") {
      const tab = payment.hiredType;
      const section = payment?.milestonePercentage ? "milestones" : "details";
      return `/customerdashboard/job_status?projectId=${payment.projectId}&tab=${tab}&section=${section}`;
    }

    const section = payment?.milestonePercentage ? "milestones" : "details";
    return `/customerdashboard/ongoing_projects?projectId=${payment.projectId}&section=${section}`;
  };

  if (loading) {
    return <CustomerPageLoader message="Loading payment history..." />;
  }

  return (
    <div className="coph-container">
      <div className="coph-header">
        <div>
          <h1>Payment History</h1>
          <p>Track all your payments and transactions</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="coph-stats-grid">
        <div className="coph-stat-card">
          <div
            className="coph-stat-icon"
            style={{
              background: "linear-gradient(135deg, #1a237e, #283593)",
              fontSize: "25px",
              color: "white",
            }}
          >
            ₹
          </div>
          <div className="coph-stat-content">
            <span className="coph-stat-label">Total Paid</span>
            <strong className="coph-stat-value">
              ₹{stats.totalPaid.toLocaleString()}
            </strong>
          </div>
        </div>

        <div className="coph-stat-card">
          <div
            className="coph-stat-icon"
            style={{ background: "linear-gradient(135deg, #27ae60, #229954)" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
            </svg>
          </div>
          <div className="coph-stat-content">
            <span className="coph-stat-label">Active Projects</span>
            <strong className="coph-stat-value">{stats.totalProjects}</strong>
          </div>
        </div>

        <div className="coph-stat-card">
          <div
            className="coph-stat-icon"
            style={{ background: "linear-gradient(135deg, #e67e22, #d35400)" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          </div>
          <div className="coph-stat-content">
            <span className="coph-stat-label">Pending Payments</span>
            <strong className="coph-stat-value">{stats.pendingPayments}</strong>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="coph-filters">
        <button
          className={`coph-filter-btn ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All Types
        </button>
        <button
          className={`coph-filter-btn ${filter === "architect" ? "active" : ""}`}
          onClick={() => setFilter("architect")}
        >
          Architect
        </button>
        <button
          className={`coph-filter-btn ${filter === "interior" ? "active" : ""}`}
          onClick={() => setFilter("interior")}
        >
          Interior Designer
        </button>
        <button
          className={`coph-filter-btn ${filter === "company" ? "active" : ""}`}
          onClick={() => setFilter("company")}
        >
          Companies
        </button>
      </div>

      {/* Payments List */}
      <div className="coph-payments-container">
        {filteredPayments.length === 0 ? (
          <div className="coph-no-payments">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="#e0e0e0">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" />
            </svg>
            <h3>No Payments Found</h3>
            <p>No payment records match your filter criteria</p>
          </div>
        ) : (
          <div className="coph-payments-list">
            {groupOrder
              .filter((groupKey) => groupedPayments[groupKey]?.items?.length)
              .map((groupKey) => {
                const section = groupedPayments[groupKey];
                const sectionTotal = section.items.reduce(
                  (sum, item) => sum + Number(item.amount || 0),
                  0,
                );

                return (
                  <section key={groupKey} className="coph-type-section">
                    <div className="coph-type-header">
                      <div>
                        <h3>{section.label}</h3>
                        <p>{section.items.length} payment records</p>
                      </div>
                      <strong>₹{sectionTotal.toLocaleString()}</strong>
                    </div>

                    {section.items.map((payment) => (
                      <div
                        key={payment._id}
                        id={`coph-${payment._id}`}
                        className="coph-payment-card"
                      >
                        <div className="coph-payment-icon">
                          {getTransactionIcon(payment.transactionType)}
                        </div>

                        <div className="coph-payment-details">
                          <div className="coph-payment-main">
                            <div>
                              <h3>
                                {getProjectRoute(payment) ? (
                                  <Link
                                    to={getProjectRoute(payment)}
                                    className="coph-project-link"
                                  >
                                    {payment.projectName || payment.description}
                                  </Link>
                                ) : (
                                  payment.projectName || payment.description
                                )}
                              </h3>
                              <p className="coph-purpose-text">
                                Paid for: {payment.paymentPurpose || "Payment"}
                              </p>
                            </div>
                            <div className="coph-main-badges">
                              <span
                                className={`coph-type-badge ${getTypeBadgeClass(payment.hiredType)}`}
                              >
                                {payment.hiredTypeLabel || "Other"}
                              </span>
                              {getStatusBadge(payment.status)}
                            </div>
                          </div>

                          <div className="coph-payment-meta">
                            <span className="coph-payment-date">
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                              </svg>
                              {formatDate(payment.createdAt)}
                            </span>

                            {payment.providerName && (
                              <span className="coph-milestone-badge">
                                Provider: {payment.providerName}
                              </span>
                            )}

                            {payment.milestonePercentage && (
                              <span className="coph-milestone-badge">
                                Milestone {payment.milestonePercentage}%
                              </span>
                            )}

                            <span className="coph-milestone-badge">
                              Method:{" "}
                              {(payment.paymentMethod || "").toUpperCase()}
                            </span>
                          </div>
                        </div>

                        <div className="coph-payment-amount">
                          <div className="coph-amount-main">
                            ₹{Number(payment.amount || 0).toLocaleString()}
                          </div>
                          {Number(payment.platformFee || 0) > 0 && (
                            <div className="coph-amount-fee">
                              Platform fee: ₹
                              {Number(payment.platformFee).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </section>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerPaymentHistory;
