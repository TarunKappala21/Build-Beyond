import React from "react";
import { Link } from "react-router-dom";

const BidsList = ({ bids, onOpen }) => {
  return (
    <>
      <div className="cdb-section-header">
        <h2 className="cdb-section-title">New Bids</h2>
        <div className="cdb-view-all">
          <Link to="/companybids">View All</Link>
        </div>
      </div>
      <div className="cdb-cards-container">
        {bids.length === 0 ? (
          <p>No new bids available.</p>
        ) : (
          bids.map((bid) => (
            <div key={bid._id} className="cdb-bid-card" data-bid-details={JSON.stringify(bid)}>
              <h3>{bid.projectName || "N/A"}</h3>
              <div className="cdb-bid-info">
                <p><span>Client:</span><span>{bid.customerName}</span></p>
                <p><span>Location:</span><span>{bid.projectLocation}</span></p>
                <p><span>Budget:</span><span>₹{bid.estimatedBudget?.toLocaleString("en-IN") || "TBD"}</span></p>
                <p><span>Timeline:</span><span>{bid.projectTimeline ? `${bid.projectTimeline} months` : "TBD"}</span></p>
                <p><span>Due Date:</span><span>{new Date(bid.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span></p>
              </div>
              <div className="cdb-bid-actions">
                <button className="cdb-btn cdb-btn-primary" onClick={() => onOpen(bid)}>
                  View Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
};

export default BidsList;