import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE from "../api/backendBase";

const ProtectedRoute = ({ role, children }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/session`, {
          credentials: "include",
        });
        if (res.status === 404) {
          navigate("/not-found");
          return;
        }
        if (res.status === 401 || res.status === 403) {
          // Redirect straight to login instead of showing /unauthorized flash
          navigate("/");
          return;
        }
        const data = await res.json();
        if (data.authenticated && data.user.role === role) {
          setAuthenticated(true);
        } else {
          navigate("/");
        }
      } catch {
        navigate("/");
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [role, navigate]);

  if (loading) return null; // silent loading — no flash
  return authenticated ? children : null;
};

export default ProtectedRoute;
