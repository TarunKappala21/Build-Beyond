import React from 'react';
import './AvailabilitySection.css';

const AvailabilitySection = ({ availability, onAvailabilityChange, onSubmit }) => {
  return (
    <div className="wkst-settings-section">
      <h2>Availability Settings</h2>
      <p>Manage your availability status for new projects</p>

      <form onSubmit={onSubmit} className="wkst-availability-form">
        <div className="wkst-radio-group">
          <label>
            <input
              type="radio"
              name="availability"
              value="available"
              checked={availability === 'available'}
              onChange={(e) => onAvailabilityChange(e.target.value)}
            />
            <span className="wkst-radio-label">
              <i className="fas fa-check-circle"></i> Available
            </span>
            <p className="wkst-radio-description">Accept new project opportunities</p>
          </label>

          <label>
            <input
              type="radio"
              name="availability"
              value="busy"
              checked={availability === 'busy'}
              onChange={(e) => onAvailabilityChange(e.target.value)}
            />
            <span className="wkst-radio-label">
              <i className="fas fa-clock"></i> Busy
            </span>
            <p className="wkst-radio-description">Limited capacity for new projects</p>
          </label>

          <label>
            <input
              type="radio"
              name="availability"
              value="unavailable"
              checked={availability === 'unavailable'}
              onChange={(e) => onAvailabilityChange(e.target.value)}
            />
            <span className="wkst-radio-label">
              <i className="fas fa-times-circle"></i> Unavailable
            </span>
            <p className="wkst-radio-description">Not accepting new projects</p>
          </label>
        </div>

        <button type="submit" className="wkst-btn wkst-btn-primary">
          Save Availability
        </button>
      </form>
    </div>
  );
};

export default AvailabilitySection;
