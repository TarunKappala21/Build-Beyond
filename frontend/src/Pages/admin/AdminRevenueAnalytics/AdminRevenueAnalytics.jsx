import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../../components/admin/AdminLayout";
import { PageHeader, ActionButton, Spinner, Card, Badge } from "../../../components/admin/AdminUIComponents";
import { useAdminAuth } from "../../../context/AdminAuthContext";
import {
  ArrowLeft, IndianRupee, TrendingUp, Clock, Building2,
  CheckCircle, Eye, X,
} from "lucide-react";
import "./AdminRevenueAnalytics.css";

const AdminRevenueAnalytics = () => {
  const navigate = useNavigate();
  const { basePath } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/revenue", { credentials: "include" });
      if (!response.ok) throw new Error(`Server responded with ${response.status}`);
      const result = await response.json();
      if (result.success) {
        setData(result);
      } else {
        throw new Error(result.error || "Failed to fetch revenue data");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (project) => {
    setSelectedProject(project);
    setShowModal(true);
    document.body.classList.add("modal-open");
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedProject(null);
    document.body.classList.remove("modal-open");
  };

  useEffect(() => {
    return () => document.body.classList.remove("modal-open");
  }, []);

  const formatCurrency = (amount) => `₹${(amount || 0).toLocaleString("en-IN")}`;
  const formatPercentage = (value) => `${(value || 0).toFixed(1)}%`;

  if (loading) return <AdminLayout><div className="detail-loading"><Spinner size="lg" /><p>Loading revenue analytics...</p></div></AdminLayout>;
  if (error) return (
    <AdminLayout>
      <div className="detail-error">
        <p>Error: {error}</p>
        <ActionButton label="Back to Dashboard" icon={ArrowLeft} variant="secondary" onClick={() => navigate(`${basePath}/admindashboard`)} />
      </div>
    </AdminLayout>
  );
  if (!data || !data.metrics) return (
    <AdminLayout>
      <div className="detail-empty"><p>No revenue data available</p></div>
    </AdminLayout>
  );

  const metrics = data.metrics;

  return (
    <AdminLayout>
      <div className="admin-detail-page">
        <PageHeader
          title="Platform Revenue Analytics"
          subtitle="Comprehensive overview of all construction projects, companies, and payment tracking"
          actions={
            <ActionButton label="Back to Dashboard" icon={ArrowLeft} variant="secondary" onClick={() => navigate(`${basePath}/admindashboard`)} />
          }
        />

        {/* Stats Cards */}
        <div className="revenue-stats-grid">
          <div className="revenue-stat-card stat-total">
            <div className="revenue-stat-icon"><IndianRupee size={22} /></div>
            <div className="revenue-stat-content">
              <span className="revenue-stat-label">Total Platform Revenue</span>
                <span className="revenue-stat-value">{formatCurrency(metrics.totalPlatformRevenue)}</span>
              <Badge variant="info">{metrics.totalProjects || 0} Projects</Badge>
            </div>
          </div>
          <div className="revenue-stat-card stat-received">
            <div className="revenue-stat-icon received"><CheckCircle size={22} /></div>
            <div className="revenue-stat-content">
              <span className="revenue-stat-label">Total Received</span>
              <span className="revenue-stat-value">{formatCurrency(metrics.receivedRevenue)}</span>
              <div className="revenue-mini-bar">
                <div className="revenue-mini-fill success" style={{ width: `${metrics.collectionRate || 0}%` }}></div>
              </div>
              <span className="revenue-stat-meta">{formatPercentage(metrics.collectionRate)} collected</span>
            </div>
          </div>
          <div className="revenue-stat-card stat-pending">
            <div className="revenue-stat-icon pending"><Clock size={22} /></div>
            <div className="revenue-stat-content">
              <span className="revenue-stat-label">Pending Payments</span>
              <span className="revenue-stat-value">{formatCurrency(metrics.pendingRevenue)}</span>
              <Badge variant="warning">Uncollected</Badge>
            </div>
          </div>
          <div className="revenue-stat-card stat-projects">
            <div className="revenue-stat-icon projects"><Building2 size={22} /></div>
            <div className="revenue-stat-content">
              <span className="revenue-stat-label">Active Projects</span>
              <span className="revenue-stat-value">{metrics.activeProjects || 0}</span>
              <Badge variant="success">{metrics.completedProjects || 0} Completed</Badge>
            </div>
          </div>
        </div>

        {/* Revenue by Project Type */}
        {data.revenueByType && (
          <Card className="phase-analytics-card">
            <h3 className="phase-analytics-title">Revenue by Project Type</h3>
            <div className="phase-grid">
              <div className="phase-card">
                <div className="phase-header">
                  <h4>Construction Projects</h4>
                  <Badge variant="info">{data.revenueByType.construction.totalProjects || 0} projects</Badge>
                </div>
                <div className="phase-amounts">
                  <div className="phase-amount"><span className="phase-label">Platform Revenue</span><span className="phase-value">{formatCurrency(data.revenueByType.construction.platformRevenue)}</span></div>
                  <div className="phase-amount"><span className="phase-label">Received</span><span className="phase-value received-text">{formatCurrency(data.revenueByType.construction.receivedRevenue)}</span></div>
                  <div className="phase-amount"><span className="phase-label">Pending</span><span className="phase-value pending-text">{formatCurrency(data.revenueByType.construction.pendingRevenue)}</span></div>
                </div>
                <div className="phase-amounts" style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
                  <div className="phase-amount"><span className="phase-label">Active</span><span className="phase-value">{data.revenueByType.construction.activeProjects}</span></div>
                  <div className="phase-amount"><span className="phase-label">Completed</span><span className="phase-value">{data.revenueByType.construction.completedProjects}</span></div>
                </div>
              </div>
              <div className="phase-card">
                <div className="phase-header">
                  <h4>Architect Hirings</h4>
                  <Badge variant="info">{data.revenueByType.architect.totalProjects || 0} projects</Badge>
                </div>
                <div className="phase-amounts">
                  <div className="phase-amount"><span className="phase-label">Platform Revenue</span><span className="phase-value">{formatCurrency(data.revenueByType.architect.platformRevenue)}</span></div>
                  <div className="phase-amount"><span className="phase-label">Received</span><span className="phase-value received-text">{formatCurrency(data.revenueByType.architect.receivedRevenue)}</span></div>
                  <div className="phase-amount"><span className="phase-label">Pending</span><span className="phase-value pending-text">{formatCurrency(data.revenueByType.architect.pendingRevenue)}</span></div>
                </div>
                <div className="phase-amounts" style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
                  <div className="phase-amount"><span className="phase-label">Active</span><span className="phase-value">{data.revenueByType.architect.activeProjects}</span></div>
                  <div className="phase-amount"><span className="phase-label">Completed</span><span className="phase-value">{data.revenueByType.architect.completedProjects}</span></div>
                </div>
              </div>
              <div className="phase-card">
                <div className="phase-header">
                  <h4>Interior Design</h4>
                  <Badge variant="info">{data.revenueByType.interior.totalProjects || 0} projects</Badge>
                </div>
                <div className="phase-amounts">
                  <div className="phase-amount"><span className="phase-label">Platform Revenue</span><span className="phase-value">{formatCurrency(data.revenueByType.interior.platformRevenue)}</span></div>
                  <div className="phase-amount"><span className="phase-label">Received</span><span className="phase-value received-text">{formatCurrency(data.revenueByType.interior.receivedRevenue)}</span></div>
                  <div className="phase-amount"><span className="phase-label">Pending</span><span className="phase-value pending-text">{formatCurrency(data.revenueByType.interior.pendingRevenue)}</span></div>
                </div>
                <div className="phase-amounts" style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
                  <div className="phase-amount"><span className="phase-label">Active</span><span className="phase-value">{data.revenueByType.interior.activeProjects}</span></div>
                  <div className="phase-amount"><span className="phase-label">Completed</span><span className="phase-value">{data.revenueByType.interior.completedProjects}</span></div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Projects Table */}
        <Card>
          <h3 className="projects-table-title">All Projects (Construction, Architect, Interior Design)</h3>
          {data.projects && data.projects.length > 0 ? (
            <div className="revenue-table-wrapper">
              <table className="revenue-table">
                <thead>
                  <tr>
                    <th>Project Name</th>
                    <th>Type</th>
                    <th>Company/Worker</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Total Amount</th>
                    <th>Commission</th>
                    <th>Received</th>
                    <th>Pending</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.projects.map((project) => {
                    const statusVariant = (() => {
                      const s = (project.status || "").toLowerCase();
                      if (s === "completed") return "success";
                      if (s === "accepted" || s === "ongoing" || s === "in-progress") return "info";
                      return "warning";
                    })();
                    
                    const projectTypeLabel = project.projectType === 'construction' ? 'Construction' :
                                            project.projectType === 'architect' ? 'Architect' : 'Interior';
                    const projectTypeBadgeColor = project.projectType === 'construction' ? 'info' :
                                                  project.projectType === 'architect' ? 'success' : 'default';
                    
                    return (
                      <tr key={project._id}>
                        <td><strong>{project.projectName}</strong></td>
                        <td><Badge variant={projectTypeBadgeColor}>{projectTypeLabel}</Badge></td>
                        <td>
                          {project.projectType === 'construction' ? (
                            <div>
                              <div>{project.company?.name || 'N/A'}</div>
                              {project.company?.contactPerson && <small className="table-meta">{project.company.contactPerson}</small>}
                            </div>
                          ) : (
                            <div>
                              <div>{project.worker?.name || 'Not Assigned'}</div>
                              {project.worker?.email && <small className="table-meta">{project.worker.email}</small>}
                            </div>
                          )}
                        </td>
                        <td>
                          <div>{project.customer.name}</div>
                          {project.customer.phone && <small className="table-meta">{project.customer.phone}</small>}
                        </td>
                        <td><Badge variant={statusVariant}>{project.status || "Unknown"}</Badge></td>
                        <td className="amount-cell">{formatCurrency(project.totalAmount)}</td>
                        <td className="amount-cell" style={{ color: '#16a34a', fontWeight: '600' }}>
                          {formatCurrency(project.platformCommission || (project.totalAmount * 0.1))}
                        </td>
                        <td className="amount-cell received-text">{formatCurrency(project.receivedAmount)}</td>
                        <td className="amount-cell pending-text">{formatCurrency(project.pendingAmount)}</td>
                        <td>
                          <ActionButton label="View" icon={Eye} variant="primary" size="sm" onClick={() => handleViewDetails(project)} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="detail-empty" style={{ minHeight: "200px" }}><p>No projects found</p></div>
          )}
        </Card>
      </div>

      {/* Project Details Modal */}
      {showModal && selectedProject && (
        <div className="revenue-modal-overlay" onClick={handleCloseModal}>
          <div className="revenue-modal" onClick={(e) => e.stopPropagation()}>
            <div className="revenue-modal-header">
              <h2>{selectedProject.projectName}</h2>
              <button className="revenue-modal-close" onClick={handleCloseModal}><X size={20} /></button>
            </div>

            <div className="revenue-modal-body">
              {/* Summary cards */}
              <div className="modal-summary-grid">
                <div className="modal-summary-card">
                  <span className="modal-summary-label">Total Amount</span>
                  <span className="modal-summary-value">{formatCurrency(selectedProject.totalAmount)}</span>
                </div>
                <div className="modal-summary-card">
                  <span className="modal-summary-label">Received</span>
                  <span className="modal-summary-value received-text">{formatCurrency(selectedProject.receivedAmount)}</span>
                </div>
                <div className="modal-summary-card">
                  <span className="modal-summary-label">Pending</span>
                  <span className="modal-summary-value pending-text">{formatCurrency(selectedProject.pendingAmount)}</span>
                </div>
              </div>

              {/* Project Info */}
              <div className="modal-info-section">
                <h3>Project Information</h3>
                <div className="modal-info-grid">
                  <div className="modal-info-item"><span className="modal-info-label">Project Type</span><span className="modal-info-value">{selectedProject.projectType === 'construction' ? 'Construction' : selectedProject.projectType === 'architect' ? 'Architect Hiring' : 'Interior Design'}</span></div>
                  <div className="modal-info-item"><span className="modal-info-label">Status</span><span className="modal-info-value">{selectedProject.status}</span></div>
                  {selectedProject.completionPercentage !== undefined && (
                    <div className="modal-info-item"><span className="modal-info-label">Progress</span><span className="modal-info-value">{selectedProject.completionPercentage}%</span></div>
                  )}
                  {selectedProject.projectType === 'construction' ? (
                    <>
                      <div className="modal-info-item"><span className="modal-info-label">Company</span><span className="modal-info-value">{selectedProject.company?.name || 'N/A'}</span></div>
                      <div className="modal-info-item"><span className="modal-info-label">Contact Person</span><span className="modal-info-value">{selectedProject.company?.contactPerson || "N/A"}</span></div>
                    </>
                  ) : (
                    <>
                      <div className="modal-info-item"><span className="modal-info-label">Worker</span><span className="modal-info-value">{selectedProject.worker?.name || 'Not Assigned'}</span></div>
                      <div className="modal-info-item"><span className="modal-info-label">Worker Email</span><span className="modal-info-value">{selectedProject.worker?.email || "N/A"}</span></div>
                      {selectedProject.worker?.specialization && (
                        <div className="modal-info-item"><span className="modal-info-label">Specialization</span><span className="modal-info-value">{selectedProject.worker.specialization}</span></div>
                      )}
                      {selectedProject.escrowStatus && (
                        <div className="modal-info-item"><span className="modal-info-label">Escrow Status</span><span className="modal-info-value">{selectedProject.escrowStatus.replace('_', ' ').toUpperCase()}</span></div>
                      )}
                    </>
                  )}
                  <div className="modal-info-item"><span className="modal-info-label">Customer</span><span className="modal-info-value">{selectedProject.customer.name}</span></div>
                  <div className="modal-info-item"><span className="modal-info-label">Customer Phone</span><span className="modal-info-value">{selectedProject.customer.phone || "N/A"}</span></div>
                </div>
              </div>

              {/* Revenue Breakdown (Architect/Interior Only) */}
              {(selectedProject.projectType === 'architect' || selectedProject.projectType === 'interior') && (
                <div className="modal-phases-section">
                  <h3>Payment Summary</h3>
                  <div className="modal-info-grid" style={{ marginTop: '15px' }}>
                    <div className="modal-info-item">
                      <span className="modal-info-label">Total Project Amount</span>
                      <span className="modal-info-value" style={{ fontSize: '1.1em', fontWeight: '600' }}>{formatCurrency(selectedProject.totalAmount)}</span>
                    </div>
                    <div className="modal-info-item">
                      <span className="modal-info-label">Platform Commission</span>
                      <span className="modal-info-value" style={{ color: '#16a34a', fontWeight: '600' }}>{formatCurrency(selectedProject.platformCommission)}</span>
                    </div>
                    <div className="modal-info-item">
                      <span className="modal-info-label">Worker Payout</span>
                      <span className="modal-info-value">{formatCurrency(selectedProject.workerAmount)}</span>
                    </div>
                    <div className="modal-info-item">
                      <span className="modal-info-label">Commission Received</span>
                      <span className="modal-info-value received-text">{formatCurrency(selectedProject.receivedAmount)}</span>
                    </div>
                    <div className="modal-info-item">
                      <span className="modal-info-label">Commission Pending</span>
                      <span className="modal-info-value pending-text">{formatCurrency(selectedProject.pendingAmount)}</span>
                    </div>
                    {selectedProject.roomType && (
                      <div className="modal-info-item">
                        <span className="modal-info-label">Room Type</span>
                        <span className="modal-info-value">{selectedProject.roomType}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="revenue-modal-footer">
              <ActionButton label="Close" variant="secondary" onClick={handleCloseModal} />
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminRevenueAnalytics;
