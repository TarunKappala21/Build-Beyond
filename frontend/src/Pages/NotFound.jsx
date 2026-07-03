import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const _API_BASE = import.meta.env.VITE_API_BASE_URL || '';


const buttonStyle = {
  marginTop: "2rem",
  padding: "0.75rem 2rem",
  fontSize: "1.1rem",
  background: "#1976d2",
  color: "#fff",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  transition: "background 0.2s",
};

const NotFound = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Log 404 error to backend
    fetch(`${_API_BASE}/api/log-client-error`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Page not found",
        status: 404,
        url: location.pathname,
        userAgent: navigator.userAgent,
      }),
    }).catch((err) => console.error("Failed to log error:", err));
  }, [location.pathname]);

  return (
    <div style={{ textAlign: "center", marginTop: "10vh" }}>
      <h1>404 - Page Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      <button
        style={buttonStyle}
        onMouseOver={(e) => (e.target.style.background = "#1565c0")}
        onMouseOut={(e) => (e.target.style.background = "#1976d2")}
        onClick={() => navigate("/")}
      >
        Go to Login
      </button>
    </div>
  );
};

export default NotFound;
