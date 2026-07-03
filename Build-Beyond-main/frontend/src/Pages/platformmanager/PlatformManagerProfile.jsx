import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import "./PlatformManagerProfile.css";

const PlatformManagerProfile = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [profile, setProfile] = useState(null);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setError("");
      const response = await fetch("/api/platform-manager/dashboard", {
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || data.message || "Failed to load profile");
        return;
      }

      setProfile(data.platformManager || null);
    } catch (err) {
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setError("All password fields are required");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New password and confirm password do not match");
      return;
    }

    try {
      const response = await fetch("/api/platform-manager/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || data.message || "Failed to change password");
        return;
      }

      setSuccess(data.message || "Password changed successfully");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setError("Failed to change password");
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="pm-profile-loading">
          <Loader2 size={40} className="spin" />
          <p>Loading profile...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="pm-profile-page">
        <div className="pm-profile-header">
          <h1>My Profile</h1>
          <p>View your account details and change your password</p>
        </div>

        {error && (
          <div className="pm-profile-message error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="pm-profile-message success">
            <CheckCircle size={18} />
            <span>{success}</span>
          </div>
        )}

        <div className="pm-profile-grid">
          <section className="pm-profile-card">
            <h2>Account Information</h2>
            <div className="pm-profile-row">
              <span className="label">Name</span>
              <span className="value">{profile?.name || "-"}</span>
            </div>
            <div className="pm-profile-row">
              <span className="label">Username</span>
              <span className="value">{profile?.username || "-"}</span>
            </div>
            <div className="pm-profile-row">
              <span className="label">Email</span>
              <span className="value">{profile?.email || "-"}</span>
            </div>
            <div className="pm-profile-row">
              <span className="label">Status</span>
              <span className="value">{profile?.status || "-"}</span>
            </div>
            <div className="pm-profile-row">
              <span className="label">Last Login</span>
              <span className="value">
                {profile?.lastLogin ? new Date(profile.lastLogin).toLocaleString() : "-"}
              </span>
            </div>
          </section>

          <section className="pm-profile-card">
            <h2>Change Password</h2>
            <form className="pm-password-form" onSubmit={handleChangePassword}>
              <label>
                Current Password
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handleInputChange}
                  autoComplete="current-password"
                />
              </label>

              <label>
                New Password
                <input
                  type="password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handleInputChange}
                  autoComplete="new-password"
                />
              </label>

              <label>
                Confirm New Password
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handleInputChange}
                  autoComplete="new-password"
                />
              </label>

              <button type="submit">Update Password</button>
            </form>
          </section>
        </div>
      </div>
    </AdminLayout>
  );
};

export default PlatformManagerProfile;
