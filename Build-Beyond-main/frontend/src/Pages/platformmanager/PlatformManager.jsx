import { Navigate, Route, Routes } from "react-router-dom";
import PlatformManagerDashboard from "./PlatformManagerDashboard";
import PlatformManagerCompanyPayments from "./PlatformManagerCompanyPayments";
import PlatformManagerProfile from "./PlatformManagerProfile";
import PlatformManagerVerificationTasks from "./PlatformManagerVerificationTasks";
import PlatformManagerAssignedComplaints from "./PlatformManagerAssignedComplaints";

const PlatformManager = () => {
  return (
    <Routes>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<PlatformManagerDashboard />} />
      <Route path="company-payments" element={<PlatformManagerCompanyPayments />} />
      <Route path="verification-tasks" element={<PlatformManagerVerificationTasks />} />
      <Route path="assigned-complaints" element={<PlatformManagerAssignedComplaints />} />
      <Route path="profile" element={<PlatformManagerProfile />} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
};

export default PlatformManager;
