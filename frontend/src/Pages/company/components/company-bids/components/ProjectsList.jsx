import React from "react";

const ProjectsList = ({ bids, selectedBidId, onSelect }) => {
  return (
    <div className="bids-left">
      <h2>Available Projects</h2>
      <div className="bids-list">
        {bids.length ? (
          bids.map((bid) => (
            <div
              key={bid._id}
              className={`bids-card ${selectedBidId === bid._id ? "bids-selected" : ""}`}
              onClick={() => onSelect(bid)}
            >
              <div className="bids-card-title">{bid.projectName || "Unnamed Project"}</div>
              <div className="bids-card-subtitle">
                {bid.buildingType} | {bid.totalFloors} Floors
              </div>
              <div className="bids-card-budget">
                Est. Budget: ₹
                {bid.estimatedBudget?.toLocaleString("en-IN") ?? "Not specified"}
              </div>
            </div>
          ))
        ) : (
          <div className="bids-empty">No projects available for bidding at the moment.</div>
        )}
      </div>
    </div>
  );
};

export default ProjectsList;