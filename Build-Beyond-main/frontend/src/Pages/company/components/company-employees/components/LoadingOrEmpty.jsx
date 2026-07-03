import React from "react";

const LoadingOrEmpty = ({ loading, employeesLength }) => {
  if (loading) return <p className="comEmp_noEmployees">Loading...</p>;
  if (!loading && employeesLength === 0)
    return <p className="comEmp_noEmployees">You have no employees yet.</p>;
  return null;
};

export default LoadingOrEmpty;