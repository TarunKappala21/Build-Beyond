import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  Clock,
  Eye,
  FileText,
  Hammer,
  Mail,
  MapPin,
  Phone,
  IndianRupee,
  Shield,
  Star,
  User,
  Users,
} from "lucide-react";
import AdminLayout from "../../../components/admin/AdminLayout";
import { ActionButton } from "../../../components/admin/AdminUIComponents";
import { useAdminAuth } from "../../../context/AdminAuthContext";
import "./AdminCustomerDetail.css";

const projectTypeMeta = {
  architect: { label: "Architect Hiring", className: "architect" },
  interior: { label: "Interior Design", className: "interior" },
  construction: { label: "Construction", className: "construction" },
  bid: { label: "Bid", className: "bid" },
};

const statusClass = (status) => {
  const value = String(status || "")
    .toLowerCase()
    .replace(/[_\s-]/g, "");
  if (["completed", "accepted", "awarded", "verified"].includes(value))
    return "success";
  if (["rejected", "cancelled", "closed"].includes(value)) return "danger";
  if (
    ["proposalsent", "inprogress", "held", "partiallyreleased"].includes(value)
  )
    return "info";
  return "warning";
};

const normalizeStatusKey = (status) =>
  String(status || "unknown")
    .trim()
    .toLowerCase()
    .replace(/[_\s-]/g, "");

const statusLabelMap = {
  pending: "Pending",
  proposalsent: "Proposal Sent",
  pendingpayment: "Pending Payment",
  accepted: "Accepted",
  inprogress: "In Progress",
  completed: "Completed",
  rejected: "Rejected",
  unknown: "Unknown",
};

const formatStatusLabel = (status) => {
  const key = normalizeStatusKey(status);
  if (statusLabelMap[key]) return statusLabelMap[key];
  const raw = String(status || "Unknown").replace(/[_-]/g, " ");
  return raw.replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-IN") : "—";

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const timeFilters = [
  { key: "this_week", label: "This Week" },
  { key: "last_month", label: "Last Month" },
  { key: "last_year", label: "Last Year" },
  { key: "all", label: "All Time" },
];

const isWithinTimeRange = (dateValue, filter) => {
  if (filter === "all") return true;
  if (!dateValue) return false;

  const now = new Date();
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;

  const start = new Date(now);
  if (filter === "this_week") {
    start.setDate(now.getDate() - 6);
  } else if (filter === "last_month") {
    start.setMonth(now.getMonth() - 1);
  } else if (filter === "last_year") {
    start.setFullYear(now.getFullYear() - 1);
  }

  start.setHours(0, 0, 0, 0);
  return date >= start && date <= now;
};

const CustomerDetailSkeleton = () => (
  <div className="customer360-skeleton">
    <div className="sk-line xl" />
    <div className="sk-line md" />
    <div className="sk-cards">
      {[1, 2, 3, 4].map((index) => (
        <div className="sk-card" key={index} />
      ))}
    </div>
    {[1, 2, 3].map((index) => (
      <div className="sk-block" key={index} />
    ))}
  </div>
);

const SectionHeading = ({ id, title, icon: Icon, accent = "blue" }) => (
  <div id={id} className={`customer360-section-head ${accent}`}>
    <h2>
      <Icon size={18} /> {title}
    </h2>
  </div>
);

const AdminCustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { basePath } = useAdminAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fullData, setFullData] = useState(null);
  const [professionalTab, setProfessionalTab] = useState("architects");
  const [activeMiniNav, setActiveMiniNav] = useState("personal-information");
  const [timeFilter, setTimeFilter] = useState("all");
  const [activeProjectStatus, setActiveProjectStatus] = useState("");
  const [activeWorkerProjectStatus, setActiveWorkerProjectStatus] =
    useState("");
  const [prosTypeFilter, setProsTypeFilter] = useState("all");
  const [hiredProsStatusFilter, setHiredProsStatusFilter] = useState("all");
  const [bidsStatusFilter, setBidsStatusFilter] = useState("all");
  const [paymentsStatusFilter, setPaymentsStatusFilter] = useState("all");

  const miniNavItems = [
    { id: "personal-information", label: "Personal Info" },
    { id: "projects-by-status", label: "Projects with Companies" },
    { id: "projects-with-pros", label: "Projects with Pros" },
    { id: "hired-professionals", label: "Hired Pros" },
    { id: "bids-placed", label: "Bids" },
    { id: "reviews-given", label: "Reviews" },
    { id: "payment-history", label: "Payments" },
  ];

  useEffect(() => {
    const fetchFullCustomer = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/customers/${id}/full`, {
          credentials: "include",
        });
        const json = await response.json();
        if (!response.ok)
          throw new Error(json.error || `Server ${response.status}`);
        setFullData(json);
        setError(null);
      } catch (err) {
        setError(err.message || "Failed to load customer detail");
      } finally {
        setLoading(false);
      }
    };

    fetchFullCustomer();
  }, [id]);

  const customer = fullData?.customer || null;
  const summary = fullData?.summary || {};
  const ongoingProjects = fullData?.ongoingProjects || [];
  const completedProjects = fullData?.completedProjects || [];
  const bidsPlaced = fullData?.bidsPlaced || [];
  const reviewsGiven = fullData?.reviewsGiven || [];
  const paymentHistory = fullData?.paymentHistory || [];
  const hiredProfessionals = fullData?.hiredProfessionals || {
    architects: [],
    interiorDesigners: [],
  };

  const allProjects = useMemo(
    () => [...ongoingProjects, ...completedProjects],
    [ongoingProjects, completedProjects],
  );

  const filteredProjects = useMemo(
    () =>
      allProjects.filter((project) =>
        isWithinTimeRange(
          project.startDate ||
            project.createdAt ||
            project.expectedCompletion ||
            project.completionDate,
          timeFilter,
        ),
      ),
    [allProjects, timeFilter],
  );

  const companyProjects = useMemo(
    () =>
      filteredProjects.filter(
        (project) =>
          String(project.partnerType || "").toLowerCase() !== "worker",
      ),
    [filteredProjects],
  );

  const workerProjects = useMemo(
    () =>
      filteredProjects.filter(
        (project) =>
          String(project.partnerType || "").toLowerCase() === "worker",
      ),
    [filteredProjects],
  );

  const filteredWorkerProjects = useMemo(
    () =>
      workerProjects.filter((project) => {
        if (prosTypeFilter === "all") return true;
        return String(project.type || "").toLowerCase() === prosTypeFilter;
      }),
    [workerProjects, prosTypeFilter],
  );

  const projectsByStatus = useMemo(
    () =>
      companyProjects.reduce((accumulator, project) => {
        const key = project.status || "Unknown";
        if (!accumulator[key]) accumulator[key] = [];
        accumulator[key].push(project);
        return accumulator;
      }, {}),
    [companyProjects],
  );

  const workerProjectsByStatus = useMemo(
    () =>
      filteredWorkerProjects.reduce((accumulator, project) => {
        const key = normalizeStatusKey(project.status);
        if (!accumulator[key]) {
          accumulator[key] = {
            label: formatStatusLabel(project.status),
            items: [],
          };
        }
        accumulator[key].items.push(project);
        return accumulator;
      }, {}),
    [filteredWorkerProjects],
  );

  const projectStatusTabs = useMemo(
    () => Object.keys(projectsByStatus),
    [projectsByStatus],
  );

  const workerStatusOrder = [
    "pending",
    "proposalsent",
    "pendingpayment",
    "accepted",
    "inprogress",
    "completed",
    "rejected",
    "unknown",
  ];

  const workerProjectStatusTabs = useMemo(
    () =>
      Object.keys(workerProjectsByStatus).sort((left, right) => {
        const leftIndex = workerStatusOrder.indexOf(left);
        const rightIndex = workerStatusOrder.indexOf(right);
        const safeLeft = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex;
        const safeRight =
          rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex;
        if (safeLeft !== safeRight) return safeLeft - safeRight;
        return left.localeCompare(right);
      }),
    [workerProjectsByStatus],
  );

  useEffect(() => {
    if (!projectStatusTabs.length) {
      setActiveProjectStatus("");
      return;
    }
    if (!projectStatusTabs.includes(activeProjectStatus)) {
      setActiveProjectStatus(projectStatusTabs[0]);
    }
  }, [projectStatusTabs, activeProjectStatus]);

  useEffect(() => {
    if (!workerProjectStatusTabs.length) {
      setActiveWorkerProjectStatus("");
      return;
    }
    if (!workerProjectStatusTabs.includes(activeWorkerProjectStatus)) {
      setActiveWorkerProjectStatus(workerProjectStatusTabs[0]);
    }
  }, [workerProjectStatusTabs, activeWorkerProjectStatus]);

  const filteredHiredProfessionals = useMemo(
    () => ({
      architects: (hiredProfessionals.architects || []).filter((row) =>
        isWithinTimeRange(row.hiredOn, timeFilter),
      ),
      interiorDesigners: (hiredProfessionals.interiorDesigners || []).filter(
        (row) => isWithinTimeRange(row.hiredOn, timeFilter),
      ),
    }),
    [hiredProfessionals, timeFilter],
  );

  const filteredBids = useMemo(
    () =>
      bidsPlaced.filter((bid) => isWithinTimeRange(bid.createdAt, timeFilter)),
    [bidsPlaced, timeFilter],
  );

  const filteredReviews = useMemo(
    () =>
      reviewsGiven.filter((review) =>
        isWithinTimeRange(review.reviewedOn, timeFilter),
      ),
    [reviewsGiven, timeFilter],
  );

  const filteredPayments = useMemo(
    () =>
      paymentHistory.filter((payment) =>
        isWithinTimeRange(payment.date, timeFilter),
      ),
    [paymentHistory, timeFilter],
  );

  const professionalRows = useMemo(() => {
    if (professionalTab === "architects")
      return filteredHiredProfessionals.architects || [];
    return filteredHiredProfessionals.interiorDesigners || [];
  }, [professionalTab, filteredHiredProfessionals]);

  const hiredProsStatusOptions = useMemo(() => {
    const map = new Map();
    professionalRows.forEach((row) => {
      const key = normalizeStatusKey(row.status);
      if (!map.has(key)) map.set(key, formatStatusLabel(row.status));
    });
    return Array.from(map.entries()).map(([key, label]) => ({ key, label }));
  }, [professionalRows]);

  const filteredProfessionalRows = useMemo(
    () =>
      professionalRows.filter((row) => {
        if (hiredProsStatusFilter === "all") return true;
        return normalizeStatusKey(row.status) === hiredProsStatusFilter;
      }),
    [professionalRows, hiredProsStatusFilter],
  );

  const bidsStatusOptions = useMemo(() => {
    const map = new Map();
    filteredBids.forEach((bid) => {
      const key = normalizeStatusKey(bid.status);
      if (!map.has(key)) map.set(key, formatStatusLabel(bid.status));
    });
    return Array.from(map.entries()).map(([key, label]) => ({ key, label }));
  }, [filteredBids]);

  const filteredBidsByStatus = useMemo(
    () =>
      filteredBids.filter((bid) => {
        if (bidsStatusFilter === "all") return true;
        return normalizeStatusKey(bid.status) === bidsStatusFilter;
      }),
    [filteredBids, bidsStatusFilter],
  );

  const paymentsStatusOptions = useMemo(() => {
    const map = new Map();
    filteredPayments.forEach((payment) => {
      const key = normalizeStatusKey(payment.status);
      if (!map.has(key)) map.set(key, formatStatusLabel(payment.status));
    });
    return Array.from(map.entries()).map(([key, label]) => ({ key, label }));
  }, [filteredPayments]);

  const filteredPaymentsByStatus = useMemo(
    () =>
      filteredPayments.filter((payment) => {
        if (paymentsStatusFilter === "all") return true;
        return normalizeStatusKey(payment.status) === paymentsStatusFilter;
      }),
    [filteredPayments, paymentsStatusFilter],
  );

  const handleProjectView = (routePath) => {
    if (!routePath) return;
    navigate(`${basePath}${routePath}`);
  };

  const handleMiniNavClick = (sectionId) => {
    setActiveMiniNav(sectionId);
  };

  if (loading) {
    return (
      <AdminLayout>
        <CustomerDetailSkeleton />
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="customer360-state error">
          <p>{error}</p>
          <ActionButton
            label="Back to Data Management"
            icon={ArrowLeft}
            variant="secondary"
            onClick={() => navigate(`${basePath}/data-management`)}
          />
        </div>
      </AdminLayout>
    );
  }

  if (!customer) {
    return (
      <AdminLayout>
        <div className="customer360-state">
          <p>Customer not found.</p>
          <ActionButton
            label="Back to Data Management"
            icon={ArrowLeft}
            variant="secondary"
            onClick={() => navigate(`${basePath}/data-management`)}
          />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="customer360-page">
        <header className="customer360-header">
          <div>
            <h1>{customer.name}</h1>
            <p>Customer ID: {customer._id}</p>
          </div>
          <div className="customer360-header-actions">
            <ActionButton
              label="Back to Data Management"
              icon={ArrowLeft}
              variant="secondary"
              onClick={() => navigate(`${basePath}/data-management`)}
            />
          </div>
        </header>

        <nav className="customer360-mini-nav" aria-label="Customer sections">
          <div className="mini-nav-scroll">
            {miniNavItems.map((item) => (
              <button
                key={item.id}
                className={`mini-nav-pill ${activeMiniNav === item.id ? "active" : ""}`}
                onClick={() => handleMiniNavClick(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="mini-nav-filter">
            <label htmlFor="customer-time-filter">Time</label>
            <select
              id="customer-time-filter"
              value={timeFilter}
              onChange={(event) => setTimeFilter(event.target.value)}
            >
              {timeFilters.map((filter) => (
                <option key={filter.key} value={filter.key}>
                  {filter.label}
                </option>
              ))}
            </select>
          </div>
        </nav>

        <section className="customer360-summary-grid">
          <article className="summary-card blue">
            <div className="summary-accent" />
            <User size={18} />
            <div>
              <span>Full Name</span>
              <strong>{customer.name || "—"}</strong>
            </div>
          </article>
          <article className="summary-card green">
            <div className="summary-accent" />
            <Shield size={18} />
            <div>
              <span>Role</span>
              <strong>{customer.role || "customer"}</strong>
            </div>
          </article>
          <article className="summary-card purple">
            <div className="summary-accent" />
            <Calendar size={18} />
            <div>
              <span>Member Since</span>
              <strong>
                {formatDate(summary.memberSince || customer.createdAt)}
              </strong>
            </div>
          </article>
          <article className="summary-card orange">
            <div className="summary-accent" />
            <Briefcase size={18} />
            <div>
              <span>Total Projects</span>
              <strong>{summary.totalProjects || 0}</strong>
            </div>
          </article>
        </section>

        {activeMiniNav === "personal-information" && (
          <section
            id="personal-information"
            className="customer360-section blue"
          >
            <SectionHeading
              id="personal-information-head"
              title="Personal Information"
              icon={User}
              accent="blue"
            />
            <div className="customer360-card">
              <div className="personal-grid">
                <div>
                  <span>Full Name</span>
                  <strong>{customer.name || "—"}</strong>
                </div>
                <div>
                  <span>Email</span>
                  <strong>{customer.email || "—"}</strong>
                </div>
                <div>
                  <span>Phone</span>
                  <strong>{customer.phone || "—"}</strong>
                </div>
                <div>
                  <span>DOB</span>
                  <strong>{formatDate(customer.dob)}</strong>
                </div>
                <div>
                  <span>Role</span>
                  <strong>{customer.role || "customer"}</strong>
                </div>
                <div>
                  <span>Member Since</span>
                  <strong>{formatDate(customer.createdAt)}</strong>
                </div>
              </div>
            </div>
            <div className="customer360-card">
              <h3>
                <Clock size={16} /> Account Timestamps
              </h3>
              <div className="personal-grid two-col">
                <div>
                  <span>Created At</span>
                  <strong>
                    {formatDateTime(
                      fullData?.timestamps?.createdAt || customer.createdAt,
                    )}
                  </strong>
                </div>
                <div>
                  <span>Last Updated</span>
                  <strong>
                    {formatDateTime(
                      fullData?.timestamps?.updatedAt || customer.updatedAt,
                    )}
                  </strong>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeMiniNav === "projects-by-status" && (
          <section id="projects-by-status" className="customer360-section blue">
            <SectionHeading
              id="projects-by-status-head"
              title="Projects with Companies"
              icon={Hammer}
              accent="blue"
            />
            {companyProjects.length === 0 ? (
              <div className="empty-state">
                No company projects for selected time range.
              </div>
            ) : (
              <div className="status-group-wrap">
                <div className="inline-tabs status-tabs">
                  {projectStatusTabs.map((status) => (
                    <button
                      key={status}
                      className={activeProjectStatus === status ? "active" : ""}
                      onClick={() => setActiveProjectStatus(status)}
                    >
                      {status} ({projectsByStatus[status]?.length || 0})
                    </button>
                  ))}
                </div>
                <div className="project-grid">
                  {(projectsByStatus[activeProjectStatus] || []).map(
                    (project) => {
                      const meta =
                        projectTypeMeta[project.type] ||
                        projectTypeMeta.construction;
                      const progress = Math.min(
                        100,
                        Math.max(0, Number(project.progress || 0)),
                      );
                      return (
                        <article
                          key={project._id}
                          className={`project-card ${meta.className}`}
                        >
                          <div className="project-head">
                            <h4>{project.projectName}</h4>
                            <span className={`type-pill ${meta.className}`}>
                              {meta.label}
                            </span>
                          </div>
                          <p className="project-partner">
                            With Company: {project.partnerName || "—"}
                          </p>
                          <div className="project-meta-row">
                            <span
                              className={`status-pill ${statusClass(project.status)}`}
                            >
                              {project.status}
                            </span>
                            <span className="amount-pill">
                              {formatCurrency(project.amount)}
                            </span>
                          </div>
                          <div className="project-dates">
                            <span>
                              <Calendar size={14} /> Start:{" "}
                              {formatDate(project.startDate)}
                            </span>
                            <span>
                              <Clock size={14} /> Expected:{" "}
                              {formatDate(project.expectedCompletion)}
                            </span>
                          </div>
                          <div className="progress-wrap">
                            <div className="progress-label">
                              <span>Progress</span>
                              <strong>{progress}%</strong>
                            </div>
                            <div className="progress-track">
                              <div
                                className="progress-fill"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                          {project.rating ? (
                            <p className="review-snippet">
                              Rating: ⭐ {Number(project.rating).toFixed(1)}
                            </p>
                          ) : null}
                          {project.reviewComment ? (
                            <p className="review-snippet">
                              {project.reviewComment}
                            </p>
                          ) : null}
                          <button
                            className="project-view-btn"
                            onClick={() => handleProjectView(project.routePath)}
                          >
                            <Eye size={14} /> View Full Project
                          </button>
                        </article>
                      );
                    },
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        {activeMiniNav === "projects-with-pros" && (
          <section
            id="projects-with-pros"
            className="customer360-section purple"
          >
            <SectionHeading
              id="projects-with-pros-head"
              title="Projects with Pros"
              icon={Users}
              accent="purple"
            />
            {filteredWorkerProjects.length === 0 ? (
              <div className="empty-state">
                No worker projects for selected time range.
              </div>
            ) : (
              <div className="status-group-wrap">
                <div className="status-tabs-toolbar">
                  <div className="inline-tabs status-tabs">
                    {workerProjectStatusTabs.map((status) => (
                      <button
                        key={status}
                        className={
                          activeWorkerProjectStatus === status ? "active" : ""
                        }
                        onClick={() => setActiveWorkerProjectStatus(status)}
                      >
                        {workerProjectsByStatus[status]?.label || "Unknown"} (
                        {workerProjectsByStatus[status]?.items?.length || 0})
                      </button>
                    ))}
                  </div>
                  <div className="pros-filter-control">
                    <label htmlFor="pros-type-filter">Pros</label>
                    <select
                      id="pros-type-filter"
                      value={prosTypeFilter}
                      onChange={(event) =>
                        setProsTypeFilter(event.target.value)
                      }
                    >
                      <option value="all">All Pros</option>
                      <option value="architect">Architect</option>
                      <option value="interior">Interior Designer</option>
                    </select>
                  </div>
                </div>
                <div className="project-grid">
                  {(
                    workerProjectsByStatus[activeWorkerProjectStatus]?.items ||
                    []
                  ).map((project) => {
                    const meta =
                      projectTypeMeta[project.type] ||
                      projectTypeMeta.construction;
                    const progress = Math.min(
                      100,
                      Math.max(0, Number(project.progress || 0)),
                    );
                    return (
                      <article
                        key={project._id}
                        className={`project-card ${meta.className}`}
                      >
                        <div className="project-head">
                          <h4>{project.projectName}</h4>
                          <span className={`type-pill ${meta.className}`}>
                            {meta.label}
                          </span>
                        </div>
                        <p className="project-partner">
                          With Worker: {project.partnerName || "—"}
                        </p>
                        <div className="project-meta-row">
                          <span
                            className={`status-pill ${statusClass(project.status)}`}
                          >
                            {project.status}
                          </span>
                          <span className="amount-pill">
                            {formatCurrency(project.amount)}
                          </span>
                        </div>
                        <div className="project-dates">
                          <span>
                            <Calendar size={14} /> Start:{" "}
                            {formatDate(project.startDate)}
                          </span>
                          <span>
                            <Clock size={14} /> Expected:{" "}
                            {formatDate(project.expectedCompletion)}
                          </span>
                        </div>
                        <div className="progress-wrap">
                          <div className="progress-label">
                            <span>Progress</span>
                            <strong>{progress}%</strong>
                          </div>
                          <div className="progress-track">
                            <div
                              className="progress-fill"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                        {project.rating ? (
                          <p className="review-snippet">
                            Rating: ⭐ {Number(project.rating).toFixed(1)}
                          </p>
                        ) : null}
                        {project.reviewComment ? (
                          <p className="review-snippet">
                            {project.reviewComment}
                          </p>
                        ) : null}
                        <button
                          className="project-view-btn"
                          onClick={() => handleProjectView(project.routePath)}
                        >
                          <Eye size={14} /> View Full Project
                        </button>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {activeMiniNav === "hired-professionals" && (
          <section
            id="hired-professionals"
            className="customer360-section purple"
          >
            <SectionHeading
              id="hired-professionals-head"
              title="Hired Professionals"
              icon={Users}
              accent="purple"
            />
            <div className="customer360-card">
              <div className="status-tabs-toolbar table-section-toolbar">
                <div className="inline-tabs">
                  <button
                    className={professionalTab === "architects" ? "active" : ""}
                    onClick={() => setProfessionalTab("architects")}
                  >
                    Architects Hired (
                    {filteredHiredProfessionals.architects?.length || 0})
                  </button>
                  <button
                    className={
                      professionalTab === "interiorDesigners" ? "active" : ""
                    }
                    onClick={() => setProfessionalTab("interiorDesigners")}
                  >
                    Interior Designers Hired (
                    {filteredHiredProfessionals.interiorDesigners?.length || 0})
                  </button>
                </div>
                <div className="pros-filter-control">
                  <label htmlFor="hired-pros-status-filter">Status</label>
                  <select
                    id="hired-pros-status-filter"
                    value={hiredProsStatusFilter}
                    onChange={(event) =>
                      setHiredProsStatusFilter(event.target.value)
                    }
                  >
                    <option value="all">All</option>
                    {hiredProsStatusOptions.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {filteredProfessionalRows.length === 0 ? (
                <div className="empty-state">No professionals hired yet.</div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>
                          <User size={14} /> Professional
                        </th>
                        <th>Specialization</th>
                        <th>Project Name</th>
                        <th>Fixed Amount</th>
                        <th>Status</th>
                        <th>Hired On</th>
                        <th>Rating Given</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProfessionalRows.map((row) => (
                        <tr key={`${row.professionalId}-${row.projectName}`}>
                          <td className="avatar-cell">
                            <span className="avatar-dot" />
                            {row.professionalName}
                          </td>
                          <td>{row.specialization}</td>
                          <td>
                            {row.routePath ? (
                              <button
                                className="table-link-btn"
                                onClick={() => handleProjectView(row.routePath)}
                              >
                                {row.projectName}
                              </button>
                            ) : (
                              row.projectName
                            )}
                          </td>
                          <td>{formatCurrency(row.fixedAmount)}</td>
                          <td>
                            <span
                              className={`status-pill ${statusClass(row.status)}`}
                            >
                              {row.status}
                            </span>
                          </td>
                          <td>{formatDate(row.hiredOn)}</td>
                          <td>
                            {row.ratingGiven
                              ? `⭐ ${Number(row.ratingGiven).toFixed(1)}`
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {activeMiniNav === "bids-placed" && (
          <section id="bids-placed" className="customer360-section orange">
            <SectionHeading
              id="bids-placed-head"
              title="Bids Placed"
              icon={FileText}
              accent="orange"
            />
            <div className="customer360-card">
              <div className="table-section-toolbar single-filter-toolbar">
                <div className="pros-filter-control">
                  <label htmlFor="bids-status-filter">Status</label>
                  <select
                    id="bids-status-filter"
                    value={bidsStatusFilter}
                    onChange={(event) =>
                      setBidsStatusFilter(event.target.value)
                    }
                  >
                    <option value="all">All</option>
                    {bidsStatusOptions.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {filteredBidsByStatus.length === 0 ? (
                <div className="empty-state">No bids placed.</div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Project Name</th>
                        <th>
                          <MapPin size={14} /> Location
                        </th>
                        <th>Total Area</th>
                        <th>Estimated Budget</th>
                        <th>Bids Received</th>
                        <th>Status</th>
                        <th>Created Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBidsByStatus.map((bid) => (
                        <tr
                          key={bid._id}
                          className={bid.winningBid ? "winning-row" : ""}
                        >
                          <td>
                            <strong>{bid.projectName}</strong>
                            {bid.winningBid && (
                              <small>
                                Winning Bid: {bid.winningBid.companyName} (
                                {formatCurrency(bid.winningBid.amount)})
                              </small>
                            )}
                          </td>
                          <td>{bid.location}</td>
                          <td>{bid.totalArea || 0} sq.ft</td>
                          <td>{formatCurrency(bid.estimatedBudget)}</td>
                          <td>{bid.bidsReceived}</td>
                          <td>
                            <span
                              className={`status-pill ${statusClass(bid.status)}`}
                            >
                              {bid.status}
                            </span>
                          </td>
                          <td>{formatDate(bid.createdAt)}</td>
                          <td>
                            <button
                              className="table-view-btn"
                              onClick={() => handleProjectView(bid.routePath)}
                            >
                              <Eye size={14} /> View Bid
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {activeMiniNav === "reviews-given" && (
          <section id="reviews-given" className="customer360-section purple">
            <SectionHeading
              id="reviews-given-head"
              title="Reviews & Ratings Given"
              icon={Star}
              accent="purple"
            />
            {filteredReviews.length === 0 ? (
              <div className="empty-state">No reviews submitted.</div>
            ) : (
              <div className="review-grid">
                {filteredReviews.map((review, index) => (
                  <article
                    className="review-card"
                    key={`${review.projectName}-${index}`}
                  >
                    <div className="review-head">
                      <h4>{review.projectName}</h4>
                      <span>⭐ {Number(review.rating || 0).toFixed(1)}</span>
                    </div>
                    <p>Partner: {review.partnerName || "—"}</p>
                    <p className="review-comment">
                      {review.comment || "No comment"}
                    </p>
                    <small>Reviewed On: {formatDate(review.reviewedOn)}</small>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {activeMiniNav === "payment-history" && (
          <section id="payment-history" className="customer360-section orange">
            <SectionHeading
              id="payment-history-head"
              title="Payment History"
              icon={IndianRupee}
              accent="orange"
            />
            <div className="customer360-card">
              <div className="table-section-toolbar single-filter-toolbar">
                <div className="pros-filter-control">
                  <label htmlFor="payments-status-filter">Status</label>
                  <select
                    id="payments-status-filter"
                    value={paymentsStatusFilter}
                    onChange={(event) =>
                      setPaymentsStatusFilter(event.target.value)
                    }
                  >
                    <option value="all">All</option>
                    {paymentsStatusOptions.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {filteredPaymentsByStatus.length === 0 ? (
                <div className="empty-state">No payment history available.</div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Project</th>
                        <th>Amount Paid</th>
                        <th>Platform Commission</th>
                        <th>Status</th>
                        <th>Payment Method</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPaymentsByStatus.map((payment, index) => (
                        <tr key={`${payment.project}-${index}`}>
                          <td>{formatDate(payment.date)}</td>
                          <td>
                            {payment.routePath ? (
                              <button
                                className="table-link-btn"
                                onClick={() =>
                                  handleProjectView(payment.routePath)
                                }
                              >
                                {payment.project}
                              </button>
                            ) : (
                              payment.project
                            )}
                          </td>
                          <td>{formatCurrency(payment.amountPaid)}</td>
                          <td>{formatCurrency(payment.platformCommission)}</td>
                          <td>
                            <span
                              className={`status-pill ${statusClass(payment.status)}`}
                            >
                              {payment.status}
                            </span>
                          </td>
                          <td>{payment.paymentMethod || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminCustomerDetail;
