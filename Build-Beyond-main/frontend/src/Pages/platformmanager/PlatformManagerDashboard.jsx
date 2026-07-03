import React, { useState, useEffect, useRef } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  Bell,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import "./PlatformManagerDashboard.css";

const PlatformManagerDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const knownTaskIdsRef = useRef(new Set());
  const hasBootstrappedRef = useRef(false);
  const notificationPanelRef = useRef(null);
  const [dashboardData, setDashboardData] = useState({
    verificationTasks: [],
    complaints: [],
    stats: {
      totalAssigned: 0,
      completed: 0,
      pending: 0,
      rejected: 0,
    },
  });

  useEffect(() => {
    fetchDashboardData();

    const pollingInterval = setInterval(() => {
      fetchDashboardData();
    }, 20000);

    return () => clearInterval(pollingInterval);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        notificationPanelRef.current &&
        !notificationPanelRef.current.contains(event.target)
      ) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      const response = await fetch("/api/platform-manager/dashboard", {
        credentials: "include",
      });
      const data = await response.json();
      if (response.ok) {
        // Map backend structure to frontend structure
        const allVerifications = [
          ...(data.tasks?.verifications?.pending || []),
          ...(data.tasks?.verifications?.completed || [])
        ];
        const allComplaints = [
          ...(data.tasks?.complaints?.pending || []),
          ...(data.tasks?.complaints?.resolved || [])
        ];

        const pendingVerificationNotifications = allVerifications
          .filter((task) => task.status === "pending" || task.status === "in-progress")
          .map((task) => ({
            id: `verification-${task._id}`,
            type: "verification",
            title: `New ${task.type} verification assigned`,
            description:
              task.entityData?.companyName ||
              task.entityData?.name ||
              task.entityName ||
              "Verification task",
            assignedAt: task.assignedAt || task.createdAt,
          }));

        const pendingComplaintNotifications = allComplaints
          .filter((complaint) => complaint.status === "pending" || complaint.status === "in-progress")
          .map((complaint) => ({
            id: `complaint-${complaint._id}`,
            type: "complaint",
            title: "New complaint assigned",
            description: complaint.subject || "Complaint task",
            assignedAt: complaint.assignedAt || complaint.createdAt,
          }));

        const currentOpenTasks = [
          ...pendingVerificationNotifications,
          ...pendingComplaintNotifications,
        ];

        if (!hasBootstrappedRef.current) {
          setNotifications(
            currentOpenTasks.slice(0, 20).map((item) => ({
              ...item,
              read: false,
            }))
          );
        } else {
          const newItems = currentOpenTasks.filter(
            (item) => !knownTaskIdsRef.current.has(item.id),
          );

          if (newItems.length > 0) {
            setNotifications((previous) => {
              const withReadState = newItems.map((item) => ({
                ...item,
                read: false,
              }));
              // Prevent duplicates in notifications
              const prevIds = new Set(previous.map((p) => p.id));
              const uniqueNewItems = withReadState.filter((newItem) => !prevIds.has(newItem.id));
              
              const merged = [...uniqueNewItems, ...previous];
              return merged.slice(0, 20);
            });
          }
        }

        knownTaskIdsRef.current = new Set(currentOpenTasks.map((item) => item.id));
        hasBootstrappedRef.current = true;
        
        setDashboardData({
          verificationTasks: allVerifications,
          complaints: allComplaints,
          stats: {
            totalAssigned: data.stats?.totalTasksAssigned || 0,
            completed: data.stats?.tasksCompleted || 0,
            pending: data.stats?.pendingTasks || 0,
            rejected: data.stats?.tasksRejected || 0,
          },
        });
      } else {
        console.error("Failed to fetch dashboard data:", data.message);
        setError(data.error || data.message || "Failed to load dashboard data");
      }
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter((item) => !item.read).length;

  const toggleNotifications = () => {
    setIsNotificationOpen((previous) => !previous);
  };

  const markAllAsRead = () => {
    setNotifications((previous) =>
      previous.map((item) => ({ ...item, read: true })),
    );
  };

  const markAsRead = (notification) => {
    setNotifications((previous) =>
      previous.map((item) =>
        item.id === notification.id ? { ...item, read: true } : item,
      ),
    );
    if (notification.type === "verification") {
      navigate("/platform-manager/verification-tasks");
    } else if (notification.type === "complaint") {
      navigate("/platform-manager/assigned-complaints");
    }
  };


  if (loading) {
    return (
      <AdminLayout>
        <div className="pm-dashboard-loading">
          <Loader2 size={48} className="spin" />
          <p>Loading dashboard...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="pm-dashboard-error">
          <AlertCircle size={48} color="#ef4444" />
          <h2>Error Loading Dashboard</h2>
          <p>{error}</p>
          <button className="refresh-btn" onClick={fetchDashboardData}>
            Try Again
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="pm-dashboard">
        <div className="pm-dashboard-header">
          <div>
            <h1>Platform Manager Dashboard</h1>
            <p>Monitor and manage your assigned tasks</p>
          </div>
          <div className="pm-header-actions" ref={notificationPanelRef}>
            <button
              className="pm-bell-btn"
              onClick={toggleNotifications}
              aria-label="Open notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="pm-bell-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
              )}
            </button>

            {isNotificationOpen && (
              <div className="pm-notification-dropdown">
                <div className="pm-notification-dropdown-header">
                  <h3>Notifications</h3>
                  <div className="pm-notification-actions">
                    {notifications.length > 0 && (
                      <button className="pm-clear-btn" onClick={markAllAsRead}>
                        Mark all read
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button className="pm-clear-btn" onClick={clearNotifications}>
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {notifications.length === 0 ? (
                  <div className="pm-notification-empty">
                    <p>No new task notifications</p>
                  </div>
                ) : (
                  <div className="pm-notification-list">
                    {notifications.map((item) => (
                      <button
                        key={item.id}
                        className={`pm-notification-item ${item.read ? "read" : "unread"}`}
                        onClick={() => markAsRead(item)}
                      >
                        <div className={`pm-notification-dot ${item.type}`} />
                        <div>
                          <p className="pm-notification-title">{item.title}</p>
                          <p className="pm-notification-desc">{item.description}</p>
                          <p className="pm-notification-time">
                            {new Date(item.assignedAt).toLocaleString()}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button className="refresh-btn" onClick={fetchDashboardData}>
              <TrendingUp size={20} />
              Refresh
            </button>
          </div>
        </div>

        <div className="pm-notification-mobile-summary">
          <span className="task-count">{unreadCount} unread notifications</span>
        </div>

        {/* Statistics Cards */}
        <div className="pm-stats-grid">
          <div className="pm-stat-card">
            <div className="stat-icon" style={{ backgroundColor: "#3b82f620" }}>
              <Clock size={24} style={{ color: "#3b82f6" }} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{dashboardData.stats.pending}</div>
              <div className="stat-label">Pending Tasks</div>
            </div>
          </div>

          <div className="pm-stat-card">
            <div className="stat-icon" style={{ backgroundColor: "#10b98120" }}>
              <CheckCircle size={24} style={{ color: "#10b981" }} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{dashboardData.stats.completed}</div>
              <div className="stat-label">Completed</div>
            </div>
          </div>

          <div className="pm-stat-card">
            <div className="stat-icon" style={{ backgroundColor: "#f59e0b20" }}>
              <TrendingUp size={24} style={{ color: "#f59e0b" }} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{dashboardData.stats.totalAssigned}</div>
              <div className="stat-label">Total Assigned</div>
            </div>
          </div>

          <div className="pm-stat-card">
            <div className="stat-icon" style={{ backgroundColor: "#ef444420" }}>
              <XCircle size={24} style={{ color: "#ef4444" }} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{dashboardData.stats.rejected}</div>
              <div className="stat-label">Rejected</div>
            </div>
          </div>
        </div>

        <div className="pm-section">
          <div className="pm-section-header">
            <h2>Quick Overview</h2>
            <span className="task-count">Use left menu for full sections</span>
          </div>
          <div className="pm-task-list">
            <div className="pm-task-card">
              <div className="task-content">
                <h3>Verification Tasks</h3>
                <p className="task-meta">
                  {dashboardData.verificationTasks.length} total tasks assigned. Open the dedicated section from sidebar.
                </p>
              </div>
            </div>
            <div className="pm-task-card">
              <div className="task-content">
                <h3>Assigned Complaints</h3>
                <p className="task-meta">
                  {dashboardData.complaints.length} total complaints assigned. Open the dedicated section from sidebar.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default PlatformManagerDashboard;
