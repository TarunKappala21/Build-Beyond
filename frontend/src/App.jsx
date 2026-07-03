import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginSignUp from "./Pages/login-signup/LoginSignUp";
import Customer from "./Pages/customer/Customer";
import Company from "./Pages/company/Company";
import Worker from "./Pages/worker/Worker";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import AdminLogin from "./Pages/admin/AdminLogin";
import PlatformManagerLogin from "./Pages/admin/PlatformManagerLogin";
import AdminDashboard from "./Pages/admin/AdminDashboard/AdminDashboard";
import Admin from "./Pages/admin/Admin";
import PlatformManager from "./Pages/platformmanager/PlatformManager";
import NotFound from "./Pages/NotFound";
import Unauthorized from "./Pages/Unauthorized";

import "./App.css";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<LoginSignUp />} />
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route
        path="/platform-manager-login"
        element={<PlatformManagerLogin />}
      />
      {/* Admin Routes - Protected */}
      <Route
        path="/platform-manager/*"
        element={
          <AdminProtectedRoute allowedRoles={["platform_manager"]}>
            <PlatformManager />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin-view/*"
        element={
          <AdminProtectedRoute allowedRoles={["admin", "superadmin"]}>
            <Admin />
          </AdminProtectedRoute>
        }
      />

      <Route
        path="/customerdashboard/*"
        element={
          <ProtectedRoute role="customer">
            <Customer />
          </ProtectedRoute>
        }
      />
      <Route
        path="/companydashboard/*"
        element={
          <ProtectedRoute role="company">
            <Company />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workerdashboard/*"
        element={
          <ProtectedRoute role="worker">
            <Worker />
          </ProtectedRoute>
        }
      />
      <Route path="/not-found" element={<NotFound />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<NotFound />} />
      {/* Add other routes as needed, e.g., for sub-pages */}
    </Routes>
  );
};

export default App;
