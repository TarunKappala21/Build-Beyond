import React, { useState } from "react";

const DetailsToggle = ({ request }) => {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen(v => !v);
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <button className={`comhiring_btnToggle ${open ? "open" : ""}`} onClick={toggle}>
        <i className={`fas ${open ? "fa-chevron-up" : "fa-chevron-down"}`}></i> {open ? "Hide Details" : "Details"}
      </button>
      {open && (
        <div className="comhiring_details">
          <div className="comhiring_detailItem"><strong>Full Name:</strong> {request.fullName}</div>
          <div className="comhiring_detailItem"><strong>Email:</strong> {request.email}</div>
          <div className="comhiring_detailItem"><strong>Experience:</strong> {request.experience} years</div>
          <div className="comhiring_detailItem"><strong>Primary Skills:</strong> {(request.primarySkills||[]).join(", ")}</div>
          <div className="comhiring_detailItem"><strong>Resume:</strong> {request.resume ? <a href={request.resume} target="_blank" rel="noreferrer">Download</a> : "N/A"}</div>
        </div>
      )}
    </div>
  );
};

export default DetailsToggle;
