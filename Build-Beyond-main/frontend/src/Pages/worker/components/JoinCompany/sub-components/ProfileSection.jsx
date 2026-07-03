import React from 'react';
import { Link } from 'react-router-dom';
// Styles are in parent JoinCompany.css

// Profile Header Component
export const ProfileHeader = ({ user }) => {
  return (
    <div className="wkjc-profile-header">
      <img 
        src={user?.profileImage || 'https://t4.ftcdn.net/jpg/03/64/21/11/360_F_364211147_1qgLVxv1Tcq0Ohz3FawUfrtONzz8nq3e.jpg'} 
        alt={user?.name} 
        className="wkjc-profile-image" 
      />
      <div className="wkjc-profile-info">
        <h1>{user?.name}</h1>
        <div className="wkjc-profile-title">
          <p><strong>{user?.professionalTitle || 'Professional'}</strong> with {user?.experience || 0} years experience</p>
        </div>
      </div>
      <Link to="/workerdashboard/profile-edit">
        <button className="wkjc-btn wkjc-btn-outline">Edit Profile</button>
      </Link>
    </div>
  );
};

// Profile Stats Component
export const ProfileStats = ({ applications, offers, experience }) => {
  return (
    <div className="wkjc-profile-stats">
      <div className="wkjc-stat-box">
        <div className="wkjc-stat-number">{applications}</div>
        <div className="wkjc-stat-label">Applications</div>
      </div>
      <div className="wkjc-stat-box">
        <div className="wkjc-stat-number">{offers}</div>
        <div className="wkjc-stat-label">Offers</div>
      </div>
      <div className="wkjc-stat-box">
        <div className="wkjc-stat-number">{experience}</div>
        <div className="wkjc-stat-label">Years Experience</div>
      </div>
    </div>
  );
};
