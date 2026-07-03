import React from "react";
import { Link } from "react-router-dom";
import "./CustomerFooter.css";

const CustomerFooter = () => {
  return (
    <footer className="cf-footer">
      <div className="cf-footer-container">
        <div className="cf-footer-about">
          <Link to="/home" className="cf-footer-logo">
            BUILD & BEYOND
          </Link>
          <p>
            Build & Beyond Architects is a leading firm dedicated to creating
            innovative, sustainable designs that transform communities. With
            over 20 years of experience, we deliver award-winning projects
            worldwide.
          </p>
          <div className="cf-footer-social">
            <a href="#" aria-label="Facebook">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
              </svg>
            </a>
            <a href="#" aria-label="Twitter">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
              </svg>
            </a>
            <a href="#" aria-label="Instagram">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
            <a href="#" aria-label="LinkedIn">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                <rect x="2" y="9" width="4" height="12"></rect>
                <circle cx="4" cy="4" r="2"></circle>
              </svg>
            </a>
          </div>
        </div>

        <div className="cf-footer-column">
          <h3>Quick Links</h3>
          <ul>
            <li>
              <Link to="/customerdashboard/home">Home</Link>
            </li>
            <li>
              <Link to="/customerdashboard/construction_companies_list">
                Construction
              </Link>
            </li>
            <li>
              <Link to="/customerdashboard/architect">Architect</Link>
            </li>
            <li>
              <Link to="/customerdashboard/interior_designer">
                Interior Designer
              </Link>
            </li>
            <li>
              <Link to="/customerdashboard/ongoing_projects">
                Ongoing Projects
              </Link>
            </li>
            <li>
              <Link to="/customerdashboard/bidspace">Bidspace</Link>
            </li>
            <li>
              <Link to="/customerdashboard/job_status">Job Status</Link>
            </li>
          </ul>
        </div>

        <div className="cf-footer-column">
          <h3>Services</h3>
          <ul>
            <li>Residential Architecture</li>
            <li>Commercial Architecture</li>
            <li>Urban Planning</li>
            <li>Interior Design</li>
            <li>Historic Preservation</li>
            <li>Sustainable Design</li>
          </ul>
        </div>

        <div className="cf-footer-column cf-footer-contact">
          <h3>Contact Us</h3>
          <p>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            Avenue Road, Meerut
          </p>
          <p>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
            +91 6281891325
          </p>
          <p>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            info@buildbeyond.com
          </p>
        </div>
      </div>

      <div className="cf-footer-bottom">
        <p>© 2025 Build & Beyond Architects. All Rights Reserved.</p>
      </div>
    </footer>
  );
};

export default CustomerFooter;
