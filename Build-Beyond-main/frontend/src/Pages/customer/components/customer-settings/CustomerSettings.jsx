import React, { useState, useEffect } from "react";
import axiosInstance from '../../../../api/axiosInstance';
import { useNavigate } from "react-router-dom";
import CustomerPageLoader from "../common/CustomerPageLoader";
import "./CustomerSettings.css";

const CustomerSettings = () => {
  const [activeSection, setActiveSection] = useState("profile");
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    bio: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [originalEmail, setOriginalEmail] = useState("");
  const [showVerifyEmail, setShowVerifyEmail] = useState(false);
  const [loading, setLoading] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [updatingTwoFactor, setUpdatingTwoFactor] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axiosInstance.get("/api/customersettings", {
          withCredentials: true,
        });
        const user = res.data.user || {};
        const fetchedProfile = {
          name: user.name || "Aarav",
          email: user.email || "aarav@gmail.com",
          phone: "+91 78856 34429",
          address: "Avenue Road , Meerut",
          bio: "I'm a homeowner looking to renovate my kitchen and add a deck to the back of my house.",
        };
        setProfile(fetchedProfile);
        setOriginalEmail(fetchedProfile.email);

        const twoFactorRes = await axiosInstance.get("/api/2fa/status", {
          withCredentials: true,
        });
        setTwoFactorEnabled(Boolean(twoFactorRes?.data?.twoFactorEnabled));
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleNavClick = (section) => {
    setActiveSection(section);
    if (section === "profile" && isEditing) {
      setIsEditing(false);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setShowVerifyEmail(false);
  };

  const handleEmailChange = (e) => {
    const newEmail = e.target.value;
    setProfile((p) => ({ ...p, email: newEmail }));
    setShowVerifyEmail(newEmail !== originalEmail);
  };

  const handleVerifyEmail = () => {
    alert(`Verification email sent to ${profile.email}`);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post("/api/customersettings/update", profile, {
        withCredentials: true,
      });
      alert("Profile updated successfully!");
      setIsEditing(false);
      setShowVerifyEmail(false);
    } catch (err) {
      alert(
        "Failed to update profile: " +
          (err.response?.data?.message || err.message),
      );
    }
  };

  const handlePasswordSubmit = async (e) => {
    console.log(e);
    e.preventDefault();
    const currentPassword = e.target[0].value;
    const newPassword = e.target[1].value;
    const confirmPassword = e.target[2].value;

    if (newPassword !== confirmPassword) {
      alert("New password and confirmation do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      alert("New password cannot be same as current password.");
      return;
    }

    try {
      const res = await axiosInstance.post(
        "/api/customer/password/update",
        { currentPassword, newPassword },
        { withCredentials: true },
      );
      alert(res.data.message);
      e.target.reset();
    } catch (err) {
      alert(
        "Error: " +
          (err.response?.data?.message || "Failed to update password."),
      );
    }
  };

  const handleTwoFactorToggle = async () => {
    setUpdatingTwoFactor(true);
    try {
      const targetValue = !twoFactorEnabled;
      const res = await axiosInstance.put(
        "/api/2fa/status",
        { enabled: targetValue },
        { withCredentials: true },
      );
      setTwoFactorEnabled(targetValue);
      alert(res.data.message || "Two-factor setting updated");
    } catch (err) {
      alert("Failed to update 2FA setting");
    } finally {
      setUpdatingTwoFactor(false);
    }
  };

  // LOGOUT HANDLER
  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.get("/api/logout", {}, { withCredentials: true });
    } catch (err) {
      console.error("Logout API failed, proceeding anyway:", err);
    } finally {
      navigate("/");
    }
  };

  if (loading) {
    return <CustomerPageLoader message="Loading settings..." />;
  }

  return (
    <div className="cs-container">
      <div className="cs-settings-container">
        <div className="cs-settings-header">
          <h1>Account Settings</h1>
          <p>Manage your account preferences and project settings</p>
        </div>

        <div className="cs-settings-grid">
          {/* Sidebar */}
          <div className="cs-settings-sidebar">
            <ul className="cs-settings-nav">
              <li>
                <a
                  href="#profile"
                  className={activeSection === "profile" ? "cs-active" : ""}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick("profile");
                  }}
                >
                  <i className="fas fa-user"></i> Profile
                </a>
              </li>
              <li>
                <a
                  href="#security"
                  className={activeSection === "security" ? "cs-active" : ""}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick("security");
                  }}
                >
                  <i className="fas fa-lock"></i> Security
                </a>
              </li>
              <li>
                <a
                  href="#help-center"
                  className={activeSection === "help-center" ? "cs-active" : ""}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick("help-center");
                  }}
                >
                  <i className="fas fa-question-circle"></i> Help Center
                </a>
              </li>
              <li>
                <a href="#" onClick={handleLogout}>
                  <i className="fas fa-sign-out-alt"></i> Logout
                </a>
              </li>
            </ul>
          </div>

          {/* Content */}
          <div className="cs-settings-content">
            {/* Profile Section */}
            <div
              id="profile"
              className={`cs-settings-section ${
                activeSection === "profile" ? "cs-active" : ""
              }`}
            >
              <h2>Profile Information</h2>

              {!isEditing ? (
                <div id="cs-profile-display">
                  <div className="cs-form-group">
                    <label>Full Name</label>
                    <p>{profile.name}</p>
                  </div>
                  <div className="cs-form-group">
                    <label>Email Address</label>
                    <p>{profile.email}</p>
                  </div>
                  <div className="cs-form-group">
                    <label>Phone Number</label>
                    <p>{profile.phone}</p>
                  </div>
                  <div className="cs-form-group">
                    <label>Address</label>
                    <p>{profile.address}</p>
                  </div>
                  <div className="cs-form-group">
                    <label>About Me</label>
                    <p>{profile.bio}</p>
                  </div>
                  {/* Uncomment to enable edit */}
                  {/* <button className="cs-btn" onClick={handleEditClick}>Edit Profile</button> */}
                </div>
              ) : (
                <form id="cs-profile-edit" onSubmit={handleProfileSubmit}>
                  <div className="cs-form-group">
                    <label htmlFor="cs-fullName">Full Name</label>
                    <input
                      type="text"
                      id="cs-fullName"
                      className="cs-form-control"
                      value={profile.name}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, name: e.target.value }))
                      }
                    />
                  </div>
                  <div className="cs-form-group">
                    <label htmlFor="cs-email">Email Address</label>
                    <input
                      type="email"
                      id="cs-email"
                      className="cs-form-control"
                      value={profile.email}
                      onChange={handleEmailChange}
                    />
                    {showVerifyEmail && (
                      <button
                        type="button"
                        className="cs-btn cs-btn-secondary"
                        style={{ marginTop: "0.5rem" }}
                        onClick={handleVerifyEmail}
                      >
                        Verify Email
                      </button>
                    )}
                  </div>
                  <div className="cs-form-group">
                    <label htmlFor="cs-phone">Phone Number</label>
                    <input
                      type="tel"
                      id="cs-phone"
                      className="cs-form-control"
                      value={profile.phone}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, phone: e.target.value }))
                      }
                    />
                  </div>
                  <div className="cs-form-group">
                    <label htmlFor="cs-address">Address</label>
                    <textarea
                      id="cs-address"
                      className="cs-form-control"
                      rows="3"
                      value={profile.address}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, address: e.target.value }))
                      }
                    />
                  </div>
                  <div className="cs-form-group">
                    <label htmlFor="cs-bio">About Me</label>
                    <textarea
                      id="cs-bio"
                      className="cs-form-control"
                      rows="5"
                      value={profile.bio}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, bio: e.target.value }))
                      }
                    />
                  </div>
                  <button
                    type="button"
                    className="cs-btn cs-btn-secondary"
                    style={{ marginRight: "1rem" }}
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="cs-btn">
                    Save Changes
                  </button>
                </form>
              )}
            </div>

            {/* Security Section */}
            <div
              id="security"
              className={`cs-settings-section ${
                activeSection === "security" ? "cs-active" : ""
              }`}
            >
              <h2>Security Settings</h2>
              <form id="cs-security-form" onSubmit={handlePasswordSubmit}>
                <div className="cs-form-group">
                  <label htmlFor="cs-currentPassword">Current Password</label>
                  <input
                    type="password"
                    id="cs-currentPassword"
                    className="cs-form-control"
                    required
                  />
                </div>
                <div className="cs-form-group">
                  <label htmlFor="cs-newPassword">New Password</label>
                  <input
                    type="password"
                    id="cs-newPassword"
                    className="cs-form-control"
                    required
                  />
                </div>
                <div className="cs-form-group">
                  <label htmlFor="cs-confirmPassword">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="cs-confirmPassword"
                    className="cs-form-control"
                    required
                  />
                </div>
                <button type="submit" className="cs-btn">
                  Update Password
                </button>
                <hr style={{ margin: "2rem 0" }} />

                <div className="cs-form-group">
                  <label>Two-Factor Authentication (2FA)</label>
                  <p style={{ marginBottom: "0.75rem", color: "#666" }}>
                    When enabled, login requires OTP verification every time.
                  </p>
                  <button
                    type="button"
                    className="cs-btn cs-btn-secondary"
                    onClick={handleTwoFactorToggle}
                    disabled={updatingTwoFactor}
                  >
                    {updatingTwoFactor
                      ? "Updating..."
                      : twoFactorEnabled
                        ? "Disable 2FA"
                        : "Enable 2FA"}
                  </button>
                </div>
              </form>
            </div>

            {/* Help Center */}
            <div
              id="help-center"
              className={`cs-settings-section ${
                activeSection === "help-center" ? "cs-active" : ""
              }`}
            >
              <h2>Help Center</h2>
              <div style={{ marginBottom: "2rem" }}>
                <h3 style={{ marginBottom: "1rem", color: "#555" }}>
                  Frequently Asked Questions
                </h3>
                <div className="cs-faq-item">
                  <span style={{ fontWeight: 600 }}>
                    How do I create a new project?
                  </span>
                  <p style={{ marginTop: "0.5rem", color: "#666" }}>
                    Go to the Dashboard and click on the "New Project" button in
                    the top right corner.
                  </p>
                </div>
                <div className="cs-faq-item">
                  <span style={{ fontWeight: 600 }}>
                    How do I invite team members?
                  </span>
                  <p style={{ marginTop: "0.5rem", color: "#666" }}>
                    Navigate to your project, click on "Team" tab, and use the
                    "Invite Member" button.
                  </p>
                </div>
                <div className="cs-faq-item">
                  <span style={{ fontWeight: 600 }}>
                    How can I track my project's budget?
                  </span>
                  <p style={{ marginTop: "0.5rem", color: "#666" }}>
                    Use the "Finances" tab within your project to track expenses
                    and compare with your budget.
                  </p>
                </div>
              </div>
              <div style={{ marginBottom: "2rem" }}>
                <h3 style={{ marginBottom: "1rem", color: "#555" }}>
                  Support Options
                </h3>
                <button className="cs-btn" style={{ marginRight: "1rem" }}>
                  Contact Support
                </button>
              </div>
            </div>

            {/* Logout Section */}
            <div
              id="logout"
              className={`cs-settings-section ${
                activeSection === "logout" ? "cs-active" : ""
              }`}
            >
              <h2>Logout</h2>
              <div style={{ marginBottom: "2rem" }}>
                <p style={{ marginBottom: "1.5rem" }}>
                  Are you sure you want to log out of your account?
                </p>
                <button className="cs-btn cs-btn-danger" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerSettings;
