import React, { useState, useEffect } from "react";
import "./CompanyPublicProfile.css";
import ProfileHeader from "./components/ProfileHeader";
import AboutSection from "./components/AboutSection";
import Specializations from "./components/Specializations";
import TeamMembers from "./components/TeamMembers";
import CompletedProjects from "./components/CompletedProjects";
import API_BASE from "../../../../api/backendBase";


const CompanyPublicProfile = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [companyData, setCompanyData] = useState(null);

  useEffect(() => {
    fetchCompanyProfile();
  }, []);

  const fetchCompanyProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/companysettings`, {
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch company profile: ${response.status}`);
      }

      const data = await response.json();
      if (data && data.company && data.company.customerProfile) {
        setCompanyData(data.company.customerProfile);
      } else {
        throw new Error("Invalid response structure");
      }
    } catch (err) {
      console.error("Error fetching company profile:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-loading">
          <i className="fas fa-spinner fa-spin"></i> Loading company profile...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-container">
        <div className="profile-error">
          <i className="fas fa-exclamation-triangle"></i> Error: {error}
        </div>
      </div>
    );
  }

  if (!companyData) {
    return (
      <div className="profile-container">
        <div className="profile-no-data">
          <i className="fas fa-info-circle"></i> No company profile data available.
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <ProfileHeader company={companyData} />
      <div className="profile-content">
        <AboutSection 
          about={companyData.about} 
          didYouKnow={companyData.didYouKnow} 
        />
        <Specializations specializations={companyData.specializations} />
        <TeamMembers teamMembers={companyData.teamMembers} />
        <CompletedProjects projects={companyData.completedProjects} />
      </div>
    </div>
  );
};

export default CompanyPublicProfile;