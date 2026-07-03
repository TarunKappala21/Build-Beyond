import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Lock, User, Eye, EyeOff, Shield, Loader2 } from "lucide-react";
import "./AdminLogin.css";

const PlatformManagerLogin = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({
    username: false,
    password: false,
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/platform-manager/verify-session", {
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok && data.authenticated && data.role === "platform_manager") {
          navigate("/platform-manager/dashboard", { replace: true });
        } else if (res.ok && data.authenticated && data.role === "superadmin") {
          navigate("/admin-view/admindashboard", { replace: true });
        } else {
          setLoading(false);
        }
      } catch (error) {
        setLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const validateUsername = (username) => username.trim().length > 0;
  const validatePassword = (pwd) => pwd.length >= 6;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const usernameValid = validateUsername(username);
    const passwordValid = validatePassword(password);

    setErrors({
      username: !usernameValid,
      password: !passwordValid,
    });

    if (!usernameValid || !passwordValid) return;

    try {
      const response = await fetch("/api/platform-manager/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.role === "platform_manager") {
        navigate("/platform-manager/dashboard");
      } else if (response.ok && data.role === "superadmin") {
        alert("Please use the Superadmin login page.");
      } else {
        alert(data.message || "Invalid credentials");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed. Please try again.");
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
          <h1>Platform Manager Login</h1>
          <p>Enter your credentials to access your dashboard</p>
        </div>

        <form onSubmit={handleSubmit} id="platformManagerLoginForm">
          {/* Username Field */}
          <div className={`admin-login-input-group ${errors.username ? "admin-login-error" : ""}`}>
            <label htmlFor="username">Username</label>
            <div className="admin-login-input-wrapper">
              <User size={18} className="input-icon" />
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onBlur={() => setErrors((prev) => ({ ...prev, username: !validateUsername(username) }))}
                placeholder="Enter your username"
                autoComplete="username"
              />
            </div>
            <span className="admin-login-error-message">Please enter your username</span>
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
                autoComplete="current-password"
              />
              <button
                type="button"
                className="admin-login-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <span className="admin-login-error-message">Password must be at least 6 characters</span>
          </div>

          <div className="admin-login-remember-forgot">
            <div className="admin-login-remember-me">
              <input type="checkbox" id="rememberMe" />
              <label htmlFor="rememberMe">Remember me</label>
            </div>
          </div>

          <button type="submit" className="admin-login-submit-btn">
            Sign In
          </button>

          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.9rem', color: '#666' }}>
            <p>Are you a superadmin? <Link to="/admin-login" style={{ color: '#007bff', textDecoration: 'none' }}>Login here</Link></p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlatformManagerLogin;
