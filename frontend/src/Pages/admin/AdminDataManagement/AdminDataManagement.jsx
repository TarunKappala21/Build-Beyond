import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Trash2, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import AdminLayout from "../../../components/admin/AdminLayout";
import {
  PageHeader,
  Section,
  AdminTable,
  Spinner,
  ActionButton,
  Badge,
} from "../../../components/admin/AdminUIComponents";
import { useAdminAuth } from "../../../context/AdminAuthContext";
import "./AdminDataManagement.css";

const AdminDataManagement = () => {
  const navigate = useNavigate();
  const { role, isReadOnly, basePath } = useAdminAuth();
  // Allow superadmin, standard admin (if not read-only), to manage/delete items
  const canManage =
    (role === "superadmin" ||
      role === "admin" ||
      role === "platform_manager") &&
    !isReadOnly;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    counts: { customers: 0, companies: 0, workers: 0 },
    data: {
      customers: [],
      companies: [],
      workers: [],
      architectHirings: [],
      constructionProjects: [],
      designRequests: [],
      bids: [],
      jobApplications: [],
    },
  });

  const [activeTab, setActiveTab] = useState("customers");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [unviewedComplaints, setUnviewedComplaints] = useState({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const [res, complaintsRes] = await Promise.all([
        fetch(`/api/admindashboard`, {
          credentials: "include",
        }),
        fetch(`/api/complaints/unviewed/count`, {
          credentials: "include",
        }),
      ]);
      if (!res.ok) throw new Error(`Server ${res.status}`);
      const json = await res.json();
      setData(json);
      setError(null);

      try {
        const complaintsData = await complaintsRes.json();
        if (complaintsData.success) {
          const complaintsMap = {};
          complaintsData.unviewedByProject.forEach((item) => {
            complaintsMap[item._id] = item.count;
          });
          setUnviewedComplaints(complaintsMap);
        }
      } catch (err) {
        console.error("Error fetching unviewed complaints:", err);
      }
    } catch (err) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (type, id) => {
    if (!canManage) {
      alert("Read-only admin cannot perform this action.");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete this ${type}?`))
      return;
    try {
      const res = await fetch(`/api/admin/delete-${type}/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Delete failed");
      await fetchData();
      alert(json.message || "Deleted");
    } catch (err) {
      alert("Error deleting: " + err.message);
    }
  };

  const tabData = useMemo(() => {
    const d = data.data;
    switch (activeTab) {
      case "customers":
        return d.customers || [];
      case "companies":
        return d.companies || [];
      case "workers":
        return d.workers || [];
      case "architect-hirings":
        return d.architectHirings || [];
      case "construction-projects":
        return d.constructionProjects || [];
      case "design-requests":
        return d.designRequests || [];
      case "bids":
        return d.bids || [];
      case "job-applications":
        return d.jobApplications || [];
      default:
        return [];
    }
  }, [activeTab, data]);

  const filteredData = useMemo(() => {
    if (!Array.isArray(tabData)) return [];
    const q = search.trim().toLowerCase();
    return tabData.filter((item) => {
      if (statusFilter !== "all") {
        const s = (item.status || item.availability || "").toString();
        if (s.toLowerCase() !== statusFilter.toLowerCase()) return false;
      }
      if (!q) return true;
      return JSON.stringify(item).toLowerCase().includes(q);
    });
  }, [tabData, search, statusFilter]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading-container">
          <Spinner size="lg" />
          <p>Loading data management...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="error-container">
          <h2>Error Loading Data</h2>
          <p>{error}</p>
          <ActionButton label="Retry" variant="primary" onClick={fetchData} />
        </div>
      </AdminLayout>
    );
  }

  const renderTableByTab = () => {
    switch (activeTab) {
      case "customers":
        return (
          <AdminTable
            columns={[
              { key: "name", label: "Name" },
              { key: "email", label: "Email" },
              { key: "phone", label: "Phone" },
              {
                key: "dob",
                label: "DOB",
                render: (row) =>
                  row.dob ? new Date(row.dob).toLocaleDateString() : "—",
              },
              {
                key: "createdAt",
                label: "Joined",
                render: (row) =>
                  row.createdAt
                    ? new Date(row.createdAt).toLocaleDateString()
                    : "—",
              },
            ]}
            data={filteredData}
            actions={[
              {
                variant: "view",
                label: "View",
                icon: Eye,
                onClick: (row) => navigate(`${basePath}/customer/${row._id}`),
              },
              ...(canManage
                ? [
                    {
                      variant: "delete",
                      label: "Delete",
                      icon: Trash2,
                      onClick: (row) => handleDelete("customer", row._id),
                    },
                  ]
                : []),
            ]}
          />
        );

      case "companies":
        const companyActions = [
          {
            variant: "view",
            label: "View",
            icon: Eye,
            onClick: (row) => navigate(`${basePath}/company/${row._id}`),
          },
        ];
        if (canManage) {
          companyActions.push({
            variant: "delete",
            label: "Delete",
            icon: Trash2,
            onClick: (row) => handleDelete("company", row._id),
          });
        }
        return (
          <AdminTable
            columns={[
              { key: "companyName", label: "Company" },
              { key: "contactPerson", label: "Contact" },
              { key: "email", label: "Email" },
              { key: "phone", label: "Phone" },
              {
                key: "location",
                label: "Location",
                render: (row) => row.location?.city || "N/A",
              },
              { key: "size", label: "Size" },
              {
                key: "projectsCompleted",
                label: "Projects",
                render: (row) => row.projectsCompleted || 0,
              },
              {
                key: "status",
                label: "Status",
                render: (row) => (
                  <Badge variant={row.status}>{row.status}</Badge>
                ),
              },
            ]}
            data={filteredData}
            actions={companyActions}
          />
        );

      case "workers":
        const workerActions = [
          {
            variant: "view",
            label: "View",
            icon: Eye,
            onClick: (row) => navigate(`${basePath}/worker/${row._id}`),
          },
        ];
        if (canManage) {
          workerActions.push({
            variant: "delete",
            label: "Delete",
            icon: Trash2,
            onClick: (row) => handleDelete("worker", row._id),
          });
        }
        return (
          <AdminTable
            columns={[
              { key: "name", label: "Name" },
              { key: "email", label: "Email" },
              { key: "specialization", label: "Specialization" },
              {
                key: "experience",
                label: "Exp",
                render: (row) => `${row.experience || 0} yrs`,
              },
              {
                key: "rating",
                label: "Rating",
                render: (row) => `⭐ ${Number(row.rating || 0).toFixed(1)}`,
              },
              {
                key: "availability",
                label: "Availability",
                render: (row) => (
                  <Badge variant={row.availability}>{row.availability}</Badge>
                ),
              },
              {
                key: "isArchitect",
                label: "Architect",
                render: (row) => (row.isArchitect ? "Yes" : "No"),
              },
            ]}
            data={filteredData}
            actions={workerActions}
          />
        );

      case "architect-hirings":
        return (
          <AdminTable
            columns={[
              { key: "projectName", label: "Project" },
              {
                key: "customer",
                label: "Customer",
                render: (row) =>
                  row.customer?.name || row.customerDetails?.fullName || "—",
              },
              {
                key: "designType",
                label: "Type",
                render: (row) => row.designRequirements?.designType || "—",
              },
              {
                key: "plotSize",
                label: "Size",
                render: (row) => row.plotInformation?.plotSize || "—",
              },
              {
                key: "budget",
                label: "Budget",
                render: (row) => row.additionalDetails?.budget ?? "N/A",
              },
              {
                key: "status",
                label: "Status",
                render: (row) => (
                  <Badge variant={row.status}>{row.status}</Badge>
                ),
              },
              {
                key: "createdAt",
                label: "Created",
                render: (row) =>
                  row.createdAt
                    ? new Date(row.createdAt).toLocaleDateString()
                    : "—",
              },
            ]}
            data={filteredData}
            actions={[
              {
                variant: "view",
                label: "View",
                icon: Eye,
                onClick: (row) =>
                  navigate(`${basePath}/architect-hiring/${row._id}`),
              },
              ...(canManage
                ? [
                    {
                      variant: "delete",
                      label: "Delete",
                      icon: Trash2,
                      onClick: (row) =>
                        handleDelete("architectHiring", row._id),
                    },
                  ]
                : []),
            ]}
          />
        );

      case "construction-projects":
        return (
          <AdminTable
            columns={[
              { key: "projectName", label: "Project Name" },
              { key: "customerName", label: "Customer" },
              { key: "estimatedBudget", label: "Budget" },
              {
                key: "projectTimeline",
                label: "Timeline",
                render: (row) =>
                  row.projectTimeline ? `${row.projectTimeline} days` : "—",
              },
              {
                key: "buildingType",
                label: "Type",
                render: (row) => row.buildingType || "N/A",
              },
              {
                key: "completionPercentage",
                label: "Progress",
                render: (row) => {
                  const progress = Math.min(
                    100,
                    Math.max(0, Number(row.completionPercentage || 0)),
                  );
                  return (
                    <div style={{ minWidth: 120 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 11,
                          color: "#64748b",
                          marginBottom: 4,
                        }}
                      >
                        <span>Progress</span>
                        <strong style={{ color: "#0f172a" }}>
                          {progress}%
                        </strong>
                      </div>
                      <div
                        style={{
                          width: "100%",
                          height: 7,
                          borderRadius: 999,
                          background: "#e2e8f0",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${progress}%`,
                            height: "100%",
                            background:
                              "linear-gradient(90deg, #3b82f6, #22c55e)",
                          }}
                        />
                      </div>
                    </div>
                  );
                },
              },
              {
                key: "status",
                label: "Status",
                render: (row) => (
                  <Badge variant={row.status}>{row.status}</Badge>
                ),
              },
              {
                key: "complaints",
                label: "Complaints",
                render: (row) => unviewedComplaints[row._id] || 0,
              },
            ]}
            data={filteredData}
            actions={[
              {
                variant: "view",
                label: "View",
                icon: Eye,
                onClick: (row) =>
                  navigate(`${basePath}/construction-project/${row._id}`),
              },
              ...(canManage
                ? [
                    {
                      variant: "delete",
                      label: "Delete",
                      icon: Trash2,
                      onClick: (row) =>
                        handleDelete("constructionProject", row._id),
                    },
                  ]
                : []),
            ]}
          />
        );

      case "design-requests":
        return (
          <AdminTable
            columns={[
              { key: "projectName", label: "Project" },
              { key: "fullName", label: "Customer" },
              { key: "email", label: "Email" },
              { key: "roomType", label: "Room Type" },
              { key: "finalAmount", label: "Budget" },
              {
                key: "status",
                label: "Status",
                render: (row) => (
                  <Badge variant={row.status}>{row.status}</Badge>
                ),
              },
              {
                key: "createdAt",
                label: "Created",
                render: (row) =>
                  row.createdAt
                    ? new Date(row.createdAt).toLocaleDateString()
                    : "—",
              },
            ]}
            data={filteredData}
            actions={[
              {
                variant: "view",
                label: "View",
                icon: Eye,
                onClick: (row) =>
                  navigate(`${basePath}/design-request/${row._id}`),
              },
              ...(canManage
                ? [
                    {
                      variant: "delete",
                      label: "Delete",
                      icon: Trash2,
                      onClick: (row) => handleDelete("designRequest", row._id),
                    },
                  ]
                : []),
            ]}
          />
        );

      case "bids":
        return (
          <AdminTable
            columns={[
              { key: "projectName", label: "Project" },
              { key: "customerName", label: "Customer" },
              { key: "estimatedBudget", label: "Budget" },
              {
                key: "projectTimeline",
                label: "Timeline",
                render: (row) =>
                  row.projectTimeline ? `${row.projectTimeline} days` : "—",
              },
              {
                key: "status",
                label: "Status",
                render: (row) => (
                  <Badge variant={row.status}>{row.status}</Badge>
                ),
              },
              {
                key: "createdAt",
                label: "Created",
                render: (row) =>
                  row.createdAt
                    ? new Date(row.createdAt).toLocaleDateString()
                    : "—",
              },
            ]}
            data={filteredData}
            actions={[
              {
                variant: "view",
                label: "View",
                icon: Eye,
                onClick: (row) => navigate(`${basePath}/bid/${row._id}`),
              },
              ...(canManage
                ? [
                    {
                      variant: "delete",
                      label: "Delete",
                      icon: Trash2,
                      onClick: (row) => handleDelete("bid", row._id),
                    },
                  ]
                : []),
            ]}
          />
        );

      case "job-applications":
        return (
          <AdminTable
            columns={[
              { key: "fullName", label: "Name" },
              { key: "email", label: "Email" },
              { key: "positionApplying", label: "Position" },
              { key: "experience", label: "Experience" },
              { key: "location", label: "Location" },
              { key: "status", label: "Status" },
              {
                key: "createdAt",
                label: "Applied Date",
                render: (row) =>
                  row.createdAt
                    ? new Date(row.createdAt).toLocaleDateString()
                    : "—",
              },
            ]}
            data={filteredData}
            actions={[
              {
                variant: "view",
                label: "View",
                icon: Eye,
                onClick: (row) =>
                  navigate(`${basePath}/job-application/${row._id}`),
              },
              ...(canManage
                ? [
                    {
                      variant: "delete",
                      label: "Delete",
                      icon: Trash2,
                      onClick: (row) => handleDelete("jobApplication", row._id),
                    },
                  ]
                : []),
            ]}
          />
        );

      default:
        return <p>No data available</p>;
    }
  };

  return (
    <AdminLayout>
      <div className="data-management-content">
        {/* Page Header */}
        <PageHeader
          title="Data Management"
          subtitle="View and manage all platform data"
          actions={
            <ActionButton
              label="Refresh"
              icon={RefreshCw}
              variant="primary"
              onClick={fetchData}
            />
          }
        />

        {/* Tabs Section */}
        <Section title="" className="tabs-section">
          <div className="tabs-container">
            <div className="tab-list">
              {[
                {
                  id: "customers",
                  label: "Customers",
                  count: data.data.customers?.length ?? 0,
                },
                {
                  id: "companies",
                  label: "Companies",
                  count: data.data.companies?.length ?? 0,
                },
                {
                  id: "workers",
                  label: "Workers",
                  count: data.data.workers?.length ?? 0,
                },
                {
                  id: "architect-hirings",
                  label: "Architect Hirings",
                  count: data.data.architectHirings?.length ?? 0,
                },
                {
                  id: "construction-projects",
                  label: "Projects",
                  count: data.data.constructionProjects?.length ?? 0,
                },
                {
                  id: "design-requests",
                  label: "Design Requests",
                  count: data.data.designRequests?.length ?? 0,
                },
                {
                  id: "bids",
                  label: "Bids",
                  count: data.data.bids?.length ?? 0,
                },
                {
                  id: "job-applications",
                  label: "Job Applications",
                  count: data.data.jobApplications?.length ?? 0,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  className={`tab-item ${activeTab === tab.id ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSearch("");
                    setStatusFilter("all");
                  }}
                >
                  <span>
                    {tab.label}
                    <span className="tab-count">{tab.count}</span>
                  </span>
                </button>
              ))}
            </div>

            {/* Search and Filter */}
            <div className="search-filter-container">
              <div className="search-input-wrapper">
                <input
                  type="text"
                  className="search-input"
                  placeholder={`Search ${activeTab}...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                className="filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="Pending">Pending (case)</option>
                <option value="accepted">Accepted</option>
                <option value="Accepted">Accepted (case)</option>
                <option value="rejected">Rejected</option>
                <option value="open">Open</option>
                <option value="available">Available</option>
                <option value="busy">Busy</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>

            {/* Table */}
            <div className="table-section">
              {filteredData.length > 0 ? (
                renderTableByTab()
              ) : (
                <div className="no-data-state">
                  <p>No {activeTab} found</p>
                </div>
              )}
            </div>
          </div>
        </Section>
      </div>
    </AdminLayout>
  );
};

export default AdminDataManagement;
