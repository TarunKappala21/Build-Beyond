import React from "react";

const WorkerCard = ({ worker, onView, onHire }) => {
  return (
    <div className="comhiring_workerCard" key={worker._id || worker.id}>
      <div className="comhiring_cardHeader">
        <img
          className="comhiring_profileImg"
          src={worker.profileImage || `https://api.dicebear.com/9.x/male/svg?seed=${encodeURIComponent((worker.name||'worker').replace(/\s+/g,''))}`}
          alt="profile"
        />
        <div className="comhiring_rating"><i className="fas fa-star" /> {worker.rating ?? 0}</div>
      </div>
      <div className="comhiring_cardBody">
        <h3 className="comhiring_workerName">{worker.name}</h3>
        <p className="comhiring_workerMeta"><i className="fas fa-envelope" /> {worker.email}</p>
        <p className="comhiring_workerMeta"><i className="fas fa-briefcase" /> {worker.experience} experience</p>
        <div className="comhiring_tags">
          {(worker.specialties || []).map((s, i) => (
            <span key={i} className="comhiring_tag">{s}</span>
          ))}
        </div>
      </div>
      <div className="comhiring_cardFooter">
        <button className="comhiring_btnView" onClick={() => onView(worker)}><i className="fas fa-eye" /> View Profile</button>
        <button className="comhiring_btnHire" onClick={() => onHire(worker)}><i className="fas fa-user-plus" /> Hire</button>
      </div>
    </div>
  );
};

export default WorkerCard;
