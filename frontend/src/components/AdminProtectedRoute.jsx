import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminAuthProvider } from "../context/AdminAuthContext";
import API_BASE from "../api/backendBase";

const AdminProtectedRoute = ({ children, allowedRoles = ["platform_manager", "admin", "superadmin"] }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/verify-session`, {
          credentials: "include",
          method: "GET",
        });
        if (res.status === 404) {
          navigate("/not-found");
          return;
        }
        if (res.status === 401 || res.status === 403) {
          navigate("/unauthorized");
          return;
        }
        const data = await res.json();

        if (res.ok && data.authenticated && (data.role === "platform_manager" || data.role === "superadmin" || data.role === "admin")) {
          if (allowedRoles.includes(data.role)) {
            setAuthenticated(true);
            setRole(data.role);
          } else {
            navigate("/unauthorized");
          }
        } else {
          navigate("/admin-login");
        }
      } catch (error) {
        console.error("Admin auth check failed:", error);
        navigate("/admin-login");
      } finally {
        setLoading(false);
      }
    };
    checkAdminAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <span>Loading...</span>
      </div>
    );
  }

  return authenticated ? (
    <AdminAuthProvider role={role}>
      {children}
    </AdminAuthProvider>
  ) : null;
};

export default AdminProtectedRoute;
