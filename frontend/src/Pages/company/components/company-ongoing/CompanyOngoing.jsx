// src/pages/company/CompanyOngoing.jsx
import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MetricsCard from "./components/MetricsCard";
import ProjectCard from "./components/ProjectCard";
import ProjectDetails from "./components/ProjectDetails";
import ProjectUpdates from "./components/ProjectUpdates";
import FilterSidebar from "./components/FilterSidebar";
import ComplaintModal from "./components/ComplaintModal";
import { useGlobalChat } from "../../../../context/GlobalChatContext";
import API_BASE from "../../../../api/backendBase";
import "./CompanyOngoing.css";

const CompanyOngoing = () => {
  const [projects, setProjects] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [filter, setFilter] = useState("all");
  const [expandedDetails, setExpandedDetails] = useState({});
  const [expandedUpdates, setExpandedUpdates] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showComplaintModal, setShowComplaintModal] = useState(null); // key: `${projectId}_${milestone}`
  const [complaintText, setComplaintText] = useState({});
  const [complaintLoading, setComplaintLoading] = useState(false);
  const [complaintSuccess, setComplaintSuccess] = useState(false);
  const [complaintError, setComplaintError] = useState(null);
  const [complaintHistory, setComplaintHistory] = useState([]);
  const [complaintHistoryLoading, setComplaintHistoryLoading] = useState(false);
  const [unviewedComplaints, setUnviewedComplaints] = useState({}); // { projectId: count }

  const navigate = useNavigate();
  const location = useLocation();
  const { openChat } = useGlobalChat();

  const handleMessageCustomer = (project) => {
    openChat({
      projectId: project._id,
      projectType: "company",
      projectName: project.projectName,
      otherUserName:
        project.customerName ||
        project.customerDetails?.fullName ||
        project.customerId?.name ||
        "Customer",
      userRole: "company",
    });
  };

  /* -------------------------------------------------
   *  Load data
   * -------------------------------------------------*/
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/companyongoing_projects`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch ongoing projects");
      const data = await res.json();
      setProjects(data.projects || []);
      setMetrics(data.metrics || null);

      // Fetch unviewed complaints count (from customers)
      try {
        const complaintsRes = await fetch(
          `${API_BASE}/api/company/unviewed-customer-messages`,
          {
            credentials: "include",
          },
        );
        if (complaintsRes.ok) {
          const complaintsData = await complaintsRes.json();
          console.log("🔔 Unviewed customer messages data:", complaintsData);
          const complaintsMap = {};
          complaintsData.unviewedByProject.forEach((item) => {
            complaintsMap[item._id] = item.count;
          });
          console.log("🔔 Messages map:", complaintsMap);
          setUnviewedComplaints(complaintsMap);
        }
      } catch (complaintsErr) {
        console.error(
          "Error fetching unviewed customer messages:",
          complaintsErr,
        );
      }
    } catch (err) {
      console.error(err);
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!projects.length) return;

    const searchParams = new URLSearchParams(location.search);
    const projectId = searchParams.get("projectId");

    if (!projectId) return;

    setExpandedUpdates((prev) => ({ ...prev, [projectId]: true }));
    setExpandedDetails((prev) => ({ ...prev, [projectId]: false }));

    const targetId = `project-card-${projectId}`;
    const scrollToProject = () => {
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    };

    const timerId = setTimeout(scrollToProject, 150);
    return () => clearTimeout(timerId);
  }, [projects, location.search]);

  /* -------------------------------------------------
   *  Filter
   * -------------------------------------------------*/
  const handleFilter = (type) => {
    setFilter(type);
    setExpandedDetails({});
    setExpandedUpdates({});
  };

  const filteredProjects = projects.filter((p) => {
    if (filter === "all") return true;
    if (filter === "finished") return p.completionPercentage === 100;
    if (filter === "pending") return p.completionPercentage < 100;
    return true;
  });

  /* -------------------------------------------------
   *  Toggle Details / Updates (mutual exclusion)
   * -------------------------------------------------*/
  const toggleDetails = (id) => {
    setExpandedDetails((prev) => ({ ...prev, [id]: !prev[id] }));
    setExpandedUpdates((prev) => ({ ...prev, [id]: false }));
  };

  const toggleUpdates = async (id) => {
    const wasExpanded = expandedUpdates[id];
    setExpandedUpdates((prev) => ({ ...prev, [id]: !prev[id] }));
    setExpandedDetails((prev) => ({ ...prev, [id]: false }));

    // Mark customer messages as viewed when opening milestone details
    if (!wasExpanded && unviewedComplaints[id]) {
      // Clear the notification immediately for better UX
      setUnviewedComplaints((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });

      try {
        await fetch(
          `${API_BASE}/api/company/mark-messages-viewed/${id}`,
          {
            method: "POST",
            credentials: "include",
          },
        );
        console.log("✅ Messages marked as viewed for project:", id);
      } catch (err) {
        console.error("Error marking messages as viewed:", err);
        // Restore notification if marking failed
        setUnviewedComplaints((prev) => ({
          ...prev,
          [id]: 1,
        }));
      }
    }
  };

  /* -------------------------------------------------
   *  Format date
   * -------------------------------------------------*/
  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const fetchComplaintHistory = async (projectId, milestone) => {
    setComplaintHistoryLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/complaints/${projectId}`, {
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) {
        setComplaintHistory([]);
        return;
      }

      const milestoneValue = Number(milestone === "general" ? 0 : milestone);
      const filtered = (data.complaints || []).filter(
        (complaint) => Number(complaint.milestone) === milestoneValue,
      );
      setComplaintHistory(filtered);
    } catch {
      setComplaintHistory([]);
    } finally {
      setComplaintHistoryLoading(false);
    }
  };

  /* -------------------------------------------------
   *  Complaint Handling
   * -------------------------------------------------*/
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
      await fetch(`${API_BASE}/api/complaints`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          projectId,
          milestone: milestone === "general" ? 0 : milestone,
          message: complaintText[`${projectId}_${milestone}`],
        }),
      });
      setComplaintSuccess(true);
      setComplaintText({});
      await fetchComplaintHistory(projectId, milestone);
    } catch (err) {
      setComplaintError("Failed to submit complaint");
    }
    setComplaintLoading(false);
  };

  /* -------------------------------------------------
   *  Loading / Error
   * -------------------------------------------------*/
  if (loading) {
    return (
      <div className="ongoing-container">
        <div className="ongoing-loading">Loading ongoing projects...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ongoing-container">
        <div className="ongoing-error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="ongoing-container">
      {/* ------------------ METRICS ------------------ */}
      <MetricsCard metrics={metrics} />

      {/* ------------------ MAIN CONTENT ------------------ */}
      <div className="ongoing-content-wrapper">
        <div className="ongoing-left-section">
          {filteredProjects.length > 0 ? (
            filteredProjects.map((project) => (
              <React.Fragment key={project._id}>
                {/* ----- PROJECT CARD ----- */}
                <ProjectCard
                  project={project}
                  unviewedComplaints={unviewedComplaints}
                  expandedDetails={expandedDetails}
                  toggleDetails={toggleDetails}
                  toggleUpdates={toggleUpdates}
                  handleOpenComplaint={handleOpenComplaint}
                  formatDate={formatDate}
                  onChatClick={handleMessageCustomer}
                />

                {/* ----- EXPANDED DETAILS ----- */}
                <ProjectDetails
                  project={project}
                  expandedDetails={expandedDetails}
                />

                {/* ----- EXPANDED UPDATES ----- */}
                <ProjectUpdates
                  project={project}
                  expandedUpdates={expandedUpdates}
                  onRefresh={fetchData}
                />
              </React.Fragment>
            ))
          ) : (
            <div className="ongoing-no-projects">
              <p>
                No ongoing projects found. All accepted projects will appear
                here.
              </p>
            </div>
          )}
        </div>

        {/* ------------------ FILTER SIDEBAR ------------------ */}
        <FilterSidebar filter={filter} handleFilter={handleFilter} />
      </div>

      {/* Complaint Modal */}
      <ComplaintModal
        showComplaintModal={showComplaintModal}
        handleCloseComplaint={handleCloseComplaint}
        complaintText={complaintText}
        setComplaintText={setComplaintText}
        handleSubmitComplaint={handleSubmitComplaint}
        complaintLoading={complaintLoading}
        complaintSuccess={complaintSuccess}
        complaintError={complaintError}
        complaintHistory={complaintHistory}
        complaintHistoryLoading={complaintHistoryLoading}
      />
    </div>
  );
};

export default CompanyOngoing;
