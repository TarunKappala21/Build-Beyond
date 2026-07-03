import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileCheck,
  IndianRupee,
  Languages,
  MapPin,
  Shield,
  Star,
  User,
  Wallet,
} from "lucide-react";
import AdminLayout from "../../../components/admin/AdminLayout";
import { ActionButton } from "../../../components/admin/AdminUIComponents";
import { useAdminAuth } from "../../../context/AdminAuthContext";
import "../AdminCustomerDetail/AdminCustomerDetail.css";
import "./AdminWorkerDetail.css";

const _API_BASE = import.meta.env.VITE_API_BASE_URL || '';


const getDocumentUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${path.startsWith("/") ? "" : "/"}${path}`;
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
    .replace(/[_\s-]/g, "");

const statusClass = (status) => {
  const value = normalizeStatus(status);
  if (
    ["verified", "accepted", "completed", "released", "withdrawn"].includes(
      value,
    )
  ) {
    return "success";
  }
  if (["rejected", "denied", "failed", "cancelled", "closed"].includes(value)) {
    return "danger";
  }
  if (
    [
      "inprogress",
      "proposalsent",
      "partiallyreleased",
      "partiallypaid",
    ].includes(value)
  ) {
    return "info";
  }
  return "warning";
};

const statusLabel = (status) => {
  const key = normalizeStatus(status);
  const map = {
    pending: "Pending",
    verified: "Verified",
    rejected: "Rejected",
    accepted: "Accepted",
    proposalsent: "Proposal Sent",
    inprogress: "In Progress",
    pendingpayment: "Pending Payment",
    completed: "Completed",
    released: "Released",
    withdrawn: "Withdrawn",
    failed: "Failed",
  };
  return map[key] || String(status || "Unknown");
};

const maskAadhaar = (aadhaarLast4) =>
  aadhaarLast4 ? `XXXX XXXX XXXX ${aadhaarLast4}` : "—";

const WorkerDetailSkeleton = () => (
  <div className="customer360-skeleton">
    <div className="sk-line xl" />
    <div className="sk-line md" />
    <div className="sk-cards">
      {[1, 2, 3, 4, 5, 6].map((item) => (
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

const AdminWorkerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { basePath } = useAdminAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fullData, setFullData] = useState(null);
  const [activeMiniNav, setActiveMiniNav] = useState("personal-information");
  const [showFullAbout, setShowFullAbout] = useState(false);

  const miniNavItems = [
    { id: "personal-information", label: "Personal Info" },
    { id: "ongoing-projects", label: "Ongoing" },
    { id: "completed-projects", label: "Completed" },
    { id: "earnings-payouts", label: "Earnings" },
    { id: "reviews-ratings", label: "Reviews" },
    { id: "previous-employment", label: "Work History" },
  ];

  useEffect(() => {
    const fetchWorkerFull = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${_API_BASE}/api/admin/workers/${id}/full`, {
          credentials: "include",
        });
        const json = await response.json();
        if (!response.ok) {
          throw new Error(json.error || `Server ${response.status}`);
        }
        setFullData(json);
        setError(null);
      } catch (err) {
        setError(err.message || "Failed to load worker detail");
      } finally {
        setLoading(false);
      }
    };

    fetchWorkerFull();
  }, [id]);

  const worker = fullData?.worker || null;
  const summary = fullData?.summary || {};
  const verification = fullData?.verification || {};
  const ongoingProjects = fullData?.ongoingProjects || [];
  const completedProjects = fullData?.completedProjects || [];
  const earnings = fullData?.earnings || {};
  const totalCommission = useMemo(
    () => Number(earnings.totalEarnings || 0) * 0.15,
    [earnings.totalEarnings],
  );
  const reviewsReceived = fullData?.reviewsReceived || [];
  const previousEmployment = fullData?.previousEmployment || [];
  const portfolio = fullData?.portfolio || [];
  const timestamps = fullData?.timestamps || {};

  const languages = useMemo(() => {
    return Array.isArray(worker?.languages)
      ? worker.languages.filter(Boolean)
      : [];
  }, [worker]);

  const servicesOffered = useMemo(() => {
    const values = Array.isArray(worker?.servicesOffered)
      ? worker.servicesOffered
      : [];
    return values.filter(Boolean);
  }, [worker]);

  const averageRating = useMemo(() => {
    if (summary.averageRating) return Number(summary.averageRating || 0);
    if (!reviewsReceived.length) return 0;
    const total = reviewsReceived.reduce(
      (sum, review) => sum + Number(review.rating || 0),
      0,
    );
    return total / reviewsReceived.length;
  }, [summary.averageRating, reviewsReceived]);

  const aboutText = String(worker?.about || "").trim();
  const aboutPreview = aboutText.length > 220 && !showFullAbout;

  const handleProjectView = (routePath) => {
    if (!routePath) return;
    navigate(`${basePath}${routePath}`);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="customer360-page">
          <WorkerDetailSkeleton />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="customer360-page">
          <div className="error-state">
            <h2>Unable to load worker details</h2>
            <p>{error}</p>
            <ActionButton
              label="Back to Data Management"
              icon={ArrowLeft}
              variant="primary"
              onClick={() => navigate(`${basePath}/data-management`)}
            />
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!worker) {
    return (
      <AdminLayout>
        <div className="customer360-page">
          <div className="error-state">
            <h2>Worker not found</h2>
            <ActionButton
              label="Back to Data Management"
              icon={ArrowLeft}
              variant="primary"
              onClick={() => navigate(`${basePath}/data-management`)}
            />
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="customer360-page worker360-page">
        <header className="customer360-header">
          <div>
            <h1>{worker.name || "Worker"}</h1>
            <p>Worker ID: {worker._id}</p>
          </div>
          <div className="customer360-header-actions">
            <ActionButton
              label="Export Worker Profile"
              icon={Download}
              variant="secondary"
              onClick={() => window.print()}
            />
            <ActionButton
              label="Back to Data Management"
              icon={ArrowLeft}
              variant="primary"
              onClick={() => navigate(`${basePath}/data-management`)}
            />
          </div>
        </header>

        <div className="customer360-summary-grid worker360-summary-grid">
          <article className="summary-card green">
            <div className="summary-accent" />
            <User size={18} />
            <div>
              <span>Full Name</span>
              <strong>{worker.name || "—"}</strong>
            </div>
          </article>

          <article className="summary-card emerald">
            <div className="summary-accent" />
            <Briefcase size={18} />
            <div>
              <span>Role</span>
              <strong className="worker360-role">worker</strong>
              {worker.isArchitect && (
                <small className="worker360-architect-chip">Architect</small>
              )}
            </div>
          </article>

          <article
            className={`summary-card ${statusClass(worker.status) === "danger" ? "red" : statusClass(worker.status) === "warning" ? "orange" : "green"}`}
          >
            <div className="summary-accent" />
            <Shield size={18} />
            <div>
              <span>Status</span>
              <strong>{statusLabel(worker.status)}</strong>
            </div>
          </article>

          <article className="summary-card purple">
            <div className="summary-accent" />
            <Calendar size={18} />
            <div>
              <span>Member Since</span>
              <strong>
                {formatDate(summary.memberSince || worker.createdAt)}
              </strong>
            </div>
          </article>

          <article className="summary-card amber">
            <div className="summary-accent" />
            <IndianRupee size={18} />
            <div>
              <span>Total Earnings</span>
              <strong>{formatCurrency(earnings.totalEarnings)}</strong>
            </div>
          </article>

          <article className="summary-card orange">
            <div className="summary-accent" />
            <Clock size={18} />
            <div>
              <span>Active Projects</span>
              <strong>{summary.activeProjectsCount || 0}</strong>
            </div>
          </article>
        </div>

        <div className="customer360-mini-nav">
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
        </div>

        {activeMiniNav === "personal-information" && (
          <section
            id="personal-information"
            className="customer360-section green"
          >
            <SectionHeading
              id="personal-information-head"
              title="Personal & Professional Information"
              icon={User}
              accent="green"
            />

            <div className="customer360-card">
              <div className="personal-grid two-col">
                <div>
                  <span>Full Name</span>
                  <strong>{worker.name || "—"}</strong>
                </div>
                <div>
                  <span>Professional Title</span>
                  <strong>{worker.professionalTitle || "—"}</strong>
                </div>
                <div>
                  <span>Email Address</span>
                  <strong>{worker.email || "—"}</strong>
                </div>
                <div>
                  <span>Phone Number</span>
                  <strong>{worker.phone || "—"}</strong>
                </div>
                <div>
                  <span>Date of Birth</span>
                  <strong>{formatDate(worker.dob)}</strong>
                </div>
                <div>
                  <span>Aadhaar Number</span>
                  <strong>{maskAadhaar(verification.aadhaarLast4)}</strong>
                </div>
                <div>
                  <span>Specialization</span>
                  <strong>{worker.specialization || "—"}</strong>
                </div>
                <div>
                  <span>Experience</span>
                  <strong>{Number(worker.experience || 0)} years</strong>
                </div>
                <div>
                  <span>Availability</span>
                  <strong>
                    {statusLabel(worker.availability || "available")}
                  </strong>
                </div>
                <div>
                  <span>Expected Price</span>
                  <strong>
                    {worker.expectedPrice
                      ? String(worker.expectedPrice).startsWith("₹")
                        ? worker.expectedPrice
                        : formatCurrency(worker.expectedPrice)
                      : "—"}
                  </strong>
                </div>
                <div className="worker360-wide-field">
                  <span>
                    <Languages size={12} /> Languages
                  </span>
                  <strong>
                    {languages.length ? (
                      <div className="worker360-chip-wrap">
                        {languages.map((language, index) => (
                          <span
                            className="worker360-chip"
                            key={`${language}-${index}`}
                          >
                            {language}
                          </span>
                        ))}
                      </div>
                    ) : (
                      "—"
                    )}
                  </strong>
                </div>
                <div className="worker360-wide-field">
                  <span>
                    <FileCheck size={12} /> Services Offered
                  </span>
                  <strong>
                    {servicesOffered.length ? (
                      <div className="worker360-chip-wrap">
                        {servicesOffered.map((service, index) => (
                          <span
                            className="worker360-chip"
                            key={`${service}-${index}`}
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                    ) : (
                      "—"
                    )}
                  </strong>
                </div>
                <div className="worker360-wide-field">
                  <span>About / Bio</span>
                  <strong className="worker360-about-text">
                    {aboutText
                      ? aboutPreview
                        ? `${aboutText.slice(0, 220)}...`
                        : aboutText
                      : "—"}
                  </strong>
                  {aboutText.length > 220 && (
                    <button
                      className="project-view-btn"
                      onClick={() => setShowFullAbout((state) => !state)}
                    >
                      {showFullAbout ? "Show Less" : "Read More"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="customer360-card">
              <h3>
                <Shield size={16} /> Verification Status & Documents
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
                  <span>Aadhaar Verified</span>
                  <strong>
                    {verification.aadhaarVerified
                      ? "✅ Verified"
                      : "❌ Not Verified"}
                  </strong>
                </div>
                <div className="worker360-wide-field">
                  <span>Certificate Files</span>
                  <strong>
                    {(verification.certificateFiles || []).length === 0 ? (
                      "No certificate files uploaded"
                    ) : (
                      <div className="worker360-link-list">
                        {(verification.certificateFiles || []).map(
                          (file, index) => (
                            <a
                              key={`${file}-${index}`}
                              href={getDocumentUrl(file)}
                              target="_blank"
                              rel="noreferrer"
                              className="worker360-file-link"
                            >
                              Certificate {index + 1}
                            </a>
                          ),
                        )}
                      </div>
                    )}
                  </strong>
                </div>
                {!!verification.rejectionReason && (
                  <div className="worker360-wide-field">
                    <span>Rejection Reason</span>
                    <strong>{verification.rejectionReason}</strong>
                  </div>
                )}
              </div>
            </div>

            <div className="customer360-card">
              <h3>
                <Calendar size={16} /> Account Timestamps
              </h3>
              <div className="personal-grid two-col">
                <div>
                  <span>Created At</span>
                  <strong>{formatDateTime(timestamps.createdAt)}</strong>
                </div>
                <div>
                  <span>Last Updated</span>
                  <strong>{formatDateTime(timestamps.updatedAt)}</strong>
                </div>
              </div>
            </div>

            <div className="customer360-card">
              <h3>
                <FileCheck size={16} /> Showcased Projects / Portfolio
              </h3>
              {portfolio.length === 0 ? (
                <div className="empty-state">No showcased projects yet.</div>
              ) : (
                <div className="project-grid worker360-portfolio-grid">
                  {portfolio.map((project, index) => {
                    const images = [
                      project.image,
                      ...(project.images || []),
                    ].filter(Boolean);
                    return (
                      <article
                        key={`${project.name || "project"}-${index}`}
                        className="project-card worker360-portfolio-card"
                      >
                        <div className="project-head">
                          <h4>{project.name || `Project ${index + 1}`}</h4>
                          <span className="type-pill interior">
                            {project.year || project.yearRange || "—"}
                          </span>
                        </div>
                        <p className="project-partner">
                          {project.description || "No description added."}
                        </p>

                        {images.length > 0 ? (
                          <div className="worker360-portfolio-images">
                            {images.map((image, imageIndex) => (
                              <img
                                key={`${image}-${imageIndex}`}
                                src={image}
                                alt={`${project.name || "Project"} ${imageIndex + 1}`}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="worker360-image-placeholder">
                            No images uploaded
                          </div>
                        )}

                        <div
                          className="worker360-link-list"
                          style={{ marginTop: 10 }}
                        >
                          {project.invoiceOrCertificate && (
                            <a
                              href={getDocumentUrl(project.invoiceOrCertificate)}
                              target="_blank"
                              rel="noreferrer"
                              className="worker360-file-link"
                            >
                              Invoice / Certificate
                            </a>
                          )}
                          {project.location && (
                            <span className="amount-pill">
                              Location: {project.location}
                            </span>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}

        {activeMiniNav === "ongoing-projects" && (
          <section id="ongoing-projects" className="customer360-section blue">
            <SectionHeading
              id="ongoing-projects-head"
              title="Ongoing Projects"
              icon={Briefcase}
              accent="blue"
            />
            {ongoingProjects.length === 0 ? (
              <div className="empty-state">
                No active projects at the moment
              </div>
            ) : (
              <div className="project-grid worker360-project-grid">
                {ongoingProjects.map((project) => (
                  <article key={project._id} className="project-card">
                    <div className="project-head">
                      <h4>{project.projectName}</h4>
                      <span
                        className={`type-pill ${project.type || "architect"}`}
                      >
                        {project.typeLabel || "Project"}
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

                    <div className="progress-label">
                      <span>Progress</span>
                      <strong>{Number(project.progress || 0)}%</strong>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${Math.min(100, Number(project.progress || 0))}%`,
                        }}
                      />
                    </div>

                    <div className="project-dates">
                      <span>
                        <Calendar size={13} /> Hired On:{" "}
                        {formatDate(project.hiredOn)}
                      </span>
                      <span>{project.milestoneLabel || ""}</span>
                    </div>

                    <button
                      className="project-view-btn"
                      onClick={() => handleProjectView(project.routePath)}
                    >
                      View Full Project
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {activeMiniNav === "completed-projects" && (
          <section id="completed-projects" className="customer360-section blue">
            <SectionHeading
              id="completed-projects-head"
              title="Completed Projects"
              icon={CheckCircle2}
              accent="blue"
            />
            {completedProjects.length === 0 ? (
              <div className="empty-state">No completed projects yet.</div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Project Name</th>
                      <th>Customer Name</th>
                      <th>Final Amount</th>
                      <th>Completion Date</th>
                      <th>Rating</th>
                      <th>Review Comment</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedProjects.map((project) => (
                      <tr key={project._id}>
                        <td>{project.projectName}</td>
                        <td>{project.customerName || "—"}</td>
                        <td>{formatCurrency(project.amount)}</td>
                        <td>{formatDate(project.completionDate)}</td>
                        <td>⭐ {Number(project.rating || 0).toFixed(1)}</td>
                        <td>{project.reviewComment || "—"}</td>
                        <td>
                          <button
                            className="table-view-btn"
                            onClick={() => handleProjectView(project.routePath)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {activeMiniNav === "earnings-payouts" && (
          <section id="earnings-payouts" className="customer360-section orange">
            <SectionHeading
              id="earnings-payouts-head"
              title="Earnings & Payouts"
              icon={Wallet}
              accent="orange"
            />

            <div className="worker360-finance-grid">
              <article className="summary-card amber">
                <div className="summary-accent" />
                <IndianRupee size={18} />
                <div>
                  <span>Lifetime Earnings</span>
                  <strong>{formatCurrency(earnings.totalEarnings)}</strong>
                </div>
              </article>
              <article className="summary-card green">
                <div className="summary-accent" />
                <Wallet size={18} />
                <div>
                  <span>Available Balance</span>
                  <strong>{formatCurrency(earnings.availableBalance)}</strong>
                </div>
              </article>
              <article className="summary-card orange">
                <div className="summary-accent" />
                <Clock size={18} />
                <div>
                  <span>Pending Balance</span>
                  <strong>{formatCurrency(earnings.pendingBalance)}</strong>
                </div>
              </article>
              <article className="summary-card purple">
                <div className="summary-accent" />
                <Calendar size={18} />
                <div>
                  <span>Withdrawn Amount</span>
                  <strong>{formatCurrency(earnings.withdrawnAmount)}</strong>
                </div>
              </article>
              <article className="summary-card blue">
                <div className="summary-accent" />
                <TrendingBar />
                <div>
                  <span>Monthly Earnings</span>
                  <strong>{formatCurrency(earnings.monthlyEarnings)}</strong>
                </div>
              </article>
              <article className="summary-card emerald">
                <div className="summary-accent" />
                <Shield size={18} />
                <div>
                  <span>Total Commission</span>
                  <strong>{formatCurrency(totalCommission)}</strong>
                </div>
              </article>
            </div>

            <div className="customer360-card">
              <h3>
                <Wallet size={16} /> Recent Transactions
              </h3>
              {(earnings.recentTransactions || []).length === 0 ? (
                <div className="empty-state">
                  No recent transactions available.
                </div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(earnings.recentTransactions || []).map(
                        (transaction) => (
                          <tr key={transaction._id}>
                            <td>{formatDateTime(transaction.date)}</td>
                            <td>
                              {String(transaction.type || "payment").replace(
                                /_/g,
                                " ",
                              )}
                            </td>
                            <td>{formatCurrency(transaction.amount)}</td>
                            <td>
                              <span
                                className={`status-pill ${statusClass(transaction.status)}`}
                              >
                                {statusLabel(transaction.status)}
                              </span>
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {activeMiniNav === "reviews-ratings" && (
          <section id="reviews-ratings" className="customer360-section purple">
            <SectionHeading
              id="reviews-ratings-head"
              title="Reviews & Ratings Received"
              icon={Star}
              accent="purple"
            />

            <div className="customer360-card worker360-rating-banner">
              <h3>
                <Star size={16} /> Overall Average Rating
              </h3>
              <p>
                <strong>{averageRating.toFixed(1)}</strong> / 5 (
                {reviewsReceived.length} reviews)
              </p>
            </div>

            {reviewsReceived.length === 0 ? (
              <div className="empty-state">No reviews received yet.</div>
            ) : (
              <div className="review-grid">
                {reviewsReceived.map((review) => (
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

        {activeMiniNav === "previous-employment" && (
          <section
            id="previous-employment"
            className="customer360-section green"
          >
            <SectionHeading
              id="previous-employment-head"
              title="Previous Employment"
              icon={Briefcase}
              accent="green"
            />
            {previousEmployment.length === 0 ? (
              <div className="empty-state">No previous employment data.</div>
            ) : (
              <div className="project-grid worker360-project-grid two-col">
                {previousEmployment.map((job, index) => (
                  <article
                    key={`${job.companyName}-${index}`}
                    className="project-card"
                  >
                    <div className="project-head">
                      <h4>{job.companyName || "Company"}</h4>
                      <span className="type-pill architect">Employment</span>
                    </div>
                    <p className="project-partner">
                      Role: {job.role || "—"} • <MapPin size={13} />{" "}
                      {job.location || "—"}
                    </p>
                    <div className="project-meta-row">
                      <span className="amount-pill">
                        Duration: {job.duration || "—"}
                      </span>
                    </div>
                    {(job.proofs || []).length > 0 && (
                      <div
                        className="worker360-link-list"
                        style={{ marginTop: 10 }}
                      >
                        {job.proofs.map((proof, proofIndex) => (
                          <a
                            key={`${proof}-${proofIndex}`}
                            href={getDocumentUrl(proof)}
                            target="_blank"
                            rel="noreferrer"
                            className="worker360-file-link"
                          >
                            Proof {proofIndex + 1}
                          </a>
                        ))}
                      </div>
                    )}
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

const TrendingBar = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M4 18L10 12L14 16L20 9"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M20 9H15"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export default AdminWorkerDetail;
