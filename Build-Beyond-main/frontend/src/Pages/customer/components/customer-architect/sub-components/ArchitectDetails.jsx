// src/Pages/customer/components/customer-architect/sub-components/ArchitectDetails.jsx
import React from "react";

const ArchitectDetails = ({ architect }) => {
  if (!architect) {
    return (
      <div className="ca-initial-message">
        <p>Select an architect from the list to view their details.</p>
      </div>
    );
  }

  return (
    <div key={architect._id} className="ca-architect-details ca-active">
      <div className="ca-architect-header">
        <img
          src={
            architect.profileImage ||
            "https://t4.ftcdn.net/jpg/03/64/21/11/360_F_364211147_1qgLVxv1Tcq0Ohz3FawUfrtONzz8nq3e.jpg"
          }
          alt={architect.name}
          className="ca-architect-image-large"
        />
        <div className="ca-architect-header-content">
          <h2>{architect.name}</h2>
          <p>
            <strong>{architect.professionalTitle || "Architect"}</strong>
          </p>
          <p>
            <i className="fas fa-briefcase"></i> {architect.experience} years
            experience
          </p>
          <div className="ca-rating">
            {[...Array(Math.floor(architect.rating))].map((_, i) => (
              <span key={i} className="ca-star">
                ★
              </span>
            ))}
            {architect.rating % 1 >= 0.5 && <span className="ca-star">½</span>}
            <span className="ca-rating-count">
              {architect.rating} ({architect.totalReviews || 0} reviews)
            </span>
          </div>
          <div className="ca-worker-badges">
            {architect.phoneNumber && (
              <span className="ca-contact-badge">
                <i className="fas fa-phone"></i> {architect.phoneNumber}
              </span>
            )}
            {architect.email && (
              <span className="ca-contact-badge">
                <i className="fas fa-envelope"></i> {architect.email}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="ca-bio">
        <h3>About</h3>
        <p>{architect.about || "Information not available"}</p>
      </div>

      {/* SKILLS */}
      {architect.skills && architect.skills.length > 0 && (
        <div className="ca-skills-section">
          <h3>Skills & Expertise</h3>
          <div className="ca-skills-grid">
            {architect.skills.map((skill, i) => (
              <span key={i} className="ca-skill-badge">
                <i className="fas fa-check-circle"></i> {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* CERTIFICATIONS */}
      {architect.certifications && architect.certifications.length > 0 && (
        <div className="ca-certifications-section">
          <h3>Certifications & Licenses</h3>
          <div className="ca-certifications-list">
            {architect.certifications.map((cert, i) => (
              <div key={i} className="ca-certification-item">
                <i className="fas fa-certificate"></i>
                <span>{cert}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SPECIALTIES */}
      {architect.specialties && architect.specialties.length > 0 && (
        <div className="ca-specialties-section">
          <h3>Specializations</h3>
          <div className="ca-specialties">
            {architect.specialties.map((specialty, i) => (
              <span key={i} className="ca-specialty">
                {specialty}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* LANGUAGES */}
      {architect.languages && architect.languages.length > 0 && (
        <div className="ca-languages-section">
          <h3>Languages</h3>
          <p>{architect.languages.join(", ")}</p>
        </div>
      )}

      {/* PRICE */}
      {architect.expectedPrice && (
        <div className="ca-price-section">
          <h3>Expected Price Range</h3>
          <p className="ca-price-tag">
            <i className="fas fa-rupee-sign"></i> {architect.expectedPrice}
          </p>
        </div>
      )}

      {/* WORK EXPERIENCE */}
      {architect.previousCompanies &&
        architect.previousCompanies.length > 0 && (
          <div className="ca-experience-section">
            <h3>Work Experience</h3>
            {architect.previousCompanies.map((company, i) => (
              <div key={i} className="ca-company-card">
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
                  <div className="ca-company-proofs">
                    <strong>Documents:</strong>
                    <div className="ca-proof-gallery">
                      {company.proofs.map((proof, idx) => (
                        <img
                          key={idx}
                          src={proof}
                          alt={`Proof ${idx + 1}`}
                          className="ca-proof-image"
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
      <div className="ca-projects">
        <h3>Notable Projects</h3>
        {architect.projects && architect.projects.length > 0 ? (
          architect.projects.map((project, i) => (
            <div key={i} className="ca-project">
              <h4>
                <i className="fas fa-project-diagram"></i> {project.name}
              </h4>
              <div className="ca-project-meta">
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
                <div className="ca-project-gallery">
                  {project.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`${project.name}-${idx}`}
                      className="ca-project-image"
                    />
                  ))}
                </div>
              ) : (
                // Backward compatibility: single image
                project.image && (
                  <img
                    src={project.image}
                    alt={project.name}
                    className="ca-project-image"
                  />
                )
              )}

              {/* Display invoice or certificate if available */}
              {project.invoiceOrCertificate && (
                <div className="ca-project-document">
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
          <p>No projects available for this architect.</p>
        )}
      </div>

      {/* REVIEWS */}
      {architect.reviews && architect.reviews.length > 0 && (
        <div className="ca-reviews-section">
          <h3>Customer Reviews ({architect.reviews.length})</h3>
          <div className="ca-reviews-list">
            {architect.reviews.slice(0, 5).map((review, i) => (
              <div key={i} className="ca-review-card">
                <div className="ca-review-header">
                  <div className="ca-review-author">
                    <i className="fas fa-user-circle"></i>
                    <strong>{review.customerName || "Anonymous"}</strong>
                  </div>
                  <div className="ca-review-rating">
                    {[...Array(review.rating)].map((_, j) => (
                      <span key={j} className="ca-star">
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                <p className="ca-review-project">
                  <i className="fas fa-briefcase"></i> {review.projectName}
                </p>
                {review.comment && (
                  <p className="ca-review-comment">"{review.comment}"</p>
                )}
                <p className="ca-review-date">
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

export default ArchitectDetails;
