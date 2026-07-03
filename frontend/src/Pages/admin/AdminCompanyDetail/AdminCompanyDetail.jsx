import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  IndianRupee,
  Landmark,
  Shield,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import AdminLayout from "../../../components/admin/AdminLayout";
import { ActionButton } from "../../../components/admin/AdminUIComponents";
import { useAdminAuth } from "../../../context/AdminAuthContext";
import "../AdminCustomerDetail/AdminCustomerDetail.css";
import "./AdminCompanyDetail.css";

const _API_BASE = import.meta.env.VITE_API_BASE_URL || '';


const getDocumentUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${path.startsWith("/") ? "" : "/"}${path}`;
};

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
  if (filter === "this_week") start.setDate(now.getDate() - 6);
  if (filter === "last_month") start.setMonth(now.getMonth() - 1);
  if (filter === "last_year") start.setFullYear(now.getFullYear() - 1);
  start.setHours(0, 0, 0, 0);

  return date >= start && date <= now;
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

const normalizeStatus = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]/g, "");

const statusClass = (status) => {
  const value = normalizeStatus(status);
  if (
    ["verified", "accepted", "completed", "awarded", "released"].includes(value)
  ) {
    return "success";
  }
  if (["rejected", "denied", "cancelled", "closed", "failed"].includes(value)) {
    return "danger";
  }
  if (
    [
      "proposalsent",
      "inprogress",
      "partiallypaid",
      "partiallyreleased",
    ].includes(value)
  ) {
    return "info";
  }
  return "warning";
};

const statusLabel = (status) => {
  const normalized = normalizeStatus(status);
  const map = {
    pending: "Pending",
    verified: "Verified",
    rejected: "Rejected",
    accepted: "Accepted",
    denied: "Denied",
    open: "Open",
    awarded: "Awarded",
    completed: "Completed",
    proposalsent: "Proposal Sent",
    inprogress: "In Progress",
    partiallypaid: "Partially Paid",
    paid: "Paid",
    unpaid: "Unpaid",
    released: "Released",
  };
  return map[normalized] || String(status || "Unknown");
};

const CompanyDetailSkeleton = () => (
  <div className="customer360-skeleton">
    <div className="sk-line xl" />
    <div className="sk-line md" />
    <div className="sk-cards">
      {[1, 2, 3, 4].map((item) => (
        <div className="sk-card" key={item} />
      ))}
    </div>
    {[1, 2, 3, 4].map((item) => (
      <div className="sk-block" key={item} />
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

const AdminCompanyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { basePath } = useAdminAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fullData, setFullData] = useState(null);
  const [activeMiniNav, setActiveMiniNav] = useState(
    "company-basic-information",
  );
  const [timeFilter, setTimeFilter] = useState("all");
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [recruitmentTab, setRecruitmentTab] = useState("postings");

  const miniNavItems = [
    { id: "company-basic-information", label: "Basic Info" },
    { id: "ongoing-projects", label: "Ongoing" },
    { id: "projects-won-bids", label: "Bids Won" },
    { id: "recruitment-activity", label: "Recruitment" },
    { id: "financial-summary", label: "Finance" },
    { id: "reviews-received", label: "Reviews" },
  ];

  useEffect(() => {
    const fetchCompanyFull = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${_API_BASE}/api/admin/companies/${id}/full`, {
          credentials: "include",
        });
        const json = await response.json();
        if (!response.ok) {
          throw new Error(json.error || `Server ${response.status}`);
        }
        setFullData(json);
        setError(null);
      } catch (err) {
        setError(err.message || "Failed to load company detail");
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyFull();
  }, [id]);

  const company = fullData?.company || null;
  const summary = fullData?.summary || {};
  const verification = fullData?.verification || {};
  const ongoingProjects = fullData?.ongoingProjects || [];
  const completedShowcase = fullData?.completedShowcase || [];
  const bidsWon = fullData?.bidsWon || [];
  const recruitment = fullData?.recruitment || {
    jobPostingsCreated: [],
    receivedJobApplications: [],
  };
  const finance = fullData?.finance || {};
  const reviewsReceived = fullData?.reviewsReceived || [];
  const timestamps = fullData?.timestamps || {};

  const filteredOngoingProjects = useMemo(
    () =>
      ongoingProjects.filter((item) =>
        isWithinTimeRange(item.startDate || item.winningBidDate, timeFilter),
      ),
    [ongoingProjects, timeFilter],
  );

  const filteredBidsWon = useMemo(
    () =>
      bidsWon.filter((item) =>
        isWithinTimeRange(item.winningBidDate || item.createdAt, timeFilter),
      ),
    [bidsWon, timeFilter],
  );

  const filteredJobPostings = useMemo(
    () =>
      (recruitment.jobPostingsCreated || []).filter((item) =>
        isWithinTimeRange(item.postedOn, timeFilter),
      ),
    [recruitment.jobPostingsCreated, timeFilter],
  );

  const filteredJobApplications = useMemo(
    () =>
      (recruitment.receivedJobApplications || []).filter((item) =>
        isWithinTimeRange(item.appliedOn, timeFilter),
      ),
    [recruitment.receivedJobApplications, timeFilter],
  );

  const filteredReviews = useMemo(
    () =>
      reviewsReceived.filter((item) =>
        isWithinTimeRange(item.reviewedOn, timeFilter),
      ),
    [reviewsReceived, timeFilter],
  );

  const specializationList = useMemo(() => {
    if (!company?.specialization) return [];
    return Array.isArray(company.specialization)
      ? company.specialization
      : String(company.specialization)
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
  }, [company]);

  const fullAddress = useMemo(() => {
    if (!company?.location) return "—";
    const parts = [
      company.location.address,
      company.location.city,
      company.location.state,
      company.location.country,
      company.location.postalCode,
    ]
      .filter(Boolean)
      .map((item) => String(item).trim())
      .filter(Boolean);
    return parts.length ? parts.join(", ") : "—";
  }, [company]);

  const companyDescription = useMemo(
    () =>
      company?.aboutCompany ||
      company?.description ||
      company?.aboutForCustomers ||
      "No company description provided.",
    [company],
  );

  const visibleDescription = useMemo(() => {
    if (showFullDescription || companyDescription.length <= 220) {
      return companyDescription;
    }
    return `${companyDescription.slice(0, 220)}...`;
  }, [companyDescription, showFullDescription]);

  const handleProjectView = (routePath) => {
    if (!routePath) return;
    navigate(`${basePath}${routePath}`);
  };

  if (loading) {
    return (
      <AdminLayout>
        <CompanyDetailSkeleton />
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

  if (!company) {
    return (
      <AdminLayout>
        <div className="customer360-state">
          <p>Company not found.</p>
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
      <div className="customer360-page company360-page">
        <header className="customer360-header">
          <div>
            <h1>{company.companyName || "Company"}</h1>
            <p>Company ID: {company._id}</p>
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

        <nav className="customer360-mini-nav" aria-label="Company sections">
          <div className="mini-nav-scroll">
            {miniNavItems.map((item) => (
              <button
                key={item.id}
                className={`mini-nav-pill ${activeMiniNav === item.id ? "active" : ""}`}
                onClick={() => setActiveMiniNav(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="mini-nav-filter">
            <label htmlFor="company-time-filter">Time</label>
            <select
              id="company-time-filter"
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

        <section className="customer360-summary-grid company360-summary-grid">
          <article className="summary-card purple">
            <div className="summary-accent" />
            <Building2 size={18} />
            <div>
              <span>Company Name</span>
              <strong>{company.companyName || "—"}</strong>
            </div>
          </article>

          <article
            className={`summary-card ${
              normalizeStatus(company.status) === "verified"
                ? "green"
                : normalizeStatus(company.status) === "rejected"
                  ? "red"
                  : "orange"
            }`}
          >
            <div className="summary-accent" />
            <Shield size={18} />
            <div>
              <span>Status</span>
              <strong>{statusLabel(company.status)}</strong>
              <span className={`status-pill ${statusClass(company.status)}`}>
                {statusLabel(company.status)}
              </span>
            </div>
          </article>

          <article className="summary-card blue">
            <div className="summary-accent" />
            <Calendar size={18} />
            <div>
              <span>Member Since</span>
              <strong>{formatDate(company.createdAt)}</strong>
            </div>
          </article>

          <article className="summary-card orange">
            <div className="summary-accent" />
            <Briefcase size={18} />
            <div>
              <span>Total Projects Count</span>
              <strong>{summary.totalProjectsCount || 0}</strong>
            </div>
          </article>

          <article className="summary-card indigo">
            <div className="summary-accent" />
            <FileText size={18} />
            <div>
              <span>Verification Docs</span>
              <strong>{summary.documentsCount || 0}</strong>
            </div>
          </article>
        </section>

        {activeMiniNav === "company-basic-information" && (
          <section
            id="company-basic-information"
            className="customer360-section purple"
          >
            <SectionHeading
              id="company-basic-information-head"
              title="Company Basic Information"
              icon={Building2}
              accent="purple"
            />
            <div className="customer360-card">
              <div className="personal-grid two-col">
                <div>
                  <span>Company Name</span>
                  <strong>{company.companyName || "—"}</strong>
                </div>
                <div>
                  <span>Contact Person</span>
                  <strong>{company.contactPerson || "—"}</strong>
                </div>
                <div>
                  <span>Email Address</span>
                  <strong>{company.email || "—"}</strong>
                </div>
                <div>
                  <span>Phone Number</span>
                  <strong>{company.phone || "—"}</strong>
                </div>
                <div>
                  <span>Company Size</span>
                  <strong>{company.size || "—"}</strong>
                </div>
                <div>
                  <span>Years In Business</span>
                  <strong>{company.yearsInBusiness || "—"}</strong>
                </div>
                <div>
                  <span>Specialization</span>
                  <strong>
                    {specializationList.length
                      ? specializationList.join(", ")
                      : "—"}
                  </strong>
                </div>
                <div>
                  <span>Location</span>
                  <strong>{fullAddress}</strong>
                </div>
                <div className="company360-wide-field">
                  <span>Description</span>
                  <strong className="company360-description-text">
                    {visibleDescription}
                  </strong>
                  {companyDescription.length > 220 && (
                    <button
                      className="table-link-btn"
                      onClick={() => setShowFullDescription((prev) => !prev)}
                    >
                      {showFullDescription ? "Show less" : "Read more"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="customer360-card">
              <h3>
                <CheckCircle2 size={16} /> Verification & Status
              </h3>
              <div className="personal-grid two-col">
                <div>
                  <span>Status</span>
                  <strong>
                    <span
                      className={`status-pill ${statusClass(verification.status)}`}
                    >
                      {statusLabel(verification.status)}
                    </span>
                  </strong>
                </div>
                <div>
                  <span>Verified On</span>
                  <strong>{formatDateTime(verification.verifiedOn)}</strong>
                </div>
                <div>
                  <span>Rejection Reason</span>
                  <strong>{verification.rejectionReason || "—"}</strong>
                </div>
                <div>
                  <span>Documents Uploaded</span>
                  <strong>{(verification.documents || []).length}</strong>
                </div>
              </div>
              <div className="company360-doc-list">
                {(verification.documents || []).length === 0 ? (
                  <p className="company360-doc-empty">No documents uploaded.</p>
                ) : (
                  (verification.documents || []).map((doc, index) => (
                    <a
                      key={`${doc}-${index}`}
                      className="company360-doc-link"
                      href={getDocumentUrl(doc)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Document {index + 1}
                    </a>
                  ))
                )}
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
                    {formatDateTime(timestamps.createdAt || company.createdAt)}
                  </strong>
                </div>
                <div>
                  <span>Last Updated</span>
                  <strong>
                    {formatDateTime(timestamps.updatedAt || company.updatedAt)}
                  </strong>
                </div>
              </div>
            </div>

            <div className="customer360-card">
              <SectionHeading
                id="completed-showcase-under-basic"
                title="Completed Projects (Showcased)"
                icon={Star}
                accent="orange"
              />
              {completedShowcase.length === 0 ? (
                <div className="empty-state">
                  No completed showcased projects.
                </div>
              ) : (
                <div className="review-grid company360-showcase-grid">
                  {completedShowcase.map((project) => (
                    <article
                      key={project._id}
                      className="review-card company360-showcase-card"
                    >
                      <h4>{project.title}</h4>
                      <p>{project.description || "—"}</p>
                      <div className="company360-showcase-images">
                        {project.beforeImage ? (
                          <img src={project.beforeImage} alt="Before" />
                        ) : (
                          <div className="company360-image-placeholder">
                            Before
                          </div>
                        )}
                        {project.afterImage ? (
                          <img src={project.afterImage} alt="After" />
                        ) : (
                          <div className="company360-image-placeholder">
                            After
                          </div>
                        )}
                      </div>
                      <small>Location: {project.location || "—"}</small>
                      <small>
                        Completion Year: {project.completionYear || "—"}
                      </small>
                      <div className="company360-showcase-links">
                        {project.materialCertificate ? (
                          <a
                            href={getDocumentUrl(project.materialCertificate)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Material Certificate
                          </a>
                        ) : null}
                        {project.gpsLink ? (
                          <a
                            href={project.gpsLink}
                            target="_blank"
                            rel="noreferrer"
                          >
                            GPS Link
                          </a>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {activeMiniNav === "ongoing-projects" && (
          <section id="ongoing-projects" className="customer360-section orange">
            <SectionHeading
              id="ongoing-projects-head"
              title="Ongoing Construction & Bid Projects"
              icon={Briefcase}
              accent="orange"
            />
            {filteredOngoingProjects.length === 0 ? (
              <div className="empty-state company360-empty-state">
                <Briefcase size={18} /> No active projects
              </div>
            ) : (
              <div className="project-grid">
                {filteredOngoingProjects.map((project) => {
                  const progress = Math.min(
                    100,
                    Math.max(0, Number(project.progress || 0)),
                  );
                  return (
                    <article
                      key={`${project.type}-${project._id}`}
                      className="project-card construction"
                    >
                      <div className="project-head">
                        <h4>{project.projectName}</h4>
                        <span className="type-pill construction">
                          {project.type === "bid_awarded"
                            ? "Bid Awarded"
                            : "Construction"}
                        </span>
                      </div>
                      <p className="project-partner">
                        For Customer: {project.customerName || "—"}
                      </p>
                      <div className="project-meta-row">
                        <span
                          className={`status-pill ${statusClass(project.status)}`}
                        >
                          {statusLabel(project.status)}
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
                          <Clock size={14} /> Target:{" "}
                          {formatDate(project.targetCompletionDate)}
                        </span>
                      </div>
                      <div className="progress-wrap">
                        <div className="progress-label">
                          <span>{project.currentPhase || "Current Phase"}</span>
                          <strong>{progress}%</strong>
                        </div>
                        <div className="progress-track">
                          <div
                            className="progress-fill"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      <button
                        className="project-view-btn"
                        onClick={() => handleProjectView(project.routePath)}
                      >
                        View Full Project
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {activeMiniNav === "projects-won-bids" && (
          <section
            id="projects-won-bids"
            className="customer360-section orange"
          >
            <SectionHeading
              id="projects-won-bids-head"
              title="Projects Won Through Bidding"
              icon={Landmark}
              accent="orange"
            />
            {filteredBidsWon.length === 0 ? (
              <div className="empty-state">
                No bid records for this company.
              </div>
            ) : (
              <div className="customer360-card">
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Project Name</th>
                        <th>Customer</th>
                        <th>Bid Amount</th>
                        <th>Winning Bid Date</th>
                        <th>Status</th>
                        <th>Total Area</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBidsWon.map((bid) => (
                        <tr
                          key={bid._id}
                          className={bid.isWinning ? "winning-row" : ""}
                        >
                          <td>{bid.projectName}</td>
                          <td>{bid.customerName || "—"}</td>
                          <td>{formatCurrency(bid.bidAmount)}</td>
                          <td>{formatDate(bid.winningBidDate)}</td>
                          <td>
                            <span
                              className={`status-pill ${statusClass(bid.status)}`}
                            >
                              {statusLabel(bid.status)}
                            </span>
                          </td>
                          <td>
                            {Number(bid.totalArea || 0).toLocaleString("en-IN")}{" "}
                            sq.ft
                          </td>
                          <td>
                            <button
                              className="table-view-btn"
                              onClick={() => handleProjectView(bid.routePath)}
                            >
                              View Bid
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {activeMiniNav === "recruitment-activity" && (
          <section
            id="recruitment-activity"
            className="customer360-section green"
          >
            <SectionHeading
              id="recruitment-activity-head"
              title="Worker Recruitment Activity"
              icon={Users}
              accent="green"
            />
            <div className="customer360-card">
              <div className="inline-tabs">
                <button
                  className={recruitmentTab === "postings" ? "active" : ""}
                  onClick={() => setRecruitmentTab("postings")}
                >
                  Sent Job Offers ({filteredJobPostings.length})
                </button>
                <button
                  className={recruitmentTab === "applications" ? "active" : ""}
                  onClick={() => setRecruitmentTab("applications")}
                >
                  Received Job Applications ({filteredJobApplications.length})
                </button>
              </div>

              {recruitmentTab === "postings" ? (
                filteredJobPostings.length === 0 ? (
                  <div className="empty-state">No sent job offers.</div>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Worker</th>
                          <th>Specialization</th>
                          <th>Experience</th>
                          <th>Worker Status</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Position</th>
                          <th>Location</th>
                          <th>Salary</th>
                          <th>Status</th>
                          <th>Posted On</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredJobPostings.map((posting) => (
                          <tr key={posting._id}>
                            <td>
                              {posting.workerRoutePath ? (
                                <button
                                  className="table-link-btn"
                                  onClick={() =>
                                    handleProjectView(posting.workerRoutePath)
                                  }
                                >
                                  {posting.workerName || "—"}
                                </button>
                              ) : (
                                posting.workerName || "—"
                              )}
                            </td>
                            <td>{posting.workerSpecialization || "—"}</td>
                            <td>{Number(posting.workerExperience || 0)} yrs</td>
                            <td>
                              <span
                                className={`status-pill ${statusClass(posting.workerProfileStatus)}`}
                              >
                                {statusLabel(posting.workerProfileStatus)}
                              </span>
                            </td>
                            <td>{posting.workerEmail || "—"}</td>
                            <td>{posting.workerPhone || "—"}</td>
                            <td>{posting.position || "—"}</td>
                            <td>{posting.location || "—"}</td>
                            <td>{formatCurrency(posting.salary)}</td>
                            <td>
                              <span
                                className={`status-pill ${statusClass(posting.status)}`}
                              >
                                {statusLabel(posting.status)}
                              </span>
                            </td>
                            <td>{formatDate(posting.postedOn)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : filteredJobApplications.length === 0 ? (
                <div className="empty-state">No job applications received.</div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Applicant Name</th>
                        <th>Position</th>
                        <th>Experience</th>
                        <th>Expected Salary</th>
                        <th>Status</th>
                        <th>Applied On</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredJobApplications.map((application) => (
                        <tr key={application._id}>
                          <td>{application.applicantName || "—"}</td>
                          <td>{application.position || "—"}</td>
                          <td>{application.experience || 0} yrs</td>
                          <td>{formatCurrency(application.expectedSalary)}</td>
                          <td>
                            <span
                              className={`status-pill ${statusClass(application.status)}`}
                            >
                              {statusLabel(application.status)}
                            </span>
                          </td>
                          <td>{formatDate(application.appliedOn)}</td>
                          <td>
                            {application.routePath ? (
                              <button
                                className="table-view-btn"
                                onClick={() =>
                                  handleProjectView(application.routePath)
                                }
                              >
                                View Application
                              </button>
                            ) : (
                              "—"
                            )}
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

        {activeMiniNav === "financial-summary" && (
          <section id="financial-summary" className="customer360-section green">
            <SectionHeading
              id="financial-summary-head"
              title="Financial Summary"
              icon={TrendingUp}
              accent="green"
            />
            <div className="company360-finance-grid">
              <article className="summary-card green">
                <div className="summary-accent" />
                <IndianRupee size={18} />
                <div>
                  <span>Total Project Value Handled</span>
                  <strong>
                    {formatCurrency(finance.totalProjectValueHandled)}
                  </strong>
                </div>
              </article>
              <article className="summary-card blue">
                <div className="summary-accent" />
                <CheckCircle2 size={18} />
                <div>
                  <span>Total Amount Received</span>
                  <strong>{formatCurrency(finance.totalAmountReceived)}</strong>
                </div>
              </article>
              <article className="summary-card orange">
                <div className="summary-accent" />
                <Clock size={18} />
                <div>
                  <span>Pending Payouts</span>
                  <strong>{formatCurrency(finance.pendingPayouts)}</strong>
                </div>
              </article>
              <article className="summary-card purple">
                <div className="summary-accent" />
                <Calendar size={18} />
                <div>
                  <span>Last Payout</span>
                  <strong>
                    {finance.lastPayoutDate
                      ? `${formatDate(finance.lastPayoutDate)} (${formatCurrency(finance.lastPayoutAmount)})`
                      : "—"}
                  </strong>
                </div>
              </article>
              <article className="summary-card teal">
                <div className="summary-accent" />
                <Landmark size={18} />
                <div>
                  <span>Total Commission Received</span>
                  <strong>
                    {formatCurrency(finance.totalCommissionReceived || 0)}
                  </strong>
                </div>
              </article>
            </div>

            <div className="customer360-card">
              <h3>
                <TrendingUp size={16} /> Construction Finance Details
              </h3>
              {(finance.constructionDetails || []).length === 0 ? (
                <div className="empty-state">
                  No construction finance details.
                </div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Project</th>
                        <th>Status</th>
                        <th>Contract Value</th>
                        <th>Released</th>
                        <th>Pending</th>
                        <th>Payouts</th>
                        <th>Last Payout</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(finance.constructionDetails || []).map((row) => (
                        <tr key={row.id}>
                          <td>{row.projectName}</td>
                          <td>
                            <span
                              className={`status-pill ${statusClass(row.status)}`}
                            >
                              {statusLabel(row.status)}
                            </span>
                          </td>
                          <td>{formatCurrency(row.contractValue)}</td>
                          <td>{formatCurrency(row.totalReleased)}</td>
                          <td>{formatCurrency(row.pendingPayout)}</td>
                          <td>
                            {row.releasedCount || 0} released /{" "}
                            {row.pendingCount || 0} pending
                          </td>
                          <td>{formatDate(row.lastPayoutDate)}</td>
                          <td>
                            <button
                              className="table-view-btn"
                              onClick={() => handleProjectView(row.routePath)}
                            >
                              View Project
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="customer360-card">
              <h3>
                <Landmark size={16} /> Bid Finance Details
              </h3>
              {(finance.bidDetails || []).length === 0 ? (
                <div className="empty-state">No bid finance details.</div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Project</th>
                        <th>Status</th>
                        <th>Bid Amount</th>
                        <th>Released</th>
                        <th>Pending</th>
                        <th>Payouts</th>
                        <th>Last Payout</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(finance.bidDetails || []).map((row) => (
                        <tr key={row.id}>
                          <td>{row.projectName}</td>
                          <td>
                            <span
                              className={`status-pill ${statusClass(row.status)}`}
                            >
                              {statusLabel(row.status)}
                            </span>
                          </td>
                          <td>{formatCurrency(row.contractValue)}</td>
                          <td>{formatCurrency(row.totalReleased)}</td>
                          <td>{formatCurrency(row.pendingPayout)}</td>
                          <td>
                            {row.releasedCount || 0} released /{" "}
                            {row.pendingCount || 0} pending
                          </td>
                          <td>{formatDate(row.lastPayoutDate)}</td>
                          <td>
                            <button
                              className="table-view-btn"
                              onClick={() => handleProjectView(row.routePath)}
                            >
                              View Bid
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

        {activeMiniNav === "reviews-received" && (
          <section id="reviews-received" className="customer360-section purple">
            <SectionHeading
              id="reviews-received-head"
              title="Reviews Received"
              icon={Star}
              accent="purple"
            />
            {filteredReviews.length === 0 ? (
              <div className="empty-state">No reviews received yet.</div>
            ) : (
              <div className="review-grid">
                {filteredReviews.map((review) => (
                  <article key={review._id} className="review-card">
                    <div className="review-head">
                      <h4>{review.projectName || "Project"}</h4>
                      <span>⭐ {Number(review.rating || 0).toFixed(1)}</span>
                    </div>
                    <p>Customer: {review.customerName || "—"}</p>
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
      </div>
    </AdminLayout>
  );
};

export default AdminCompanyDetail;
