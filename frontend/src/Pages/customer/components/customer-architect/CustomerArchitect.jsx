import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axiosInstance from '../../../../api/axiosInstance';
import CustomerPageLoader from "../common/CustomerPageLoader";
import {
  readFavoritesByType,
  toggleFavoriteByType,
} from "../common/serviceFavoritesStorage";
import "./CustomerArchitect.css";

const CustomerArchitect = () => {
  const [architects, setArchitects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedArchitectId, setSelectedArchitectId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSpecialty, setFilterSpecialty] = useState("all");
  const [viewFilter, setViewFilter] = useState("all");
  const [favoriteArchitectIds, setFavoriteArchitectIds] = useState(() =>
    readFavoritesByType("architect"),
  );
  const [hiredArchitectIds, setHiredArchitectIds] = useState([]);
  const [architectProjectStats, setArchitectProjectStats] = useState({});
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const loadArchitectData = async () => {
      try {
        const [architectRes, statusRes] = await Promise.allSettled([
          axiosInstance.get("/api/architect"),
          axiosInstance.get("/api/job_status", { withCredentials: true }),
        ]);

        if (architectRes.status === "fulfilled") {
          setArchitects(architectRes.value.data.architects || []);
        } else {
          console.error("Error fetching architects:", architectRes.reason);
        }

        if (statusRes.status === "fulfilled") {
          const applications =
            statusRes.value.data?.architectApplications || [];
          const hiredIds = new Set();
          const statsByArchitect = {};

          applications.forEach((app) => {
            const workerIdRaw =
              app.worker?._id ||
              app.workerId?._id ||
              app.worker ||
              app.workerId;
            const workerId = workerIdRaw ? String(workerIdRaw) : "";
            if (!workerId) return;

            const status = (app.status || "").toLowerCase();
            const isHired = [
              "accepted",
              "completed",
              "pending payment",
            ].includes(status);
            if (!isHired) return;

            hiredIds.add(workerId);
            if (!statsByArchitect[workerId]) {
              statsByArchitect[workerId] = { active: 0, finished: 0 };
            }

            if (status === "completed") {
              statsByArchitect[workerId].finished += 1;
            } else {
              statsByArchitect[workerId].active += 1;
            }
          });

          setHiredArchitectIds(Array.from(hiredIds));
          setArchitectProjectStats(statsByArchitect);
        }
      } finally {
        setLoading(false);
      }
    };

    loadArchitectData();
  }, []);

  const specialties = [
    "all",
    ...new Set(architects.flatMap((a) => a.specialties || []).filter(Boolean)),
  ];

  const filteredArchitects = architects.filter((architect) => {
    const matchesSearch =
      architect.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (architect.professionalTitle || "Architect")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesSpecialty =
      filterSpecialty === "all" ||
      (architect.specialties &&
        architect.specialties.some(
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
      !favoriteOnly || favoriteArchitectIds.includes(architect._id);

    const matchesHired =
      !hiredOnly || hiredArchitectIds.includes(architect._id);

    return matchesSearch && matchesSpecialty && matchesFavorite && matchesHired;
  });

  const displayedArchitects =
    viewFilter === "rating"
      ? [...filteredArchitects].sort(
          (a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0),
        )
      : filteredArchitects;

  const handleToggleFavorite = (event, architectId) => {
    event.stopPropagation();
    setFavoriteArchitectIds(toggleFavoriteByType("architect", architectId));
  };

  const handleCardClick = (id) => {
    setSelectedArchitectId(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBookSubmit = (architectId) => {
    if (!architectId) {
      alert("Please select an architect before booking.");
      return;
    }
    navigate(`/customerdashboard/architect_form?workerId=${architectId}`);
  };

  const selectedArchitect = architects.find(
    (arch) => arch._id === selectedArchitectId,
  );

  useEffect(() => {
    const workerId = searchParams.get("workerId");
    if (workerId) {
      setSelectedArchitectId(workerId);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [searchParams, architects]);

  if (loading) {
    return <CustomerPageLoader message="Loading architects..." />;
  }

  return (
    <div className="architect-page">
      <div className="architect-controls">
        <div className="architect-controls-container">
          {selectedArchitectId && (
            <button
              type="button"
              className="page-back-button"
              onClick={() => setSelectedArchitectId(null)}
            >
              <i className="fas fa-arrow-left"></i>
              Back
            </button>
          )}
          <h1 className="architect-page-title">Architects</h1>
          <div className="search-box-compact">
            <input
              type="text"
              placeholder="Search architects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {!selectedArchitectId && (
        <div className="architect-filter-bar">
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
            <span className="count-number">{displayedArchitects.length}</span>
            <span className="count-label">
              {displayedArchitects.length === 1 ? "Architect" : "Architects"}
            </span>
          </div>
        </div>
      )}

      <div
        className={`architect-container ${selectedArchitectId ? "split-view" : ""}`}
      >
        {!selectedArchitectId ? (
          <div className="architects-grid">
            {displayedArchitects.length > 0 ? (
              displayedArchitects.map((architect) => (
                <div key={architect._id} className="architect-wrapper">
                  <div
                    className={`architect-card ${
                      selectedArchitectId === architect._id ? "selected" : ""
                    }`}
                    onClick={() => handleCardClick(architect._id)}
                  >
                    <div className="architect-card-header">
                      <button
                        type="button"
                        className={`favorite-star-btn ${favoriteArchitectIds.includes(architect._id) ? "active" : ""}`}
                        onClick={(event) =>
                          handleToggleFavorite(event, architect._id)
                        }
                        aria-label={
                          favoriteArchitectIds.includes(architect._id)
                            ? "Remove from favorites"
                            : "Add to favorites"
                        }
                      >
                        <i className="fas fa-star"></i>
                      </button>
                      <img
                        src={
                          architect.profileImage ||
                          "https://t4.ftcdn.net/jpg/03/64/21/11/360_F_364211147_1qgLVxv1Tcq0Ohz3FawUfrtONzz8nq3e.jpg"
                        }
                        alt={architect.name}
                        className="architect-avatar"
                      />
                      <div className="architect-badge-container">
                        {architect.certifications &&
                          architect.certifications.length > 0 && (
                            <span className="certified-badge">
                              <i className="fas fa-certificate"></i> Certified
                            </span>
                          )}
                      </div>
                    </div>
                    <div className="architect-card-body">
                      <h3 className="architect-name">{architect.name}</h3>
                      <p className="architect-title">
                        {architect.professionalTitle || "Architect"}
                      </p>
                      <div className="architect-meta">
                        <span className="meta-item">
                          <i className="fas fa-briefcase"></i>
                          {architect.experience} years
                        </span>
                        <span className="meta-item rating-item">
                          <i className="fas fa-star"></i>
                          {architect.rating || 0}
                          {architect.totalReviews > 0 && (
                            <span className="review-count">
                              ({architect.totalReviews})
                            </span>
                          )}
                        </span>
                      </div>
                      {architect.specialties &&
                        architect.specialties.length > 0 && (
                          <div className="architect-specialties">
                            {architect.specialties
                              .slice(0, 2)
                              .map((spec, idx) => (
                                <span key={idx} className="specialty-tag">
                                  {spec}
                                </span>
                              ))}
                            {architect.specialties.length > 2 && (
                              <span className="specialty-tag">
                                +{architect.specialties.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      {(viewFilter === "hired" ||
                        viewFilter === "hired_favorites") &&
                        architectProjectStats[architect._id] && (
                          <div className="provider-history-row">
                            <span className="provider-history-pill">
                              Active:{" "}
                              {architectProjectStats[architect._id].active}
                            </span>
                            <span className="provider-history-pill">
                              Finished:{" "}
                              {architectProjectStats[architect._id].finished}
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
                    ? "No previously hired architects found."
                    : "No architects found matching your criteria."}
                </p>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="architect-list-section">
              {displayedArchitects.map((architect) => (
                <div
                  key={architect._id}
                  className={`architect-card-compact ${
                    selectedArchitectId === architect._id ? "selected" : ""
                  }`}
                  onClick={() => handleCardClick(architect._id)}
                >
                  <button
                    type="button"
                    className={`favorite-star-btn favorite-star-btn-compact ${favoriteArchitectIds.includes(architect._id) ? "active" : ""}`}
                    onClick={(event) =>
                      handleToggleFavorite(event, architect._id)
                    }
                    aria-label={
                      favoriteArchitectIds.includes(architect._id)
                        ? "Remove from favorites"
                        : "Add to favorites"
                    }
                  >
                    <i className="fas fa-star"></i>
                  </button>
                  <img
                    src={
                      architect.profileImage ||
                      "https://t4.ftcdn.net/jpg/03/64/21/11/360_F_364211147_1qgLVxv1Tcq0Ohz3FawUfrtONzz8nq3e.jpg"
                    }
                    alt={architect.name}
                    className="architect-avatar-compact"
                  />
                  <div className="architect-info-compact">
                    <h3 className="architect-name-compact">{architect.name}</h3>
                    <p className="architect-title-compact">
                      {architect.professionalTitle || "Architect"}
                    </p>
                    <div className="architect-meta-compact">
                      <span className="meta-item-compact">
                        <i className="fas fa-briefcase"></i>
                        {architect.experience}y
                      </span>
                      <span className="meta-item-compact">
                        <i className="fas fa-star"></i>
                        {architect.rating || 0}
                      </span>
                    </div>
                  </div>
                  {architect.certifications &&
                    architect.certifications.length > 0 && (
                      <div className="compact-badge">
                        <i className="fas fa-certificate"></i>
                      </div>
                    )}
                </div>
              ))}
            </div>

            <div className="architect-details-section">
              {selectedArchitect && (
                <div className="architect-details-expanded">
                  <div className="architect-profile-header">
                    <img
                      src={
                        selectedArchitect.profileImage ||
                        "https://t4.ftcdn.net/jpg/03/64/21/11/360_F_364211147_1qgLVxv1Tcq0Ohz3FawUfrtONzz8nq3e.jpg"
                      }
                      alt={selectedArchitect.name}
                      className="architect-profile-image"
                    />
                    <div className="architect-profile-info">
                      <h2 className="architect-profile-name">
                        {selectedArchitect.name}
                      </h2>
                      <p className="architect-profile-role">
                        {selectedArchitect.professionalTitle || "Architect"}
                      </p>
                      <div className="architect-profile-meta">
                        <span className="profile-meta-item">
                          <i className="fas fa-briefcase"></i>
                          <strong>{selectedArchitect.experience}</strong> years
                          experience
                        </span>
                        <span className="profile-meta-item">
                          <div className="rating-stars">
                            {[...Array(5)].map((_, index) => (
                              <i
                                key={index}
                                className={`fas fa-star ${
                                  index <
                                  Math.floor(selectedArchitect.rating || 0)
                                    ? "filled"
                                    : index < (selectedArchitect.rating || 0)
                                      ? "half-filled"
                                      : "empty"
                                }`}
                              ></i>
                            ))}
                          </div>
                          <strong className="rating-number">
                            {selectedArchitect.rating || 0}
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
                      {selectedArchitect.about || "Information not available"}
                    </p>
                  </div>

                  <div className="detail-section">
                    <h3 className="section-title">
                      <i className="fas fa-address-card"></i>
                      Contact Information
                    </h3>
                    <div className="contact-info-grid">
                      {selectedArchitect.phoneNumber && (
                        <div className="contact-item">
                          <i className="fas fa-phone"></i>
                          <span>{selectedArchitect.phoneNumber}</span>
                        </div>
                      )}
                      {selectedArchitect.email && (
                        <div className="contact-item">
                          <i className="fas fa-envelope"></i>
                          <span>{selectedArchitect.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedArchitect.skills &&
                    selectedArchitect.skills.length > 0 && (
                      <div className="detail-section">
                        <h3 className="section-title">
                          <i className="fas fa-tools"></i>
                          Skills & Expertise
                        </h3>
                        <div className="skills-grid">
                          {selectedArchitect.skills.map((skill, idx) => (
                            <span key={idx} className="skill-badge">
                              <i className="fas fa-check"></i>
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  {selectedArchitect.certifications &&
                    selectedArchitect.certifications.length > 0 && (
                      <div className="detail-section">
                        <h3 className="section-title">
                          <i className="fas fa-certificate"></i>
                          Certifications & Licenses
                        </h3>
                        <div className="certifications-list">
                          {selectedArchitect.certifications.map((cert, idx) => (
                            <div key={idx} className="certification-item">
                              <i className="fas fa-award"></i>
                              <span>{cert}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {selectedArchitect.specialties &&
                    selectedArchitect.specialties.length > 0 && (
                      <div className="detail-section">
                        <h3 className="section-title">
                          <i className="fas fa-star"></i>
                          Specializations
                        </h3>
                        <div className="specialties-grid">
                          {selectedArchitect.specialties.map(
                            (specialty, idx) => (
                              <span key={idx} className="specialty-badge">
                                {specialty}
                              </span>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                  {selectedArchitect.languages &&
                    selectedArchitect.languages.length > 0 && (
                      <div className="detail-section">
                        <h3 className="section-title">
                          <i className="fas fa-language"></i>
                          Languages
                        </h3>
                        <p>{selectedArchitect.languages.join(", ")}</p>
                      </div>
                    )}

                  {selectedArchitect.expectedPrice && (
                    <div className="detail-section price-section">
                      <h3 className="section-title">
                        <i className="fas fa-tag"></i>
                        Expected Price Range
                      </h3>
                      <div className="price-display">
                        <i className="fas fa-rupee-sign"></i>
                        <span>{selectedArchitect.expectedPrice}</span>
                      </div>
                    </div>
                  )}

                  {selectedArchitect.previousCompanies &&
                    selectedArchitect.previousCompanies.length > 0 && (
                      <div className="detail-section">
                        <h3 className="section-title">
                          <i className="fas fa-briefcase"></i>
                          Work Experience
                        </h3>
                        <div className="experience-timeline">
                          {selectedArchitect.previousCompanies.map(
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

                  {selectedArchitect.projects &&
                    selectedArchitect.projects.length > 0 && (
                      <div className="detail-section">
                        <h3 className="section-title">
                          <i className="fas fa-project-diagram"></i>
                          Notable Projects
                        </h3>
                        <div className="projects-grid">
                          {selectedArchitect.projects.map((project, idx) => (
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

                  {selectedArchitect.reviews &&
                    selectedArchitect.reviews.length > 0 && (
                      <div className="detail-section">
                        <h3 className="section-title">
                          <i className="fas fa-star"></i>
                          Customer Reviews ({selectedArchitect.reviews.length})
                        </h3>
                        <div className="reviews-grid">
                          {selectedArchitect.reviews
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
                      onClick={() => handleBookSubmit(selectedArchitect._id)}
                    >
                      <i className="fas fa-calendar-check"></i>
                      Book Consultation with {selectedArchitect.name}
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

export default CustomerArchitect;
