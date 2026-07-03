import React, { useEffect, useState } from "react";
import ProjectCard from "./components/ProjectCard";
import DetailsModal from "./components/DetailsModal";
import ProposalModal from "./components/ProposalModal";
import API_BASE from "../../../../api/backendBase";
import "./CompanyProjectRequests.css";

const CompanyProjectRequests = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [maxBudget, setMaxBudget] = useState(0);
  const [proposalData, setProposalData] = useState({
    projectId: "",
    price: "",
    description: "",
  });
  const [proposalErrors, setProposalErrors] = useState({});

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/project_requests`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch project requests");
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (err) {
      console.error(err);
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getStatusText = (status) => {
    const statusMap = {
      pending: "Pending",
      accepted: "Accepted",
      rejected: "Rejected",
      proposal_sent: "Proposal Sent",
    };
    return (
      statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1)
    );
  };

  const handleViewDetails = (project) => {
    setSelectedProject(project);
    setShowDetailsModal(true);
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedProject(null);
  };

  const handleOpenProposalModal = (project) => {
    setSelectedProject(project);
    setMaxBudget(project.estimatedBudget || 0);
    setProposalData({
      projectId: project._id,
      price: "",
      description: "",
    });
    setProposalErrors({});
    setShowDetailsModal(false);
    setShowProposalModal(true);
  };

  const handleCloseProposalModal = () => {
    setShowProposalModal(false);
    setProposalData({ projectId: "", price: "", description: "" });
    setProposalErrors({});
  };

  const validatePrice = (price) => {
    const numPrice = parseFloat(price) || 0;
    const errors = {};

    if (numPrice < 10000) {
      errors.price = "Price must be at least ₹10,000";
    } else if (maxBudget > 0 && numPrice > maxBudget) {
      errors.price = `Proposal price must be less than or equal to customer's budget (₹${maxBudget.toLocaleString("en-IN")})`;
    }

    return errors;
  };

  const validateDescription = (desc) => {
    const errors = {};
    const trimmed = desc.trim();

    if (trimmed === "") {
      errors.description = "Scope of work is required";
    } else if (trimmed.length < 10) {
      errors.description = "Scope of work must be at least 10 characters";
    }

    return errors;
  };

  const handleProposalChange = (e) => {
    const { name, value } = e.target;
    setProposalData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field if user starts typing
    if (proposalErrors[name]) {
      setProposalErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleSubmitProposal = async (proposalDataWithPhases) => {
    try {
      // Prepare the submission data with phases
      const submissionData = {
        projectId: proposalDataWithPhases.projectId || proposalData.projectId,
        price:
          proposalDataWithPhases.totalAmount || proposalDataWithPhases.price,
        description: proposalDataWithPhases.description || "",
        phases: proposalDataWithPhases.phases || [],
      };

      const res = await fetch(
        `${API_BASE}/api/company/submit-proposal`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(submissionData),
        },
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to submit proposal");
      }

      alert("Proposal submitted successfully!");
      handleCloseProposalModal();
      fetchProjects(); // Refresh project list
    } catch (err) {
      console.error("Error submitting proposal:", err);
      alert(`Failed to submit proposal: ${err.message}`);
    }
  };

  const handleRejectProject = async (projectId) => {
    if (!window.confirm("Are you sure you want to reject this project?")) {
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/api/projects/${projectId}/rejected`,
        {
          method: "PATCH",
          credentials: "include",
        },
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to reject project");
      }

      alert("Project rejected successfully!");
      handleCloseDetailsModal();
      fetchProjects(); // Refresh project list
    } catch (err) {
      console.error("Error rejecting project:", err);
      alert(`Failed to reject project: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="requests-container">
        <div className="requests-loading">Loading project requests...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="requests-container">
        <div className="requests-error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="requests-main-dashboard">
      <div className="requests-dashboard-header">
        <h2 className="requests-dashboard-title">Project Submissions</h2>
      </div>

      {projects && projects.length > 0 ? (
        <div className="requests-cards-container">
          {projects.map((project) => (
            <ProjectCard
              key={project._id}
              project={project}
              onViewDetails={handleViewDetails}
              onOpenProposal={handleOpenProposalModal}
              onRejectProject={handleRejectProject}
            />
          ))}
        </div>
      ) : (
        <div className="requests-no-projects">
          <p>No project submissions found.</p>
        </div>
      )}

      {/* DETAILS MODAL */}
      <DetailsModal
        project={selectedProject}
        isOpen={showDetailsModal}
        onClose={handleCloseDetailsModal}
        onOpenProposal={handleOpenProposalModal}
        onRejectProject={handleRejectProject}
        formatDate={formatDate}
        getStatusText={getStatusText}
      />

      {/* PROPOSAL MODAL */}
      <ProposalModal
        isOpen={showProposalModal}
        onClose={handleCloseProposalModal}
        project={selectedProject}
        proposalData={proposalData}
        proposalErrors={proposalErrors}
        maxBudget={maxBudget}
        onProposalChange={handleProposalChange}
        onSubmitProposal={handleSubmitProposal}
      />
    </div>
  );
};

export default CompanyProjectRequests;
