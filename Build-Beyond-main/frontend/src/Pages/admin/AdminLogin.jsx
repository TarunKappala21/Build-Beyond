import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Lock, Mail, Eye, EyeOff, Shield, Loader2 } from "lucide-react";
import "./AdminLogin.css";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({
    email: false,
    password: false,
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/admin/verify-session", {
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok && data.authenticated && data.role === "superadmin") {
          navigate("/admin-view/admindashboard", { replace: true });
        } else if (res.ok && data.authenticated && data.role === "platform_manager") {
          navigate("/platform-manager/dashboard", { replace: true });
        } else {
          setLoading(false);
        }
      } catch (error) {
        setLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (pwd) => pwd.length >= 8;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailValid = validateEmail(email);
    const passwordValid = validatePassword(password);

    setErrors({
      email: !emailValid,
      password: !passwordValid,
    });

    if (!emailValid || !passwordValid) return;

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.role === "superadmin") {
        navigate("/admin-view/admindashboard");
      } else if (response.ok && data.role === "platform_manager") {
        alert("Please use the Platform Manager login page.");
      } else {
        alert(data.message || "Invalid superadmin credentials");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed. Please try again.");
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    if (validateEmail(email)) {
      alert("Password reset link has been sent to your email address.");
    } else {
      alert("Please enter a valid email address first.");
    }
  };

  if (loading) {
    return (
      <div className="admin-login-body">
        <div className="admin-login-loader">
          <Loader2 size={32} className="spin" />
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-login-body">
      <div className="admin-login-top-link">
        <Link to="/" className="admin-login-home-btn">
          Back to Home
        </Link>
      </div>
      <div className="admin-login-container">
        <div className="admin-login-header">
          <div className="admin-login-icon">
            <Shield size={32} />
          </div>
          <h1>Superadmin Login</h1>
          <p>Enter your details to access the dashboard</p>
        </div>

        <form onSubmit={handleSubmit} id="adminLoginForm">
          {/* Email Field */}
          <div className={`admin-login-input-group ${errors.email ? "admin-login-error" : ""}`}>
            <label htmlFor="email">Email Address</label>
            <div className="admin-login-input-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setErrors((prev) => ({ ...prev, email: !validateEmail(email) }))}
                placeholder="Enter your email"
              />
            </div>
            <span className="admin-login-error-message">Please enter a valid email address</span>
          </div>

          {/* Password Field */}
          <div className={`admin-login-input-group ${errors.password ? "admin-login-error" : ""}`}>
            <label htmlFor="password">Password</label>
            <div className="admin-login-input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setErrors((prev) => ({ ...prev, password: !validatePassword(password) }))}
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="admin-login-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <span className="admin-login-error-message">Password must be at least 8 characters</span>
          </div>

          <div className="admin-login-remember-forgot">
            <div className="admin-login-remember-me">
              <input type="checkbox" id="rememberMe" />
              <label htmlFor="rememberMe">Remember me</label>
            </div>
            <div className="admin-login-forgot-password">
              <a href="#" onClick={handleForgotPassword}>Forgot password?</a>
            </div>
          </div>

          <button type="submit" className="admin-login-submit-btn">
            Sign In
          </button>

          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.9rem', color: '#666' }}>
            <p>Are you a platform manager? <Link to="/platform-manager-login" style={{ color: '#007bff', textDecoration: 'none' }}>Login here</Link></p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
