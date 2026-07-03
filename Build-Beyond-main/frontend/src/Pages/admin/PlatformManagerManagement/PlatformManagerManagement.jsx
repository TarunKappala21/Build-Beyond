import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Trash2, Eye, Power, TrendingUp,
  UserCheck, AlertCircle, CheckCircle, XCircle, Loader2
} from 'lucide-react';
import AdminLayout from '../../../components/admin/AdminLayout';
import './PlatformManagerManagement.css';

const PlatformManagerManagement = () => {
  const [platformManagers, setPlatformManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [selectedPM, setSelectedPM] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: ''
  });
  const [createdCredentials, setCreatedCredentials] = useState(null);

  useEffect(() => {
    fetchPlatformManagers();
  }, []);

  const fetchPlatformManagers = async () => {
    try {
      const response = await fetch('/api/admin/platform-managers', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setPlatformManagers(data.platformManagers);
      }
    } catch (error) {
      console.error('Error fetching platform managers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePM = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/platform-managers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.success) {
        setCreatedCredentials(data.credentials);
        fetchPlatformManagers();
        setFormData({ name: '', email: '', username: '', password: '' });
        alert('Platform manager created successfully! Share the credentials with the manager.');
      } else {
        alert(data.error || 'Failed to create platform manager');
      }
    } catch (error) {
      console.error('Error creating platform manager:', error);
      alert('Error creating platform manager');
    }
  };

  const handleDeletePM = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}? Their pending tasks will be reassigned.`)) {
      try {
        const response = await fetch(`/api/admin/platform-managers/${id}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        const data = await response.json();
        if (data.success) {
          alert('Platform manager deleted successfully');
          fetchPlatformManagers();
        } else {
          alert(data.error || 'Failed to delete platform manager');
        }
      } catch (error) {
        console.error('Error deleting platform manager:', error);
        alert('Error deleting platform manager');
      }
    }
  };

  const handleToggleStatus = async (id, currentStatus, name) => {
    const action = currentStatus === 'active' ? 'deactivate' : 'activate';
    if (window.confirm(`Are you sure you want to ${action} ${name}?`)) {
      try {
        const response = await fetch(`/api/admin/platform-managers/${id}/toggle-status`, {
          method: 'PATCH',
          credentials: 'include'
        });
        const data = await response.json();
        if (data.success) {
          alert(`Platform manager ${action}d successfully`);
          fetchPlatformManagers();
        } else {
          alert(data.error || `Failed to ${action} platform manager`);
        }
      } catch (error) {
        console.error('Error toggling status:', error);
        alert('Error toggling status');
      }
    }
  };

  const handleViewPerformance = async (pm) => {
    setSelectedPM(pm);
    setShowPerformanceModal(true);
    try {
      const response = await fetch(`/api/admin/platform-managers/${pm._id}/performance`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setPerformanceData(data.performance);
      }
    } catch (error) {
      console.error('Error fetching performance:', error);
    }
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setCreatedCredentials(null);
    setFormData({ name: '', email: '', username: '', password: '' });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="pm-loading-container">
          <Loader2 size={32} className="spin" />
          <p>Loading platform managers...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="pm-management-container">
      <div className="pm-header">
        <div>
          <h1><Users size={28} /> Platform Manager Management</h1>
          <p>Manage platform managers who handle verifications and complaints</p>
        </div>
        <button className="pm-create-btn" onClick={() => setShowCreateModal(true)}>
          <Plus size={20} /> Create Platform Manager
        </button>
      </div>

      <div className="pm-stats-grid">
        <div className="pm-stat-card">
          <UserCheck size={24} className="pm-stat-icon active" />
          <div>
            <h3>{platformManagers.filter(pm => pm.status === 'active').length}</h3>
            <p>Active Managers</p>
          </div>
        </div>
        <div className="pm-stat-card">
          <AlertCircle size={24} className="pm-stat-icon inactive" />
          <div>
            <h3>{platformManagers.filter(pm => pm.status === 'inactive').length}</h3>
            <p>Inactive Managers</p>
          </div>
        </div>
        <div className="pm-stat-card">
          <CheckCircle size={24} className="pm-stat-icon completed" />
          <div>
            <h3>{platformManagers.reduce((sum, pm) => sum + (pm.stats?.totalCompleted || 0), 0)}</h3>
            <p>Total Tasks Completed</p>
          </div>
        </div>
        <div className="pm-stat-card">
          <TrendingUp size={24} className="pm-stat-icon pending" />
          <div>
            <h3>{platformManagers.reduce((sum, pm) => sum + (pm.stats?.pendingTasks || 0), 0)}</h3>
            <p>Pending Tasks</p>
          </div>
        </div>
      </div>

      <div className="pm-table-container">
        <table className="pm-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Email</th>
              <th>Status</th>
              <th>Total Assigned</th>
              <th>Completed</th>
              <th>Pending</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {platformManagers.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '40px' }}>
                  <AlertCircle size={48} style={{ opacity: 0.3, marginBottom: '10px' }} />
                  <p>No platform managers yet. Create one to get started!</p>
                </td>
              </tr>
            ) : (
              platformManagers.map(pm => (
                <tr key={pm._id}>
                  <td>{pm.name}</td>
                  <td>{pm.username}</td>
                  <td>{pm.email}</td>
                  <td>
                    <span className={`pm-status-badge ${pm.status}`}>
                      {pm.status === 'active' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                      {pm.status}
                    </span>
                  </td>
                  <td>{pm.stats?.totalAssigned || 0}</td>
                  <td>{pm.stats?.totalCompleted || 0}</td>
                  <td>{pm.stats?.pendingTasks || 0}</td>
                  <td>{pm.lastLogin ? new Date(pm.lastLogin).toLocaleString() : 'Never'}</td>
                  <td className="pm-actions">
                    <button 
                      className="pm-action-btn view" 
                      onClick={() => handleViewPerformance(pm)}
                      title="View Performance"
                    >
                      <Eye size={16} />
                    </button>
                    <button 
                      className="pm-action-btn toggle" 
                      onClick={() => handleToggleStatus(pm._id, pm.status, pm.name)}
                      title={pm.status === 'active' ? 'Deactivate' : 'Activate'}
                    >
                      <Power size={16} />
                    </button>
                    <button 
                      className="pm-action-btn delete" 
                      onClick={() => handleDeletePM(pm._id, pm.name)}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Platform Manager Modal */}
      {showCreateModal && (
        <div className="pm-modal-overlay" onClick={closeCreateModal}>
          <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
            <h2><Plus size={24} /> Create Platform Manager</h2>
            {createdCredentials ? (
              <div className="pm-credentials-display">
                <div className="pm-success-message">
                  <CheckCircle size={48} />
                  <h3>Platform Manager Created Successfully!</h3>
                  <p>Share these credentials with the platform manager:</p>
                </div>
                <div className="pm-credentials">
                  <div className="pm-credential-item">
                    <strong>Username:</strong>
                    <code>{createdCredentials.username}</code>
                  </div>
                  <div className="pm-credential-item">
                    <strong>Password:</strong>
                    <code>{createdCredentials.password}</code>
                  </div>
                </div>
                <div className="pm-warning">
                  <AlertCircle size={20} />
                  <p>Warning: Save these credentials now! The password won't be shown again.</p>
                </div>
                <button className="pm-btn-primary" onClick={closeCreateModal}>
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreatePM} className="pm-form">
                <div className="pm-form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    placeholder="Enter full name"
                  />
                </div>
                <div className="pm-form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                    placeholder="Enter email address"
                  />
                </div>
                <div className="pm-form-group">
                  <label>Username *</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    required
                    placeholder="Enter username for login"
                  />
                </div>
                <div className="pm-form-group">
                  <label>Password *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                    minLength="6"
                    placeholder="Enter password"
                  />
                  <small>Minimum 6 characters</small>
                </div>
                <div className="pm-form-actions">
                  <button type="button" className="pm-btn-secondary" onClick={closeCreateModal}>
                    Cancel
                  </button>
                  <button type="submit" className="pm-btn-primary">
                    Create Platform Manager
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Performance Modal */}
      {showPerformanceModal && selectedPM && (
        <div className="pm-modal-overlay" onClick={() => setShowPerformanceModal(false)}>
          <div className="pm-modal pm-performance-modal" onClick={(e) => e.stopPropagation()}>
            <h2><TrendingUp size={24} /> Performance: {selectedPM.name}</h2>
            {performanceData ? (
              <div className="pm-performance-content">
                <div className="pm-perf-section">
                  <h3>Overall Statistics</h3>
                  <div className="pm-perf-grid">
                    <div className="pm-perf-card">
                      <span className="pm-perf-label">Total Assigned</span>
                      <span className="pm-perf-value">{performanceData.stats.totalAssigned}</span>
                    </div>
                    <div className="pm-perf-card">
                      <span className="pm-perf-label">Completed</span>
                      <span className="pm-perf-value success">{performanceData.stats.totalCompleted}</span>
                    </div>
                    <div className="pm-perf-card">
                      <span className="pm-perf-label">Pending</span>
                      <span className="pm-perf-value pending">{performanceData.stats.pendingTasks}</span>
                    </div>
                    <div className="pm-perf-card">
                      <span className="pm-perf-label">Companies Verified</span>
                      <span className="pm-perf-value">{performanceData.stats.companiesVerified}</span>
                    </div>
                    <div className="pm-perf-card">
                      <span className="pm-perf-label">Workers Verified</span>
                      <span className="pm-perf-value">{performanceData.stats.workersVerified}</span>
                    </div>
                    <div className="pm-perf-card">
                      <span className="pm-perf-label">Complaints Resolved</span>
                      <span className="pm-perf-value">{performanceData.stats.complaintsResolved}</span>
                    </div>
                  </div>
                </div>

                <div className="pm-perf-section">
                  <h3>Recent Activity</h3>
                  <div className="pm-perf-timeline">
                    <div className="pm-timeline-item">
                      <strong>Last Week</strong>
                      <p>{performanceData.recentActivity.lastWeek.total} tasks completed</p>
                      <small>
                        {performanceData.recentActivity.lastWeek.verificationsCompleted} verifications, 
                        {performanceData.recentActivity.lastWeek.complaintsResolved} complaints
                      </small>
                    </div>
                    <div className="pm-timeline-item">
                      <strong>Last Month</strong>
                      <p>{performanceData.recentActivity.lastMonth.total} tasks completed</p>
                      <small>
                        {performanceData.recentActivity.lastMonth.verificationsCompleted} verifications, 
                        {performanceData.recentActivity.lastMonth.complaintsResolved} complaints
                      </small>
                    </div>
                  </div>
                </div>

                <div className="pm-perf-section">
                  <h3>Current Workload</h3>
                  <div className="pm-workload-bars">
                    <div className="pm-workload-item">
                      <span>Pending Verifications</span>
                      <div className="pm-progress-bar">
                        <div 
                          className="pm-progress-fill" 
                          style={{width: `${Math.min(performanceData.currentTasks.pendingVerifications * 10, 100)}%`}}
                        ></div>
                      </div>
                      <span>{performanceData.currentTasks.pendingVerifications}</span>
                    </div>
                    <div className="pm-workload-item">
                      <span>Pending Complaints</span>
                      <div className="pm-progress-bar">
                        <div 
                          className="pm-progress-fill" 
                          style={{width: `${Math.min(performanceData.currentTasks.pendingComplaints * 10, 100)}%`}}
                        ></div>
                      </div>
                      <span>{performanceData.currentTasks.pendingComplaints}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="pm-loading-container">
                <Loader2 size={32} className="spin" />
                <p>Loading performance data...</p>
              </div>
            )}
            <button className="pm-btn-primary" onClick={() => setShowPerformanceModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
    </AdminLayout>
  );
};

export default PlatformManagerManagement;
