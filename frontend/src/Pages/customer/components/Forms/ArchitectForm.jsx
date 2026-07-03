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
import "./ArchitectForm.css";

const ArchitectForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const customerProfile = useSelector((state) => state.customerProfile);

  // ---------- URL workerId ----------
  const [workerId, setWorkerId] = useState("");
  const [editId, setEditId] = useState("");
  const [loadingExistingRequest, setLoadingExistingRequest] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [workerDetailsLoading, setWorkerDetailsLoading] = useState(false);
  const isEditMode = Boolean(editId);
  const clipboardKey = "architect-form";
  const [copiedForm, setCopiedForm] = useState(() =>
    readClipboard(clipboardKey),
  );

  const formatDateForInput = (value) => {
    if (!value) return "";
    if (typeof value === "string") return value.slice(0, 10);
    return new Date(value).toISOString().slice(0, 10);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setWorkerId(params.get("workerId") || "");
    setEditId(params.get("editId") || "");
  }, [location.search]);

  // ---------- Form state ----------
  const [form, setForm] = useState({
    projectName: "",
    designType: "",
    architecturalStyle: "",
    fullName: customerProfile.name || "",
    contactNumber: customerProfile.phone || "",
    email: customerProfile.email || "",
    streetAddress: "",
    city: "",
    state: "",
    zipCode: "",
    plotLocation: "",
    plotSize: "",
    plotOrientation: "",
    numFloors: "",
    budget: "",
    completionDate: "",
    specialFeatures: "",
    floorRequirements: [], // array of { floorNumber, details }
  });

  // Update form fields if profile changes and fields are empty
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      fullName: prev.fullName || customerProfile.name || "",
      contactNumber: prev.contactNumber || customerProfile.phone || "",
      email: prev.email || customerProfile.email || "",
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

  useEffect(() => {
    if (!editId) return;

    const fetchEditableRequest = async () => {
      try {
        setLoadingExistingRequest(true);
        const res = await axiosInstance.get(
          `/api/customer/editable-request/architect/${editId}`,
          { withCredentials: true },
        );

        const request = res.data?.request;
        if (!request) return;

        setForm((prev) => ({
          ...prev,
          projectName: request.projectName || "",
          designType: request.designType || "",
          architecturalStyle: request.architecturalStyle || "",
          fullName: request.fullName || "",
          contactNumber: request.contactNumber || "",
          email: request.email || "",
          streetAddress: request.streetAddress || "",
          city: request.city || "",
          state: request.state || "",
          zipCode: request.zipCode || "",
          plotLocation: request.plotLocation || "",
          plotSize: request.plotSize || "",
          plotOrientation: request.plotOrientation || "",
          numFloors: request.numFloors ? String(request.numFloors) : "",
          budget: request.budget || "",
          completionDate: formatDateForInput(request.completionDate),
          specialFeatures: request.specialFeatures || "",
          floorRequirements: request.floorRequirements || [],
        }));

        if (request.workerId) {
          setWorkerId(request.workerId);
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
        const res = await axiosInstance.get("/api/architect", {
          withCredentials: true,
        });
        const workers = res.data?.architects || [];
        const matchedWorker = workers.find(
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  useEffect(() => {
    const num = parseInt(form.numFloors);
    if (isNaN(num) || num < 1) {
      setForm((p) => ({ ...p, floorRequirements: [] }));
      return;
    }

    const requirements = [];

    for (let i = 1; i <= num; i++) {
      const existing = form.floorRequirements.find((f) => f.floorNumber === i);
      const details = existing?.details || "";

      requirements.push({ floorNumber: i, details });
    }

    setForm((p) => ({ ...p, floorRequirements: requirements }));
  }, [form.numFloors]);

  const handleFloorChange = (index, value) => {
    const updated = [...form.floorRequirements];
    updated[index] = { ...updated[index], details: value };
    setForm((p) => ({ ...p, floorRequirements: updated }));
  };

  // ---------- File handling ----------
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowed = ["image/jpeg", "image/png", "application/pdf"];

    const valid = selected.filter((f) => {
      if (f.size > maxSize) {
        alert(`File ${f.name} exceeds 5MB limit.`);
        return false;
      }
      if (!allowed.includes(f.type)) {
        alert(`File ${f.name} must be JPG, PNG or PDF.`);
        return false;
      }
      return true;
    });

    setFiles((p) => [...p, ...valid]);

    const newPreviews = valid.map((f) => ({
      file: f,
      url: f.type.startsWith("image/") ? URL.createObjectURL(f) : null,
      type: f.type.startsWith("image/") ? "image" : "pdf",
    }));
    setPreviews((p) => [...p, ...newPreviews]);
  };

  const removeFile = (idx) => {
    setFiles((p) => p.filter((_, i) => i !== idx));
    setPreviews((p) => p.filter((_, i) => i !== idx));
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

    const draft = readDraft("architect-form", draftScope);
    if (!draft?.data) return;

    setForm((prev) => ({
      ...prev,
      ...(draft.data.form || {}),
      floorRequirements: Array.isArray(draft.data.form?.floorRequirements)
        ? draft.data.form.floorRequirements
        : prev.floorRequirements,
    }));
    setWorkerId(draft.data.workerId || "");
    setEditId(draft.data.editId || editId || "");
    setFiles([]);
    setPreviews([]);
    setDraftSavedAt(draft.savedAt || "");
    setDraftHydrated(true);
  };

  const copyCurrentForm = () => {
    if (!draftScope) return;

    writeClipboard(
      clipboardKey,
      {
        form,
        workerId,
        editId,
      },
      selectedWorker?.name || form.projectName || "Architect request",
    );
    setCopiedForm(readClipboard(clipboardKey));
  };

  const pasteCopiedForm = () => {
    if (!draftScope || !copiedForm?.data?.form) return;

    const copiedFormState = copiedForm.data.form;
    setForm((prev) => ({
      ...prev,
      ...copiedFormState,
      floorRequirements: Array.isArray(copiedFormState.floorRequirements)
        ? copiedFormState.floorRequirements
        : prev.floorRequirements,
    }));
    setFiles([]);
    setPreviews([]);
    setDraftSavedAt("");
  };

  const handleClipboardAction = () => {
    if (copiedForm?.data?.form) {
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

    const savedAt = saveDraft("architect-form", draftScope, {
      form,
      workerId,
      editId,
    });
    setDraftSavedAt(savedAt);
  };

  const clearCurrentDraft = () => {
    if (!draftScope) return;

    clearDraft("architect-form", draftScope);
    setDraftSavedAt("");
  };

  useEffect(() => {
    if (draftHydrated || loadingExistingRequest) return;
    if (!draftScope) return;

    restoreDraft();
  }, [draftScope, draftHydrated, loadingExistingRequest]);

  const validate = () => {
    const err = {};
    const required = [
      "projectName",
      "designType",
      "architecturalStyle",
      "fullName",
      "contactNumber",
      "email",
      "streetAddress",
      "city",
      "state",
      "zipCode",
      "plotLocation",
      "plotSize",
      "plotOrientation",
      "numFloors",
      "budget",
      "completionDate",
    ];

    required.forEach((f) => {
      if (!form[f].trim()) err[f] = "This field is required";
    });

    // Email
    const emailRe = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (form.email && !emailRe.test(form.email))
      err.email =
        "Please enter a valid email address (e.g., example@domain.com)";

    // Plot size – number
    const plotRe = /^\d*\.?\d+$/;
    if (form.plotSize && !plotRe.test(form.plotSize))
      err.plotSize = "Plot size must be a number (e.g., 150 or 150.5)";

    // Phone
    let digits = form.contactNumber.replace(/\D/g, "");
    if (form.contactNumber) {
      if (form.contactNumber.startsWith("0")) {
        digits = digits.slice(1);
        if (!/^\d{10}$/.test(digits))
          err.contactNumber =
            "Please enter a valid phone number with exactly 10 digits after a leading 0 (e.g., 01234567890)";
      } else {
        if (!/^\d{10}$/.test(digits))
          err.contactNumber =
            "Please enter a valid 10-digit phone number (e.g., 1234567890)";
      }
    }

    // Completion date – future
    if (form.completionDate) {
      const sel = new Date(form.completionDate);
      const now = new Date();
      if (sel <= now)
        err.completionDate = "Completion date must be greater than today";
    }

    // Zipcode – 6 digits
    if (form.zipCode && !/^\d{6}$/.test(form.zipCode))
      err.zipCode = "Pincode must be exactly 6 digits";

    // Floor details
    if (form.numFloors && form.floorRequirements.length > 0) {
      form.floorRequirements.forEach((floor, i) => {
        if (!floor.details.trim()) {
          err[`floor${i + 1}`] = `Floor ${i + 1} details are required`;
        }
      });
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  // ---------- Submit ----------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validate()) return;

    setIsSubmitting(true);
    const fd = new FormData();
    fd.append("workerId", workerId);
    Object.entries(form).forEach(([k, v]) => {
      if (k === "floorRequirements") {
        fd.append("floorRequirements", JSON.stringify(v));
      } else {
        fd.append(k, v);
      }
    });
    files.forEach((f) => fd.append("referenceImages", f));

    try {
      const endpoint = isEditMode
        ? `/api/customer/editable-request/architect/${editId}`
        : "/api/architect_submit";
      const method = isEditMode ? "put" : "post";

      const res = await axios({
        method,
        url: endpoint,
        data: fd,
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      if (isEditMode) {
        alert("Request updated successfully!");
        navigate("/customerdashboard/job_status");
        return;
      }

      if (res.data.redirect) {
        alert("Form submitted successfully!");
        navigate("/customerdashboard/job_status");
        return;
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      alert("Submission failed: " + msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------- Render ----------
  if (loadingExistingRequest) {
    return <CustomerPageLoader message="Loading request..." />;
  }

  return (
    <div className="architect-form-container">
      <div className="architect-form-page-title">
        <h1>
          {isEditMode
            ? "Edit Architectural Design Request"
            : "Architectural Design Request Form"}
        </h1>
        <div className="architect-form-underline"></div>
      </div>

      <div className="customer-form-draft-bar">
        <div className="customer-form-draft-copy">
          <div className="customer-form-draft-title">Drafts</div>
          <div className="customer-form-draft-note">
            Save this form locally and restore it later on this device.
          </div>
          {copiedForm?.data?.form && (
            <div className="customer-form-draft-clipboard">
              Copied form ready to paste into another architect request.
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
            {copiedForm?.data?.form ? "Paste Copied Form" : "Copy Form"}
          </button>
          {copiedForm?.data?.form && (
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

      <div className="architect-form-content-layout">
        <aside className="architect-form-verification-panel">
          <h3>Worker Details</h3>
          {workerDetailsLoading ? (
            <p>Loading worker details...</p>
          ) : selectedWorker ? (
            <div className="architect-form-verification-list">
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

        <div className="architect-form-main-content">
          <form
            id="architect-form-designRequestForm"
            encType="multipart/form-data"
            onSubmit={handleSubmit}
            noValidate
          >
            <input type="hidden" name="workerId" value={workerId} />

            {/* ---------- Project Information ---------- */}
            <div className="architect-form-section">
              <h2 className="architect-form-section-title">
                Project Information
              </h2>

              <div className="architect-form-form-group">
                <label htmlFor="projectName">Project Name*</label>
                <input
                  type="text"
                  id="projectName"
                  name="projectName"
                  value={form.projectName}
                  onChange={handleChange}
                  required
                />
                {errors.projectName && (
                  <div className="architect-form-error-message">
                    {errors.projectName}
                  </div>
                )}
              </div>

              <div className="architect-form-form-grid">
                <div className="architect-form-form-group">
                  <label htmlFor="designType">Type of Design*</label>
                  <select
                    id="designType"
                    name="designType"
                    value={form.designType}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Design Type</option>
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Landscape">Landscape</option>
                    <option value="Mixed-Use">Mixed-Use</option>
                    <option value="Industrial">Industrial</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.designType && (
                    <div className="architect-form-error-message">
                      {errors.designType}
                    </div>
                  )}
                </div>

                <div className="architect-form-form-group">
                  <label htmlFor="architecturalStyle">
                    Preferred Architectural Style*
                  </label>
                  <select
                    id="architecturalStyle"
                    name="architecturalStyle"
                    value={form.architecturalStyle}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Style</option>
                    <option value="Modern">Modern</option>
                    <option value="Traditional">Traditional</option>
                    <option value="Contemporary">Contemporary</option>
                    <option value="Minimalist">Minimalist</option>
                    <option value="Mediterranean">Mediterranean</option>
                    <option value="Victorian">Victorian</option>
                    <option value="Colonial">Colonial</option>
                    <option value="Industrial">Industrial</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.architecturalStyle && (
                    <div className="architect-form-error-message">
                      {errors.architecturalStyle}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ---------- Customer Details ---------- */}
            <div className="architect-form-section">
              <h2 className="architect-form-section-title">Customer Details</h2>

              <div className="architect-form-form-grid">
                <div className="architect-form-form-group">
                  <label htmlFor="fullName">Full Name*</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    required
                  />
                  {errors.fullName && (
                    <div className="architect-form-error-message">
                      {errors.fullName}
                    </div>
                  )}
                </div>

                <div className="architect-form-form-group">
                  <label htmlFor="contactNumber">Contact Number*</label>
                  <input
                    type="tel"
                    id="contactNumber"
                    name="contactNumber"
                    value={form.contactNumber}
                    onChange={handleChange}
                    required
                  />
                  {errors.contactNumber && (
                    <div className="architect-form-error-message">
                      {errors.contactNumber}
                    </div>
                  )}
                </div>

                <div className="architect-form-form-group">
                  <label htmlFor="email">Email Address*</label>
                  <input
                    type="text"
                    id="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                  {errors.email && (
                    <div className="architect-form-error-message">
                      {errors.email}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ---------- Customer Address ---------- */}
            <div className="architect-form-section">
              <h2 className="architect-form-section-title">Customer Address</h2>

              <div className="architect-form-form-group">
                <label htmlFor="streetAddress">Street Address*</label>
                <input
                  type="text"
                  id="streetAddress"
                  name="streetAddress"
                  value={form.streetAddress}
                  onChange={handleChange}
                  required
                />
                {errors.streetAddress && (
                  <div className="architect-form-error-message">
                    {errors.streetAddress}
                  </div>
                )}
              </div>

              <div className="architect-form-form-grid">
                <div className="architect-form-form-group">
                  <label htmlFor="city">City*</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    required
                  />
                  {errors.city && (
                    <div className="architect-form-error-message">
                      {errors.city}
                    </div>
                  )}
                </div>

                <div className="architect-form-form-group">
                  <label htmlFor="state">State*</label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    required
                  />
                  {errors.state && (
                    <div className="architect-form-error-message">
                      {errors.state}
                    </div>
                  )}
                </div>

                <div className="architect-form-form-group">
                  <label htmlFor="zipCode">Pincode*</label>
                  <input
                    type="text"
                    id="zipCode"
                    name="zipCode"
                    value={form.zipCode}
                    onChange={handleChange}
                    required
                  />
                  {errors.zipCode && (
                    <div className="architect-form-error-message">
                      {errors.zipCode}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ---------- Plot Information ---------- */}
            <div className="architect-form-section">
              <h2 className="architect-form-section-title">Plot Information</h2>

              <div className="architect-form-form-group">
                <label htmlFor="plotLocation">Plot Location/Address*</label>
                <input
                  type="text"
                  id="plotLocation"
                  name="plotLocation"
                  value={form.plotLocation}
                  onChange={handleChange}
                  required
                />
                {errors.plotLocation && (
                  <div className="architect-form-error-message">
                    {errors.plotLocation}
                  </div>
                )}
              </div>

              <div className="architect-form-form-grid">
                <div className="architect-form-form-group">
                  <label htmlFor="plotSize">
                    Plot Size* (in sq.ft or sq.m)
                  </label>
                  <input
                    type="text"
                    id="plotSize"
                    name="plotSize"
                    value={form.plotSize}
                    onChange={handleChange}
                    required
                  />
                  {errors.plotSize && (
                    <div className="architect-form-error-message">
                      {errors.plotSize}
                    </div>
                  )}
                </div>

                <div className="architect-form-form-group">
                  <label htmlFor="plotOrientation">Plot Orientation*</label>
                  <select
                    id="plotOrientation"
                    name="plotOrientation"
                    value={form.plotOrientation}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Orientation</option>
                    <option value="North">North</option>
                    <option value="South">South</option>
                    <option value="East">East</option>
                    <option value="West">West</option>
                    <option value="North-East">North-East</option>
                    <option value="North-West">North-West</option>
                    <option value="South-East">South-East</option>
                    <option value="South-West">South-West</option>
                  </select>
                  {errors.plotOrientation && (
                    <div className="architect-form-error-message">
                      {errors.plotOrientation}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ---------- Design Requirements ---------- */}
            <div className="architect-form-section">
              <h2 className="architect-form-section-title">
                Design Requirements
              </h2>

              <div className="architect-form-form-grid">
                <div className="architect-form-form-group">
                  <label htmlFor="numFloors">Number of Floors*</label>
                  <select
                    id="numFloors"
                    name="numFloors"
                    value={form.numFloors}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Number</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                  </select>
                  {errors.numFloors && (
                    <div className="architect-form-error-message">
                      {errors.numFloors}
                    </div>
                  )}
                </div>

                <div className="architect-form-form-group">
                  <label htmlFor="budget">Max Budget*</label>
                  <input
                    type="text"
                    id="budget"
                    name="budget"
                    value={form.budget}
                    onChange={handleChange}
                    required
                  />
                  {errors.budget && (
                    <div className="architect-form-error-message">
                      {errors.budget}
                    </div>
                  )}
                </div>

                <div className="architect-form-form-group">
                  <label htmlFor="completionDate">
                    Preferred Design Completion Date*
                  </label>
                  <input
                    type="date"
                    id="completionDate"
                    name="completionDate"
                    value={form.completionDate}
                    onChange={handleChange}
                    required
                  />
                  {errors.completionDate && (
                    <div className="architect-form-error-message">
                      {errors.completionDate}
                    </div>
                  )}
                </div>
              </div>

              {/* ========== DYNAMIC FLOOR REQUIREMENTS – FIXED ========== */}
              <div id="architect-form-floorRequirements">
                {form.floorRequirements.map((floor, idx) => (
                  <div key={idx} className="architect-form-form-group">
                    <label htmlFor={`floor${idx + 1}`}>
                      Floor {idx + 1} Room Requirements*
                    </label>

                    {/* TEXTAREA FIRST – fully interactive */}
                    <textarea
                      id={`floor${idx + 1}`}
                      name={`floorRequirements[${idx}][details]`}
                      value={floor.details}
                      onChange={(e) => handleFloorChange(idx, e.target.value)}
                      placeholder="e.g., 2 Bedrooms, 1 Bathroom, Living Room, etc."
                      required
                      rows={4}
                    />

                    {/* HIDDEN INPUT AFTER – no overlap */}
                    <input
                      type="hidden"
                      name={`floorRequirements[${idx}][floorNumber]`}
                      value={floor.floorNumber}
                    />

                    {/* Error */}
                    {errors[`floor${idx + 1}`] && (
                      <div className="architect-form-error-message">
                        {errors[`floor${idx + 1}`]}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="architect-form-form-group">
                <label htmlFor="specialFeatures">Special Features</label>
                <textarea
                  id="specialFeatures"
                  name="specialFeatures"
                  value={form.specialFeatures}
                  onChange={handleChange}
                  placeholder="e.g., Balcony, Garden, Parking Space, Swimming Pool, Home Theater, etc."
                  rows={4}
                />
              </div>

              {/* File Upload */}
              <div className="architect-form-form-group">
                <label>Reference Images/Sketches (if any)</label>
                <div className="architect-form-file-upload">
                  <label htmlFor="referenceImages">
                    Drop files here or click to upload
                    <br />
                    (JPG, PNG, PDF up to 5MB)
                  </label>
                  <input
                    type="file"
                    id="referenceImages"
                    name="referenceImages"
                    multiple
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileChange}
                  />
                </div>
                <div className="architect-form-image-preview-container">
                  {previews.map((p, i) => (
                    <div
                      key={i}
                      className={`architect-form-image-preview ${
                        p.type === "pdf" ? "architect-form-pdf-preview" : ""
                      }`}
                    >
                      {p.type === "image" && <img src={p.url} alt="" />}
                      {p.type === "pdf" && (
                        <>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#d9534f"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <path d="M9 15h6" />
                            <path d="M9 11h6" />
                          </svg>
                          <div className="architect-form-file-name">
                            {p.file.name}
                          </div>
                        </>
                      )}
                      <button
                        type="button"
                        className="architect-form-remove-btn"
                        onClick={() => removeFile(i)}
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
              className="architect-form-btn-submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? isEditMode
                  ? "Updating..."
                  : "Uploading..."
                : isEditMode
                  ? "Update Design Request"
                  : "Submit Design Request"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ArchitectForm;
