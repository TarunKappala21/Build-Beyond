import React from "react";
import EmployeeCard from "./EmployeeCard";

const EmployeesGrid = ({ employees }) => (
  <div className="comEmp_grid">
    {employees.map((e) => (
      <EmployeeCard key={e._id} employee={e} />
    ))}
  </div>
);

export default EmployeesGrid;