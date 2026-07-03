import React from "react";

const RequestedWorkersTable = ({ items }) => {
  return (
    <div className="comhiring_tableWrap">
      <table className="comhiring_table">
        <thead>
          <tr>
            <th><i className="fas fa-user" /> Worker Name</th>
            <th><i className="fas fa-envelope" /> Email</th>
            <th><i className="fas fa-briefcase" /> Position</th>
            <th><i className="fas fa-map-marker-alt" /> Location</th>
            <th><i className="fas fa-rupee-sign" /> Expected Salary</th>
            <th><i className="fas fa-info-circle" /> Status</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr><td colSpan="6" className="comhiring_info">No requested workers found.</td></tr>
          )}
          {items.map(r => (
            <tr key={r._id}>
              <td>{r.worker?.name}</td>
              <td>{r.worker?.email}</td>
              <td>{r.positionApplying}</td>
              <td>{r.location}</td>
              <td>₹{Number(r.expectedSalary || 0).toLocaleString('en-IN')}</td>
              <td><span className={`comhiring_status comhiring_status_${(r.status || "").toLowerCase()}`}>{r.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RequestedWorkersTable;
