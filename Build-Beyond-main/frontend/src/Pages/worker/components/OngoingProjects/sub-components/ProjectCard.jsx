import React, { useState } from "react";
import UpdateForm from "./UpdateForm";
import "./ProjectCard.css";
import ReviewModal from "../../../../../components/ReviewModal/ReviewModal";
import ReviewDisplay from "../../../../../components/ReviewDisplay/ReviewDisplay";

// For Accepted Projects - with update form
export const AcceptedProjectCard = ({
  project,
  updateText: milestoneUpdateText,
  onViewDetails,
  onUpdateChange,
  onUpdateSubmit,
  onMarkComplete,
  onRefreshProjects,
  onChatClick,
}) => {
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [updateText, setUpdateText] = useState("");
  const [updateImage, setUpdateImage] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [resubmitMilestoneId, setResubmitMilestoneId] = useState(null);
  const [reviewModal, setReviewModal] = useState({
    isOpen: false,
    projectId: null,
    projectName: null,
    projectType: null,
  });

  // Check if project is 100% complete
  const isProjectComplete = (proj) => {
    if (!proj.milestones || proj.milestones.length === 0) return false;
    const totalProgress = proj.milestones
      .filter((m) => m.status === "Approved")
      .reduce((sum, m) => sum + m.percentage, 0);
    return totalProgress >= 100;
  };

  // Check if worker has already reviewed
  const hasWorkerReviewed = (proj) => {
    return (
      proj.review &&
      proj.review.workerToCustomer &&
      proj.review.workerToCustomer.rating
    );
  };

  // Submit review
  const handleSubmitReview = async ({ rating, comment }) => {
    try {
      const response = await fetch("/api/worker/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: reviewModal.projectId,
          projectType: reviewModal.projectType,
          rating,
          comment,
        }),
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        alert("Review submitted successfully!");
        setReviewModal({
          isOpen: false,
          projectId: null,
          projectName: null,
          projectType: null,
        });
        if (onRefreshProjects) onRefreshProjects();

        // Check if project is now completed (both reviews done)
        if (data.isProjectCompleted) {
          alert("Both reviews completed! Project moved to Completed section.");
        }
      } else {
        alert(data.error || "Failed to submit review");
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      throw error;
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();

    if (!updateText.trim()) {
      alert("Please enter an update message");
      return;
    }

    const formData = new FormData();
    formData.append("projectId", project._id);
    formData.append("projectType", project.projectType);
    formData.append("updateText", updateText);
    if (updateImage) {
      formData.append("updateImage", updateImage);
    }

    try {
      const response = await fetch("/api/worker/project-update", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        alert("Update posted successfully!");
        setUpdateText("");
        setUpdateImage(null);
        setShowUpdateForm(false);
        setShowActivity(true);
        if (onRefreshProjects) onRefreshProjects();
      } else {
        alert(data.error || "Failed to post update");
      }
    } catch (error) {
      console.error("Error posting update:", error);
      alert("Error posting update");
    }
  };

  return (
    <div className="wkop-project-card">
      <div className="wkop-project-header">
        <h3>{project.projectName}</h3>
        <div className="wkop-header-actions">
          <button
            className="wkop-btn wkop-btn-simple"
            onClick={() => onViewDetails(project)}
          >
            View Details
          </button>
          {((project.milestones && project.milestones.length > 0) ||
            (project.projectUpdates && project.projectUpdates.length > 0)) && (
            <button
              className="wkop-btn wkop-btn-simple"
              onClick={() => setShowActivity(!showActivity)}
            >
              {showActivity ? "Hide Activity" : "View Project Activity"} (
              {(project.milestones?.length || 0) +
                (project.projectUpdates?.length || 0)}
              )
            </button>
          )}
          <button
            className="wkop-btn wkop-btn-simple"
            onClick={() => setShowMilestoneForm(!showMilestoneForm)}
          >
            {showMilestoneForm ? "Hide Form" : "Submit Milestone"}
          </button>
          <button
            className="wkop-btn wkop-btn-simple"
            onClick={() => setShowUpdateForm(!showUpdateForm)}
          >
            {showUpdateForm ? "Hide Form" : "Post Update"}
          </button>
          {onChatClick && (
            <button
              className="wkop-btn wkop-btn-chat"
              onClick={() =>
                onChatClick(
                  project._id,
                  project.projectType,
                  project.projectName,
                  project.customerDetails?.fullName ||
                    project.fullName ||
                    project.customerName ||
                    "Customer",
                )
              }
            >
              Message
            </button>
          )}
        </div>
      </div>

      {showMilestoneForm && (
        <div className="wkop-project-body">
          <h4 className="wkop-section-title">Submit New Milestone</h4>
          <UpdateForm
            projectId={project._id}
            projectType={project.projectType}
            updateText={milestoneUpdateText}
            onTextChange={onUpdateChange}
            onImageChange={onUpdateChange}
            onSubmit={onUpdateSubmit}
            onSuccess={() => {
              setShowMilestoneForm(false);
              setShowActivity(true);
              if (onRefreshProjects) onRefreshProjects();
            }}
          />
        </div>
      )}

      {showUpdateForm && (
        <div className="wkop-project-body">
          <h4 className="wkop-section-title">Post Regular Update</h4>
          <form onSubmit={handleUpdateSubmit} className="wkop-update-form">
            <div className="wkop-form-group">
              <label>Update Message *</label>
              <textarea
                value={updateText}
                onChange={(e) => setUpdateText(e.target.value)}
                placeholder="Share progress, issues, or any updates with the customer..."
                rows="4"
                required
              />
            </div>
            <div className="wkop-form-group">
              <label>Upload Image (Optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setUpdateImage(e.target.files[0])}
              />
            </div>
            <button type="submit" className="wkop-btn-update">
              Post Update
            </button>
          </form>
        </div>
      )}

      {/* Combined Project Activity Timeline */}
      {showActivity && (
        <div className="wkop-activity-section">
          <h4 className="wkop-section-title">Project Activity Timeline</h4>
          <div className="wkop-activity-timeline">
            {(() => {
              // Combine milestones and updates into one array
              const activities = [];

              // Add milestones
              if (project.milestones) {
                project.milestones.forEach((milestone) => {
                  activities.push({
                    type: "milestone",
                    date: new Date(milestone.submittedAt),
                    data: milestone,
                  });
                });
              }

              // Add updates
              if (project.projectUpdates) {
                project.projectUpdates.forEach((update) => {
                  activities.push({
                    type: "update",
                    date: new Date(update.createdAt),
                    data: update,
                  });
                });
              }

              // Sort by date (newest first)
              activities.sort((a, b) => b.date - a.date);

              return activities.map((activity, index) => {
                if (activity.type === "milestone") {
                  const milestone = activity.data;
                  return (
                    <div
                      key={`milestone-${index}`}
                      className={`wkop-activity-item wkop-milestone-activity wkop-milestone-${milestone.status.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <div className="wkop-activity-type-badge">
                        <span className="wkop-badge-milestone">Milestone</span>
                      </div>
                      <div className="wkop-activity-main-content">
                        <div className="wkop-activity-text">
                          <div className="wkop-milestone-header">
                            <div className="wkop-milestone-percentage">
                              <span className="wkop-percentage-badge">
                                {milestone.percentage}%
                              </span>
                              <span
                                className={`wkop-status-badge wkop-status-${milestone.status.toLowerCase().replace(/\s+/g, "-")}`}
                              >
                                {milestone.status === "Pending" &&
                                  "⏳ Pending Approval"}
                                {milestone.status === "Approved" &&
                                  "✅ Approved"}
                                {milestone.status === "Rejected" &&
                                  "❌ Rejected"}
                                {milestone.status === "Revision Requested" &&
                                  "🔄 Revision Requested"}
                                {milestone.status === "Under Review" &&
                                  "⚠️ Under Admin Review"}
                              </span>
                            </div>
                            <div className="wkop-activity-timestamp">
                              {new Date(
                                milestone.submittedAt,
                              ).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                          <div className="wkop-activity-content">
                            <p>{milestone.description}</p>
                          </div>

                          {/* Show revision request details */}
                          {milestone.status === "Revision Requested" &&
                            milestone.revisionNotes && (
                              <div className="wkop-revision-request-box">
                                <div className="wkop-revision-header">
                                  <span className="wkop-revision-icon">🔄</span>
                                  <strong>Customer Revision Request</strong>
                                </div>
                                <div className="wkop-revision-date">
                                  Requested on:{" "}
                                  {new Date(
                                    milestone.revisionRequestedAt,
                                  ).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                                <div className="wkop-revision-notes">
                                  <p>
                                    <strong>What needs to be revised:</strong>
                                  </p>
                                  <p>{milestone.revisionNotes}</p>
                                </div>
                                <div className="wkop-revision-action">
                                  <span className="wkop-revision-hint">
                                    💡 Please review the customer's feedback and
                                    submit an updated milestone
                                  </span>
                                </div>
                                <div className="wkop-revision-button-container">
                                  <button
                                    className="wkop-btn-resubmit"
                                    onClick={() => {
                                      setResubmitMilestoneId(milestone._id);
                                      setShowMilestoneForm(true);
                                      setShowActivity(false);
                                    }}
                                  >
                                    🔄 Resubmit Milestone
                                  </button>
                                </div>
                              </div>
                            )}

                          {/* Show admin review notice */}
                          {milestone.status === "Under Review" && (
                            <div className="wkop-admin-review-box">
                              <div className="wkop-review-header">
                                <span className="wkop-review-icon">⚠️</span>
                                <strong>Under Admin Review</strong>
                              </div>
                              <p>
                                This milestone has been reported to the admin
                                for review. Please wait for admin decision.
                              </p>
                            </div>
                          )}

                          {/* Show approval/rejection info */}
                          {milestone.status === "Approved" &&
                            milestone.approvedAt && (
                              <div className="wkop-approval-box">
                                ✅ Approved on:{" "}
                                {new Date(
                                  milestone.approvedAt,
                                ).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            )}

                          {milestone.status === "Rejected" &&
                            milestone.rejectionReason && (
                              <div className="wkop-rejection-box">
                                <strong>Rejection Reason:</strong>
                                <p>{milestone.rejectionReason}</p>
                              </div>
                            )}
                        </div>
                        {milestone.image && (
                          <div className="wkop-activity-image">
                            <img
                              src={milestone.image}
                              alt={`${milestone.percentage}% milestone`}
                              onClick={() => setLightboxImage(milestone.image)}
                              style={{ cursor: "pointer" }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                } else {
                  const update = activity.data;
                  return (
                    <div
                      key={`update-${index}`}
                      className="wkop-activity-item wkop-update-activity"
                    >
                      <div className="wkop-activity-type-badge">
                        <span className="wkop-badge-update">Update</span>
                      </div>
                      <div className="wkop-activity-main-content">
                        <div className="wkop-activity-text">
                          <div className="wkop-activity-header">
                            <span className="wkop-activity-timestamp">
                              {new Date(update.createdAt).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </span>
                          </div>
                          <div className="wkop-activity-content">
                            <p>{update.updateText}</p>
                          </div>
                        </div>
                        {update.updateImage && (
                          <div className="wkop-activity-image">
                            <img
                              src={update.updateImage}
                              alt="Update"
                              onClick={() =>
                                setLightboxImage(update.updateImage)
                              }
                              style={{ cursor: "pointer" }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
              });
            })()}
          </div>
        </div>
      )}

      {/* Review Section - Show when project is 100% complete */}
      {isProjectComplete(project) && !hasWorkerReviewed(project) && (
        <div className="wkop-review-prompt">
          <div className="wkop-review-prompt-content">
            <i className="fas fa-star"></i>
            <h4>Project Complete!</h4>
            <p>
              This project has reached 100% completion. Please rate and review
              your experience with the customer.
            </p>
            <button
              className="wkop-btn-review"
              onClick={() =>
                setReviewModal({
                  isOpen: true,
                  projectId: project._id,
                  projectName: project.projectName,
                  projectType: project.projectType,
                })
              }
            >
              ⭐ Rate & Review Customer
            </button>
          </div>
        </div>
      )}

      {/* Display Reviews if completed */}
      {project.review &&
        (project.review.customerToWorker ||
          project.review.workerToCustomer) && (
          <ReviewDisplay review={project.review} userType="worker" />
        )}

      {/* Lightbox Modal for Image Preview */}
      {lightboxImage && (
        <div
          className="wkop-lightbox-overlay"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="wkop-lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="wkop-lightbox-close"
              onClick={() => setLightboxImage(null)}
            >
              ×
            </button>
            <img src={lightboxImage} alt="Full size preview" />
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
        reviewType="worker"
      />
    </div>
  );
};

// For Completed/Rejected Projects - simple view only
export const SimpleProjectCard = ({ project, onViewDetails }) => {
  return (
    <div className="wkop-project-card">
      <div className="wkop-project-header">
        <h3>{project.projectName}</h3>
        <button
          className="wkop-btn wkop-btn-outline"
          onClick={() => onViewDetails(project)}
        >
          View Details
        </button>
      </div>
    </div>
  );
};
