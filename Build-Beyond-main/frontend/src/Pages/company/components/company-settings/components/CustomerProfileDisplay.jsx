import React from "react";

export default function CustomerProfileDisplay({ company, onEdit }) {
  return (
    <div className="cs-display">
      <div className="cs-row">
        <label>Company Name</label>
        <p>{company.customerProfile.name}</p>
      </div>
      <div className="cs-row">
        <label>Location</label>
        <p>{company.customerProfile.location}</p>
      </div>
      <div className="cs-row">
        <label>Projects Completed</label>
        <p>{company.customerProfile.projectsCompleted}</p>
      </div>
      <div className="cs-row">
        <label>Years in Business</label>
        <p>{company.customerProfile.yearsInBusiness}</p>
      </div>
      <div className="cs-row">
        <label>About Company For Customers</label>
        <p>{company.customerProfile.about}</p>
      </div>

      <div className="cs-row">
        <label>Completed Projects</label>
        <div>
          {(company.customerProfile.completedProjects || []).map((p, i) => (
            <div className="cs-project-item" key={i}>
              <div className="cs-project-images">
                {p.beforeImage && (
                  <div className="cs-project-image-container">
                    <img
                      src={p.beforeImage}
                      alt={`${p.title} - Before`}
                      className="cs-project-img"
                    />
                    <span className="cs-image-label">Before Construction</span>
                  </div>
                )}
                {p.afterImage && (
                  <div className="cs-project-image-container">
                    <img
                      src={p.afterImage}
                      alt={`${p.title} - After`}
                      className="cs-project-img"
                    />
                    <span className="cs-image-label">After Construction</span>
                  </div>
                )}
              </div>
              <div className="cs-project-info">
                <strong>{p.title}</strong>
                <div className="cs-muted">{p.description}</div>
                {p.location && (
                  <div className="cs-muted">
                    <i className="fas fa-map-marker-alt"></i> {p.location}
                  </div>
                )}
                {p.tenderId && (
                  <div className="cs-muted">
                    <strong>Tender ID:</strong> {p.tenderId}
                  </div>
                )}
                {p.gpsLink && p.gpsLink.trim() !== "" && (
                  <div className="cs-muted">
                    <a href={p.gpsLink} target="_blank" rel="noopener noreferrer">
                      <i className="fas fa-map"></i> View on Map
                    </a>
                  </div>
                )}
                {p.materialCertificate && p.materialCertificate.trim() !== "" &&
                (p.materialCertificate.startsWith("http") ||
                  p.materialCertificate.startsWith("https")) ? (
                  <div className="cs-muted">
                    <a
                      href={p.materialCertificate}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <i className="fas fa-certificate"></i> Material Certificate
                    </a>
                  </div>
                ) : p.materialCertificate && p.materialCertificate.trim() !== "" ? (
                  <div
                    className="cs-muted"
                    style={{ color: "#6c757d", fontStyle: "italic" }}
                  >
                    <i className="fas fa-certificate"></i> Certificate uploaded (pending
                    processing)
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="cs-row">
        <label>Did You Know?</label>
        <div className="cs-did-you-know">{company.customerProfile.didYouKnow}</div>
      </div>

      <div className="cs-actions">
        <button className="cs-btn-primary" onClick={onEdit}>
          Edit Customer Profile
        </button>
      </div>
    </div>
  );
}
