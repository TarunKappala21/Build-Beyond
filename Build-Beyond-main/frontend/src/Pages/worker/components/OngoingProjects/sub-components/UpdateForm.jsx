import React, { useState } from 'react';
import './UpdateForm.css';

const UpdateForm = ({ 
  projectId, 
  projectType,
  onSuccess
}) => {
  const [percentage, setPercentage] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('projectId', projectId);
    formData.append('projectType', projectType);
    formData.append('percentage', percentage);
    formData.append('description', description);
    
    if (image) {
      formData.append('image', image);
    }

    try {
      const response = await fetch('/api/worker/submit-milestone', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        alert('Milestone submitted successfully! Status: Pending customer approval.');
        // Reset form
        setPercentage('');
        setDescription('');
        setImage(null);
        // Reset file input
        const fileInput = document.querySelector(`input[name="milestoneImage-${projectId}"]`);
        if (fileInput) fileInput.value = '';
        // Call success callback to close modal and refresh data
        if (onSuccess) onSuccess();
      } else {
        alert(data.error || 'Failed to submit milestone');
      }
    } catch (error) {
      console.error('Error submitting milestone:', error);
      alert('Error submitting milestone. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form 
      className="wkop-update-form wkop-milestone-form" 
      onSubmit={handleSubmit}
    >
      <h4 className="wkop-form-title">Submit Project Milestone</h4>
      
      <div className="wkop-form-group">
        <label>Milestone Percentage *</label>
        <select
          value={percentage}
          onChange={(e) => setPercentage(e.target.value)}
          required
          className="wkop-milestone-select"
        >
          <option value="">Select milestone percentage</option>
          <option value="25">25% - Initial Phase</option>
          <option value="50">50% - Midway Progress</option>
          <option value="75">75% - Near Completion</option>
          <option value="100">100% - Final Delivery</option>
        </select>
        <small className="wkop-hint">Each percentage can only be submitted once</small>
      </div>

      <div className="wkop-form-group">
        <label>Milestone Description *</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the work completed for this milestone..."
          required
          rows="4"
        />
      </div>
      
      <div className="wkop-form-group">
        <label>Upload Image (Optional)</label>
        <input
          type="file"
          name={`milestoneImage-${projectId}`}
          onChange={(e) => setImage(e.target.files[0])}
          accept="image/*"
        />
      </div>
      
      <button 
        type="submit" 
        className="wkop-btn wkop-btn-primary wkop-btn-milestone"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Milestone'}
      </button>
    </form>
  );
};

export default UpdateForm;
