import React, { useState, useEffect } from "react";
import "./OngoingProjects.css";
import {
  AcceptedProjectCard,
  SimpleProjectCard,
} from "./sub-components/ProjectCard";
import ProjectDetailsModal from "./sub-components/ProjectDetailsModal";
import { useGlobalChat } from "../../../../context/GlobalChatContext";

const OngoingProjects = () => {
  const [activeTab, setActiveTab] = useState("accepted");
  const [projects, setProjects] = useState([]);
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [updateForms, setUpdateForms] = useState({});
  const { openChat } = useGlobalChat();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/worker/ongoing-projects", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Projects data:", data.projects);
        setProjects(data.projects || []);
        setUser(data.user);
      } else {
        console.error("Failed to fetch projects");
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleViewDetails = (project) => {
    setSelectedProject(project);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedProject(null);
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
      userRole: "worker",
    });
  };

  const handleUpdateChange = (projectId, field, value) => {
    setUpdateForms((prev) => ({
      ...prev,
      [projectId]: {
        ...prev[projectId],
        [field]: value,
      },
    }));
  };

  const handleUpdateSubmit = async (e, projectId, projectType) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("projectId", projectId);
    formData.append("projectType", projectType);
    formData.append("updateText", updateForms[projectId]?.updateText || "");

    if (updateForms[projectId]?.updateImage) {
      formData.append("updateImage", updateForms[projectId].updateImage);
    }

    try {
      const response = await fetch("/api/worker/project-update", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (response.ok) {
        alert("Update posted successfully!");
        setUpdateForms((prev) => ({
          ...prev,
          [projectId]: { updateText: "", updateImage: null },
        }));
        // Reset file input
        const fileInput = document.querySelector(
          `input[name="updateImage-${projectId}"]`,
        );
        if (fileInput) fileInput.value = "";
        fetchProjects(); // Refresh projects
      } else {
        alert("Failed to post update");
      }
    } catch (error) {
      console.error("Error posting update:", error);
      alert("Error posting update");
    }
  };

  const handleMarkComplete = async (projectId, projectType) => {
    if (!confirm("Are you sure you want to mark this project as completed?")) {
      return;
    }

    try {
      const response = await fetch("/api/worker/project-complete", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectId, projectType }),
      });

      if (response.ok) {
        alert("Project marked as completed!");
        fetchProjects(); // Refresh projects
      } else {
        alert("Failed to mark project as completed");
      }
    } catch (error) {
      console.error("Error marking project complete:", error);
      alert("Error marking project complete");
    }
  };

  const getFilteredProjects = (status) => {
    console.log(
      "Filtering for status:",
      status,
      "Available projects:",
      projects.map((p) => ({
        id: p._id,
        status: p.status,
        name: p.projectName,
      })),
    );
    return projects.filter((p) => {
      if (!p.status) return false;
      return p.status.toLowerCase() === status.toLowerCase();
    });
  };

  const renderProjectDetails = () => {
    if (!selectedProject) return null;

    const isArchitect = user?.isArchitect;

    return (
      <div className="wkop-modal-body">
        {isArchitect ? (
          <>
            <div className="wkop-modal-section">
              <div className="wkop-modal-section-title">Customer Details</div>
              <div className="wkop-detail-grid">
                <div className="wkop-modal-detail-item">
                  <strong>Name:</strong>{" "}
                  {selectedProject.customerDetails?.fullName}
                </div>
                <div className="wkop-modal-detail-item">
                  <strong>Contact:</strong>{" "}
                  {selectedProject.customerDetails?.contactNumber}
                </div>
              </div>
            </div>
            <div className="wkop-modal-section">
              <div className="wkop-modal-section-title">Plot Information</div>
              <div className="wkop-detail-grid">
                <div className="wkop-modal-detail-item">
                  <strong>Location:</strong>{" "}
                  {selectedProject.plotInformation?.plotLocation}
                </div>
                <div className="wkop-modal-detail-item">
                  <strong>Size:</strong>{" "}
                  {selectedProject.plotInformation?.plotSize}
                </div>
              </div>
            </div>
            <div className="wkop-modal-section">
              <div className="wkop-modal-section-title">Special Features</div>
              <p>
                {selectedProject.designRequirements?.specialFeatures || "None"}
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="wkop-modal-section">
              <div className="wkop-modal-section-title">Customer Details</div>
              <div className="wkop-detail-grid">
                <div className="wkop-modal-detail-item">
                  <strong>Name:</strong> {selectedProject.fullName}
                </div>
                <div className="wkop-modal-detail-item">
                  <strong>Contact:</strong> {selectedProject.phone}
                </div>
                <div className="wkop-modal-detail-item">
                  <strong>Email:</strong> {selectedProject.email}
                </div>
                <div className="wkop-modal-detail-item">
                  <strong>Address:</strong> {selectedProject.address}
                </div>
              </div>
            </div>
            <div className="wkop-modal-section">
              <div className="wkop-modal-section-title">Room Information</div>
              <div className="wkop-detail-grid">
                <div className="wkop-modal-detail-item">
                  <strong>Room Type:</strong> {selectedProject.roomType}
                </div>
                <div className="wkop-modal-detail-item">
                  <strong>Size:</strong> {selectedProject.roomSize?.length}x
                  {selectedProject.roomSize?.width}{" "}
                  {selectedProject.roomSize?.unit}
                </div>
              </div>
            </div>
            <div className="wkop-modal-section">
              <div className="wkop-modal-section-title">Special Features</div>
              <p>{selectedProject.projectDescription || "None"}</p>
            </div>
          </>
        )}

        {/* Inspiration Images */}
        {(() => {
          const images = isArchitect
            ? selectedProject.additionalDetails?.referenceImages
            : selectedProject.inspirationImages;

          if (images && images.length > 0) {
            return (
              <div className="wkop-modal-section">
                <div className="wkop-modal-section-title">
                  Inspiration Images
                </div>
                <div className="wkop-inspiration-images">
                  {images.map((img, index) => {
                    const imgUrl = typeof img === "string" ? img : img.url;
                    return (
                      <div key={index}>
                        <img src={imgUrl} alt={`Inspiration ${index + 1}`} />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* Update History */}
        <div className="wkop-modal-section">
          <div className="wkop-modal-section-title">Update History</div>
          <div className="wkop-update-history">
            {selectedProject.projectUpdates &&
            selectedProject.projectUpdates.length > 0 ? (
              selectedProject.projectUpdates.map((update, index) => (
                <div key={index} className="wkop-update-item">
                  <p>{update.updateText}</p>
                  <small>{new Date(update.createdAt).toLocaleString()}</small>
                </div>
              ))
            ) : (
              <p>No updates for this project.</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const acceptedProjects = getFilteredProjects("accepted");
  const completedProjects = getFilteredProjects("completed");
  const rejectedProjects = getFilteredProjects("rejected");

  return (
    <div className="wkop-container">
      <div className="wkop-page-header">
        <h1>My Projects</h1>
      </div>

      <ul className="wkop-nav-tabs">
        <li
          className={`wkop-nav-link ${activeTab === "accepted" ? "active" : ""}`}
          onClick={() => handleTabChange("accepted")}
        >
          Accepted
        </li>
        <li
          className={`wkop-nav-link ${activeTab === "completed" ? "active" : ""}`}
          onClick={() => handleTabChange("completed")}
        >
          Completed
        </li>
        <li
          className={`wkop-nav-link ${activeTab === "rejected" ? "active" : ""}`}
          onClick={() => handleTabChange("rejected")}
        >
          Rejected
        </li>
      </ul>

      <div className="wkop-tab-content">
        {/* Accepted Tab */}
        {activeTab === "accepted" && (
          <div className="wkop-tab-pane">
            {acceptedProjects.length > 0 ? (
              acceptedProjects.map((project) => (
                <AcceptedProjectCard
                  key={project._id}
                  project={project}
                  updateText={updateForms[project._id]?.updateText}
                  onViewDetails={handleViewDetails}
                  onUpdateChange={handleUpdateChange}
                  onUpdateSubmit={handleUpdateSubmit}
                  onMarkComplete={handleMarkComplete}
                  onRefreshProjects={fetchProjects}
                  onChatClick={openChatModal}
                />
              ))
            ) : (
              <div className="wkop-empty-state">
                <h3>No Accepted Projects</h3>
              </div>
            )}
          </div>
        )}

        {/* Completed Tab */}
        {activeTab === "completed" && (
          <div className="wkop-tab-pane">
            {completedProjects.length > 0 ? (
              completedProjects.map((project) => (
                <SimpleProjectCard
                  key={project._id}
                  project={project}
                  onViewDetails={handleViewDetails}
                />
              ))
            ) : (
              <div className="wkop-empty-state">
                <h3>No Completed Projects</h3>
              </div>
            )}
          </div>
        )}

        {/* Rejected Tab */}
        {activeTab === "rejected" && (
          <div className="wkop-tab-pane">
            {rejectedProjects.length > 0 ? (
              rejectedProjects.map((project) => (
                <SimpleProjectCard
                  key={project._id}
                  project={project}
                  onViewDetails={handleViewDetails}
                />
              ))
            ) : (
              <div className="wkop-empty-state">
                <h3>No Rejected Projects</h3>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <ProjectDetailsModal
          project={selectedProject}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default OngoingProjects;
