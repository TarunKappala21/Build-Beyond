import React from 'react';
import './ApplicationFormModal.css';

const ApplicationFormModal = ({ 
  company, 
  formData, 
  onClose, 
  onFormChange, 
  onFormSubmit 
}) => {
  if (!company) return null;

  return (
    <div className="wkjc-modal" onClick={onClose}>
      <div className="wkjc-modal-content wkjc-application-modal" onClick={(e) => e.stopPropagation()}>
        <span className="wkjc-close-modal" onClick={onClose}>×</span>
        <div className="wkjc-modal-header">
          <h2>Apply to {company.companyName}</h2>
        </div>
        <div className="wkjc-modal-body">
          <form onSubmit={onFormSubmit} className="wkjc-form-container">
            {/* Personal Information */}
            <div className="wkjc-form-section">
              <h3 className="wkjc-form-section-title">Personal Information</h3>
              <div className="wkjc-form-row">
                <div className="wkjc-form-group">
                  <label className="wkjc-form-label">Full Name *</label>
                  <input 
                    type="text" 
                    className="wkjc-form-input" 
                    name="fullName" 
                    value={formData.fullName}
                    onChange={onFormChange}
                    required 
                  />
                </div>
                <div className="wkjc-form-group">
                  <label className="wkjc-form-label">Email Address *</label>
                  <input 
                    type="email" 
                    className="wkjc-form-input" 
                    name="email" 
                    value={formData.email}
                    onChange={onFormChange}
                    required 
                  />
                </div>
              </div>
              <div className="wkjc-form-row">
                <div className="wkjc-form-group">
                  <label className="wkjc-form-label">Current Location/City *</label>
                  <input 
                    type="text" 
                    className="wkjc-form-input" 
                    name="location" 
                    value={formData.location}
                    onChange={onFormChange}
                    required 
                  />
                </div>
                <div className="wkjc-form-group">
                  <label className="wkjc-form-label">LinkedIn Profile</label>
                  <input 
                    type="url" 
                    className="wkjc-form-input" 
                    name="linkedin" 
                    value={formData.linkedin}
                    onChange={onFormChange}
                    placeholder="https://" 
                  />
                </div>
              </div>
            </div>

            {/* Professional Details */}
            <div className="wkjc-form-section">
              <h3 className="wkjc-form-section-title">Professional Details</h3>
              <div className="wkjc-form-row">
                <div className="wkjc-form-group">
                  <label className="wkjc-form-label">Years of Experience *</label>
                  <input 
                    type="number" 
                    className="wkjc-form-input" 
                    name="experience" 
                    value={formData.experience}
                    onChange={onFormChange}
                    min="0" 
                    required 
                  />
                </div>
                <div className="wkjc-form-group">
                  <label className="wkjc-form-label">Expected Salary (₹ per month) *</label>
                  <input 
                    type="number" 
                    className="wkjc-form-input" 
                    name="expectedSalary" 
                    value={formData.expectedSalary}
                    onChange={onFormChange}
                    required 
                  />
                </div>
              </div>
              <div className="wkjc-form-row">
                <div className="wkjc-form-group wkjc-full-width">
                  <label className="wkjc-form-label">Position Applying For *</label>
                  <input 
                    type="text" 
                    className="wkjc-form-input" 
                    name="positionApplying" 
                    value={formData.positionApplying}
                    onChange={onFormChange}
                    required 
                  />
                </div>
              </div>
            </div>

            {/* Skills & Expertise */}
            <div className="wkjc-form-section">
              <h3 className="wkjc-form-section-title">Skills & Specialties</h3>
              <div className="wkjc-form-row">
                <div className="wkjc-form-group wkjc-full-width">
                  <label className="wkjc-form-label">Primary Skills/Specialties *</label>
                  <input 
                    type="text" 
                    className="wkjc-form-input" 
                    name="primarySkills" 
                    value={formData.primarySkills}
                    onChange={onFormChange}
                    placeholder="e.g., Sustainable Design, BIM, Urban Planning" 
                    required 
                  />
                  <p className="wkjc-form-hint">Separate multiple skills with commas</p>
                </div>
              </div>
            </div>

            {/* Work Experience */}
            <div className="wkjc-form-section">
              <h3 className="wkjc-form-section-title">Work Experience</h3>
              <div className="wkjc-form-row">
                <div className="wkjc-form-group wkjc-full-width">
                  <label className="wkjc-form-label">Previous Work Experience *</label>
                  <textarea 
                    className="wkjc-form-textarea" 
                    name="workExperience" 
                    value={formData.workExperience}
                    onChange={onFormChange}
                    required
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Attachments */}
            <div className="wkjc-form-section">
              <h3 className="wkjc-form-section-title">Attachments</h3>
              <div className="wkjc-form-row">
                <div className="wkjc-form-group wkjc-full-width">
                  <label className="wkjc-form-label">Resume/CV (PDF) *</label>
                  <div className={`wkjc-form-file-upload ${formData.resume ? 'wkjc-file-selected' : ''}`}>
                    <div className="wkjc-form-file-icon">📄</div>
                    <div className="wkjc-form-file-label">
                      {formData.resume ? formData.resume.name : 'Click to upload your resume (PDF)'}
                    </div>
                    <input 
                      type="file" 
                      className="wkjc-form-file-input" 
                      name="resume" 
                      onChange={onFormChange}
                      accept=".pdf" 
                      required 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="wkjc-form-section">
              <div className="wkjc-checkbox-group">
                <input 
                  type="checkbox" 
                  className="wkjc-checkbox-input" 
                  name="termsAgree" 
                  checked={formData.termsAgree}
                  onChange={onFormChange}
                  required 
                />
                <label className="wkjc-checkbox-label">
                  I confirm that all information provided is accurate and complete *
                </label>
              </div>
            </div>

            {/* Form Actions */}
            <div className="wkjc-form-actions">
              <button 
                type="button" 
                className="wkjc-btn wkjc-btn-outline" 
                onClick={onClose}
              >
                Cancel
              </button>
              <button type="submit" className="wkjc-btn wkjc-btn-primary">
                Submit Application
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ApplicationFormModal;
