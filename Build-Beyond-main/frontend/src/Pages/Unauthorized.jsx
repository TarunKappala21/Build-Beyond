import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API_BASE from "../api/backendBase";


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

const Unauthorized = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Log unauthorized access to backend
    fetch(`${API_BASE}/api/log-client-error`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Unauthorized access attempt",
        status: 401,
        url: location.pathname,
        userAgent: navigator.userAgent,
      }),
    }).catch((err) => console.error("Failed to log error:", err));
  }, [location.pathname]);

  return (
    <div style={{ textAlign: "center", marginTop: "10vh" }}>
      <h1>401 - Unauthorized</h1>
      <p>You are not authorized to view this page. Please login.</p>
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

export default Unauthorized;
