// src/Pages/login-signup/LoginSignUp.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from 'react-redux';
import { fetchCustomerProfile } from '../../store/slices/customerProfileSlice';
import API_BASE from "../../api/backendBase";
import "./LoginSignUp.css";

const OTP_LENGTH = 6;
const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;


const LoginSignUp = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("signin");
  const [userType, setUserType] = useState("customer");
  const [signinData, setSigninData] = useState({ email: "", password: "" });
  const [signinTwoFactorRequired, setSigninTwoFactorRequired] = useState(false);
  const [signinTwoFactorToken, setSigninTwoFactorToken] = useState("");
  const [signinOtp, setSigninOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [signinOtpError, setSigninOtpError] = useState("");
  const [signinResendSeconds, setSigninResendSeconds] = useState(0);
  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    dob: "",
    phone: "",
    companyName: "",
    contactPerson: "",
    aadharNumber: "",
    specialization: "",
    experience: "",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
  });
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState("email");
  const [forgotEmail, setForgotEmail] = useState("");
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [forgotVerificationToken, setForgotVerificationToken] = useState("");
  const [forgotResendSeconds, setForgotResendSeconds] = useState(0);
  const [forgotError, setForgotError] = useState("");
  const [signupOtpSent, setSignupOtpSent] = useState(false);
  const [signupOtp, setSignupOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [signupEmailVerified, setSignupEmailVerified] = useState(false);
  const [signupVerificationToken, setSignupVerificationToken] = useState("");
  const [signupOtpError, setSignupOtpError] = useState("");
  const [signupResendSeconds, setSignupResendSeconds] = useState(0);
  const [signupOtpLoading, setSignupOtpLoading] = useState(false);
  const [signupVerifyLoading, setSignupVerifyLoading] = useState(false);
  const otpRefs = useRef([]);
  const signupOtpRefs = useRef([]);
  const signinOtpRefs = useRef([]);
  const googleBtnRef = useRef(null);
  const [googleReady, setGoogleReady] = useState(false);
  const [googleError, setGoogleError] = useState("");

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    if (hash === "signup" || hash === "signin") setActiveTab(hash);
    checkSession();
  }, []);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setGoogleError("Google sign-in is not configured yet.");
      return;
    }

    setGoogleError("");

    const initializeGoogle = () => {
      if (!window.google?.accounts?.id || !googleBtnRef.current) return;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
      });

      googleBtnRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "outline",
        size: "large",
        text: "signin_with",
        shape: "pill",
        width: 300,
      });

      setGoogleReady(true);
      setGoogleError("");
    };

    if (window.google?.accounts?.id) {
      initializeGoogle();
      return;
    }

    const existingScript = document.querySelector(`script[src="${GOOGLE_SCRIPT_SRC}"]`);
    if (existingScript) {
      existingScript.addEventListener("load", initializeGoogle);
      return () => existingScript.removeEventListener("load", initializeGoogle);
    }

    const script = document.createElement("script");
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogle;
    script.onerror = () => {
      setGoogleError("Unable to load Google sign-in script.");
      setGoogleReady(false);
    };
    document.body.appendChild(script);

    return () => {
      script.onload = null;
      script.onerror = null;
    };
  }, []);

  useEffect(() => {
    if (!forgotResendSeconds) return;
    const timer = setTimeout(() => setForgotResendSeconds((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [forgotResendSeconds]);

  useEffect(() => {
    if (!signupResendSeconds) return;
    const timer = setTimeout(() => setSignupResendSeconds((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [signupResendSeconds]);

  useEffect(() => {
    if (!signinResendSeconds) return;
    const timer = setTimeout(() => setSigninResendSeconds((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [signinResendSeconds]);

  const checkSession = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/session`, { credentials: "include" });
      const data = await res.json();
      if (data.authenticated) {
        const role = data.user.role;
        if (role === "customer") navigate("/customerdashboard");
        else if (role === "company") navigate("/companydashboard");
        else if (role === "worker") navigate("/workerdashboard");
      }
    } catch (error) {
      console.error("Session check failed:", error);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setErrors({});
    if (tab !== "signin") {
      setSigninTwoFactorRequired(false);
      setSigninTwoFactorToken("");
      setSigninOtp(Array(OTP_LENGTH).fill(""));
      setSigninOtpError("");
      setSigninResendSeconds(0);
    }
    if (tab !== "signup") {
      setSignupOtpLoading(false);
      setSignupVerifyLoading(false);
    }
  };

  const handleUserTypeChange = (type) => {
    setUserType(type);
    setFiles([]);
    setErrors({});
  };

  const handleInputChange = (e, formType) => {
    const { id, value, type, checked } = e.target;
    if (formType === "signin") {
      if (id === "signin-email" && signinTwoFactorRequired) {
        setSigninTwoFactorRequired(false);
        setSigninTwoFactorToken("");
        setSigninOtp(Array(OTP_LENGTH).fill(""));
        setSigninOtpError("");
        setSigninResendSeconds(0);
      }
      setSigninData({ ...signinData, [id.replace("signin-", "")]: value });
    } else if (formType === "signup") {
      if (id === "email" && String(value || "").trim().toLowerCase() !== String(signupData.email || "").trim().toLowerCase()) {
        setSignupEmailVerified(false);
        setSignupVerificationToken("");
        setSignupOtpSent(false);
        setSignupOtp(Array(OTP_LENGTH).fill(""));
        setSignupOtpError("");
        setSignupResendSeconds(0);
      }
      setSignupData({
        ...signupData,
        [id]: type === "checkbox" ? checked : value,
      });
    } else if (formType === "forgot") {
      if (id === "forgot-email") setForgotEmail(value);
      if (id === "new-password") setNewPassword(value);
      if (id === "confirm-new-password") setConfirmNewPassword(value);
    }
  };

  // file handlers with validation
  const MAX_FILES = 5;
  const MAX_FILE_MB = 5;
  const ALLOWED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png"];

  const validateFilesList = (list) => {
    if (!list || !list.length) return null;
    if (list.length > MAX_FILES) return `Maximum ${MAX_FILES} files allowed`;
    for (const f of list) {
      if (!ALLOWED_FILE_TYPES.includes(f.type))
        return `${f.name}: unsupported file type`;
      if (f.size > MAX_FILE_MB * 1024 * 1024)
        return `${f.name}: exceeds ${MAX_FILE_MB}MB`;
    }
    return null;
  };

  const handleFileChange = (e) => {
    const incoming = Array.from(e.target.files || []);
    const combined = [...files, ...incoming];
    const fileErr = validateFilesList(combined);
    if (fileErr) {
      setErrors((p) => ({ ...p, files: fileErr }));
      return;
    }
    setFiles(combined);
    setErrors((p) => ({ ...p, files: undefined }));
  };

  // Strict validators (trim inputs before validating)
  const validateName = (name) => {
    if (!name || String(name).trim().length === 0) return "Name required";
    const s = String(name).trim();
    if (s.length < 2 || s.length > 100)
      return "Name must be between 2 and 100 characters";
    if (!/\s+/.test(s))
      return "Please provide full name (first and last name)";
    if (!/^[A-Za-z][A-Za-z.'\-\s]+$/.test(s))
      return "Name contains invalid characters";
    return "";
  };

  const validateEmail = (email) => {
    if (!email || String(email).trim().length === 0) return "Email required";
    const s = String(email).trim();
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
    return re.test(s) ? "" : "Invalid email address";
  };

  const validatePhone = (phone) => {
    if (!phone || String(phone).trim().length === 0) return "Phone required";
    const s = String(phone).replace(/\D/g, "");
    return /^\d{10}$/.test(s) ? "" : "Enter a valid 10-digit phone number";
  };

  const validatePassword = (pw) => {
    if (!pw) return "Password required";
    // min 8 chars, one upper, one lower, one number, one special
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+=\-{}[\]|\\:;"'<,>.?/]).{8,}$/;
    return re.test(pw)
      ? ""
      : "Password must have min 8 chars, upper/lower/number/special";
  };

  const validateAadhar = (aadhar) => {
    if (!aadhar) return "Aadhar required";
    return /^\d{12}$/.test(String(aadhar).trim())
      ? ""
      : "Aadhar must be 12 digits";
  };

  const validateDOB = (dob) => {
    if (!dob) return "Date of birth required";
    const dobDate = new Date(dob);
    if (Number.isNaN(dobDate.getTime())) return "Invalid date";
    const minAge = new Date();
    minAge.setFullYear(minAge.getFullYear() - 18);
    return dobDate <= minAge ? "" : "You must be at least 18 years old";
  };

  const validateExperience = (exp) => {
    if (exp === "" || exp === null || exp === undefined) return "";
    return /^\d+$/.test(String(exp)) && parseInt(exp, 10) >= 0
      ? ""
      : "Invalid experience years";
  };

  // Validation for signin
  const validateSignin = () => {
    const newErrors = {};
    const email = String(signinData.email || "").trim();
    const pw = signinData.password || "";

    const e = validateEmail(email);
    if (e) newErrors["signin-email"] = e;
    const p = pw ? "" : "Password required";
    if (p) newErrors["signin-password"] = p;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validation for signup (strict)
  const validateSignup = () => {
    const newErrors = {};
    const name = String(signupData.name || "").trim();
    const email = String(signupData.email || "").trim();
    const phone = String(signupData.phone || "").trim();
    const password = signupData.password || "";
    const confirmPassword = signupData.confirmPassword || "";

    // common checks
    const emailErr = validateEmail(email);
    if (emailErr) newErrors.email = emailErr;
    if (!emailErr && !signupEmailVerified) {
      newErrors.emailVerification = "Verify your email with OTP";
    }

    const phoneErr = validatePhone(phone);
    if (phoneErr) newErrors.phone = phoneErr;

    const pwErr = validatePassword(password);
    if (pwErr) newErrors.password = pwErr;

    if (password !== confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    if (!signupData.termsAccepted)
      newErrors.terms = "Accept terms and conditions";

    // user-type specific
    if (userType === "customer" || userType === "worker") {
      const nameErr = validateName(name);
      if (nameErr) newErrors.name = nameErr;

      const dobErr = validateDOB(signupData.dob);
      if (dobErr) newErrors.dob = dobErr;
    }

    if (userType === "company") {
      if (!signupData.companyName || String(signupData.companyName).trim().length < 2)
        newErrors.companyName = "Company name required";
      const cp = String(signupData.contactPerson || "").trim();
      const cpErr = validateName(cp);
      if (cpErr) newErrors.contactPerson = cpErr;
    }

    if (userType === "worker") {
      const aErr = validateAadhar(signupData.aadharNumber || "");
      if (aErr) newErrors.aadharNumber = aErr;

      if (!signupData.specialization)
        newErrors.specialization = "Select specialization";

      const expErr = validateExperience(signupData.experience);
      if (expErr) newErrors.experience = expErr;
    }

    // files validation for company/worker
    if ((userType === "company" || userType === "worker") && files.length > 0) {
      const fErr = validateFilesList(files);
      if (fErr) newErrors.files = fErr;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSigninSubmit = async (e) => {
    e.preventDefault();
    if (!validateSignin()) return;
    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: String(signinData.email || "").trim(),
          password: signinData.password,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.requiresTwoFactor) {
          setSigninTwoFactorRequired(true);
          setSigninTwoFactorToken(data.twoFactorToken || "");
          setSigninOtp(Array(OTP_LENGTH).fill(""));
          setSigninOtpError("");
          setSigninResendSeconds(30);
          return;
        }

        // Fetch and store customer profile in Redux
        dispatch(fetchCustomerProfile());
        navigate(data.redirect);
      } else setErrors({ general: data.message });
    } catch (err) {
      setErrors({ general: "Server error" });
    }
  };

  const handleGoogleCredential = async (googleResponse) => {
    if (!googleResponse?.credential) {
      setErrors({ general: "Google login failed. Please try again." });
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/login/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ credential: googleResponse.credential }),
      });
      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.message || "Google login failed";
        if (data.accountExists === false) {
          setErrors({ 
            general: `${errorMsg} Click "Sign Up" tab to create your account.` 
          });
        } else {
          setErrors({ general: errorMsg });
        }
        return;
      }

      if (data.requiresTwoFactor) {
        setSigninData((prev) => ({ ...prev, email: data.email || prev.email }));
        setSigninTwoFactorRequired(true);
        setSigninTwoFactorToken(data.twoFactorToken || "");
        setSigninOtp(Array(OTP_LENGTH).fill(""));
        setSigninOtpError("");
        setSigninResendSeconds(30);
        setErrors({});
        return;
      }

      dispatch(fetchCustomerProfile());
      navigate(data.redirect);
    } catch (error) {
      setErrors({ general: "Server error" });
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (!validateSignup()) return;

    const formData = new FormData();
    Object.keys(signupData).forEach((key) => {
      if (key !== "confirmPassword") formData.append(key, signupData[key]);
    });
    formData.append("emailVerificationToken", signupVerificationToken);
    formData.append("role", userType);
    files.forEach((file) => formData.append("documents", file));

    try {
      const res = await fetch(`${API_BASE}/api/signup`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) setActiveTab("signin");
      else setErrors({ general: data.message });
    } catch (err) {
      setErrors({ general: "Server error" });
    }
  };

  const startForgotCooldown = () => setForgotResendSeconds(30);
  const startSignupCooldown = () => setSignupResendSeconds(30);

  const sendOtpRequest = async ({ email, purpose }) => {
    const res = await fetch(`${API_BASE}/api/email-otp/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: String(email || "").trim().toLowerCase(), purpose }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to send OTP");
    return data;
  };

  const verifyOtpRequest = async ({ email, otpCode, purpose }) => {
    const res = await fetch(`${API_BASE}/api/email-otp/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        email: String(email || "").trim().toLowerCase(),
        otp: otpCode,
        purpose,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to verify OTP");
    return data;
  };

  const handleSendOTP = async () => {
    const e = validateEmail(String(forgotEmail || "").trim());
    if (e) {
      setForgotError(e);
      return;
    }
    try {
      await sendOtpRequest({ email: forgotEmail, purpose: "forgot-password" });
      setForgotStep("otp");
      setOtp(Array(OTP_LENGTH).fill(""));
      setForgotError("");
      startForgotCooldown();
    } catch (error) {
      setForgotError(error.message);
    }
  };

  const handleVerifyOTP = async () => {
    try {
      const data = await verifyOtpRequest({
        email: forgotEmail,
        otpCode: otp.join(""),
        purpose: "forgot-password",
      });
      setForgotVerificationToken(data.verificationToken);
      setForgotError("");
      setForgotStep("password");
    } catch (error) {
      setForgotError(error.message);
      setOtp(Array(OTP_LENGTH).fill(""));
    }
  };

  const handleResendOTP = async (e) => {
    e.preventDefault();
    if (forgotResendSeconds > 0) return;
    await handleSendOTP();
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setForgotError("Passwords don't match");
      return;
    }
    const pErr = validatePassword(newPassword);
    if (pErr) {
      setForgotError(pErr);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: String(forgotEmail || "").trim().toLowerCase(),
          newPassword,
          verificationToken: forgotVerificationToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setForgotError(data.message || "Unable to reset password");
        return;
      }

      setShowForgotModal(false);
      resetForgotForm();
      setActiveTab("signin");
      setErrors({ general: "Password reset successful. Please sign in." });
    } catch (error) {
      setForgotError("Server error");
    }
  };

  const handleSendSignupOTP = async () => {
    const email = String(signupData.email || "").trim();
    const emailErr = validateEmail(email);
    if (emailErr) {
      setSignupOtpError(emailErr);
      return;
    }
    try {
      setSignupOtpLoading(true);
      setSignupOtpError("");
      await sendOtpRequest({ email, purpose: "signup" });
      setSignupOtpSent(true);
      setSignupOtp(Array(OTP_LENGTH).fill(""));
      startSignupCooldown();
    } catch (error) {
      setSignupOtpError(error.message);
      setSignupOtpSent(false);
    } finally {
      setSignupOtpLoading(false);
    }
  };

  const handleVerifySignupOTP = async () => {
    try {
      setSignupVerifyLoading(true);
      setSignupOtpError("");
      const data = await verifyOtpRequest({
        email: signupData.email,
        otpCode: signupOtp.join(""),
        purpose: "signup",
      });

      setSignupVerificationToken(data.verificationToken);
      setSignupEmailVerified(true);
      setErrors((prev) => ({ ...prev, emailVerification: undefined }));
    } catch (error) {
      setSignupOtpError(error.message);
      setSignupOtp(Array(OTP_LENGTH).fill(""));
    } finally {
      setSignupVerifyLoading(false);
    }
  };

  const handleResendSignupOTP = async (e) => {
    e.preventDefault();
    if (signupResendSeconds > 0) return;
    await handleSendSignupOTP();
  };

  const handleSigninOtpChange = (i, val) => {
    if (val.length > 1) return;
    const newOtp = [...signinOtp];
    newOtp[i] = val.replace(/\D/g, "");
    setSigninOtp(newOtp);
    if (val && i < OTP_LENGTH - 1) signinOtpRefs.current[i + 1]?.focus();
  };

  const handleSigninOtpKeyDown = (i, e) => {
    if (e.key === "Backspace" && !signinOtp[i] && i > 0) {
      signinOtpRefs.current[i - 1]?.focus();
    }
  };

  const handleVerifySigninOtp = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/login/2fa/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: String(signinData.email || "").trim().toLowerCase(),
          otp: signinOtp.join(""),
          twoFactorToken: signinTwoFactorToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSigninOtpError(data.message || "Invalid OTP");
        return;
      }

      dispatch(fetchCustomerProfile());
      navigate(data.redirect);
    } catch (error) {
      setSigninOtpError("Server error");
    }
  };

  const handleResendSigninOtp = async (e) => {
    e.preventDefault();
    if (signinResendSeconds > 0) return;
    try {
      const res = await fetch(`${API_BASE}/api/login/2fa/resend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ twoFactorToken: signinTwoFactorToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSigninOtpError(data.message || "Unable to resend OTP");
        return;
      }

      setSigninTwoFactorToken(data.twoFactorToken || signinTwoFactorToken);
      setSigninResendSeconds(30);
      setSigninOtp(Array(OTP_LENGTH).fill(""));
      setSigninOtpError("");
    } catch (error) {
      setSigninOtpError("Server error");
    }
  };

  const handleOtpChange = (i, val) => {
    if (val.length > 1) return;
    const newOtp = [...otp];
    newOtp[i] = val.replace(/\D/g, "");
    setOtp(newOtp);
    if (val && i < OTP_LENGTH - 1) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKeyDown = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
  };

  const handleSignupOtpChange = (i, val) => {
    if (val.length > 1) return;
    const newOtp = [...signupOtp];
    newOtp[i] = val.replace(/\D/g, "");
    setSignupOtp(newOtp);
    if (val && i < OTP_LENGTH - 1) signupOtpRefs.current[i + 1]?.focus();
  };

  const handleSignupOtpKeyDown = (i, e) => {
    if (e.key === "Backspace" && !signupOtp[i] && i > 0) {
      signupOtpRefs.current[i - 1]?.focus();
    }
  };

  const resetForgotForm = () => {
    setForgotEmail("");
    setOtp(Array(OTP_LENGTH).fill(""));
    setNewPassword("");
    setConfirmNewPassword("");
    setForgotVerificationToken("");
    setForgotResendSeconds(0);
    setForgotError("");
    setForgotStep("email");
  };

  return (
    <div className="ls-landing-page">
      <div className="ls-admin-link">
        <Link to="/platform-manager-login" className="ls-admin-login-btn">
          Platform Manager
        </Link>
        <Link to="/admin-login" className="ls-admin-login-btn ls-admin-login-secondary">
          Admin
        </Link>
      </div>

      <div className="ls-main-container">
        <div className="ls-hero-content">
          <h1>Build & Beyond</h1>
          <p>
            Welcome to Build & Beyond, your ultimate platform for seamless
            construction project management. Connect customers, companies, and
            workers effortlessly.
          </p>
          <div className="ls-btn-container">
            <button
              onClick={() => handleTabChange("signup")}
              className="ls-btn ls-btn-primary"
            >
              Get Started
            </button>
            <button
              onClick={() => handleTabChange("signin")}
              className="ls-btn ls-btn-secondary"
            >
              Learn More
            </button>
          </div>
        </div>

        <div className="ls-auth-card">
          <div className="ls-auth-tabs">
            <button
              className={`ls-tab-button ${activeTab === "signin" ? "active" : ""
                }`}
              onClick={() => handleTabChange("signin")}
            >
              Sign In
            </button>
            <button
              className={`ls-tab-button ${activeTab === "signup" ? "active" : ""
                }`}
              onClick={() => handleTabChange("signup")}
            >
              Sign Up
            </button>
          </div>

          <div className="ls-auth-content">
            {/* SIGN IN */}
            {activeTab === "signin" && (
              <div className="form-content active">
                <form onSubmit={handleSigninSubmit}>
                  <div className="ls-form-header">
                    <h2>Welcome Back</h2>
                    <p>Please enter your details</p>
                  </div>

                  <div className="ls-form-group">
                    <label htmlFor="signin-email">Email</label>
                    <input
                      type="email"
                      id="signin-email"
                      className={`ls-form-input ${errors["signin-email"] ? "error" : ""
                        }`}
                      value={signinData.email}
                      onChange={(e) => handleInputChange(e, "signin")}
                      required
                    />
                    <div className="ls-error-message">
                      {errors["signin-email"]}
                    </div>
                  </div>

                  <div className="ls-form-group">
                    <label htmlFor="signin-password">Password</label>
                    <input
                      type="password"
                      id="signin-password"
                      className={`ls-form-input ${errors["signin-password"] ? "error" : ""
                        }`}
                      value={signinData.password}
                      onChange={(e) => handleInputChange(e, "signin")}
                      required
                    />
                    <div className="ls-error-message">
                      {errors["signin-password"]}
                    </div>
                  </div>

                  {signinTwoFactorRequired && (
                    <div className="ls-signup-otp-box" style={{ marginBottom: "14px" }}>
                      <p style={{ marginBottom: "8px" }}>Enter OTP sent to your email</p>
                      <div className="ls-otp-container" style={{ margin: "0 0 8px" }}>
                        {signinOtp.map((digit, i) => (
                          <input
                            key={i}
                            type="text"
                            maxLength="1"
                            className="ls-otp-input"
                            value={digit}
                            onChange={(e) => handleSigninOtpChange(i, e.target.value)}
                            onKeyDown={(e) => handleSigninOtpKeyDown(i, e)}
                            ref={(el) => (signinOtpRefs.current[i] = el)}
                          />
                        ))}
                      </div>
                      <button type="button" className="ls-btn ls-otp-action-btn ls-w-100" onClick={handleVerifySigninOtp}>
                        Verify OTP
                      </button>
                      <div style={{ marginTop: "8px" }}>
                        <a
                          href="#"
                          onClick={handleResendSigninOtp}
                          className={signinResendSeconds > 0 ? "ls-disabled" : ""}
                        >
                          {signinResendSeconds > 0 ? `Resend Code (${signinResendSeconds}s)` : "Resend Code"}
                        </a>
                      </div>
                      {signinOtpError && <div className="ls-validation-error">{signinOtpError}</div>}
                    </div>
                  )}

                  <div className="ls-form-options">
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowForgotModal(true);
                      }}
                    >
                      Forgot Password?
                    </a>
                  </div>

                  {!signinTwoFactorRequired && (
                    <button
                      type="submit"
                      className="ls-btn ls-btn-primary ls-w-100"
                    >
                      Sign In
                    </button>
                  )}
                  {!signinTwoFactorRequired && (
                    <>
                      <div className="ls-auth-divider"><span>or continue with</span></div>
                      <div className="ls-google-btn-wrap">
                        <div ref={googleBtnRef} className="ls-google-btn" />
                      </div>
                      {!googleReady && GOOGLE_CLIENT_ID && !googleError && (
                        <p className="ls-google-loading">Loading Google sign-in...</p>
                      )}
                      {googleError && (
                        <p className="ls-google-error">{googleError}</p>
                      )}
                    </>
                  )}
                  {errors.general && (
                    <div className="ls-validation-error">{errors.general}</div>
                  )}
                </form>
              </div>
            )}

            {/* SIGN UP */}
            {activeTab === "signup" && (
              <div className="form-content active">
                <form onSubmit={handleSignupSubmit}>
                  <div className="form-header">
                    <h2>Create Account</h2>
                    <p>Join Build & Beyond today</p>
                  </div>

                  <div className="ls-user-type-selection">
                    <label>User Type</label>
                    <div className="ls-user-type-buttons">
                      {["customer", "company", "worker"].map((type) => (
                        <button
                          key={type}
                          type="button"
                          className={`ls-user-type-btn ${userType === type ? "active" : ""
                            }`}
                          onClick={() => handleUserTypeChange(type)}
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="ls-signup-columns">
                    <div className="signup-left">
                      {(userType === "customer" || userType === "worker") && (
                        <>
                          <div className="ls-form-group">
                            <label htmlFor="name">Name</label>
                            <input
                              type="text"
                              id="name"
                              className={`ls-form-input ${errors.name ? "error" : ""
                                }`}
                              value={signupData.name}
                              onChange={(e) => handleInputChange(e, "signup")}
                              required
                            />
                            <div className="ls-error-message">
                              {errors.name}
                            </div>
                          </div>
                        </>
                      )}

                      {userType === "company" && (
                        <>
                          <div className="ls-form-group">
                            <label htmlFor="companyName">Company Name</label>
                            <input
                              type="text"
                              id="companyName"
                              className={`ls-form-input ${errors.companyName ? "error" : ""
                                }`}
                              value={signupData.companyName}
                              onChange={(e) => handleInputChange(e, "signup")}
                              required
                            />
                            <div className="ls-error-message">
                              {errors.companyName}
                            </div>
                          </div>
                          <div className="ls-form-group">
                            <label htmlFor="contactPerson">
                              Contact Person
                            </label>
                            <input
                              type="text"
                              id="contactPerson"
                              className={`ls-form-input ${errors.contactPerson ? "error" : ""
                                }`}
                              value={signupData.contactPerson}
                              onChange={(e) => handleInputChange(e, "signup")}
                              required
                            />
                            <div className="ls-error-message">
                              {errors.contactPerson}
                            </div>
                          </div>
                        </>
                      )}

                      <div className="ls-form-group">
                        <label htmlFor="email">Email</label>
                        <input
                          type="email"
                          id="email"
                          className={`ls-form-input ${errors.email ? "error" : ""
                            }`}
                          value={signupData.email}
                          onChange={(e) => handleInputChange(e, "signup")}
                          disabled={signupOtpSent && !signupEmailVerified}
                          required
                        />
                        <div className="ls-error-message">{errors.email}</div>
                        {signupOtpError && <div className="ls-validation-error" style={{ marginTop: "8px", marginBottom: "8px" }}>{signupOtpError}</div>}
                        {!signupEmailVerified && (
                          <button
                            type="button"
                            className="ls-btn ls-otp-action-btn"
                            onClick={handleSendSignupOTP}
                            disabled={signupOtpLoading || signupOtpSent}
                            style={{ marginTop: "8px" }}
                          >
                            {signupOtpLoading ? "Sending..." : signupOtpSent ? "OTP Sent - Enter code" : "Send OTP"}
                          </button>
                        )}
                        {signupEmailVerified && (
                          <div className="ls-success-text" style={{ marginTop: "8px" }}>
                            ✓ Email verified successfully
                          </div>
                        )}
                        {signupOtpSent && !signupEmailVerified && (
                          <div className="ls-signup-otp-box" style={{ marginTop: "10px" }}>
                            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>{`Enter 6-digit OTP sent to ${signupData.email}`}</label>
                            <div className="ls-otp-container" style={{ marginBottom: "8px" }}>
                              {signupOtp.map((digit, i) => (
                                <input
                                  key={i}
                                  type="text"
                                  maxLength="1"
                                  className="ls-otp-input"
                                  value={digit}
                                  onChange={(e) => handleSignupOtpChange(i, e.target.value)}
                                  onKeyDown={(e) => handleSignupOtpKeyDown(i, e)}
                                  ref={(el) => (signupOtpRefs.current[i] = el)}
                                  disabled={signupVerifyLoading}
                                />
                              ))}
                            </div>
                            <button type="button" className="ls-btn ls-otp-action-btn" onClick={handleVerifySignupOTP} disabled={signupVerifyLoading || signupOtp.join("").length !== OTP_LENGTH}>
                              {signupVerifyLoading ? "Verifying..." : "Verify Email OTP"}
                            </button>
                            <div style={{ marginTop: "6px" }}>
                              <a
                                href="#"
                                onClick={handleResendSignupOTP}
                                className={signupResendSeconds > 0 ? "ls-disabled" : ""}
                              >
                                {signupResendSeconds > 0 ? `Resend Code (${signupResendSeconds}s)` : "Resend Code"}
                              </a>
                            </div>
                          </div>
                        )}
                        {errors.emailVerification && (
                          <div className="ls-validation-error">{errors.emailVerification}</div>
                        )}
                      </div>
                    </div>

                    <div className="signup-right">
                      {(userType === "customer" || userType === "worker") && (
                        <div className="ls-form-group">
                          <label htmlFor="dob">Date of Birth</label>
                          <input
                            type="date"
                            id="dob"
                            className={`ls-form-input ${errors.dob ? "error" : ""
                              }`}
                            value={signupData.dob}
                            onChange={(e) => handleInputChange(e, "signup")}
                            required
                          />
                          <div className="ls-error-message">{errors.dob}</div>
                        </div>
                      )}

                      <div className="ls-form-group">
                        <label htmlFor="phone">Phone</label>
                        <input
                          type="tel"
                          id="phone"
                          className={`ls-form-input ${errors.phone ? "error" : ""
                            }`}
                          value={signupData.phone}
                          onChange={(e) => handleInputChange(e, "signup")}
                          required
                        />
                        <div className="ls-error-message">{errors.phone}</div>
                      </div>

                      {userType === "worker" && (
                        <>
                          <div className="ls-worker-details">
                            <div className="ls-form-group">
                              <label htmlFor="aadharNumber">Aadhar Number</label>
                              <input
                                type="text"
                                id="aadharNumber"
                                className={`ls-form-input ${errors.aadharNumber ? "error" : ""
                                  }`}
                                value={signupData.aadharNumber}
                                onChange={(e) => handleInputChange(e, "signup")}
                                required
                              />
                              <div className="ls-error-message">
                                {errors.aadharNumber}
                              </div>
                            </div>
                            <div className="ls-form-group">
                              <label htmlFor="specialization">
                                Specialization
                              </label>
                              <select
                                id="specialization"
                                className={`ls-form-input ls-select ${errors.specialization ? "error" : ""
                                  }`}
                                value={signupData.specialization}
                                onChange={(e) => handleInputChange(e, "signup")}
                                required
                              >
                                <option value="">Select Specialization</option>
                                <option value="architect">Architect</option>
                                <option value="interiordesign">
                                  Interior Design
                                </option>
                              </select>
                              <div className="ls-error-message">
                                {errors.specialization}
                              </div>
                            </div>
                            <div className="ls-form-group">
                              <label htmlFor="experience">
                                Experience (years)
                              </label>
                              <input
                                type="number"
                                id="experience"
                                className={`ls-form-input ${errors.experience ? "error" : ""
                                  }`}
                                value={signupData.experience}
                                onChange={(e) => handleInputChange(e, "signup")}
                                min="0"
                              />
                              <div className="ls-error-message">
                                {errors.experience}
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="ls-password-section">
                    <div className="ls-form-group">
                      <label htmlFor="password">Password</label>
                      <input
                        type="password"
                        id="password"
                        className={`ls-form-input ${errors.password ? "error" : ""
                          }`}
                        value={signupData.password}
                        onChange={(e) => handleInputChange(e, "signup")}
                        required
                      />
                      <div className="ls-error-message">{errors.password}</div>
                    </div>
                    <div className="ls-form-group">
                      <label htmlFor="confirmPassword">Confirm Password</label>
                      <input
                        type="password"
                        id="confirmPassword"
                        className={`ls-form-input ${errors.confirmPassword ? "error" : ""
                          }`}
                        value={signupData.confirmPassword}
                        onChange={(e) => handleInputChange(e, "signup")}
                        required
                      />
                      <div className="ls-error-message">
                        {errors.confirmPassword}
                      </div>
                    </div>
                  </div>

                  {(userType === "company" || userType === "worker") && (
                    <div className="ls-file-upload-container">
                      <label>
                        {userType === "company"
                          ? "Company Documents"
                          : "Certificates"}
                      </label>
                      <input type="file" multiple onChange={handleFileChange} />
                      <div className="ls-file-list">
                        {files.map((f, i) => (
                          <div key={i}>{f.name}</div>
                        ))}
                      </div>
                      <div className="ls-error-message">{errors.files}</div>
                    </div>
                  )}

                  {/* FIXED CHECKBOX */}
                  <div className="ls-terms-section">
                    <label
                      className="ls-checkbox-container"
                      htmlFor="signup-terms"
                    >
                      <input
                        type="checkbox"
                        id="signup-terms"
                        checked={signupData.termsAccepted}
                        onChange={(e) =>
                          setSignupData({
                            ...signupData,
                            termsAccepted: e.target.checked,
                          })
                        }
                      />
                      <span>I accept the terms and conditions</span>
                    </label>
                    <div className="ls-validation-error">{errors.terms}</div>
                  </div>

                  <button
                    type="submit"
                    className="ls-btn ls-btn-primary ls-w-100"
                  >
                    Sign Up
                  </button>
                  {errors.general && (
                    <div className="ls-validation-error">{errors.general}</div>
                  )}
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div
          className="ls-modal"
          onClick={() => {
            setShowForgotModal(false);
            resetForgotForm();
          }}
        >
          <div
            className="ls-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <span
              className="ls-close"
              onClick={() => {
                setShowForgotModal(false);
                resetForgotForm();
              }}
            >
              ×
            </span>

            <form onSubmit={handleResetPassword}>
              {forgotStep === "email" && (
                <div id="email-step">
                  <h2>Reset Password</h2>
                  <div className="ls-form-group">
                    <label htmlFor="forgot-email">Email</label>
                    <input
                      type="email"
                      id="forgot-email"
                      value={forgotEmail}
                      onChange={(e) => handleInputChange(e, "forgot")}
                      required
                    />
                  </div>
                  <button type="button" onClick={handleSendOTP}>
                    Send OTP
                  </button>
                </div>
              )}

              {forgotStep === "otp" && (
                <div id="otp-step">
                  <h2>Enter OTP</h2>
                  <div className="ls-otp-container">
                    {otp.map((d, i) => (
                      <input
                        key={i}
                        type="text"
                        maxLength="1"
                        className="ls-otp-input"
                        value={d}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        ref={(el) => (otpRefs.current[i] = el)}
                      />
                    ))}
                  </div>
                  <button type="button" onClick={handleVerifyOTP}>
                    Verify
                  </button>
                  <a
                    href="#"
                    onClick={handleResendOTP}
                    className={forgotResendSeconds > 0 ? "ls-disabled" : ""}
                  >
                    {forgotResendSeconds > 0 ? `Resend Code (${forgotResendSeconds}s)` : "Resend Code"}
                  </a>
                </div>
              )}

              {forgotStep === "password" && (
                <div id="password-step">
                  <h2>Set New Password</h2>
                  <div className="ls-form-group">
                    <label htmlFor="new-password">New Password</label>
                    <input
                      type="password"
                      id="new-password"
                      value={newPassword}
                      onChange={(e) => handleInputChange(e, "forgot")}
                      required
                    />
                  </div>
                  <div className="ls-form-group">
                    <label htmlFor="confirm-new-password">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      id="confirm-new-password"
                      value={confirmNewPassword}
                      onChange={(e) => handleInputChange(e, "forgot")}
                      required
                    />
                  </div>
                  <button type="submit">Reset Password</button>
                </div>
              )}
              {forgotError && (
                <div className="ls-validation-error">{forgotError}</div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginSignUp;
