import React, { useState, useEffect } from "react";
import { Settings, Save, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import "./AdminSettings.css";

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    platformFeePercentage: 5,
    autoApprovalThreshold: 1000,
    maxUploadSizeBytes: 5242880,
    maintenanceMode: false,
    announcementMessage: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      } else {
        setError("Failed to fetch settings");
      }
    } catch (err) {
      setError("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError("Failed to save settings");
      }
    } catch (err) {
      setError("Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value
    }));
  };

  if (loading) {
    return (
      <div className="admin-loading-container">
        <Loader2 size={40} className="spin" />
        <p>Loading System Settings...</p>
      </div>
    );
  }

  return (
    <div className="admin-settings-container">
      <div className="admin-settings-header">
        <h1><Settings size={28} /> Global System Settings</h1>
        <p>Configure platform-wide variables and announcements</p>
      </div>

      {error && (
        <div className="admin-settings-alert error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="admin-settings-alert success">
          <CheckCircle size={20} />
          <span>Settings saved successfully!</span>
        </div>
      )}

      <form className="admin-settings-form" onSubmit={handleSave}>
        <div className="settings-section">
          <h3>Financial Configuration</h3>
          
          <div className="settings-group">
            <label htmlFor="platformFeePercentage">Platform Fee Percentage (%)</label>
            <input
              type="number"
              id="platformFeePercentage"
              name="platformFeePercentage"
              min="0"
              max="100"
              step="0.1"
              value={settings.platformFeePercentage || 0}
              onChange={handleChange}
            />
            <small>The percentage taken from successful project payments.</small>
          </div>
        </div>

        <div className="settings-section">
          <h3>Operations</h3>
          
          <div className="settings-group">
            <label htmlFor="autoApprovalThreshold">Auto-Approval Threshold (₹)</label>
            <input
              type="number"
              id="autoApprovalThreshold"
              name="autoApprovalThreshold"
              min="0"
              value={settings.autoApprovalThreshold || 0}
              onChange={handleChange}
            />
            <small>Transactions below this amount might bypass manual admin checks.</small>
          </div>

          <div className="settings-group">
            <label htmlFor="maxUploadSizeBytes">Max Upload Size (Bytes)</label>
            <input
              type="number"
              id="maxUploadSizeBytes"
              name="maxUploadSizeBytes"
              min="1048576" // 1MB
              value={settings.maxUploadSizeBytes || 0}
              onChange={handleChange}
            />
            <small>Maximum allowed size for document uploads. Default is 5242880 (5MB).</small>
          </div>
        </div>

        <div className="settings-section">
          <h3>System State</h3>

          <div className="settings-group checkbox-group">
            <input
              type="checkbox"
              id="maintenanceMode"
              name="maintenanceMode"
              checked={settings.maintenanceMode || false}
              onChange={handleChange}
            />
            <div>
              <label htmlFor="maintenanceMode">Enable Maintenance Mode</label>
              <small>If checked, a global maintenance banner could be displayed.</small>
            </div>
          </div>

          <div className="settings-group">
            <label htmlFor="announcementMessage">Global Announcement Message</label>
            <textarea
              id="announcementMessage"
              name="announcementMessage"
              value={settings.announcementMessage || ""}
              onChange={handleChange}
              placeholder="E.g., System will be down for maintenance on Sunday..."
              rows={3}
            />
            <small>Leave blank to disable announcements.</small>
          </div>
        </div>

        <div className="settings-actions">
          <button type="submit" className="save-settings-btn" disabled={saving}>
            {saving ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;