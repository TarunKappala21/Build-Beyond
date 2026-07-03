import React, { useEffect, useState } from "react";
import { Building2, CheckCircle, Clock, Loader2, TrendingUp, Users, XCircle, AlertCircle } from "lucide-react";
import AdminLayout from "../../components/admin/AdminLayout";
import "./PlatformManagerDashboard.css";

const _API_BASE = import.meta.env.VITE_API_BASE_URL || '';


const getDocumentUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${path.startsWith("/") ? "" : "/"}${path}`;
};

const PlatformManagerVerificationTasks = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [verificationTasks, setVerificationTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskDetails, setTaskDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [rejectTaskId, setRejectTaskId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchVerificationTasks = async () => {
    try {
      setError("");
      const response = await fetch(`${_API_BASE}/api/platform-manager/dashboard`, {
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || data.message || "Failed to load verification tasks");
        return;
      }

      const tasks = [
        ...(data.tasks?.verifications?.pending || []),
        ...(data.tasks?.verifications?.completed || []),
      ];
      setVerificationTasks(tasks);
    } catch {
      setError("Failed to load verification tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerificationTasks();
  }, []);

  const handleProcessTask = async (taskId, action, notes = "") => {
    try {
      const response = await fetch(`${_API_BASE}/api/platform-manager/verification/${taskId}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action, notes }),
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.error || data.message || "Failed to process task");
        return;
      }

      setRejectTaskId(null);
      setRejectReason("");
      setSelectedTask(null);
      setTaskDetails(null);
      fetchVerificationTasks();
    } catch {
      alert("Failed to process task");
    }
  };

  const handleOpenTaskDetails = async (task) => {
    setSelectedTask(task);
    setDetailsLoading(true);
    setTaskDetails(null);
    try {
      const response = await fetch(`${_API_BASE}/api/platform-manager/verification/${task._id}`, {
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || data.message || "Failed to load task details");
        return;
      }
      setTaskDetails(data);
    } catch {
      alert("Failed to load task details");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCloseTaskDetails = () => {
    setSelectedTask(null);
    setTaskDetails(null);
  };

  const handleRejectSubmit = async (taskId) => {
    if (!rejectReason || rejectReason.trim().length < 10) {
      alert("Please enter a valid rejection reason (minimum 10 characters)");
      return;
    }
    await handleProcessTask(taskId, "reject", rejectReason.trim());
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: "#f59e0b", icon: Clock, label: "Pending" },
      "in-progress": { color: "#3b82f6", icon: TrendingUp, label: "In Progress" },
      verified: { color: "#10b981", icon: CheckCircle, label: "Verified" },
      rejected: { color: "#ef4444", icon: XCircle, label: "Rejected" },
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className="status-badge" style={{ backgroundColor: `${badge.color}20`, color: badge.color }}>
        <Icon size={14} />
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="pm-dashboard-loading">
          <Loader2 size={48} className="spin" />
          <p>Loading verification tasks...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="pm-dashboard">
        <div className="pm-dashboard-header">
          <div>
            <h1>Verification Tasks</h1>
            <p>Review and process your assigned verification requests</p>
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
              <Building2 size={24} />
              Assigned Verification Tasks
            </h2>
            <span className="task-count">{verificationTasks.length} tasks</span>
          </div>

          {verificationTasks.length === 0 ? (
            <div className="pm-empty-state">
              <CheckCircle size={48} />
              <p>No verification tasks assigned</p>
            </div>
          ) : (
            <div className="pm-task-list">
              {verificationTasks.map((task) => (
                <div key={task._id} className="pm-task-card">
                  <div className="task-header">
                    <div className="task-type">
                      {task.type === "company" ? <Building2 size={20} /> : <Users size={20} />}
                      <span className="task-type-label">{task.type?.toUpperCase() || "TASK"}</span>
                    </div>
                    {getStatusBadge(task.status)}
                  </div>

                  <div className="task-content">
                    <h3>{task.entityData?.companyName || task.entityData?.name || task.entityName || "Unknown Entity"}</h3>
                    <p className="task-meta">
                      Assigned: {new Date(task.assignedAt || task.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {task.status === "pending" && (
                    <div className="task-actions">
                      <button className="btn-view" onClick={() => handleOpenTaskDetails(task)}>
                        View Details
                      </button>
                      <button className="btn-verify" onClick={() => handleProcessTask(task._id, "verify")}>
                        <CheckCircle size={16} />
                        Verify
                      </button>
                      <button className="btn-reject" onClick={() => setRejectTaskId(task._id)}>
                        <XCircle size={16} />
                        Reject
                      </button>
                    </div>
                  )}

                  {rejectTaskId === task._id && (
                    <div className="pm-reject-box">
                      <label>Rejection Reason (minimum 10 characters)</label>
                      <textarea
                        value={rejectReason}
                        onChange={(event) => setRejectReason(event.target.value)}
                        rows={3}
                        placeholder="Enter clear and valid reason for rejection..."
                      />
                      <div className="pm-reject-actions">
                        <button className="btn-reject" onClick={() => handleRejectSubmit(task._id)}>
                          Submit Rejection
                        </button>
                        <button className="pm-cancel-btn" onClick={() => { setRejectTaskId(null); setRejectReason(""); }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedTask && (
          <div className="pm-modal-overlay" onClick={handleCloseTaskDetails}>
            <div className="pm-modal" onClick={(event) => event.stopPropagation()}>
              <div className="pm-modal-header">
                <h2>Verification Details</h2>
                <button className="pm-cancel-btn" onClick={handleCloseTaskDetails}>Close</button>
              </div>

              {detailsLoading ? (
                <div className="pm-dashboard-loading" style={{ height: "200px" }}>
                  <Loader2 size={28} className="spin" />
                  <p>Loading details...</p>
                </div>
              ) : (
                <div className="pm-modal-content">
                  <div className="pm-detail-row"><strong>Type:</strong> {taskDetails?.task?.type || selectedTask.type}</div>
                  <div className="pm-detail-row"><strong>Status:</strong> {taskDetails?.task?.status || selectedTask.status}</div>
                  <div className="pm-detail-row"><strong>Name:</strong> {taskDetails?.entityData?.companyName || taskDetails?.entityData?.name || "N/A"}</div>
                  <div className="pm-detail-row"><strong>Email:</strong> {taskDetails?.entityData?.email || "N/A"}</div>
                  <div className="pm-detail-row"><strong>Phone:</strong> {taskDetails?.entityData?.phone || "N/A"}</div>
                  <div className="pm-detail-row"><strong>Description:</strong> {taskDetails?.entityData?.description || taskDetails?.entityData?.about || taskDetails?.entityData?.aboutCompany || "N/A"}</div>

                  {Array.isArray(taskDetails?.entityData?.companyDocuments) && taskDetails.entityData.companyDocuments.length > 0 && (
                    <div className="pm-detail-row">
                      <strong>Company Documents:</strong>
                      <ul>
                        {taskDetails.entityData.companyDocuments.map((doc, idx) => (
                          <li key={`company-doc-${idx}`}><a href={getDocumentUrl(doc)} target="_blank" rel="noreferrer">Document {idx + 1}</a></li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {Array.isArray(taskDetails?.entityData?.certificateFiles) && taskDetails.entityData.certificateFiles.length > 0 && (
                    <div className="pm-detail-row">
                      <strong>Worker Certificates:</strong>
                      <ul>
                        {taskDetails.entityData.certificateFiles.map((doc, idx) => (
                          <li key={`worker-doc-${idx}`}><a href={getDocumentUrl(doc)} target="_blank" rel="noreferrer">Certificate {idx + 1}</a></li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default PlatformManagerVerificationTasks;
