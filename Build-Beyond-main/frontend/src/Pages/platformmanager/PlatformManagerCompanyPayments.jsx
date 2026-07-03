import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";

const currency = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const PlatformManagerCompanyPayments = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({ totalItems: 0, totalPendingFees: 0 });
  const [items, setItems] = useState([]);
  const [busyKey, setBusyKey] = useState("");

  const fetchQueue = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/platform-manager/company-payments", {
        credentials: "include",
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to load payment queue");
      }
      setSummary(result.summary || { totalItems: 0, totalPendingFees: 0 });
      setItems(result.items || []);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleCollect = async (item) => {
    const key = `${item.projectType}-${item.projectId}-${item.milestonePercentage}`;
    try {
      setBusyKey(key);
      const response = await fetch(
        `/api/platform-manager/company-payments/${item.projectId}/${item.milestonePercentage}/collect`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectType: item.projectType, notes: "Collected by platform manager" }),
        },
      );
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to collect platform fee");
      }
      await fetchQueue();
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setBusyKey("");
    }
  };

  return (
    <AdminLayout>
      <div className="pm-dashboard">
        <div className="pm-dashboard-header">
          <div>
            <h1>Company Payment Queue</h1>
            <p>Collect pending platform fees for company and worker milestones.</p>
          </div>
          <button className="refresh-btn" onClick={fetchQueue} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="pm-stats-grid">
          <div className="pm-stat-card">
            <h3>Pending Phases</h3>
            <p>{summary.totalItems || 0}</p>
          </div>
          <div className="pm-stat-card">
            <h3>Pending Platform Fees</h3>
            <p>{currency(summary.totalPendingFees)}</p>
          </div>
        </div>

        {error && <div className="pm-dashboard-error"><p>{error}</p></div>}

        <div className="pm-tasks-section">
          <h2>Collection Queue</h2>
          {items.length === 0 && !loading ? (
            <div className="pm-empty-state">
              <p>No platform fees are pending collection.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 16 }}>
              {items.map((item) => {
                const key = `${item.projectType}-${item.projectId}-${item.milestonePercentage}`;
                return (
                  <div key={key} className="pm-task-card">
                    <div className="pm-task-header">
                      <div>
                        <h3>{item.projectName}</h3>
                        <p>{item.phaseName} · {item.milestonePercentage}% · {item.itemType === "company" ? "Company" : "Worker"}</p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <strong>{currency(item.platformFee)}</strong>
                        <p style={{ margin: 0 }}>Platform fee</p>
                      </div>
                    </div>
                    <div className="pm-task-content">
                      <p><strong>{item.itemType === "company" ? "Company" : "Worker"}:</strong> {item.assigneeName}</p>
                      <p><strong>Customer:</strong> {item.customerName}</p>
                      <p><strong>Phase value:</strong> {currency(item.phaseAmount)}</p>
                      {item.itemType === "company" && (
                        <p>
                          <strong>Invoice:</strong>{" "}
                          {item.invoiceUrl ? (
                            <a href={item.invoiceUrl} target="_blank" rel="noreferrer">View Uploaded Invoice</a>
                          ) : (
                            <span style={{ color: "#b91c1c" }}>Awaiting upload from company</span>
                          )}
                        </p>
                      )}
                    </div>
                    <div className="pm-task-actions">
                      <button
                        className="pm-action-btn approve"
                        onClick={() => handleCollect(item)}
                        disabled={busyKey === key || (item.itemType === "company" && !item.invoiceUrl)}
                      >
                        {busyKey === key ? "Verifying..." : "Verify & Mark Collected"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default PlatformManagerCompanyPayments;