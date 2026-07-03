// src/Pages/company/Company.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";

// Correct relative paths based on your folder structure
import CompanyNavbar from "./components/company-navbar/CompanyNavbar";


import CompanyProjectRequests from "./components/company-project-requests/CompanyProjectRequests";
import CompanyDashboard from "./components/company-dashboard/CompanyDashboard";
import CompanyBids from "./components/company-bids/CompanyBids";
import CompanyOngoing from "./components/company-ongoing/CompanyOngoing";
import CompanyRevenue from "./components/company-revenue/CompanyRevenue";
import CompanyHiring from "./components/company-hiring/CompanyHiring";
import CompanyEmployees from "./components/company-employees/CompanyEmployees";
import CompanySettings from "./components/company-settings/CompanySettings";
import CompanyAddNewProject from "./components/forms/company-addnewproject/CompanyAddNewProject";
import Chat from "../../components/Chat/Chat";

// Placeholder for Project Requests (you can create later)
const ProjectRequests = () => <div>Project Requests Page</div>;

const Company = () => {
  return (
    <>
      <CompanyNavbar />
      <Routes>
        <Route
          path="*"
          element={
            <Routes>
              <Route path="companydashboard" element={<CompanyDashboard />} />
              <Route path="companybids" element={<CompanyBids />} />
              <Route path="companyongoing_projects" element={<CompanyOngoing />} />
              <Route path="project_requests" element={<CompanyProjectRequests />} />
              <Route path="companyrevenue" element={<CompanyRevenue />} />
              <Route path="companyhiring" element={<CompanyHiring />} />
              <Route path="my-employees" element={<CompanyEmployees />} />
              <Route path="companySettings" element={<CompanySettings />} />
              <Route path="addnewproject" element={<CompanyAddNewProject />} />
              <Route path="chat/:roomId" element={<Chat userRole="company" />} />

              {/* Fallback to dashboard */}
              <Route path="*" element={<CompanyDashboard />} />
            </Routes>
          }
        />
      </Routes>
    </>
  );
};

export default Company;