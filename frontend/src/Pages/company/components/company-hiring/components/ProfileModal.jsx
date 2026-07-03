import React from "react";

const ProfileModal = ({ worker, onClose, onHire }) => {
  if (!worker) return null;
  return (
    <div className="comhiring_modalBackdrop" onClick={onClose}>
      <div className="comhiring_modal" onClick={(e) => e.stopPropagation()}>
        <button className="comhiring_modalClose" onClick={onClose}>×</button>
        <div className="comhiring_modalHeader">
          <img
            src={worker.profileImage || `https://api.dicebear.com/9.x/male/svg?seed=${encodeURIComponent((worker.name||'worker').replace(/\s+/g,''))}`}
            alt="profile"
            className="comhiring_modalProfileImg"
          />
          <div>
            <h2>{worker.name}</h2>
            <p className="comhiring_modalTitle">{worker.title || ""}</p>
            <div className="comhiring_modalRating">
              {[...Array(5)].map((_,i)=>(<i key={i} className={i < Math.round(worker.rating || 0) ? "fas fa-star" : "far fa-star"} />))} <span>({worker.rating ?? 0})</span>
            </div>
          </div>
        </div>
        <div className="comhiring_modalBody">
          <section>
            <h4><i className="fas fa-info-circle" /> About</h4>
            <p>{worker.about || "No information available."}</p>
          </section>
          <section>
            <h4><i className="fas fa-tools" /> Specialties</h4>
            <p>{(worker.specialties || []).join(", ")}</p>
          </section>
          <section>
            <h4><i className="fas fa-briefcase" /> Notable Projects</h4>
            <div className="comhiring_projectsGrid">
              {(worker.projects && worker.projects.length > 0) ? worker.projects.map((p, idx) => (
                <div className="comhiring_project" key={idx}>
                  <img src={p.image || "https://via.placeholder.com/300x200"} alt={p.title || "project"} />
                  <div className="comhiring_projectInfo">
                    <h5>{p.title}</h5>
                    <p>{p.location}</p>
                    <p>{p.description}</p>
                  </div>
                </div>
              )) : <p>No notable projects available.</p>}
            </div>
          </section>
          <section style={{display: "none"}}>
            <h4><i className="fas fa-address-book" /> Contact</h4>
            <div><strong>Phone:</strong> {worker.contact || "N/A"}</div>
            <div><strong>Location:</strong> {worker.location || "N/A"}</div>
            <div><strong>LinkedIn:</strong> {worker.linkedin ? <a href={worker.linkedin} target="_blank" rel="noreferrer">{worker.linkedin}</a> : "N/A"}</div>
            <div><strong>Previous Work:</strong> {worker.previousWork || "N/A"}</div>
          </section>
        </div>
        <div className="comhiring_modalFooter">
          <button className="comhiring_btnHire" onClick={() => { onHire(worker); onClose(); }}><i className="fas fa-user-plus" /> Hire</button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
