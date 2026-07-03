import React from "react";

const ValidationSummary = ({ errors }) => (
  <div className="validation-summary" style={{ display: "block" }}>
    <p>Please correct the following errors:</p>
    <ul>
      {errors.map((err, i) => (
        <li key={i}>{err}</li>
      ))}
    </ul>
  </div>
);

export default ValidationSummary;
