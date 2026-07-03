import React from 'react';
import './PersonalInfoSection.css';

const PersonalInfoSection = ({ 
  formData, 
  profilePreview, 
  onInputChange, 
  onImageChange 
}) => {
  return (
    <div className="wkpe-form-section">
      <h2>Personal Information</h2>

      <div className="wkpe-profile-image-container">
        <div className="wkpe-profile-preview">
          {profilePreview ? (
            <img src={profilePreview} alt="Profile" />
          ) : (
            <span>Profile Photo</span>
          )}
        </div>
        <input
          type="file"
          id="profileImage"
          accept="image/*"
          onChange={onImageChange}
        />
      </div>

      <div className="wkpe-form-group">
        <label htmlFor="name">Name</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={onInputChange}
          required
        />
      </div>

      <div className="wkpe-form-group">
        <label htmlFor="professionalTitle">Professional Title</label>
        <input
          type="text"
          id="professionalTitle"
          name="professionalTitle"
          value={formData.professionalTitle}
          onChange={onInputChange}
          required
        />
      </div>

      <div className="wkpe-form-group">
        <label htmlFor="experience">Years of Experience</label>
        <input
          type="number"
          id="experience"
          name="experience"
          min="1"
          value={formData.experience}
          onChange={onInputChange}
          required
        />
      </div>
    </div>
  );
};

export default PersonalInfoSection;
