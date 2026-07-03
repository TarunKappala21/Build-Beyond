import React, { useEffect, useState } from "react";
import API_BASE from "../../../../../api/backendBase";

export default function SecuritySection() {
  const [securityForm, setSecurityForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loadingTwoFactor, setLoadingTwoFactor] = useState(true);

  useEffect(() => {
    const fetchTwoFactorStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/2fa/status`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        if (res.ok) {
          const data = await res.json();
          setTwoFactorEnabled(Boolean(data.twoFactorEnabled));
        }
      } catch (error) {
        console.error("Failed to load 2FA status", error);
      } finally {
        setLoadingTwoFactor(false);
      }
    };

    fetchTwoFactorStatus();
  }, []);

  function handleSecurityChange(e) {
    const { name, value } = e.target;
    setSecurityForm((prev) => ({ ...prev, [name]: value }));
  }

  async function submitSecurity(e) {
    e.preventDefault();
    if (!securityForm.currentPassword) {
      alert("Enter current password");
      return;
    }
    if (!securityForm.newPassword || securityForm.newPassword.length < 8) {
      alert("New password must be at least 8 characters");
      return;
    }
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    if (securityForm.currentPassword === securityForm.newPassword) {
      alert("New password cannot be same as current password");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/company/password/update`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: securityForm.currentPassword,
          newPassword: securityForm.newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || data.message || "Failed to update password");
        return;
      }

      alert(data.message || "Password updated successfully");
      setSecurityForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      alert("Failed to update password");
    }
  }

  const toggleTwoFactor = async () => {
    try {
      const nextValue = !twoFactorEnabled;
      const res = await fetch(`${API_BASE}/api/2fa/status`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: nextValue }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to update 2FA");
        return;
      }

      setTwoFactorEnabled(nextValue);
      alert(data.message || "2FA setting updated");
    } catch (error) {
      alert("Failed to update 2FA");
    }
  }

  return (
    <section className="cs-section cs-active">
      <h2 className="cs-section-title">Security Settings</h2>
      <form className="cs-form" onSubmit={submitSecurity}>
        <div className="cs-form-row">
          <label>Current Password</label>
          <input
            type="password"
            name="currentPassword"
            className="cs-input"
            value={securityForm.currentPassword}
            onChange={handleSecurityChange}
            required
          />
        </div>
        <div className="cs-form-row">
          <label>New Password</label>
          <input
            type="password"
            name="newPassword"
            className="cs-input"
            value={securityForm.newPassword}
            onChange={handleSecurityChange}
            required
          />
        </div>
        <div className="cs-form-row">
          <label>Confirm New Password</label>
          <input
            type="password"
            name="confirmPassword"
            className="cs-input"
            value={securityForm.confirmPassword}
            onChange={handleSecurityChange}
            required
          />
        </div>
        <div className="cs-actions">
          <button type="submit" className="cs-btn-primary">
            Update Password
          </button>
        </div>

        <hr style={{ margin: "1.5rem 0" }} />
        <div className="cs-form-row">
          <label>Two-Factor Authentication (2FA)</label>
          <p style={{ color: "#666", marginBottom: "0.5rem" }}>
            Require OTP verification every time you login.
          </p>
          <button
            type="button"
            className="cs-btn-primary"
            disabled={loadingTwoFactor}
            onClick={toggleTwoFactor}
          >
            {loadingTwoFactor
              ? "Loading..."
              : twoFactorEnabled
              ? "Disable 2FA"
              : "Enable 2FA"}
          </button>
        </div>
      </form>
    </section>
  );
}
