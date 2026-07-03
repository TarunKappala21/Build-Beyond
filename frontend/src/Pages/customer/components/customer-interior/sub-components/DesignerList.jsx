// src/Pages/customer/components/customer-interior/sub-components/DesignerList.jsx
import React from "react";

const DesignerList = ({
  leftSectionRef,
  searchTerm,
  handleSearchChange,
  filteredDesigners,
  selectedDesignerId,
  handleCardClick,
}) => {
  return (
    <div className="interior-left-section" ref={leftSectionRef}>
      <div className="interior-search-box" style={{ position: "relative" }}>
        <input
          type="text"
          placeholder="Search interior designers..."
          id="designerSearch"
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>

      {filteredDesigners.length > 0 ? (
        filteredDesigners.map((designer) => (
          <div
            key={designer._id}
            className={`interior-designer-card ${
              selectedDesignerId === designer._id ? "active" : ""
            }`}
            data-id={designer._id}
            onClick={() => handleCardClick(designer._id)}
          >
            <img
              src={
                designer.profileImage ||
                "https://t4.ftcdn.net/jpg/03/64/21/11/360_F_364211147_1qgLVxv1Tcq0Ohz3FawUfrtONzz8nq3e.jpg"
              }
              alt={designer.name}
              className="interior-designer-image-small"
            />
            <div className="interior-designer-info">
              <h3>{designer.name}</h3>
              <p>{designer.professionalTitle || "Interior Designer"}</p>
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
                  ({designer.rating})
                </span>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="interior-no-designers">
          <p>No interior designers are currently available.</p>
        </div>
      )}
    </div>
  );
};

export default DesignerList;
