import React from "react";

const BidStatusList = ({ bids, expanded, onToggleFloor }) => {
  if (!bids.length) {
    return <div className="bids-empty">You haven't placed any bids yet.</div>;
  }
  return (
    <div className="bids-status-list">
      {bids.map((cb) => {
        const p = cb.project;
        const isExpanded = expanded.has(cb._id);
        const floorsToShow = isExpanded ? p.floors ?? [] : (p.floors ?? []).slice(0, 3);
        return (
          <div key={cb._id} className="bids-status-card">
            <div className="bids-status-header">
              <div className="bids-status-info">
                <div className="bids-status-title">
                  {p.projectName || "Project"} – {p.totalFloors} Floors
                </div>
                <div className="bids-status-budget">
                  Est. Budget: ₹
                  {p.estimatedBudget?.toLocaleString("en-IN") ?? "Not specified"}
                </div>
                <div className="bids-status-desc">
                  {p.specialRequirements || "No special requirements provided."}
                </div>
                <div className="bids-status-date">
                  Posted: {new Date(p.createdAt).toLocaleDateString("en-IN")}
                </div>
                <div className="bids-your-bid">
                  Your Bid: ₹{cb.bidPrice.toLocaleString("en-IN")}
                </div>
              </div>
              <div className={`bids-status-badge bids-status-${cb.status.toLowerCase()}`}>
                {cb.status}
              </div>
            </div>
            <div className="bids-status-grid">
              <div className="bids-grid-item"><span className="bids-label">Location</span> {p.projectLocation}</div>
              <div className="bids-grid-item"><span className="bids-label">Total Area</span> {p.totalArea} sq.ft</div>
              <div className="bids-grid-item"><span className="bids-label">Timeline</span> {p.projectTimeline ?? "Not specified"} months</div>
              <div className="bids-grid-item"><span className="bids-label">Building Type</span> {p.buildingType}</div>
              <div className="bids-grid-item"><span className="bids-label">Accessibility</span> {p.accessibilityNeeds ?? "None"}</div>
              <div className="bids-grid-item"><span className="bids-label">Energy Efficiency</span> {p.energyEfficiency ?? "Standard"}</div>
            </div>
            <div className="bids-customer">
              <div className="bids-customer-title">Customer Information</div>
              <div className="bids-customer-grid">
                <div><strong>Name:</strong> {p.customerName}</div>
                <div><strong>Email:</strong> {p.customerEmail}</div>
                <div><strong>Phone:</strong> {p.customerPhone}</div>
              </div>
            </div>
            {p.floors?.length > 0 && (
              <div className="bids-floors">
                <div className="bids-floors-title">Floor Details ({p.floors.length} floors)</div>
                <div className="bids-floors-list">
                  {floorsToShow.map((f) => (
                    <div key={f.floorNumber} className="bids-floor-badge">
                      Floor {f.floorNumber}: {f.floorType}
                    </div>
                  ))}
                </div>
                {p.floors.length > 3 && (
                  <button className="bids-expand-btn" onClick={() => onToggleFloor(cb._id)}>
                    {isExpanded ? "Show less" : `Show ${p.floors.length - 3} more floors`}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default BidStatusList;