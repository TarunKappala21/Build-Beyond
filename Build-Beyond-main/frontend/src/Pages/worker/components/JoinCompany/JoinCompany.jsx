import React, { useState, useEffect } from 'react';
import './JoinCompany.css';
import { ProfileHeader, ProfileStats } from './sub-components/ProfileSection';
import { CompanyCard, OfferCard, ApplicationCard } from './sub-components/Cards';
import CompanyDetailsModal from './sub-components/CompanyDetailsModal';
import ApplicationFormModal from './sub-components/ApplicationFormModal';

const JoinCompany = () => {
  const [activeTab, setActiveTab] = useState('join-company');
  const [searchTerm, setSearchTerm] = useState('');
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [offers, setOffers] = useState([]);
  const [jobApplications, setJobApplications] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  
  // Application form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    location: '',
    linkedin: '',
    experience: '',
    expectedSalary: '',
    positionApplying: '',
    primarySkills: '',
    workExperience: '',
    resume: null,
    termsAgree: false
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (searchTerm === '') {
      setFilteredCompanies(companies);
    } else {
      const filtered = companies.filter(company =>
        company.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.location?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.specialization?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
        company.currentOpenings?.some(o => o.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredCompanies(filtered);
    }
  }, [searchTerm, companies]);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/workerjoin_company', {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const data = await response.json();
      setUser(data.user);
      setCompanies(data.companies || []);
      setFilteredCompanies(data.companies || []);
      setOffers(data.offers || []);
      setJobApplications(data.jobApplications || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleViewDetails = (company) => {
    setSelectedCompany(company);
    setShowCompanyModal(true);
  };

  const handleApplyNow = (company) => {
    setSelectedCompany(company);
    setFormData({
      ...formData,
      fullName: user?.name || '',
      email: user?.email || '',
      location: user?.location?.city || ''
    });
    setShowApplicationModal(true);
    setShowCompanyModal(false);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.termsAgree) {
      alert('Please agree to the terms');
      return;
    }

    const submitData = new FormData();
    Object.keys(formData).forEach(key => {
      if (key === 'resume' && formData[key]) {
        submitData.append('resume', formData[key]);
      } else if (key === 'primarySkills') {
        submitData.append(key, formData[key]);
      } else if (key !== 'resume') {
        submitData.append(key, formData[key]);
      }
    });

    try {
      const response = await fetch(`/api/worker_request/${selectedCompany._id}`, {
        method: 'POST',
        credentials: 'include',
        body: submitData
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('Application submitted successfully!');
        setShowApplicationModal(false);
        fetchData(); // Refresh data
        // Reset form
        setFormData({
          fullName: '',
          email: '',
          location: '',
          linkedin: '',
          experience: '',
          expectedSalary: '',
          positionApplying: '',
          primarySkills: '',
          workExperience: '',
          resume: null,
          termsAgree: false
        });
      } else {
        throw new Error(data.error || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred: ' + error.message);
    }
  };

  const handleAcceptOffer = async (offerId) => {
    if (!confirm('Are you sure you want to accept this offer?')) return;

    try {
      const response = await fetch(`/api/offers/${offerId}/accept`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        alert('Offer accepted successfully!');
        fetchData();
      } else {
        throw new Error('Failed to accept offer');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred: ' + error.message);
    }
  };

  const handleDeclineOffer = async (offerId) => {
    if (!confirm('Are you sure you want to decline this offer?')) return;

    try {
      const response = await fetch(`/api/offers/${offerId}/decline`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        alert('Offer declined');
        fetchData();
      } else {
        throw new Error('Failed to decline offer');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="wkjc-container">
        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wkjc-container">
        <div style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="wkjc-container">
      <h1>Join a Company</h1>

      {/* Profile Header */}
      <ProfileHeader user={user} />

      {/* Profile Stats */}
      <ProfileStats 
        applications={jobApplications.length} 
        offers={offers.length} 
        experience={user?.experience || 0}
      />

      {/* Tabs */}
      <ul className="wkjc-nav-tabs">
        <li className="wkjc-nav-item">
          <a 
            className={`wkjc-nav-link ${activeTab === 'join-company' ? 'active' : ''}`}
            onClick={() => handleTabChange('join-company')}
          >
            Join a Company
          </a>
        </li>
        <li className="wkjc-nav-item">
          <a 
            className={`wkjc-nav-link ${activeTab === 'accept-offers' ? 'active' : ''}`}
            onClick={() => handleTabChange('accept-offers')}
          >
            Accept Offers
          </a>
        </li>
        <li className="wkjc-nav-item">
          <a 
            className={`wkjc-nav-link ${activeTab === 'join-requests' ? 'active' : ''}`}
            onClick={() => handleTabChange('join-requests')}
          >
            Join Requests
          </a>
        </li>
      </ul>

      {/* Tab Content */}
      <div className="wkjc-tab-content">
        {/* Join a Company Tab */}
        {activeTab === 'join-company' && (
          <div className="wkjc-tab-pane active">
            <div className="wkjc-search-bar">
              <input 
                type="text" 
                className="wkjc-search-input" 
                placeholder="Search for construction companies by name, projects, or location..."
                value={searchTerm}
                onChange={handleSearch}
              />
              <button className="wkjc-search-button">Search</button>
            </div>

            {filteredCompanies.map((company) => (
              <CompanyCard
                key={company._id}
                company={company}
                onViewDetails={handleViewDetails}
                onApplyNow={handleApplyNow}
              />
            ))}
          </div>
        )}

        {/* Accept Offers Tab */}
        {activeTab === 'accept-offers' && (
          <div className="wkjc-tab-pane active">
            <h2>Your Current Offers</h2>
            <p>Companies that have invited you to join their team</p>

            {offers.length > 0 ? (
              offers.map((offer) => (
                <OfferCard
                  key={offer._id}
                  offer={offer}
                  onAccept={handleAcceptOffer}
                  onDecline={handleDeclineOffer}
                />
              ))
            ) : (
              <div className="wkjc-empty-state">
                <div className="wkjc-empty-state-icon">📭</div>
                <h3>No Offers Yet</h3>
                <p>You don't have any offers at the moment. Continue applying to companies and showcasing your skills!</p>
              </div>
            )}
          </div>
        )}

        {/* Join Requests Tab */}
        {activeTab === 'join-requests' && (
          <div className="wkjc-tab-pane active">
            <h2>Companies you requested to join</h2>
            <p>Track the status of your applications to join companies</p>

            {jobApplications.length > 0 ? (
              jobApplications.map((application) => (
                <ApplicationCard
                  key={application._id}
                  application={application}
                />
              ))
            ) : (
              <div className="wkjc-no-applications">
                <p>You haven't applied to any companies yet.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Company Details Modal */}
      {showCompanyModal && (
        <CompanyDetailsModal
          company={selectedCompany}
          onClose={() => setShowCompanyModal(false)}
          onApplyNow={handleApplyNow}
        />
      )}

      {/* Application Form Modal */}
      {showApplicationModal && (
        <ApplicationFormModal
          company={selectedCompany}
          formData={formData}
          onClose={() => setShowApplicationModal(false)}
          onFormChange={handleFormChange}
          onFormSubmit={handleFormSubmit}
        />
      )}
    </div>
  );
};

export default JoinCompany;
