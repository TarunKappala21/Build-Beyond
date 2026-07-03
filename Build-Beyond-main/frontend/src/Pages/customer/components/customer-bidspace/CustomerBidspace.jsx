// src/Pages/customer/components/customer-bidspace/CustomerBidspace.jsx
import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from '../../../../api/axiosInstance';
import { Link } from "react-router-dom";
import CustomerPageLoader from "../common/CustomerPageLoader";
import "./CustomerBidspace.css";

const CustomerBidspace = () => {
  const [bids, setBids] = useState([]);
  const [selectedBid, setSelectedBid] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBids = async () => {
      try {
        const res = await axiosInstance.get("/api/bidspace", {
          withCredentials: true,
        });
        const data = res.data.customerBids || [];
        setBids(data);
        if (data.length) setSelectedBid(data[0]);
      } catch (err) {
        console.error("Failed to load bids:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBids();
  }, []);
  useEffect(() => {
    console.log(bids);
  }, [bids]);

  const selectBid = useCallback((bid) => setSelectedBid(bid), []);

  const declineBid = async (bidId, companyBidId) => {
    if (!window.confirm("Are you sure you want to decline this bid?")) return;
    try {
      const res = await axiosInstance.post(
        "/api/customer/decline-bid",
        { bidId, companyBidId },
        { withCredentials: true },
      );
      if (res.data.success) {
        alert("Bid declined successfully!");
        window.location.reload();
      } else {
        alert("Error: " + (res.data.error || "Server rejected the request."));
      }
    } catch (err) {
      console.error("Decline error:", err);
      alert("An unexpected error occurred.");
    }
  };

  const toDisplayString = (str) =>
    !str
      ? "N/A"
      : str
          .replace(/([A-Z])/g, " $1")
          .trim()
          .replace(/\b\w/g, (c) => c.toUpperCase());

  const ProjectDetails = ({ bid }) => (
    <>
      <div className="cb-detail-group">
        <h3>Customer Details</h3>
        <div className="cb-detail-row">
          <span className="cb-detail-label">Customer Name:</span>
          <span className="cb-detail-value">{bid.customerName || "N/A"}</span>
        </div>
        <div className="cb-detail-row">
          <span className="cb-detail-label">Customer Email:</span>
          <span className="cb-detail-value">{bid.customerEmail}</span>
        </div>
        <div className="cb-detail-row">
          <span className="cb-detail-label">Customer Phone:</span>
          <span className="cb-detail-value">{bid.customerPhone}</span>
        </div>
        <div className="cb-detail-row">
          <span className="cb-detail-label">Project Address:</span>
          <span className="cb-detail-value">{bid.projectAddress}</span>
        </div>
      </div>

      <div className="cb-detail-group">
        <h3>Project Overview</h3>
        <div className="cb-detail-row">
          <span className="cb-detail-label">Building Type:</span>
          <span className="cb-detail-value">
            {toDisplayString(bid.buildingType)}
          </span>
        </div>
        <div className="cb-detail-row">
          <span className="cb-detail-label">Total Area:</span>
          <span className="cb-detail-value">
            {bid.totalArea ? `${bid.totalArea} sq meters` : "N/A"}
          </span>
        </div>
        <div className="cb-detail-row">
          <span className="cb-detail-label">Total Floors:</span>
          <span className="cb-detail-value">{bid.totalFloors || "N/A"}</span>
        </div>
        <div className="cb-detail-row">
          <span className="cb-detail-label">Target Budget:</span>
          <span className="cb-detail-value">
            ₹
            {bid.estimatedBudget
              ? bid.estimatedBudget.toLocaleString("en-IN")
              : "Not specified"}
          </span>
        </div>
        <div className="cb-detail-row">
          <span className="cb-detail-label">Timeline:</span>
          <span className="cb-detail-value">
            {bid.projectTimeline ? `${bid.projectTimeline} months` : "N/A"}
          </span>
        </div>
      </div>

      <div className="cb-detail-group">
        <h3>Location & Requirements</h3>
        <div
          className="cb-detail-row"
          style={{ flexDirection: "column", alignItems: "flex-start" }}
        >
          <span className="cb-detail-label">Address:</span>
          <span
            className="cb-detail-value"
            style={{
              textAlign: "left",
              width: "100%",
              fontStyle: "italic",
              marginTop: "5px",
            }}
          >
            {bid.projectAddress}, Pincode: {bid.projectLocation || "N/A"}
          </span>
        </div>
        <div className="cb-detail-row">
          <span className="cb-detail-label">Accessibility Needs:</span>
          <span className="cb-detail-value">
            {toDisplayString(bid.accessibilityNeeds)}
          </span>
        </div>
        <div className="cb-detail-row">
          <span className="cb-detail-label">Energy Goals:</span>
          <span className="cb-detail-value">
            {toDisplayString(bid.energyEfficiency)}
          </span>
        </div>
        {bid.specialRequirements && (
          <div
            className="cb-detail-row"
            style={{ flexDirection: "column", alignItems: "flex-start" }}
          >
            <span className="cb-detail-label">Special Requirements:</span>
            <span
              className="cb-detail-value"
              style={{
                textAlign: "left",
                width: "100%",
                marginTop: "5px",
                color: "var(--primary-dark)",
              }}
            >
              {bid.specialRequirements}
            </span>
          </div>
        )}
      </div>

      {bid.floors && bid.floors.length > 0 && (
        <div className="cb-detail-group">
          <h3>Floor Plans & Layouts</h3>
          {bid.floors.map((f, i) => (
            <div key={i} className="cb-floor-card">
              <strong>Floor {f.floorNumber || "N/A"}</strong>:{" "}
              {toDisplayString(f.floorType)} ({f.floorArea || "N/A"} sq m)
              {f.floorDescription && (
                <p
                  style={{ fontSize: "13px", color: "#666", marginTop: "5px" }}
                >
                  * {f.floorDescription}
                </p>
              )}
              {f.floorImagePath && (
                <p style={{ fontSize: "12px", marginTop: "5px" }}>
                  Plan:{" "}
                  <a
                    href={f.floorImagePath}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "var(--accent-blue)",
                      textDecoration: "none",
                    }}
                  >
                    View Plan Image
                  </a>
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {bid.siteFiles && bid.siteFiles.length > 0 && (
        <div className="cb-detail-group">
          <h3>Attached Site Documents</h3>
          <div
            className="cb-detail-row"
            style={{ flexWrap: "wrap", justifyContent: "flex-start" }}
          >
            {bid.siteFiles.map((f, i) => (
              <a
                key={i}
                href={f}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  marginRight: "15px",
                  color: "var(--success-green)",
                  textDecoration: "none",
                }}
              >
                Document {i + 1}
              </a>
            ))}
          </div>
        </div>
      )}
    </>
  );

  if (loading) {
    return <CustomerPageLoader message="Loading your bids..." />;
  }

  return (
    <div className="cb-container">
      <div className="cb-section">
        <div className="cb-message-banner">
          <div className="cb-message-icon">Info</div>
          <div className="cb-message-content">
            Only Projects Greater than ₹ 1,00,00,000 are Eligible for Bidding
          </div>
        </div>

        <div className="cb-section-header">
          <h2 className="cb-section-title">Your Project Bids</h2>
          <Link to="/customerdashboard/bidform">
            <button className="cb-btn cb-btn-create">Create New Bid</button>
          </Link>
        </div>

        <div className="cb-bid-list">
          {bids.length > 0 ? (
            bids.map((bid) => (
              <div
                key={bid._id}
                className={`cb-bid-item ${
                  selectedBid?._id === bid._id ? "active" : ""
                }`}
                onClick={() => selectBid(bid)}
              >
                <div className="cb-project-name">{bid.projectName}</div>
                <div className="cb-bid-header">
                  <div className="cb-bid-title">
                    {bid.totalFloors} Floor |{" "}
                    {bid.buildingType?.charAt(0).toUpperCase() +
                      bid.buildingType?.slice(1)}
                  </div>
                  <div className="cb-bid-price">
                    Budget: ₹
                    {bid.estimatedBudget?.toLocaleString("en-IN") || "N/A"}
                  </div>
                </div>
                <div className="cb-bid-details">{bid.projectAddress}</div>
                <div className="cb-bid-date">
                  Status:{" "}
                  <strong
                    style={{
                      color:
                        bid.status === "open"
                          ? "var(--status-open)"
                          : bid.status === "awarded"
                            ? "var(--status-awarded)"
                            : "var(--status-declined)",
                    }}
                  >
                    {bid.status?.charAt(0).toUpperCase() + bid.status?.slice(1)}
                  </strong>{" "}
                  | Posted:{" "}
                  {new Date(bid.createdAt).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="cb-no-bids">
              <p className="cb-no-bids-text">
                You haven't created any bid requests yet. Click{" "}
                <strong>'Create New Bid'</strong> to start receiving offers!
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="cb-section">
        {selectedBid ? (
          <>
            <h2 className="cb-section-title">
              {selectedBid.projectName} Details
            </h2>
            <div className="cb-project-details-container">
              <ProjectDetails bid={selectedBid} />
            </div>
            <h2 className="cb-section-title" style={{ marginTop: "20px" }}>
              Company Bids Received ({selectedBid.companyBids?.length ?? 0})
            </h2>
            {selectedBid.companyBids && selectedBid.companyBids.length > 0 ? (
              selectedBid.companyBids.map((cBid) => (
                <div key={cBid._id} className="cb-company-bid">
                  <div className="cb-bid-actions">
                    <h3>{cBid.companyName}</h3>
                    <p>Bidded Price: {cBid.bidPrice}</p>
                    <p>Bidded Date: {cBid.bidDate}</p>
                    {selectedBid.winningBidId &&
                    selectedBid.winningBidId.toString() ===
                      cBid._id.toString() ? (
                      <button className="cb-btn cb-btn-awarded" disabled>
                        Project Awarded
                      </button>
                    ) : selectedBid.status === "awarded" ? (
                      <button
                        className="cb-btn cb-btn-already-awarded"
                        disabled
                      >
                        Already Awarded
                      </button>
                    ) : cBid.status === "rejected" ? (
                      <button
                        className="cb-btn cb-btn-declined-status"
                        disabled
                      >
                        Declined
                      </button>
                    ) : selectedBid.status === "open" ? (
                      <>
                        <a
                          href={`/api/customer/accept-bid/${selectedBid._id}/${cBid._id}`}
                          className="cb-btn cb-btn-accept"
                        >
                          Accept & Pay
                        </a>
                        <button
                          className="cb-btn cb-btn-deny"
                          onClick={() => declineBid(selectedBid._id, cBid._id)}
                        >
                          Decline
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <div className="cb-no-bids">
                <p>No company bids received yet.</p>
              </div>
            )}
          </>
        ) : (
          <div className="cb-empty-state">
            <p>
              Select a project on the left to view its <strong>details</strong>{" "}
              and received <strong>company offers</strong>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerBidspace;
