import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeIndianRupee,
  Building2,
  Calendar,
  CheckCircle2,
  FileText,
  Home,
  Layers,
  MapPin,
  Shield,
  Users,
} from "lucide-react";
import AdminLayout from "../../../components/admin/AdminLayout";
import { ActionButton } from "../../../components/admin/AdminUIComponents";
import { useAdminAuth } from "../../../context/AdminAuthContext";
import "../AdminCustomerDetail/AdminCustomerDetail.css";
import "./AdminBidDetail.css";

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
  if (["awarded", "accepted", "completed", "paid"].includes(key)) {
    return "success";
  }
  if (["rejected", "cancelled", "closed"].includes(key)) {
    return "danger";
  }
  if (["partiallypaid", "inprogress"].includes(key)) {
    return "info";
  }
  return "warning";
};

const statusLabel = (status) => {
  const key = normalizeStatus(status);
  const map = {
    open: "Open",
    closed: "Closed",
    awarded: "Awarded",
    cancelled: "Cancelled",
    pending: "Pending",
    accepted: "Accepted",
    rejected: "Rejected",
    unpaid: "Unpaid",
    paid: "Paid",
    partiallypaid: "Partially Paid",
    completed: "Completed",
  };
  return map[key] || String(status || "Unknown");
};

const BidDetailSkeleton = () => (
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

const AdminBidDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { basePath } = useAdminAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bid, setBid] = useState(null);
  const [activeMiniNav, setActiveMiniNav] = useState("project-basic-info");

  const miniNavItems = [
    { id: "project-basic-info", label: "Basic Info" },
    { id: "floors", label: "Floor Details" },
    { id: "company-bids", label: "Company Bids" },
    { id: "timestamps", label: "Timestamps" },
  ];

  useEffect(() => {
    const fetchBid = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/bid/${id}`, {
          credentials: "include",
        });
        const json = await response.json();
        if (!response.ok) {
          throw new Error(json.error || `Server ${response.status}`);
        }
        setBid(json.bid || null);
        setError(null);
      } catch (err) {
        setError(err.message || "Failed to load bid detail");
      } finally {
        setLoading(false);
      }
    };

    fetchBid();
  }, [id]);

  const customerRoute = bid?.customerId?._id
    ? `${basePath}/customer/${bid.customerId._id}`
    : null;

  const getCompanyRoute = (companyBid) =>
    companyBid?.companyId?._id
      ? `${basePath}/company/${companyBid.companyId._id}`
      : null;

  const winningBid = useMemo(() => {
    if (!bid?.winningBidId || !Array.isArray(bid?.companyBids)) return null;
    return (
      bid.companyBids.find(
        (entry) => String(entry?._id) === String(bid.winningBidId),
      ) || null
    );
  }, [bid]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="customer360-page">
          <BidDetailSkeleton />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="customer360-page">
          <div className="error-state">
            <h2>Unable to load bid details</h2>
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

  if (!bid) {
    return (
      <AdminLayout>
        <div className="customer360-page">
          <div className="error-state">
            <h2>Bid not found</h2>
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
      <div className="customer360-page bid360-page">
        <header className="customer360-header">
          <div>
            <h1>{bid.projectName || "Bid Detail"}</h1>
            <p>Bid ID: {bid._id}</p>
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

        <div className="customer360-summary-grid bid360-summary-grid">
          <article className="summary-card blue">
            <div className="summary-accent" />
            <Home size={18} />
            <div>
              <span>Project</span>
              <strong>{bid.projectName || "—"}</strong>
            </div>
          </article>

          <article
            className={`summary-card ${statusClass(bid.status) === "danger" ? "red" : statusClass(bid.status) === "warning" ? "orange" : "green"}`}
          >
            <div className="summary-accent" />
            <Shield size={18} />
            <div>
              <span>Status</span>
              <strong>{statusLabel(bid.status)}</strong>
            </div>
          </article>

          <article className="summary-card purple">
            <div className="summary-accent" />
            <Users size={18} />
            <div>
              <span>Customer</span>
              {customerRoute ? (
                <button
                  className="project-view-btn bid360-inline-btn"
                  onClick={() => navigate(customerRoute)}
                >
                  {bid.customerName || bid.customerId?.name || "Unknown"}
                </button>
              ) : (
                <strong>
                  {bid.customerName || bid.customerId?.name || "Unknown"}
                </strong>
              )}
            </div>
          </article>

          <article className="summary-card emerald">
            <div className="summary-accent" />
            <Building2 size={18} />
            <div>
              <span>Winning Company</span>
              {winningBid && getCompanyRoute(winningBid) ? (
                <button
                  className="project-view-btn bid360-inline-btn"
                  onClick={() => navigate(getCompanyRoute(winningBid))}
                >
                  {winningBid.companyName ||
                    winningBid.companyId?.companyName ||
                    "Not Awarded"}
                </button>
              ) : (
                <strong>
                  {winningBid?.companyName ||
                    winningBid?.companyId?.companyName ||
                    "Not Awarded"}
                </strong>
              )}
            </div>
          </article>

          <article className="summary-card orange">
            <div className="summary-accent" />
            <BadgeIndianRupee size={18} />
            <div>
              <span>Estimated Budget</span>
              <strong>{formatCurrency(bid.estimatedBudget)}</strong>
            </div>
          </article>

          <article className="summary-card rose">
            <div className="summary-accent" />
            <CheckCircle2 size={18} />
            <div>
              <span>Total Bids</span>
              <strong>
                {Array.isArray(bid.companyBids) ? bid.companyBids.length : 0}
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
                  <strong>{bid.projectName || "—"}</strong>
                </div>
                <div>
                  <span>Building Type</span>
                  <strong>{bid.buildingType || "—"}</strong>
                </div>
                <div>
                  <span>Total Area</span>
                  <strong>
                    {Number(bid.totalArea || 0).toLocaleString("en-IN")} sq ft
                  </strong>
                </div>
                <div>
                  <span>Total Floors</span>
                  <strong>{bid.totalFloors || "—"}</strong>
                </div>
                <div>
                  <span>Estimated Budget</span>
                  <strong>{formatCurrency(bid.estimatedBudget)}</strong>
                </div>
                <div>
                  <span>Timeline</span>
                  <strong>
                    {bid.projectTimeline
                      ? `${bid.projectTimeline} months`
                      : "—"}
                  </strong>
                </div>
                <div>
                  <span>Energy Efficiency</span>
                  <strong>{bid.energyEfficiency || "standard"}</strong>
                </div>
                <div>
                  <span>Accessibility Needs</span>
                  <strong>{bid.accessibilityNeeds || "none"}</strong>
                </div>
                <div className="bid360-wide-field">
                  <span>Special Requirements</span>
                  <strong>{bid.specialRequirements || "—"}</strong>
                </div>
              </div>
            </div>

            <div className="customer360-card">
              <h3>
                <MapPin size={16} /> Customer & Site Details
              </h3>
              <div className="personal-grid two-col">
                <div>
                  <span>Customer Name</span>
                  {customerRoute ? (
                    <button
                      className="project-view-btn bid360-inline-btn"
                      onClick={() => navigate(customerRoute)}
                    >
                      {bid.customerName || bid.customerId?.name || "—"}
                    </button>
                  ) : (
                    <strong>
                      {bid.customerName || bid.customerId?.name || "—"}
                    </strong>
                  )}
                </div>
                <div>
                  <span>Customer Email</span>
                  <strong>
                    {bid.customerEmail || bid.customerId?.email || "—"}
                  </strong>
                </div>
                <div>
                  <span>Customer Phone</span>
                  <strong>
                    {bid.customerPhone || bid.customerId?.phone || "—"}
                  </strong>
                </div>
                <div>
                  <span>Project Location</span>
                  <strong>{bid.projectLocation || "—"}</strong>
                </div>
                <div className="bid360-wide-field">
                  <span>Project Address</span>
                  <strong>{bid.projectAddress || "—"}</strong>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeMiniNav === "floors" && (
          <section id="floors" className="customer360-section blue">
            <SectionHeading
              id="floors-head"
              title="Floor Details"
              icon={Layers}
              accent="blue"
            />

            <div className="customer360-card">
              {!Array.isArray(bid.floors) || bid.floors.length === 0 ? (
                <div className="empty-state">No floor details available.</div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Floor #</th>
                        <th>Type</th>
                        <th>Area</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bid.floors.map((floor, index) => (
                        <tr key={floor._id || `${floor.floorNumber}-${index}`}>
                          <td>{floor.floorNumber || index + 1}</td>
                          <td>{floor.floorType || "—"}</td>
                          <td>
                            {Number(floor.floorArea || 0).toLocaleString(
                              "en-IN",
                            )}{" "}
                            sq ft
                          </td>
                          <td>{floor.floorDescription || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {activeMiniNav === "company-bids" && (
          <section id="company-bids" className="customer360-section green">
            <SectionHeading
              id="company-bids-head"
              title="Company Bids"
              icon={Building2}
              accent="green"
            />

            <div className="customer360-card">
              {!Array.isArray(bid.companyBids) ||
              bid.companyBids.length === 0 ? (
                <div className="empty-state">No company bids available.</div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Company</th>
                        <th>Bid Price</th>
                        <th>Bid Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bid.companyBids.map((companyBid, index) => (
                        <tr
                          key={
                            companyBid._id ||
                            `${companyBid.companyId?._id || "company"}-${index}`
                          }
                        >
                          <td>
                            {getCompanyRoute(companyBid) ? (
                              <button
                                className="project-view-btn bid360-table-link"
                                onClick={() =>
                                  navigate(getCompanyRoute(companyBid))
                                }
                              >
                                {companyBid.companyName ||
                                  companyBid.companyId?.companyName ||
                                  "—"}
                              </button>
                            ) : (
                              companyBid.companyName ||
                              companyBid.companyId?.companyName ||
                              "—"
                            )}
                          </td>
                          <td>{formatCurrency(companyBid.bidPrice)}</td>
                          <td>{formatDate(companyBid.bidDate)}</td>
                          <td>
                            <span
                              className={`status-pill ${statusClass(companyBid.status)}`}
                            >
                              {statusLabel(companyBid.status)}
                            </span>
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
                  <strong>{formatDateTime(bid.createdAt)}</strong>
                </div>
                <div>
                  <span>Last Updated</span>
                  <strong>{formatDateTime(bid.updatedAt)}</strong>
                </div>
                <div>
                  <span>Current Status</span>
                  <strong>{statusLabel(bid.status)}</strong>
                </div>
                <div>
                  <span>Winning Bid ID</span>
                  <strong>
                    {bid.winningBidId ? String(bid.winningBidId) : "—"}
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

export default AdminBidDetail;
