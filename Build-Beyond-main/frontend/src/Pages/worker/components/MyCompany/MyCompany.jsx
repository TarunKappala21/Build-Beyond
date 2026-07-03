import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MyCompany.css';
import EmptyState from './sub-components/EmptyState';
import CompanyInfoCard from './sub-components/CompanyInfoCard';
import ProjectsSection from './sub-components/ProjectsSection';

const MyCompany = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [projects, setProjects] = useState([]);
  const [chatId, setChatId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanyData();
  }, []);

  const fetchCompanyData = async () => {
    try {
      const response = await fetch('/api/worker/my-company', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setCompany(data.company);
        setProjects(data.projects || []);
        setChatId(data.chatId);
      } else {
        console.error('Failed to fetch company data');
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveCompany = async () => {
    if (!confirm('Are you sure you want to leave this company? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/worker/leave-company', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('You have successfully left the company.');
        fetchCompanyData(); // Refresh data
      } else {
        alert('Failed to leave company');
      }
    } catch (error) {
      console.error('Error leaving company:', error);
      alert('Error leaving company');
    }
  };

  const handleOpenChat = () => {
    if (chatId) {
      navigate(`/workerdashboard/chat/${chatId}`);
    }
  };

  if (loading) {
    return (
      <div className="wkmc-container">
        <div className="wkmc-loading">Loading...</div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="wkmc-container">
        <div className="wkmc-page-header">
          <h1>My Company</h1>
        </div>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="wkmc-container">
      <div className="wkmc-page-header">
        <h1>My Company</h1>
      </div>

      {/* Company Information Card */}
      <CompanyInfoCard 
        company={company}
        projects={projects}
        onOpenChat={handleOpenChat}
        onLeaveCompany={handleLeaveCompany}
        chatId={chatId}
      />
    </div>
  );
};

export default MyCompany;
