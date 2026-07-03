import React from 'react';
import './ProjectDetailsModal.css';

const ProjectDetailsModal = ({ project, onClose }) => {
  const [lightboxImage, setLightboxImage] = React.useState(null);
  
  if (!project) return null;

  const isArchitect = project.projectType === 'architect';

  const openLightbox = (imageUrl) => {
    setLightboxImage(imageUrl);
  };

  const closeLightbox = (e) => {
    if (e) e.stopPropagation();
    setLightboxImage(null);
  };

  return (
    <div className="wkop-modal" onClick={onClose}>
      <div className="wkop-modal-content" onClick={(e) => e.stopPropagation()}>
        <span className="wkop-close-modal" onClick={onClose}>×</span>
        
        <div className="wkop-modal-header">
          <h2>{isArchitect ? project.projectName : project.roomType}</h2>
        </div>

        <div className="wkop-modal-body">
          {isArchitect ? (
            <>
              <div className="wkop-modal-section">
                <div className="wkop-modal-section-title">Customer Details</div>
                <div className="wkop-detail-grid">
                  <div className="wkop-modal-detail-item">
                    <strong>Name:</strong> {project.customerDetails?.fullName || 'N/A'}
                  </div>
                  <div className="wkop-modal-detail-item">
                    <strong>Email:</strong> {project.customerDetails?.email || 'N/A'}
                  </div>
                  <div className="wkop-modal-detail-item">
                    <strong>Contact:</strong> {project.customerDetails?.contactNumber || 'N/A'}
                  </div>
                </div>
              </div>
              <div className="wkop-modal-section">
                <div className="wkop-modal-section-title">Customer Address</div>
                <div className="wkop-detail-grid">
                  <div className="wkop-modal-detail-item">
                    <strong>Street:</strong> {project.customerAddress?.streetAddress || 'N/A'}
                  </div>
                  <div className="wkop-modal-detail-item">
                    <strong>City:</strong> {project.customerAddress?.city || 'N/A'}
                  </div>
                  <div className="wkop-modal-detail-item">
                    <strong>State:</strong> {project.customerAddress?.state || 'N/A'}
                  </div>
                  <div className="wkop-modal-detail-item">
                    <strong>Zip Code:</strong> {project.customerAddress?.zipCode || 'N/A'}
                  </div>
                </div>
              </div>
              <div className="wkop-modal-section">
                <div className="wkop-modal-section-title">Plot Information</div>
                <div className="wkop-detail-grid">
                  <div className="wkop-modal-detail-item">
                    <strong>Location:</strong> {project.plotInformation?.plotLocation || 'N/A'}
                  </div>
                  <div className="wkop-modal-detail-item">
                    <strong>Size:</strong> {project.plotInformation?.plotSize || 'N/A'}
                  </div>
                  <div className="wkop-modal-detail-item">
                    <strong>Orientation:</strong> {project.plotInformation?.plotOrientation || 'N/A'}
                  </div>
                </div>
              </div>
              <div className="wkop-modal-section">
                <div className="wkop-modal-section-title">Design Requirements</div>
                <div className="wkop-detail-grid">
                  <div className="wkop-modal-detail-item">
                    <strong>Type:</strong> {project.designRequirements?.designType || 'N/A'}
                  </div>
                  <div className="wkop-modal-detail-item">
                    <strong>Floors:</strong> {project.designRequirements?.numFloors || 'N/A'}
                  </div>
                  <div className="wkop-modal-detail-item">
                    <strong>Style:</strong> {project.designRequirements?.architecturalStyle || 'N/A'}
                  </div>
                  <div className="wkop-modal-detail-item">
                    <strong>Special Features:</strong> {project.designRequirements?.specialFeatures || 'None specified'}
                  </div>
                </div>
              </div>
              <div className="wkop-modal-section">
                <div className="wkop-modal-section-title">Additional Details</div>
                <div className="wkop-detail-grid">
                  <div className="wkop-modal-detail-item">
                    <strong>Budget:</strong> {project.additionalDetails?.budget || 'Not specified'}
                  </div>
                  <div className="wkop-modal-detail-item">
                    <strong>Completion Date:</strong> {project.additionalDetails?.completionDate ? new Date(project.additionalDetails.completionDate).toLocaleDateString() : 'Not specified'}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="wkop-modal-section">
                <div className="wkop-modal-section-title">Customer Details</div>
                <div className="wkop-detail-grid">
                  <div className="wkop-modal-detail-item">
                    <strong>Name:</strong> {project.fullName || 'N/A'}
                  </div>
                  <div className="wkop-modal-detail-item">
                    <strong>Email:</strong> {project.email || 'N/A'}
                  </div>
                  <div className="wkop-modal-detail-item">
                    <strong>Contact:</strong> {project.phone || 'N/A'}
                  </div>
                  <div className="wkop-modal-detail-item">
                    <strong>Address:</strong> {project.address || 'N/A'}
                  </div>
                </div>
              </div>
              <div className="wkop-modal-section">
                <div className="wkop-modal-section-title">Room Information</div>
                <div className="wkop-detail-grid">
                  <div className="wkop-modal-detail-item">
                    <strong>Room Type:</strong> {project.roomType || 'N/A'}
                  </div>
                  <div className="wkop-modal-detail-item">
                    <strong>Size:</strong> {project.roomSize?.length && project.roomSize?.width ? `${project.roomSize.length} × ${project.roomSize.width} ${project.roomSize.unit}` : 'N/A'}
                  </div>
                  <div className="wkop-modal-detail-item">
                    <strong>Ceiling Height:</strong> {project.ceilingHeight?.height ? `${project.ceilingHeight.height} ${project.ceilingHeight.unit}` : 'N/A'}
                  </div>
                  <div className="wkop-modal-detail-item">
                    <strong>Design Preference:</strong> {project.designPreference || 'N/A'}
                  </div>
                </div>
              </div>
              <div className="wkop-modal-section">
                <div className="wkop-modal-section-title">Project Description</div>
                <p>{project.projectDescription || 'No description provided'}</p>
              </div>
            </>
          )}

          {/* Reference/Inspiration Images */}
          {(() => {
            const images = isArchitect 
              ? project.additionalDetails?.referenceImages 
              : project.inspirationImages;
            
            if (images && images.length > 0) {
              return (
                <div className="wkop-modal-section">
                  <div className="wkop-modal-section-title">{isArchitect ? 'Reference Images' : 'Inspiration Images'}</div>
                  <div className="wkop-inspiration-images">
                    {images.map((img, index) => {
                      const imgUrl = typeof img === 'string' ? img : img.url;
                      return (
                        <div key={index}>
                          <img src={imgUrl} alt={`${isArchitect ? 'Reference' : 'Inspiration'} ${index + 1}`} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* Current Room Images (Interior Only) */}
          {!isArchitect && project.currentRoomImages && project.currentRoomImages.length > 0 && (
            <div className="wkop-modal-section">
              <div className="wkop-modal-section-title">Current Room Images</div>
              <div className="wkop-inspiration-images">
                {project.currentRoomImages.map((img, index) => (
                  <div key={index}>
                    <img src={img} alt={`Current Room ${index + 1}`} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Project Milestones */}
          {project.milestones && project.milestones.length > 0 && (
            <div className="wkop-modal-section">
              <div className="wkop-modal-section-title">
                <i className="fas fa-tasks"></i> Project Milestones
              </div>
              <div className="wkop-milestones-timeline">
                {project.milestones
                  .sort((a, b) => a.percentage - b.percentage)
                  .map((milestone, index) => (
                    <div key={index} className={`wkop-milestone-item wkop-milestone-${milestone.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                      <div className="wkop-milestone-header">
                        <div className="wkop-milestone-percentage">
                          <span className="wkop-percentage-circle">{milestone.percentage}%</span>
                        </div>
                        <div className="wkop-milestone-status">
                          <span className={`wkop-status-badge wkop-status-${milestone.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                            {milestone.status === 'Approved' && <i className="fas fa-check-circle"></i>}
                            {milestone.status === 'Pending' && <i className="fas fa-clock"></i>}
                            {milestone.status === 'Rejected' && <i className="fas fa-times-circle"></i>}
                            {milestone.status === 'Revision Requested' && <i className="fas fa-exclamation-circle"></i>}
                            {' '}{milestone.status || 'Pending'}
                          </span>
                        </div>
                      </div>
                      <div className="wkop-milestone-body">
                        <p className="wkop-milestone-description">{milestone.description || 'No description provided'}</p>
                        {milestone.submittedAt && (
                          <p className="wkop-milestone-date">
                            <i className="fas fa-calendar-alt"></i> Submitted: {new Date(milestone.submittedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                        )}
                        {milestone.approvedAt && (
                          <p className="wkop-milestone-date wkop-approved-date">
                            <i className="fas fa-check"></i> Approved: {new Date(milestone.approvedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                        )}
                        {milestone.rejectionReason && (
                          <div className="wkop-milestone-rejection">
                            <strong>Rejection Reason:</strong> {milestone.rejectionReason}
                          </div>
                        )}
                        {milestone.revisionNotes && (
                          <div className="wkop-milestone-revision">
                            <strong>Revision Notes:</strong> {milestone.revisionNotes}
                          </div>
                        )}
                        {milestone.image && (
                          <div className="wkop-milestone-image">
                            <img 
                              src={milestone.image} 
                              alt={`Milestone ${milestone.percentage}%`}
                              onClick={() => openLightbox(milestone.image)}
                              title="Click to view full size"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

        </div>
      </div>
      
      {/* Lightbox Modal for Images */}
      {lightboxImage && (
        <div className="wkop-lightbox" onClick={(e) => { e.stopPropagation(); closeLightbox(e); }}>
          <span className="wkop-lightbox-close" onClick={(e) => closeLightbox(e)}>&times;</span>
          <img 
            src={lightboxImage} 
            alt="Full size" 
            className="wkop-lightbox-image"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default ProjectDetailsModal;
