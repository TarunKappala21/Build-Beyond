import React from "react";
import { Link } from "react-router-dom";

const BidReviewModal = ({ open, bid, onClose, onSubmitBid }) => {
  if (!open || !bid) return null;
  return (
    <div className="cdb-bid-review-modal-backdrop visible" onClick={onClose}>
      <div className="cdb-bid-review-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="cdb-bid-review-modal-header">
          <h2 className="cdb-modal-title">{bid.projectAddress || "Project Details"}</h2>
          <button className="cdb-modal-close-btn" onClick={onClose}>×</button>
        </div>
        <div className="cdb-bid-review-modal-body">
          <div className="cdb-detail-section">
            <h3>Customer Information</h3>
            <div className="cdb-detail-grid">
              <p><strong>Client Name:</strong> <span>{bid.customerName || "N/A"}</span></p>
              <p><strong>Email:</strong> <span>{bid.customerEmail || "N/A"}</span></p>
              <p><strong>Phone:</strong> <span>{bid.customerPhone || "N/A"}</span></p>
            </div>
          </div>
          <div className="cdb-detail-section">
            <h3>Project Specifications</h3>
            <div className="cdb-detail-grid">
              <p><strong>Location Code:</strong> <span>{bid.projectLocation || "N/A"}</span></p>
              <p><strong>Total Area (sq. ft):</strong> <span>{bid.totalArea || "N/A"}</span></p>
              <p><strong>Building Type:</strong> <span>{bid.buildingType || "N/A"}</span></p>
              <p><strong>Total Floors:</strong> <span>{bid.totalFloors || "N/A"}</span></p>
              <p><strong>Est. Budget:</strong> <span>₹{bid.estimatedBudget?.toLocaleString("en-IN") || "N/A"}</span></p>
              <p><strong>Est. Timeline:</strong> <span>{bid.projectTimeline ? `${bid.projectTimeline} months` : "N/A"}</span></p>
            </div>
          </div>
          <div className="cdb-detail-section">
            <h3>Additional Requirements</h3>
            <div className="cdb-detail-grid cdb-full">
              <p><strong>Special Requirements:</strong> <span>{bid.specialRequirements || "None"}</span></p>
              <p><strong>Accessibility Needs:</strong> <span>{bid.accessibilityNeeds || "None"}</span></p>
              <p><strong>Energy Efficiency:</strong> <span>{bid.energyEfficiency || "Standard"}</span></p>
            </div>
          </div>
          <div className="cdb-detail-section">
            <h3>Attached Site Files</h3>
            <div className="cdb-site-files-list">
              {bid.siteFiles && bid.siteFiles.length > 0 ? (
                bid.siteFiles.map((file, idx) => (
                  <a key={idx} href={file} target="_blank" rel="noopener noreferrer">
                    {file.split("/").pop()}
                  </a>
                ))
              ) : (
                <span>No files attached.</span>
              )}
            </div>
          </div>
        </div>
        <div className="cdb-bid-review-modal-footer">
          <button className="cdb-btn cdb-btn-primary" onClick={onSubmitBid}>Submit Bid</button>
          <Link to="/companydashboard/companybids">
            <button className="cdb-btn cdb-btn-secondary">View All Bids</button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BidReviewModal;