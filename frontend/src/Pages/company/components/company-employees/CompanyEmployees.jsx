import React, { useEffect, useState } from "react";
import "./CompanyEmployees.css";
import EmployeesHeader from "./components/EmployeesHeader";
import EmployeesGrid from "./components/EmployeesGrid";
import LoadingOrEmpty from "./components/LoadingOrEmpty";
import API_BASE from "../../../../api/backendBase";


const CompanyEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/my-employees`, {
      method: "GET",
      credentials: "include"
    })
      .then((res) => res.json())
      .then((data) => {
        setEmployees(data.employees || []);
      })
      .catch((err) => console.error("Employees API error:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="comEmp_container">
      <EmployeesHeader />
      <LoadingOrEmpty loading={loading} employeesLength={employees.length} />
      {!loading && employees.length > 0 && <EmployeesGrid employees={employees} />}
    </div>
  );
};

export default CompanyEmployees;
