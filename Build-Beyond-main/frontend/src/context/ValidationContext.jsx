import React, { createContext, useContext } from "react";

const ValidationContext = createContext();

export const useValidation = () => {
  const ctx = useContext(ValidationContext);
  if (!ctx) throw new Error("useValidation must be used within ValidationProvider");
  return ctx;
};

export const ValidationProvider = ({ children }) => {
  // Helper: trim and normalize
  const norm = (v) => (v === null || v === undefined ? "" : String(v).trim());

  // Strict email
  const validateEmail = (email) => {
    const v = norm(email);
    if (!v) return "Email is required";
    const re = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!re.test(v)) return "Enter a valid email address";
    if (v.length > 254) return "Email must not exceed 254 characters";
    return "";
  };

  // Strong password: min 10, at least upper, lower, number, special
  const validatePassword = (password) => {
    const v = norm(password);
    if (!v) return "Password is required";
    if (v.length < 10) return "Password must be at least 10 characters";
    if (v.length > 128) return "Password must not exceed 128 characters";
    if (!/[A-Z]/.test(v)) return "Password must include at least one uppercase letter";
    if (!/[a-z]/.test(v)) return "Password must include at least one lowercase letter";
    if (!/[0-9]/.test(v)) return "Password must include at least one number";
    if (!/[!@#$%^&*()_\-+=\[\]{};:'",.<>/?\\|`~]/.test(v)) return "Password must include at least one special character";
    return "";
  };

  // Username: strict alnum + underscore/dot, 3-30
  const validateUsername = (username) => {
    const v = norm(username);
    if (!v) return "Username is required";
    if (v.length < 3 || v.length > 30) return "Username must be 3 to 30 characters";
    const re = /^[A-Za-z0-9._]+$/;
    if (!re.test(v)) return "Username may contain only letters, numbers, dot and underscore";
    if (/^\./.test(v) || /\.$/.test(v)) return "Username cannot start or end with a dot";
    return "";
  };

  // Phone: strict international-ish digits, 10-15 digits, optional +
  const validatePhone = (phone) => {
    const v = norm(phone);
    if (!v) return "Phone number is required";
    const digits = v.replace(/\D/g, "");
    if (digits.length !== 10) return "Enter a valid 10-digit phone number";
    if (digits.charAt(0) === "0") return "Phone number must not start with 0";
    return "";
  };

  // Name: only letters A-Z (case-insensitive) and single spaces between words
  const validateName = (name, fieldName = "Name") => {
    const v = norm(name);
    if (!v) return `${fieldName} is required`;
    if (v.length < 2) return `${fieldName} must be at least 2 characters`;
    if (v.length > 100) return `${fieldName} must not exceed 100 characters`;
    // Only letters and single spaces, no digits/symbols, no leading/trailing/multiple spaces
    const re = /^[A-Za-z]+(?:\s[A-Za-z]+)*$/;
    if (!re.test(v)) return `${fieldName} must contain only letters and single spaces (no numbers or symbols)`;
    return "";
  };

  // City / State: letters, single spaces or hyphens
  const validateCity = (city) => {
    const v = norm(city);
    if (!v) return "City is required";
    if (v.length < 2) return "City must be at least 2 characters";
    if (v.length > 100) return "City must not exceed 100 characters";
    const re = /^[A-Za-z]+(?:[ \-][A-Za-z]+)*$/;
    if (!re.test(v)) return "City may contain only letters, single spaces or hyphens";
    return "";
  };

  const validateState = (state) => {
    const v = norm(state);
    if (!v) return "State is required";
    if (v.length < 2) return "State must be at least 2 characters";
    if (v.length > 100) return "State must not exceed 100 characters";
    const re = /^[A-Za-z]+(?:[ \-][A-Za-z]+)*$/;
    if (!re.test(v)) return "State may contain only letters, single spaces or hyphens";
    return "";
  };

  // Company / Project names: strict-ish — allow letters, numbers, spaces, &, -, .
  const validateCompanyName = (name) => {
    const v = norm(name);
    if (!v) return "Company name is required";
    if (v.length < 2) return "Company name must be at least 2 characters";
    if (v.length > 150) return "Company name must not exceed 150 characters";
    const re = /^[A-Za-z0-9&\-\.\s]+$/;
    if (!re.test(v)) return "Company name contains invalid characters. Allowed: letters, numbers, spaces, &, -, .";
    return "";
  };

  const validateProjectName = (name) => {
    const v = norm(name);
    if (!v) return "Project name is required";
    if (v.length < 3) return "Project name must be at least 3 characters";
    if (v.length > 200) return "Project name must not exceed 200 characters";
    const re = /^[A-Za-z0-9&\-\.\s]+$/;
    if (!re.test(v)) return "Project name contains invalid characters. Allowed: letters, numbers, spaces, &, -, .";
    return "";
  };

  // ID formats
  const validateAadhaar = (aadhaar) => {
    const v = norm(aadhaar).replace(/\s+/g, "");
    if (!v) return "";
    if (!/^\d{12}$/.test(v)) return "Aadhaar must be exactly 12 digits";
    return "";
  };

  const validatePAN = (pan) => {
    const v = norm(pan).toUpperCase();
    if (!v) return "";
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(v)) return "PAN is invalid";
    return "";
  };

  const validateGST = (gst) => {
    const v = norm(gst).toUpperCase();
    if (!v) return "";
    // strict GSTIN pattern
    if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(v)) return "GSTIN is invalid";
    return "";
  };

  // Pincode (India) 6 digits
  const validatePincode = (pincode) => {
    const v = norm(pincode);
    if (!v) return "Pincode is required";
    if (!/^\d{6}$/.test(v)) return "Pincode must be 6 digits";
    return "";
  };

  // Date validations
  const validateDate = (date, fieldName = "Date") => {
    const v = norm(date);
    if (!v) return `${fieldName} is required`;
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return `${fieldName} is invalid`;
    return "";
  };

  const validateDOB = (dob) => {
    const v = norm(dob);
    if (!v) return "Date of birth is required";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "DOB is invalid";
    const age = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    if (age < 18) return "Must be at least 18 years old";
    if (age > 120) return "DOB seems invalid";
    return "";
  };

  const validateFutureDate = (date, fieldName = "Date") => {
    const v = norm(date);
    if (!v) return `${fieldName} is required`;
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return `${fieldName} is invalid`;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d <= today) return `${fieldName} must be a future date`;
    return "";
  };

  // Required generic
  const validateRequired = (value, fieldName = "Field") => {
    const v = norm(value);
    if (v === "") return `${fieldName} is required`;
    return "";
  };

  // Numbers (allow integer/decimal), with optional min/max
  const validateNumber = (value, fieldName = "Number", min = null, max = null) => {
    const v = norm(value);
    if (v === "") return `${fieldName} is required`;
    if (!/^-?\d+(\.\d+)?$/.test(v)) return `${fieldName} must be a valid number`;
    const num = Number(v);
    if (min !== null && num < min) return `${fieldName} must be at least ${min}`;
    if (max !== null && num > max) return `${fieldName} must be at most ${max}`;
    return "";
  };

  // Budget (positive)
  const validateBudget = (value, max = null) => {
    const v = norm(value).replace(/[,₹\s]/g, "");
    if (v === "") return "Budget is required";
    if (!/^\d+(\.\d{1,2})?$/.test(v)) return "Enter a valid budget amount";
    const num = Number(v);
    if (num <= 0) return "Budget must be greater than zero";
    if (max !== null && num > max) return `Budget must not exceed ${max}`;
    return "";
  };

  // Plot size (numbers with optional common unit)
  const validatePlotSize = (value) => {
    const v = norm(value);
    if (!v) return "Plot size is required";
    if (!/^[\d.,]+\s*(sq\.?ft|sqft|sq\.?m|sqm|m2)?$/i.test(v)) return "Enter a valid plot size (number with optional unit: sqft/sqm)";
    return "";
  };

  // Description: length limits, disallow HTML tags
  const validateDescription = (text, min = 0, max = 5000) => {
    const v = text === null || text === undefined ? "" : String(text);
    const t = v.trim();
    if (min > 0 && t.length < min) return `Description must be at least ${min} characters`;
    if (max !== null && t.length > max) return `Description must not exceed ${max} characters`;
    // block HTML tags to avoid markup injection
    if (/<[^>]+>/.test(t)) return "Description contains invalid characters";
    // block very long repeated characters
    if (/(.)\1{30,}/.test(t)) return "Description contains suspicious repeated characters";
    return "";
  };

  // File validation: types and max size (MB)
  const validateFile = (file, allowedTypes = ["image/jpeg", "image/png", "application/pdf"], maxSizeMB = 5) => {
    if (!file) return "No file provided";
    if (typeof file.type !== "string") return "Invalid file";
    if (!allowedTypes.includes(file.type)) return `File type not allowed (${file.type})`;
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) return `File exceeds ${maxSizeMB}MB limit`;
    return "";
  };

  // URL validator (strict)
  const validateURL = (url, fieldName = "URL") => {
    const v = norm(url);
    if (!v) return `${fieldName} is required`;
    try {
      const u = new URL(v);
      if (!["http:", "https:"].includes(u.protocol)) return `${fieldName} must use http or https`;
      return "";
    } catch {
      return `${fieldName} is invalid`;
    }
  };

  // Export all validators
  const value = {
    validateEmail,
    validatePassword,
    validateUsername,
    validatePhone,
    validateName,
    validateCity,
    validateState,
    validateCompanyName,
    validateProjectName,
    validateAadhaar,
    validatePAN,
    validateGST,
    validatePincode,
    validateDate,
    validateDOB,
    validateFutureDate,
    validateRequired,
    validateNumber,
    validateBudget,
    validatePlotSize,
    validateDescription,
    validateFile,
    validateURL,
  };

  return <ValidationContext.Provider value={value}>{children}</ValidationContext.Provider>;
};

export default ValidationContext;