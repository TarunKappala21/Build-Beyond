import { useState } from "react";
import NotificationPanel from "./NotificationPanel";
import "./NotificationIcon.css";

const NotificationIcon = ({
  notifications = [],
  onMarkAllRead,
  onToggleNotificationActive,
  onNotificationClick,
}) => {
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter(
    (notification) => notification.active,
  ).length;

  return (
    <div className="customer_notification_icon">
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
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {unreadCount > 0 && (
        <div className="customer_notification_icon_dot">{unreadCount}</div>
      )}
      <button
        type="button"
        className="customer_notification_icon_button"
        aria-label="Open notifications"
        onClick={() => setOpen((prev) => !prev)}
      />
      {open && (
        <NotificationPanel
          notifications={notifications}
          onClose={() => setOpen(false)}
          onMarkAllRead={onMarkAllRead}
          onToggleNotificationActive={onToggleNotificationActive}
          onNotificationClick={(notification) => {
            if (notification.active) {
              onNotificationClick(notification);
              setOpen(false);
            }
          }}
        />
      )}
    </div>
  );
};

export default NotificationIcon;
