import React from "react";

const FormButtons = ({ loading, navigate }) => (
  <div className="btn-container">
    <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? "Saving..." : "Save Project"}</button>
    <button type="button" className="btn btn-secondary" onClick={() => navigate("companyongoing_projects")}>Cancel</button>
  </div>
);

export default FormButtons;
