// src/pages/company/components/company-ongoing/components/FilterSidebar.jsx
import React from 'react';

const FilterSidebar = ({ filter, handleFilter }) => {
  return (
    <div className="ongoing-right-section">
      <div className="ongoing-filter-properties">
        <h2>Filter Projects</h2>
        <button
          className={`ongoing-filter-button ${filter === "all" ? "ongoing-active" : "ongoing-inactive"}`}
          onClick={() => handleFilter("all")}
        >
          All Projects
        </button>
        <button
          className={`ongoing-filter-button ${filter === "pending" ? "ongoing-active" : "ongoing-inactive"}`}
          onClick={() => handleFilter("pending")}
        >
          Pending Projects
        </button>
        <button
          className={`ongoing-filter-button ${filter === "finished" ? "ongoing-active" : "ongoing-inactive"}`}
          onClick={() => handleFilter("finished")}
        >
          Finished Projects
        </button>
      </div>
    </div>
  );
};

export default FilterSidebar;
