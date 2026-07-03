// src/pages/company/CompanyBids.jsx
import React, { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import "./CompanyBids.css";
import AlertBanner from "./components/AlertBanner";
import TabsNav from "./components/TabsNav";
import ProjectsList from "./components/ProjectsList";
import ProjectDetails from "./components/ProjectDetails";
import BidStatusList from "./components/BidStatusList";
import API_BASE from "../../../../api/backendBase";


const CompanyBids = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState("place-bid");
  const [bids, setBids] = useState([]);
  const [companyBids, setCompanyBids] = useState([]);
  const [selectedBid, setSelectedBid] = useState(null);
  const [bidAmount, setBidAmount] = useState("");
  const [alert, setAlert] = useState(null);
  const [expanded, setExpanded] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState("");
  const [companyId, setCompanyId] = useState("");

  const formRef = useRef(null);

  /* -------------------------------------------------
   *  1. Alerts from query string
   * -------------------------------------------------*/
  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    if (success === "bid_submitted") {
      setAlert({ type: "success", msg: "Your bid has been submitted successfully!" });
    } else if (error === "invalid_data") {
      setAlert({ type: "danger", msg: "Please provide a valid bid amount." });
    } else if (error === "server_error") {
      setAlert({ type: "danger", msg: "An error occurred while processing your bid. Please try again." });
    }

    if (success || error) {
      const p = new URLSearchParams(searchParams);
      p.delete("success");
      p.delete("error");
      setSearchParams(p);
    }
  }, [searchParams, setSearchParams]);

  /* -------------------------------------------------
   *  2. Load data — ONE FETCH ONLY
   * -------------------------------------------------*/
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/companybids`, {
          credentials: "include",
        });

        if (!res.ok) throw new Error("Failed to fetch bids");

        const data = await res.json();

        setBids(data.bids || []);
        setCompanyBids(data.companyBids || []);
        setCompanyName(data.companyName || "");
        setCompanyId(data.companyId || "");

        const bidId = searchParams.get("bidId");
        if (bidId && data.bids) {
          const found = data.bids.find((b) => b._id === bidId);
          if (found) {
            setSelectedBid(found);
            setActiveTab("place-bid");
          }
        }
      } catch (e) {
        console.error("Error loading bids:", e);
        setAlert({ type: "danger", msg: "Failed to load bids. Please try again." });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [searchParams]);

  // Tab handling
  const switchTab = (tab) => {
    setActiveTab(tab);
    if (tab === "bid-status") setSelectedBid(null);
  };

  // Card click → select bid + URL update
  const selectBid = (bid) => {
    setSelectedBid(bid);
    setBidAmount("");
    setSearchParams({ bidId: bid._id });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Floor expand / collapse
  const toggleFloor = (bidId) => {
    setExpanded((prev) => {
      const n = new Set(prev);
      n.has(bidId) ? n.delete(bidId) : n.add(bidId);
      return n;
    });
  };

  // Submit bid (budget validation)
  const submitBid = async (e) => {
    e.preventDefault();
    if (!selectedBid) return;

    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= 0) {
      setAlert({ type: "danger", msg: "Please enter a valid bid amount greater than zero." });
      return;
    }

    if (selectedBid.estimatedBudget && amount > selectedBid.estimatedBudget) {
      setAlert({
        type: "danger",
        msg: `Bid amount (₹${amount.toLocaleString("en-IN")}) exceeds the budget (₹${selectedBid.estimatedBudget.toLocaleString("en-IN")}). Enter a lower amount.`,
      });
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/submit-bid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          bidId: selectedBid._id,
          bidPrice: amount,
          companyName,
          companyId,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSearchParams({ success: "bid_submitted" });
        setBidAmount("");
        window.location.reload();
      } else {
        setAlert({ type: "danger", msg: data.error || "Failed to submit bid." });
      }
    } catch (e) {
      console.error("Error:", e);
      setAlert({ type: "danger", msg: "Network error. Please try again." });
    }
  };

  /* -------------------------------------------------
   *  Render helpers
   * -------------------------------------------------*/
  const visibleCompanyBids = companyBids.filter((b) => b.status !== "rejected");

  if (loading) {
    return <div className="bids-container"><p>Loading bids...</p></div>;
  }

  return (
    <div className="bids-container">
      <AlertBanner alert={alert} />
      <TabsNav activeTab={activeTab} onChange={switchTab} />

      {/* PLACE BID TAB */}
      {activeTab === "place-bid" && (
        <div className="bids-section bids-active">
          <div className="bids-grid">
            <ProjectsList bids={bids} selectedBidId={selectedBid?._id} onSelect={selectBid} />
            <ProjectDetails
              bid={selectedBid}
              bidAmount={bidAmount}
              onAmountChange={(v) => setBidAmount(v)}
              onSubmit={submitBid}
              formRef={formRef}
            />
          </div>
        </div>
      )}

      {/* BID STATUS TAB */}
      {activeTab === "bid-status" && (
        <div className="bids-section bids-active">
          <h2>Your Bid Status</h2>
          <BidStatusList
            bids={visibleCompanyBids}
            expanded={expanded}
            onToggleFloor={toggleFloor}
          />
        </div>
      )}
    </div>
  );
};

export default CompanyBids;