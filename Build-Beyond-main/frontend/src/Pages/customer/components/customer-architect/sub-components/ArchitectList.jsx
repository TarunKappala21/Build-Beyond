// src/Pages/customer/components/customer-architect/sub-components/ArchitectList.jsx
import React from "react";

const ArchitectList = ({
  leftSectionRef,
  searchTerm,
  handleSearchChange,
  filteredArchitects,
  selectedArchitectId,
  handleCardClick,
}) => {
  return (
    <div className="ca-left-section" ref={leftSectionRef}>
      <div className="ca-search-box">
        <input
          type="text"
          placeholder="Search architects..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>

      {filteredArchitects.length > 0 ? (
        filteredArchitects.map((architect) => (
          <div
            key={architect._id}
            className={`ca-architect-card ${
              selectedArchitectId === architect._id ? "ca-active" : ""
            }`}
            onClick={() => handleCardClick(architect._id)}
          >
            <img
              src={
                architect.profileImage ||
                "https://t4.ftcdn.net/jpg/03/64/21/11/360_F_364211147_1qgLVxv1Tcq0Ohz3FawUfrtONzz8nq3e.jpg"
              }
              alt={architect.name}
              className="ca-architect-image-small"
            />
            <div className="ca-architect-info">
              <h3>{architect.name}</h3>
              <p>{architect.professionalTitle || "Architect"}</p>
              <p>
                <i className="fas fa-briefcase"></i> {architect.experience}{" "}
                years experience
              </p>
              <div className="ca-rating">
                {[...Array(Math.floor(architect.rating))].map((_, i) => (
                  <span key={i} className="ca-star">
                    ★
                  </span>
                ))}
                {architect.rating % 1 >= 0.5 && (
                  <span className="ca-star">½</span>
                )}
                <span className="ca-rating-count">({architect.rating})</span>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="ca-no-architects">
          <p>No architects found matching your search.</p>
        </div>
      )}
    </div>
  );
};

export default ArchitectList;
