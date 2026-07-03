import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { ArrowLeft, Database, Download, Eye, FileText, Filter, IndianRupee, RefreshCw, Search, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../../components/admin/AdminLayout";
import { useAdminAuth } from "../../../context/AdminAuthContext";
import "./AdminPlatformRevenueIntelligence.css";

const STATUS_COLORS = ["#15803d", "#b45309", "#1d4ed8"];
const currency = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const AdminPlatformRevenueIntelligence = () => {
  const navigate = useNavigate();
  const { basePath } = useAdminAuth();

  const [filters, setFilters] = useState({
    timeframe: "all",
    startDate: "",
    endDate: "",
    projectType: "all",
    feeStatus: "all",
    search: "",
    page: 1,
    limit: 20,
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [cacheStats, setCacheStats] = useState(null);
  const [cacheLoading, setCacheLoading] = useState(false);
  const [cacheError, setCacheError] = useState("");
  const [cacheActionBusy, setCacheActionBusy] = useState(false);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).length > 0) {
        params.append(key, String(value));
      }
    });
    return params.toString();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`/api/admin/revenue/platform-intelligence?${queryString}`, {
        credentials: "include",
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to load platform intelligence");
      }
      setData(result);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [queryString]);

  const fetchCacheStats = async () => {
    try {
      setCacheLoading(true);
      setCacheError("");
      const response = await fetch("/api/admin/cache/redis-stats", {
        credentials: "include",
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to load Redis cache stats");
      }
      setCacheStats(result.stats || null);
    } catch (err) {
      setCacheError(err.message || String(err));
    } finally {
      setCacheLoading(false);
    }
  };

  useEffect(() => {
    fetchCacheStats();
  }, []);

  const metrics = data?.metrics || {};
  const charts = data?.charts || {};
  const projects = data?.projects || [];
  const transactions = data?.transactions?.items || [];

  const handleExportCsv = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && String(value).length > 0) {
          params.append(key, String(value));
        }
      });
      params.set("page", "1");
      params.set("limit", "5000");

      const response = await fetch(`/api/admin/revenue/platform-intelligence?${params.toString()}`, {
        credentials: "include",
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to export CSV");
      }

      const rows = result.transactions?.items || [];
      const headers = [
        "Date",
        "ProjectType",
        "TransactionType",
        "FromPartyType",
        "ToPartyType",
        "Amount",
        "PlatformFee",
        "FeeStatus",
        "Status",
        "Description",
        "InvoiceUrl",
        "RazorpayOrderId",
        "RazorpayPaymentId",
      ];

      const csv = [headers.join(",")]
        .concat(
          rows.map((tx) => [
            new Date(tx.createdAt).toISOString(),
            tx.projectType || "",
            tx.transactionType || "",
            tx.fromPartyType || "",
            tx.toPartyType || "",
            tx.amount ?? 0,
            tx.platformFee ?? 0,
            tx.feeStatus || "",
            tx.status || "",
            `"${String(tx.description || "").replace(/"/g, '""')}"`,
            tx.invoiceUrl || "",
            tx.razorpayOrderId || "",
            tx.razorpayPaymentId || "",
          ].join(",")),
        )
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `platform-revenue-intelligence-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || String(err));
    }
  };

  const handleResetCacheStats = async () => {
    try {
      setCacheActionBusy(true);
      setCacheError("");
      const response = await fetch("/api/admin/cache/redis-stats/reset", {
        method: "POST",
        credentials: "include",
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to reset Redis cache stats");
      }
      setCacheStats(result.after || null);
    } catch (err) {
      setCacheError(err.message || String(err));
    } finally {
      setCacheActionBusy(false);
    }
  };

  const hitRate = useMemo(() => {
    const hits = Number(cacheStats?.hits || 0);
    const misses = Number(cacheStats?.misses || 0);
    const denominator = hits + misses;
    if (denominator === 0) return "0.00";
    return ((hits / denominator) * 100).toFixed(2);
  }, [cacheStats]);

  return (
    <AdminLayout>
      <div className="pri-page">
        <div className="pri-header">
          <div>
            <h1>Platform Revenue Intelligence</h1>
            <p>Deep analytics for 5% platform commission flow, payer/payee paths, pending dues, and invoice-backed transactions.</p>
          </div>
          <div className="pri-header-actions">
            <button className="pri-back-btn" onClick={handleExportCsv}>
              <Download size={16} /> Export CSV
            </button>
            <button className="pri-back-btn" onClick={() => navigate(`${basePath}/admindashboard`)}>
              <ArrowLeft size={16} /> Back
            </button>
          </div>
        </div>

        <div className="pri-filters">
          <div className="pri-filter-title"><Filter size={16} /> Filters</div>
          <select
            value={filters.timeframe}
            onChange={(e) => setFilters((prev) => ({ ...prev, timeframe: e.target.value, page: 1 }))}
          >
            <option value="all">All Time</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value, page: 1 }))}
            title="Start Date"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value, page: 1 }))}
            title="End Date"
          />
          <select
            value={filters.projectType}
            onChange={(e) => setFilters((prev) => ({ ...prev, projectType: e.target.value, page: 1 }))}
          >
            <option value="all">All Project Types</option>
            <option value="construction">Construction</option>
            <option value="architect">Architect</option>
            <option value="interior">Interior</option>
          </select>
          <select
            value={filters.feeStatus}
            onChange={(e) => setFilters((prev) => ({ ...prev, feeStatus: e.target.value, page: 1 }))}
          >
            <option value="all">All Fee States</option>
            <option value="collected">Collected</option>
            <option value="pending">Pending</option>
            <option value="yet_to_come">Yet To Come</option>
          </select>
          <div className="pri-search-wrap">
            <Search size={14} />
            <input
              placeholder="Search project/company/worker/customer"
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))}
            />
          </div>
        </div>

        <div className="pri-cache-card">
          <div className="pri-cache-head">
            <h3><Database size={16} /> Redis Cache Health</h3>
            <div className="pri-cache-actions">
              <button className="pri-back-btn" onClick={fetchCacheStats} disabled={cacheLoading || cacheActionBusy}>
                <RefreshCw size={14} /> {cacheLoading ? "Refreshing..." : "Refresh"}
              </button>
              <button className="pri-back-btn pri-reset-btn" onClick={handleResetCacheStats} disabled={cacheLoading || cacheActionBusy}>
                <Trash2 size={14} /> {cacheActionBusy ? "Resetting..." : "Reset Counters"}
              </button>
            </div>
          </div>

          {cacheError && <div className="pri-cache-error">{cacheError}</div>}

          <div className="pri-cache-grid">
            <div className="pri-cache-metric">
              <span>Hit Rate</span>
              <strong>{hitRate}%</strong>
            </div>
            <div className="pri-cache-metric">
              <span>Hits</span>
              <strong>{Number(cacheStats?.hits || 0)}</strong>
            </div>
            <div className="pri-cache-metric">
              <span>Misses</span>
              <strong>{Number(cacheStats?.misses || 0)}</strong>
            </div>
            <div className="pri-cache-metric">
              <span>Sets</span>
              <strong>{Number(cacheStats?.sets || 0)}</strong>
            </div>
            <div className="pri-cache-metric">
              <span>Invalidations</span>
              <strong>{Number(cacheStats?.invalidateCalls || 0)}</strong>
            </div>
            <div className="pri-cache-metric">
              <span>Keys Removed</span>
              <strong>{Number(cacheStats?.invalidatedKeys || 0)}</strong>
            </div>
            <div className="pri-cache-metric">
              <span>No-Redis Skips</span>
              <strong>{Number(cacheStats?.skippedNoRedis || 0)}</strong>
            </div>
            <div className="pri-cache-metric">
              <span>Errors</span>
              <strong>{Number(cacheStats?.errors || 0)}</strong>
            </div>
            <div className="pri-cache-metric pri-cache-total">
              <span>Total Ops</span>
              <strong>{Number(cacheStats?.totalOps || 0)}</strong>
            </div>
          </div>
        </div>

        {loading && <div className="pri-loading">Loading platform intelligence...</div>}
        {error && <div className="pri-error">{error}</div>}

        {!loading && !error && (
          <>
            <div className="pri-kpis">
              <div className="pri-kpi-card">
                <div className="pri-kpi-icon"><IndianRupee size={18} /></div>
                <div>
                  <span>Total Expected</span>
                  <strong>{currency(metrics.totalExpected)}</strong>
                </div>
              </div>
              <div className="pri-kpi-card">
                <div className="pri-kpi-icon success"><IndianRupee size={18} /></div>
                <div>
                  <span>Total Collected</span>
                  <strong>{currency(metrics.totalCollected)}</strong>
                </div>
              </div>
              <div className="pri-kpi-card">
                <div className="pri-kpi-icon warn"><IndianRupee size={18} /></div>
                <div>
                  <span>Pending</span>
                  <strong>{currency(metrics.totalPending)}</strong>
                </div>
              </div>
              <div className="pri-kpi-card">
                <div className="pri-kpi-icon info"><IndianRupee size={18} /></div>
                <div>
                  <span>Yet To Come</span>
                  <strong>{currency(metrics.totalYetToCome)}</strong>
                </div>
              </div>
            </div>

            <div className="pri-chart-grid">
              <div className="pri-chart-card">
                <h3>Monthly Fee Flow</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={charts.monthlyFeeFlow || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(v) => currency(v)} />
                    <Area type="monotone" dataKey="collected" stackId="1" stroke="#15803d" fill="#86efac" />
                    <Area type="monotone" dataKey="pending" stackId="1" stroke="#b45309" fill="#fde68a" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="pri-chart-card">
                <h3>Fee Status Distribution</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={charts.feeStatusDistribution || []}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label
                    >
                      {(charts.feeStatusDistribution || []).map((_, index) => (
                        <Cell key={`status-cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => currency(v)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="pri-chart-card">
              <h3>Project Type Fee Breakdown</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={charts.feeByProjectType || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip formatter={(v) => currency(v)} />
                  <Legend />
                  <Bar dataKey="collected" fill="#15803d" />
                  <Bar dataKey="pending" fill="#b45309" />
                  <Bar dataKey="yetToCome" fill="#1d4ed8" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="pri-table-card">
              <h3>Projects Fee Intelligence (Collected / Pending / Yet To Come)</h3>
              <div className="pri-table-wrap">
                <table className="pri-table">
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Type</th>
                      <th>From Party</th>
                      <th>Customer</th>
                      <th>Total Fee</th>
                      <th>Collected</th>
                      <th>Pending</th>
                      <th>Yet To Come</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.length === 0 && (
                      <tr>
                        <td colSpan="9" className="pri-empty-cell">No matching projects found.</td>
                      </tr>
                    )}
                    {projects.map((project) => (
                      <tr key={`${project.projectType}-${project.projectId}`}>
                        <td>{project.projectName}</td>
                        <td>{project.projectType}</td>
                        <td>{project.fromParty}</td>
                        <td>{project.customerName}</td>
                        <td>{currency(project.totalFee)}</td>
                        <td>{currency(project.collected)}</td>
                        <td>{currency(project.pending)}</td>
                        <td>{currency(project.yetToCome)}</td>
                        <td>
                          <button
                            className="pri-back-btn"
                            onClick={() => setSelectedProject(project)}
                          >
                            <Eye size={14} /> Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pri-table-card">
              <h3>Transaction Ledger (From {'->'} To, Amounts, Fee State, Invoice)</h3>
              <div className="pri-table-wrap">
                <table className="pri-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Project Type</th>
                      <th>From {'->'} To</th>
                      <th>Amount</th>
                      <th>Platform Fee</th>
                      <th>Fee State</th>
                      <th>Invoice</th>
                      <th>Gateway Ref</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 && (
                      <tr>
                        <td colSpan="9" className="pri-empty-cell">No matching transactions found.</td>
                      </tr>
                    )}
                    {transactions.map((tx) => (
                      <tr key={tx._id}>
                        <td>{new Date(tx.createdAt).toLocaleString("en-IN")}</td>
                        <td>{tx.transactionType}</td>
                        <td>{tx.projectType}</td>
                        <td>{tx.fromPartyType} {'->'} {tx.toPartyType}</td>
                        <td>{currency(tx.amount)}</td>
                        <td>{currency(tx.platformFee)}</td>
                        <td>{tx.feeStatus}</td>
                        <td>
                          {tx.invoiceUrl ? (
                            <a href={tx.invoiceUrl} target="_blank" rel="noreferrer">
                              <FileText size={14} /> View
                            </a>
                          ) : "-"}
                        </td>
                        <td className="pri-ref-cell">
                          <div>{tx.razorpayOrderId || "-"}</div>
                          <div>{tx.razorpayPaymentId || "-"}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="pri-pagination">
                <button
                  disabled={(data?.transactions?.page || 1) <= 1}
                  onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
                >
                  Previous
                </button>
                <span>
                  Page {data?.transactions?.page || 1} of {Math.max(1, Math.ceil((data?.transactions?.total || 0) / (data?.transactions?.limit || 20)))}
                </span>
                <button
                  disabled={(data?.transactions?.page || 1) >= Math.ceil((data?.transactions?.total || 0) / (data?.transactions?.limit || 20 || 1))}
                  onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}

        {selectedProject && (
          <div className="pri-modal-overlay" onClick={() => setSelectedProject(null)}>
            <div className="pri-modal" onClick={(e) => e.stopPropagation()}>
              <div className="pri-modal-head">
                <h3>{selectedProject.projectName}</h3>
                <button className="pri-modal-close" onClick={() => setSelectedProject(null)}>
                  <X size={16} />
                </button>
              </div>
              <div className="pri-modal-meta">
                <span>{selectedProject.projectType}</span>
                <span>{selectedProject.fromParty} {'->'} Platform</span>
                <span>Customer: {selectedProject.customerName}</span>
              </div>
              <div className="pri-table-wrap">
                <table className="pri-table">
                  <thead>
                    <tr>
                      <th>Stage</th>
                      <th>Milestone %</th>
                      <th>Platform Fee</th>
                      <th>Status</th>
                      <th>Collected At</th>
                      <th>Invoice</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedProject.feeTimeline || []).map((item, index) => (
                      <tr key={`${selectedProject.projectId}-timeline-${index}`}>
                        <td>{item.label}</td>
                        <td>{item.milestonePercentage || "-"}</td>
                        <td>{currency(item.platformFee)}</td>
                        <td>{item.feeStatus}</td>
                        <td>{item.collectedAt ? new Date(item.collectedAt).toLocaleString("en-IN") : "-"}</td>
                        <td>
                          {item.invoiceUrl ? (
                            <a href={item.invoiceUrl} target="_blank" rel="noreferrer">
                              <FileText size={14} /> View
                            </a>
                          ) : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminPlatformRevenueIntelligence;
