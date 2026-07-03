import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeIndianRupee,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  FileText,
  Home,
  Layers,
  MapPin,
  Shield,
  Star,
  Users,
  Zap,
} from "lucide-react";
import AdminLayout from "../../../components/admin/AdminLayout";
import { ActionButton } from "../../../components/admin/AdminUIComponents";
import { useAdminAuth } from "../../../context/AdminAuthContext";
import "../AdminCustomerDetail/AdminCustomerDetail.css";
import "./AdminConstructionProjectDetail.css";

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
  if (["accepted", "completed", "approved", "released", "paid"].includes(key)) {
    return "success";
  }
  if (["rejected", "cancelled", "failed"].includes(key)) {
    return "danger";
  }
  if (
    [
      "proposalsent",
      "inprogress",
      "partiallypaid",
      "partiallyreleased",
    ].includes(key)
  ) {
    return "info";
  }
  return "warning";
};

const statusLabel = (status) => {
  const key = normalizeStatus(status);
  const map = {
    pending: "Pending",
    proposalsent: "Proposal Sent",
    accepted: "Accepted",
    inprogress: "In Progress",
    completed: "Completed",
    rejected: "Rejected",
    unpaid: "Unpaid",
    partiallypaid: "Partially Paid",
    paid: "Paid",
    pendingpayment: "Pending Payment",
    released: "Released",
    partiallyreleased: "Partially Released",
    notinitiated: "Not Initiated",
  };
  return map[key] || String(status || "Unknown");
};

const ConstructionDetailSkeleton = () => (
  <div className="customer360-skeleton">
    <div className="sk-line xl" />
    <div className="sk-line md" />
    <div className="sk-cards">
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <div key={item} className="sk-card" />
      ))}
    </div>
    {[1, 2, 3, 4].map((item) => (
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

const AdminConstructionProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { basePath } = useAdminAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fullData, setFullData] = useState(null);
  const [activeMiniNav, setActiveMiniNav] = useState("project-basic-info");

  const miniNavItems = [
    { id: "project-basic-info", label: "Basic Info" },
    { id: "proposal-milestones", label: "Proposal & Milestones" },
    { id: "payment-financial", label: "Payment" },
    { id: "updates-communication", label: "Updates" },
    { id: "customer-review", label: "Review" },
    { id: "timestamps-metadata", label: "Timestamps" },
  ];

  useEffect(() => {
    const fetchFullProject = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/admin/construction-projects/${id}/full`,
          {
            credentials: "include",
          },
        );
        const json = await response.json();
        if (!response.ok) {
          throw new Error(json.error || `Server ${response.status}`);
        }
        setFullData(json);
        setError(null);
      } catch (err) {
        setError(err.message || "Failed to load construction project detail");
      } finally {
        setLoading(false);
      }
    };

    fetchFullProject();
  }, [id]);

  const project = fullData?.project || null;
  const summary = fullData?.summary || {};
  const basicInfo = fullData?.basicInfo || {};
  const floorBreakdown = fullData?.floorBreakdown || [];
  const proposal = fullData?.proposal || {};
  const milestones = fullData?.milestones || [];
  const paymentSummary = fullData?.paymentSummary || {};
  const updates = fullData?.updates || [];
  const conversation = fullData?.conversation || [];
  const media = fullData?.media || { siteFiles: [], completionImages: [] };
  const customerReview = fullData?.customerReview || {};
  const timestamps = fullData?.timestamps || {};

  const customerRoute = summary.customerId
    ? `${basePath}/customer/${summary.customerId}`
    : null;
  const companyRoute = summary.companyId
    ? `${basePath}/company/${summary.companyId}`
    : null;

  if (loading) {
    return (
      <AdminLayout>
        <div className="customer360-page">
          <ConstructionDetailSkeleton />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="customer360-page">
          <div className="error-state">
            <h2>Unable to load project details</h2>
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

  if (!project) {
    return (
      <AdminLayout>
        <div className="customer360-page">
          <div className="error-state">
            <h2>Construction project not found</h2>
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
      <div className="customer360-page project360-page">
        <header className="customer360-header">
          <div>
            <h1>{summary.projectName || project.projectName || "Project"}</h1>
            <p>Project ID: {project._id}</p>
          </div>
          <div className="customer360-header-actions">
            {customerRoute && (
              <ActionButton
                label="View Customer"
                icon={Users}
                variant="secondary"
                onClick={() => navigate(customerRoute)}
              />
            )}
            {companyRoute && (
              <ActionButton
                label="View Company"
                icon={Building2}
                variant="secondary"
                onClick={() => navigate(companyRoute)}
              />
            )}
            <ActionButton
              label="Back to Data Management"
              icon={ArrowLeft}
              variant="primary"
              onClick={() => navigate(`${basePath}/data-management`)}
            />
          </div>
        </header>

        <div className="customer360-summary-grid project360-summary-grid">
          <article className="summary-card orange">
            <div className="summary-accent" />
            <Building2 size={18} />
            <div>
              <span>Project Name</span>
              <strong>{summary.projectName || "—"}</strong>
            </div>
          </article>

          <article
            className={`summary-card ${statusClass(summary.status) === "danger" ? "red" : statusClass(summary.status) === "warning" ? "orange" : "green"}`}
          >
            <div className="summary-accent" />
            <Shield size={18} />
            <div>
              <span>Status</span>
              <strong>{statusLabel(summary.status)}</strong>
            </div>
          </article>

          <article className="summary-card purple">
            <div className="summary-accent" />
            <Users size={18} />
            <div>
              <span>Customer</span>
              {customerRoute ? (
                <button
                  className="project-view-btn project360-inline-btn"
                  onClick={() => navigate(customerRoute)}
                >
                  {summary.customerName || "Unknown"}
                </button>
              ) : (
                <strong>{summary.customerName || "Unknown"}</strong>
              )}
            </div>
          </article>

          <article className="summary-card indigo">
            <div className="summary-accent" />
            <Building2 size={18} />
            <div>
              <span>Company</span>
              {companyRoute ? (
                <button
                  className="project-view-btn project360-inline-btn"
                  onClick={() => navigate(companyRoute)}
                >
                  {summary.companyName || "Not Assigned"}
                </button>
              ) : (
                <strong>{summary.companyName || "Not Assigned"}</strong>
              )}
            </div>
          </article>

          <article className="summary-card amber">
            <div className="summary-accent" />
            <BadgeIndianRupee size={18} />
            <div>
              <span>Total / Contract Amount</span>
              <strong>{formatCurrency(summary.contractAmount)}</strong>
            </div>
          </article>

          <article className="summary-card rose">
            <div className="summary-accent" />
            <CheckCircle2 size={18} />
            <div>
              <span>Platform Fee</span>
              <strong>
                {formatCurrency(summary.platformFee)}
                {summary.commissionRate ? ` (${summary.commissionRate}%)` : ""}
              </strong>
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

        {activeMiniNav === "project-basic-info" && (
          <section
            id="project-basic-info"
            className="customer360-section orange"
          >
            <SectionHeading
              id="project-basic-info-head"
              title="Project Basic Information"
              icon={FileText}
              accent="orange"
            />

            <div className="customer360-card">
              <div className="personal-grid two-col">
                <div>
                  <span>Project Name</span>
                  <strong>{summary.projectName || "—"}</strong>
                </div>
                <div>
                  <span>Building Type</span>
                  <strong>{basicInfo.buildingType || "—"}</strong>
                </div>
                <div>
                  <span>Total Area</span>
                  <strong>
                    {Number(basicInfo.totalArea || 0).toLocaleString("en-IN")}{" "}
                    sq ft
                  </strong>
                </div>
                <div>
                  <span>Number of Floors</span>
                  <strong>{basicInfo.totalFloors || "—"}</strong>
                </div>
                <div>
                  <span>Project Address</span>
                  <strong>{basicInfo.projectAddress || "—"}</strong>
                </div>
                <div>
                  <span>Pincode / Location</span>
                  <strong>{basicInfo.projectLocationPincode || "—"}</strong>
                </div>
                <div>
                  <span>Estimated Budget</span>
                  <strong>{formatCurrency(basicInfo.estimatedBudget)}</strong>
                </div>
                <div>
                  <span>Project Timeline</span>
                  <strong>
                    {basicInfo.projectTimeline
                      ? `${basicInfo.projectTimeline} months`
                      : "—"}
                  </strong>
                </div>
                <div>
                  <span>Special Requirements</span>
                  <strong>{basicInfo.specialRequirements || "—"}</strong>
                </div>
                <div>
                  <span>Accessibility Needs</span>
                  <strong>{basicInfo.accessibilityNeeds || "none"}</strong>
                </div>
                <div>
                  <span>Energy Efficiency Target</span>
                  <strong>{basicInfo.energyEfficiency || "standard"}</strong>
                </div>
                <div>
                  <span>Target Completion Date</span>
                  <strong>{formatDate(basicInfo.targetCompletionDate)}</strong>
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <div className="progress-label">
                  <span>Project Progress</span>
                  <strong>
                    {Math.min(
                      100,
                      Math.max(0, Number(basicInfo.completionPercentage || 0)),
                    )}
                    %
                  </strong>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          0,
                          Number(basicInfo.completionPercentage || 0),
                        ),
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {floorBreakdown.length > 0 && (
              <div className="customer360-card">
                <h3>
                  <Layers size={16} /> Floors Breakdown
                </h3>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Floor #</th>
                        <th>Type</th>
                        <th>Area</th>
                        <th>Description</th>
                        <th>Image</th>
                      </tr>
                    </thead>
                    <tbody>
                      {floorBreakdown.map((floor) => (
                        <tr key={floor._id}>
                          <td>{floor.floorNumber}</td>
                          <td>{floor.floorType || "—"}</td>
                          <td>
                            {Number(floor.floorArea || 0).toLocaleString(
                              "en-IN",
                            )}{" "}
                            sq ft
                          </td>
                          <td>{floor.floorDescription || "—"}</td>
                          <td>
                            {floor.floorImagePath ? (
                              <a
                                href={floor.floorImagePath}
                                target="_blank"
                                rel="noreferrer"
                                className="project360-file-link"
                              >
                                View
                              </a>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="customer360-card">
              <h3>
                <MapPin size={16} /> Site Files & Completion Images
              </h3>
              <div className="project360-media-grid">
                {(media.siteFiles || []).map((file, index) => (
                  <a
                    key={`${file}-${index}`}
                    href={file}
                    target="_blank"
                    rel="noreferrer"
                    className="project360-media-link"
                  >
                    Site File {index + 1}
                  </a>
                ))}
                {(media.completionImages || []).map((image, index) => (
                  <a
                    key={`${image}-${index}`}
                    href={image}
                    target="_blank"
                    rel="noreferrer"
                    className="project360-media-link success"
                  >
                    Completion Image {index + 1}
                  </a>
                ))}
                {(media.siteFiles || []).length === 0 &&
                  (media.completionImages || []).length === 0 &&
                  "No media files uploaded"}
              </div>
            </div>
          </section>
        )}

        {activeMiniNav === "proposal-milestones" && (
          <section
            id="proposal-milestones"
            className="customer360-section green"
          >
            <SectionHeading
              id="proposal-milestones-head"
              title="Proposal & Phases / Milestones"
              icon={Layers}
              accent="green"
            />

            <div className="customer360-card">
              <h3>
                <BadgeIndianRupee size={16} /> Proposal Details
              </h3>
              {proposal.price ||
              proposal.description ||
              (proposal.phases || []).length ? (
                <>
                  <div className="personal-grid two-col">
                    <div>
                      <span>Proposed Price</span>
                      <strong>{formatCurrency(proposal.price)}</strong>
                    </div>
                    <div>
                      <span>Sent At</span>
                      <strong>{formatDateTime(proposal.sentAt)}</strong>
                    </div>
                    <div className="project360-wide-field">
                      <span>Description</span>
                      <strong>{proposal.description || "—"}</strong>
                    </div>
                  </div>

                  {(proposal.phases || []).length > 0 && (
                    <div className="table-wrap" style={{ marginTop: 12 }}>
                      <table>
                        <thead>
                          <tr>
                            <th>Phase Name</th>
                            <th>%</th>
                            <th>Required Months</th>
                            <th>Amount</th>
                            <th>Subdivisions</th>
                            <th>Payment Schedule</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(proposal.phases || []).map((phase) => (
                            <tr key={phase._id}>
                              <td>{phase.name || "—"}</td>
                              <td>
                                {phase.percentage
                                  ? `${phase.percentage}%`
                                  : "—"}
                              </td>
                              <td>{phase.requiredMonths || "—"}</td>
                              <td>{formatCurrency(phase.amount)}</td>
                              <td>
                                {(phase.subdivisions || []).length
                                  ? (phase.subdivisions || [])
                                      .map(
                                        (subdivision) =>
                                          `${subdivision.category || "Item"}: ${subdivision.description || "—"}`,
                                      )
                                      .join(" | ")
                                  : "—"}
                              </td>
                              <td>
                                Upfront{" "}
                                {phase.paymentSchedule?.upfrontPercentage || 0}%
                                · Completion{" "}
                                {phase.paymentSchedule?.completionPercentage ||
                                  0}
                                % · Final{" "}
                                {phase.paymentSchedule?.finalPercentage || 0}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-state">
                  No proposal details available.
                </div>
              )}
            </div>

            <div className="customer360-card">
              <h3>
                <Layers size={16} /> Milestones
              </h3>
              {milestones.length === 0 ? (
                <div className="empty-state">No milestones available.</div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>%</th>
                        <th>Phase Name</th>
                        <th>Company Message</th>
                        <th>Status</th>
                        <th>Dates</th>
                        <th>Feedback / Revision</th>
                        <th>Flags</th>
                      </tr>
                    </thead>
                    <tbody>
                      {milestones.map((milestone) => (
                        <tr key={milestone._id}>
                          <td>
                            {milestone.percentage
                              ? `${milestone.percentage}%`
                              : "—"}
                          </td>
                          <td>{milestone.phaseName || "—"}</td>
                          <td>{milestone.companyMessage || "—"}</td>
                          <td>
                            <span
                              className={`status-pill ${milestone.needsRevision ? "danger" : milestone.isApprovedByCustomer ? "success" : "warning"}`}
                            >
                              {milestone.needsRevision
                                ? "Revision Requested"
                                : milestone.isApprovedByCustomer
                                  ? "Approved"
                                  : "Pending"}
                            </span>
                          </td>
                          <td>
                            Submitted: {formatDateTime(milestone.submittedAt)}
                            <br />
                            Approved: {formatDateTime(milestone.approvedAt)}
                          </td>
                          <td>{milestone.customerFeedback || "—"}</td>
                          <td>
                            Checkpoint: {milestone.isCheckpoint ? "Yes" : "No"}
                            <br />
                            Needs Revision:{" "}
                            {milestone.needsRevision ? "Yes" : "No"}
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

        {activeMiniNav === "payment-financial" && (
          <section id="payment-financial" className="customer360-section green">
            <SectionHeading
              id="payment-financial-head"
              title="Payment & Payout Details"
              icon={Shield}
              accent="green"
            />

            <div className="project360-payment-grid">
              <article className="summary-card blue">
                <div className="summary-accent" />
                <BadgeIndianRupee size={18} />
                <div>
                  <span>Total Project Amount</span>
                  <strong>{formatCurrency(paymentSummary.totalAmount)}</strong>
                </div>
              </article>
              <article className="summary-card rose">
                <div className="summary-accent" />
                <CheckCircle2 size={18} />
                <div>
                  <span>Platform Fee</span>
                  <strong>{formatCurrency(paymentSummary.platformFee)}</strong>
                </div>
              </article>
              <article className="summary-card emerald">
                <div className="summary-accent" />
                <Building2 size={18} />
                <div>
                  <span>Paid to Company</span>
                  <strong>
                    {formatCurrency(paymentSummary.amountPaidToCompany)}
                  </strong>
                </div>
              </article>
              <article className="summary-card orange">
                <div className="summary-accent" />
                <Shield size={18} />
                <div>
                  <span>Payment Status</span>
                  <strong>{statusLabel(paymentSummary.paymentStatus)}</strong>
                </div>
              </article>
            </div>

            <div className="customer360-card">
              <h3>
                <Clock size={16} /> Milestone / Phase Payments
              </h3>
              {(paymentSummary.milestonePayments || []).length === 0 ? (
                <div className="empty-state">No milestone payment entries.</div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>%</th>
                        <th>Phase</th>
                        <th>Amount</th>
                        <th>Platform Fee</th>
                        <th>Company Payout</th>
                        <th>Status</th>
                        <th>Bill</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(paymentSummary.milestonePayments || []).map((entry) => (
                        <tr key={entry._id}>
                          <td>
                            {entry.milestonePercentage
                              ? `${entry.milestonePercentage}%`
                              : "—"}
                          </td>
                          <td>{entry.phaseName || "—"}</td>
                          <td>{formatCurrency(entry.amount)}</td>
                          <td>{formatCurrency(entry.platformFee)}</td>
                          <td>{formatCurrency(entry.companyPayout)}</td>
                          <td>
                            <span
                              className={`status-pill ${statusClass(entry.status)}`}
                            >
                              {statusLabel(entry.status)}
                            </span>
                          </td>
                          <td>
                            {entry.billUrl ? (
                              <a
                                href={entry.billUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="project360-file-link"
                              >
                                Bill
                              </a>
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

            <div className="customer360-card">
              <h3>
                <CheckCircle2 size={16} /> Payouts Released
              </h3>
              {(paymentSummary.releasedPayouts || []).length === 0 ? (
                <div className="empty-state">No released payouts yet.</div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Phase</th>
                        <th>Milestone %</th>
                        <th>Amount</th>
                        <th>Released On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(paymentSummary.releasedPayouts || []).map((entry) => (
                        <tr key={entry._id}>
                          <td>{entry.phaseName || "—"}</td>
                          <td>
                            {entry.milestonePercentage
                              ? `${entry.milestonePercentage}%`
                              : "—"}
                          </td>
                          <td>{formatCurrency(entry.amount)}</td>
                          <td>{formatDateTime(entry.releaseDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="customer360-card">
              <h3>
                <FileText size={16} /> Transaction References
              </h3>
              <div className="personal-grid two-col">
                <div>
                  <span>Stripe Session ID</span>
                  <strong>{paymentSummary.stripeSessionId || "—"}</strong>
                </div>
                <div>
                  <span>Stripe Payment Intent ID</span>
                  <strong>{paymentSummary.stripePaymentIntentId || "—"}</strong>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeMiniNav === "updates-communication" && (
          <section
            id="updates-communication"
            className="customer360-section purple"
          >
            <SectionHeading
              id="updates-communication-head"
              title="Project Updates & Communication"
              icon={Zap}
              accent="purple"
            />

            <div className="customer360-card">
              <h3>
                <FileText size={16} /> Recent Updates
              </h3>
              {updates.length === 0 ? (
                <div className="empty-state">No updates posted yet.</div>
              ) : (
                <div className="project-grid project360-update-grid">
                  {updates.map((update) => (
                    <article
                      key={update._id}
                      className="project-card project360-update-card"
                    >
                      <div className="project-head">
                        <h4>Project Update</h4>
                        <span className="amount-pill">
                          {formatDate(update.createdAt)}
                        </span>
                      </div>
                      <p className="project-partner">
                        {update.updateText || "—"}
                      </p>
                      {update.updateImagePath ? (
                        <a
                          href={update.updateImagePath}
                          target="_blank"
                          rel="noreferrer"
                          className="project360-file-link"
                        >
                          View Update Image
                        </a>
                      ) : (
                        <span className="project360-muted">No image</span>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </div>

            <div className="customer360-card">
              <h3>
                <Users size={16} /> Conversation Entries
              </h3>
              {conversation.length === 0 ? (
                <div className="empty-state">
                  No conversation entries found.
                </div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Sender</th>
                        <th>Message</th>
                        <th>Timestamp</th>
                        <th>Viewed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {conversation.map((entry) => (
                        <tr key={entry._id}>
                          <td>{entry.sender || "—"}</td>
                          <td>{entry.message || "—"}</td>
                          <td>{formatDateTime(entry.timestamp)}</td>
                          <td>
                            {entry.sender === "company"
                              ? entry.viewedByCustomer
                                ? "Viewed"
                                : "Not Viewed"
                              : entry.viewedByCompany
                                ? "Viewed"
                                : "Not Viewed"}
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

        {activeMiniNav === "customer-review" && (
          <section id="customer-review" className="customer360-section purple">
            <SectionHeading
              id="customer-review-head"
              title="Customer Review"
              icon={Star}
              accent="purple"
            />
            {!customerReview?.rating ? (
              <div className="empty-state">No review submitted yet</div>
            ) : (
              <div className="review-grid">
                <article className="review-card">
                  <div className="review-head">
                    <h4>Customer Review</h4>
                    <span>
                      ⭐ {Number(customerReview.rating || 0).toFixed(1)}
                    </span>
                  </div>
                  <p className="review-comment">
                    {customerReview.reviewText || "No review text"}
                  </p>
                  <small>
                    Reviewed On: {formatDate(customerReview.reviewDate)}
                  </small>
                </article>
              </div>
            )}
          </section>
        )}

        {activeMiniNav === "timestamps-metadata" && (
          <section
            id="timestamps-metadata"
            className="customer360-section orange"
          >
            <SectionHeading
              id="timestamps-metadata-head"
              title="Timestamps & Metadata"
              icon={Calendar}
              accent="orange"
            />
            <div className="customer360-card">
              <div className="personal-grid two-col">
                <div>
                  <span>Created At</span>
                  <strong>{formatDateTime(timestamps.createdAt)}</strong>
                </div>
                <div>
                  <span>Last Updated</span>
                  <strong>{formatDateTime(timestamps.updatedAt)}</strong>
                </div>
                <div>
                  <span>Current Phase</span>
                  <strong>{basicInfo.currentPhase || "—"}</strong>
                </div>
                <div>
                  <span>Completion Percentage</span>
                  <strong>
                    {Number(basicInfo.completionPercentage || 0)}%
                  </strong>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminConstructionProjectDetail;
