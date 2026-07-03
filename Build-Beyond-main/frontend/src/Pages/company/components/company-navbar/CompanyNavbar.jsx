// src/components/company-navbar/CompanyNavbar.jsx
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import API_BASE from "../../../../api/backendBase";
import "./CompanyNavbar.css";

const CompanyNavbar = () => {
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/company/notifications`, {
          credentials: "include",
        });
        if (!res.ok) return;

        const data = await res.json();
        setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
      } catch (err) {
        setNotifications([]);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const unreadCount = notifications.length;

  const formatRelativeTime = (dateString) => {
    if (!dateString) return "Just now";

    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;

    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;

    const diffDays = Math.floor(diffHrs / 24);
    return `${diffDays}d ago`;
  };

  const handleNotificationClick = async (notification) => {
    if (!notification?.projectId) return;

    try {
      await fetch(`${API_BASE}/api/company/mark-messages-viewed/${notification.projectId}`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      // Navigate anyway to keep UX responsive.
    }

    const params = new URLSearchParams({
      projectId: notification.projectId,
      milestone: String(notification.milestone ?? ""),
      notificationType: notification.type || "customer_message",
    });

    setIsNotificationsOpen(false);
    navigate(`/companydashboard/companyongoing_projects?${params.toString()}`);
  };

  return (
    <div className="company_navbar">
      <nav className="company_navbar_navbar">
        <Link to="/companydashboard/companydashboard" className="company_navbar_brand">
          Build and Beyond
        </Link>

        <div className="company_navbar_navLinks">
          <Link to="/companydashboard/companydashboard" className="company_navbar_navLink">
            Dashboard
          </Link>
          <Link to="/companydashboard/companybids" className="company_navbar_navLink">
            Bids
          </Link>
          <Link to="/companydashboard/companyongoing_projects" className="company_navbar_navLink" style={{ position: 'relative' }}>
            Ongoing Projects
            {unreadCount > 0 && (
              <span className="company_navbar_dotBadge"></span>
            )}
          </Link>
          <Link to="/companydashboard/project_requests" className="company_navbar_navLink">
            Project Requests
          </Link>
          <Link to="/companydashboard/companyrevenue" className="company_navbar_navLink">
            Revenue
          </Link>
          <Link to="/companydashboard/companyhiring" className="company_navbar_navLink">
            Hire Now
          </Link>
          <Link to="/companydashboard/my-employees" className="company_navbar_navLink">
            My Employees
          </Link>
        </div>

        <div className="company_navbar_settingsContainer">
          <div className="company_navbar_notificationContainer" ref={notificationsRef}>
            <button
              type="button"
              className="company_navbar_bellBtn"
              onClick={() => setIsNotificationsOpen((prev) => !prev)}
            >
              <svg
                className="company_navbar_bellSvg"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 2a6 6 0 0 0-6 6v3.76l-1.56 2.6A1 1 0 0 0 5.3 16h13.4a1 1 0 0 0 .86-1.64L18 11.76V8a6 6 0 0 0-6-6zm0 20a3 3 0 0 0 2.82-2H9.18A3 3 0 0 0 12 22z" />
              </svg>
              {unreadCount > 0 && (
                <span className="company_navbar_notificationBadge">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <div className="company_navbar_notificationDropdown">
                <div className="company_navbar_notificationHeader">
                  Notifications
                </div>
                {notifications.length === 0 ? (
                  <div className="company_navbar_notificationEmpty">
                    No new notifications
                  </div>
                ) : (
                  <div className="company_navbar_notificationList">
                    {notifications.map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        className="company_navbar_notificationItem"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="company_navbar_notificationTitle">
                          {notification.title}
                        </div>
                        <div className="company_navbar_notificationText">
                          {notification.projectName}
                          {typeof notification.milestone === "number"
                            ? ` • ${notification.milestone}%`
                            : ""}
                        </div>
                        {notification.message && (
                          <div className="company_navbar_notificationMessage">
                            {notification.message}
                          </div>
                        )}
                        <div className="company_navbar_notificationTime">
                          {formatRelativeTime(notification.createdAt)}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <Link to="/companydashboard/companySettings" className="company_navbar_settingsBtn">
            <div className="company_navbar_settingsIcon">
              <svg
                className="company_navbar_settingsSvg"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
              </svg>
            </div>
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default CompanyNavbar;