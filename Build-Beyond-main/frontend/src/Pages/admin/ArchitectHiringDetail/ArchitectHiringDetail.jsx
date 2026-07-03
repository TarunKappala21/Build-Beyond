import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeIndianRupee,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  FileText,
  Home,
  Layers,
  Mail,
  MapPin,
  Phone,
  Shield,
  Star,
  User,
  Users,
} from "lucide-react";
import AdminLayout from "../../../components/admin/AdminLayout";
import { ActionButton } from "../../../components/admin/AdminUIComponents";
import { useAdminAuth } from "../../../context/AdminAuthContext";
import "../AdminCustomerDetail/AdminCustomerDetail.css";
import "./ArchitectHiringDetail.css";

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
  if (
    ["accepted", "completed", "approved", "released", "verified"].includes(key)
  ) {
    return "success";
  }
  if (["rejected", "cancelled", "denied", "failed"].includes(key)) {
    return "danger";
  }
  if (
    ["proposalsent", "inprogress", "underreview", "partiallyreleased"].includes(
      key,
    )
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
    pendingpayment: "Pending Payment",
    accepted: "Accepted",
    rejected: "Rejected",
    completed: "Completed",
    inprogress: "In Progress",
    approved: "Approved",
    revisionrequested: "Revision Requested",
    underreview: "Under Review",
    held: "Held",
    notinitiated: "Not Initiated",
    partiallyreleased: "Partially Released",
    fullyreleased: "Fully Released",
    released: "Released",
    withdrawn: "Withdrawn",
  };
  return map[key] || String(status || "Unknown");
};

const ArchitectDetailSkeleton = () => (
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

const ArchitectHiringDetail = () => {
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
    { id: "payment-escrow", label: "Payment & Escrow" },
    { id: "updates-communication", label: "Updates" },
    { id: "reviews-ratings", label: "Reviews" },
  ];

  useEffect(() => {
    const fetchFullProject = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/admin/architect-hirings/${id}/full`,
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
        setError(err.message || "Failed to load architect hiring detail");
      } finally {
        setLoading(false);
      }
    };

    fetchFullProject();
  }, [id]);

  const hiring = fullData?.hiring || null;
  const summary = fullData?.summary || {};
  const proposal = fullData?.proposal || {};
  const milestones = fullData?.milestones || [];
  const paymentSummary = fullData?.paymentSummary || {};
  const projectUpdates = fullData?.projectUpdates || [];
  const review = fullData?.review || {};
  const references = fullData?.references || [];
  const timestamps = fullData?.timestamps || {};

  const floorRequirements = useMemo(() => {
    return Array.isArray(hiring?.designRequirements?.floorRequirements)
      ? hiring.designRequirements.floorRequirements
      : [];
  }, [hiring]);

  const customerRoute = summary.customerId
    ? `${basePath}/customer/${summary.customerId}`
    : null;

  const architectRoute = summary.architectId
    ? `${basePath}/worker/${summary.architectId}`
    : null;

  if (loading) {
    return (
      <AdminLayout>
        <div className="customer360-page">
          <ArchitectDetailSkeleton />
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

  if (!hiring) {
    return (
      <AdminLayout>
        <div className="customer360-page">
          <div className="error-state">
            <h2>Architect hiring project not found</h2>
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
      <div className="customer360-page architect360-page">
        <header className="customer360-header">
          <div>
            <h1>{hiring.projectName || "Architect Hiring Project"}</h1>
            <p>Project ID: {hiring._id}</p>
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
            {architectRoute && (
              <ActionButton
                label="View Architect"
                icon={User}
                variant="secondary"
                onClick={() => navigate(architectRoute)}
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

        <div className="customer360-summary-grid architect360-summary-grid">
          <article className="summary-card blue">
            <div className="summary-accent" />
            <Home size={18} />
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
                  className="project-view-btn architect360-inline-btn"
                  onClick={() => navigate(customerRoute)}
                >
                  {summary.customerName || "Unknown"}
                </button>
              ) : (
                <strong>{summary.customerName || "Unknown"}</strong>
              )}
            </div>
          </article>

          <article className="summary-card emerald">
            <div className="summary-accent" />
            <User size={18} />
            <div>
              <span>Architect</span>
              {architectRoute ? (
                <button
                  className="project-view-btn architect360-inline-btn"
                  onClick={() => navigate(architectRoute)}
                >
                  {summary.architectName || "Not Assigned"}
                </button>
              ) : (
                <strong>{summary.architectName || "Not Assigned"}</strong>
              )}
            </div>
          </article>

          <article className="summary-card orange">
            <div className="summary-accent" />
            <BadgeIndianRupee size={18} />
            <div>
              <span>Total / Final Amount</span>
              <strong>{formatCurrency(summary.finalAmount)}</strong>
            </div>
          </article>

          <article className="summary-card rose">
            <div className="summary-accent" />
            <CheckCircle2 size={18} />
            <div>
              <span>Platform Commission</span>
              <strong>
                {formatCurrency(summary.platformCommission)}
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
          <section id="project-basic-info" className="customer360-section blue">
            <SectionHeading
              id="project-basic-info-head"
              title="Project Basic Information"
              icon={FileText}
              accent="blue"
            />

            <div className="customer360-card">
              <div className="personal-grid two-col">
                <div>
                  <span>Project Name</span>
                  <strong>{hiring.projectName || "—"}</strong>
                </div>
                <div>
                  <span>Design Type</span>
                  <strong>
                    {hiring.designRequirements?.designType || "—"}
                  </strong>
                </div>
                <div>
                  <span>Architectural Style</span>
                  <strong>
                    {hiring.designRequirements?.architecturalStyle || "—"}
                  </strong>
                </div>
                <div>
                  <span>Number of Floors</span>
                  <strong>{hiring.designRequirements?.numFloors || "—"}</strong>
                </div>
                <div>
                  <span>Plot Location</span>
                  <strong>{hiring.plotInformation?.plotLocation || "—"}</strong>
                </div>
                <div>
                  <span>Plot Size</span>
                  <strong>{hiring.plotInformation?.plotSize || "—"}</strong>
                </div>
                <div>
                  <span>Plot Orientation</span>
                  <strong>
                    {hiring.plotInformation?.plotOrientation || "—"}
                  </strong>
                </div>
                <div>
                  <span>Budget Range</span>
                  <strong>{hiring.additionalDetails?.budget || "—"}</strong>
                </div>
                <div>
                  <span>Expected Completion Date</span>
                  <strong>
                    {formatDate(hiring.additionalDetails?.completionDate)}
                  </strong>
                </div>
                <div>
                  <span>Customer Contact</span>
                  <strong>
                    {hiring.customerDetails?.contactNumber ||
                      hiring.customer?.phone ||
                      "—"}
                    {" · "}
                    {hiring.customerDetails?.email ||
                      hiring.customer?.email ||
                      "—"}
                  </strong>
                </div>
              </div>
            </div>

            <div className="customer360-card">
              <h3>
                <MapPin size={16} /> Customer Address
              </h3>
              <div className="personal-grid two-col">
                <div>
                  <span>Street</span>
                  <strong>
                    {hiring.customerAddress?.streetAddress || "—"}
                  </strong>
                </div>
                <div>
                  <span>City</span>
                  <strong>{hiring.customerAddress?.city || "—"}</strong>
                </div>
                <div>
                  <span>State</span>
                  <strong>{hiring.customerAddress?.state || "—"}</strong>
                </div>
                <div>
                  <span>Zip</span>
                  <strong>{hiring.customerAddress?.zipCode || "—"}</strong>
                </div>
              </div>
            </div>

            <div className="customer360-card">
              <h3>
                <Compass size={16} /> Design Requirements Details
              </h3>
              <div className="personal-grid two-col">
                <div className="architect360-wide-field">
                  <span>Special Features</span>
                  <strong>
                    {hiring.designRequirements?.specialFeatures || "—"}
                  </strong>
                </div>
              </div>
              {floorRequirements.length > 0 && (
                <div className="table-wrap" style={{ marginTop: 12 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Floor Number</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {floorRequirements.map((floor, index) => (
                        <tr key={floor._id || `${floor.floorNumber}-${index}`}>
                          <td>{floor.floorNumber ?? index + 1}</td>
                          <td>{floor.details || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {references.length > 0 && (
              <div className="customer360-card">
                <h3>
                  <FileText size={16} /> Reference Files
                </h3>
                <div className="architect360-file-grid">
                  {references.map((item, index) => (
                    <a
                      key={item.url || `${index}`}
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="architect360-file-link"
                    >
                      {item.originalName || `Reference ${index + 1}`}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="customer360-card">
              <h3>
                <Calendar size={16} /> Timestamps & Metadata
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
                <div>
                  <span>Customer Name</span>
                  <strong>{summary.customerName || "—"}</strong>
                </div>
                <div>
                  <span>Architect Name</span>
                  <strong>{summary.architectName || "Not Assigned"}</strong>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeMiniNav === "proposal-milestones" && (
          <section
            id="proposal-milestones"
            className="customer360-section blue"
          >
            <SectionHeading
              id="proposal-milestones-head"
              title="Proposal & Milestones"
              icon={Layers}
              accent="blue"
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
                      <span>Proposal Sent At</span>
                      <strong>{formatDateTime(proposal.sentAt)}</strong>
                    </div>
                    <div className="architect360-wide-field">
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
                            <th>Percentage</th>
                            <th>Required Months</th>
                            <th>Amount</th>
                            <th>Subdivisions</th>
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
                                {(phase.subdivisions || []).length === 0
                                  ? "—"
                                  : (phase.subdivisions || [])
                                      .map(
                                        (subdivision) =>
                                          `${subdivision.category || "Item"}: ${subdivision.description || "—"}`,
                                      )
                                      .join(" | ")}
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
                        <th>Description</th>
                        <th>Status</th>
                        <th>Image</th>
                        <th>Dates</th>
                        <th>Notes</th>
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
                          <td>{milestone.description || "—"}</td>
                          <td>
                            <span
                              className={`status-pill ${statusClass(milestone.status)}`}
                            >
                              {statusLabel(milestone.status)}
                            </span>
                          </td>
                          <td>
                            {milestone.image ? (
                              <a
                                href={milestone.image}
                                target="_blank"
                                rel="noreferrer"
                                className="architect360-file-link"
                              >
                                View Image
                              </a>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td>
                            Submitted: {formatDateTime(milestone.submittedAt)}
                            <br />
                            Approved: {formatDateTime(milestone.approvedAt)}
                            <br />
                            Rejected: {formatDateTime(milestone.rejectedAt)}
                          </td>
                          <td>
                            {milestone.rejectionReason && (
                              <p className="architect360-note">
                                Rejection: {milestone.rejectionReason}
                              </p>
                            )}
                            {milestone.revisionNotes && (
                              <p className="architect360-note">
                                Revision: {milestone.revisionNotes}
                              </p>
                            )}
                            {milestone.adminReport && (
                              <p className="architect360-note">
                                Admin Report: {milestone.adminReport}
                              </p>
                            )}
                            {milestone.adminReviewNotes && (
                              <p className="architect360-note">
                                Admin Notes: {milestone.adminReviewNotes}
                              </p>
                            )}
                            {!milestone.rejectionReason &&
                              !milestone.revisionNotes &&
                              !milestone.adminReport &&
                              !milestone.adminReviewNotes &&
                              "—"}
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

        {activeMiniNav === "payment-escrow" && (
          <section id="payment-escrow" className="customer360-section green">
            <SectionHeading
              id="payment-escrow-head"
              title="Payment & Escrow Details"
              icon={Shield}
              accent="green"
            />

            <div className="architect360-payment-grid">
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
                  <span>Platform Commission</span>
                  <strong>
                    {formatCurrency(paymentSummary.platformCommission)}
                    {summary.commissionRate
                      ? ` (${summary.commissionRate}%)`
                      : ""}
                  </strong>
                </div>
              </article>
              <article className="summary-card emerald">
                <div className="summary-accent" />
                <User size={18} />
                <div>
                  <span>Worker Share</span>
                  <strong>{formatCurrency(paymentSummary.workerAmount)}</strong>
                </div>
              </article>
              <article className="summary-card orange">
                <div className="summary-accent" />
                <Shield size={18} />
                <div>
                  <span>Escrow Status</span>
                  <strong>{statusLabel(paymentSummary.escrowStatus)}</strong>
                </div>
              </article>
            </div>

            <div className="customer360-card">
              <h3>
                <Clock size={16} /> Milestone Payments Breakdown
              </h3>
              {(paymentSummary.milestonePayments || []).length === 0 ? (
                <div className="empty-state">
                  No milestone payment breakdown available.
                </div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>%</th>
                        <th>Amount</th>
                        <th>Platform Fee</th>
                        <th>Worker Payout</th>
                        <th>Collected?</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(paymentSummary.milestonePayments || []).map(
                        (payment) => (
                          <tr key={payment._id}>
                            <td>
                              {payment.percentage
                                ? `${payment.percentage}%`
                                : "—"}
                            </td>
                            <td>{formatCurrency(payment.amount)}</td>
                            <td>{formatCurrency(payment.platformFee)}</td>
                            <td>{formatCurrency(payment.workerPayout)}</td>
                            <td>{payment.paymentCollected ? "Yes" : "No"}</td>
                            <td>
                              <span
                                className={`status-pill ${statusClass(payment.status)}`}
                              >
                                {statusLabel(payment.status)}
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

            <div className="customer360-card">
              <h3>
                <FileText size={16} /> Payment Metadata
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
                <div>
                  <span>Payment Initiated At</span>
                  <strong>
                    {formatDateTime(paymentSummary.paymentInitiatedAt)}
                  </strong>
                </div>
                <div>
                  <span>Last Payment Collected At</span>
                  <strong>
                    {formatDateTime(paymentSummary.lastPaymentCollectedAt)}
                  </strong>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeMiniNav === "updates-communication" && (
          <section
            id="updates-communication"
            className="customer360-section green"
          >
            <SectionHeading
              id="updates-communication-head"
              title="Project Updates & Milestones Submissions"
              icon={FileText}
              accent="green"
            />
            {projectUpdates.length === 0 ? (
              <div className="empty-state">No project updates yet.</div>
            ) : (
              <div className="project-grid architect360-update-grid">
                {projectUpdates.map((update) => (
                  <article
                    key={update._id}
                    className="project-card architect360-update-card"
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
                    {update.updateImage ? (
                      <a
                        href={update.updateImage}
                        target="_blank"
                        rel="noreferrer"
                        className="architect360-image-link"
                      >
                        <img
                          src={update.updateImage}
                          alt="Project update"
                          className="architect360-update-image"
                        />
                      </a>
                    ) : (
                      <div className="architect360-image-placeholder">
                        No image
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {activeMiniNav === "reviews-ratings" && (
          <section id="reviews-ratings" className="customer360-section purple">
            <SectionHeading
              id="reviews-ratings-head"
              title="Reviews & Ratings"
              icon={Star}
              accent="purple"
            />
            {!review?.customerToWorker?.rating &&
            !review?.workerToCustomer?.rating ? (
              <div className="empty-state">
                Review pending / Not yet completed
              </div>
            ) : (
              <div className="review-grid">
                <article className="review-card">
                  <div className="review-head">
                    <h4>Customer to Worker</h4>
                    <span>
                      ⭐{" "}
                      {Number(review?.customerToWorker?.rating || 0).toFixed(1)}
                    </span>
                  </div>
                  <p className="review-comment">
                    {review?.customerToWorker?.comment || "No comment"}
                  </p>
                  <small>
                    Submitted On:{" "}
                    {formatDate(review?.customerToWorker?.submittedAt)}
                  </small>
                </article>
                <article className="review-card">
                  <div className="review-head">
                    <h4>Worker to Customer</h4>
                    <span>
                      ⭐{" "}
                      {Number(review?.workerToCustomer?.rating || 0).toFixed(1)}
                    </span>
                  </div>
                  <p className="review-comment">
                    {review?.workerToCustomer?.comment || "No comment"}
                  </p>
                  <small>
                    Submitted On:{" "}
                    {formatDate(review?.workerToCustomer?.submittedAt)}
                  </small>
                </article>
              </div>
            )}
          </section>
        )}
      </div>
    </AdminLayout>
  );
};

export default ArchitectHiringDetail;
