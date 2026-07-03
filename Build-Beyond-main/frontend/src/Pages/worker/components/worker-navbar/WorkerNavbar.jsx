import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './WorkerNavbar.css';

const WorkerNavbar = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activePage, setActivePage] = useState('');

  const currentUser = user || JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    // Determine active page based on current route
    const path = location.pathname;
    if (path === '/workerdashboard' || path === '/workerdashboard/' || path === '/worker/dashboard') {
      setActivePage('dashboard');
    } else if (path.includes('/jobs')) {
      setActivePage('jobs');
    } else if (path.includes('/join_company')) {
      setActivePage('join');
    } else if (path.includes('/ongoing-projects')) {
      setActivePage('ongoing');
    } else if (path.includes('/my-company')) {
      setActivePage('my-company');
    } else if (path.includes('/revenue')) {
      setActivePage('revenue');
    } else {
      setActivePage('');
    }
  }, [location]);

  const handleLogout = async () => {
    try {
      // Call backend logout to clear session/cookies
      await fetch('/api/logout', {
        method: 'GET',
        credentials: 'include'
      });
      
      // Clear localStorage
      localStorage.removeItem('user');
      
      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Even if backend fails, clear local storage and redirect
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    setIsDropdownOpen(false);
  };

  const handleNavigation = (path, hash = '') => {
    navigate(path + hash);
    setIsDropdownOpen(false);
  };

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setIsDropdownOpen(!isDropdownOpen);
  };

  const closeDropdown = () => setIsDropdownOpen(false);

  const placeholderImg = 'https://t4.ftcdn.net/jpg/03/64/21/11/360_F_364211147_1qgLVxv1Tcq0Ohz3FawUfrtONzz8nq3e.jpg';
  const profileImage = currentUser.profileImage || placeholderImg;

  return (
    <nav className="wkb-navbar" onMouseLeave={closeDropdown}>
      <a
        href="/workerdashboard"
        className="wkb-navbar-left"
        onClick={(e) => {
          e.preventDefault();
          handleNavigation('/workerdashboard');
        }}
      >
        Build & Beyond
      </a>

      <div className="wkb-navbar-middle">
        <button
          className={`wkb-nav-link ${activePage === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleNavigation('/workerdashboard')}
        >
          Dashboard
        </button>
        <button
          className={`wkb-nav-link ${activePage === 'jobs' ? 'active' : ''}`}
          onClick={() => handleNavigation('/workerdashboard/jobs')}
        >
          New Jobs
        </button>
        <button
          className={`wkb-nav-link ${activePage === 'ongoing' ? 'active' : ''}`}
          onClick={() => handleNavigation('/workerdashboard/ongoing-projects')}
        >
          Ongoing Projects
        </button>
        <button
          className={`wkb-nav-link ${activePage === 'join' ? 'active' : ''}`}
          onClick={() => handleNavigation('/workerdashboard/join_company')}
        >
          Join a Company
        </button>
        <button
          className={`wkb-nav-link ${activePage === 'my-company' ? 'active' : ''}`}
          onClick={() => handleNavigation('/workerdashboard/my-company')}
        >
          My Company
        </button>
        <button
          className={`wkb-nav-link ${activePage === 'revenue' ? 'active' : ''}`}
          onClick={() => handleNavigation('/workerdashboard/revenue')}
        >
          Revenue
        </button>
      </div>

      <div
        className="wkb-navbar-right"
        onMouseEnter={() => setIsDropdownOpen(true)}
        onMouseLeave={() => setIsDropdownOpen(false)}
      >
        <div className="wkb-profile-icon" onClick={() => handleNavigation('/workerdashboard/settings')}>
          <img
            src={profileImage}
            alt="Profile"
            onError={(e) => { e.currentTarget.src = placeholderImg; }}
          />
        </div>
        <div className={`wkb-profile-dropdown ${isDropdownOpen ? 'show' : ''}`}>
          <div className="wkb-profile-dropdown-content">
            <button
              className="wkb-dropdown-link"
              onClick={() => handleNavigation('/workerdashboard/settings', '#profile')}
            >
              <i className="fas fa-user-circle"></i> Profile
            </button>
            <button
              className="wkb-dropdown-link"
              onClick={() => handleNavigation('/workerdashboard/settings', '#availability')}
            >
              <i className="fas fa-calendar-check"></i> Availability
            </button>
            <button
              className="wkb-dropdown-link"
              onClick={() => handleNavigation('/workerdashboard/settings', '#security')}
            >
              <i className="fas fa-lock"></i> Security
            </button>
            <button className="wkb-dropdown-link wkb-logout-link" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default WorkerNavbar;