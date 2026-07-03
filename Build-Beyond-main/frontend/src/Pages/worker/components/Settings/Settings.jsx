import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Settings.css';
import ProfileSection from './sub-components/ProfileSection';
import AvailabilitySection from './sub-components/AvailabilitySection';
import SecuritySection from './sub-components/SecuritySection';

const Settings = () => {
  const [activeSection, setActiveSection] = useState('profile');
  const [user, setUser] = useState(null);
  const [availability, setAvailability] = useState('available');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [updatingTwoFactor, setUpdatingTwoFactor] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchUserData();
    
    // Handle hash navigation
    const hash = location.hash.replace('#', '') || 'profile';
    setActiveSection(hash);
  }, [location]);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/workersettings', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setAvailability(data.user.availability || 'available');

        const twoFactorRes = await fetch('/api/2fa/status', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        if (twoFactorRes.ok) {
          const twoFactorData = await twoFactorRes.json();
          setTwoFactorEnabled(Boolean(twoFactorData.twoFactorEnabled));
        }
      } else {
        console.error('Failed to fetch user data');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleSectionChange = (section) => {
    setActiveSection(section);
    window.location.hash = section;
  };

  const handleAvailabilitySubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/worker/availability', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ availability })
      });

      const data = await response.json();
      if (response.ok) {
        alert('Availability updated successfully!');
      } else {
        alert(data.message || 'Failed to update availability.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New passwords do not match!');
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      alert('New password cannot be same as current password.');
      return;
    }

    try {
      const response = await fetch('/api/worker/password/update', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      const data = await response.json();
      if (response.ok) {
        alert('Password updated successfully!');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        alert(data.message || 'Failed to update password.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const handleTwoFactorToggle = async () => {
    setUpdatingTwoFactor(true);
    try {
      const nextValue = !twoFactorEnabled;
      const response = await fetch('/api/2fa/status', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ enabled: nextValue })
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.message || 'Failed to update 2FA setting');
        return;
      }

      setTwoFactorEnabled(nextValue);
      alert(data.message || 'Two-factor setting updated');
    } catch (error) {
      alert('Failed to update 2FA setting');
    } finally {
      setUpdatingTwoFactor(false);
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/logout', {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' }
      });

      // Clear any client-side session caches
      localStorage.removeItem('user');
      sessionStorage.clear();

      // Redirect to landing page regardless of response body
      if (res.ok) {
        navigate('/');
      } else {
        // Fallback in case API not reachable
        window.location.href = '/';
      }
    } catch (e) {
      // Network error fallback
      window.location.href = '/';
    }
  };

  if (!user) {
    return (
      <div className="wkst-container">
        <div className="wkst-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="wkst-container">
      <div className="wkst-settings-header">
        <h1>Account Settings</h1>
        <p>Manage your professional profile and account preferences</p>
      </div>

      <div className="wkst-settings-grid">
        {/* Sidebar */}
        <div className="wkst-settings-sidebar">
          <ul className="wkst-settings-nav">
            <li>
              <a
                href="#profile"
                className={activeSection === 'profile' ? 'active' : ''}
                onClick={(e) => {
                  e.preventDefault();
                  handleSectionChange('profile');
                }}
              >
                <i className="fas fa-user-circle"></i> Profile
              </a>
            </li>
            <li>
              <a
                href="#availability"
                className={activeSection === 'availability' ? 'active' : ''}
                onClick={(e) => {
                  e.preventDefault();
                  handleSectionChange('availability');
                }}
              >
                <i className="fas fa-calendar-check"></i> Availability
              </a>
            </li>
            <li>
              <a
                href="#security"
                className={activeSection === 'security' ? 'active' : ''}
                onClick={(e) => {
                  e.preventDefault();
                  handleSectionChange('security');
                }}
              >
                <i className="fas fa-lock"></i> Security
              </a>
            </li>
            <li>
              <a
                href="#logout"
                className={activeSection === 'logout' ? 'active' : ''}
                onClick={(e) => {
                  e.preventDefault();
                  handleSectionChange('logout');
                }}
              >
                <i className="fas fa-sign-out-alt"></i> Logout
              </a>
            </li>
          </ul>
        </div>

        {/* Content */}
        <div className="wkst-settings-content">
          {/* Profile Section */}
          {activeSection === 'profile' && (
            <ProfileSection user={user} onProfileUpdated={fetchUserData} />
          )}

          {/* Availability Section */}
          {activeSection === 'availability' && (
            <AvailabilitySection 
              availability={availability}
              onAvailabilityChange={setAvailability}
              onSubmit={handleAvailabilitySubmit}
            />
          )}

          {/* Security Section */}
          {activeSection === 'security' && (
            <SecuritySection 
              passwordForm={passwordForm}
              onPasswordChange={handlePasswordChange}
              onSubmit={handlePasswordSubmit}
              twoFactorEnabled={twoFactorEnabled}
              updatingTwoFactor={updatingTwoFactor}
              onToggleTwoFactor={handleTwoFactorToggle}
            />
          )}

          {/* Logout Section */}
          {activeSection === 'logout' && (
            <div className="wkst-settings-section">
              <h2>Logout</h2>
              <p>Are you sure you want to log out of your account?</p>
              <button
                onClick={handleLogout}
                className="wkst-btn wkst-btn-danger"
                style={{ marginTop: '1rem' }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
