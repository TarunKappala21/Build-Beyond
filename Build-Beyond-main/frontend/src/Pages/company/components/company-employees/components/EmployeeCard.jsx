import React from "react";
import { Link } from "react-router-dom";

const EmployeeCard = ({ employee }) => {
  const w = employee.worker;
  return (
    <div className="comEmp_card" key={employee._id}>
      <div className="comEmp_cardHeader">
        <img src={w.profileImage} alt="" className="comEmp_profileImg" />
        <div className="comEmp_headerInfo">
          <h3>{w.name}</h3>
          <p className="comEmp_title">{w.specialization || "Worker"}</p>
        </div>
      </div>
      <div className="comEmp_body">
        <div className="comEmp_detailItem"><i className="fas fa-envelope"></i><span>{w.email}</span></div>
        <div className="comEmp_detailItem"><i className="fas fa-phone"></i><span>{w.phone}</span></div>
        <div className="comEmp_detailItem"><i className="fas fa-tools"></i><span>{w.specialization}</span></div>
        <div className="comEmp_detailItem"><i className="fas fa-briefcase"></i><span>{w.experience || 0} years of experience</span></div>
        <div className="comEmp_detailItem"><i className="fas fa-calendar-check"></i><span className={`comEmp_availability ${w.availability}`}>{w.availability || "Available"}</span></div>
      </div>
      <div className="comEmp_footer">
        {employee.chatId ? (
          <Link to={`/companydashboard/chat/${employee.chatId}`} className="comEmp_btnChat">
            <i className="fas fa-comment-dots"></i> Chat Now
          </Link>
        ) : (
          <button className="comEmp_btnChat disabled">
            <i className="fas fa-comment-dots"></i> Chat Unavailable
          </button>
        )}
      </div>
    </div>
  );
};

export default EmployeeCard;