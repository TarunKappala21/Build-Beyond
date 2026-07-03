import React, { useEffect, useState } from "react";
import { AlertCircle, CheckCircle, Loader2, MessageSquare, TrendingUp } from "lucide-react";
import AdminLayout from "../../components/admin/AdminLayout";
import "./PlatformManagerDashboard.css";

const PlatformManagerAssignedComplaints = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [complaintDetails, setComplaintDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [markResolved, setMarkResolved] = useState(false);
  const [replySubmitting, setReplySubmitting] = useState(false);

  const fetchAssignedComplaints = async () => {
    try {
      setError("");
      const response = await fetch("/api/platform-manager/dashboard", {
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || data.message || "Failed to load complaints");
        return;
      }

      const complaintTasks = [
        ...(data.tasks?.complaints?.pending || []),
        ...(data.tasks?.complaints?.resolved || []),
      ];
      setComplaints(complaintTasks);
    } catch {
      setError("Failed to load complaints");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedComplaints();
  }, []);

  const handleViewDetails = async (complaint) => {
    setSelectedComplaint(complaint);
    setDetailsLoading(true);
    setComplaintDetails(null);
    setReplyMessage("");
    setMarkResolved(false);
    try {
      const response = await fetch(`/api/platform-manager/complaint/${complaint._id}`, {
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || data.message || "Failed to load complaint details");
        return;
      }
      setComplaintDetails(data);
    } catch {
      alert("Failed to load complaint details");
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetailsModal = () => {
    setSelectedComplaint(null);
    setComplaintDetails(null);
    setReplyMessage("");
    setMarkResolved(false);
  };

  const handleReplySubmit = async () => {
    if (!selectedComplaint?._id || !replyMessage.trim()) return;

    try {
      setReplySubmitting(true);
      const response = await fetch(`/api/platform-manager/complaint/${selectedComplaint._id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: replyMessage.trim(),
          markResolved,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.error || data.message || "Failed to submit reply");
        return;
      }

      setReplyMessage("");
      setMarkResolved(false);
      await fetchAssignedComplaints();
      await handleViewDetails(selectedComplaint);
    } catch {
      alert("Failed to submit reply");
    } finally {
      setReplySubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: "#f59e0b", label: "Pending" },
      "in-progress": { color: "#3b82f6", label: "In Progress" },
      resolved: { color: "#10b981", label: "Resolved" },
      rejected: { color: "#ef4444", label: "Rejected" },
    };
    const badge = badges[status] || badges.pending;

    return (
      <span className="status-badge" style={{ backgroundColor: `${badge.color}20`, color: badge.color }}>
        <TrendingUp size={14} />
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="pm-dashboard-loading">
          <Loader2 size={48} className="spin" />
          <p>Loading assigned complaints...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="pm-dashboard">
        <div className="pm-dashboard-header">
          <div>
            <h1>Assigned Complaints</h1>
            <p>Track and handle complaints assigned to you</p>
          </div>
        </div>

        {error && (
          <div className="pm-dashboard-error" style={{ height: "auto", marginBottom: "1rem", padding: "1rem" }}>
            <AlertCircle size={20} color="#ef4444" />
            <p>{error}</p>
          </div>
        )}

        <div className="pm-section">
          <div className="pm-section-header">
            <h2>
              <MessageSquare size={24} />
              Complaint Tasks
            </h2>
            <span className="task-count">{complaints.length} complaints</span>
          </div>

          {complaints.length === 0 ? (
            <div className="pm-empty-state">
              <CheckCircle size={48} />
              <p>No complaints assigned</p>
            </div>
          ) : (
            <div className="pm-task-list">
              {complaints.map((complaint) => (
                <div key={complaint._id} className="pm-task-card">
                  <div className="task-header">
                    <div className="task-type">
                      <MessageSquare size={20} />
                      <span className="task-type-label">COMPLAINT</span>
                    </div>
                    {getStatusBadge(complaint.status)}
                  </div>

                  <div className="task-content">
                    <h3>{complaint.subject || `Dispute at ${complaint.milestone}% milestone`}</h3>
                    <p className="task-description">
                      {(complaint.message || complaint.description || "No message")?.substring(0, 130)}
                      {(complaint.message || complaint.description || "").length > 130 ? "..." : ""}
                    </p>
                    <p className="task-meta">
                      From: {complaint.senderDisplayName || complaint.userId?.name || complaint.userId?.companyName || complaint.senderType || "Unknown"} • {new Date(complaint.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="task-actions">
                    <button className="btn-view" onClick={() => handleViewDetails(complaint)}>
                      View Complete Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedComplaint && (
          <div className="pm-modal-overlay" onClick={closeDetailsModal}>
            <div className="pm-modal" onClick={(event) => event.stopPropagation()}>
              <div className="pm-modal-header">
                <h2>Dispute Details</h2>
                <button className="pm-cancel-btn" onClick={closeDetailsModal}>Close</button>
              </div>

              {detailsLoading ? (
                <div className="pm-dashboard-loading" style={{ height: "200px" }}>
                  <Loader2 size={28} className="spin" />
                  <p>Loading complete details...</p>
                </div>
              ) : (
                <div className="pm-modal-content">
                  <div className="pm-detail-row"><strong>Complaint ID:</strong> {complaintDetails?.complaint?._id || selectedComplaint._id}</div>
                  <div className="pm-detail-row"><strong>Status:</strong> {complaintDetails?.complaint?.status || selectedComplaint.status}</div>
                  <div className="pm-detail-row"><strong>Milestone:</strong> {complaintDetails?.complaint?.milestone ?? selectedComplaint.milestone}%</div>
                  <div className="pm-detail-row"><strong>Sender Type:</strong> {complaintDetails?.complaint?.senderType || selectedComplaint.senderType || "N/A"}</div>
                  <div className="pm-detail-row"><strong>Sender Name:</strong> {complaintDetails?.senderDetails?.name || complaintDetails?.senderDetails?.companyName || "N/A"}</div>
                  <div className="pm-detail-row"><strong>Sender Contact:</strong> {complaintDetails?.senderDetails?.email || "N/A"} {complaintDetails?.senderDetails?.phone ? ` • ${complaintDetails.senderDetails.phone}` : ""}</div>
                  <div className="pm-detail-row"><strong>Dispute Message:</strong> {complaintDetails?.complaint?.message || selectedComplaint.message || selectedComplaint.description || "N/A"}</div>

                  {complaintDetails?.projectSummary && (
                    <div className="pm-detail-row">
                      <strong>Project Details:</strong>
                      <ul>
                        <li>Project Name: {complaintDetails.projectSummary.projectName || "N/A"}</li>
                        <li>Address: {complaintDetails.projectSummary.projectAddress || "N/A"}</li>
                        <li>Status: {complaintDetails.projectSummary.status || "N/A"}</li>
                        <li>Timeline: {complaintDetails.projectSummary.timeline || "N/A"}</li>
                        <li>Budget: {complaintDetails.projectSummary.estimatedBudget ? `₹${Number(complaintDetails.projectSummary.estimatedBudget).toLocaleString("en-IN")}` : "N/A"}</li>
                      </ul>
                    </div>
                  )}

                  {complaintDetails?.projectParties?.customer && (
                    <div className="pm-detail-row">
                      <strong>Customer Details:</strong>
                      <ul>
                        <li>Name: {complaintDetails.projectParties.customer.name || "N/A"}</li>
                        <li>Email: {complaintDetails.projectParties.customer.email || "N/A"}</li>
                        <li>Phone: {complaintDetails.projectParties.customer.phone || "N/A"}</li>
                      </ul>
                    </div>
                  )}

                  {complaintDetails?.projectParties?.company && (
                    <div className="pm-detail-row">
                      <strong>Company Details:</strong>
                      <ul>
                        <li>Company: {complaintDetails.projectParties.company.companyName || "N/A"}</li>
                        <li>Contact Person: {complaintDetails.projectParties.company.contactPerson || "N/A"}</li>
                        <li>Email: {complaintDetails.projectParties.company.email || "N/A"}</li>
                        <li>Phone: {complaintDetails.projectParties.company.phone || "N/A"}</li>
                      </ul>
                    </div>
                  )}

                  <div className="pm-detail-row"><strong>Created At:</strong> {new Date((complaintDetails?.complaint?.createdAt || selectedComplaint.createdAt)).toLocaleString()}</div>
                  <div className="pm-detail-row"><strong>Assigned At:</strong> {complaintDetails?.complaint?.assignedAt ? new Date(complaintDetails.complaint.assignedAt).toLocaleString() : "N/A"}</div>
                  <div className="pm-detail-row"><strong>Resolved At:</strong> {complaintDetails?.complaint?.resolvedAt ? new Date(complaintDetails.complaint.resolvedAt).toLocaleString() : "N/A"}</div>

                  <div className="pm-detail-row">
                    <strong>Replies:</strong>
                    {complaintDetails?.replies?.length ? (
                      <ul>
                        {complaintDetails.replies.map((reply) => (
                          <li key={reply._id || `${reply.adminId}-${reply.createdAt}`}>
                            <strong>{reply.adminName || "Platform Manager"}:</strong> {reply.message} ({new Date(reply.createdAt).toLocaleString()})
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No replies yet.</p>
                    )}
                  </div>

                  <div className="pm-detail-row">
                    <strong>Add Reply:</strong>
                    <textarea
                      value={replyMessage}
                      onChange={(event) => setReplyMessage(event.target.value)}
                      rows={4}
                      placeholder="Type your response to this complaint..."
                      style={{ width: "100%", marginTop: "8px", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                    />
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "10px" }}>
                      <input
                        type="checkbox"
                        checked={markResolved}
                        onChange={(event) => setMarkResolved(event.target.checked)}
                      />
                      Mark complaint as resolved
                    </label>
                    <button
                      className="btn-view"
                      style={{ marginTop: "10px" }}
                      onClick={handleReplySubmit}
                      disabled={replySubmitting || !replyMessage.trim()}
                    >
                      {replySubmitting ? "Sending..." : "Send Reply"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default PlatformManagerAssignedComplaints;
