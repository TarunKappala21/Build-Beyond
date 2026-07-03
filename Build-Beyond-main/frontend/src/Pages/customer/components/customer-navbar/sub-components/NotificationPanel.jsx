import "./NotificationPanel.css";

const NotificationPanel = ({
  notifications = [],
  onClose,
  onMarkAllRead,
  onToggleNotificationActive,
  onNotificationClick,
}) => {
  const activeCount = notifications.filter(
    (notification) => notification.active,
  ).length;

  return (
    <div
      className="customer_notification_panel"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="customer_notification_panel_header">
        <div className="customer_notification_panel_title">Notifications</div>
        <button
          type="button"
          className="customer_notification_panel_markRead"
          onClick={onMarkAllRead}
          disabled={activeCount === 0}
        >
          Deactivate all
        </button>
      </div>

      <div className="customer_notification_panel_list">
        {notifications.length === 0 ? (
          <div className="customer_notification_panel_empty">
            No notifications yet.
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`customer_notification_panel_item ${
                notification.active
                  ? "customer_notification_panel_item_active"
                  : "customer_notification_panel_item_inactive"
              }`}
            >
              <div className="customer_notification_panel_marker" />
              <div
                className={`customer_notification_panel_content ${
                  notification.active
                    ? "customer_notification_panel_content_active"
                    : "customer_notification_panel_content_inactive"
                }`}
                role={notification.active ? "button" : undefined}
                tabIndex={notification.active ? 0 : -1}
                onClick={() => {
                  if (notification.active) {
                    onNotificationClick(notification);
                  }
                }}
                onKeyDown={(event) => {
                  if (!notification.active) {
                    return;
                  }

                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onNotificationClick(notification);
                  }
                }}
              >
                <div className="customer_notification_panel_text">
                  {notification.title}
                </div>
                <div className="customer_notification_panel_message">
                  {notification.message}
                </div>
                <div className="customer_notification_panel_time">
                  {notification.time}
                </div>
              </div>
              <button
                type="button"
                className="customer_notification_panel_itemTick"
                aria-label={
                  notification.active
                    ? "Deactivate notification"
                    : "Activate notification"
                }
                title={
                  notification.active
                    ? "Deactivate notification"
                    : "Activate notification"
                }
                aria-pressed={notification.active}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleNotificationActive(notification.id);
                }}
              >
                ✓
              </button>
            </div>
          ))
        )}
      </div>

      <div className="customer_notification_panel_footer" />
    </div>
  );
};

export default NotificationPanel;
