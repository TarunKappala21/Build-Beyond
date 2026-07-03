// src/Pages/company/components/company-dashboard/CompanyDashboard.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./CompanyDashboard.css";
import DashboardStats from "./components/DashboardStats";
import BidsList from "./components/BidsList";
import ProjectsList from "./components/ProjectsList";
import TimelineProjects from "./components/TimelineProjects";
import BidReviewModal from "./components/BidReviewModal";
import API_BASE from "../../../../api/backendBase";

const CompanyDashboard = () => {
  const [data, setData] = useState({
    activeProjects: 0,
    completedProjects: 0,
    revenue: 0,
    bids: [],
    projects: [],
    calculateProgress: () => 0,
    calculateDaysRemaining: () => 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedBid, setSelectedBid] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/companydashboard`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to load dashboard");

        const backendData = await res.json();

        const calculateDaysRemaining = (startDate, timeline) => {
          try {
            const totalMonths = parseInt(timeline, 10);
            if (isNaN(totalMonths) || totalMonths <= 0) return 0;
            const start = new Date(startDate);
            const now = new Date();
            const end = new Date(start);
            end.setMonth(end.getMonth() + totalMonths);
            if (now >= end) return 0;
            const diffTime = end.getTime() - now.getTime();
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          } catch {
            return 0;
          }
        };

        const calculateProgress = (startDate, timeline) => {
          try {
            const totalMonths = parseInt(timeline, 10);
            if (isNaN(totalMonths) || totalMonths <= 0) return 0;
            const start = new Date(startDate);
            const now = new Date();
            const end = new Date(start);
            end.setMonth(end.getMonth() + totalMonths);
            if (now >= end) return 100;
            if (now <= start) return 0;
            const totalDuration = end.getTime() - start.getTime();
            const elapsedDuration = now.getTime() - start.getTime();
            return Math.floor((elapsedDuration / totalDuration) * 100);
          } catch {
            return 0;
          }
        };

        setData({
          ...backendData,
          calculateProgress,
          calculateDaysRemaining,
        });
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const closeModal = () => {
    setShowModal(false);
    setSelectedBid(null);
  };

  const openModal = (bid) => {
    setSelectedBid(bid);
    setShowModal(true);
  };

  const handleAcceptBid = async () => {
    if (!selectedBid) return;

    const proposedPrice = prompt(
      `Enter your proposed price (must be ≤ ₹${
        selectedBid.estimatedBudget?.toLocaleString("en-IN") || "N/A"
      }):`,
      "",
    );

    if (!proposedPrice) return; // User cancelled

    const price = parseFloat(proposedPrice);

    // Validation
    if (isNaN(price) || price <= 0) {
      alert("Please enter a valid price greater than zero.");
      return;
    }

    if (selectedBid.estimatedBudget && price > selectedBid.estimatedBudget) {
      alert(
        `Price (₹${price.toLocaleString(
          "en-IN",
        )}) exceeds the budget (₹${selectedBid.estimatedBudget.toLocaleString(
          "en-IN",
        )}). Please enter a lower price.`,
      );
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/submit-bid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          bidId: selectedBid._id,
          bidPrice: price,
        }),
      });

      if (res.ok) {
        alert("Bid submitted successfully!");
        closeModal();
        window.location.reload();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to submit bid.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error. Please try again.");
    }
  };

  const updateProjectStatus = async (bidId, status) => {
    const apiRoute = `/api/projects/${bidId}/${status}`;
    try {
      const res = await fetch(`${API_BASE}${apiRoute}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        alert(`Bid status updated to ${status} successfully!`);
        window.location.reload();
      } else {
        const err = await res.json();
        throw new Error(err.message || "Update failed");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update bid status.");
    }
  };

  if (loading) return <div className="cdb-loading">Loading Dashboard...</div>;
  if (error) return <div className="cdb-error">Error: {error}</div>;

  const {
    activeProjects,
    completedProjects,
    revenue,
    bids,
    projects,
    calculateProgress,
    calculateDaysRemaining,
  } = data;

  const pendingProjects = projects.filter((p) => p.status === "pending");
  const acceptedProjects = projects.filter((p) => p.status === "accepted");

  return (
    <>
      <div className="cdb-main-container">
        <h1 className="cdb-page-title">Revenue Management</h1>
        <DashboardStats
          active={activeProjects}
          completed={completedProjects}
          revenue={revenue}
        />
        <BidsList bids={bids} onOpen={openModal} />
        <ProjectsList projects={pendingProjects} />
        <TimelineProjects
          projects={acceptedProjects}
          calcProgress={calculateProgress}
          calcDays={calculateDaysRemaining}
        />
      </div>
      <BidReviewModal
        open={showModal}
        bid={selectedBid}
        onClose={closeModal}
        onSubmitBid={handleAcceptBid}
      />
    </>
  );
};

export default CompanyDashboard;
