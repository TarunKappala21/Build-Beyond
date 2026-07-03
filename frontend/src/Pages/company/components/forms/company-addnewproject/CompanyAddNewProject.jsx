import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./CompanyAddNewProject.css";
import RevisionAlert from './components/RevisionAlert';
import ValidationSummary from './components/ValidationSummary';
import ProgressHeader from './components/ProgressHeader';
import MilestoneInput from './components/MilestoneInput';
import MilestoneMessageBox from './components/MilestoneMessageBox';
import CheckpointsOverview from './components/CheckpointsOverview';
import TargetCompletionDateInput from './components/TargetCompletionDateInput';
import CurrentPhaseSelect from './components/CurrentPhaseSelect';
import FileUploadGroup from './components/FileUploadGroup';
import CompletionImagesUpload from './components/CompletionImagesUpload';
import RecentUpdates from './components/RecentUpdates';
import FormButtons from './components/FormButtons';
import API_BASE from "../../../../../api/backendBase";


const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];

const CompanyAddNewProject = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");
  const updateCheckpoint = searchParams.get("updateCheckpoint");
  const navigate = useNavigate();

  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [selectedMilestone, setSelectedMilestone] = useState("");
  const [milestoneMessage, setMilestoneMessage] = useState("");
  const [showMilestoneInput, setShowMilestoneInput] = useState(false);
  const [targetCompletionDate, setTargetCompletionDate] = useState("");
  const [currentPhase, setCurrentPhase] = useState("");
  const [mainImage, setMainImage] = useState(null);
  const [additionalImages, setAdditionalImages] = useState([]);
  const [completionImages, setCompletionImages] = useState([]);
  const [updateText, setUpdateText] = useState("");
  const [updateImage, setUpdateImage] = useState(null);
  const [existingMilestones, setExistingMilestones] = useState([]);
  const [maxCompletedMilestone, setMaxCompletedMilestone] = useState(0);
  const [nextCheckpoint, setNextCheckpoint] = useState(25);
  const [revisionMode, setRevisionMode] = useState(false);
  const [customerFeedback, setCustomerFeedback] = useState("");
  const [conversationHistory, setConversationHistory] = useState([]);

  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) return;
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/companyongoing_projects`, { credentials: "include" });
        if (!res.ok) throw new Error("Failed to load projects");
        const json = await res.json();
        const found = (json.projects || []).find((p) => p._id === projectId);
        if (found) {
          setCompletionPercentage(found.completionPercentage || 0);
          setTargetCompletionDate(found.targetCompletionDate ? new Date(found.targetCompletionDate).toISOString().split("T")[0] : "");
          setCurrentPhase(found.currentPhase || "");
          setExistingMilestones(found.milestones || []);
          
          // Calculate max completed milestone
          if (found.milestones && found.milestones.length > 0) {
            const max = Math.max(...found.milestones.map(m => m.percentage));
            setMaxCompletedMilestone(max);
          }
          
          // Calculate next checkpoint
          const checkpoints = [25, 50, 75, 100];
          const approvedCheckpoints = (found.milestones || []).filter(m => m.isCheckpoint && m.isApprovedByCustomer).map(m => m.percentage);
          const lastApproved = approvedCheckpoints.length > 0 ? Math.max(...approvedCheckpoints) : 0;
          const next = checkpoints.find(c => c > lastApproved) || 100;
          setNextCheckpoint(next);

          // Check if loading for revision update
          if (updateCheckpoint) {
            const checkpointNum = parseInt(updateCheckpoint);
            const milestone = found.milestones.find(m => m.percentage === checkpointNum && m.isCheckpoint);
            if (milestone && milestone.needsRevision) {
              setRevisionMode(true);
              setSelectedMilestone(checkpointNum.toString());
              setMilestoneMessage(milestone.companyMessage || "");
              setCustomerFeedback(milestone.customerFeedback || "");
              setConversationHistory(milestone.conversation || []);
              setShowMilestoneInput(true);
            }
          }
        }
      } catch (err) {
        console.error(err);
        setErrors([err.message || "Failed to load project data"]);
      } finally {
        setLoading(false);
      }
    };
    loadProject();
  }, [projectId, updateCheckpoint]);

  const validateFile = (file) => {
    if (!file) return true;
    if (!allowedTypes.includes(file.type)) return false;
    if (file.size > MAX_FILE_SIZE) return false;
    return true;
  };

  const handleMilestoneChange = (value) => {
    setSelectedMilestone(value);
    const checkpoints = [25, 50, 75, 100];
    const isCheckpoint = checkpoints.includes(parseInt(value));
    
    if (value && isCheckpoint) {
      setShowMilestoneInput(true);
    } else {
      setShowMilestoneInput(false);
      setMilestoneMessage("");
    }
  };

  const getMaxAllowedPercentage = () => {
    // If in revision mode, allow updating the same checkpoint
    if (revisionMode) {
      return parseInt(selectedMilestone);
    }
    
    // Check if there's a pending checkpoint waiting for approval
    const pendingCheckpoint = existingMilestones.find(
      m => m.isCheckpoint && !m.isApprovedByCustomer && !m.needsRevision
    );
    
    if (pendingCheckpoint) {
      return null; // Can't update until checkpoint is approved
    }
    
    return nextCheckpoint; // Can update up to next checkpoint
  };

  const getCheckpointFloor = () => {
    const checkpoints = [25, 50, 75, 100];
    const reached = existingMilestones
      .filter(m => m.isCheckpoint)
      .map(m => m.percentage);
    if (reached.length === 0) return 0;
    return Math.max(...reached);
  };

  const validate = () => {
    const v = [];
    const today = new Date();
    
    if (selectedMilestone) {
      const milestone = parseInt(selectedMilestone);
      const checkpoints = [25, 50, 75, 100];
      const isCheckpoint = checkpoints.includes(milestone);
      const floor = getCheckpointFloor();

      if (isCheckpoint && !milestoneMessage.trim()) {
        v.push(`Please add a message for the ${milestone}% checkpoint so the customer can review and approve.`);
      }
      // Cannot go below the last reached checkpoint (floor)
      if (milestone < floor) {
        v.push(`Progress cannot go below the last checkpoint (${floor}%).`);
      }
      const maxAllowed = getMaxAllowedPercentage();
      if (maxAllowed === null) {
        v.push("You cannot update progress until the previous checkpoint has been approved by the customer.");
      } else if (milestone > maxAllowed) {
        v.push(`You can adjust between ${floor}% and ${maxAllowed}% only. Reach and get approval for ${maxAllowed}% to move further.`);
      }
    }
    if (milestoneMessage && milestoneMessage.length > 500) {
      v.push("Milestone message cannot exceed 500 characters");
    }
    
    if (!targetCompletionDate) v.push("Target completion date is required");
    else if (new Date(targetCompletionDate) <= today) v.push("Target completion date must be in the future");
    if (!currentPhase) v.push("Current phase is required");
    if (mainImage && !validateFile(mainImage)) v.push("Main file must be PDF/JPG/PNG and <= 5MB");
    for (let f of additionalImages) if (!validateFile(f)) { v.push("Each additional file must be PDF/JPG/PNG and <= 5MB"); break; }
    if (updateText && updateText.length > 500) v.push("Update text cannot exceed 500 characters");
    if (updateImage && !validateFile(updateImage)) v.push("Update image must be PDF/JPG/PNG and <= 5MB");
    setErrors(v);
    return v.length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      const formData = new FormData();
      if (projectId) formData.append("projectId", projectId);
      
      // Add milestone data if selected
      if (selectedMilestone) {
        formData.append("milestonePercentage", selectedMilestone);
        const checkpoints = [25, 50, 75, 100];
        const isCheckpoint = checkpoints.includes(parseInt(selectedMilestone));
        if (isCheckpoint && milestoneMessage.trim()) {
          formData.append("milestoneMessage", milestoneMessage);
        } else if (!isCheckpoint) {
          formData.append("milestoneMessage", `Progress update to ${selectedMilestone}%`);
        }
      }
      
      formData.append("targetCompletionDate", targetCompletionDate);
      formData.append("currentPhase", currentPhase);
      if (mainImage) formData.append("mainImage", mainImage);
      additionalImages.forEach((file) => formData.append("additionalImages", file));
      completionImages.forEach((file) => formData.append("completionImages", file));
      if (updateText) formData.append("updates[]", updateText);
      if (updateImage) formData.append("updateImages", updateImage);

      // original EJS used action "/api/projects/update"; keep that path
      const res = await fetch(`${_API_BASE}/api/projects/update`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.message || "Failed to save project");

      // navigate back to ongoing projects
      navigate("/companydashboard/companyongoing_projects");

    } catch (err) {
      console.error(err);
      setErrors([err.message || String(err)]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">

      <ProgressHeader projectId={projectId} />

      {revisionMode && customerFeedback && (
        <RevisionAlert customerFeedback={customerFeedback} conversationHistory={conversationHistory} />
      )}

      {errors.length > 0 && <ValidationSummary errors={errors} />}

      <form id="constructionProjectForm" onSubmit={handleSubmit} encType="multipart/form-data">
        <input type="hidden" name="projectId" value={projectId || ""} />

        <div className="form-group">
          <label htmlFor="currentCompletion">Current Project Completion</label>
          <div className="progress-display">
            <span className="completion-badge">{completionPercentage}% Complete</span>
            {completionPercentage > 0 && (
              <span className="milestone-info">
                Next Checkpoint: {nextCheckpoint}%
                {existingMilestones.find(m => m.percentage === nextCheckpoint && m.isCheckpoint && !m.isApprovedByCustomer)
                  ? " ⏳ Awaiting Customer Approval"
                  : " (Available)"}
              </span>
            )}
          </div>
        </div>

        <MilestoneInput
          selectedMilestone={selectedMilestone}
          handleMilestoneChange={handleMilestoneChange}
          getCheckpointFloor={getCheckpointFloor}
          getMaxAllowedPercentage={getMaxAllowedPercentage}
          completionPercentage={completionPercentage}
        />

        {showMilestoneInput && (
          <MilestoneMessageBox
            selectedMilestone={selectedMilestone}
            milestoneMessage={milestoneMessage}
            setMilestoneMessage={setMilestoneMessage}
          />
        )}

        <CheckpointsOverview existingMilestones={existingMilestones} />

        <TargetCompletionDateInput targetCompletionDate={targetCompletionDate} setTargetCompletionDate={setTargetCompletionDate} />

        <CurrentPhaseSelect currentPhase={currentPhase} setCurrentPhase={setCurrentPhase} />

        <FileUploadGroup
          mainImage={mainImage}
          setMainImage={setMainImage}
          additionalImages={additionalImages}
          setAdditionalImages={setAdditionalImages}
        />

        {parseInt(selectedMilestone) === 100 && (
          <CompletionImagesUpload completionImages={completionImages} setCompletionImages={setCompletionImages} />
        )}

        <RecentUpdates
          updateText={updateText}
          setUpdateText={setUpdateText}
          updateImage={updateImage}
          setUpdateImage={setUpdateImage}
        />

        <FormButtons loading={loading} navigate={navigate} />
      </form>
    </div>
  );
};

export default CompanyAddNewProject;