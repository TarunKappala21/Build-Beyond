import { Routes, Route } from "react-router-dom";

import AdminDashboard from "./AdminDashboard/AdminDashboard";
import AdminDataManagement from "./AdminDataManagement/AdminDataManagement";
import AdminRevenueAnalytics from "./AdminRevenueAnalytics/AdminRevenueAnalytics";
import AdminBidDetail from "./AdminBidDetail/AdminBidDetail";
import AdminCompanyDetail from "./AdminCompanyDetail/AdminCompanyDetail";
import AdminConstructionProjectDetail from "./AdminConstructionProjectDetail/AdminConstructionProjectDetail";
import AdminCustomerDetail from "./AdminCustomerDetail/AdminCustomerDetail";
import AdminDesignRequestDetail from "./AdminDesignRequestDetail/AdminDesignRequestDetail";
import AdminJobApplicationDetail from "./AdminJobApplicationDetail/AdminJobApplicationDetail";
import AdminWorkerDetail from "./AdminWorkerDetail/AdminWorkerDetail";
import ArchitectHiringDetail from "./ArchitectHiringDetail/ArchitectHiringDetail";
import PlatformManagerManagement from "./PlatformManagerManagement/PlatformManagerManagement";
import AdminSettings from "./AdminSettings/AdminSettings";
import AdminPlatformRevenueIntelligence from "./AdminPlatformRevenueIntelligence/AdminPlatformRevenueIntelligence";

const Admin = () => {
  return (
    <Routes>
      <Route index element={<AdminDashboard />} />
      <Route path="admindashboard" element={<AdminDashboard />} />
      <Route path="data-management" element={<AdminDataManagement />} />
      <Route path="revenue-analytics" element={<AdminRevenueAnalytics />} />
      <Route path="platform-revenue-intelligence" element={<AdminPlatformRevenueIntelligence />} />
      <Route path="platform-managers" element={<PlatformManagerManagement />} />
      <Route path="settings" element={<AdminSettings />} />
      <Route path="bid/:id" element={<AdminBidDetail />} />
      <Route path="company/:id" element={<AdminCompanyDetail />} />
      <Route
        path="construction-project/:id"
        element={<AdminConstructionProjectDetail />}
      />
      <Route path="customer/:id" element={<AdminCustomerDetail />} />
      <Route path="design-request/:id" element={<AdminDesignRequestDetail />} />
      <Route
        path="job-application/:id"
        element={<AdminJobApplicationDetail />}
      />
      <Route path="worker/:id" element={<AdminWorkerDetail />} />
      <Route path="architect-hiring/:id" element={<ArchitectHiringDetail />} />
      <Route path="*" element={<div>Admin page not found</div>} />
    </Routes>
  );
};

export default Admin;
