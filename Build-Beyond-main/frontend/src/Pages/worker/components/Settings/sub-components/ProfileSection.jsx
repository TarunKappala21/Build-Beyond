import React, { useState } from 'react';
import './ProfileSection.css';
import ProfileEditModal from './ProfileEditModal';

const ProfileSection = ({ user, onProfileUpdated }) => {
  const [isEditing, setIsEditing] = useState(false);
  const handleClose = () => setIsEditing(false);
  const handleOpen = () => setIsEditing(true);

  return (
    <div className="wkst-settings-section">
      <div className="wkst-profile-header">
        <img
          src={user.profileImage || 'https://t4.ftcdn.net/jpg/03/64/21/11/360_F_364211147_1qgLVxv1Tcq0Ohz3FawUfrtONzz8nq3e.jpg'}
          alt={user.name}
          className="wkst-profile-image-large"
        />
        <div className="wkst-profile-title-info">
          <h2>{user.name}</h2>
          <p>
            <strong>{user.professionalTitle || 'Professional'}</strong> with{' '}
            {user.experience || 0} years experience
          </p>
        </div>
      </div>

      <div className="wkst-profile-section-divider">
        <h3>About</h3>
        <p>{user.about || 'No information provided.'}</p>
        <p>
          <strong>Specialties:</strong>{' '}
          {user.specialties && user.specialties.length > 0
            ? user.specialties.join(', ')
            : 'None specified'}
        </p>
        {user.languages && user.languages.length > 0 && (
          <p><strong>Languages:</strong> {user.languages.join(', ')}</p>
        )}
        {user.expectedPrice && (
          <p><strong>Expected Price:</strong> {user.expectedPrice}</p>
        )}
      </div>

      <div className="wkst-profile-section-divider">
        <h3>Notable Projects</h3>
        {user.projects && user.projects.length > 0 ? (
          user.projects.map((project, index) => (
            <div key={index} className="wkst-project">
              <h4>
                {project.name} {project.year ? `(${project.year})` : project.yearRange ? `(${project.yearRange})` : ''}
              </h4>
              <p>
                <strong>Location:</strong> {project.location}
              </p>
              <p>{project.description}</p>
              {project.image && (
                <img
                  src={project.image}
                  alt={project.name}
                  className="wkst-project-image"
                />
              )}
              {project.images && project.images.length > 0 && (
                <div className="wkst-project-gallery">
                  {project.images.map((img, idx) => (
                    <img key={idx} src={img} alt={`${project.name}-${idx}`} className="wkst-project-image" />
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <p>No projects have been added yet.</p>
        )}
      </div>

      <div className="wkst-button-container">
        <button onClick={handleOpen} className="wkst-btn wkst-btn-primary">
          <i className="fas fa-edit"></i> Edit Profile
        </button>
      </div>

      {isEditing && (
        <ProfileEditModal
          user={user}
          onClose={handleClose}
          onSaved={() => {
            handleClose();
            if (typeof onProfileUpdated === 'function') onProfileUpdated();
          }}
        />
      )}
    </div>
  );
};

export default ProfileSection;
