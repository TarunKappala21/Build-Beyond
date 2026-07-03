/* eslint-disable no-unused-vars */
// src/Pages/customer/components/Forms/InteriorDesignForm.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchCustomerProfile } from "../../../../store/slices/customerProfileSlice";
import axiosInstance from '../../../../api/axiosInstance';
import CustomerPageLoader from "../common/CustomerPageLoader";
import {
  clearDraft,
  clearClipboard,
  readClipboard,
  readDraft,
  saveDraft,
  writeClipboard,
} from "./formDraftStorage";
import "./formDraftControls.css";
import "./InteriorDesignForm.css";

const InteriorDesignForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const customerProfile = useSelector((state) => state.customerProfile);

  // ---------- Worker ID from URL ----------
  const [workerId, setWorkerId] = useState("");
  const [editId, setEditId] = useState("");
  const [loadingExistingRequest, setLoadingExistingRequest] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [workerDetailsLoading, setWorkerDetailsLoading] = useState(false);
  const isEditMode = Boolean(editId);
  const clipboardKey = "interior-form";
  const [copiedForm, setCopiedForm] = useState(() =>
    readClipboard(clipboardKey),
  );

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setWorkerId(params.get("workerId") || "");
    setEditId(params.get("editId") || "");
  }, [location.search]);

  // ---------- Form state ----------
  const [formData, setFormData] = useState({
    projectName: "",
    fullName: customerProfile.name || "",
    email: customerProfile.email || "",
    phone: customerProfile.phone || "",
    address: "",
    roomType: "",
    roomLength: "",
    roomWidth: "",
    dimensionUnit: "feet",
    ceilingHeight: "",
    heightUnit: "feet",
    designPreference: "",
    projectDescription: "",
  });

  // ---------- Floor Requirements State ----------
  const [floorRequirements, setFloorRequirements] = useState([
    { floorNumber: 1, details: "" },
  ]);

  const handleFloorChange = (index, field, value) => {
    setFloorRequirements((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const addFloorRequirement = () => {
    setFloorRequirements((prev) => [
      ...prev,
      { floorNumber: prev.length + 1, details: "" },
    ]);
  };

  const removeFloorRequirement = (index) => {
    setFloorRequirements((prev) =>
      prev.length === 1 ? prev : prev.filter((_, i) => i !== index),
    );
  };

  // Update form fields if profile changes and fields are empty
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      fullName: prev.fullName || customerProfile.name || "",
      email: prev.email || customerProfile.email || "",
      phone: prev.phone || customerProfile.phone || "",
    }));
    // eslint-disable-next-line
  }, [customerProfile.name, customerProfile.email, customerProfile.phone]);

  // Fetch profile on mount if not loaded yet
  useEffect(() => {
    if (
      !customerProfile.name &&
      !customerProfile.email &&
      !customerProfile.phone &&
      customerProfile.status !== "loading"
    ) {
      dispatch(fetchCustomerProfile());
    }
    // eslint-disable-next-line
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ---------- Sync dimension & height units ----------
  useEffect(() => {
    setFormData((prev) => ({ ...prev, heightUnit: prev.dimensionUnit }));
  }, [formData.dimensionUnit]);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, dimensionUnit: prev.heightUnit }));
  }, [formData.heightUnit]);

  // ---------- File handling ----------
  const [currentFiles, setCurrentFiles] = useState([]);
  const [currentPreviews, setCurrentPreviews] = useState([]);
  const [inspirationFiles, setInspirationFiles] = useState([]);
  const [inspirationPreviews, setInspirationPreviews] = useState([]);
  const [existingCurrentImages, setExistingCurrentImages] = useState([]);
  const [existingInspirationImages, setExistingInspirationImages] = useState(
    [],
  );

  useEffect(() => {
    if (!editId) return;

    const fetchEditableRequest = async () => {
      try {
        setLoadingExistingRequest(true);
        const res = await axiosInstance.get(
          `/api/customer/editable-request/interior/${editId}`,
          { withCredentials: true },
        );

        const request = res.data?.request;
        if (!request) return;

        setFormData((prev) => ({
          ...prev,
          projectName: request.projectName || "",
          fullName: request.fullName || "",
          email: request.email || "",
          phone: request.phone || "",
          address: request.address || "",
          roomType: request.roomType || "",
          roomLength:
            request.roomLength !== undefined && request.roomLength !== null
              ? String(request.roomLength)
              : "",
          roomWidth:
            request.roomWidth !== undefined && request.roomWidth !== null
              ? String(request.roomWidth)
              : "",
          dimensionUnit: request.dimensionUnit || "feet",
          ceilingHeight:
            request.ceilingHeight !== undefined &&
            request.ceilingHeight !== null
              ? String(request.ceilingHeight)
              : "",
          heightUnit: request.heightUnit || request.dimensionUnit || "feet",
          designPreference: request.designPreference || "",
          projectDescription: request.projectDescription || "",
        }));

        setFloorRequirements(
          Array.isArray(request.floorRequirements) &&
            request.floorRequirements.length > 0
            ? request.floorRequirements
            : [{ floorNumber: 1, details: "" }],
        );

        setExistingCurrentImages(request.currentRoomImages || []);
        setExistingInspirationImages(request.inspirationImages || []);

        if (request.workerId) {
          setWorkerId(request.workerId);
        }

        const draftKey = request.workerId
          ? `worker-${request.workerId}`
          : `edit-${editId}`;
        const draft = readDraft("interior-form", draftKey);
        if (draft?.data) {
          setFormData((prev) => ({
            ...prev,
            ...(draft.data.formData || {}),
          }));
          setFloorRequirements(
            Array.isArray(draft.data.floorRequirements) &&
              draft.data.floorRequirements.length > 0
              ? draft.data.floorRequirements
              : request.floorRequirements || [{ floorNumber: 1, details: "" }],
          );
          setDraftSavedAt(draft.savedAt || "");
        }
      } catch (error) {
        alert(
          error.response?.data?.error ||
            "This request cannot be edited right now.",
        );
        navigate("/customerdashboard/job_status");
      } finally {
        setLoadingExistingRequest(false);
      }
    };

    fetchEditableRequest();
  }, [editId, navigate]);

  useEffect(() => {
    if (!workerId) {
      setSelectedWorker(null);
      return;
    }

    const fetchWorkerDetails = async () => {
      try {
        setWorkerDetailsLoading(true);
        const res = await axiosInstance.get("/api/interior_designer", {
          withCredentials: true,
        });
        const designers = res.data?.designers || [];
        const matchedWorker = designers.find(
          (worker) => String(worker._id) === String(workerId),
        );
        setSelectedWorker(matchedWorker || null);
      } catch (error) {
        setSelectedWorker(null);
      } finally {
        setWorkerDetailsLoading(false);
      }
    };

    fetchWorkerDetails();
  }, [workerId]);

  const handleFileChange = (e, type) => {
    const files = Array.from(e.target.files);
    const maxFiles = 3;

    if (files.length > maxFiles) {
      alert(`You can only upload a maximum of ${maxFiles} images.`);
      e.target.value = "";
      return;
    }

    const newPreviews = files.map((file) => ({
      url: URL.createObjectURL(file),
      file,
    }));

    if (type === "current") {
      setCurrentFiles((prev) => [...prev, ...files]);
      setCurrentPreviews((prev) => [...prev, ...newPreviews]);
    } else {
      setInspirationFiles((prev) => [...prev, ...files]);
      setInspirationPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeFile = (index, type) => {
    if (type === "current") {
      setCurrentFiles((prev) => prev.filter((_, i) => i !== index));
      setCurrentPreviews((prev) => prev.filter((_, i) => i !== index));
    } else {
      setInspirationFiles((prev) => prev.filter((_, i) => i !== index));
      setInspirationPreviews((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // ---------- Validation ----------
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState("");
  const [draftHydrated, setDraftHydrated] = useState(false);
  const draftScope = editId
    ? `edit-${editId}`
    : workerId
      ? `worker-${workerId}`
      : null;

  const restoreDraft = () => {
    if (!draftScope) return;

    const draft = readDraft("interior-form", draftScope);
    if (!draft?.data) return;

    setFormData((prev) => ({
      ...prev,
      ...(draft.data.formData || {}),
    }));
    setFloorRequirements(
      Array.isArray(draft.data.floorRequirements) &&
        draft.data.floorRequirements.length > 0
        ? draft.data.floorRequirements
        : [{ floorNumber: 1, details: "" }],
    );
    setCurrentFiles([]);
    setCurrentPreviews([]);
    setInspirationFiles([]);
    setInspirationPreviews([]);
    setDraftSavedAt(draft.savedAt || "");
    setDraftHydrated(true);
  };

  const copyCurrentForm = () => {
    if (!draftScope) return;

    writeClipboard(
      clipboardKey,
      {
        formData,
        floorRequirements,
        workerId,
        editId,
      },
      selectedWorker?.name || formData.projectName || "Interior request",
    );
    setCopiedForm(readClipboard(clipboardKey));
  };

  const pasteCopiedForm = () => {
    if (!draftScope || !copiedForm?.data) return;

    const copiedFormData = copiedForm.data.formData || {};
    setFormData((prev) => ({
      ...prev,
      ...copiedFormData,
    }));
    setFloorRequirements(
      Array.isArray(copiedForm.data.floorRequirements) &&
        copiedForm.data.floorRequirements.length > 0
        ? copiedForm.data.floorRequirements
        : [{ floorNumber: 1, details: "" }],
    );
    setCurrentFiles([]);
    setCurrentPreviews([]);
    setInspirationFiles([]);
    setInspirationPreviews([]);
    setDraftSavedAt("");
  };

  const handleClipboardAction = () => {
    if (copiedForm?.data) {
      pasteCopiedForm();
      return;
    }

    copyCurrentForm();
  };

  const clearCopiedForm = () => {
    clearClipboard(clipboardKey);
    setCopiedForm(null);
  };

  const saveCurrentDraft = () => {
    if (!draftScope) return;

    const savedAt = saveDraft("interior-form", draftScope, {
      formData,
      floorRequirements,
      workerId,
      editId,
    });
    setDraftSavedAt(savedAt);
  };

  const clearCurrentDraft = () => {
    if (!draftScope) return;

    clearDraft("interior-form", draftScope);
    setDraftSavedAt("");
  };

  useEffect(() => {
    if (draftHydrated || loadingExistingRequest) return;
    if (!draftScope) return;

    restoreDraft();
  }, [draftScope, draftHydrated, loadingExistingRequest]);

  const validateForm = () => {
    const newErrors = {};

    // Required text fields
    if (!formData.projectName.trim())
      newErrors.projectName = "Please enter a project name";
    if (!formData.fullName.trim())
      newErrors.fullName = "Please enter your full name";
    if (!formData.address.trim())
      newErrors.address = "Please enter your home address";

    // Email
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email (format: text@text.text)";
    }

    // Phone
    const phoneDigits = formData.phone.replace(/^0+/, "");
    if (!phoneDigits || !/^\d{10}$/.test(phoneDigits)) {
      newErrors.phone = "Please enter a valid 10-digit phone number";
    }

    // Room Type
    if (!formData.roomType) newErrors.roomType = "Please select a room type";

    // Room Dimensions
    if (
      !formData.roomLength ||
      !formData.roomWidth ||
      parseFloat(formData.roomLength) <= 0 ||
      parseFloat(formData.roomWidth) <= 0
    ) {
      newErrors.roomSize = "Please enter valid room dimensions";
    }

    // Ceiling Height
    if (!formData.ceilingHeight || parseFloat(formData.ceilingHeight) <= 0) {
      newErrors.ceilingHeight = "Please enter a valid ceiling height";
    }

    // Design Preference
    if (!formData.designPreference)
      newErrors.designPreference = "Please select a design preference";

    // Project Description
    if (!formData.projectDescription.trim())
      newErrors.projectDescription = "Please enter a project description";

    // Current Room Images
    if (currentFiles.length === 0 && existingCurrentImages.length === 0)
      newErrors.currentRoomImages = "Please upload at least one room photo";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ---------- Submit ----------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validateForm()) return;

    setIsSubmitting(true);
    const submitData = new FormData();
    submitData.append("workerId", workerId);

    Object.entries(formData).forEach(([key, value]) => {
      submitData.append(key, value);
    });

    // Append floorRequirements as JSON string (backend should parse it)
    submitData.append("floorRequirements", JSON.stringify(floorRequirements));
    submitData.append(
      "existingCurrentRoomImages",
      JSON.stringify(existingCurrentImages),
    );
    submitData.append(
      "existingInspirationImages",
      JSON.stringify(existingInspirationImages),
    );

    currentFiles.forEach((file) =>
      submitData.append("currentRoomImages", file),
    );
    inspirationFiles.forEach((file) =>
      submitData.append("inspirationImages", file),
    );

    try {
      const endpoint = isEditMode
        ? `/api/customer/editable-request/interior/${editId}`
        : "/api/design_request";
      const method = isEditMode ? "put" : "post";

      const response = await axios({
        method,
        url: endpoint,
        data: submitData,
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      if (response.data.success) {
        if (isEditMode) {
          alert("Request updated successfully!");
        }
        clearCurrentDraft();
        navigate("/customerdashboard/job_status");
        return;
      } else {
        alert(response.data.error || "An error occurred. Please try again.");
      }
    } catch (error) {
      alert("Failed to submit form. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingExistingRequest) {
    return <CustomerPageLoader message="Loading request..." />;
  }

  return (
    <div className="interior-form-container">
      <div className="interior-form-page-title">
        <h1>
          {isEditMode
            ? "Edit Interior Design Request"
            : "Interior Design Request Form"}
        </h1>
        <div className="interior-form-underline"></div>
      </div>

      <div className="customer-form-draft-bar">
        <div className="customer-form-draft-copy">
          <div className="customer-form-draft-title">Drafts</div>
          <div className="customer-form-draft-note">
            Save this form locally and restore it later on this device.
          </div>
          {copiedForm?.data && (
            <div className="customer-form-draft-clipboard">
              Copied form ready to paste into another interior request.
            </div>
          )}
          {draftSavedAt && (
            <div className="customer-form-draft-savedAt">
              Last saved {new Date(draftSavedAt).toLocaleString()}
            </div>
          )}
        </div>
        <div className="customer-form-draft-actions">
          <button
            type="button"
            className="customer-form-draft-button customer-form-draft-button-primary"
            onClick={saveCurrentDraft}
            disabled={!draftScope}
          >
            Save Draft
          </button>
          <button
            type="button"
            className="customer-form-draft-button customer-form-draft-button-clipboard"
            onClick={handleClipboardAction}
            disabled={!draftScope}
          >
            {copiedForm?.data ? "Paste Copied Form" : "Copy Form"}
          </button>
          {copiedForm?.data && (
            <button
              type="button"
              className="customer-form-draft-button customer-form-draft-button-secondary"
              onClick={clearCopiedForm}
            >
              Clear Copied Form
            </button>
          )}
          <button
            type="button"
            className="customer-form-draft-button customer-form-draft-button-secondary"
            onClick={restoreDraft}
            disabled={!draftScope}
          >
            Restore Draft
          </button>
          <button
            type="button"
            className="customer-form-draft-button customer-form-draft-button-secondary"
            onClick={clearCurrentDraft}
            disabled={!draftSavedAt}
          >
            Clear Draft
          </button>
        </div>
      </div>

      <div className="interior-form-content-layout">
        <aside className="interior-form-verification-panel">
          <h3>Worker Details</h3>
          {workerDetailsLoading ? (
            <p>Loading worker details...</p>
          ) : selectedWorker ? (
            <div className="interior-form-verification-list">
              <p>
                <strong>Name:</strong> {selectedWorker.name || "Not available"}
              </p>
              <p>
                <strong>Specialization:</strong>{" "}
                {selectedWorker.specialization || "Not available"}
              </p>
              <p>
                <strong>Experience:</strong>{" "}
                {selectedWorker.experience !== undefined &&
                selectedWorker.experience !== null
                  ? `${selectedWorker.experience} years`
                  : "Not available"}
              </p>
              <p>
                <strong>Email:</strong>{" "}
                {selectedWorker.email || "Not available"}
              </p>
              <p>
                <strong>Phone:</strong>{" "}
                {selectedWorker.phone || "Not available"}
              </p>
            </div>
          ) : (
            <p>No worker selected for this request yet.</p>
          )}
        </aside>

        <div className="interior-form-main-content">
          <form onSubmit={handleSubmit} noValidate>
            <input type="hidden" name="workerId" value={workerId} />

            {/* Customer Details */}
            <div className="interior-form-section">
              <h2 className="interior-form-section-title">Customer Details</h2>
              <div className="interior-form-form-grid">
                <div className="interior-form-form-group">
                  <label htmlFor="projectName">Project Name*</label>
                  <input
                    type="text"
                    id="projectName"
                    name="projectName"
                    value={formData.projectName}
                    onChange={handleInputChange}
                  />
                  {errors.projectName && (
                    <div className="interior-form-error-text">
                      {errors.projectName}
                    </div>
                  )}
                </div>

                <div className="interior-form-form-group">
                  <label htmlFor="fullName">Full Name*</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                  />
                  {errors.fullName && (
                    <div className="interior-form-error-text">
                      {errors.fullName}
                    </div>
                  )}
                </div>

                <div className="interior-form-form-group">
                  <label htmlFor="email">Email Address*</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                  {errors.email && (
                    <div className="interior-form-error-text">
                      {errors.email}
                    </div>
                  )}
                </div>

                <div className="interior-form-form-group">
                  <label htmlFor="phone">Phone Number*</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                  {errors.phone && (
                    <div className="interior-form-error-text">
                      {errors.phone}
                    </div>
                  )}
                </div>
              </div>

              <div className="interior-form-form-group">
                <label htmlFor="address">Home Address*</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                />
                {errors.address && (
                  <div className="interior-form-error-text">
                    {errors.address}
                  </div>
                )}
              </div>
            </div>

            {/* Project Details */}
            <div className="interior-form-section">
              <h2 className="interior-form-section-title">Project Details</h2>

              {/* Floor Requirements */}
              <div className="interior-form-form-group">
                <label>Floor Requirements</label>
                {floorRequirements.map((floor, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ marginRight: 8 }}>
                      Floor {floor.floorNumber}:
                    </span>
                    <input
                      type="text"
                      placeholder="Describe requirements for this floor"
                      value={floor.details}
                      onChange={(e) =>
                        handleFloorChange(idx, "details", e.target.value)
                      }
                      style={{ flex: 1, marginRight: 8 }}
                    />
                    <button
                      type="button"
                      onClick={() => removeFloorRequirement(idx)}
                      disabled={floorRequirements.length === 1}
                      style={{ marginRight: 4 }}
                    >
                      -
                    </button>
                    {idx === floorRequirements.length - 1 && (
                      <button type="button" onClick={addFloorRequirement}>
                        +
                      </button>
                    )}
                  </div>
                ))}
                <p className="interior-form-info-text">
                  Add requirements for each floor (optional, but helps us
                  understand your needs).
                </p>
              </div>

              <div className="interior-form-form-group">
                <label>Room Type*</label>
                <div className="interior-form-room-selector">
                  {[
                    { value: "Kitchen", label: "Kitchen" },
                    { value: "Living Room", label: "Living Room" },
                    { value: "Bedroom", label: "Bedroom" },
                    { value: "Bathroom", label: "Bathroom" },
                    { value: "Dining Room", label: "Dining Room" },
                    { value: "Other", label: "Other" },
                  ].map((room) => (
                    <div key={room.value} className="interior-form-room-option">
                      <input
                        type="radio"
                        id={room.value.toLowerCase().replace(" ", "")}
                        name="roomType"
                        value={room.value}
                        checked={formData.roomType === room.value}
                        onChange={handleInputChange}
                      />
                      <label
                        htmlFor={room.value.toLowerCase().replace(" ", "")}
                      >
                        {room.label}
                      </label>
                    </div>
                  ))}
                </div>
                {errors.roomType && (
                  <div className="interior-form-error-text">
                    {errors.roomType}
                  </div>
                )}
              </div>

              <div className="interior-form-form-grid">
                <div className="interior-form-form-group">
                  <label>Room Size*</label>
                  <div className="interior-form-dimension-inputs">
                    <input
                      type="number"
                      id="roomLength"
                      name="roomLength"
                      placeholder="Length"
                      min="0.01"
                      step="0.01"
                      value={formData.roomLength}
                      onChange={handleInputChange}
                    />
                    <span>×</span>
                    <input
                      type="number"
                      id="roomWidth"
                      name="roomWidth"
                      placeholder="Width"
                      min="0.01"
                      step="0.01"
                      value={formData.roomWidth}
                      onChange={handleInputChange}
                    />
                    <select
                      id="dimensionUnit"
                      name="dimensionUnit"
                      value={formData.dimensionUnit}
                      onChange={handleInputChange}
                      className="interior-form-dimension-unit"
                    >
                      <option value="feet">feet</option>
                      <option value="meters">meters</option>
                    </select>
                  </div>
                  {errors.roomSize && (
                    <div className="interior-form-error-text">
                      {errors.roomSize}
                    </div>
                  )}
                  <p className="interior-form-info-text">
                    Please enter the approximate dimensions of your room
                  </p>
                </div>

                <div className="interior-form-form-group">
                  <label>Ceiling Height*</label>
                  <div className="interior-form-dimension-inputs">
                    <input
                      type="number"
                      id="ceilingHeight"
                      name="ceilingHeight"
                      placeholder="Height"
                      min="0.01"
                      step="0.01"
                      value={formData.ceilingHeight}
                      onChange={handleInputChange}
                    />
                    <select
                      id="heightUnit"
                      name="heightUnit"
                      value={formData.heightUnit}
                      onChange={handleInputChange}
                      className="interior-form-dimension-unit"
                    >
                      <option value="feet">feet</option>
                      <option value="meters">meters</option>
                    </select>
                  </div>
                  {errors.ceilingHeight && (
                    <div className="interior-form-error-text">
                      {errors.ceilingHeight}
                    </div>
                  )}
                </div>
              </div>

              <div className="interior-form-form-group">
                <label htmlFor="designPreference">Design Preference*</label>
                <select
                  id="designPreference"
                  name="designPreference"
                  value={formData.designPreference}
                  onChange={handleInputChange}
                >
                  <option value="">Select a style</option>
                  <option value="Modern">Modern</option>
                  <option value="Traditional">Traditional</option>
                  <option value="Scandinavian">Scandinavian</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Bohemian">Bohemian</option>
                  <option value="Minimalist">Minimalist</option>
                  <option value="Rustic">Rustic</option>
                  <option value="Contemporary">Contemporary</option>
                </select>
                {errors.designPreference && (
                  <div className="interior-form-error-text">
                    {errors.designPreference}
                  </div>
                )}
              </div>

              <div className="interior-form-form-group">
                <label htmlFor="projectDescription">Project Description*</label>
                <textarea
                  id="projectDescription"
                  name="projectDescription"
                  rows="4"
                  placeholder="Tell us more about your vision for this space..."
                  value={formData.projectDescription}
                  onChange={handleInputChange}
                />
                {errors.projectDescription && (
                  <div className="interior-form-error-text">
                    {errors.projectDescription}
                  </div>
                )}
              </div>
            </div>

            {/* Upload Photos */}
            <div className="interior-form-section">
              <h2 className="interior-form-section-title">Upload Photos</h2>

              <div className="interior-form-image-section">
                <h3>Current Room Photos*</h3>
                <p>
                  Upload photos of your current space to help our designers
                  understand its layout, dimensions, and style.
                </p>
                <div className="interior-form-file-upload">
                  <label
                    className="interior-form-file-upload-label"
                    htmlFor="currentRoomImages"
                  >
                    <i className="fa-solid fa-cloud-arrow-up"></i>
                    <span>Upload current room photos</span>
                    <small>(Max 3 images)</small>
                  </label>
                  <input
                    type="file"
                    id="currentRoomImages"
                    name="currentRoomImages"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileChange(e, "current")}
                  />
                </div>
                {errors.currentRoomImages && (
                  <div className="interior-form-error-text">
                    {errors.currentRoomImages}
                  </div>
                )}
                <div className="interior-form-preview-container">
                  {currentPreviews.map((preview, index) => (
                    <div key={index} className="interior-form-preview-item">
                      <img
                        src={preview.url}
                        alt={`Current room ${index + 1}`}
                      />
                      <button
                        type="button"
                        className="interior-form-preview-item-remove-btn"
                        onClick={() => removeFile(index, "current")}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="interior-form-image-section">
                <h3 className="no-asterisk">Design Inspiration (Optional)</h3>
                <p>
                  Share images of designs, colors, or furniture styles you like
                  to help us understand your preferences.
                </p>
                <div className="interior-form-file-upload">
                  <label
                    className="interior-form-file-upload-label"
                    htmlFor="inspirationImages"
                  >
                    <i className="fa-solid fa-cloud-arrow-up"></i>
                    <span>Upload inspiration images</span>
                    <small>(Max 3 images)</small>
                  </label>
                  <input
                    type="file"
                    id="inspirationImages"
                    name="inspirationImages"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileChange(e, "inspiration")}
                  />
                </div>
                <div className="interior-form-preview-container">
                  {inspirationPreviews.map((preview, index) => (
                    <div key={index} className="interior-form-preview-item">
                      <img src={preview.url} alt={`Inspiration ${index + 1}`} />
                      <button
                        type="button"
                        className="interior-form-preview-item-remove-btn"
                        onClick={() => removeFile(index, "inspiration")}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="interior-form-btn-submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? isEditMode
                  ? "Updating..."
                  : "Uploading..."
                : isEditMode
                  ? "Update Request"
                  : "Submit Request"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InteriorDesignForm;
