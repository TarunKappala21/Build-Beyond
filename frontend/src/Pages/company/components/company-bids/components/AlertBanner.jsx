import React from "react";

const AlertBanner = ({ alert }) => {
  if (!alert) return null;
  return (
    <div className={`bids-alert bids-alert-${alert.type}`}>{alert.msg}</div>
  );
};

export default AlertBanner;