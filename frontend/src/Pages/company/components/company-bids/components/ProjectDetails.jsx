import React from "react";

const ProjectDetails = ({ bid, bidAmount, onAmountChange, onSubmit, formRef }) => {
  return (
    <div className="bids-right">
      {!bid ? (
        <div className="bids-placeholder">
          <p>Click on a project to view details and place your bid</p>
        </div>
      ) : (
        <div className="bids-detail">
          <h2>{bid.projectName || "Project Details"}</h2>
          <div className="bids-detail-budget">
            Est. Budget: ₹
            {bid.estimatedBudget?.toLocaleString("en-IN") ?? "Not specified"}
          </div>

          <div className="bids-info">
            <h3>Project Details</h3>
            <div className="bids-info-row"><strong>Location:</strong> {bid.projectLocation}</div>
            <div className="bids-info-row"><strong>Address:</strong> {bid.projectAddress}</div>
            <div className="bids-info-row"><strong>Total Area:</strong> {bid.totalArea} sq.ft</div>
            <div className="bids-info-row"><strong>Timeline:</strong> {bid.projectTimeline ?? "Not specified"} months</div>
            <div className="bids-info-row"><strong>Total Floors:</strong> {bid.totalFloors}</div>
            <div className="bids-info-row"><strong>Building Type:</strong> {bid.buildingType}</div>
            <div className="bids-info-row"><strong>Accessibility Needs:</strong> {bid.accessibilityNeeds ?? "None"}</div>
            <div className="bids-info-row"><strong>Energy Efficiency:</strong> {bid.energyEfficiency ?? "Standard"}</div>
          </div>

          <div className="bids-info">
            <h3>Customer Information</h3>
            <div className="bids-info-row"><strong>Name:</strong> {bid.customerName}</div>
            <div className="bids-info-row"><strong>Email:</strong> {bid.customerEmail}</div>
            <div className="bids-info-row"><strong>Phone:</strong> {bid.customerPhone}</div>
          </div>

            {bid.floors?.length > 0 && (
              <div className="bids-info">
                <h3>Floor Information ({bid.floors.length} floors)</h3>
                {bid.floors.map((f) => (
                  <div key={f.floorNumber} className="bids-info-row">
                    <strong>Floor {f.floorNumber}:</strong> {f.floorType}
                    {f.area && ` | Area: ${f.area} sq.ft`}
                    {f.rooms && ` | Rooms: ${f.rooms}`}
                  </div>
                ))}
              </div>
            )}

            {bid.siteFiles?.length > 0 && (
              <div className="bids-info">
                <h3>Site Files</h3>
                {bid.siteFiles.map((file, i) => (
                  <div key={i} className="bids-info-row">
                    <strong>File {i + 1}:</strong>{" "}
                    <a href={file} target="_blank" rel="noopener noreferrer" style={{ color: "var(--bids-primary)" }}>
                      View Document
                    </a>
                  </div>
                ))}
              </div>
            )}

          <div className="bids-form">
            <h3>Place Your Bid</h3>
            <form ref={formRef} onSubmit={onSubmit}>
              <div className="bids-form-group">
                <label htmlFor="bids-amount">Your Bid Amount (₹):</label>
                <input
                  id="bids-amount"
                  type="text"
                  required
                  value={bidAmount}
                  onChange={(e) => onAmountChange(e.target.value.replace(/[^0-9]/g, ""))}
                />
              </div>
              <button type="submit" className="bids-btn-primary">
                Submit Bid
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;