import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  BarChart3,
  Users,
  Building2,
  Home,
  LogOut,
  ChevronRight,
  Database,
  User,
  MessageSquare,
} from "lucide-react";
import { useAdminAuth } from "../../context/AdminAuthContext";
import "./AdminLayout.css";

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const { role, isReadOnly, basePath } = useAdminAuth();

  const headerLabel =
    role === "platform_manager" ? "Platform Manager" : role === "superadmin" ? "Superadmin" : "Admin";
  const headerSuffix = isReadOnly ? " (Read-only)" : "";

  const dashboardPath =
    role === "platform_manager"
      ? `${basePath}/dashboard`
      : `${basePath}/admindashboard`;

  const navItems = [{ label: "Dashboard", icon: Home, path: dashboardPath }];

  if (role === "platform_manager") {
    navItems.push({
      label: "Company Payments",
      icon: BarChart3,
      path: `${basePath}/company-payments`,
    });
    navItems.push({
      label: "Verification Tasks",
      icon: Building2,
      path: `${basePath}/verification-tasks`,
    });
    navItems.push({
      label: "Assigned Complaints",
      icon: MessageSquare,
      path: `${basePath}/assigned-complaints`,
    });
    navItems.push({
      label: "Profile",
      icon: User,
      path: `${basePath}/profile`,
    });
  }

  if (role !== "platform_manager") {
    navItems.push(
      {
        label: "Data Management",
        icon: Database,
        path: `${basePath}/data-management`,
      },
      {
        label: "Revenue Analytics",
        icon: BarChart3,
        path: `${basePath}/revenue-analytics`,
      },
      {
        label: "Platform Revenue Intelligence",
        icon: BarChart3,
        path: `${basePath}/platform-revenue-intelligence`,
      },
    );
  }

  if (role === "admin" || role === "superadmin") {
    navItems.push({
      label: "Platform Managers",
      icon: Users,
      path: `${basePath}/platform-managers`,
    });
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include",
      });
      navigate("/admin-login");
    } catch (err) {
      console.error("Logout error:", err);
      navigate("/admin-login");
    }
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Building2 size={24} />
            <span>
              {headerLabel}
              {headerSuffix}
            </span>
          </div>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                className="nav-item"
                onClick={() => navigate(item.path)}
              >
                <Icon size={20} />
                {sidebarOpen && (
                  <>
                    <span>{item.label}</span>
                    <ChevronRight size={16} />
                  </>
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`admin-main ${sidebarOpen ? "" : "expanded"}`}>
        {!sidebarOpen && (
          <button
            className="mobile-menu-toggle"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
        )}
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
