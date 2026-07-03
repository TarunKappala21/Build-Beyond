import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axiosInstance from '../../../../api/axiosInstance';
import CustomerPageLoader from "../common/CustomerPageLoader";
import {
  readFavoritesByType,
  toggleFavoriteByType,
} from "../common/serviceFavoritesStorage";
import "./CustomerInterior.css";

const CustomerInterior = () => {
  const [designers, setDesigners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDesignerId, setSelectedDesignerId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSpecialty, setFilterSpecialty] = useState("all");
  const [viewFilter, setViewFilter] = useState("all");
  const [favoriteDesignerIds, setFavoriteDesignerIds] = useState(() =>
    readFavoritesByType("interior"),
  );
  const [hiredDesignerIds, setHiredDesignerIds] = useState([]);
  const [designerProjectStats, setDesignerProjectStats] = useState({});
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const loadDesignerData = async () => {
      try {
        const [designerRes, statusRes] = await Promise.allSettled([
          axiosInstance.get("/api/interior_designer"),
          axiosInstance.get("/api/job_status", { withCredentials: true }),
        ]);

        if (designerRes.status === "fulfilled") {
          setDesigners(designerRes.value.data.designers || []);
        } else {
          console.error("Error fetching designers:", designerRes.reason);
        }

        if (statusRes.status === "fulfilled") {
          const applications = statusRes.value.data?.interiorApplications || [];
          const hiredIds = new Set();
          const statsByDesigner = {};

          applications.forEach((app) => {
            const workerIdRaw =
              app.workerId?._id ||
              app.worker?._id ||
              app.workerId ||
              app.worker;
            const workerId = workerIdRaw ? String(workerIdRaw) : "";
            if (!workerId) return;

            const status = (app.status || "").toLowerCase();
            const isHired = [
              "accepted",
              "completed",
              "pending payment",
              "pending_payment",
            ].includes(status);
            if (!isHired) return;

            hiredIds.add(workerId);
            if (!statsByDesigner[workerId]) {
              statsByDesigner[workerId] = { active: 0, finished: 0 };
            }

            if (status === "completed") {
              statsByDesigner[workerId].finished += 1;
            } else {
              statsByDesigner[workerId].active += 1;
            }
          });

          setHiredDesignerIds(Array.from(hiredIds));
          setDesignerProjectStats(statsByDesigner);
        }
      } finally {
        setLoading(false);
      }
    };

    loadDesignerData();
  }, []);

  const specialties = [
    "all",
    ...new Set(designers.flatMap((a) => a.specialties || []).filter(Boolean)),
  ];

  const filteredDesigners = designers.filter((designer) => {
    const matchesSearch =
      designer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (designer.professionalTitle || "Interior Designer")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesSpecialty =
      filterSpecialty === "all" ||
      (designer.specialties &&
        designer.specialties.some(
          (s) => s.toLowerCase() === filterSpecialty.toLowerCase(),
        ));

    const ratingMode = viewFilter === "rating";
    const favoriteOnly =
      !ratingMode &&
      (viewFilter === "favorites" || viewFilter === "hired_favorites");
    const hiredOnly =
      !ratingMode &&
      (viewFilter === "hired" || viewFilter === "hired_favorites");

    const matchesFavorite =
      !favoriteOnly || favoriteDesignerIds.includes(designer._id);

    const matchesHired = !hiredOnly || hiredDesignerIds.includes(designer._id);

    return matchesSearch && matchesSpecialty && matchesFavorite && matchesHired;
  });

  const displayedDesigners =
    viewFilter === "rating"
      ? [...filteredDesigners].sort(
          (a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0),
        )
      : filteredDesigners;

  const handleToggleFavorite = (event, designerId) => {
    event.stopPropagation();
    setFavoriteDesignerIds(toggleFavoriteByType("interior", designerId));
  };

  const handleCardClick = (id) => {
    setSelectedDesignerId(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBookSubmit = (designerId) => {
    if (!designerId) {
      alert("Please select a designer before booking.");
      return;
    }
    navigate(`/customerdashboard/interiordesign_form?workerId=${designerId}`);
  };

  const selectedDesigner = designers.find(
    (des) => des._id === selectedDesignerId,
  );

  useEffect(() => {
    const workerId = searchParams.get("workerId");
    if (workerId) {
      setSelectedDesignerId(workerId);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [searchParams, designers]);

  if (loading) {
    return <CustomerPageLoader message="Loading designers..." />;
  }

  return (
    <div className="designer-page">
      <div className="designer-controls">
        <div className="designer-controls-container">
          {selectedDesignerId && (
            <button
              type="button"
              className="page-back-button"
              onClick={() => setSelectedDesignerId(null)}
            >
              <i className="fas fa-arrow-left"></i>
              Back
            </button>
          )}
          <h1 className="designer-page-title">Interior Designers</h1>
          <div className="search-box-compact">
            <input
              type="text"
              placeholder="Search designers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {!selectedDesignerId && (
        <div className="designer-filter-bar">
          <div className="filter-box">
            <label htmlFor="specialty-filter">
              <i className="fas fa-filter"></i>
              Specialty:
            </label>
            <select
              id="specialty-filter"
              value={filterSpecialty}
              onChange={(e) => setFilterSpecialty(e.target.value)}
            >
              <option value="all">All Specialties</option>
              {specialties
                .filter((s) => s !== "all")
                .map((specialty, idx) => (
                  <option key={idx} value={specialty}>
                    {specialty}
                  </option>
                ))}
            </select>
          </div>
          <div className="filter-box">
            <label htmlFor="view-filter">
              <i className="fas fa-sliders-h"></i>
              Filter:
            </label>
            <select
              id="view-filter"
              value={viewFilter}
              onChange={(e) => setViewFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="favorites">Favorites Only</option>
              <option value="hired">Previously Hired</option>
              <option value="hired_favorites">Hired + Favorites</option>
              <option value="rating">Rating</option>
            </select>
          </div>
          <div className="results-count">
            <span className="count-number">{displayedDesigners.length}</span>
            <span className="count-label">
              {displayedDesigners.length === 1 ? "Designer" : "Designers"}
            </span>
          </div>
        </div>
      )}

      <div
        className={`designer-container ${selectedDesignerId ? "split-view" : ""}`}
      >
        {!selectedDesignerId ? (
          <div className="designers-grid">
            {displayedDesigners.length > 0 ? (
              displayedDesigners.map((designer) => (
                <div key={designer._id} className="designer-wrapper">
                  <div
                    className={`designer-card ${
                      selectedDesignerId === designer._id ? "selected" : ""
                    }`}
                    onClick={() => handleCardClick(designer._id)}
                  >
                    <div className="designer-card-header">
                      <button
                        type="button"
                        className={`favorite-star-btn ${favoriteDesignerIds.includes(designer._id) ? "active" : ""}`}
                        onClick={(event) =>
                          handleToggleFavorite(event, designer._id)
                        }
                        aria-label={
                          favoriteDesignerIds.includes(designer._id)
                            ? "Remove from favorites"
                            : "Add to favorites"
                        }
                      >
                        <i className="fas fa-star"></i>
                      </button>
                      <img
                        src={
                          designer.profileImage ||
                          "https://t4.ftcdn.net/jpg/03/64/21/11/360_F_364211147_1qgLVxv1Tcq0Ohz3FawUfrtONzz8nq3e.jpg"
                        }
                        alt={designer.name}
                        className="designer-avatar"
                      />
                      <div className="designer-badge-container">
                        {designer.certifications &&
                          designer.certifications.length > 0 && (
                            <span className="certified-badge">
                              <i className="fas fa-certificate"></i> Certified
                            </span>
                          )}
                      </div>
                    </div>
                    <div className="designer-card-body">
                      <h3 className="designer-name">{designer.name}</h3>
                      <p className="designer-title">
                        {designer.professionalTitle || "Interior Designer"}
                      </p>
                      <div className="designer-meta">
                        <span className="meta-item">
                          <i className="fas fa-briefcase"></i>
                          {designer.experience} years
                        </span>
                        <span className="meta-item rating-item">
                          <i className="fas fa-star"></i>
                          {designer.rating || 0}
                          {designer.totalReviews > 0 && (
                            <span className="review-count">
                              ({designer.totalReviews})
                            </span>
                          )}
                        </span>
                      </div>
                      {designer.specialties &&
                        designer.specialties.length > 0 && (
                          <div className="designer-specialties">
                            {designer.specialties
                              .slice(0, 2)
                              .map((spec, idx) => (
                                <span key={idx} className="specialty-tag">
                                  {spec}
                                </span>
                              ))}
                            {designer.specialties.length > 2 && (
                              <span className="specialty-tag">
                                +{designer.specialties.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      {(viewFilter === "hired" ||
                        viewFilter === "hired_favorites") &&
                        designerProjectStats[designer._id] && (
                          <div className="provider-history-row">
                            <span className="provider-history-pill">
                              Active:{" "}
                              {designerProjectStats[designer._id].active}
                            </span>
                            <span className="provider-history-pill">
                              Finished:{" "}
                              {designerProjectStats[designer._id].finished}
                            </span>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-results">
                <i className="fas fa-search"></i>
                <p>
                  {viewFilter === "hired" || viewFilter === "hired_favorites"
                    ? "No previously hired designers found."
                    : "No designers found matching your criteria."}
                </p>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="designer-list-section">
              {displayedDesigners.map((designer) => (
                <div
                  key={designer._id}
                  className={`designer-card-compact ${
                    selectedDesignerId === designer._id ? "selected" : ""
                  }`}
                  onClick={() => handleCardClick(designer._id)}
                >
                  <button
                    type="button"
                    className={`favorite-star-btn favorite-star-btn-compact ${favoriteDesignerIds.includes(designer._id) ? "active" : ""}`}
                    onClick={(event) =>
                      handleToggleFavorite(event, designer._id)
                    }
                    aria-label={
                      favoriteDesignerIds.includes(designer._id)
                        ? "Remove from favorites"
                        : "Add to favorites"
                    }
                  >
                    <i className="fas fa-star"></i>
                  </button>
                  <img
                    src={
                      designer.profileImage ||
                      "https://t4.ftcdn.net/jpg/03/64/21/11/360_F_364211147_1qgLVxv1Tcq0Ohz3FawUfrtONzz8nq3e.jpg"
                    }
                    alt={designer.name}
                    className="designer-avatar-compact"
                  />
                  <div className="designer-info-compact">
                    <h3 className="designer-name-compact">{designer.name}</h3>
                    <p className="designer-title-compact">
                      {designer.professionalTitle || "Interior Designer"}
                    </p>
                    <div className="designer-meta-compact">
                      <span className="meta-item-compact">
                        <i className="fas fa-briefcase"></i>
                        {designer.experience}y
                      </span>
                      <span className="meta-item-compact">
                        <i className="fas fa-star"></i>
                        {designer.rating || 0}
                      </span>
                    </div>
                  </div>
                  {designer.certifications &&
                    designer.certifications.length > 0 && (
                      <div className="compact-badge">
                        <i className="fas fa-certificate"></i>
                      </div>
                    )}
                </div>
              ))}
            </div>

            <div className="designer-details-section">
              {selectedDesigner && (
                <div className="designer-details-expanded">
                  <div className="designer-profile-header">
                    <img
                      src={
                        selectedDesigner.profileImage ||
                        "https://t4.ftcdn.net/jpg/03/64/21/11/360_F_364211147_1qgLVxv1Tcq0Ohz3FawUfrtONzz8nq3e.jpg"
                      }
                      alt={selectedDesigner.name}
                      className="designer-profile-image"
                    />
                    <div className="designer-profile-info">
                      <h2 className="designer-profile-name">
                        {selectedDesigner.name}
                      </h2>
                      <p className="designer-profile-role">
                        {selectedDesigner.professionalTitle ||
                          "Interior Designer"}
                      </p>
                      <div className="designer-profile-meta">
                        <span className="profile-meta-item">
                          <i className="fas fa-briefcase"></i>
                          <strong>{selectedDesigner.experience}</strong> years
                          experience
                        </span>
                        <span className="profile-meta-item">
                          <div className="rating-stars">
                            {[...Array(5)].map((_, index) => (
                              <i
                                key={index}
                                className={`fas fa-star ${
                                  index <
                                  Math.floor(selectedDesigner.rating || 0)
                                    ? "filled"
                                    : index < (selectedDesigner.rating || 0)
                                      ? "half-filled"
                                      : "empty"
                                }`}
                              ></i>
                            ))}
                          </div>
                          <strong className="rating-number">
                            {selectedDesigner.rating || 0}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h3 className="section-title">
                      <i className="fas fa-user"></i>
                      About
                    </h3>
                    <p className="about-text">
                      {selectedDesigner.about || "Information not available"}
                    </p>
                  </div>

                  <div className="detail-section">
                    <h3 className="section-title">
                      <i className="fas fa-address-card"></i>
                      Contact Information
                    </h3>
                    <div className="contact-info-grid">
                      {selectedDesigner.phoneNumber && (
                        <div className="contact-item">
                          <i className="fas fa-phone"></i>
                          <span>{selectedDesigner.phoneNumber}</span>
                        </div>
                      )}
                      {selectedDesigner.email && (
                        <div className="contact-item">
                          <i className="fas fa-envelope"></i>
                          <span>{selectedDesigner.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedDesigner.skills &&
                    selectedDesigner.skills.length > 0 && (
                      <div className="detail-section">
                        <h3 className="section-title">
                          <i className="fas fa-tools"></i>
                          Skills & Expertise
                        </h3>
                        <div className="skills-grid">
                          {selectedDesigner.skills.map((skill, idx) => (
                            <span key={idx} className="skill-badge">
                              <i className="fas fa-check"></i>
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  {selectedDesigner.certifications &&
                    selectedDesigner.certifications.length > 0 && (
                      <div className="detail-section">
                        <h3 className="section-title">
                          <i className="fas fa-certificate"></i>
                          Certifications & Licenses
                        </h3>
                        <div className="certifications-list">
                          {selectedDesigner.certifications.map((cert, idx) => (
                            <div key={idx} className="certification-item">
                              <i className="fas fa-award"></i>
                              <span>{cert}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {selectedDesigner.specialties &&
                    selectedDesigner.specialties.length > 0 && (
                      <div className="detail-section">
                        <h3 className="section-title">
                          <i className="fas fa-star"></i>
                          Specializations
                        </h3>
                        <div className="specialties-grid">
                          {selectedDesigner.specialties.map(
                            (specialty, idx) => (
                              <span key={idx} className="specialty-badge">
                                {specialty}
                              </span>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                  {selectedDesigner.languages &&
                    selectedDesigner.languages.length > 0 && (
                      <div className="detail-section">
                        <h3 className="section-title">
                          <i className="fas fa-language"></i>
                          Languages
                        </h3>
                        <p>{selectedDesigner.languages.join(", ")}</p>
                      </div>
                    )}

                  {selectedDesigner.expectedPrice && (
                    <div className="detail-section price-section">
                      <h3 className="section-title">
                        <i className="fas fa-tag"></i>
                        Expected Price Range
                      </h3>
                      <div className="price-display">
                        <i className="fas fa-rupee-sign"></i>
                        <span>{selectedDesigner.expectedPrice}</span>
                      </div>
                    </div>
                  )}

                  {selectedDesigner.previousCompanies &&
                    selectedDesigner.previousCompanies.length > 0 && (
                      <div className="detail-section">
                        <h3 className="section-title">
                          <i className="fas fa-briefcase"></i>
                          Work Experience
                        </h3>
                        <div className="experience-timeline">
                          {selectedDesigner.previousCompanies.map(
                            (company, idx) => (
                              <div key={idx} className="experience-item">
                                <h4 className="company-name">
                                  <i className="fas fa-building"></i>
                                  {company.companyName}
                                </h4>
                                <div className="company-details">
                                  <p>
                                    <strong>Role:</strong> {company.role}
                                  </p>
                                  <p>
                                    <strong>Location:</strong>{" "}
                                    {company.location}
                                  </p>
                                  <p>
                                    <strong>Duration:</strong>{" "}
                                    {company.duration}
                                  </p>
                                </div>
                                {company.proofs &&
                                  company.proofs.length > 0 && (
                                    <div className="company-proofs">
                                      <strong>Documents:</strong>
                                      <div className="proof-gallery">
                                        {company.proofs.map((proof, pidx) => (
                                          <img
                                            key={pidx}
                                            src={proof}
                                            alt={`Proof ${pidx + 1}`}
                                            className="proof-image"
                                            onClick={() =>
                                              window.open(proof, "_blank")
                                            }
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  )}
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                  {selectedDesigner.projects &&
                    selectedDesigner.projects.length > 0 && (
                      <div className="detail-section">
                        <h3 className="section-title">
                          <i className="fas fa-project-diagram"></i>
                          Notable Projects
                        </h3>
                        <div className="projects-grid">
                          {selectedDesigner.projects.map((project, idx) => (
                            <div key={idx} className="project-card">
                              <h4 className="project-name">{project.name}</h4>
                              <div className="project-meta">
                                {(project.year || project.yearRange) && (
                                  <span>
                                    <i className="fas fa-calendar"></i>
                                    {project.year || project.yearRange}
                                  </span>
                                )}
                                {project.location && (
                                  <span>
                                    <i className="fas fa-map-marker-alt"></i>
                                    {project.location}
                                  </span>
                                )}
                              </div>
                              {project.description && (
                                <p className="project-description">
                                  {project.description}
                                </p>
                              )}
                              {project.images && project.images.length > 0 ? (
                                <div className="project-gallery">
                                  {project.images.map((img, imgIdx) => (
                                    <img
                                      key={imgIdx}
                                      src={img}
                                      alt={`${project.name} ${imgIdx + 1}`}
                                      className="project-image"
                                      onClick={() => window.open(img, "_blank")}
                                    />
                                  ))}
                                </div>
                              ) : (
                                project.image && (
                                  <img
                                    src={project.image}
                                    alt={project.name}
                                    className="project-image"
                                    onClick={() =>
                                      window.open(project.image, "_blank")
                                    }
                                  />
                                )
                              )}
                              {project.invoiceOrCertificate && (
                                <a
                                  href={project.invoiceOrCertificate}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="project-document-link"
                                >
                                  <i className="fas fa-file-invoice"></i>
                                  View Project Document
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {selectedDesigner.reviews &&
                    selectedDesigner.reviews.length > 0 && (
                      <div className="detail-section">
                        <h3 className="section-title">
                          <i className="fas fa-star"></i>
                          Customer Reviews ({selectedDesigner.reviews.length})
                        </h3>
                        <div className="reviews-grid">
                          {selectedDesigner.reviews
                            .slice(0, 5)
                            .map((review, idx) => (
                              <div key={idx} className="review-card">
                                <div className="review-header">
                                  <div className="review-author">
                                    <i className="fas fa-user-circle"></i>
                                    <strong>
                                      {review.customerName || "Anonymous"}
                                    </strong>
                                  </div>
                                  <div className="review-rating">
                                    {[...Array(review.rating)].map(
                                      (_, ridx) => (
                                        <i
                                          key={ridx}
                                          className="fas fa-star"
                                        ></i>
                                      ),
                                    )}
                                  </div>
                                </div>
                                <p className="review-project">
                                  <i className="fas fa-briefcase"></i>
                                  {review.projectName}
                                </p>
                                {review.comment && (
                                  <p className="review-comment">
                                    "{review.comment}"
                                  </p>
                                )}
                                <p className="review-date">
                                  {new Date(
                                    review.reviewedAt,
                                  ).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </p>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                  <div className="detail-section book-section">
                    <button
                      className="btn-book-consultation"
                      onClick={() => handleBookSubmit(selectedDesigner._id)}
                    >
                      <i className="fas fa-calendar-check"></i>
                      Book Consultation with {selectedDesigner.name}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CustomerInterior;
