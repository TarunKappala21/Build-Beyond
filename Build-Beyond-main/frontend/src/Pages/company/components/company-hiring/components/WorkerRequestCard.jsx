import React from "react";
import DetailsToggle from "./DetailsToggle";

const WorkerRequestCard = ({ request, onView, onAccept, onReject }) => {
  const worker = request.workerId || {};
  return (
    <div className="comhiring_requestCard" key={request._id}>
      {request.expectedSalary && (
        <div className="comhiring_expectedSalary">
          <div className="comhiring_salaryLabel"><i className="fas fa-money-bill-wave" /> Expected Salary</div>
          <div className="comhiring_salaryAmount">₹{Number(request.expectedSalary).toLocaleString('en-IN')}/month</div>
        </div>
      )}
      <div className="comhiring_requestBody">
        <img className="comhiring_requestProfile" src={worker.profileImage || "https://via.placeholder.com/80x60"} alt="profile" />
        <div className="comhiring_requestInfo">
          <h3>{worker.name}</h3>
          <div className="comhiring_requestDetailsGrid">
            <div><span className="comhiring_label"><i className="fas fa-envelope" /> Email:</span> <div className="comhiring_value">{worker.email}</div></div>
            <div><span className="comhiring_label"><i className="fas fa-user-tie" /> Role:</span> <div className="comhiring_value">{request.positionApplying}</div></div>
            <div><span className="comhiring_label"><i className="fas fa-map-marker-alt" /> Location:</span> <div className="comhiring_value">{request.location}</div></div>
            <div><span className="comhiring_label"><i className="fas fa-tools" /> Specialties:</span> <div className="comhiring_value">{(worker.specialties || []).join(", ")}</div></div>
            <div><span className="comhiring_label"><i className="fas fa-briefcase" /> Experience:</span> <div className="comhiring_value">{worker.experience}</div></div>
          </div>
        </div>
      </div>
      <div className="comhiring_requestActions">
        <button className="comhiring_btnView" onClick={() => onView(worker)}><i className="fas fa-eye" /> View Profile</button>
        <button className="comhiring_btnAccept" onClick={() => onAccept(request._id)}><i className="fas fa-check" /> Accept</button>
        <button className="comhiring_btnReject" onClick={() => onReject(request._id)}><i className="fas fa-times" /> Reject</button>
        <DetailsToggle request={request} />
      </div>
    </div>
  );
};

export default WorkerRequestCard;
