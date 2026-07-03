import React from "react";
import axiosInstance from '../../../../../api/axiosInstance';

export default function SettingsSidebar({ activeSection, onSectionChange }) {
  const handleLogout = async () => {
    try {
      await axiosInstance.get("/api/logout", {}, { withCredentials: true });
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <aside className="cs-sidebar">
      <nav className="cs-nav">
        <button
          className={`cs-nav-link ${activeSection === "profile" ? "active" : ""}`}
          onClick={() => onSectionChange("profile")}
        >
          <i className="fas fa-building" /> Company Profile
        </button>
        <button
          className={`cs-nav-link ${activeSection === "security" ? "active" : ""}`}
          onClick={() => onSectionChange("security")}
        >
          <i className="fas fa-lock" /> Security
        </button>
        <button
          className={`cs-nav-link ${activeSection === "help" ? "active" : ""}`}
          onClick={() => onSectionChange("help")}
        >
          <i className="fas fa-question-circle" /> Help Center
        </button>
        <button
          className="cs-nav-link cs-nav-link-logout"
          onClick={handleLogout}
        >
          <i className="fas fa-sign-out-alt" /> Logout
        </button>
      </nav>
    </aside>
  );
}
