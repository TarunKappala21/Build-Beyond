// src/Pages/customer/components/customer-ongoing/CustomerOngoing.jsx
import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "../../../../api/axiosInstance";
import { useSearchParams } from "react-router-dom";
import "./CustomerOngoing.css";
import Modal from "react-modal";
import CompanyPaymentModal from "../customer-payments/CompanyPaymentModal";
import CustomerPageLoader from "../common/CustomerPageLoader";

const CURRENCY_EPSILON = 0.01;

const CustomerOngoing = () => {
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [filter, setFilter] = useState("all");
  const [expandedDetails, setExpandedDetails] = useState({});
  const [expandedMilestones, setExpandedMilestones] = useState({});
  const [expandedUpdates, setExpandedUpdates] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedProposal, setExpandedProposal] = useState({});
  const [revisionFeedback, setRevisionFeedback] = useState({});
  const [showRevisionModal, setShowRevisionModal] = useState(null);
  const [showReviewProjectId, setShowReviewProjectId] = useState(null);
  const [reviewRating, setReviewRating] = useState({});
  const [reviewText, setReviewText] = useState({});
  const [hoveredRating, setHoveredRating] = useState({});
  const [showComplaintModal, setShowComplaintModal] = useState(null); // key: `${projectId}_${milestone}`
  const [complaintText, setComplaintText] = useState({});
  const [complaintLoading, setComplaintLoading] = useState(false);
  const [complaintSuccess, setComplaintSuccess] = useState(false);
  const [complaintError, setComplaintError] = useState(null);
  const [complaintHistory, setComplaintHistory] = useState([]);
  const [complaintHistoryLoading, setComplaintHistoryLoading] = useState(false);
  const [unviewedMessages, setUnviewedMessages] = useState({}); // { projectId: count }

  // Company payment modal state
  const [paymentModal, setPaymentModal] = useState(null); // { project, phaseIndex, paymentStage }

  const getProposalPhases = (project) =>
    Array.isArray(project?.proposal?.phases) ? project.proposal.phases : [];

  const getPhaseForMilestone = (project, milestonePercentage) => {
    const phases = getProposalPhases(project);
    if (phases.length === 0) return null;
    const index = Math.min(
      Math.max(Math.floor(milestonePercentage / 25) - 1, 0),
      phases.length - 1,
    );
    return phases[index] || null;
  };

  const getCurrentPhaseLabel = (project) => {
    const phases = getProposalPhases(project);
    if (phases.length === 0) return project.currentPhase || "Not specified";
    const progress = project.completionPercentage || 0;
    const index = Math.min(
      Math.max(Math.ceil(progress / 25) - 1, 0),
      phases.length - 1,
    );
    return phases[index]?.name || project.currentPhase || "Not specified";
  };

  const formatCurrency = (value) => {
    if (value === undefined || value === null || value === "") return "N/A";
    return `₹${Number(value).toLocaleString("en-IN")}`;
  };

  // Get payment breakdown for a milestone phase
  const getPaymentScheduleForMilestone = (project, milestone) => {
    const phase = getPhaseForMilestone(project, milestone.percentage);
    if (!phase) return null;

    const payout = (project?.paymentDetails?.payouts || []).find(
      (entry) =>
        Number(entry.milestonePercentage) === Number(milestone.percentage),
    );

    const baseAmount =
      project?.paymentDetails?.totalAmount || project?.proposal?.price || 0;
    const phaseAmount = payout
      ? Number(payout.amount || 0)
      : parseFloat(phase.amount) ||
        baseAmount * ((phase.percentage || 0) / 100) ||
        0;

    const upfrontAmount = payout
      ? Number(payout.immediateReleaseAmount || phaseAmount * 0.75)
      : phaseAmount * 0.75;
    const completionAmount = Math.max(phaseAmount - upfrontAmount, 0);

    const paidSoFar = Number(payout?.customerPaidAmount || 0);
    const paidUpfront = Math.min(paidSoFar, upfrontAmount);
    const paidCompletion = Math.max(0, paidSoFar - upfrontAmount);

    const upfrontStatusFromPayout =
      paidUpfront >= upfrontAmount - CURRENCY_EPSILON ? "released" : "pending";
    const completionStatusFromPayout =
      payout?.status === "released" ||
      paidCompletion >= completionAmount - CURRENCY_EPSILON
        ? "released"
        : "pending";

    return {
      upfront: {
        amount: upfrontAmount,
        status: payout
          ? upfrontStatusFromPayout
          : milestone.payments?.upfront?.status || "pending",
        label: `Released now: ₹${formatCurrency(upfrontAmount)}`,
      },
      completion: {
        amount: completionAmount,
        status: payout
          ? completionStatusFromPayout
          : milestone.payments?.completion?.status || "pending",
        label: `Held till approval: ₹${formatCurrency(completionAmount)}`,
      },
      final: { amount: 0, status: "not_applicable", label: "N/A" },
    };
  };

  // Fetch projects from API
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await axiosInstance.get("/api/ongoing_projects", {
          withCredentials: true,
        });
        setProjects(res.data.projects || []);

        // Fetch unviewed company messages
        try {
          const messagesRes = await axiosInstance.get(
            "/api/customer/unviewed-company-messages",
            {
              withCredentials: true,
            },
          );
          if (messagesRes.data.success) {
            const messagesMap = {};
            messagesRes.data.unviewedByProject.forEach((item) => {
              messagesMap[item._id] = item.count;
            });
            setUnviewedMessages(messagesMap);
          }
        } catch (messagesErr) {
          console.error("Error fetching unviewed messages:", messagesErr);
        }
      } catch (err) {
        console.error("Failed to load ongoing projects:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    const projectId = searchParams.get("projectId");
    if (!projectId || projects.length === 0) return;

    const section = searchParams.get("section") || "details";
    const projectExists = projects.some(
      (project) => String(project._id) === String(projectId),
    );
    if (!projectExists) return;

    setFilter("all");
    setExpandedDetails((prev) => ({
      ...prev,
      [projectId]: section === "details" || section === "review",
    }));
    setExpandedMilestones((prev) => ({
      ...prev,
      [projectId]: section === "milestones",
    }));
    setExpandedUpdates((prev) => ({
      ...prev,
      [projectId]: section === "updates" || section === "review",
    }));
    setExpandedProposal((prev) => ({
      ...prev,
      [projectId]: section === "proposal",
    }));
    setShowReviewProjectId(section === "review" ? projectId : null);

    const scrollTimer = window.setTimeout(() => {
      document.getElementById(`co-project-${projectId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);

    const highlightTargetBySection = {
      details: `details-${projectId}`,
      milestones: `milestones-${projectId}`,
      updates: `updates-${projectId}`,
      review: `co-project-${projectId}`,
      proposal: `co-project-${projectId}`,
    };

    const highlightTargetId =
      highlightTargetBySection[section] || `co-project-${projectId}`;

    const highlightTimer = window.setTimeout(() => {
      const targetElement =
        document.getElementById(highlightTargetId) ||
        document.getElementById(`co-project-${projectId}`);

      if (!targetElement) return;

      targetElement.classList.add("co-notification-highlight");
      window.setTimeout(() => {
        targetElement.classList.remove("co-notification-highlight");
      }, 3500);
    }, 220);

    return () => {
      window.clearTimeout(scrollTimer);
      window.clearTimeout(highlightTimer);
    };
  }, [searchParams, projects]);

  const toggleDetails = (id) => {
    setExpandedDetails((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
    setExpandedMilestones((prev) => ({ ...prev, [id]: false }));
    setExpandedUpdates((prev) => ({ ...prev, [id]: false }));
  };

  const toggleMilestones = async (id) => {
    const wasExpanded = expandedMilestones[id];
    setExpandedMilestones((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
    setExpandedDetails((prev) => ({ ...prev, [id]: false }));
    setExpandedUpdates((prev) => ({ ...prev, [id]: false }));

    // Mark company messages as viewed when opening milestones
    if (!wasExpanded && unviewedMessages[id]) {
      // Clear notification immediately
      setUnviewedMessages((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });

      try {
        await axiosInstance.post(
          `/api/customer/mark-messages-viewed/${id}`,
          {},
          {
            withCredentials: true,
          },
        );
      } catch (err) {
        console.error("Error marking messages as viewed:", err);
        // Restore notification if failed
        setUnviewedMessages((prev) => ({
          ...prev,
          [id]: 1,
        }));
      }
    }
  };

  const toggleUpdates = (id) => {
    setExpandedUpdates((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
    setExpandedDetails((prev) => ({ ...prev, [id]: false }));
    setExpandedMilestones((prev) => ({ ...prev, [id]: false }));
  };

  const toggleProposal = (id) => {
    setExpandedProposal((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleAcceptProposal = async (projectId) => {
    if (!window.confirm("Accept the proposal from the company?")) {
      return;
    }

    try {
      const res = await axiosInstance.post(
        "/api/customer/accept-proposal",
        { projectId },
        { withCredentials: true },
      );

      if (res.data.success) {
        alert("Proposal accepted successfully!");
        // Refresh projects
        const projectsRes = await axiosInstance.get("/api/ongoing_projects", {
          withCredentials: true,
        });
        setProjects(projectsRes.data.projects || []);
      }
    } catch (err) {
      console.error("Error accepting proposal:", err);
      alert(err.response?.data?.error || "Failed to accept proposal");
    }
  };

  const handleApproveMilestone = async (projectId, milestonePercentage) => {
    if (
      !window.confirm(
        `Are you satisfied with the ${milestonePercentage}% milestone progress?`,
      )
    ) {
      return;
    }

    try {
      const res = await axiosInstance.post(
        "/api/customer/approve-milestone",
        { projectId, milestonePercentage },
        { withCredentials: true },
      );

      if (res.data.success) {
        alert(res.data.message);
        // Refresh projects
        const projectsRes = await axiosInstance.get("/api/ongoing_projects", {
          withCredentials: true,
        });
        setProjects(projectsRes.data.projects || []);
      }
    } catch (err) {
      console.error("Error approving milestone:", err);
      alert(err.response?.data?.error || "Failed to approve milestone");
    }
  };

  // Open the Razorpay payment modal for a construction project milestone
  const handlePayMilestone = useCallback(
    (projectId, milestonePercentage) => {
      const project = projects.find((p) => String(p._id) === String(projectId));
      if (!project) return;
      setPaymentModal({ project, milestonePercentage });
    },
    [projects],
  );

  const handlePaymentSuccess = useCallback(async () => {
    setPaymentModal(null);
    try {
      const res = await axiosInstance.get("/api/ongoing_projects", {
        withCredentials: true,
      });
      setProjects(res.data.projects || []);
    } catch (err) {
      console.error("Failed to refresh projects after payment:", err);
    }
  }, []);

  const handleRequestRevision = async (projectId, milestonePercentage) => {
    const feedback = revisionFeedback[`${projectId}_${milestonePercentage}`];

    if (!feedback || feedback.trim() === "") {
      alert("Please provide feedback for the revision request");
      return;
    }

    try {
      const res = await axiosInstance.post(
        "/api/customer/request-milestone-revision",
        { projectId, milestonePercentage, feedback },
        { withCredentials: true },
      );

      if (res.data.success) {
        alert(res.data.message);
        setShowRevisionModal(null);
        setRevisionFeedback({});
        // Refresh projects
        const projectsRes = await axiosInstance.get("/api/ongoing_projects", {
          withCredentials: true,
        });
        setProjects(projectsRes.data.projects || []);
      }
    } catch (err) {
      console.error("Error requesting revision:", err);
      alert(err.response?.data?.error || "Failed to request revision");
    }
  };

  const handleSubmitReview = async (projectId) => {
    const rating = reviewRating[projectId];
    const text = reviewText[projectId] || "";

    if (!rating) {
      alert("Please provide a rating");
      return;
    }

    try {
      const res = await axiosInstance.post(
        "/api/customer/submit-project-review",
        { projectId, rating, reviewText: text },
        { withCredentials: true },
      );

      if (res.data.success) {
        alert(res.data.message);
        setShowReviewModal(null);
        setReviewRating({});
        setReviewText({});
        // Refresh projects
        const projectsRes = await axiosInstance.get("/api/ongoing_projects", {
          withCredentials: true,
        });
        setProjects(projectsRes.data.projects || []);
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      alert(err.response?.data?.error || "Failed to submit review");
    }
  };

  const fetchComplaintHistory = async (projectId, milestone) => {
    setComplaintHistoryLoading(true);
    try {
      const response = await axiosInstance.get(`/api/complaints/${projectId}`, {
        withCredentials: true,
      });
      const milestoneValue = Number(milestone === "general" ? 0 : milestone);
      const filtered = (response.data.complaints || []).filter(
        (complaint) => Number(complaint.milestone) === milestoneValue,
      );
      setComplaintHistory(filtered);
    } catch {
      setComplaintHistory([]);
    } finally {
      setComplaintHistoryLoading(false);
    }
  };

  const handleOpenComplaint = (projectId, milestone) => {
    setShowComplaintModal(`${projectId}_${milestone}`);
    setComplaintText({});
    setComplaintSuccess(false);
    setComplaintError(null);
    setComplaintHistory([]);
    fetchComplaintHistory(projectId, milestone);
  };
  const handleCloseComplaint = () => {
    setShowComplaintModal(null);
    setComplaintText({});
    setComplaintSuccess(false);
    setComplaintError(null);
    setComplaintHistory([]);
  };
  const handleSubmitComplaint = async (projectId, milestone) => {
    setComplaintLoading(true);
    setComplaintError(null);
    try {
      await axiosInstance.post(
        "/api/complaints",
        {
          projectId,
          milestone,
          message: complaintText[`${projectId}_${milestone}`],
        },
        { withCredentials: true },
      );
      setComplaintSuccess(true);
      setComplaintText({});
      await fetchComplaintHistory(projectId, milestone);
    } catch (err) {
      setComplaintError("Failed to submit complaint");
    }
    setComplaintLoading(false);
  };

  const filteredProjects = projects.filter((p) => {
    if (filter === "all") return true;
    if (filter === "finished") return p.completionPercentage === 100;
    if (filter === "pending") return p.completionPercentage < 100;
    return true;
  });

  if (loading) {
    return <CustomerPageLoader message="Loading ongoing projects..." />;
  }

  return (
    <>
      <div className="co-container">
        <div className="co-header">
          <div className="co-header-title">
            <h1>Ongoing Projects</h1>
          </div>
        </div>

        <div className="co-content-wrapper">
          {/* SIDEBAR WITH FILTERS */}
          <div className="co-sidebar">
            <div className="co-filter-card">
              <div className="co-filter-header">
                <h2>Filter Projects</h2>
                <div className="co-filter-divider"></div>
              </div>
              <div className="co-filter-controls">
                <button
                  className={`co-filter-button ${
                    filter === "all" ? "active" : "inactive"
                  }`}
                  onClick={() => setFilter("all")}
                >
                  <span>All Projects</span>
                </button>
                <button
                  className={`co-filter-button ${
                    filter === "pending" ? "active" : "inactive"
                  }`}
                  onClick={() => setFilter("pending")}
                >
                  <span>Pending Projects</span>
                </button>
                <button
                  className={`co-filter-button ${
                    filter === "finished" ? "active" : "inactive"
                  }`}
                  onClick={() => setFilter("finished")}
                >
                  <span>Finished Projects</span>
                </button>
              </div>
            </div>
          </div>

          {/* MAIN CONTENT */}
          <div className="co-left-section">
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project) => (
                <React.Fragment key={project._id}>
                  {/* PROJECT CARD */}
                  <div
                    className="co-project-display"
                    id={`co-project-${project._id}`}
                  >
                    <div className="co-project-main">
                      <div className="co-project-image">
                        <img
                          src={
                            project.mainImagePath ||
                            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSqjSRsiV4Q22mOElSnkcct2oZmd-1iVrNOcQ&s"
                          }
                          alt={`${project.projectName} Image`}
                        />
                      </div>

                      <div className="co-project-details">
                        {/* New Notification Box */}
                        {unviewedMessages[project._id] && (
                          <div
                            style={{
                              backgroundColor: "#fef3c7",
                              border: "2px solid #f59e0b",
                              borderRadius: "8px",
                              padding: "12px 16px",
                              marginBottom: "16px",
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              fontSize: "14px",
                              color: "#92400e",
                              fontWeight: "500",
                              animation: "pulse 2s infinite",
                            }}
                          >
                            <span style={{ fontSize: "20px" }}>New</span>
                            <span>
                              New notification from company - Check milestone
                              updates
                            </span>
                          </div>
                        )}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "1rem",
                          }}
                        >
                          <h2 style={{ margin: 0 }}>{project.projectName}</h2>
                          <div
                            className="co-location"
                            style={{ marginBottom: "0" }}
                          >
                            <span>
                              <svg
                                className="co-location-icon"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                              </svg>
                              {project.projectAddress}
                            </span>
                          </div>
                        </div>

                        <div className="co-progress-container">
                          <div
                            className={`co-progress-bar ${
                              project.completionPercentage === 100
                                ? "co-progress-bar-finished"
                                : ""
                            }`}
                          >
                            <div
                              className={`co-progress-fill ${
                                project.completionPercentage === 100
                                  ? "co-progress-fill-finished"
                                  : ""
                              }`}
                              style={{
                                width: `${project.completionPercentage || 0}%`,
                              }}
                            ></div>
                          </div>
                          <div className="co-progress-text">
                            <span>
                              Project Completion:{" "}
                              <span className="co-progress-percentage">
                                {project.completionPercentage || 0}%
                              </span>
                            </span>
                            <span>
                              Target: {project.targetCompletionDate || "N/A"}
                            </span>
                          </div>
                        </div>

                        <p>Current phase: {getCurrentPhaseLabel(project)}</p>

                        <div className="co-project-quick-details">
                          <div className="co-quick-item">
                            <span className="co-quick-label">Company</span>
                            <span className="co-quick-value">
                              {project.companyName ||
                                project.company?.companyName ||
                                "N/A"}
                            </span>
                          </div>
                          <div className="co-quick-item">
                            <span className="co-quick-label">Budget</span>
                            <span className="co-quick-value">
                              {formatCurrency(
                                project.estimatedBudget ||
                                  project.paymentDetails?.totalAmount ||
                                  project.proposal?.price,
                              )}
                            </span>
                          </div>
                          <div className="co-quick-item">
                            <span className="co-quick-label">Timeline</span>
                            <span className="co-quick-value">
                              {project.projectTimeline
                                ? `${project.projectTimeline} months`
                                : "N/A"}
                            </span>
                          </div>
                        </div>

                        <div className="co-action-buttons">
                          <button
                            className="co-view-details-btn"
                            onClick={() => toggleUpdates(project._id)}
                            style={{
                              flex: "1",
                              minWidth: "140px",
                              padding: "10px 15px",
                              borderRadius: "8px",
                              border: "2px solid #6b7280",
                              backgroundColor: expandedUpdates[project._id]
                                ? "#6b7280"
                                : "#fff",
                              color: expandedUpdates[project._id]
                                ? "#fff"
                                : "#6b7280",
                              fontWeight: "500",
                              cursor: "pointer",
                              transition: "all 0.2s",
                            }}
                          >
                            {expandedUpdates[project._id]
                              ? "Hide Recent Updates"
                              : "Recent Updates"}
                          </button>
                          <button
                            className="co-view-details-btn"
                            onClick={() => toggleMilestones(project._id)}
                            style={{
                              flex: "1",
                              minWidth: "140px",
                              padding: "10px 15px",
                              borderRadius: "8px",
                              border: "2px solid #6b7280",
                              backgroundColor: expandedMilestones[project._id]
                                ? "#6b7280"
                                : "#fff",
                              color: expandedMilestones[project._id]
                                ? "#fff"
                                : "#6b7280",
                              fontWeight: "500",
                              cursor: "pointer",
                              transition: "all 0.2s",
                            }}
                          >
                            {expandedMilestones[project._id]
                              ? "Hide Milestones"
                              : "Milestones"}
                          </button>
                          <button
                            className="co-view-details-btn"
                            onClick={() => toggleDetails(project._id)}
                            style={{
                              flex: "1",
                              minWidth: "140px",
                              padding: "10px 15px",
                              borderRadius: "8px",
                              border: "2px solid #6c757d",
                              backgroundColor: expandedDetails[project._id]
                                ? "#6c757d"
                                : "#fff",
                              color: expandedDetails[project._id]
                                ? "#fff"
                                : "#6c757d",
                              fontWeight: "500",
                              cursor: "pointer",
                              transition: "all 0.3s",
                            }}
                          >
                            {expandedDetails[project._id]
                              ? "Hide Project Details"
                              : "Project Details"}
                          </button>
                          {project.completionPercentage === 100 &&
                            project.milestones?.find(
                              (m) =>
                                m.percentage === 100 && m.isApprovedByCustomer,
                            ) && (
                              <button
                                className="co-view-details-btn co-view-review-btn"
                                onClick={() =>
                                  setShowReviewProjectId(
                                    showReviewProjectId === project._id
                                      ? null
                                      : project._id,
                                  )
                                }
                                style={{
                                  flex: "1",
                                  minWidth: "140px",
                                  padding: "10px 15px",
                                  borderRadius: "8px",
                                  border: "2px solid #10b981",
                                  backgroundColor:
                                    showReviewProjectId === project._id
                                      ? "#10b981"
                                      : "#ecfdf5",
                                  color:
                                    showReviewProjectId === project._id
                                      ? "#fff"
                                      : "#047857",
                                  fontWeight: "500",
                                  cursor: "pointer",
                                  transition: "all 0.2s",
                                }}
                              >
                                {showReviewProjectId === project._id
                                  ? "Hide Completion"
                                  : "View Completion"}
                              </button>
                            )}
                        </div>

                        {/* PROPOSAL FROM COMPANY SECTION */}
                        {project.proposal &&
                          project.status === "proposal_sent" && (
                            <div
                              style={{
                                marginTop: "20px",
                                padding: "1rem",
                                backgroundColor: "#fef3c7",
                                border: "2px solid #f59e0b",
                                borderRadius: "8px",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  marginBottom: "15px",
                                }}
                              >
                                <h3
                                  style={{
                                    color: "#92400e",
                                    margin: "0",
                                    fontSize: "18px",
                                    fontWeight: "600",
                                  }}
                                >
                                  Proposal from Company
                                </h3>
                                <button
                                  onClick={() => toggleProposal(project._id)}
                                  style={{
                                    backgroundColor: "#f59e0b",
                                    color: "white",
                                    border: "none",
                                    padding: "8px 16px",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    fontWeight: "500",
                                    fontSize: "13px",
                                    transition: "all 0.2s",
                                  }}
                                >
                                  {expandedProposal[project._id]
                                    ? "Hide Details"
                                    : "View Details"}
                                </button>
                              </div>

                              {expandedProposal[project._id] && (
                                <div
                                  style={{
                                    backgroundColor: "#fff",
                                    padding: "15px",
                                    borderRadius: "6px",
                                    border: "1px solid #ffe0b2",
                                    marginBottom: "15px",
                                  }}
                                >
                                  <p style={{ marginTop: "0" }}>
                                    <strong>Proposal Price:</strong>{" "}
                                    {formatCurrency(project.proposal.price)}
                                  </p>
                                  <p>
                                    <strong>Description:</strong>
                                  </p>
                                  <p
                                    style={{
                                      color: "#666",
                                      fontStyle: "italic",
                                      padding: "10px",
                                      backgroundColor: "#f5f5f5",
                                      borderRadius: "4px",
                                    }}
                                  >
                                    {project.proposal.description ||
                                      "No description provided"}
                                  </p>
                                  <p>
                                    <strong>Submitted:</strong>{" "}
                                    {new Date(
                                      project.proposal.sentAt,
                                    ).toLocaleDateString("en-IN", {
                                      day: "numeric",
                                      month: "long",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </p>

                                  {/* PHASES BREAKDOWN */}
                                  {project.proposal.phases &&
                                    project.proposal.phases.length > 0 && (
                                      <div
                                        style={{
                                          marginTop: "15px",
                                          borderTop: "1px solid #ffe0b2",
                                          paddingTop: "15px",
                                        }}
                                      >
                                        <p
                                          style={{
                                            fontWeight: "bold",
                                            marginBottom: "12px",
                                          }}
                                        >
                                          Project Phases (
                                          {project.proposal.phases.length})
                                        </p>
                                        {project.proposal.phases.map(
                                          (phase, idx) => (
                                            <div
                                              key={idx}
                                              style={{
                                                backgroundColor: phase.isFinal
                                                  ? "#fff3e0"
                                                  : "#f5f5f5",
                                                padding: "12px",
                                                borderRadius: "6px",
                                                marginBottom: "10px",
                                                borderLeft: phase.isFinal
                                                  ? "4px solid #d32f2f"
                                                  : "4px solid #1a73e8",
                                              }}
                                            >
                                              <p
                                                style={{
                                                  margin: "0 0 8px 0",
                                                  fontWeight: "bold",
                                                  color: phase.isFinal
                                                    ? "#d32f2f"
                                                    : "#1a73e8",
                                                }}
                                              >
                                                {phase.name}
                                              </p>
                                              <div
                                                style={{
                                                  fontSize: "13px",
                                                  color: "#666",
                                                }}
                                              >
                                                <p style={{ margin: "4px 0" }}>
                                                  <strong>Percentage:</strong>{" "}
                                                  {phase.percentage}%
                                                </p>
                                                <p style={{ margin: "4px 0" }}>
                                                  <strong>Amount:</strong>{" "}
                                                  {formatCurrency(phase.amount)}
                                                </p>
                                                {!phase.isFinal && (
                                                  <p
                                                    style={{ margin: "4px 0" }}
                                                  >
                                                    <strong>Duration:</strong>{" "}
                                                    {phase.requiredMonths}{" "}
                                                    months
                                                  </p>
                                                )}

                                                {/* Work Items */}
                                                {phase.subdivisions &&
                                                  phase.subdivisions.length >
                                                    0 && (
                                                    <div
                                                      style={{
                                                        marginTop: "8px",
                                                        paddingTop: "8px",
                                                        borderTop:
                                                          "1px dashed #ddd",
                                                      }}
                                                    >
                                                      <p
                                                        style={{
                                                          margin: "0 0 6px 0",
                                                          fontWeight: "bold",
                                                          fontSize: "12px",
                                                        }}
                                                      >
                                                        Work Items:
                                                      </p>
                                                      {phase.subdivisions.map(
                                                        (sub, sIdx) => (
                                                          <p
                                                            key={sIdx}
                                                            style={{
                                                              margin: "3px 0",
                                                              fontSize: "12px",
                                                              paddingLeft:
                                                                "10px",
                                                            }}
                                                          >
                                                            •{" "}
                                                            <strong>
                                                              {sub.category}:
                                                            </strong>{" "}
                                                            {sub.description}{" "}
                                                            {sub.amount
                                                              ? `- ${formatCurrency(sub.amount)}`
                                                              : ""}
                                                          </p>
                                                        ),
                                                      )}
                                                    </div>
                                                  )}
                                              </div>
                                            </div>
                                          ),
                                        )}
                                      </div>
                                    )}
                                </div>
                              )}

                              <div
                                style={{
                                  display: "flex",
                                  gap: "10px",
                                  justifyContent: "flex-end",
                                }}
                              >
                                <button
                                  onClick={() =>
                                    handleAcceptProposal(project._id)
                                  }
                                  style={{
                                    backgroundColor: "#10b981",
                                    color: "white",
                                    border: "none",
                                    padding: "12px 30px",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    fontWeight: "600",
                                    fontSize: "14px",
                                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                    transition: "all 0.2s",
                                  }}
                                >
                                  ✓ Accept Proposal
                                </button>
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                    {showReviewProjectId === project._id &&
                      project.completionPercentage === 100 &&
                      project.milestones?.find(
                        (m) => m.percentage === 100 && m.isApprovedByCustomer,
                      ) && (
                        <div className="co-project-completion">
                          {/* Completion Images Gallery */}
                          {project.completionImages &&
                            project.completionImages.length > 0 && (
                              <div>
                                <h4
                                  style={{
                                    color: "#2e7d32",
                                    fontSize: "16px",
                                    marginBottom: "10px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "5px",
                                  }}
                                >
                                  Final Project Completion Photos
                                </h4>
                                <div className="co-completion-gallery">
                                  {project.completionImages.map((img, idx) => (
                                    <img
                                      key={idx}
                                      src={img}
                                      alt={`Completion ${idx + 1}`}
                                      className="co-completion-image"
                                      onMouseEnter={(e) =>
                                        (e.target.style.transform =
                                          "scale(1.05)")
                                      }
                                      onMouseLeave={(e) =>
                                        (e.target.style.transform = "scale(1)")
                                      }
                                      onClick={() =>
                                        window.open(
                                          `/${img}`,
                                          "_blank",
                                        )
                                      }
                                    />
                                  ))}
                                </div>
                              </div>
                            )}

                          {/* Customer Review Display (if already submitted) */}
                          {project.customerReview?.rating ? (
                            <div
                              style={{
                                marginTop:
                                  project.completionImages?.length > 0
                                    ? "20px"
                                    : "0",
                              }}
                            >
                              <h4
                                style={{
                                  color: "#155724",
                                  fontSize: "16px",
                                  marginBottom: "10px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "5px",
                                }}
                              >
                                ✓ Your Review
                              </h4>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "3px",
                                  marginBottom: "8px",
                                }}
                              >
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <span
                                    key={star}
                                    style={{
                                      fontSize: "20px",
                                      color:
                                        star <= project.customerReview.rating
                                          ? "#ffc107"
                                          : "#ddd",
                                    }}
                                  >
                                    ★
                                  </span>
                                ))}
                                <span
                                  style={{
                                    marginLeft: "8px",
                                    fontWeight: "600",
                                    color: "#155724",
                                    fontSize: "16px",
                                  }}
                                >
                                  {project.customerReview.rating}/5
                                </span>
                              </div>
                              {project.customerReview.reviewText && (
                                <p
                                  style={{
                                    color: "#155724",
                                    marginTop: "8px",
                                    fontStyle: "italic",
                                    fontSize: "14px",
                                  }}
                                >
                                  "{project.customerReview.reviewText}"
                                </p>
                              )}
                              <p
                                style={{
                                  color: "#666",
                                  fontSize: "11px",
                                  marginTop: "6px",
                                }}
                              >
                                Submitted:{" "}
                                {new Date(
                                  project.customerReview.reviewDate,
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          ) : (
                            <div
                              style={{
                                marginTop:
                                  project.completionImages?.length > 0
                                    ? "20px"
                                    : "0",
                                padding: "15px",
                                backgroundColor: "#fff",
                                borderRadius: "8px",
                                border: "2px dashed #4CAF50",
                                textAlign: "center",
                              }}
                            >
                              <h4
                                style={{
                                  color: "#2e7d32",
                                  marginBottom: "10px",
                                }}
                              >
                                Rate & Review This Project
                              </h4>
                              <p
                                style={{
                                  color: "#666",
                                  marginBottom: "15px",
                                  fontSize: "14px",
                                }}
                              >
                                Your feedback helps improve our service
                              </p>
                              <button
                                style={{
                                  backgroundColor: "#4CAF50",
                                  color: "white",
                                  border: "none",
                                  padding: "12px 30px",
                                  borderRadius: "8px",
                                  cursor: "pointer",
                                  fontWeight: "600",
                                  fontSize: "16px",
                                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                                }}
                                onClick={() => {
                                  toggleMilestones(project._id);
                                  setTimeout(() => {
                                    document
                                      .getElementById(
                                        `milestones-${project._id}`,
                                      )
                                      ?.scrollIntoView({
                                        behavior: "smooth",
                                        block: "nearest",
                                      });
                                  }, 100);
                                }}
                              >
                                Write Your Review
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                  </div>

                  {/* EXPANDABLE RECENT UPDATES */}
                  <div
                    className={`co-view-details ${
                      expandedUpdates[project._id] ? "active" : ""
                    }`}
                    id={`updates-${project._id}`}
                    style={{
                      border: expandedUpdates[project._id]
                        ? "2px solid #ddd"
                        : "none",
                      borderRadius: "12px",
                      padding: expandedUpdates[project._id] ? "20px" : "0",
                      marginTop: expandedUpdates[project._id] ? "15px" : "0",
                      backgroundColor: expandedUpdates[project._id]
                        ? "#f9f9f9"
                        : "transparent",
                      boxShadow: expandedUpdates[project._id]
                        ? "0 2px 8px rgba(0, 0, 0, 0.08)"
                        : "none",
                    }}
                  >
                    {/* Recent Updates */}
                    <h3
                      style={{
                        color: "#1f2937",
                        fontSize: "1.4rem",
                        fontWeight: "600",
                        marginBottom: "1.5rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      Recent Updates
                    </h3>
                    <div className="co-recent-updates">
                      {project.recentUpdates &&
                      project.recentUpdates.length > 0 ? (
                        project.recentUpdates.map((update, i) => (
                          <div
                            key={i}
                            className="co-update"
                            style={{
                              border: "1px solid #e5e7eb",
                              borderRadius: "10px",
                              padding: "1.25rem",
                              marginBottom: "1.25rem",
                              backgroundColor: "#f9fafb",
                              transition: "all 0.2s",
                            }}
                          >
                            {update.updateImagePath && (
                              <img
                                src={update.updateImagePath}
                                alt="Update"
                                className="co-update-image"
                                style={{ marginBottom: "1rem" }}
                              />
                            )}
                            <div>
                              <p
                                style={{
                                  margin: "0 0 0.5rem 0",
                                  color: "#1f2937",
                                  fontWeight: "600",
                                }}
                              >
                                Update Details
                              </p>
                              <p
                                style={{
                                  color: "#6b7280",
                                  margin: "0 0 0.75rem 0",
                                  lineHeight: "1.6",
                                }}
                              >
                                {update.updateText}
                              </p>
                              <p
                                style={{
                                  fontSize: "0.85rem",
                                  color: "#9ca3af",
                                  marginTop: "0.75rem",
                                  fontWeight: "500",
                                }}
                              >
                                {new Date(update.createdAt).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  },
                                )}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="co-update">
                          <p>No recent updates yet.</p>
                        </div>
                      )}
                    </div>

                    {/* All Images */}
                    <h3
                      style={{
                        color: "#1f2937",
                        fontSize: "1.4rem",
                        fontWeight: "600",
                        marginBottom: "1.5rem",
                        marginTop: "2rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      Project Gallery
                    </h3>
                    <div
                      className="co-images"
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(200px, 1fr))",
                        gap: "15px",
                      }}
                    >
                      {project.additionalImagePaths &&
                      project.additionalImagePaths.length > 0 ? (
                        project.additionalImagePaths.map((img, i) => (
                          <img
                            key={i}
                            src={img}
                            alt={`Additional ${i + 1}`}
                            className="co-additional-image"
                          />
                        ))
                      ) : (
                        <p>No images uploaded yet</p>
                      )}
                    </div>
                  </div>

                  {/* EXPANDABLE MILESTONES */}
                  <div
                    className={`co-view-details ${
                      expandedMilestones[project._id] ? "active" : ""
                    }`}
                    id={`milestones-${project._id}`}
                    style={{
                      border: expandedMilestones[project._id]
                        ? "2px solid #ddd"
                        : "none",
                      borderRadius: "12px",
                      padding: expandedMilestones[project._id] ? "20px" : "0",
                      marginTop: expandedMilestones[project._id] ? "15px" : "0",
                      backgroundColor: expandedMilestones[project._id]
                        ? "#f9f9f9"
                        : "transparent",
                      boxShadow: expandedMilestones[project._id]
                        ? "0 2px 8px rgba(0, 0, 0, 0.08)"
                        : "none",
                    }}
                  >
                    {/* Milestone Progress Section */}
                    {project.milestones ? (
                      <>
                        <h3
                          style={{
                            color: "#1f2937",
                            fontSize: "1.4rem",
                            fontWeight: "600",
                            marginBottom: "1.5rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          Project Milestones & Progress
                        </h3>
                        <div
                          className="co-milestones-list"
                          style={{ marginBottom: "20px" }}
                        >
                          {(() => {
                            const checkpoints = [25, 50, 75, 100];
                            const checkpointMilestones = project.milestones
                              .filter((m) => m.isCheckpoint)
                              .sort((a, b) => a.percentage - b.percentage);
                            const milestoneMap = new Map(
                              checkpointMilestones.map((m) => [
                                m.percentage,
                                m,
                              ]),
                            );
                            const displayMilestones = checkpoints.map(
                              (percentage) =>
                                milestoneMap.get(percentage) || {
                                  percentage,
                                  isCheckpoint: true,
                                  isPlaceholder: true,
                                  isApprovedByCustomer: false,
                                  needsRevision: false,
                                  submittedAt: project.createdAt,
                                  companyMessage: null,
                                },
                            );

                            const payoutByMilestone = new Map(
                              (
                                (project.paymentDetails &&
                                  project.paymentDetails.payouts) ||
                                []
                              ).map((entry) => [
                                Number(entry.milestonePercentage),
                                entry,
                              ]),
                            );

                            const isMilestoneFullyPaid = (percentage) => {
                              const payout = payoutByMilestone.get(
                                Number(percentage),
                              );
                              if (!payout) return false;
                              return (
                                payout.status === "released" &&
                                Number(payout.customerPaidAmount || 0) >=
                                  Number(payout.amount || 0) - CURRENCY_EPSILON
                              );
                            };

                            const unlockedPaymentMilestone = checkpoints.find(
                              (percentage) => !isMilestoneFullyPaid(percentage),
                            );

                            const nextPendingMilestone = displayMilestones
                              .filter(
                                (m) =>
                                  m.isCheckpoint &&
                                  !m.isApprovedByCustomer &&
                                  !m.needsRevision,
                              )
                              .map((m) => m.percentage)
                              .sort((a, b) => a - b)[0];

                            return displayMilestones.map((milestone, idx) => (
                              <div
                                key={idx}
                                className="co-milestone-item"
                                style={{
                                  backgroundColor:
                                    milestone.isApprovedByCustomer
                                      ? "#f0fdf4"
                                      : milestone.needsRevision
                                        ? "#fef2f2"
                                        : "#fffbeb",
                                  border: `2px solid ${milestone.isApprovedByCustomer ? "#22c55e" : milestone.needsRevision ? "#ef5350" : "#f59e0b"}`,
                                  borderRadius: "10px",
                                  padding: "1.5rem",
                                  marginBottom: "1.25rem",
                                  transition:
                                    "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
                                }}
                              >
                                {[25, 50, 75, 100].includes(
                                  milestone.percentage,
                                ) &&
                                  !milestone.isPlaceholder && (
                                    <div
                                      style={{
                                        display: "flex",
                                        justifyContent: "flex-end",
                                        marginBottom: 8,
                                      }}
                                    >
                                      <button
                                        className="co-view-details-btn"
                                        style={{
                                          backgroundColor:
                                            milestone.isApprovedByCustomer
                                              ? "#9ca3af"
                                              : "#ef4444",
                                          color: "white",
                                          border: "none",
                                          padding: "8px 18px",
                                          borderRadius: "8px",
                                          cursor: milestone.isApprovedByCustomer
                                            ? "not-allowed"
                                            : "pointer",
                                          fontWeight: "500",
                                          fontSize: 14,
                                          opacity:
                                            milestone.isApprovedByCustomer
                                              ? 0.6
                                              : 1,
                                          transition: "all 0.2s",
                                        }}
                                        onClick={() =>
                                          !milestone.isApprovedByCustomer &&
                                          handleOpenComplaint(
                                            project._id,
                                            milestone.percentage,
                                          )
                                        }
                                        disabled={
                                          milestone.isApprovedByCustomer
                                        }
                                      >
                                        Report to Admin
                                      </button>
                                    </div>
                                  )}

                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: "10px",
                                  }}
                                >
                                  <div>
                                    <h4 style={{ margin: 0, color: "#333" }}>
                                      {getPhaseForMilestone(
                                        project,
                                        milestone.percentage,
                                      )?.name ||
                                        `${milestone.percentage}% Milestone`}
                                      <span
                                        style={{
                                          marginLeft: "6px",
                                          color: "#666",
                                          fontSize: "0.85em",
                                        }}
                                      >
                                        ({milestone.percentage}%)
                                      </span>
                                      {milestone.isApprovedByCustomer ? (
                                        <span
                                          style={{
                                            marginLeft: "10px",
                                            color: "#047857",
                                            fontSize: "0.9em",
                                            fontWeight: "500",
                                          }}
                                        >
                                          Approved by You
                                        </span>
                                      ) : milestone.needsRevision ? (
                                        <span
                                          style={{
                                            marginLeft: "10px",
                                            color: "#991b1b",
                                            fontSize: "0.9em",
                                            fontWeight: "500",
                                          }}
                                        >
                                          Revision Requested - Awaiting Company
                                          Update
                                        </span>
                                      ) : (
                                        <span
                                          style={{
                                            marginLeft: "10px",
                                            color: "#92400e",
                                            fontSize: "0.9em",
                                            fontWeight: "500",
                                          }}
                                        >
                                          Awaiting Your Approval
                                        </span>
                                      )}
                                    </h4>
                                    <div
                                      style={{
                                        fontSize: "0.85em",
                                        color: "#666",
                                        marginTop: "5px",
                                      }}
                                    >
                                      Submitted:{" "}
                                      {milestone.isPlaceholder
                                        ? "Not submitted yet"
                                        : new Date(
                                            milestone.submittedAt,
                                          ).toLocaleDateString("en-IN", {
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                      {milestone.approvedAt && (
                                        <span style={{ marginLeft: "15px" }}>
                                          Approved:{" "}
                                          {new Date(
                                            milestone.approvedAt,
                                          ).toLocaleDateString("en-IN", {
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric",
                                          })}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div
                                  style={{
                                    backgroundColor: "white",
                                    padding: "1rem",
                                    borderRadius: "8px",
                                    marginTop: "0.75rem",
                                    border: "1px solid #e5e7eb",
                                  }}
                                >
                                  <strong
                                    style={{
                                      display: "block",
                                      marginBottom: "8px",
                                      color: "#555",
                                    }}
                                  >
                                    Latest Company Progress Report:
                                  </strong>
                                  <p
                                    style={{
                                      margin: 0,
                                      lineHeight: "1.6",
                                      color: "#333",
                                    }}
                                  >
                                    {milestone.isPlaceholder
                                      ? "No update yet."
                                      : milestone.companyMessage}
                                  </p>
                                </div>

                                {(() => {
                                  const phase = getPhaseForMilestone(
                                    project,
                                    milestone.percentage,
                                  );
                                  if (!phase) return null;
                                  return (
                                    <div
                                      style={{
                                        backgroundColor: "#f8f9fa",
                                        padding: "12px",
                                        borderRadius: "6px",
                                        marginTop: "10px",
                                        border: "1px solid #dee2e6",
                                      }}
                                    >
                                      <strong
                                        style={{
                                          display: "block",
                                          marginBottom: "8px",
                                          color: "#555",
                                        }}
                                      >
                                        Company Proposed Details:
                                      </strong>
                                      <p
                                        style={{
                                          margin: "0 0 6px 0",
                                          color: "#333",
                                        }}
                                      >
                                        <strong>Phase:</strong>{" "}
                                        {phase.name || "Phase"}
                                      </p>
                                      <p
                                        style={{
                                          margin: "0 0 6px 0",
                                          color: "#333",
                                        }}
                                      >
                                        <strong>Required Months:</strong>{" "}
                                        {phase.requiredMonths || "N/A"}
                                      </p>
                                      <p
                                        style={{
                                          margin: "0 0 6px 0",
                                          color: "#333",
                                        }}
                                      >
                                        <strong>Amount:</strong>{" "}
                                        {formatCurrency(phase.amount)}
                                      </p>
                                      {phase.subdivisions &&
                                        phase.subdivisions.length > 0 && (
                                          <div style={{ marginTop: "10px" }}>
                                            {phase.subdivisions.map(
                                              (sub, sIdx) => (
                                                <div
                                                  key={sIdx}
                                                  style={{
                                                    backgroundColor: "#fff",
                                                    padding: "8px",
                                                    borderRadius: "6px",
                                                    marginBottom: "6px",
                                                    borderLeft:
                                                      "4px solid #6c757d",
                                                  }}
                                                >
                                                  <p
                                                    style={{
                                                      margin: 0,
                                                      color: "#333",
                                                    }}
                                                  >
                                                    <strong>
                                                      {sub.category ||
                                                        "Work Item"}
                                                      :
                                                    </strong>{" "}
                                                    {sub.description || ""}
                                                    {sub.amount
                                                      ? ` - ${formatCurrency(sub.amount)}`
                                                      : ""}
                                                  </p>
                                                </div>
                                              ),
                                            )}
                                          </div>
                                        )}
                                    </div>
                                  );
                                })()}

                                {/* Conversation History */}
                                {(() => {
                                  const conversation =
                                    milestone.conversation &&
                                    milestone.conversation.length > 0
                                      ? milestone.conversation
                                      : [
                                          milestone.companyMessage
                                            ? {
                                                sender: "company",
                                                message:
                                                  milestone.companyMessage,
                                                timestamp:
                                                  milestone.submittedAt ||
                                                  milestone.createdAt ||
                                                  new Date(),
                                              }
                                            : null,
                                          milestone.customerFeedback
                                            ? {
                                                sender: "customer",
                                                message:
                                                  milestone.customerFeedback,
                                                timestamp:
                                                  milestone.updatedAt ||
                                                  milestone.approvedAt ||
                                                  new Date(),
                                              }
                                            : null,
                                        ].filter(Boolean);

                                  if (!conversation.length) return null;

                                  return (
                                    <div
                                      style={{
                                        backgroundColor: "#f8fafc",
                                        padding: "1rem",
                                        borderRadius: "8px",
                                        marginTop: "0.75rem",
                                        border: "1px solid #e2e8f0",
                                      }}
                                    >
                                      <strong
                                        style={{
                                          display: "block",
                                          marginBottom: "12px",
                                          color: "#475569",
                                          fontSize: "0.9375rem",
                                        }}
                                      >
                                        💬 Full Conversation (
                                        {conversation.length}{" "}
                                        {conversation.length === 1
                                          ? "message"
                                          : "messages"}
                                        )
                                      </strong>
                                      <div
                                        style={{
                                          maxHeight: "300px",
                                          overflowY: "auto",
                                        }}
                                      >
                                        {conversation.map((msg, msgIdx) => (
                                          <div
                                            key={msgIdx}
                                            style={{
                                              backgroundColor:
                                                msg.sender === "company"
                                                  ? "#dbeafe"
                                                  : "#fef3c7",
                                              padding: "0.875rem",
                                              borderRadius: "8px",
                                              marginBottom: "0.75rem",
                                              borderLeft: `3px solid ${msg.sender === "company" ? "#3b82f6" : "#f59e0b"}`,
                                            }}
                                          >
                                            <div
                                              style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                marginBottom: "6px",
                                                fontSize: "0.8125rem",
                                                color: "#64748b",
                                              }}
                                            >
                                              <strong
                                                style={{
                                                  color:
                                                    msg.sender === "company"
                                                      ? "#1e40af"
                                                      : "#92400e",
                                                }}
                                              >
                                                {msg.sender === "company"
                                                  ? "🏢 Company"
                                                  : "👤 You"}
                                              </strong>
                                              <span>
                                                {new Date(
                                                  msg.timestamp,
                                                ).toLocaleString("en-IN", {
                                                  day: "numeric",
                                                  month: "short",
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                                })}
                                              </span>
                                            </div>
                                            <p
                                              style={{
                                                margin: 0,
                                                lineHeight: "1.5",
                                                color: "#333",
                                              }}
                                            >
                                              {msg.message}
                                            </p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })()}

                                {milestone.needsRevision &&
                                  milestone.customerFeedback && (
                                    <div
                                      style={{
                                        backgroundColor: "#fef3c7",
                                        padding: "1rem",
                                        borderRadius: "8px",
                                        marginTop: "0.75rem",
                                        border: "2px solid #f59e0b",
                                      }}
                                    >
                                      <strong
                                        style={{
                                          display: "block",
                                          marginBottom: "8px",
                                          color: "#92400e",
                                          fontSize: "0.9375rem",
                                        }}
                                      >
                                        Awaiting Company Response to Your
                                        Feedback:
                                      </strong>
                                      <p
                                        style={{
                                          margin: 0,
                                          lineHeight: "1.6",
                                          color: "#1f2937",
                                        }}
                                      >
                                        {milestone.customerFeedback}
                                      </p>
                                    </div>
                                  )}

                                {/* Action buttons for non-approved milestones (< 100%) */}
                                {!milestone.isPlaceholder &&
                                  !milestone.isApprovedByCustomer &&
                                  !milestone.needsRevision &&
                                  milestone.percentage ===
                                    nextPendingMilestone && (
                                    <div
                                      style={{
                                        marginTop: "15px",
                                        display: "flex",
                                        gap: "10px",
                                        flexWrap: "wrap",
                                      }}
                                    >
                                      <button
                                        className="co-view-details-btn"
                                        style={{
                                          backgroundColor: "#10b981",
                                          color: "white",
                                          border: "none",
                                          padding: "10px 20px",
                                          borderRadius: "8px",
                                          cursor: "pointer",
                                          fontWeight: "600",
                                          transition: "all 0.2s",
                                        }}
                                        onClick={() =>
                                          handleApproveMilestone(
                                            project._id,
                                            milestone.percentage,
                                          )
                                        }
                                      >
                                        Approve & Proceed
                                      </button>
                                      <button
                                        className="co-view-details-btn"
                                        style={{
                                          backgroundColor: "#f59e0b",
                                          color: "white",
                                          border: "none",
                                          padding: "10px 20px",
                                          borderRadius: "8px",
                                          cursor: "pointer",
                                          fontWeight: "600",
                                          transition: "all 0.2s",
                                        }}
                                        onClick={() =>
                                          setShowRevisionModal(
                                            `${project._id}_${milestone.percentage}`,
                                          )
                                        }
                                      >
                                        Request Revision
                                      </button>
                                    </div>
                                  )}

                                {/* Special handling for 100% milestone - Show Approve First, Then Review */}
                                {!milestone.isPlaceholder &&
                                  !milestone.isApprovedByCustomer &&
                                  !milestone.needsRevision &&
                                  milestone.percentage === 100 && (
                                    <div
                                      style={{
                                        marginTop: "15px",
                                        display: "flex",
                                        gap: "10px",
                                        flexWrap: "wrap",
                                      }}
                                    >
                                      <button
                                        className="co-view-details-btn"
                                        style={{
                                          backgroundColor: "#10b981",
                                          color: "white",
                                          border: "none",
                                          padding: "10px 20px",
                                          borderRadius: "8px",
                                          cursor: "pointer",
                                          fontWeight: "600",
                                          transition: "all 0.2s",
                                        }}
                                        onClick={() =>
                                          handleApproveMilestone(
                                            project._id,
                                            milestone.percentage,
                                          )
                                        }
                                      >
                                        Approve & Complete Project
                                      </button>
                                      <button
                                        className="co-view-details-btn"
                                        style={{
                                          backgroundColor: "#f59e0b",
                                          color: "white",
                                          border: "none",
                                          padding: "10px 20px",
                                          borderRadius: "8px",
                                          cursor: "pointer",
                                          fontWeight: "600",
                                          transition: "all 0.2s",
                                        }}
                                        onClick={() =>
                                          setShowRevisionModal(
                                            `${project._id}_${milestone.percentage}`,
                                          )
                                        }
                                      >
                                        Request Changes
                                      </button>
                                    </div>
                                  )}

                                {/* Payment Section - Always show for non-paid milestones */}
                                {!milestone.isPaid && (
                                  <div
                                    style={{
                                      marginTop: "15px",
                                      padding: "1rem",
                                      backgroundColor: "#eff6ff",
                                      borderRadius: "8px",
                                      border: "2px solid #3b82f6",
                                    }}
                                  >
                                    <h5
                                      style={{
                                        color: "#1e40af",
                                        marginTop: 0,
                                        fontSize: "1rem",
                                      }}
                                    >
                                      Payment Schedule
                                    </h5>
                                    {(() => {
                                      const schedule =
                                        getPaymentScheduleForMilestone(
                                          project,
                                          milestone,
                                        );
                                      if (!schedule) return null;

                                      const upfrontPaid =
                                        schedule.upfront.status ===
                                          "released" ||
                                        schedule.upfront.status === "paid";
                                      const isCurrentPaymentMilestone =
                                        Number(milestone.percentage) ===
                                        Number(unlockedPaymentMilestone);
                                      const isFullyPaidMilestone =
                                        isMilestoneFullyPaid(
                                          milestone.percentage,
                                        );
                                      const shouldLockPayment =
                                        !isCurrentPaymentMilestone &&
                                        !isFullyPaidMilestone;
                                      const waitingForApprovalAfterUpfront =
                                        isCurrentPaymentMilestone &&
                                        upfrontPaid &&
                                        !milestone.isApprovedByCustomer &&
                                        !milestone.isPlaceholder;

                                      return (
                                        <>
                                          {shouldLockPayment ? (
                                            <div
                                              style={{
                                                padding: "10px",
                                                borderRadius: "6px",
                                                backgroundColor: "#f8fafc",
                                                color: "#334155",
                                                border: "1px solid #cbd5e1",
                                              }}
                                            >
                                              Payment for this phase will open
                                              after previous phase payment is
                                              fully completed.
                                            </div>
                                          ) : (
                                            <>
                                              {/* STEP 1: Full phase payment triggers 75% release */}
                                              {!upfrontPaid && (
                                                <div
                                                  style={{
                                                    marginBottom: "10px",
                                                  }}
                                                >
                                                  <div
                                                    style={{
                                                      display: "flex",
                                                      justifyContent:
                                                        "space-between",
                                                      alignItems: "center",
                                                      marginBottom: "8px",
                                                    }}
                                                  >
                                                    <span>
                                                      Full Phase Payment (75%
                                                      releases immediately)
                                                    </span>
                                                    <span
                                                      style={{
                                                        fontWeight: "600",
                                                        color: "#1a73e8",
                                                      }}
                                                    >
                                                      {formatCurrency(
                                                        schedule.upfront.amount,
                                                      )}
                                                    </span>
                                                  </div>
                                                  {schedule.upfront.status ===
                                                    "pending" && (
                                                    <button
                                                      className="co-view-details-btn"
                                                      style={{
                                                        backgroundColor:
                                                          "#1a73e8",
                                                        color: "white",
                                                        border: "none",
                                                        padding: "8px 15px",
                                                        borderRadius: "4px",
                                                        cursor: "pointer",
                                                        fontWeight: "600",
                                                        width: "100%",
                                                      }}
                                                      onClick={() =>
                                                        handlePayMilestone(
                                                          project._id,
                                                          milestone.percentage,
                                                        )
                                                      }
                                                    >
                                                      Pay for This Phase
                                                    </button>
                                                  )}
                                                </div>
                                              )}

                                              {/* Show initial release status if paid */}
                                              {upfrontPaid && (
                                                <div
                                                  style={{
                                                    marginBottom: "10px",
                                                    padding: "10px",
                                                    backgroundColor: "#e8f5e9",
                                                    borderRadius: "6px",
                                                  }}
                                                >
                                                  <div
                                                    style={{
                                                      display: "flex",
                                                      justifyContent:
                                                        "space-between",
                                                      alignItems: "center",
                                                    }}
                                                  >
                                                    <span>
                                                      75% Released to Company
                                                    </span>
                                                    <span
                                                      style={{
                                                        fontWeight: "600",
                                                        color: "#2e7d32",
                                                      }}
                                                    >
                                                      {formatCurrency(
                                                        schedule.upfront.amount,
                                                      )}
                                                    </span>
                                                  </div>
                                                  <div
                                                    style={{
                                                      color: "#2e7d32",
                                                      fontWeight: "600",
                                                      fontSize: "14px",
                                                      marginTop: "5px",
                                                    }}
                                                  >
                                                    Paid and released
                                                  </div>
                                                </div>
                                              )}

                                              {waitingForApprovalAfterUpfront && (
                                                <div
                                                  style={{
                                                    marginBottom: "10px",
                                                    padding: "10px",
                                                    backgroundColor: "#f8fafc",
                                                    borderRadius: "6px",
                                                    border: "1px solid #cbd5e1",
                                                    color: "#334155",
                                                    fontSize: "13px",
                                                    fontWeight: 500,
                                                  }}
                                                >
                                                  Payment section is locked.
                                                  Final 25% will be enabled
                                                  after company completion
                                                  request and your approval.
                                                </div>
                                              )}

                                              {/* STEP 2: Release held 25% after approval */}
                                              {milestone.isApprovedByCustomer &&
                                                upfrontPaid &&
                                                !milestone.isPlaceholder && (
                                                  <div
                                                    style={{
                                                      marginBottom: "10px",
                                                      borderTop:
                                                        "1px solid #ddd",
                                                      paddingTop: "10px",
                                                    }}
                                                  >
                                                    <div
                                                      style={{
                                                        display: "flex",
                                                        justifyContent:
                                                          "space-between",
                                                        alignItems: "center",
                                                        marginBottom: "8px",
                                                      }}
                                                    >
                                                      <span>
                                                        25% Held Amount (After
                                                        Approval)
                                                      </span>
                                                      <span
                                                        style={{
                                                          fontWeight: "600",
                                                          color: "#28a745",
                                                        }}
                                                      >
                                                        {formatCurrency(
                                                          schedule.completion
                                                            .amount,
                                                        )}
                                                      </span>
                                                    </div>
                                                    {schedule.completion
                                                      .status === "pending" && (
                                                      <button
                                                        className="co-view-details-btn"
                                                        style={{
                                                          backgroundColor:
                                                            "#28a745",
                                                          color: "white",
                                                          border: "none",
                                                          padding: "8px 15px",
                                                          borderRadius: "4px",
                                                          cursor: "pointer",
                                                          fontWeight: "600",
                                                          width: "100%",
                                                        }}
                                                        onClick={() =>
                                                          handlePayMilestone(
                                                            project._id,
                                                            milestone.percentage,
                                                          )
                                                        }
                                                      >
                                                        Release Held 25%
                                                      </button>
                                                    )}
                                                    {schedule.completion
                                                      .status ===
                                                      "released" && (
                                                      <div
                                                        style={{
                                                          color: "#2e7d32",
                                                          fontWeight: "600",
                                                          fontSize: "14px",
                                                        }}
                                                      >
                                                        Held 25% Released
                                                      </div>
                                                    )}
                                                  </div>
                                                )}
                                              {schedule.completion.status ===
                                                "released" && (
                                                <div
                                                  style={{
                                                    marginTop: "10px",
                                                    color: "#7c2d12",
                                                    fontWeight: 600,
                                                    fontSize: "13px",
                                                  }}
                                                >
                                                  Platform manager must collect
                                                  the company platform fee
                                                  before the next phase can
                                                  start.
                                                </div>
                                              )}
                                            </>
                                          )}
                                        </>
                                      );
                                    })()}
                                  </div>
                                )}

                                {/* Review & Rating Form - Only show after 100% is approved and review not submitted yet */}
                                {milestone.isApprovedByCustomer &&
                                  milestone.percentage === 100 &&
                                  !project.customerReview?.rating && (
                                    <div
                                      style={{
                                        marginTop: "20px",
                                        padding: "15px",
                                        backgroundColor: "#fff",
                                        borderRadius: "8px",
                                        border: "2px solid #4CAF50",
                                      }}
                                    >
                                      <h4
                                        style={{
                                          color: "#2e7d32",
                                          marginBottom: "15px",
                                        }}
                                      >
                                        Rate & Review This Project
                                      </h4>
                                      <p
                                        style={{
                                          color: "#666",
                                          marginBottom: "15px",
                                          fontSize: "14px",
                                        }}
                                      >
                                        Share your experience with this
                                        construction project
                                      </p>

                                      <div style={{ marginBottom: "15px" }}>
                                        <label
                                          style={{
                                            display: "block",
                                            marginBottom: "8px",
                                            fontWeight: "600",
                                            color: "#333",
                                          }}
                                        >
                                          Your Rating *
                                        </label>
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                          }}
                                        >
                                          {[1, 2, 3, 4, 5].map((star) => (
                                            <span
                                              key={star}
                                              style={{
                                                fontSize: "32px",
                                                cursor: "pointer",
                                                color:
                                                  star <=
                                                  (hoveredRating[project._id] ||
                                                    reviewRating[project._id] ||
                                                    0)
                                                    ? "#ffc107"
                                                    : "#ddd",
                                                transition: "color 0.2s",
                                              }}
                                              onMouseEnter={() =>
                                                setHoveredRating((prev) => ({
                                                  ...prev,
                                                  [project._id]: star,
                                                }))
                                              }
                                              onMouseLeave={() =>
                                                setHoveredRating((prev) => ({
                                                  ...prev,
                                                  [project._id]: 0,
                                                }))
                                              }
                                              onClick={() =>
                                                setReviewRating((prev) => ({
                                                  ...prev,
                                                  [project._id]: star,
                                                }))
                                              }
                                            >
                                              ★
                                            </span>
                                          ))}
                                          {reviewRating[project._id] && (
                                            <span
                                              style={{
                                                marginLeft: "10px",
                                                fontWeight: "600",
                                                color: "#2e7d32",
                                              }}
                                            >
                                              {reviewRating[project._id]}/5
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      <div style={{ marginBottom: "15px" }}>
                                        <label
                                          style={{
                                            display: "block",
                                            marginBottom: "8px",
                                            fontWeight: "600",
                                            color: "#333",
                                          }}
                                        >
                                          Your Review (Optional)
                                        </label>
                                        <textarea
                                          style={{
                                            width: "100%",
                                            padding: "10px",
                                            borderRadius: "6px",
                                            border: "1px solid #ddd",
                                            minHeight: "100px",
                                            resize: "vertical",
                                            fontFamily: "inherit",
                                          }}
                                          placeholder="Share your experience with the construction quality, timeline, communication, etc..."
                                          value={reviewText[project._id] || ""}
                                          onChange={(e) =>
                                            setReviewText((prev) => ({
                                              ...prev,
                                              [project._id]: e.target.value,
                                            }))
                                          }
                                        />
                                      </div>

                                      <div
                                        style={{ display: "flex", gap: "10px" }}
                                      >
                                        <button
                                          className="co-view-details-btn"
                                          style={{
                                            backgroundColor: "#10b981",
                                            color: "white",
                                            border: "none",
                                            padding: "10px 20px",
                                            borderRadius: "8px",
                                            cursor: "pointer",
                                            fontWeight: "600",
                                            transition: "all 0.2s",
                                          }}
                                          onClick={() =>
                                            handleSubmitReview(project._id)
                                          }
                                        >
                                          Submit Review
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                {showRevisionModal ===
                                  `${project._id}_${milestone.percentage}` && (
                                  <div
                                    style={{
                                      marginTop: "15px",
                                      padding: "1rem",
                                      backgroundColor: "white",
                                      borderRadius: "8px",
                                      border: "2px solid #f59e0b",
                                    }}
                                  >
                                    <label
                                      style={{
                                        display: "block",
                                        marginBottom: "8px",
                                        fontWeight: "600",
                                        color: "#1f2937",
                                      }}
                                    >
                                      Provide feedback for revision:
                                    </label>
                                    <textarea
                                      style={{
                                        width: "100%",
                                        padding: "10px",
                                        borderRadius: "6px",
                                        border: "1px solid #e5e7eb",
                                        minHeight: "80px",
                                        resize: "vertical",
                                      }}
                                      placeholder="Please specify what needs to be revised or improved..."
                                      value={
                                        revisionFeedback[
                                          `${project._id}_${milestone.percentage}`
                                        ] || ""
                                      }
                                      onChange={(e) =>
                                        setRevisionFeedback((prev) => ({
                                          ...prev,
                                          [`${project._id}_${milestone.percentage}`]:
                                            e.target.value,
                                        }))
                                      }
                                    />
                                    <div
                                      style={{
                                        marginTop: "10px",
                                        display: "flex",
                                        gap: "10px",
                                      }}
                                    >
                                      <button
                                        className="co-view-details-btn"
                                        style={{
                                          backgroundColor: "#f59e0b",
                                          color: "white",
                                          border: "none",
                                          padding: "8px 16px",
                                          borderRadius: "8px",
                                          cursor: "pointer",
                                          fontWeight: "500",
                                          transition: "all 0.2s",
                                        }}
                                        onClick={() =>
                                          handleRequestRevision(
                                            project._id,
                                            milestone.percentage,
                                          )
                                        }
                                      >
                                        Submit Revision Request
                                      </button>
                                      <button
                                        className="co-view-details-btn"
                                        style={{
                                          backgroundColor: "#6b7280",
                                          color: "white",
                                          border: "none",
                                          padding: "8px 16px",
                                          borderRadius: "8px",
                                          cursor: "pointer",
                                          fontWeight: "500",
                                          transition: "all 0.2s",
                                        }}
                                        onClick={() => {
                                          setShowRevisionModal(null);
                                          setRevisionFeedback((prev) => {
                                            const newState = { ...prev };
                                            delete newState[
                                              `${project._id}_${milestone.percentage}`
                                            ];
                                            return newState;
                                          });
                                        }}
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ));
                          })()}
                        </div>
                      </>
                    ) : (
                      <div className="co-no-projects">
                        <p>No milestones have been submitted yet.</p>
                      </div>
                    )}
                  </div>

                  {/* EXPANDABLE PROJECT DETAILS */}
                  <div
                    className={`co-view-details ${
                      expandedDetails[project._id] ? "active" : ""
                    }`}
                    id={`details-${project._id}`}
                    style={{
                      border: expandedDetails[project._id]
                        ? "2px solid #ddd"
                        : "none",
                      borderRadius: "12px",
                      padding: expandedDetails[project._id] ? "20px" : "0",
                      marginTop: expandedDetails[project._id] ? "15px" : "0",
                      backgroundColor: expandedDetails[project._id]
                        ? "#f9f9f9"
                        : "transparent",
                      boxShadow: expandedDetails[project._id]
                        ? "0 2px 8px rgba(0, 0, 0, 0.08)"
                        : "none",
                    }}
                  >
                    {/* Project Submission Details */}
                    <div className="co-project-submission-details">
                      <h3
                        style={{
                          color: "#1f2937",
                          fontSize: "1.4rem",
                          fontWeight: "600",
                          marginBottom: "1.5rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        Project Details & Information
                      </h3>

                      <div
                        className="co-section"
                        style={{
                          border: "1px solid #e5e7eb",
                          borderRadius: "10px",
                          padding: "1.25rem",
                          marginBottom: "1.25rem",
                          backgroundColor: "#f9fafb",
                          transition: "all 0.2s",
                        }}
                      >
                        <h4
                          style={{
                            color: "#1f2937",
                            marginTop: 0,
                            marginBottom: "1rem",
                            fontWeight: "600",
                          }}
                        >
                          Customer Information
                        </h4>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "1rem",
                          }}
                        >
                          <p style={{ marginBottom: "0.5rem" }}>
                            <strong style={{ color: "#374151" }}>
                              Full Name:
                            </strong>
                            <br />
                            <span style={{ color: "#6b7280" }}>
                              {project.customerName}
                            </span>
                          </p>
                          <p style={{ marginBottom: "0.5rem" }}>
                            <strong style={{ color: "#374151" }}>Email:</strong>
                            <br />
                            <span style={{ color: "#6b7280" }}>
                              {project.customerEmail}
                            </span>
                          </p>
                          <p style={{ marginBottom: "0" }}>
                            <strong style={{ color: "#374151" }}>Phone:</strong>
                            <br />
                            <span style={{ color: "#6b7280" }}>
                              {project.customerPhone}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div
                        className="co-section"
                        style={{
                          border: "1px solid #e5e7eb",
                          borderRadius: "10px",
                          padding: "1.25rem",
                          marginBottom: "1.25rem",
                          backgroundColor: "#f9fafb",
                          transition: "all 0.2s",
                        }}
                      >
                        <h4
                          style={{
                            color: "#1f2937",
                            marginTop: 0,
                            marginBottom: "1rem",
                            fontWeight: "600",
                          }}
                        >
                          Project Details
                        </h4>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "1rem",
                          }}
                        >
                          <p style={{ marginBottom: "0.5rem" }}>
                            <strong style={{ color: "#374151" }}>
                              Address:
                            </strong>
                            <br />
                            <span
                              style={{ color: "#6b7280", fontSize: "0.95rem" }}
                            >
                              {project.projectAddress}
                            </span>
                          </p>
                          <p style={{ marginBottom: "0.5rem" }}>
                            <strong style={{ color: "#374151" }}>
                              Location:
                            </strong>
                            <br />
                            <span style={{ color: "#6b7280" }}>
                              {project.projectLocation}
                            </span>
                          </p>
                          <p style={{ marginBottom: "0.5rem" }}>
                            <strong style={{ color: "#374151" }}>Area:</strong>
                            <br />
                            <span style={{ color: "#6b7280" }}>
                              {project.totalArea} sq meters
                            </span>
                          </p>
                          <p style={{ marginBottom: "0.5rem" }}>
                            <strong style={{ color: "#374151" }}>
                              Building Type:
                            </strong>
                            <br />
                            <span
                              style={{
                                color: "#6b7280",
                                textTransform: "capitalize",
                              }}
                            >
                              {project.buildingType
                                ? project.buildingType.charAt(0).toUpperCase() +
                                  project.buildingType.slice(1)
                                : "Other"}
                            </span>
                          </p>
                          <p style={{ marginBottom: "0.5rem" }}>
                            <strong style={{ color: "#374151" }}>
                              Budget:
                            </strong>
                            <br />
                            <span
                              style={{ color: "#059669", fontWeight: "500" }}
                            >
                              {project.estimatedBudget
                                ? `₹${project.estimatedBudget.toLocaleString()}`
                                : "Not specified"}
                            </span>
                          </p>
                          <p style={{ marginBottom: "0" }}>
                            <strong style={{ color: "#374151" }}>
                              Timeline:
                            </strong>
                            <br />
                            <span style={{ color: "#6b7280" }}>
                              {project.projectTimeline
                                ? `${project.projectTimeline} months`
                                : "Not specified"}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div
                        className="co-section"
                        style={{
                          border: "1px solid #e5e7eb",
                          borderRadius: "10px",
                          padding: "1.25rem",
                          marginBottom: "1.25rem",
                          backgroundColor: "#f9fafb",
                        }}
                      >
                        <h4
                          style={{
                            color: "#1f2937",
                            marginTop: 0,
                            marginBottom: "1rem",
                            fontWeight: "600",
                          }}
                        >
                          Floor Plans
                        </h4>
                        <p style={{ color: "#6b7280", marginBottom: "1rem" }}>
                          <strong style={{ color: "#374151" }}>
                            Total Floors:
                          </strong>{" "}
                          <span style={{ color: "#1f2937", fontWeight: "500" }}>
                            {project.totalFloors}
                          </span>
                        </p>
                        {project.floors && project.floors.length > 0 ? (
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                              gap: "1rem",
                            }}
                          >
                            {project.floors.map((floor, i) => (
                              <div
                                key={i}
                                className="co-floor-plan"
                                style={{
                                  borderLeft: "3px solid #3b82f6",
                                  paddingLeft: "1rem",
                                }}
                              >
                                <p
                                  style={{
                                    marginTop: 0,
                                    marginBottom: "0.5rem",
                                  }}
                                >
                                  <strong style={{ color: "#1f2937" }}>
                                    Floor {floor.floorNumber || i + 1}
                                  </strong>
                                </p>
                                <p
                                  style={{
                                    marginBottom: "0.5rem",
                                    fontSize: "0.9rem",
                                  }}
                                >
                                  <strong style={{ color: "#374151" }}>
                                    Type:
                                  </strong>{" "}
                                  <span style={{ color: "#6b7280" }}>
                                    {floor.floorType
                                      ? floor.floorType
                                          .charAt(0)
                                          .toUpperCase() +
                                        floor.floorType.slice(1)
                                      : "Other"}
                                  </span>
                                </p>
                                <p
                                  style={{
                                    marginBottom: "0.5rem",
                                    fontSize: "0.9rem",
                                  }}
                                >
                                  <strong style={{ color: "#374151" }}>
                                    Area:
                                  </strong>{" "}
                                  <span style={{ color: "#6b7280" }}>
                                    {floor.floorArea || "Not specified"} sq m
                                  </span>
                                </p>
                                <p
                                  style={{
                                    marginBottom: "0.5rem",
                                    fontSize: "0.9rem",
                                  }}
                                >
                                  <strong style={{ color: "#374151" }}>
                                    Description:
                                  </strong>{" "}
                                  <span style={{ color: "#6b7280" }}>
                                    {floor.floorDescription || "Not specified"}
                                  </span>
                                </p>
                                {floor.floorImagePath && (
                                  <img
                                    src={floor.floorImagePath}
                                    alt={`Floor ${floor.floorNumber || i + 1} Plan`}
                                    style={{
                                      width: "100%",
                                      borderRadius: "6px",
                                      marginTop: "0.5rem",
                                    }}
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p style={{ color: "#6b7280", fontStyle: "italic" }}>
                            Floor plans not yet available
                          </p>
                        )}
                      </div>

                      <div
                        className="co-section"
                        style={{
                          border: "1px solid #e5e7eb",
                          borderRadius: "10px",
                          padding: "1.25rem",
                          marginBottom: "1.25rem",
                          backgroundColor: "#f9fafb",
                        }}
                      >
                        <h4
                          style={{
                            color: "#1f2937",
                            marginTop: 0,
                            marginBottom: "1rem",
                            fontWeight: "600",
                          }}
                        >
                          Additional Requirements
                        </h4>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "1rem",
                          }}
                        >
                          <p style={{ marginBottom: "0.5rem" }}>
                            <strong style={{ color: "#374151" }}>
                              Special Requirements:
                            </strong>
                            <br />
                            <span
                              style={{ color: "#6b7280", fontSize: "0.95rem" }}
                            >
                              {project.specialRequirements || "None specified"}
                            </span>
                          </p>
                          <p style={{ marginBottom: "0.5rem" }}>
                            <strong style={{ color: "#374151" }}>
                              Accessibility Needs:
                            </strong>
                            <br />
                            <span
                              style={{
                                color: "#6b7280",
                                fontSize: "0.95rem",
                                textTransform: "capitalize",
                              }}
                            >
                              {project.accessibilityNeeds
                                ? project.accessibilityNeeds
                                    .charAt(0)
                                    .toUpperCase() +
                                  project.accessibilityNeeds.slice(1)
                                : "None specified"}
                            </span>
                          </p>
                          <p style={{ marginBottom: "0" }}>
                            <strong style={{ color: "#374151" }}>
                              Energy Efficiency:
                            </strong>
                            <br />
                            <span
                              style={{
                                color: "#6b7280",
                                fontSize: "0.95rem",
                                textTransform: "capitalize",
                              }}
                            >
                              {project.energyEfficiency
                                ? project.energyEfficiency
                                    .charAt(0)
                                    .toUpperCase() +
                                  project.energyEfficiency.slice(1)
                                : "Standard"}
                            </span>
                          </p>
                        </div>
                      </div>

                      {getProposalPhases(project).length > 0 && (
                        <div
                          className="co-section"
                          style={{
                            border: "1px solid #e5e7eb",
                            borderRadius: "10px",
                            padding: "1.25rem",
                            marginBottom: "1.25rem",
                            backgroundColor: "#f9fafb",
                          }}
                        >
                          <h4
                            style={{
                              color: "#1f2937",
                              marginTop: 0,
                              marginBottom: "1rem",
                              fontWeight: "600",
                            }}
                          >
                            Company Proposed Phases
                          </h4>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr",
                              gap: "1rem",
                            }}
                          >
                            {getProposalPhases(project).map((phase, idx) => (
                              <div
                                key={idx}
                                style={{
                                  borderLeft: "4px solid #8b5cf6",
                                  paddingLeft: "1rem",
                                  paddingTop: "0.75rem",
                                  paddingBottom: "0.75rem",
                                  backgroundColor: "#fff",
                                  borderRadius: "6px",
                                  padding: "1rem",
                                }}
                              >
                                <p
                                  style={{
                                    marginTop: 0,
                                    marginBottom: "0.5rem",
                                  }}
                                >
                                  <strong
                                    style={{
                                      color: "#1f2937",
                                      fontSize: "1rem",
                                    }}
                                  >
                                    {phase.name || `Phase ${idx + 1}`}
                                  </strong>
                                </p>
                                <div
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr 1fr",
                                    gap: "1rem",
                                    fontSize: "0.9rem",
                                  }}
                                >
                                  <p style={{ marginBottom: "0" }}>
                                    <strong style={{ color: "#374151" }}>
                                      Completion:
                                    </strong>
                                    <br />
                                    <span
                                      style={{
                                        color: "#059669",
                                        fontWeight: "500",
                                      }}
                                    >
                                      {phase.percentage || 25}%
                                    </span>
                                  </p>
                                  <p style={{ marginBottom: "0" }}>
                                    <strong style={{ color: "#374151" }}>
                                      Duration:
                                    </strong>
                                    <br />
                                    <span style={{ color: "#6b7280" }}>
                                      {phase.requiredMonths || "N/A"} months
                                    </span>
                                  </p>
                                  <p style={{ marginBottom: "0" }}>
                                    <strong style={{ color: "#374151" }}>
                                      Amount:
                                    </strong>
                                    <br />
                                    <span
                                      style={{
                                        color: "#059669",
                                        fontWeight: "500",
                                      }}
                                    >
                                      {formatCurrency(phase.amount)}
                                    </span>
                                  </p>
                                </div>
                                {phase.subdivisions &&
                                  phase.subdivisions.length > 0 && (
                                    <div
                                      style={{
                                        marginTop: "0.75rem",
                                        paddingTop: "0.75rem",
                                        borderTop: "1px solid #e5e7eb",
                                      }}
                                    >
                                      <p
                                        style={{
                                          marginBottom: "0.5rem",
                                          fontSize: "0.9rem",
                                          fontWeight: "500",
                                          color: "#374151",
                                        }}
                                      >
                                        Work Items:
                                      </p>
                                      {phase.subdivisions.map((sub, sIdx) => (
                                        <p
                                          key={sIdx}
                                          style={{
                                            marginBottom: "0.25rem",
                                            fontSize: "0.85rem",
                                            color: "#6b7280",
                                            paddingLeft: "1rem",
                                          }}
                                        >
                                          •{" "}
                                          <strong>
                                            {sub.category || "Work Item"}:
                                          </strong>{" "}
                                          {sub.description || ""}
                                          {sub.amount
                                            ? ` - ${formatCurrency(sub.amount)}`
                                            : ""}
                                        </p>
                                      ))}
                                    </div>
                                  )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              ))
            ) : (
              <div className="co-no-projects">
                <p>
                  No ongoing projects found. All accepted projects will appear
                  here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Complaint Modal */}
      <Modal
        isOpen={!!showComplaintModal}
        onRequestClose={handleCloseComplaint}
        contentLabel="Complaint Modal"
        ariaHideApp={false}
        style={{
          overlay: { zIndex: 1000, backgroundColor: "rgba(0,0,0,0.4)" },
          content: {
            top: "50%",
            left: "50%",
            right: "auto",
            bottom: "auto",
            marginRight: "-50%",
            transform: "translate(-50%, -50%)",
            borderRadius: "12px",
            padding: "32px",
            width: "90%",
            maxWidth: "400px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
          },
        }}
      >
        <h2 style={{ marginBottom: 18 }}>Report/Complaint</h2>
        <button
          onClick={handleCloseComplaint}
          style={{
            position: "absolute",
            top: 16,
            right: 20,
            fontSize: 22,
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          ✖
        </button>
        <div style={{ margin: "20px 0" }}>
          <textarea
            rows={4}
            style={{
              width: "100%",
              borderRadius: 6,
              border: "1px solid #aaa",
              padding: 10,
              fontSize: 15,
            }}
            placeholder="Describe your complaint or issue..."
            value={complaintText[showComplaintModal] || ""}
            onChange={(e) =>
              setComplaintText((prev) => ({
                ...prev,
                [showComplaintModal]: e.target.value,
              }))
            }
          />
        </div>
        {complaintError && (
          <div style={{ color: "red", marginBottom: 10 }}>{complaintError}</div>
        )}
        {complaintSuccess && (
          <div style={{ color: "green", marginBottom: 10 }}>
            Complaint submitted successfully!
          </div>
        )}
        <div
          style={{
            marginBottom: 12,
            padding: 10,
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            maxHeight: 220,
            overflowY: "auto",
            backgroundColor: "#f8fafc",
          }}
        >
          <strong style={{ display: "block", marginBottom: 8 }}>
            Complaint Thread
          </strong>
          {complaintHistoryLoading ? (
            <p style={{ margin: 0, color: "#64748b" }}>
              Loading complaint history...
            </p>
          ) : complaintHistory.length ? (
            complaintHistory.map((item) => (
              <div
                key={item._id}
                style={{
                  marginBottom: 10,
                  paddingBottom: 10,
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                <p style={{ margin: "0 0 6px 0" }}>
                  <strong>You:</strong> {item.message}
                </p>
                <p
                  style={{
                    margin: "0 0 6px 0",
                    fontSize: 12,
                    color: "#64748b",
                  }}
                >
                  {new Date(item.createdAt).toLocaleString()}
                </p>
                {item.replies?.length ? (
                  item.replies.map((reply) => (
                    <p
                      key={reply._id || `${reply.adminId}-${reply.createdAt}`}
                      style={{ margin: "4px 0 0 0", color: "#1e293b" }}
                    >
                      <strong>{reply.adminName || "Platform Manager"}:</strong>{" "}
                      {reply.message}
                    </p>
                  ))
                ) : (
                  <p style={{ margin: 0, color: "#94a3b8", fontSize: 13 }}>
                    No reply yet
                  </p>
                )}
              </div>
            ))
          ) : (
            <p style={{ margin: 0, color: "#94a3b8" }}>
              No complaints for this milestone yet.
            </p>
          )}
        </div>
        <button
          onClick={() => {
            const [projectId, milestone] = showComplaintModal.split("_");
            handleSubmitComplaint(projectId, milestone);
          }}
          disabled={
            complaintLoading ||
            !(
              complaintText[showComplaintModal] &&
              complaintText[showComplaintModal].trim()
            )
          }
          style={{
            backgroundColor: "#dc3545",
            color: "white",
            border: "none",
            padding: "10px 30px",
            borderRadius: "6px",
            fontWeight: "600",
            width: "100%",
            fontSize: 16,
          }}
        >
          {complaintLoading ? "Submitting..." : "Submit Complaint"}
        </button>
      </Modal>

      {/* ── Company project Razorpay payment modal ── */}
      {paymentModal && (
        <CompanyPaymentModal
          isOpen={true}
          onClose={() => setPaymentModal(null)}
          onSuccess={handlePaymentSuccess}
          project={paymentModal.project}
          milestonePercentage={paymentModal.milestonePercentage}
        />
      )}
    </>
  );
};

export default CustomerOngoing;
