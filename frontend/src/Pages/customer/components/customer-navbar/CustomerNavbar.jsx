// src/Pages/customer/components/customer-navbar/CustomerNavbar.jsx
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axiosInstance from '../../../../api/axiosInstance';
import Dropdown from "./sub-components/Dropdown";
import NotificationIcon from "./sub-components/NotificationIcon";
import "./CustomerNavbar.css";

const CustomerNavbar = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [inactiveNotificationIds, setInactiveNotificationIds] = useState(() => {
    try {
      const storedInactive = localStorage.getItem(
        "customer_notifications_inactive",
      );
      if (storedInactive) {
        return new Set(JSON.parse(storedInactive));
      }

      const legacyReadState = localStorage.getItem(
        "customer_notifications_read",
      );
      return new Set(JSON.parse(legacyReadState || "[]"));
    } catch {
      return new Set();
    }
  });

  const formatTimeAgo = (dateValue) => {
    const date = new Date(dateValue);
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (Number.isNaN(date.getTime())) return "Just now";
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const buildNotification = ({
    id,
    title,
    message,
    time,
    timestamp,
    route,
    source,
  }) => ({
    id,
    title,
    message,
    time,
    timestamp: timestamp || Date.now(),
    route,
    source,
    active: !inactiveNotificationIds.has(id),
  });

  const buildNotifications = (jobStatus, ongoingProjects, paymentHistory) => {
    const items = [];

    (jobStatus.architectApplications || []).forEach((app) => {
      const projectName = app.projectName || "Architect request";
      const projectId = app._id;
      const baseRoute = `/customerdashboard/job_status?tab=cjs-architect-section&projectId=${projectId}&section=card`;
      const status = (app.status || "").toLowerCase();

      if (status === "pending") {
        items.push(
          buildNotification({
            id: `architect-submitted-${projectId}`,
            title: "Architect request submitted",
            message: `Your request for ${projectName} is pending review.`,
            time: formatTimeAgo(app.createdAt),
            timestamp: new Date(app.createdAt).getTime(),
            route: baseRoute,
            source: "architect",
          }),
        );
      }

      if (status === "proposal_sent" || status === "proposal sent") {
        items.push(
          buildNotification({
            id: `architect-proposal-${projectId}`,
            title: "New architect proposal",
            message: `A proposal is ready for ${projectName}.`,
            time: formatTimeAgo(app.updatedAt || app.createdAt),
            timestamp: new Date(app.updatedAt || app.createdAt).getTime(),
            route: baseRoute,
            source: "architect",
          }),
        );
      }

      if (
        status === "accepted" ||
        status === "pending payment" ||
        status === "pending_payment"
      ) {
        items.push(
          buildNotification({
            id: `architect-accepted-${projectId}`,
            title: "Architect request accepted",
            message: `Your architect request ${projectName} moved forward.`,
            time: formatTimeAgo(app.updatedAt || app.createdAt),
            timestamp: new Date(app.updatedAt || app.createdAt).getTime(),
            route: `/customerdashboard/job_status?tab=cjs-architect-section&projectId=${projectId}&section=details`,
            source: "architect",
          }),
        );
      }

      (app.milestones || []).forEach((milestone) => {
        if (milestone.status === "Pending") {
          items.push(
            buildNotification({
              id: `architect-milestone-${projectId}-${milestone.percentage}`,
              title: `Milestone ${milestone.percentage}% needs approval`,
              message: `${projectName} has a pending milestone waiting for your review.`,
              time: formatTimeAgo(
                milestone.updatedAt || app.updatedAt || app.createdAt,
              ),
              timestamp: new Date(
                milestone.updatedAt || app.updatedAt || app.createdAt,
              ).getTime(),
              route: `/customerdashboard/job_status?tab=cjs-architect-section&projectId=${projectId}&section=milestones`,
              source: "architect",
            }),
          );
        }
      });
    });

    (jobStatus.interiorApplications || []).forEach((app) => {
      const projectName = app.projectName || "Interior request";
      const projectId = app._id;
      const baseRoute = `/customerdashboard/job_status?tab=cjs-interior-section&projectId=${projectId}&section=card`;
      const status = (app.status || "").toLowerCase();

      if (status === "pending") {
        items.push(
          buildNotification({
            id: `interior-submitted-${projectId}`,
            title: "Interior request submitted",
            message: `Your request for ${projectName} is pending review.`,
            time: formatTimeAgo(app.createdAt),
            timestamp: new Date(app.createdAt).getTime(),
            route: baseRoute,
            source: "interior",
          }),
        );
      }

      if (status === "proposal_sent" || status === "proposal sent") {
        items.push(
          buildNotification({
            id: `interior-proposal-${projectId}`,
            title: "New interior proposal",
            message: `A proposal is ready for ${projectName}.`,
            time: formatTimeAgo(app.updatedAt || app.createdAt),
            timestamp: new Date(app.updatedAt || app.createdAt).getTime(),
            route: baseRoute,
            source: "interior",
          }),
        );
      }

      if (
        status === "accepted" ||
        status === "pending payment" ||
        status === "pending_payment"
      ) {
        items.push(
          buildNotification({
            id: `interior-accepted-${projectId}`,
            title: "Interior request accepted",
            message: `Your interior request ${projectName} moved forward.`,
            time: formatTimeAgo(app.updatedAt || app.createdAt),
            timestamp: new Date(app.updatedAt || app.createdAt).getTime(),
            route: `/customerdashboard/job_status?tab=cjs-interior-section&projectId=${projectId}&section=details`,
            source: "interior",
          }),
        );
      }

      (app.milestones || []).forEach((milestone) => {
        if (milestone.status === "Pending") {
          items.push(
            buildNotification({
              id: `interior-milestone-${projectId}-${milestone.percentage}`,
              title: `Milestone ${milestone.percentage}% needs approval`,
              message: `${projectName} has a pending milestone waiting for your review.`,
              time: formatTimeAgo(
                milestone.updatedAt || app.updatedAt || app.createdAt,
              ),
              timestamp: new Date(
                milestone.updatedAt || app.updatedAt || app.createdAt,
              ).getTime(),
              route: `/customerdashboard/job_status?tab=cjs-interior-section&projectId=${projectId}&section=milestones`,
              source: "interior",
            }),
          );
        }
      });
    });

    (jobStatus.companyApplications || []).forEach((app) => {
      const projectName = app.projectName || "Construction project";
      const projectId = app._id;
      const baseRoute = `/customerdashboard/job_status?tab=cjs-company-section&projectId=${projectId}&section=card`;
      const status = (app.status || "").toLowerCase();

      if (status === "pending") {
        items.push(
          buildNotification({
            id: `company-submitted-${projectId}`,
            title: "Construction request submitted",
            message: `Your request for ${projectName} is pending review.`,
            time: formatTimeAgo(app.createdAt),
            timestamp: new Date(app.createdAt).getTime(),
            route: baseRoute,
            source: "company",
          }),
        );
      }

      if (status === "proposal_sent") {
        items.push(
          buildNotification({
            id: `company-proposal-${projectId}`,
            title: "New company proposal",
            message: `A proposal is ready for ${projectName}.`,
            time: formatTimeAgo(app.updatedAt || app.createdAt),
            timestamp: new Date(app.updatedAt || app.createdAt).getTime(),
            route: baseRoute,
            source: "company",
          }),
        );
      }

      if (status === "accepted") {
        items.push(
          buildNotification({
            id: `company-accepted-${projectId}`,
            title: "Company request accepted",
            message: `Your construction project ${projectName} is now active.`,
            time: formatTimeAgo(app.updatedAt || app.createdAt),
            timestamp: new Date(app.updatedAt || app.createdAt).getTime(),
            route: `/customerdashboard/ongoing_projects?projectId=${projectId}&section=details`,
            source: "company",
          }),
        );
      }

      (app.recentUpdates || []).forEach((update, index) => {
        items.push(
          buildNotification({
            id: `company-update-${projectId}-${index}`,
            title: `Update on ${projectName}`,
            message: update.updateText || "A new project update was posted.",
            time: formatTimeAgo(
              update.createdAt || app.updatedAt || app.createdAt,
            ),
            timestamp: new Date(
              update.createdAt || app.updatedAt || app.createdAt,
            ).getTime(),
            route: `/customerdashboard/ongoing_projects?projectId=${projectId}&section=updates`,
            source: "company",
          }),
        );
      });

      (app.milestones || []).forEach((milestone) => {
        if (milestone.status === "Pending") {
          items.push(
            buildNotification({
              id: `company-milestone-${projectId}-${milestone.percentage}`,
              title: `Milestone ${milestone.percentage}% needs approval`,
              message: `${projectName} has a pending milestone waiting for your review.`,
              time: formatTimeAgo(
                milestone.updatedAt || app.updatedAt || app.createdAt,
              ),
              timestamp: new Date(
                milestone.updatedAt || app.updatedAt || app.createdAt,
              ).getTime(),
              route: `/customerdashboard/ongoing_projects?projectId=${projectId}&section=milestones`,
              source: "company",
            }),
          );
        }
      });
    });

    (ongoingProjects || []).forEach((project) => {
      const projectId = project._id;
      const projectName = project.projectName || "Project";

      if (project.recentUpdates?.length > 0) {
        const latestUpdate =
          project.recentUpdates[project.recentUpdates.length - 1];
        items.push(
          buildNotification({
            id: `ongoing-update-${projectId}-${latestUpdate.createdAt || project.updatedAt || project.createdAt}`,
            title: `Progress update for ${projectName}`,
            message: latestUpdate.updateText || "A new update is available.",
            time: formatTimeAgo(
              latestUpdate.createdAt || project.updatedAt || project.createdAt,
            ),
            timestamp: new Date(
              latestUpdate.createdAt || project.updatedAt || project.createdAt,
            ).getTime(),
            route: `/customerdashboard/ongoing_projects?projectId=${projectId}&section=updates`,
            source: "ongoing",
          }),
        );
      }

      const pendingMilestone = (project.milestones || []).find(
        (milestone) => milestone.status === "Pending",
      );
      if (pendingMilestone) {
        items.push(
          buildNotification({
            id: `ongoing-milestone-${projectId}-${pendingMilestone.percentage}`,
            title: `Milestone ${pendingMilestone.percentage}% pending approval`,
            message: `${projectName} has a milestone awaiting your response.`,
            time: formatTimeAgo(
              pendingMilestone.updatedAt ||
                project.updatedAt ||
                project.createdAt,
            ),
            timestamp: new Date(
              pendingMilestone.updatedAt ||
                project.updatedAt ||
                project.createdAt,
            ).getTime(),
            route: `/customerdashboard/ongoing_projects?projectId=${projectId}&section=milestones`,
            source: "ongoing",
          }),
        );
      }

      if (Number(project.completionPercentage || 0) === 100) {
        items.push(
          buildNotification({
            id: `ongoing-complete-${projectId}`,
            title: `Project completed: ${projectName}`,
            message: `Your construction project is complete. Submit your review if needed.`,
            time: formatTimeAgo(project.updatedAt || project.createdAt),
            timestamp: new Date(
              project.updatedAt || project.createdAt,
            ).getTime(),
            route: `/customerdashboard/ongoing_projects?projectId=${projectId}&section=review`,
            source: "ongoing",
          }),
        );
      }
    });

    (paymentHistory || []).forEach((transaction) => {
      items.push(
        buildNotification({
          id: `payment-${transaction._id}`,
          title:
            transaction.status === "completed"
              ? "Payment completed"
              : transaction.status === "pending"
                ? "Payment pending"
                : transaction.status === "refunded"
                  ? "Payment refunded"
                  : "Payment update",
          message:
            transaction.description || "Your payment status has changed.",
          time: formatTimeAgo(transaction.createdAt),
          timestamp: new Date(transaction.createdAt).getTime(),
          route: `/customerdashboard/payment-history?transactionId=${transaction._id}`,
          source: "payment",
        }),
      );
    });

    return items
      .filter(
        (notification, index, self) =>
          index === self.findIndex((entry) => entry.id === notification.id),
      )
      .sort((a, b) => b.timestamp - a.timestamp);
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const [jobStatusRes, ongoingRes, paymentRes, messagesRes] =
          await Promise.allSettled([
            axiosInstance.get("/api/job_status", { withCredentials: true }),
            axiosInstance.get("/api/ongoing_projects", { withCredentials: true }),
            axiosInstance.get("/api/customer/payment-history", {
              withCredentials: true,
            }),
            axiosInstance.get("/api/customer/unviewed-company-messages", {
              withCredentials: true,
            }),
          ]);

        const allNotifications = buildNotifications(
          jobStatusRes.status === "fulfilled"
            ? jobStatusRes.value.data || {}
            : {},
          ongoingRes.status === "fulfilled"
            ? ongoingRes.value.data.projects || []
            : [],
          paymentRes.status === "fulfilled"
            ? paymentRes.value.data.transactions || []
            : [],
        );

        const messageNotifications =
          messagesRes.status === "fulfilled" && messagesRes.value.data.success
            ? messagesRes.value.data.unviewedByProject || []
            : [];

        const messageItems = messageNotifications.map((entry) =>
          buildNotification({
            id: `message-${entry._id}`,
            title: "New message from company",
            message: `You have ${entry.count} unread company message${
              entry.count > 1 ? "s" : ""
            }.`,
            time: "Just now",
            route: `/customerdashboard/ongoing_projects?projectId=${entry._id}&section=updates`,
            source: "message",
          }),
        );

        const mergedNotifications = [...messageItems, ...allNotifications];
        setNotifications(mergedNotifications);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [inactiveNotificationIds]);

  useEffect(() => {
    localStorage.setItem(
      "customer_notifications_inactive",
      JSON.stringify(Array.from(inactiveNotificationIds)),
    );
    localStorage.setItem(
      "customer_notifications_read",
      JSON.stringify(Array.from(inactiveNotificationIds)),
    );
  }, [notifications, inactiveNotificationIds]);

  const deactivateAllNotifications = () => {
    setInactiveNotificationIds(
      new Set(notifications.map((notification) => notification.id)),
    );
  };

  const toggleNotificationActive = (notificationId) => {
    setInactiveNotificationIds((prev) => {
      const next = new Set(prev);
      if (next.has(notificationId)) {
        next.delete(notificationId);
      } else {
        next.add(notificationId);
      }
      return next;
    });
  };

  const handleNotificationClick = (notification) => {
    if (notification.active && notification.route) {
      navigate(notification.route);
    }
  };

  return (
    <div className="customer_navbar">
      <nav className="customer_navbar_navbar">
        <Link to="/customerdashboard/home" className="customer_navbar_logo">
          BUILD & BEYOND
        </Link>

        <div className="customer_navbar_navLinks">
          <div className="customer_navbar_navItem">
            <Link
              to="/customerdashboard/home"
              className="customer_navbar_navLink"
            >
              HOME
            </Link>
          </div>

          <Dropdown />

          <div
            className="customer_navbar_navItem"
            style={{ position: "relative" }}
          >
            <Link
              to="/customerdashboard/ongoing_projects"
              className="customer_navbar_navLink"
            >
              ONGOING PROJECTS
            </Link>
          </div>

          <div className="customer_navbar_navItem">
            <Link
              to="/customerdashboard/bidspace"
              className="customer_navbar_navLink"
            >
              BIDSPACE
            </Link>
          </div>

          <div className="customer_navbar_navItem">
            <Link
              to="/customerdashboard/job_status"
              className="customer_navbar_navLink"
            >
              JOB STATUS
            </Link>
          </div>

          <div className="customer_navbar_navItem">
            <Link
              to="/customerdashboard/payment-history"
              className="customer_navbar_navLink"
            >
              PAYMENTS
            </Link>
          </div>
        </div>

        <div className="customer_navbar_rightSection">
          <NotificationIcon
            notifications={notifications.map((notification) => ({
              ...notification,
              active: !inactiveNotificationIds.has(notification.id),
            }))}
            onMarkAllRead={deactivateAllNotifications}
            onToggleNotificationActive={toggleNotificationActive}
            onNotificationClick={handleNotificationClick}
          />
          <div className="customer_navbar_profileIcon">
            <Link to="/customerdashboard/customersettings">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default CustomerNavbar;
