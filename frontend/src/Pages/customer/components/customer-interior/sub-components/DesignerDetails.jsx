// src/Pages/customer/components/customer-interior/sub-components/DesignerDetails.jsx
import React from "react";

const DesignerDetails = ({ designer }) => {
  if (!designer) {
    return (
      <div className="interior-initial-message">
        <p>Select an interior designer from the list to view their details.</p>
      </div>
    );
  }

  return (
    <div
      key={designer._id}
      className="interior-designer-details active"
      id={`designer-${designer._id}`}
    >
      <div className="interior-designer-header">
        <img
          src={
            designer.profileImage ||
            "https://t4.ftcdn.net/jpg/03/64/21/11/360_F_364211147_1qgLVxv1Tcq0Ohz3FawUfrtONzz8nq3e.jpg"
          }
          alt={designer.name}
          className="interior-designer-image-large"
        />
        <div className="interior-designer-header-content">
          <h2>{designer.name}</h2>
          <p>
            <strong>{designer.professionalTitle || "Interior Designer"}</strong>
          </p>
          <p>
            <i className="fas fa-briefcase"></i> {designer.experience} years
            experience
          </p>
          <div className="interior-rating">
            {[...Array(Math.floor(designer.rating))].map((_, i) => (
              <span key={i} className="interior-star">
                ★
              </span>
            ))}
            {designer.rating % 1 >= 0.5 && (
              <span className="interior-star">½</span>
            )}
            <span className="interior-rating-count">
              {designer.rating} ({designer.totalReviews || 0} reviews)
            </span>
          </div>
          <div className="interior-worker-badges">
            {designer.phoneNumber && (
              <span className="interior-contact-badge">
                <i className="fas fa-phone"></i> {designer.phoneNumber}
              </span>
            )}
            {designer.email && (
              <span className="interior-contact-badge">
                <i className="fas fa-envelope"></i> {designer.email}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="interior-bio">
        <h3>About</h3>
        <p>{designer.about || "Information not available"}</p>
      </div>

      {/* SKILLS */}
      {designer.skills && designer.skills.length > 0 && (
        <div className="interior-skills-section">
          <h3>Skills & Expertise</h3>
          <div className="interior-skills-grid">
            {designer.skills.map((skill, i) => (
              <span key={i} className="interior-skill-badge">
                <i className="fas fa-check-circle"></i> {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* CERTIFICATIONS */}
      {designer.certifications && designer.certifications.length > 0 && (
        <div className="interior-certifications-section">
          <h3>Certifications & Licenses</h3>
          <div className="interior-certifications-list">
            {designer.certifications.map((cert, i) => (
              <div key={i} className="interior-certification-item">
                <i className="fas fa-certificate"></i>
                <span>{cert}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SPECIALTIES */}
      {designer.specialties && designer.specialties.length > 0 && (
        <div className="interior-specialties-section">
          <h3>Specializations</h3>
          <div className="interior-specialties">
            {designer.specialties.map((specialty, i) => (
              <span key={i} className="interior-specialty">
                {specialty}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* LANGUAGES */}
      {designer.languages && designer.languages.length > 0 && (
        <div className="interior-languages-section">
          <h3>Languages</h3>
          <p>{designer.languages.join(", ")}</p>
        </div>
      )}

      {/* PRICE */}
      {designer.expectedPrice && (
        <div className="interior-price-section">
          <h3>Expected Price Range</h3>
          <p className="interior-price-tag">
            <i className="fas fa-rupee-sign"></i> {designer.expectedPrice}
          </p>
        </div>
      )}

      {/* WORK EXPERIENCE */}
      {designer.previousCompanies && designer.previousCompanies.length > 0 && (
        <div className="interior-experience-section">
          <h3>Work Experience</h3>
          {designer.previousCompanies.map((company, i) => (
            <div key={i} className="interior-company-card">
              <h4>
                <i className="fas fa-building"></i> {company.companyName}
              </h4>
              <p>
                <strong>Role:</strong> {company.role}
              </p>
              <p>
                <strong>Location:</strong> {company.location}
              </p>
              <p>
                <strong>Duration:</strong> {company.duration}
              </p>
              {company.proofs && company.proofs.length > 0 && (
                <div className="interior-company-proofs">
                  <strong>Documents:</strong>
                  <div className="interior-proof-gallery">
                    {company.proofs.map((proof, idx) => (
                      <img
                        key={idx}
                        src={proof}
                        alt={`Proof ${idx + 1}`}
                        className="interior-proof-image"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* PROJECTS */}
      <div className="interior-projects">
        <h3>Notable Projects</h3>
        {designer.projects && designer.projects.length > 0 ? (
          designer.projects.map((project, i) => (
            <div key={i} className="interior-project">
              <h4>
                <i className="fas fa-project-diagram"></i> {project.name}
              </h4>
              <div className="interior-project-meta">
                {(project.year || project.yearRange) && (
                  <span>
                    <i className="fas fa-calendar-alt"></i>{" "}
                    {project.year || project.yearRange}
                  </span>
                )}
                {project.location && (
                  <span>
                    <i className="fas fa-map-marker-alt"></i> {project.location}
                  </span>
                )}
              </div>
              {project.description && <p>{project.description}</p>}

              {/* Display multiple images if available */}
              {project.images && project.images.length > 0 ? (
                <div className="interior-project-gallery">
                  {project.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`${project.name}-${idx}`}
                      className="interior-project-image"
                    />
                  ))}
                </div>
              ) : (
                // Backward compatibility: single image
                project.image && (
                  <img
                    src={project.image}
                    alt={project.name}
                    className="interior-project-image"
                  />
                )
              )}

              {/* Display invoice or certificate if available */}
              {project.invoiceOrCertificate && (
                <div className="interior-project-document">
                  <a
                    href={project.invoiceOrCertificate}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i className="fas fa-file-invoice"></i> View Project
                    Document
                  </a>
                </div>
              )}
            </div>
          ))
        ) : (
          <p>No projects available for this designer.</p>
        )}
      </div>

      {/* REVIEWS */}
      {designer.reviews && designer.reviews.length > 0 && (
        <div className="interior-reviews-section">
          <h3>Customer Reviews ({designer.reviews.length})</h3>
          <div className="interior-reviews-list">
            {designer.reviews.slice(0, 5).map((review, i) => (
              <div key={i} className="interior-review-card">
                <div className="interior-review-header">
                  <div className="interior-review-author">
                    <i className="fas fa-user-circle"></i>
                    <strong>{review.customerName || "Anonymous"}</strong>
                  </div>
                  <div className="interior-review-rating">
                    {[...Array(review.rating)].map((_, j) => (
                      <span key={j} className="interior-star">
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                <p className="interior-review-project">
                  <i className="fas fa-briefcase"></i> {review.projectName}
                </p>
                {review.comment && (
                  <p className="interior-review-comment">"{review.comment}"</p>
                )}
                <p className="interior-review-date">
                  {new Date(review.reviewedAt).toLocaleDateString("en-IN", {
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignerDetails;
