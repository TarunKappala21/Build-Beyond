import React, { useCallback, useEffect, useState } from "react";
import "./CompanyRevenue.css";
import StatsCards from "./components/StatsCards";
import ProjectsTable from "./components/ProjectsTable";
import SidebarStats from "./components/SidebarStats";
import ProjectDetailsModal from "./components/ProjectDetailsModal";
import API_BASE from "../../../../api/backendBase";

const CompanyRevenue = () => {
  const [projects, setProjects] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    const controller = new AbortController();
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const res = await fetch(`${API_BASE}/api/companyrevenue`, {
        credentials: "include",
        cache: "no-store",
        signal: controller.signal,
      });
      if (!res.ok) throw new Error("Failed to fetch revenue data");
      const data = await res.json();
      setProjects(data.projects || []);
      setMetrics(data.metrics || null);
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error(err);
        setError(err.message || String(err));
      }
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }

    return () => controller.abort();
  }, []);

  useEffect(() => {
    let cleanup;
    const load = async () => {
      cleanup = await fetchData(false);
    };
    load();

    const handleFocus = () => fetchData(true);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchData(true);
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    const intervalId = setInterval(() => {
      fetchData(true);
    }, 30000);

    return () => {
      if (cleanup) cleanup();
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
      clearInterval(intervalId);
    };
  }, [fetchData]);

  const handleViewDetails = (project) => {
    setSelectedProject(project);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedProject(null);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN");
  };

  const calculateEndDate = (project) => {
    if (project.status === "completed") {
      return formatDate(project.updatedAt);
    }
    if (project.projectTimeline) {
      const endDate = new Date(project.createdAt);
      endDate.setMonth(endDate.getMonth() + parseInt(project.projectTimeline));
      return formatDate(endDate);
    }
    return "N/A";
  };

  if (loading) {
    return (
      <div className="revenue-container">
        <div className="revenue-loading">Loading revenue data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="revenue-container">
        <div className="revenue-error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="revenue-main-container">
      <div className="revenue-header">
        <div>
          <h1 className="revenue-page-title">💰 Revenue Analytics</h1>
          <p className="revenue-subtitle">Track your earnings and project payments</p>
        </div>
        <button
          className="revenue-refresh-btn"
          onClick={() => fetchData(true)}
          disabled={refreshing}
          title="Refresh revenue data"
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <StatsCards metrics={metrics} formatCurrency={formatCurrency} />

      {/* Projects Table */}
      <div className="revenue-projects-section">
        <div className="revenue-section-header">
          <h2>📊 Projects Overview</h2>
          <div className="revenue-project-count">
            {projects.length} {projects.length === 1 ? 'Project' : 'Projects'}
          </div>
        </div>
        <ProjectsTable 
          projects={projects}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          onViewDetails={handleViewDetails}
        />
      </div>

      <ProjectDetailsModal 
        isOpen={modalOpen}
        project={selectedProject}
        onClose={handleCloseModal}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        calculateEndDate={calculateEndDate}
      />
    </div>
  );
};

export default CompanyRevenue;