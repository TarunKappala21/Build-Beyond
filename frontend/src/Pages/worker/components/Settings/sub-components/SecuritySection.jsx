import React from 'react';
import './SecuritySection.css';

const SecuritySection = ({
  passwordForm,
  onPasswordChange,
  onSubmit,
  twoFactorEnabled,
  updatingTwoFactor,
  onToggleTwoFactor,
}) => {
  return (
    <div className="wkst-settings-section">
      <h2>Security Settings</h2>
      <p>Change your password to keep your account secure</p>

      <form onSubmit={onSubmit} className="wkst-password-form">
        <div className="wkst-form-group">
          <label htmlFor="currentPassword">Current Password</label>
          <input
            type="password"
            id="currentPassword"
            name="currentPassword"
            value={passwordForm.currentPassword}
            onChange={onPasswordChange}
            required
          />
        </div>

        <div className="wkst-form-group">
          <label htmlFor="newPassword">New Password</label>
          <input
            type="password"
            id="newPassword"
            name="newPassword"
            value={passwordForm.newPassword}
            onChange={onPasswordChange}
            required
            minLength="6"
          />
        </div>

        <div className="wkst-form-group">
          <label htmlFor="confirmPassword">Confirm New Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={passwordForm.confirmPassword}
            onChange={onPasswordChange}
            required
            minLength="6"
          />
        </div>

        <button type="submit" className="wkst-btn wkst-btn-primary">
          Update Password
        </button>

        <div className="wkst-form-group" style={{ marginTop: '1rem' }}>
          <label>Two-Factor Authentication (2FA)</label>
          <p style={{ color: '#666', marginBottom: '0.5rem' }}>
            Require OTP verification for every login.
          </p>
          <button
            type="button"
            className="wkst-btn wkst-btn-primary"
            onClick={onToggleTwoFactor}
            disabled={updatingTwoFactor}
          >
            {updatingTwoFactor ? 'Updating...' : twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SecuritySection;
