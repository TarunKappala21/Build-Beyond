import React from "react";
import "./CustomerPageLoader.css";

const CustomerPageLoader = ({ message = "Loading...", className = "" }) => {
  const wrapperClassName = ["customer-page-loader", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={wrapperClassName}>
      <div className="status-message loading">
        <div className="spinner"></div>
        <p>{message}</p>
      </div>
    </div>
  );
};

export default CustomerPageLoader;
