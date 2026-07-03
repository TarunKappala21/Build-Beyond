import React, { useState, useEffect } from "react";
import axiosInstance from '../../../../api/axiosInstance';
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import "./CustomerJobStatus.css";
import ReviewModal from "../../../../components/ReviewModal/ReviewModal";
import ReviewDisplay from "../../../../components/ReviewDisplay/ReviewDisplay";
import CustomerPageLoader from "../common/CustomerPageLoader";
import { useGlobalChat } from "../../../../context/GlobalChatContext";

const CustomerJobStatus = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { openChat } = useGlobalChat();
  const [activeTab, setActiveTab] = useState("cjs-architect-section");
  const [statusFilters, setStatusFilters] = useState({
    architect: "all",
    interior: "all",
    company: "all",
  });
  const [applications, setApplications] = useState({
    architect: [],
    interior: [],
    company: [],
  });
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({});
  const [lightboxImage, setLightboxImage] = useState(null);
  const [revisionModal, setRevisionModal] = useState({
    isOpen: false,
    projectId: null,
    milestoneId: null,
    projectType: null,
    notes: "",
  });
  const [reviewModal, setReviewModal] = useState({
    isOpen: false,
    projectId: null,
    projectName: null,
    projectType: null,
  });
  const [phasesModal, setPhasesModal] = useState({
    isOpen: false,
    projectId: null,
    projectType: null,
    phases: [],
    proposalData: null,
  });
  const [proposalModal, setProposalModal] = useState({
    isOpen: false,
    projectId: null,
    projectType: null,
    proposal: null,
  });
  const [companyDetailsModal, setCompanyDetailsModal] = useState({
    isOpen: false,
    project: null,
  });

  const navigateToServiceDetails = (app, type) => {
    if (type === "architect") {
      const workerId = app.assignedWorkerDetails?._id || app.worker?._id;
      if (workerId) {
        navigate(`/customerdashboard/architect?workerId=${workerId}`);
      }
      return;
    }

    if (type === "interior") {
      const workerId = app.assignedWorkerDetails?._id || app.workerId?._id;
      if (workerId) {
        navigate(`/customerdashboard/interior_designer?workerId=${workerId}`);
      }
      return;
    }

    if (type === "company") {
      const companyId = app.assignedCompanyDetails?._id || app.companyId?._id;
      if (companyId) {
        navigate(
          `/customerdashboard/construction_companies_list?companyId=${companyId}`,
        );
      }
    }
  };

  const fetchJobStatus = async () => {
    try {
      const res = await axiosInstance.get("/api/job_status", {
        withCredentials: true,
      });
      const data = res.data;

      // Sort applications by creation date (most recent first)
      const sortByDate = (apps) =>
        (apps || []).sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        );

      setApplications({
        architect: sortByDate(data.architectApplications),
        interior: sortByDate(data.interiorApplications),
        company: sortByDate(data.companyApplications),
      });
    } catch (err) {
      console.error("Failed to load job status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobStatus();
  }, []);

  useEffect(() => {
    const projectId = searchParams.get("projectId");
    if (
      !projectId ||
      Object.keys(applications).every((key) => applications[key].length === 0)
    ) {
      return;
    }

    const tabMap = {
      "cjs-architect-section": "cjs-architect-section",
      architect: "cjs-architect-section",
      "cjs-interior-section": "cjs-interior-section",
      interior: "cjs-interior-section",
      "cjs-company-section": "cjs-company-section",
      company: "cjs-company-section",
    };

    const targetTab = tabMap[searchParams.get("tab") || ""];
    if (targetTab) {
      setActiveTab(targetTab);
    }

    const targetSection = searchParams.get("section") || "card";

    const foundType = ["architect", "interior", "company"].find((type) =>
      applications[type].some((app) => String(app._id) === String(projectId)),
    );

    if (!foundType) {
      return;
    }

    const tabByType = {
      architect: "cjs-architect-section",
      interior: "cjs-interior-section",
      company: "cjs-company-section",
    };

    setActiveTab(tabByType[foundType]);
    setExpandedSections((prev) => ({
      ...prev,
      [`${projectId}-card`]: true,
      ...(targetSection ? { [`${projectId}-${targetSection}`]: true } : {}),
    }));

    const scrollTimer = window.setTimeout(() => {
      document.getElementById(`cjs-${projectId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);

    const highlightSection = [
      "card",
      "details",
      "milestones",
      "updates",
    ].includes(targetSection)
      ? targetSection
      : "card";

    const highlightTimer = window.setTimeout(() => {
      const sectionTargetId = `cjs-${projectId}-${highlightSection}`;
      const targetElement =
        document.getElementById(sectionTargetId) ||
        document.getElementById(`cjs-${projectId}`);

      if (!targetElement) return;

      targetElement.classList.add("cjs-notification-highlight");
      window.setTimeout(() => {
        targetElement.classList.remove("cjs-notification-highlight");
      }, 3500);
    }, 200);

    return () => {
      window.clearTimeout(scrollTimer);
      window.clearTimeout(highlightTimer);
    };
  }, [searchParams, applications]);

  const handleTabClick = (tabId) => setActiveTab(tabId);

  const handleStatusFilter = (section, status) => {
    setStatusFilters((prev) => ({ ...prev, [section]: status }));
  };

  const filterApplicationsByStatus = (apps, status) => {
    if (status === "all") return apps;
    return apps.filter((app) => {
      const rawStatus = app.status?.toLowerCase() || "";
      const appStatus =
        rawStatus === "pending payment" ? "pending_payment" : rawStatus;
      return appStatus === status.toLowerCase();
    });
  };

  const getStatusCounts = (apps) => {
    const counts = {
      all: apps.length,
      pending: 0,
      pending_payment: 0,
      accepted: 0,
      rejected: 0,
      completed: 0,
    };

    apps.forEach((app) => {
      const rawStatus = app.status?.toLowerCase() || "";
      const status =
        rawStatus === "pending payment" ? "pending_payment" : rawStatus;
      if (counts.hasOwnProperty(status)) {
        counts[status]++;
      }
    });

    return counts;
  };

  const toggleSection = (appId, section) => {
    const key = `${appId}-${section}`;
    setExpandedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const isSectionExpanded = (appId, section) => {
    const key = `${appId}-${section}`;
    return !!expandedSections[key];
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const formatDateTime = (dateString) =>
    new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatStatusLabel = (status) => {
    if (status === "pending_payment") return "Pending Payment";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const jobStatusSections = {
    "cjs-architect-section": {
      tabLabel: "Architecture",
      icon: "🏛️",
      title: "My Architect Applications",
      subtitle: "Monitor your architect hiring requests and project progress",
      emptyMessage: "You haven't submitted any architect applications yet.",
    },
    "cjs-interior-section": {
      tabLabel: "Interior Design",
      icon: "🛋️",
      title: "My Interior Design Requests",
      subtitle: "Monitor your interior design requests and project progress",
      emptyMessage:
        "You haven't submitted any interior designer applications yet.",
    },
    "cjs-company-section": {
      tabLabel: "Construction",
      icon: "🏗️",
      title: "My Construction Projects",
      subtitle:
        "Track your construction company applications and project status",
      emptyMessage:
        "You haven't submitted any construction company applications yet.",
    },
  };

  const handleApproveMilestone = async (
    projectId,
    milestoneId,
    projectType,
  ) => {
    try {
      const res = await axiosInstance.post(
        `/api/customer/milestone/approve/${projectId}/${milestoneId}`,
        { projectType },
        { withCredentials: true },
      );

      if (res.data.success) {
        // Check if there's a redirect to payment page for next milestone
        if (res.data.redirect) {
          navigate(res.data.redirect);
        } else {
          // No more milestones or no redirect needed
          fetchJobStatus();
        }
      }
    } catch (error) {
      console.error("Error approving milestone:", error);
      alert(error.response?.data?.error || "Failed to approve milestone");
    }
  };

  const handleRejectMilestone = async (projectId, milestoneId, projectType) => {
    const reason = prompt("Please provide a reason for rejection (optional):");
    try {
      const res = await axiosInstance.post(
        `/api/customer/milestone/reject/${projectId}/${milestoneId}`,
        { projectType, reason },
        { withCredentials: true },
      );
      if (res.data.success) {
        alert("Milestone rejected");
        fetchJobStatus();
      }
    } catch (error) {
      console.error("Error rejecting milestone:", error);
      alert(error.response?.data?.error || "Failed to reject milestone");
    }
  };

  const handleRequestRevision = (projectId, milestoneId, projectType) => {
    setRevisionModal({
      isOpen: true,
      projectId,
      milestoneId,
      projectType,
      notes: "",
    });
  };

  const handleSubmitRevision = async () => {
    if (!revisionModal.notes.trim()) {
      alert("Please provide revision notes");
      return;
    }

    try {
      const res = await axiosInstance.post(
        `/api/customer/milestone/request-revision/${revisionModal.projectId}/${revisionModal.milestoneId}`,
        {
          projectType: revisionModal.projectType,
          revisionNotes: revisionModal.notes,
        },
        { withCredentials: true },
      );
      if (res.data.success) {
        alert("Revision request sent to worker!");
        setRevisionModal({
          isOpen: false,
          projectId: null,
          milestoneId: null,
          projectType: null,
          notes: "",
        });
        fetchJobStatus();
      }
    } catch (error) {
      console.error("Error requesting revision:", error);
      alert(error.response?.data?.error || "Failed to request revision");
    }
  };

  const handleCloseRevisionModal = () => {
    setRevisionModal({
      isOpen: false,
      projectId: null,
      milestoneId: null,
      projectType: null,
      notes: "",
    });
  };

  const handleReportToAdmin = async (projectId, milestoneId, projectType) => {
    const reportReason = prompt(
      "Please describe the issue to report to admin:",
    );
    if (!reportReason || !reportReason.trim()) {
      alert("Report reason is required");
      return;
    }

    try {
      const res = await axiosInstance.post(
        `/api/customer/milestone/report-to-admin/${projectId}/${milestoneId}`,
        { projectType, reportReason },
        { withCredentials: true },
      );
      if (res.data.success) {
        alert("Milestone reported to admin for review!");
        fetchJobStatus();
      }
    } catch (error) {
      console.error("Error reporting to admin:", error);
      alert(error.response?.data?.error || "Failed to report to admin");
    }
  };

  // Check if project is 100% complete
  const isProjectComplete = (app) => {
    if (!app.milestones || app.milestones.length === 0) return false;
    const totalProgress = app.milestones
      .filter((m) => m.status === "Approved")
      .reduce((sum, m) => sum + m.percentage, 0);
    return totalProgress >= 100;
  };

  // Check if customer has already reviewed
  const hasCustomerReviewed = (app) => {
    return (
      app.review &&
      app.review.customerToWorker &&
      app.review.customerToWorker.rating
    );
  };

  // Open review modal
  const openReviewModal = (projectId, projectName, projectType) => {
    setReviewModal({
      isOpen: true,
      projectId,
      projectName,
      projectType,
    });
  };

  // Submit review
  const handleSubmitReview = async ({ rating, comment }) => {
    try {
      const res = await axiosInstance.post(
        "/api/customer/review",
        {
          projectId: reviewModal.projectId,
          projectType: reviewModal.projectType,
          rating,
          comment,
        },
        { withCredentials: true },
      );

      if (res.data) {
        alert("Review submitted successfully!");
        setReviewModal({
          isOpen: false,
          projectId: null,
          projectName: null,
          projectType: null,
        });
        fetchJobStatus();

        // Check if project is now completed (both reviews done)
        if (res.data.isProjectCompleted) {
          alert("Both reviews completed! Project moved to Completed section.");
        }
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      alert(error.response?.data?.error || "Failed to submit review");
      throw error;
    }
  };

  const renderCollapsibleButtons = (
    appId,
    hasMilestones,
    hasUpdates,
    chatConfig = null,
    showChat = true,
  ) => {
    return (
      <div className="cjs-collapsible-buttons">
        <button
          className="cjs-section-btn"
          onClick={() => toggleSection(appId, "details")}
        >
          {isSectionExpanded(appId, "details") ? "▼" : "▶"} Project Details
        </button>
        {hasMilestones && (
          <button
            className="cjs-section-btn cjs-milestone-btn"
            onClick={() => toggleSection(appId, "milestones")}
          >
            {isSectionExpanded(appId, "milestones") ? "▼" : "▶"} Progress
            Milestones
          </button>
        )}
        {hasUpdates && (
          <button
            className="cjs-section-btn cjs-updates-btn"
            onClick={() => toggleSection(appId, "updates")}
          >
            {isSectionExpanded(appId, "updates") ? "▼" : "▶"} Project Updates
          </button>
        )}
        {showChat && chatConfig?.enabled && (
          <button
            className="cjs-section-btn cjs-chat-btn"
            onClick={() =>
              openChatModal(
                chatConfig.projectId,
                chatConfig.projectType,
                chatConfig.projectName,
                chatConfig.otherUserName,
              )
            }
          >
            Message Worker
          </button>
        )}
      </div>
    );
  };

  const openChatModal = (
    projectId,
    projectType,
    projectName,
    otherUserName,
  ) => {
    openChat({
      projectId,
      projectType,
      projectName,
      otherUserName,
      userRole: "customer",
    });
  };

  const renderMilestones = (app, projectType) => {
    if (!app.milestones || app.milestones.length === 0) return null;

    const sortedMilestones = [...app.milestones].sort(
      (a, b) => b.percentage - a.percentage,
    );

    return (
      <div className="cjs-milestones-section" id={`cjs-${app._id}-milestones`}>
        <h4>Project Milestones</h4>
        <div className="cjs-milestones-grid">
          {sortedMilestones.map((milestone) => (
            <div
              key={milestone._id}
              className={`cjs-milestone-card cjs-milestone-${milestone.status.toLowerCase()}`}
            >
              <div className="cjs-milestone-header">
                <span className="cjs-milestone-percentage">
                  {milestone.percentage}%
                </span>
                <span
                  className={`cjs-milestone-status cjs-status-${milestone.status.toLowerCase().replace(" ", "-")}`}
                >
                  {milestone.status === "Pending" && "⏳ Pending Approval"}
                  {milestone.status === "Approved" && "✅ Approved"}
                  {milestone.status === "Rejected" && "❌ Rejected"}
                  {milestone.status === "Revision Requested" &&
                    "🔄 Revision Requested"}
                  {milestone.status === "Under Review" &&
                    "🚨 Under Admin Review"}
                </span>
              </div>
              <div className="cjs-milestone-date">
                Submitted: {formatDateTime(milestone.submittedAt)}
              </div>
              <div className="cjs-milestone-description">
                <p>{milestone.description}</p>
              </div>
              {milestone.image && (
                <div className="cjs-milestone-image-container">
                  <img
                    src={milestone.image}
                    alt={`${milestone.percentage}% milestone`}
                    className="cjs-milestone-image"
                    onClick={() => setLightboxImage(milestone.image)}
                  />
                </div>
              )}
              {milestone.status === "Pending" && (
                <div className="cjs-milestone-actions">
                  <button
                    className="cjs-btn-approve"
                    onClick={() =>
                      handleApproveMilestone(
                        app._id,
                        milestone._id,
                        projectType,
                      )
                    }
                  >
                    ✓ Approve
                  </button>
                  <button
                    className="cjs-btn-revision"
                    onClick={() =>
                      handleRequestRevision(app._id, milestone._id, projectType)
                    }
                  >
                    🔄 Request Revision
                  </button>
                  <button
                    className="cjs-btn-report"
                    onClick={() =>
                      handleReportToAdmin(app._id, milestone._id, projectType)
                    }
                  >
                    🚨 Report to Admin
                  </button>
                </div>
              )}
              {milestone.status === "Approved" && milestone.approvedAt && (
                <div className="cjs-milestone-approved-date">
                  Approved: {formatDateTime(milestone.approvedAt)}
                </div>
              )}
              {milestone.status === "Rejected" && milestone.rejectedAt && (
                <div className="cjs-milestone-rejected-info">
                  <div>Rejected: {formatDateTime(milestone.rejectedAt)}</div>
                  {milestone.rejectionReason && (
                    <div>Reason: {milestone.rejectionReason}</div>
                  )}
                </div>
              )}
              {milestone.status === "Revision Requested" && (
                <div className="cjs-milestone-revision-info">
                  <div>
                    Revision Requested:{" "}
                    {formatDateTime(milestone.revisionRequestedAt)}
                  </div>
                  <div className="cjs-revision-notes">
                    <strong>Notes:</strong> {milestone.revisionNotes}
                  </div>
                </div>
              )}
              {milestone.status === "Under Review" && (
                <div className="cjs-milestone-review-info">
                  <div>
                    Reported to Admin:{" "}
                    {formatDateTime(milestone.reportedToAdminAt)}
                  </div>
                  <div className="cjs-admin-report">
                    <strong>Issue:</strong> {milestone.adminReport}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Review Section - Show when project is 100% complete */}
        {isProjectComplete(app) && !hasCustomerReviewed(app) && (
          <div className="cjs-review-prompt">
            <div className="cjs-review-prompt-content">
              <i className="fas fa-star"></i>
              <h4>Project Complete!</h4>
              <p>
                This project has reached 100% completion. Please rate and review
                your experience with the worker.
              </p>
              <button
                className="cjs-btn-review"
                onClick={() =>
                  openReviewModal(app._id, app.projectName, projectType)
                }
              >
                ⭐ Rate & Review Worker
              </button>
            </div>
          </div>
        )}

        {/* Display Reviews if completed */}
        {app.review &&
          (app.review.customerToWorker || app.review.workerToCustomer) && (
            <ReviewDisplay review={app.review} userType="customer" />
          )}
      </div>
    );
  };

  const renderUpdates = (app) => {
    if (!app.projectUpdates || app.projectUpdates.length === 0) return null;

    const sortedUpdates = [...app.projectUpdates].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );

    return (
      <div className="cjs-updates-section" id={`cjs-${app._id}-updates`}>
        <h4>Project Updates</h4>
        <div className="cjs-updates-list">
          {sortedUpdates.map((update, index) => (
            <div key={index} className="cjs-update-item">
              <div className="cjs-update-date">
                {formatDateTime(update.createdAt)}
              </div>
              <div className="cjs-update-text">{update.updateText}</div>
              {update.updateImage && (
                <img
                  src={update.updateImage}
                  alt="Update"
                  className="cjs-update-image"
                  onClick={() => setLightboxImage(update.updateImage)}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleAcceptProposal = async (projectId, type) => {
    if (
      !confirm(
        `Are you sure you want to accept this proposal and mark payment as complete?`,
      )
    ) {
      return;
    }

    try {
      let endpoint;
      if (type === "company") {
        endpoint = `/api/customer/accept-company-proposal/${projectId}`;
      } else {
        endpoint = `/api/customer/accept-proposal/${type}/${projectId}`;
      }

      const res = await axiosInstance.get(endpoint, { withCredentials: true });

      if (res.data.success) {
        alert(
          res.data.message || "Proposal accepted! Redirecting to payment...",
        );
        if (type === "company") {
          navigate("/customerdashboard/job_status");
        } else if (res.data.redirect) {
          navigate(res.data.redirect);
        } else {
          fetchJobStatus();
        }
      }
    } catch (error) {
      console.error("Error accepting proposal:", error);
      alert(error.response?.data?.error || "Failed to accept proposal");
    }
  };

  const handleRejectProposal = async (projectId, type) => {
    const reason = prompt("Please provide a reason for rejection (optional):");
    if (reason === null) return;

    try {
      let endpoint;
      if (type === "company") {
        endpoint = `/api/customer/reject-company-proposal/${projectId}`;
      } else {
        endpoint = `/api/customer/reject-proposal/${type}/${projectId}`;
      }

      const res = await axiosInstance.post(
        endpoint,
        { reason },
        { withCredentials: true },
      );

      if (res.data.success) {
        alert("Proposal rejected successfully!");
        fetchJobStatus();
      }
    } catch (error) {
      console.error("Error rejecting proposal:", error);
      alert(error.response?.data?.error || "Failed to reject proposal");
    }
  };

  const renderProposal = (app, type) => {
    const isProposalSent = ["proposal_sent", "Proposal Sent"].includes(
      app.status,
    );
    const isAccepted = app.status?.toLowerCase() === "accepted";
    const normalizedStatus = (app.status || "").toLowerCase();
    const isPendingPayment =
      normalizedStatus === "pending payment" ||
      normalizedStatus === "pending_payment";

    if (isProposalSent && app.proposal) {
      return (
        <div className="cjs-proposal-section">
          <div className="cjs-proposal-price">
            ₹{app.proposal.price.toLocaleString("en-IN")}
          </div>
          <button
            onClick={() =>
              setProposalModal({
                isOpen: true,
                projectId: app._id,
                projectType: type,
                proposal: app.proposal,
              })
            }
            className="cjs-btn-accept-pay"
          >
            View Details
          </button>
        </div>
      );
    }

    if (isAccepted && app.proposal) {
      return (
        <p style={{ color: "green" }}>
          Accepted job for ₹{app.proposal.price.toLocaleString("en-IN")}
        </p>
      );
    }

    if (isPendingPayment && (type === "architect" || type === "interior")) {
      return (
        <div className="cjs-proposal-section">
          <p style={{ marginBottom: "10px", color: "#c77900" }}>
            Proposal accepted. Initial deposit payment is pending.
          </p>
          <button
            className="cjs-btn-accept-pay"
            onClick={() =>
              navigate(
                `/customerdashboard/payment-checkout/${app._id}?type=${type}&payment=deposit`,
              )
            }
          >
            Pay Initial Deposit
          </button>
        </div>
      );
    }

    return (
      <p>
        Waiting for the {type === "company" ? "company" : type} to submit a
        proposal.
      </p>
    );
  };

  const getEditAvailability = (app, type) => {
    const status = (app.status || "").toLowerCase();

    if (status !== "pending") {
      return {
        canEdit: false,
        reason: "Editing is available only while the request is pending.",
      };
    }

    if (type === "architect" || type === "interior") {
      if (app.proposal?.price || app.proposal?.description) {
        return {
          canEdit: false,
          reason: "Editing is locked after proposal activity starts.",
        };
      }
      if ((app.milestones || []).length > 0) {
        return {
          canEdit: false,
          reason: "Editing is locked after milestone activity starts.",
        };
      }
      if ((app.projectUpdates || []).length > 0) {
        return {
          canEdit: false,
          reason: "Editing is locked after project updates are posted.",
        };
      }
      return { canEdit: true, reason: "" };
    }

    if (type === "company") {
      if (app.proposal?.price || app.proposal?.description) {
        return {
          canEdit: false,
          reason: "Editing is locked after proposal activity starts.",
        };
      }
      if ((app.milestones || []).length > 0) {
        return {
          canEdit: false,
          reason: "Editing is locked after milestone activity starts.",
        };
      }
      if ((app.recentUpdates || []).length > 0) {
        return {
          canEdit: false,
          reason: "Editing is locked after project updates are posted.",
        };
      }
      if ((app.completionPercentage || 0) > 0) {
        return {
          canEdit: false,
          reason: "Editing is locked once progress has started.",
        };
      }
      return { canEdit: true, reason: "" };
    }

    return { canEdit: false, reason: "Editing is not available." };
  };

  const handleEditRequest = (app, type) => {
    const params = new URLSearchParams();
    params.set("editId", app._id);

    if (type === "architect") {
      const workerId = app.worker?._id || app.worker;
      if (workerId) params.set("workerId", workerId);
    }
    if (type === "interior") {
      const workerId = app.workerId?._id || app.workerId;
      if (workerId) params.set("workerId", workerId);
    }
    if (type === "company") {
      const companyId = app.companyId?._id || app.companyId;
      if (companyId) params.set("companyId", companyId);
    }

    const pathMap = {
      architect: "/customerdashboard/architect_form",
      interior: "/customerdashboard/interiordesign_form",
      company: "/customerdashboard/constructionform",
    };

    navigate(`${pathMap[type]}?${params.toString()}`);
  };

  const renderEditAction = (app, type) => {
    const { canEdit, reason } = getEditAvailability(app, type);

    return (
      <div className="cjs-edit-action">
        <button
          type="button"
          className="cjs-btn-edit-request"
          onClick={() => handleEditRequest(app, type)}
          disabled={!canEdit}
          title={canEdit ? "Edit this request" : reason}
        >
          Edit Request
        </button>
        {!canEdit && <p className="cjs-edit-lock-reason">{reason}</p>}
      </div>
    );
  };

  const renderCardToggle = (appId, sectionLabel) => {
    const isExpanded = isSectionExpanded(appId, "card");

    return (
      <button
        type="button"
        className="cjs-card-toggle"
        onClick={() => toggleSection(appId, "card")}
      >
        {isExpanded ? "▼" : "▶"} {sectionLabel}
      </button>
    );
  };

  const formatLocation = (location) => {
    if (!location) return "Not available";
    if (typeof location === "string") return location;

    const locationParts = [
      location.city,
      location.state,
      location.country,
      location.pincode || location.postalCode,
    ].filter(Boolean);

    return locationParts.length > 0
      ? locationParts.join(", ")
      : "Not available";
  };

  const isHiredOrAccepted = (status) => {
    const normalized = (status || "").toLowerCase();
    return [
      "accepted",
      "completed",
      "pending payment",
      "pending_payment",
    ].includes(normalized);
  };

  const renderHireDetails = (app, type, wrapperClass = "") => {
    const hiringStatus = isHiredOrAccepted(app.status)
      ? "Hired"
      : "Trying to hire";

    const isPopulatedEntity = (entity, kind) => {
      if (!entity || typeof entity !== "object" || Array.isArray(entity)) {
        return false;
      }

      return kind === "company"
        ? Boolean(entity.companyName || entity.contactPerson || entity.email)
        : Boolean(entity.name || entity.email || entity.phone);
    };

    if (type === "company") {
      const company =
        app.assignedCompanyDetails ||
        (isPopulatedEntity(app.companyId, "company") ? app.companyId : null);

      return (
        <div className={`cjs-worker-details-card ${wrapperClass}`.trim()}>
          <div className="cjs-section-title">Company Details</div>
          <p>
            <strong>Status:</strong> {hiringStatus}
          </p>
          <p>
            <strong>Company Name:</strong>{" "}
            {company?.companyName ? (
              <button
                type="button"
                className="cjs-name-link"
                onClick={() => navigateToServiceDetails(app, "company")}
              >
                {company.companyName}
              </button>
            ) : (
              "Not assigned yet"
            )}
          </p>
          <p>
            <strong>Contact Person:</strong>{" "}
            {company?.contactPerson || "Not available"}
          </p>
          <p>
            <strong>Email:</strong> {company?.email || "Not available"}
          </p>
          <p>
            <strong>Phone:</strong> {company?.phone || "Not available"}
          </p>
          <p>
            <strong>Location:</strong> {formatLocation(company?.location)}
          </p>
        </div>
      );
    }

    const workerRef = type === "architect" ? app.worker : app.workerId;
    const worker =
      app.assignedWorkerDetails ||
      (isPopulatedEntity(workerRef, "worker") ? workerRef : null);

    return (
      <div className={`cjs-worker-details-card ${wrapperClass}`.trim()}>
        <div className="cjs-section-title">Worker Details</div>
        <p>
          <strong>Status:</strong> {hiringStatus}
        </p>
        <p>
          <strong>Name:</strong>{" "}
          {worker?.name ? (
            <button
              type="button"
              className="cjs-name-link"
              onClick={() => navigateToServiceDetails(app, type)}
            >
              {worker.name}
            </button>
          ) : (
            "Not assigned yet"
          )}
        </p>
        <p>
          <strong>Email:</strong> {worker?.email || "Not available"}
        </p>
        <p>
          <strong>Phone:</strong> {worker?.phone || "Not available"}
        </p>
        <p>
          <strong>Specialization:</strong>{" "}
          {worker?.specialization || "Not available"}
        </p>
        <p>
          <strong>Experience:</strong>{" "}
          {worker?.experience !== undefined && worker?.experience !== null
            ? `${worker.experience} years`
            : "Not available"}
        </p>
      </div>
    );
  };

  const renderArchitectApp = (app) => {
    const hasMilestones = app.milestones && app.milestones.length > 0;
    const hasUpdates = app.projectUpdates && app.projectUpdates.length > 0;
    const pendingMilestones = hasMilestones
      ? app.milestones.filter((m) => m.status === "Pending").length
      : 0;
    const workerName =
      app.assignedWorkerDetails?.name || app.worker?.name || "Worker";

    return (
      <div
        key={app._id}
        id={`cjs-${app._id}`}
        className="cjs-application cjs-architect-app"
      >
        <div className="cjs-status-container">
          <div className="cjs-status cjs-architect-status">{app.status}</div>
          {renderCardToggle(app._id, "Card Details")}
        </div>

        <div className="cjs-project-header-row">
          <h3>
            <span className="cjs-project-name">{app.projectName}</span>
          </h3>

          <div className="cjs-proposal-corner cjs-proposal-actions">
            <div className="cjs-proposal-container">
              {renderProposal(app, "architect")}
            </div>

            {isHiredOrAccepted(app.status) && (
              <button
                type="button"
                className="cjs-section-btn cjs-chat-btn"
                onClick={() =>
                  openChatModal(
                    app._id,
                    "architect",
                    app.projectName,
                    workerName,
                  )
                }
              >
                Message Worker
              </button>
            )}
          </div>
        </div>

        <div className="cjs-date-info">
          Submitted: {formatDate(app.createdAt)}
        </div>

        {isSectionExpanded(app._id, "card") && (
          <>
            {renderEditAction(app, "architect")}

            {renderHireDetails(app, "architect", "cjs-hire-details-inline")}

            {pendingMilestones > 0 && (
              <div className="cjs-pending-notice">
                ⚠️ {pendingMilestones} milestone
                {pendingMilestones > 1 ? "s" : ""} pending your approval
              </div>
            )}

            {renderCollapsibleButtons(
              app._id,
              hasMilestones,
              hasUpdates,
              {
                enabled: isHiredOrAccepted(app.status),
                projectId: app._id,
                projectType: "architect",
                projectName: app.projectName,
                otherUserName: workerName,
              },
              false,
            )}

            {isSectionExpanded(app._id, "details") && (
              <div
                className="cjs-application-data-section"
                id={`cjs-${app._id}-details`}
              >
                <div className="cjs-application-data">
                  <div className="cjs-section-title">Customer Details</div>
                  <p>
                    <strong>Name:</strong> {app.customerDetails?.fullName}
                  </p>
                  <p>
                    <strong>Email:</strong> {app.customerDetails?.email}
                  </p>
                  <p>
                    <strong>Contact:</strong>{" "}
                    {app.customerDetails?.contactNumber}
                  </p>
                </div>

                <div className="cjs-application-data">
                  <div className="cjs-section-title">Customer Address</div>
                  <p>
                    <strong>Street:</strong>{" "}
                    {app.customerAddress?.streetAddress}
                  </p>
                  <p>
                    <strong>City:</strong> {app.customerAddress?.city}
                  </p>
                  <p>
                    <strong>State:</strong> {app.customerAddress?.state}
                  </p>
                  <p>
                    <strong>Zip Code:</strong> {app.customerAddress?.zipCode}
                  </p>
                </div>

                <div className="cjs-application-data">
                  <div className="cjs-section-title">Plot Information</div>
                  <p>
                    <strong>Location:</strong>{" "}
                    {app.plotInformation?.plotLocation}
                  </p>
                  <p>
                    <strong>Size:</strong> {app.plotInformation?.plotSize}
                  </p>
                  <p>
                    <strong>Orientation:</strong>{" "}
                    {app.plotInformation?.plotOrientation}
                  </p>
                </div>

                <div className="cjs-application-data">
                  <div className="cjs-section-title">Design Requirements</div>
                  <p>
                    <strong>Type:</strong> {app.designRequirements?.designType}
                  </p>
                  <p>
                    <strong>Floors:</strong> {app.designRequirements?.numFloors}
                  </p>
                  <p>
                    <strong>Special Features:</strong>{" "}
                    {app.designRequirements?.specialFeatures ||
                      "None specified"}
                  </p>
                  <p>
                    <strong>Style:</strong>{" "}
                    {app.designRequirements?.architecturalStyle}
                  </p>
                </div>

                {app.designRequirements?.floorRequirements?.length > 0 && (
                  <div className="cjs-application-data">
                    <div className="cjs-section-title">Floor Requirements</div>
                    {app.designRequirements.floorRequirements.map(
                      (floor, i) => (
                        <p key={i}>
                          <strong>Floor {floor.floorNumber}:</strong>{" "}
                          {floor.details}
                        </p>
                      ),
                    )}
                  </div>
                )}

                <div className="cjs-application-data">
                  <div className="cjs-section-title">Additional Details</div>
                  <p>
                    <strong>Budget:</strong>{" "}
                    {app.additionalDetails?.budget || "Not specified"}
                  </p>
                  <p>
                    <strong>Completion Date:</strong>{" "}
                    {app.additionalDetails?.completionDate
                      ? formatDate(app.additionalDetails.completionDate)
                      : "Not specified"}
                  </p>
                  {app.additionalDetails?.referenceImages?.length > 0 && (
                    <p>
                      <strong>Images:</strong>{" "}
                      {app.additionalDetails.referenceImages.length} uploaded
                    </p>
                  )}
                </div>

                {app.additionalDetails?.referenceImages?.length > 0 && (
                  <div
                    className="cjs-application-data"
                    style={{ gridColumn: "1 / -1" }}
                  >
                    <div className="cjs-section-title">Reference Images</div>
                    <div className="cjs-images-grid">
                      {app.additionalDetails.referenceImages.map((img, i) => (
                        <img
                          key={i}
                          src={typeof img === "string" ? img : img.url}
                          alt={`Reference ${i + 1}`}
                          className="cjs-grid-image"
                          onClick={() =>
                            setLightboxImage(
                              typeof img === "string" ? img : img.url,
                            )
                          }
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {isSectionExpanded(app._id, "milestones") &&
              renderMilestones(app, "architect")}
            {isSectionExpanded(app._id, "updates") && renderUpdates(app)}
          </>
        )}
      </div>
    );
  };

  const renderInteriorApp = (app) => {
    const hasMilestones = app.milestones && app.milestones.length > 0;
    const hasUpdates = app.projectUpdates && app.projectUpdates.length > 0;
    const hasCurrentImages =
      app.currentRoomImages && app.currentRoomImages.length > 0;
    const hasInspirationImages =
      app.inspirationImages && app.inspirationImages.length > 0;
    const pendingMilestones = hasMilestones
      ? app.milestones.filter((m) => m.status === "Pending").length
      : 0;
    const workerName =
      app.assignedWorkerDetails?.name || app.workerId?.name || "Worker";

    return (
      <div
        key={app._id}
        id={`cjs-${app._id}`}
        className="cjs-application cjs-interior-app"
      >
        <div className="cjs-status-container">
          <div className="cjs-status cjs-interior-status">{app.status}</div>
          {renderCardToggle(app._id, "Card Details")}
        </div>

        <div className="cjs-project-header-row">
          <h3 className="cjs-project-name">{app.projectName}</h3>

          <div className="cjs-proposal-corner cjs-proposal-actions">
            <div className="cjs-proposal-container">
              {renderProposal(app, "interior")}
            </div>

            {isHiredOrAccepted(app.status) && (
              <button
                type="button"
                className="cjs-section-btn cjs-chat-btn"
                onClick={() =>
                  openChatModal(
                    app._id,
                    "interior",
                    app.projectName,
                    workerName,
                  )
                }
              >
                Message Worker
              </button>
            )}
          </div>
        </div>

        <p>
          <strong>Email:</strong> {app.email}
        </p>

        {isSectionExpanded(app._id, "card") && (
          <>
            {renderEditAction(app, "interior")}

            {renderHireDetails(app, "interior", "cjs-hire-details-inline")}

            {pendingMilestones > 0 && (
              <div className="cjs-pending-notice">
                ⚠️ {pendingMilestones} milestone
                {pendingMilestones > 1 ? "s" : ""} pending your approval
              </div>
            )}

            {renderCollapsibleButtons(
              app._id,
              hasMilestones,
              hasUpdates,
              {
                enabled: isHiredOrAccepted(app.status),
                projectId: app._id,
                projectType: "interior",
                projectName: app.projectName,
                otherUserName: workerName,
              },
              false,
            )}

            {isSectionExpanded(app._id, "details") && (
              <div
                id={`cjs-${app._id}-details`}
                className="cjs-details-section"
              >
                <div className="cjs-section-title">Room Details</div>
                <p>
                  <strong>Type:</strong> {app.roomType}
                </p>
                <p>
                  <strong>Size:</strong> {app.roomSize?.length}×
                  {app.roomSize?.width}
                  {app.roomSize?.unit}
                </p>
                <p>
                  <strong>Ceiling:</strong> {app.ceilingHeight?.height}
                  {app.ceilingHeight?.unit}
                </p>
                <p>
                  <strong>Preference:</strong> {app.designPreference}
                </p>
                <p>
                  <strong>Description:</strong> {app.projectDescription}
                </p>

                {hasCurrentImages && (
                  <div style={{ marginTop: "20px" }}>
                    <div className="cjs-section-title">Current Room Images</div>
                    <div className="cjs-images-grid">
                      {app.currentRoomImages.map((img, i) => (
                        <img
                          key={i}
                          src={img}
                          alt={`Current ${i + 1}`}
                          className="cjs-grid-image"
                          onClick={() => setLightboxImage(img)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {hasInspirationImages && (
                  <div style={{ marginTop: "20px" }}>
                    <div className="cjs-section-title">Inspiration Images</div>
                    <div className="cjs-images-grid">
                      {app.inspirationImages.map((img, i) => (
                        <img
                          key={i}
                          src={img}
                          alt={`Inspiration ${i + 1}`}
                          className="cjs-grid-image"
                          onClick={() => setLightboxImage(img)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {isSectionExpanded(app._id, "milestones") &&
              renderMilestones(app, "interior")}
            {isSectionExpanded(app._id, "updates") && renderUpdates(app)}
          </>
        )}
      </div>
    );
  };

  const renderCompanyApp = (app) => (
    <div
      key={app._id}
      id={`cjs-${app._id}`}
      className="cjs-application cjs-company-app"
    >
      <div className="cjs-status-container">
        <div className="cjs-status cjs-company-status">{app.status}</div>
        {renderCardToggle(app._id, "Card Details")}
      </div>

      <div className="cjs-project-header-row">
        <h3>
          <span className="cjs-project-name">{app.projectName}</span>
        </h3>

        <div className="cjs-proposal-corner cjs-proposal-actions">
          <div className="cjs-proposal-container">
            {renderProposal(app, "company")}
          </div>

          {isHiredOrAccepted(app.status) && (
            <button
              type="button"
              className="cjs-section-btn cjs-chat-btn"
              onClick={() =>
                openChatModal(
                  app._id,
                  "company",
                  app.projectName,
                  app.assignedCompanyDetails?.companyName ||
                    app.companyId?.companyName ||
                    app.companyName ||
                    "Company",
                )
              }
            >
              Message Company
            </button>
          )}
        </div>
      </div>

      <div className="cjs-date-info">
        Submitted: {formatDate(app.createdAt)}
      </div>

      {isSectionExpanded(app._id, "card") && (
        <div id={`cjs-${app._id}-details`} className="cjs-details-section">
          {renderHireDetails(app, "company", "cjs-hire-details-inline")}

          {renderEditAction(app, "company")}

          <div className="cjs-company-details-grid">
            <div className="cjs-company-detail-item">
              <span className="cjs-detail-label">Project Type:</span>
              <span className="cjs-detail-value">
                {app.projectType || app.buildingType || "Not specified"}
              </span>
            </div>
            <div className="cjs-company-detail-item">
              <span className="cjs-detail-label">Budget:</span>
              <span className="cjs-detail-value">
                ₹{app.estimatedBudget?.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="cjs-company-detail-item">
              <span className="cjs-detail-label">Timeline:</span>
              <span className="cjs-detail-value">
                {app.projectTimeline} months
              </span>
            </div>
          </div>

          <button
            type="button"
            className="cjs-btn-view-details"
            onClick={() =>
              setCompanyDetailsModal({
                isOpen: true,
                project: app,
              })
            }
          >
            View Details
          </button>
        </div>
      )}
    </div>
  );

  if (loading) {
    return <CustomerPageLoader message="Loading job status..." />;
  }

  return (
    <div className="cjs-container">
      <div className="cjs-page-header">
        <h1>My Job Status</h1>
        <p>
          Track all your service requests, milestones, and project updates in
          one place.
        </p>
      </div>

      <div
        className="cjs-tab-container"
        role="tablist"
        aria-label="Job status sections"
      >
        {Object.entries(jobStatusSections).map(([sectionId, section]) => (
          <button
            key={sectionId}
            type="button"
            role="tab"
            aria-selected={activeTab === sectionId}
            className={`cjs-tab ${activeTab === sectionId ? "cjs-active" : ""}`}
            onClick={() => handleTabClick(sectionId)}
          >
            <span className="cjs-tab-icon" aria-hidden="true">
              {section.icon}
            </span>
            {section.tabLabel}
          </button>
        ))}
      </div>

      <div
        id="cjs-architect-section"
        className={`cjs-content-section ${
          activeTab === "cjs-architect-section" ? "cjs-active" : ""
        }`}
      >
        <div className="cjs-section-hero cjs-architect-hero">
          <div className="cjs-section-hero-icon" aria-hidden="true">
            {jobStatusSections["cjs-architect-section"].icon}
          </div>
          <div>
            <h2 className="cjs-architect-heading">
              {jobStatusSections["cjs-architect-section"].title}
            </h2>
            <p>{jobStatusSections["cjs-architect-section"].subtitle}</p>
          </div>
        </div>

        {/* Status Filter Tabs */}
        {applications.architect.length > 0 && (
          <div className="cjs-status-filter-tabs">
            {[
              "all",
              "pending",
              "pending_payment",
              "accepted",
              "rejected",
              "completed",
            ].map((status) => {
              const counts = getStatusCounts(applications.architect);
              const count = counts[status] || 0;
              if (status !== "all" && count === 0) return null;

              return (
                <button
                  key={status}
                  className={`cjs-status-filter-btn ${statusFilters.architect === status ? "active" : ""}`}
                  onClick={() => handleStatusFilter("architect", status)}
                >
                  {formatStatusLabel(status)} ({count})
                </button>
              );
            })}
          </div>
        )}

        {applications.architect.length > 0 ? (
          filterApplicationsByStatus(
            applications.architect,
            statusFilters.architect,
          ).length > 0 ? (
            filterApplicationsByStatus(
              applications.architect,
              statusFilters.architect,
            ).map(renderArchitectApp)
          ) : (
            <div className="cjs-no-applications">
              <p>No {statusFilters.architect} applications found.</p>
            </div>
          )
        ) : (
          <div className="cjs-no-applications">
            <p>{jobStatusSections["cjs-architect-section"].emptyMessage}</p>
          </div>
        )}
      </div>

      <div
        id="cjs-interior-section"
        className={`cjs-content-section ${
          activeTab === "cjs-interior-section" ? "cjs-active" : ""
        }`}
      >
        <div className="cjs-section-hero cjs-interior-hero">
          <div className="cjs-section-hero-icon" aria-hidden="true">
            {jobStatusSections["cjs-interior-section"].icon}
          </div>
          <div>
            <h2 className="cjs-interior-heading">
              {jobStatusSections["cjs-interior-section"].title}
            </h2>
            <p>{jobStatusSections["cjs-interior-section"].subtitle}</p>
          </div>
        </div>

        {/* Status Filter Tabs */}
        {applications.interior.length > 0 && (
          <div className="cjs-status-filter-tabs">
            {[
              "all",
              "pending",
              "pending_payment",
              "accepted",
              "rejected",
              "completed",
            ].map((status) => {
              const counts = getStatusCounts(applications.interior);
              const count = counts[status] || 0;
              if (status !== "all" && count === 0) return null;

              return (
                <button
                  key={status}
                  className={`cjs-status-filter-btn ${statusFilters.interior === status ? "active" : ""}`}
                  onClick={() => handleStatusFilter("interior", status)}
                >
                  {formatStatusLabel(status)} ({count})
                </button>
              );
            })}
          </div>
        )}

        {applications.interior.length > 0 ? (
          filterApplicationsByStatus(
            applications.interior,
            statusFilters.interior,
          ).length > 0 ? (
            filterApplicationsByStatus(
              applications.interior,
              statusFilters.interior,
            ).map(renderInteriorApp)
          ) : (
            <div className="cjs-no-applications">
              <p>No {statusFilters.interior} applications found.</p>
            </div>
          )
        ) : (
          <div className="cjs-no-applications">
            <p>{jobStatusSections["cjs-interior-section"].emptyMessage}</p>
          </div>
        )}
      </div>

      <div
        id="cjs-company-section"
        className={`cjs-content-section ${
          activeTab === "cjs-company-section" ? "cjs-active" : ""
        }`}
      >
        <div className="cjs-section-hero cjs-company-hero">
          <div className="cjs-section-hero-icon" aria-hidden="true">
            {jobStatusSections["cjs-company-section"].icon}
          </div>
          <div>
            <h2 className="cjs-company-heading">
              {jobStatusSections["cjs-company-section"].title}
            </h2>
            <p>{jobStatusSections["cjs-company-section"].subtitle}</p>
          </div>
        </div>

        {/* Status Filter Tabs */}
        {applications.company.length > 0 && (
          <div className="cjs-status-filter-tabs">
            {["all", "pending", "accepted", "rejected", "completed"].map(
              (status) => {
                const counts = getStatusCounts(applications.company);
                const count = counts[status] || 0;
                if (status !== "all" && count === 0) return null;

                return (
                  <button
                    key={status}
                    className={`cjs-status-filter-btn ${statusFilters.company === status ? "active" : ""}`}
                    onClick={() => handleStatusFilter("company", status)}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)} ({count})
                  </button>
                );
              },
            )}
          </div>
        )}

        {applications.company.length > 0 ? (
          filterApplicationsByStatus(
            applications.company,
            statusFilters.company,
          ).length > 0 ? (
            <div className="cjs-company-app-container">
              {filterApplicationsByStatus(
                applications.company,
                statusFilters.company,
              ).map(renderCompanyApp)}
            </div>
          ) : (
            <div className="cjs-no-applications">
              <p>No {statusFilters.company} applications found.</p>
            </div>
          )
        ) : (
          <div className="cjs-no-applications">
            <p>{jobStatusSections["cjs-company-section"].emptyMessage}</p>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="cjs-lightbox-overlay"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="cjs-lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="cjs-lightbox-close"
              onClick={() => setLightboxImage(null)}
            >
              ×
            </button>
            <img src={lightboxImage} alt="Full size preview" />
          </div>
        </div>
      )}

      {/* Construction Project Details Modal */}
      {companyDetailsModal.isOpen && companyDetailsModal.project && (
        <div
          className="cjs-modal-overlay"
          onClick={() =>
            setCompanyDetailsModal({ isOpen: false, project: null })
          }
        >
          <div
            className="cjs-modal-content cjs-company-details-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cjs-modal-header">
              <h3>Construction Project Details</h3>
              <button
                className="cjs-modal-close"
                onClick={() =>
                  setCompanyDetailsModal({ isOpen: false, project: null })
                }
              >
                ×
              </button>
            </div>

            <div
              className="cjs-modal-body"
              style={{ maxHeight: "65vh", overflowY: "auto" }}
            >
              <div
                className="cjs-application-data-section"
                style={{ marginTop: 0 }}
              >
                <div className="cjs-application-data">
                  <div className="cjs-section-title">Project Basics</div>
                  <p>
                    <strong>Project Name:</strong>{" "}
                    {companyDetailsModal.project.projectName || "Not specified"}
                  </p>
                  <p>
                    <strong>Project Type:</strong>{" "}
                    {companyDetailsModal.project.projectType ||
                      companyDetailsModal.project.buildingType ||
                      "Not specified"}
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    {companyDetailsModal.project.status || "Not specified"}
                  </p>
                  <p>
                    <strong>Submitted:</strong>{" "}
                    {formatDate(companyDetailsModal.project.createdAt)}
                  </p>
                </div>

                <div className="cjs-application-data">
                  <div className="cjs-section-title">Customer Contact</div>
                  <p>
                    <strong>Name:</strong>{" "}
                    {companyDetailsModal.project.customerName ||
                      "Not specified"}
                  </p>
                  <p>
                    <strong>Email:</strong>{" "}
                    {companyDetailsModal.project.customerEmail ||
                      "Not specified"}
                  </p>
                  <p>
                    <strong>Phone:</strong>{" "}
                    {companyDetailsModal.project.customerPhone ||
                      "Not specified"}
                  </p>
                </div>

                <div className="cjs-application-data">
                  <div className="cjs-section-title">Site Details</div>
                  <p>
                    <strong>Address:</strong>{" "}
                    {companyDetailsModal.project.projectAddress ||
                      "Not specified"}
                  </p>
                  <p>
                    <strong>Pincode:</strong>{" "}
                    {companyDetailsModal.project.projectLocationPincode ||
                      "Not specified"}
                  </p>
                  <p>
                    <strong>Total Area:</strong>{" "}
                    {companyDetailsModal.project.totalArea || "Not specified"}{" "}
                    sq.ft
                  </p>
                  <p>
                    <strong>Building Type:</strong>{" "}
                    {companyDetailsModal.project.buildingType ||
                      "Not specified"}
                  </p>
                </div>

                <div className="cjs-application-data">
                  <div className="cjs-section-title">Requirements</div>
                  <p>
                    <strong>Budget:</strong>{" "}
                    {companyDetailsModal.project.estimatedBudget != null
                      ? `₹${companyDetailsModal.project.estimatedBudget.toLocaleString("en-IN")}`
                      : "Not specified"}
                  </p>
                  <p>
                    <strong>Timeline:</strong>{" "}
                    {companyDetailsModal.project.projectTimeline ||
                      "Not specified"}{" "}
                    months
                  </p>
                  <p>
                    <strong>Total Floors:</strong>{" "}
                    {companyDetailsModal.project.totalFloors || "Not specified"}
                  </p>
                  <p>
                    <strong>Special Requirements:</strong>{" "}
                    {companyDetailsModal.project.specialRequirements || "None"}
                  </p>
                  <p>
                    <strong>Accessibility Needs:</strong>{" "}
                    {companyDetailsModal.project.accessibilityNeeds || "None"}
                  </p>
                  <p>
                    <strong>Energy Efficiency:</strong>{" "}
                    {companyDetailsModal.project.energyEfficiency || "Standard"}
                  </p>
                </div>

                <div
                  className="cjs-application-data"
                  style={{ gridColumn: "1 / -1" }}
                >
                  <div className="cjs-section-title">Floor Details</div>
                  {companyDetailsModal.project.floors?.length > 0 ? (
                    companyDetailsModal.project.floors.map((floor, idx) => (
                      <p key={`${floor.floorNumber || idx}-${idx}`}>
                        <strong>Floor {floor.floorNumber || idx + 1}:</strong>{" "}
                        Type: {floor.floorType || "Not specified"}, Area:{" "}
                        {floor.floorArea || "Not specified"} sq.ft, Description:{" "}
                        {floor.floorDescription || "Not provided"}
                      </p>
                    ))
                  ) : (
                    <p>No floor details provided.</p>
                  )}
                </div>

                <div
                  className="cjs-application-data"
                  style={{ gridColumn: "1 / -1" }}
                >
                  <div className="cjs-section-title">Uploaded Site Files</div>
                  {companyDetailsModal.project.siteFilepaths?.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: "20px" }}>
                      {companyDetailsModal.project.siteFilepaths.map(
                        (file, idx) => (
                          <li key={`${file}-${idx}`}>
                            <a href={file} target="_blank" rel="noreferrer">
                              File {idx + 1}
                            </a>
                          </li>
                        ),
                      )}
                    </ul>
                  ) : (
                    <p>No files uploaded.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revision Request Modal */}
      {revisionModal.isOpen && (
        <div className="cjs-modal-overlay" onClick={handleCloseRevisionModal}>
          <div
            className="cjs-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cjs-modal-header">
              <h3>Request Milestone Revision</h3>
              <button
                className="cjs-modal-close"
                onClick={handleCloseRevisionModal}
              >
                ×
              </button>
            </div>
            <div className="cjs-modal-body">
              <label htmlFor="revisionNotes">
                Please describe what needs to be revised:
              </label>
              <textarea
                id="revisionNotes"
                className="cjs-modal-textarea"
                value={revisionModal.notes}
                onChange={(e) =>
                  setRevisionModal({ ...revisionModal, notes: e.target.value })
                }
                placeholder="Describe the changes or improvements needed..."
                rows="6"
                autoFocus
              />
            </div>
            <div className="cjs-modal-footer">
              <button
                className="cjs-modal-btn cjs-modal-btn-cancel"
                onClick={handleCloseRevisionModal}
              >
                Cancel
              </button>
              <button
                className="cjs-modal-btn cjs-modal-btn-submit"
                onClick={handleSubmitRevision}
              >
                Send Revision Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Phases Modal */}
      {phasesModal.isOpen && (
        <div
          className="cjs-modal-overlay"
          onClick={() => setPhasesModal({ ...phasesModal, isOpen: false })}
        >
          <div
            className="cjs-phases-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cjs-modal-header">
              <h3>Project Phases Breakdown</h3>
              <button
                className="cjs-modal-close"
                onClick={() =>
                  setPhasesModal({ ...phasesModal, isOpen: false })
                }
              >
                ×
              </button>
            </div>
            <div className="cjs-phases-modal-body">
              {phasesModal.phases && phasesModal.phases.length > 0 ? (
                <div className="cjs-phases-list">
                  {phasesModal.phases.map((phase, index) => (
                    <div key={phase.id || index} className="cjs-phase-card">
                      <div className="cjs-phase-header">
                        <h4>{phase.name}</h4>
                        <span className="cjs-phase-percentage">
                          {phase.percentage}%
                        </span>
                      </div>
                      <div className="cjs-phase-details">
                        <p>
                          <strong>Amount:</strong> ₹
                          {(phase.amount || 0).toLocaleString("en-IN")}
                        </p>
                        {phase.requiredMonths && (
                          <p>
                            <strong>Required Months:</strong>{" "}
                            {phase.requiredMonths} months
                          </p>
                        )}
                      </div>
                      {phase.subdivisions && phase.subdivisions.length > 0 && (
                        <div className="cjs-subdivisions">
                          <p className="cjs-subdivisions-title">Work Items:</p>
                          <ul>
                            {phase.subdivisions.map((sub, subIndex) => (
                              <li key={subIndex}>
                                <span className="cjs-sub-category">
                                  {sub.category}
                                </span>
                                {sub.description && (
                                  <span className="cjs-sub-desc">
                                    {" "}
                                    - {sub.description}
                                  </span>
                                )}
                                <span className="cjs-sub-amount">
                                  ₹{(sub.amount || 0).toLocaleString("en-IN")}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="cjs-phases-summary">
                    <div className="cjs-summary-item">
                      <span>Total Project Cost:</span>
                      <span className="cjs-summary-amount">
                        ₹
                        {(phasesModal.proposalData?.price || 0).toLocaleString(
                          "en-IN",
                        )}
                      </span>
                    </div>
                    <div className="cjs-summary-item">
                      <span>Total Percentage:</span>
                      <span className="cjs-summary-percentage">
                        {phasesModal.phases.reduce(
                          (sum, p) => sum + (parseFloat(p.percentage) || 0),
                          0,
                        )}
                        %
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p>No phases information available.</p>
              )}
            </div>
            <div className="cjs-modal-footer">
              <button
                className="cjs-modal-btn cjs-modal-btn-cancel"
                onClick={() => {
                  handleRejectProposal(
                    phasesModal.projectId,
                    phasesModal.projectType,
                  );
                  setPhasesModal({ ...phasesModal, isOpen: false });
                }}
              >
                Reject
              </button>
              <button
                className="cjs-modal-btn cjs-modal-btn-submit"
                onClick={() => {
                  handleAcceptProposal(
                    phasesModal.projectId,
                    phasesModal.projectType,
                    true,
                  );
                  setPhasesModal({ ...phasesModal, isOpen: false });
                }}
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proposal Details Modal */}
      {proposalModal.isOpen && proposalModal.proposal && (
        <div
          className="cjs-modal-overlay"
          onClick={() =>
            setProposalModal({
              isOpen: false,
              projectId: null,
              projectType: null,
              proposal: null,
            })
          }
        >
          <div
            className="cjs-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cjs-modal-header">
              <h3>📋 Proposal Details</h3>
              <button
                className="cjs-modal-close"
                onClick={() =>
                  setProposalModal({
                    isOpen: false,
                    projectId: null,
                    projectType: null,
                    proposal: null,
                  })
                }
              >
                ×
              </button>
            </div>
            <div
              className="cjs-modal-body"
              style={{ maxHeight: "600px", overflowY: "auto" }}
            >
              {/* Proposal Price */}
              <div
                style={{
                  marginBottom: "20px",
                  paddingBottom: "15px",
                  borderBottom: "2px solid #ddd",
                }}
              >
                <p style={{ margin: "0", fontSize: "13px", color: "#666" }}>
                  Proposal Price
                </p>
                <p
                  style={{
                    margin: "8px 0 0 0",
                    fontSize: "28px",
                    color: "#ff9800",
                    fontWeight: "bold",
                  }}
                >
                  ₹{proposalModal.proposal.price.toLocaleString("en-IN")}
                </p>
              </div>

              {/* Description */}
              {proposalModal.proposal.description && (
                <div
                  style={{
                    marginBottom: "20px",
                    paddingBottom: "15px",
                    borderBottom: "2px solid #ddd",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: "14px",
                      fontWeight: "bold",
                      color: "#333",
                    }}
                  >
                    Description:
                  </p>
                  <p style={{ margin: "0", color: "#666", fontSize: "13px" }}>
                    {proposalModal.proposal.description}
                  </p>
                </div>
              )}

              {/* Phases */}
              {proposalModal.proposal.phases &&
                proposalModal.proposal.phases.length > 0 && (
                  <div style={{ marginBottom: "20px" }}>
                    <p
                      style={{
                        margin: "0 0 12px 0",
                        fontSize: "14px",
                        fontWeight: "bold",
                        color: "#333",
                      }}
                    >
                      🎯 Project Phases ({proposalModal.proposal.phases.length}
                      ):
                    </p>
                    <div style={{ display: "grid", gap: "12px" }}>
                      {proposalModal.proposal.phases.map((phase, idx) => (
                        <div
                          key={idx}
                          style={{
                            backgroundColor: phase.isFinal
                              ? "#fff3e0"
                              : "#f5f5f5",
                            padding: "12px",
                            borderRadius: "6px",
                            borderLeft: phase.isFinal
                              ? "4px solid #d32f2f"
                              : "4px solid #1a73e8",
                          }}
                        >
                          <p
                            style={{
                              margin: "0 0 6px 0",
                              fontWeight: "bold",
                              color: phase.isFinal ? "#d32f2f" : "#1a73e8",
                              fontSize: "13px",
                            }}
                          >
                            {phase.isFinal ? "🎯 " : ""}
                            {phase.name}
                          </p>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#666",
                              lineHeight: "1.7",
                            }}
                          >
                            <p style={{ margin: "3px 0" }}>
                              <strong>Percentage:</strong> {phase.percentage}%
                            </p>
                            <p style={{ margin: "3px 0" }}>
                              <strong>Amount:</strong> ₹
                              {Number(phase.amount).toLocaleString("en-IN")}
                            </p>
                            {!phase.isFinal && (
                              <p style={{ margin: "3px 0" }}>
                                <strong>Duration:</strong>{" "}
                                {phase.requiredMonths} months
                              </p>
                            )}

                            {/* Work Items */}
                            {phase.subdivisions &&
                              phase.subdivisions.length > 0 && (
                                <div
                                  style={{
                                    marginTop: "8px",
                                    paddingTop: "8px",
                                    borderTop: "1px dashed #ddd",
                                  }}
                                >
                                  <p
                                    style={{
                                      margin: "0 0 4px 0",
                                      fontWeight: "bold",
                                      fontSize: "11px",
                                    }}
                                  >
                                    Work Items:
                                  </p>
                                  {phase.subdivisions.map((sub, sIdx) => (
                                    <p
                                      key={sIdx}
                                      style={{
                                        margin: "2px 0",
                                        fontSize: "11px",
                                        paddingLeft: "8px",
                                      }}
                                    >
                                      • <strong>{sub.category}:</strong>{" "}
                                      {sub.description}{" "}
                                      {sub.amount
                                        ? `- ₹${Number(sub.amount).toLocaleString("en-IN")}`
                                        : ""}
                                    </p>
                                  ))}
                                </div>
                              )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
            <div className="cjs-modal-footer">
              <button
                className="cjs-modal-btn cjs-modal-btn-cancel"
                onClick={() => {
                  const reason = prompt(
                    "Please provide a reason for rejection (optional):",
                  );
                  if (reason !== null) {
                    handleRejectProposal(
                      proposalModal.projectId,
                      proposalModal.projectType,
                    );
                  }
                }}
              >
                Reject
              </button>
              <button
                className="cjs-modal-btn cjs-modal-btn-submit"
                onClick={() => {
                  handleAcceptProposal(
                    proposalModal.projectId,
                    proposalModal.projectType,
                  );
                  setProposalModal({
                    isOpen: false,
                    projectId: null,
                    projectType: null,
                    proposal: null,
                  });
                }}
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      <ReviewModal
        isOpen={reviewModal.isOpen}
        onClose={() =>
          setReviewModal({
            isOpen: false,
            projectId: null,
            projectName: null,
            projectType: null,
          })
        }
        onSubmit={handleSubmitReview}
        projectName={reviewModal.projectName}
        reviewType="customer"
      />
    </div>
  );
};

export default CustomerJobStatus;
