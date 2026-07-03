import React, { useState, useEffect } from "react";
import axiosInstance from '../../../../api/axiosInstance';
import "./BidForm.css";
import { useNavigate } from "react-router-dom";
import { useValidation } from "../../../../context/ValidationContext";
import { useDispatch, useSelector } from "react-redux";
import { fetchCustomerProfile } from "../../../../store/slices/customerProfileSlice";
import {
  clearDraft,
  clearClipboard,
  readClipboard,
  readDraft,
  saveDraft,
  writeClipboard,
} from "./formDraftStorage";
import "./formDraftControls.css";

const MAX_FLOOR_FILES = 5;
const ALLOWED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_FILE_MB = 5;
const MIN_BID_BUDGET = 10000000;

const BidForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const customerProfile = useSelector((state) => state.customerProfile);
  const {
    validateRequired,
    validateProjectName,
    validateEmail,
    validatePhone,
    validatePincode,
    validateNumber,
    validateBudget,
    validateDescription,
    validateFile,
  } = useValidation();

  const [totalFloors, setTotalFloors] = useState("");
  const [floors, setFloors] = useState([]);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState("");
  const draftScope = "default";
  const clipboardKey = "bid-form";
  const [copiedForm, setCopiedForm] = useState(() =>
    readClipboard(clipboardKey),
  );

  // Base form state for static fields used elsewhere in component
  const [formData, setFormData] = useState({
    projectName: "",
    customerName: customerProfile.name || "",
    customerEmail: customerProfile.email || "",
    customerPhone: customerProfile.phone || "",
    projectLocation: "",
    projectAddress: "",
    estimatedBudget: "",
  });

  // Update form fields if profile changes and fields are empty
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      customerName: prev.customerName || customerProfile.name || "",
      customerEmail: prev.customerEmail || customerProfile.email || "",
      customerPhone: prev.customerPhone || customerProfile.phone || "",
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
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[name];
      return copy;
    });
  };

  const handleFloorCountChange = (e) => {
    const val = e.target.value;
    setTotalFloors(val);
    const count = parseInt(val, 10);
    if (!Number.isInteger(count) || count <= 0) {
      setFloors([]);
      return;
    }
    const newFloors = Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      floorType: "",
      floorArea: "",
      floorDescription: "",
      floorImage: null,
      preview: null,
    }));
    setFloors(newFloors);
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.totalFloors;
      return copy;
    });
  };

  const updateFloor = (id, field, value) => {
    setFloors((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [field]: value } : f)),
    );
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[`${field}-${id}`];
      return copy;
    });
  };

  const removeFloor = (id) => {
    setFloors((prev) => prev.filter((f) => f.id !== id));
    setTotalFloors((prev) => {
      const n = parseInt(prev, 10);
      return Number.isNaN(n) ? "" : String(Math.max(0, n - 1));
    });
  };

  const handleImageChange = (id, file) => {
    if (!file) return;
    const fileErr = validateFile(file, ALLOWED_FILE_TYPES, MAX_FILE_MB);
    if (fileErr) {
      setErrors((prev) => ({ ...prev, [`floorImage-${id}`]: fileErr }));
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setFloors((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, floorImage: file, preview: reader.result } : f,
        ),
      );
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[`floorImage-${id}`];
        return copy;
      });
    };
    reader.readAsDataURL(file);
  };

  const restoreDraft = () => {
    const draft = readDraft("bid-form", draftScope);
    if (!draft?.data) return;

    const values = draft.data.values || {};
    setFormData((prev) => ({
      ...prev,
      projectName: values.projectName || prev.projectName,
      customerName: values.customerName || prev.customerName,
      customerEmail: values.customerEmail || prev.customerEmail,
      customerPhone: values.customerPhone || prev.customerPhone,
      projectLocation: values.projectLocation || prev.projectLocation,
      projectAddress: values.projectAddress || prev.projectAddress,
      estimatedBudget: values.estimatedBudget || prev.estimatedBudget,
    }));
    setTotalFloors(values.totalFloors || "");
    setFloors(Array.isArray(draft.data.floors) ? draft.data.floors : []);

    const domValues = {
      projectName: values.projectName,
      buildingType: values.buildingType,
      projectAddress: values.projectAddress,
      projectLocation: values.projectLocation,
      totalArea: values.totalArea,
      estimatedBudget: values.estimatedBudget,
      projectTimeline: values.projectTimeline,
      specialRequirements: values.specialRequirements,
      accessibilityNeeds: values.accessibilityNeeds,
      energyEfficiency: values.energyEfficiency,
    };

    Object.entries(domValues).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element && value !== undefined && value !== null) {
        element.value = value;
      }
    });

    setDraftSavedAt(draft.savedAt || "");
  };

  const copyCurrentForm = () => {
    writeClipboard(
      clipboardKey,
      {
        values: {
          projectName: document.getElementById("projectName")?.value || "",
          buildingType: document.getElementById("buildingType")?.value || "",
          customerName: formData.customerName,
          customerEmail: formData.customerEmail,
          customerPhone: formData.customerPhone,
          projectAddress:
            document.getElementById("projectAddress")?.value || "",
          projectLocation:
            document.getElementById("projectLocation")?.value || "",
          totalArea: document.getElementById("totalArea")?.value || "",
          estimatedBudget:
            document.getElementById("estimatedBudget")?.value || "",
          projectTimeline:
            document.getElementById("projectTimeline")?.value || "",
          totalFloors,
          specialRequirements:
            document.getElementById("specialRequirements")?.value || "",
          accessibilityNeeds:
            document.getElementById("accessibilityNeeds")?.value || "",
          energyEfficiency:
            document.getElementById("energyEfficiency")?.value || "",
        },
        floors: floors.map(({ floorImage, preview, ...rest }) => rest),
      },
      document.getElementById("projectName")?.value || "Bid request",
    );
    setCopiedForm(readClipboard(clipboardKey));
  };

  const pasteCopiedForm = () => {
    if (!copiedForm?.data) return;

    const values = copiedForm.data.values || {};
    setFormData((prev) => ({
      ...prev,
      projectName: values.projectName || prev.projectName,
      customerName: values.customerName || prev.customerName,
      customerEmail: values.customerEmail || prev.customerEmail,
      customerPhone: values.customerPhone || prev.customerPhone,
      projectLocation: values.projectLocation || prev.projectLocation,
      projectAddress: values.projectAddress || prev.projectAddress,
      estimatedBudget: values.estimatedBudget || prev.estimatedBudget,
    }));
    setTotalFloors(values.totalFloors || "");
    setFloors(
      Array.isArray(copiedForm.data.floors) ? copiedForm.data.floors : [],
    );

    const domValues = {
      projectName: values.projectName,
      buildingType: values.buildingType,
      projectAddress: values.projectAddress,
      projectLocation: values.projectLocation,
      totalArea: values.totalArea,
      estimatedBudget: values.estimatedBudget,
      projectTimeline: values.projectTimeline,
      specialRequirements: values.specialRequirements,
      accessibilityNeeds: values.accessibilityNeeds,
      energyEfficiency: values.energyEfficiency,
    };

    Object.entries(domValues).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element && value !== undefined && value !== null) {
        element.value = value;
      }
    });

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
    const savedAt = saveDraft("bid-form", draftScope, {
      values: {
        projectName: document.getElementById("projectName")?.value || "",
        buildingType: document.getElementById("buildingType")?.value || "",
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        projectAddress: document.getElementById("projectAddress")?.value || "",
        projectLocation:
          document.getElementById("projectLocation")?.value || "",
        totalArea: document.getElementById("totalArea")?.value || "",
        estimatedBudget:
          document.getElementById("estimatedBudget")?.value || "",
        projectTimeline:
          document.getElementById("projectTimeline")?.value || "",
        totalFloors,
        specialRequirements:
          document.getElementById("specialRequirements")?.value || "",
        accessibilityNeeds:
          document.getElementById("accessibilityNeeds")?.value || "",
        energyEfficiency:
          document.getElementById("energyEfficiency")?.value || "",
      },
      floors,
    });
    setDraftSavedAt(savedAt);
  };

  const clearCurrentDraft = () => {
    clearDraft("bid-form", draftScope);
    setDraftSavedAt("");
  };

  useEffect(() => {
    restoreDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validate = () => {
    const newErrors = {};

    const projectName =
      document.getElementById("projectName")?.value?.trim() || "";
    const buildingType =
      document.getElementById("buildingType")?.value?.trim() || "";
    const customerName =
      document.getElementById("customerName")?.value?.trim() || "";
    const customerEmail =
      document.getElementById("customerEmail")?.value?.trim() || "";
    const customerPhone =
      document.getElementById("customerPhone")?.value?.trim() || "";
    const projectAddress =
      document.getElementById("projectAddress")?.value?.trim() || "";
    const projectLocation =
      document.getElementById("projectLocation")?.value?.trim() || "";
    const totalArea = document.getElementById("totalArea")?.value?.trim() || "";
    const estimatedBudget =
      document.getElementById("estimatedBudget")?.value?.trim() || "";
    const projectTimeline =
      document.getElementById("projectTimeline")?.value?.trim() || "";
    const specialRequirements =
      document.getElementById("specialRequirements")?.value?.trim() || "";
    const accessibilityNeeds =
      document.getElementById("accessibilityNeeds")?.value?.trim() || "";
    const energyEfficiency =
      document.getElementById("energyEfficiency")?.value?.trim() || "";

    const pnErr = validateProjectName(projectName);
    if (pnErr) newErrors.projectName = pnErr;

    if (validateRequired(buildingType, "Building type"))
      newErrors.buildingType = validateRequired(buildingType, "Building type");

    const cnErr = validateRequired(customerName, "Customer name");
    if (cnErr) newErrors.customerName = cnErr;

    const emailErr = validateEmail(customerEmail);
    if (emailErr) newErrors.customerEmail = emailErr;

    const phoneErr = validatePhone(customerPhone);
    if (phoneErr) newErrors.customerPhone = phoneErr;

    const addrErr = validateRequired(projectAddress, "Project address");
    if (addrErr) newErrors.projectAddress = addrErr;

    const pinErr = validatePincode(projectLocation);
    if (pinErr) newErrors.projectLocation = pinErr;

    const areaErr = validateNumber(totalArea, "Total area", 1);
    if (areaErr) newErrors.totalArea = areaErr;

    const budgetErr = validateBudget(estimatedBudget, 1000000000);
    if (budgetErr) {
      newErrors.estimatedBudget = budgetErr;
    } else if (Number(estimatedBudget) < MIN_BID_BUDGET) {
      newErrors.estimatedBudget = "Minimum bid budget is ₹1,00,00,000";
    }

    const timelineErr = validateNumber(projectTimeline, "Project timeline", 1);
    if (timelineErr) newErrors.projectTimeline = timelineErr;

    if (validateRequired(specialRequirements, "Special requirements"))
      newErrors.specialRequirements = validateRequired(
        specialRequirements,
        "Special requirements",
      );
    if (validateRequired(accessibilityNeeds, "Accessibility needs"))
      newErrors.accessibilityNeeds = validateRequired(
        accessibilityNeeds,
        "Accessibility needs",
      );
    if (validateRequired(energyEfficiency, "Energy efficiency"))
      newErrors.energyEfficiency = validateRequired(
        energyEfficiency,
        "Energy efficiency",
      );

    const floorCount = parseInt(totalFloors, 10);
    if (floorCount > 0 && floors.length === 0) {
      newErrors.totalFloors = "Please generate floor details";
    } else {
      floors.forEach((f) => {
        if (!f.floorType || String(f.floorType).trim() === "")
          newErrors[`floorType-${f.id}`] = "This field is required";
        if (!f.floorArea || Number(f.floorArea) <= 0)
          newErrors[`floorArea-${f.id}`] = "Please enter a valid floor area";
        const descErr = validateDescription(f.floorDescription || "", 1, 2000);
        if (descErr) newErrors[`floorDescription-${f.id}`] = descErr;
        if (f.floorImage) {
          const fileErr = validateFile(
            f.floorImage,
            ALLOWED_FILE_TYPES,
            MAX_FILE_MB,
          );
          if (fileErr) newErrors[`floorImage-${f.id}`] = fileErr;
        }
      });
    }

    const siteFilesInput = document.getElementById("siteFiles");
    if (siteFilesInput?.files && siteFilesInput.files.length > 0) {
      for (let file of siteFilesInput.files) {
        const sfErr = validateFile(file, ALLOWED_FILE_TYPES, MAX_FILE_MB);
        if (sfErr) {
          newErrors.siteFiles = sfErr;
          break;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (submitting) return;
    if (!validate()) {
      setFormError("Please correct the errors in the form before submitting");
      return;
    }

    setSubmitting(true);
    const formData = new FormData();

    formData.append(
      "projectName",
      document.getElementById("projectName").value.trim(),
    );
    formData.append(
      "buildingType",
      document.getElementById("buildingType").value.trim(),
    );
    formData.append(
      "customerName",
      document.getElementById("customerName").value.trim(),
    );
    formData.append(
      "customerEmail",
      document.getElementById("customerEmail").value.trim(),
    );
    formData.append(
      "customerPhone",
      document.getElementById("customerPhone").value.trim(),
    );
    formData.append(
      "projectAddress",
      document.getElementById("projectAddress").value.trim(),
    );
    formData.append(
      "projectLocation",
      document.getElementById("projectLocation").value.trim(),
    );
    formData.append(
      "totalArea",
      document.getElementById("totalArea").value.trim(),
    );
    formData.append(
      "estimatedBudget",
      document.getElementById("estimatedBudget").value.trim(),
    );
    formData.append(
      "projectTimeline",
      document.getElementById("projectTimeline").value.trim(),
    );
    formData.append("totalFloors", totalFloors);
    formData.append(
      "specialRequirements",
      document.getElementById("specialRequirements").value.trim(),
    );
    formData.append(
      "accessibilityNeeds",
      document.getElementById("accessibilityNeeds").value.trim(),
    );
    formData.append(
      "energyEfficiency",
      document.getElementById("energyEfficiency").value.trim(),
    );

    floors.forEach((f, i) => {
      formData.append(`floors[${i}][floorNumber]`, f.id);
      formData.append(`floors[${i}][floorType]`, f.floorType);
      formData.append(`floors[${i}][floorArea]`, f.floorArea);
      formData.append(`floors[${i}][floorDescription]`, f.floorDescription);
      if (f.floorImage) formData.append("floorImages", f.floorImage);
    });

    const siteFilesInput2 = document.getElementById("siteFiles");
    if (siteFilesInput2?.files) {
      Array.from(siteFilesInput2.files).forEach((file) =>
        formData.append("siteFiles", file),
      );
    }

    try {
      const response = await axiosInstance.post("/api/bidForm_Submit", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      if (response.data && response.data.success) {
        alert("Bid submitted successfully!");
        clearCurrentDraft();
        navigate(-1);
      } else {
        setFormError(
          response.data?.error || "Submission failed. Please try again.",
        );
      }
    } catch (err) {
      console.error("Submission error:", err.response?.data || err);
      setFormError(
        err.response?.data?.error || "Submission failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bf-container">
      <div className="bf-title-block">
        <h1>Bid Form</h1>
      </div>

      <div className="customer-form-draft-bar">
        <div className="customer-form-draft-copy">
          <div className="customer-form-draft-title">Drafts</div>
          <div className="customer-form-draft-note">
            Save this form locally and restore it later on this device.
          </div>
          {copiedForm?.data && (
            <div className="customer-form-draft-clipboard">
              Copied form ready to paste into another bid request.
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
            className="customer-form-draft-button customer-form-draft-button-secondary"
            onClick={restoreDraft}
          >
            Restore Draft
          </button>
          <button
            type="button"
            className="customer-form-draft-button customer-form-draft-button-primary"
            onClick={saveCurrentDraft}
          >
            Save Draft
          </button>
          <button
            type="button"
            className="customer-form-draft-button customer-form-draft-button-clipboard"
            onClick={handleClipboardAction}
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
            onClick={clearCurrentDraft}
            disabled={!draftSavedAt}
          >
            Clear Draft
          </button>
        </div>
      </div>

      <form
        id="bidForm"
        onSubmit={handleSubmit}
        encType="multipart/form-data"
        noValidate
      >
        <div className="bf-form-section">
          <h2>Project Information</h2>
          <div className="bf-grid-2">
            <div className="bf-form-group">
              <label htmlFor="projectName" className="bf-required">
                Project Name
              </label>
              <input type="text" id="projectName" name="projectName" />
              <div
                className="bf-error-message"
                style={{ display: errors.projectName ? "block" : "none" }}
              >
                {errors.projectName}
              </div>
            </div>
            <div className="bf-form-group">
              <label htmlFor="buildingType" className="bf-required">
                Building Type
              </label>
              <select id="buildingType" name="buildingType">
                <option value="">Select Building Type</option>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="industrial">Industrial</option>
                <option value="mixedUse">Mixed Use</option>
                <option value="other">Other</option>
              </select>
              <div
                className="bf-error-message"
                style={{ display: errors.buildingType ? "block" : "none" }}
              >
                {errors.buildingType}
              </div>
            </div>
          </div>
        </div>

        <div className="bf-form-section">
          <h2>Customer Information</h2>
          <div className="bf-grid-2">
            <div className="bf-form-group">
              <label htmlFor="customerName" className="bf-required">
                Full Name
              </label>
              <input
                type="text"
                id="customerName"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
              />
              <div
                className="bf-error-message"
                style={{ display: errors.customerName ? "block" : "none" }}
              >
                {errors.customerName}
              </div>
            </div>
            <div className="bf-form-group">
              <label htmlFor="customerEmail" className="bf-required">
                Email Address
              </label>
              <input
                type="email"
                id="customerEmail"
                name="customerEmail"
                value={formData.customerEmail}
                onChange={handleInputChange}
              />
              <div
                className="bf-error-message"
                style={{ display: errors.customerEmail ? "block" : "none" }}
              >
                {errors.customerEmail}
              </div>
            </div>
          </div>
          <div className="bf-form-group">
            <label htmlFor="customerPhone" className="bf-required">
              Phone Number
            </label>
            <input
              type="tel"
              id="customerPhone"
              name="customerPhone"
              value={formData.customerPhone}
              onChange={handleInputChange}
            />
            <div
              className="bf-error-message"
              style={{ display: errors.customerPhone ? "block" : "none" }}
            >
              {errors.customerPhone}
            </div>
          </div>
        </div>

        <div className="bf-form-section">
          <h2>Project Details</h2>
          <div className="bf-form-group">
            <label htmlFor="projectAddress" className="bf-required">
              Project Address
            </label>
            <textarea id="projectAddress" name="projectAddress"></textarea>
            <div
              className="bf-error-message"
              style={{ display: errors.projectAddress ? "block" : "none" }}
            >
              {errors.projectAddress}
            </div>
          </div>

          <div className="bf-grid-2">
            <div className="bf-form-group">
              <label htmlFor="projectLocation" className="bf-required">
                Project Location Pincode
              </label>
              <input
                type="text"
                id="projectLocation"
                name="projectLocation"
                placeholder="e.g., 534260"
              />
              <div
                className="bf-error-message"
                style={{ display: errors.projectLocation ? "block" : "none" }}
              >
                {errors.projectLocation}
              </div>
            </div>
            <div className="bf-form-group">
              <label htmlFor="totalArea" className="bf-required">
                Total Building Area (square meters)
              </label>
              <input
                type="number"
                id="totalArea"
                name="totalArea"
                step="1"
                min="1"
              />
              <div
                className="bf-error-message"
                style={{ display: errors.totalArea ? "block" : "none" }}
              >
                {errors.totalArea}
              </div>
            </div>
          </div>

          <div className="bf-grid-2">
            <div className="bf-form-group">
              <label htmlFor="estimatedBudget" className="bf-required">
                Max Budget ₹
              </label>
              <input
                type="number"
                id="estimatedBudget"
                name="estimatedBudget"
                min={MIN_BID_BUDGET}
              />
              <div
                className="bf-error-message"
                style={{ display: errors.estimatedBudget ? "block" : "none" }}
              >
                {errors.estimatedBudget}
              </div>
            </div>
            <div className="bf-form-group">
              <label htmlFor="projectTimeline" className="bf-required">
                Expected Timeline (months)
              </label>
              <input
                type="number"
                id="projectTimeline"
                name="projectTimeline"
                min="1"
              />
              <div
                className="bf-error-message"
                style={{ display: errors.projectTimeline ? "block" : "none" }}
              >
                {errors.projectTimeline}
              </div>
            </div>
          </div>
        </div>

        <div className="bf-form-section">
          <h2>Floor Plans</h2>
          <div className="bf-form-group">
            <label htmlFor="totalFloors" className="bf-required">
              Number of Floors
            </label>
            <input
              type="number"
              id="totalFloors"
              value={totalFloors}
              onChange={(e) => handleFloorCountChange(e)}
              min="1"
            />
            <div
              className="bf-error-message"
              style={{ display: errors.totalFloors ? "block" : "none" }}
            >
              {errors.totalFloors}
            </div>
          </div>

          <div id="floorDetails">
            {floors.map((f) => (
              <div key={f.id} className="bf-floor-container">
                <div className="bf-floor-header">
                  <h3>Floor {f.id}</h3>
                  <button
                    type="button"
                    className="bf-btn bf-btn-remove"
                    onClick={() => removeFloor(f.id)}
                  >
                    Remove
                  </button>
                </div>
                <div className="bf-grid-2">
                  <div className="bf-form-group">
                    <label
                      htmlFor={`floorType-${f.id}`}
                      className="bf-required"
                    >
                      Floor Type
                    </label>
                    <select
                      id={`floorType-${f.id}`}
                      value={f.floorType}
                      onChange={(e) =>
                        updateFloor(f.id, "floorType", e.target.value)
                      }
                    >
                      <option value="">Select Floor Type</option>
                      <option value="residential">Residential</option>
                      <option value="commercial">Commercial</option>
                      <option value="parking">Parking</option>
                      <option value="mechanical">Mechanical/Utility</option>
                      <option value="other">Other</option>
                    </select>
                    <div
                      className="bf-error-message"
                      style={{
                        display: errors[`floorType-${f.id}`] ? "block" : "none",
                      }}
                    >
                      {errors[`floorType-${f.id}`]}
                    </div>
                  </div>
                  <div className="bf-form-group">
                    <label
                      htmlFor={`floorArea-${f.id}`}
                      className="bf-required"
                    >
                      Floor Area (sq meters)
                    </label>
                    <input
                      type="number"
                      id={`floorArea-${f.id}`}
                      value={f.floorArea}
                      onChange={(e) =>
                        updateFloor(f.id, "floorArea", e.target.value)
                      }
                      step="1"
                      min="1"
                    />
                    <div
                      className="bf-error-message"
                      style={{
                        display: errors[`floorArea-${f.id}`] ? "block" : "none",
                      }}
                    >
                      {errors[`floorArea-${f.id}`]}
                    </div>
                  </div>
                </div>
                <div className="bf-form-group">
                  <label
                    htmlFor={`floorDescription-${f.id}`}
                    className="bf-required"
                  >
                    Floor Description
                  </label>
                  <textarea
                    id={`floorDescription-${f.id}`}
                    value={f.floorDescription}
                    onChange={(e) =>
                      updateFloor(f.id, "floorDescription", e.target.value)
                    }
                    placeholder="Describe the layout and purpose of this floor"
                  ></textarea>
                  <div
                    className="bf-error-message"
                    style={{
                      display: errors[`floorDescription-${f.id}`]
                        ? "block"
                        : "none",
                    }}
                  >
                    {errors[`floorDescription-${f.id}`]}
                  </div>
                </div>
                <div className="bf-form-group">
                  <label htmlFor={`floorImage-${f.id}`}>
                    Floor Plan Image (Optional)
                  </label>
                  <input
                    type="file"
                    id={`floorImage-${f.id}`}
                    accept="application/pdf,image/jpeg,image/png"
                    onChange={(e) => handleImageChange(f.id, e.target.files[0])}
                  />
                  <div
                    className="bf-error-message"
                    style={{
                      display: errors[`floorImage-${f.id}`] ? "block" : "none",
                    }}
                  >
                    {errors[`floorImage-${f.id}`]}
                  </div>
                  {f.preview && (
                    <img
                      src={f.preview}
                      alt="Preview"
                      className="bf-image-preview"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bf-form-section">
          <h2>Additional Requirements</h2>
          <div className="bf-form-group">
            <label htmlFor="specialRequirements" className="bf-required">
              Special Requirements or Considerations
            </label>
            <textarea
              id="specialRequirements"
              name="specialRequirements"
              placeholder="List any special requirements, materials, or design considerations"
            ></textarea>
            <div
              className="bf-error-message"
              style={{ display: errors.specialRequirements ? "block" : "none" }}
            >
              {errors.specialRequirements}
            </div>
          </div>

          <div className="bf-grid-2">
            <div className="bf-form-group">
              <label htmlFor="accessibilityNeeds" className="bf-required">
                Accessibility Needs
              </label>
              <select id="accessibilityNeeds" name="accessibilityNeeds">
                <option value="">Select Options</option>
                <option value="wheelchair">Wheelchair Accessibility</option>
                <option value="elevators">Elevators</option>
                <option value="ramps">Ramps</option>
                <option value="other">Other</option>
                <option value="none">None</option>
              </select>
              <div
                className="bf-error-message"
                style={{
                  display: errors.accessibilityNeeds ? "block" : "none",
                }}
              >
                {errors.accessibilityNeeds}
              </div>
            </div>
            <div className="bf-form-group">
              <label htmlFor="energyEfficiency" className="bf-required">
                Energy Efficiency Goals
              </label>
              <select id="energyEfficiency" name="energyEfficiency">
                <option value="">Select Options</option>
                <option value="standard">Standard</option>
                <option value="leed">LEED Certified</option>
                <option value="passive">Passive House</option>
                <option value="netZero">Net Zero</option>
                <option value="other">Other</option>
              </select>
              <div
                className="bf-error-message"
                style={{ display: errors.energyEfficiency ? "block" : "none" }}
              >
                {errors.energyEfficiency}
              </div>
            </div>
          </div>

          <div className="bf-form-group">
            <label htmlFor="siteFiles">
              Site Plans or Additional Documents (Optional)
            </label>
            <input
              type="file"
              id="siteFiles"
              name="siteFiles"
              multiple
              accept="application/pdf,image/*"
            />
            <div
              className="bf-error-message"
              style={{ display: errors.siteFiles ? "block" : "none" }}
            >
              {errors.siteFiles}
            </div>
          </div>
        </div>

        <div className="bf-submit-section">
          <div
            className="bf-error-message"
            style={{ display: formError ? "block" : "none" }}
          >
            {formError}
          </div>
          <button
            type="submit"
            className="bf-btn bf-submit-btn"
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit Project"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BidForm;
