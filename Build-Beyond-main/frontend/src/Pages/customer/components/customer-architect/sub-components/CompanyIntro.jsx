// src/Pages/customer/components/customer-architect/sub-components/CompanyIntro.jsx
import React from "react";

const CompanyIntro = () => {
  return (
    <div className="ca-initial-message">
      <div className="ca-company-info">
        <h2 className="ca-text-heading">
          Welcome to Build & Beyond Architects
        </h2>
        <p>
          Build & Beyond Architects is a leading architectural firm dedicated to
          creating innovative and sustainable designs that inspire and transform
          communities. With over 20 years of experience, our team of talented
          architects and designers has delivered award-winning projects across
          the globe.
        </p>
        <h3 className="ca-text-heading">Our Mission</h3>
        <p>
          Our mission is to design spaces that enhance the quality of life,
          promote sustainability, and reflect the unique identity of our
          clients. We believe in the power of architecture to shape the future
          and create lasting impact.
        </p>
        <h3 className="ca-text-heading">Our Services</h3>
        <ul>
          <li>Residential Architecture</li>
          <li>Commercial Architecture</li>
          <li>Urban Planning</li>
          <li>Interior Design</li>
          <li>Historic Preservation</li>
          <li>Sustainable Design</li>
        </ul>
      </div>
    </div>
  );
};

export default CompanyIntro;
