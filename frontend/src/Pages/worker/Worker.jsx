import React from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import WorkerNavbar from './components/worker-navbar/WorkerNavbar';
import Dashboard from './components/dashboard/Dashboard';
import Jobs from './components/Jobs/Jobs';
import JoinCompany from './components/JoinCompany/JoinCompany';
import OngoingProjects from './components/OngoingProjects/OngoingProjects';
import MyCompany from './components/MyCompany/MyCompany';
import Settings from './components/Settings/Settings';
import ProfileEdit from './components/ProfileEdit/ProfileEdit';
import InteriorDesignerJobs from './components/InteriorDesignerJobs/InteriorDesignerJobs';
import Revenue from './components/Revenue/Revenue';
import Chat from '../../components/Chat/Chat';
import './Worker.css';

const WorkerLayout = () => {
  return (
    <div>
      <WorkerNavbar />
      <Outlet />
    </div>
  );
};

const Worker = () => (
  <Routes>
    <Route path="/" element={<WorkerLayout />}>
      <Route index element={<Dashboard />} />
      <Route path="jobs" element={<Jobs />} />
      <Route path="join_company" element={<JoinCompany />} />
      <Route path="ongoing-projects" element={<OngoingProjects />} />
      <Route path="my-company" element={<MyCompany />} />
      <Route path="revenue" element={<Revenue />} />
      <Route path="settings" element={<Settings />} />
      <Route path="profile-edit" element={<ProfileEdit />} />
      <Route path="interior-jobs" element={<InteriorDesignerJobs />} />
      <Route path="chat/:roomId" element={<Chat userRole="worker" />} />
    </Route>
  </Routes>
);

export default Worker;