// src/pages/company/components/company-public-profile/components/AboutSection.jsx
import React from 'react';

const AboutSection = ({ about, didYouKnow }) => {
  return (
    <div className="profile-about-section">
      <h2 className="profile-section-title">
        <i className="fas fa-info-circle"></i> About Us
      </h2>
      <div className="profile-about-content">
        <p className="profile-about-text">{about || 'No information provided.'}</p>
      </div>
      
      {didYouKnow && (
        <div className="profile-did-you-know">
          <h3 className="profile-did-you-know-title">
            <i className="fas fa-lightbulb"></i> Did You Know?
          </h3>
          <p className="profile-did-you-know-text">{didYouKnow}</p>
        </div>
      )}
    </div>
  );
};

export default AboutSection;
