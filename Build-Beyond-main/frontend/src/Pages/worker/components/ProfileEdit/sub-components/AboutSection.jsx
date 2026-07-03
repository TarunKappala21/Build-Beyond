import React from 'react';
import './AboutSection.css';

const AboutSection = ({ formData, specialtiesOptions, onInputChange, onSpecialtyChange }) => {
  return (
    <div className="wkpe-form-section">
      <h2>About</h2>

      <div className="wkpe-form-group">
        <label htmlFor="about">Professional Biography</label>
        <textarea
          id="about"
          name="about"
          value={formData.about}
          onChange={onInputChange}
          required
        />
      </div>

      <div className="wkpe-form-group">
        <label>Specialties</label>
        <div className="wkpe-checkbox-group">
          {specialtiesOptions.map((specialty) => (
            <div key={specialty.id} className="wkpe-checkbox-item">
              <input
                type="checkbox"
                id={specialty.id}
                value={specialty.value}
                checked={formData.specialties.includes(specialty.value)}
                onChange={onSpecialtyChange}
              />
              <label htmlFor={specialty.id}>{specialty.label}</label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AboutSection;
