import React from "react";

const TabsNav = ({ activeTab, onChange }) => {
  return (
    <div className="bids-nav-menu">
      <div
        className={`bids-nav-item ${activeTab === "place-bid" ? "bids-active" : ""}`}
        onClick={() => onChange("place-bid")}
      >
        Place a Bid
      </div>
      <div
        className={`bids-nav-item ${activeTab === "bid-status" ? "bids-active" : ""}`}
        onClick={() => onChange("bid-status")}
      >
        Bid Status
      </div>
    </div>
  );
};

export default TabsNav;