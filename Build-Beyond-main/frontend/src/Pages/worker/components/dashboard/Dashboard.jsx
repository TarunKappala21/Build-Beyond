import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';
import StatsGrid from './sub-components/StatsGrid';
import { OffersSection, CompaniesSection, JobsSection } from './sub-components/DashboardSections';

const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
  const [data, setData] = useState({
    workerName: '',
    stats: { pendingOffers: 0, activeApplications: 0 },
    user: { availability: 'available' },
    offers: [],
    companies: [],
    jobs: []
  });


  useEffect(() => {
    // Fetch dashboard JSON from explicit API endpoint to avoid legacy HTML route collisions
    fetch('/api/worker/dashboard', {
      credentials: 'include',
      headers: { 'Accept': 'application/json' }
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        return res.json();
      })
      .then((fetchedData) => {
        setData(fetchedData);
        // Update localStorage with fresh user data including profileImage
        if (fetchedData.user) {
          const existingUser = JSON.parse(localStorage.getItem('user') || '{}');
          localStorage.setItem('user', JSON.stringify({ ...existingUser, ...fetchedData.user }));
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching dashboard:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="wkd-container">
        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading Dashboard...</div>
      </div>
    );
  }
  const { workerName, stats, user, offers, companies, jobs } = data;

  if (error) {
    return (
      <div className="wkd-container">
        <div style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>Error: {error}</div>
      </div>
    );
  }


  return (
    <main className="wkd-dashboard">
      <div className="wkd-container">
        <div className="wkd-dashboard-header">
          <h1 className="wkd-dashboard-title">Welcome, {workerName}</h1>
        </div>

        <StatsGrid stats={stats} availability={user.availability} />

        <OffersSection offers={offers} />

        <CompaniesSection companies={companies} />

        <JobsSection jobs={jobs} />
      </div>
    </main>
  );
};

export default Dashboard;