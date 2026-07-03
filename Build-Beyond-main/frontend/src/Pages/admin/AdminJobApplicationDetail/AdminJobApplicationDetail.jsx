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
  Mail,
  MapPin,
  Shield,
  User,
} from "lucide-react";
import AdminLayout from "../../../components/admin/AdminLayout";
import { ActionButton } from "../../../components/admin/AdminUIComponents";
import { useAdminAuth } from "../../../context/AdminAuthContext";
import "../AdminCustomerDetail/AdminCustomerDetail.css";
import "./AdminJobApplicationDetail.css";

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
  const key = normalizeStatus(status);
  if (["accepted", "completed", "approved"].includes(key)) {
    return "success";
  }
  if (["denied", "rejected", "cancelled"].includes(key)) {
    return "danger";
  }
  if (["inprogress", "underreview"].includes(key)) {
    return "info";
  }
  return "warning";
};

const statusLabel = (status) => {
  const key = normalizeStatus(status);
  const map = {
    pending: "Pending",
    accepted: "Accepted",
    denied: "Denied",
  };
  return map[key] || String(status || "Unknown");
};

const ApplicationDetailSkeleton = () => (
  <div className="customer360-skeleton">
    <div className="sk-line xl" />
    <div className="sk-line md" />
    <div className="sk-cards">
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <div key={item} className="sk-card" />
      ))}
    </div>
    {[1, 2, 3].map((item) => (
      <div key={item} className="sk-block" />
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

const AdminJobApplicationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { basePath } = useAdminAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [application, setApplication] = useState(null);
  const [activeMiniNav, setActiveMiniNav] = useState("basic-info");

  const miniNavItems = [
    { id: "basic-info", label: "Basic Info" },
    { id: "application-details", label: "Application Details" },
    { id: "skills-experience", label: "Skills & Experience" },
    { id: "documents", label: "Documents" },
    { id: "timestamps", label: "Timestamps" },
  ];

  useEffect(() => {
    const fetchApplication = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/job-application/${id}`, {
          credentials: "include",
        });
        const json = await response.json();
        if (!response.ok) {
          throw new Error(json.error || `Server ${response.status}`);
        }
        setApplication(json.application || null);
        setError(null);
      } catch (err) {
        setError(err.message || "Failed to load application detail");
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [id]);

  const workerRoute = application?.workerId?._id
    ? `${basePath}/worker/${application.workerId._id}`
    : null;
  const companyRoute = application?.companyId?._id
    ? `${basePath}/company/${application.companyId._id}`
    : null;

  const skills = useMemo(() => {
    return Array.isArray(application?.primarySkills)
      ? application.primarySkills.filter(Boolean)
      : [];
  }, [application]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="customer360-page">
          <ApplicationDetailSkeleton />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="customer360-page">
          <div className="error-state">
            <h2>Unable to load application details</h2>
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

  if (!application) {
    return (
      <AdminLayout>
        <div className="customer360-page">
          <div className="error-state">
            <h2>Application not found</h2>
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
      <div className="customer360-page application360-page">
        <header className="customer360-header">
          <div>
            <h1>{application.fullName || "Job Application"}</h1>
            <p>Application ID: {application._id}</p>
          </div>
          <div className="customer360-header-actions">
            <ActionButton
              label="Back to Data Management"
              icon={ArrowLeft}
              variant="primary"
              onClick={() => navigate(`${basePath}/data-management`)}
            />
          </div>
        </header>

        <div className="customer360-summary-grid application360-summary-grid">
          <article className="summary-card blue">
            <div className="summary-accent" />
            <User size={18} />
            <div>
              <span>Applicant</span>
              {workerRoute ? (
                <button
                  className="project-view-btn application360-inline-btn"
                  onClick={() => navigate(workerRoute)}
                >
                  {application.fullName ||
                    application.workerId?.name ||
                    "Unknown"}
                </button>
              ) : (
                <strong>
                  {application.fullName ||
                    application.workerId?.name ||
                    "Unknown"}
                </strong>
              )}
            </div>
          </article>

          <article
            className={`summary-card ${statusClass(application.status) === "danger" ? "red" : statusClass(application.status) === "warning" ? "orange" : "green"}`}
          >
            <div className="summary-accent" />
            <Shield size={18} />
            <div>
              <span>Status</span>
              <strong>{statusLabel(application.status)}</strong>
            </div>
          </article>

          <article className="summary-card purple">
            <div className="summary-accent" />
            <Briefcase size={18} />
            <div>
              <span>Position</span>
              <strong>{application.positionApplying || "—"}</strong>
            </div>
          </article>

          <article className="summary-card emerald">
            <div className="summary-accent" />
            <Building2 size={18} />
            <div>
              <span>Company</span>
              {companyRoute ? (
                <button
                  className="project-view-btn application360-inline-btn"
                  onClick={() => navigate(companyRoute)}
                >
                  {application.compName ||
                    application.companyId?.companyName ||
                    "—"}
                </button>
              ) : (
                <strong>
                  {application.compName ||
                    application.companyId?.companyName ||
                    "—"}
                </strong>
              )}
            </div>
          </article>

          <article className="summary-card orange">
            <div className="summary-accent" />
            <IndianRupee size={18} />
            <div>
              <span>Expected Salary</span>
              <strong>{formatCurrency(application.expectedSalary)}</strong>
            </div>
          </article>

          <article className="summary-card rose">
            <div className="summary-accent" />
            <CheckCircle2 size={18} />
            <div>
              <span>Experience</span>
              <strong>{Number(application.experience || 0)} years</strong>
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

        {activeMiniNav === "basic-info" && (
          <section id="basic-info" className="customer360-section blue">
            <SectionHeading
              id="basic-info-head"
              title="Applicant Basic Information"
              icon={User}
              accent="blue"
            />

            <div className="customer360-card">
              <div className="personal-grid two-col">
                <div>
                  <span>Full Name</span>
                  <strong>{application.fullName || "—"}</strong>
                </div>
                <div>
                  <span>Email</span>
                  <strong>{application.email || "—"}</strong>
                </div>
                <div>
                  <span>Location</span>
                  <strong>{application.location || "—"}</strong>
                </div>
                <div>
                  <span>LinkedIn</span>
                  {application.linkedin ? (
                    <a
                      href={application.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="application360-link"
                    >
                      Open Profile
                    </a>
                  ) : (
                    <strong>—</strong>
                  )}
                </div>
              </div>
            </div>

            <div className="customer360-card">
              <h3>
                <MapPin size={16} /> Assignment Context
              </h3>
              <div className="personal-grid two-col">
                <div>
                  <span>Position Applied</span>
                  <strong>{application.positionApplying || "—"}</strong>
                </div>
                <div>
                  <span>Company</span>
                  {companyRoute ? (
                    <button
                      className="project-view-btn application360-inline-btn"
                      onClick={() => navigate(companyRoute)}
                    >
                      {application.compName ||
                        application.companyId?.companyName ||
                        "—"}
                    </button>
                  ) : (
                    <strong>
                      {application.compName ||
                        application.companyId?.companyName ||
                        "—"}
                    </strong>
                  )}
                </div>
                <div>
                  <span>Worker Profile</span>
                  {workerRoute ? (
                    <button
                      className="project-view-btn application360-inline-btn"
                      onClick={() => navigate(workerRoute)}
                    >
                      Open Worker Profile
                    </button>
                  ) : (
                    <strong>—</strong>
                  )}
                </div>
                <div>
                  <span>Status</span>
                  <strong>{statusLabel(application.status)}</strong>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeMiniNav === "application-details" && (
          <section
            id="application-details"
            className="customer360-section blue"
          >
            <SectionHeading
              id="application-details-head"
              title="Application Details"
              icon={FileText}
              accent="blue"
            />

            <div className="customer360-card">
              <div className="personal-grid two-col">
                <div>
                  <span>Experience</span>
                  <strong>{Number(application.experience || 0)} years</strong>
                </div>
                <div>
                  <span>Expected Salary</span>
                  <strong>{formatCurrency(application.expectedSalary)}</strong>
                </div>
                <div>
                  <span>Terms Agreed</span>
                  <strong>{application.termsAgree ? "Yes" : "No"}</strong>
                </div>
                <div>
                  <span>Status</span>
                  <strong>{statusLabel(application.status)}</strong>
                </div>
                <div className="application360-wide-field">
                  <span>Work Experience Details</span>
                  <strong>{application.workExperience || "—"}</strong>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeMiniNav === "skills-experience" && (
          <section id="skills-experience" className="customer360-section green">
            <SectionHeading
              id="skills-experience-head"
              title="Skills & Experience"
              icon={Briefcase}
              accent="green"
            />

            <div className="customer360-card">
              <h3>Primary Skills</h3>
              {skills.length === 0 ? (
                <div className="empty-state">No primary skills listed.</div>
              ) : (
                <div className="application360-skill-wrap">
                  {skills.map((skill, index) => (
                    <span
                      key={`${skill}-${index}`}
                      className="application360-skill-chip"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="customer360-card">
              <h3>Experience Snapshot</h3>
              <div className="personal-grid two-col">
                <div>
                  <span>Total Experience</span>
                  <strong>{Number(application.experience || 0)} years</strong>
                </div>
                <div>
                  <span>Expected Salary</span>
                  <strong>{formatCurrency(application.expectedSalary)}</strong>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeMiniNav === "documents" && (
          <section id="documents" className="customer360-section green">
            <SectionHeading
              id="documents-head"
              title="Documents"
              icon={FileText}
              accent="green"
            />

            <div className="customer360-card">
              <div className="personal-grid two-col">
                <div>
                  <span>Resume</span>
                  {application.resume ? (
                    <a
                      href={application.resume}
                      target="_blank"
                      rel="noreferrer"
                      className="application360-link"
                    >
                      View Resume
                    </a>
                  ) : (
                    <strong>Not Provided</strong>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {activeMiniNav === "timestamps" && (
          <section id="timestamps" className="customer360-section purple">
            <SectionHeading
              id="timestamps-head"
              title="Timestamps & Metadata"
              icon={Calendar}
              accent="purple"
            />

            <div className="customer360-card">
              <div className="personal-grid two-col">
                <div>
                  <span>Created At</span>
                  <strong>{formatDateTime(application.createdAt)}</strong>
                </div>
                <div>
                  <span>Last Updated</span>
                  <strong>{formatDateTime(application.updatedAt)}</strong>
                </div>
                <div>
                  <span>Status</span>
                  <strong>{statusLabel(application.status)}</strong>
                </div>
                <div>
                  <span>Applied On</span>
                  <strong>{formatDate(application.createdAt)}</strong>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminJobApplicationDetail;
