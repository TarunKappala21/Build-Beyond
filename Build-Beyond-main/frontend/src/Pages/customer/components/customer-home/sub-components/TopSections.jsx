// src/Pages/customer/components/customer-home/sub-components/TopSections.jsx
import './TopSections.css'

const TopSections = () => {
  return (
    <>
      {/* Hero */}
      <section className="hero_section">
        <div className="hero_content">
          <h1>Build Your Dreams with Precision</h1>
          <p>
            India's premier tech-powered construction company, delivering
            innovative and sustainable solutions for your dream home or
            commercial space.
          </p>
          <a href="#services" className="cta_btn">
            Explore Services
          </a>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="services_section">
        <div className="section_heading">
          <h2>Our Services</h2>
          <div className="underline"></div>
        </div>
        <div className="services_tagline">
          <p>
            From concept to completion, Build & Beyond offers comprehensive,
            tech-driven construction and design services tailored to your
            vision.
          </p>
        </div>
        <div className="services_container">
          {[
            {
              icon: "home",
              title: "Residential Construction",
              desc: "Transform your vision into reality with our expert residential construction services.",
              link: "/customerdashboard/construction_companies_list",
            },
            {
              icon: "building",
              title: "Commercial Construction",
              desc: "Build modern, functional commercial spaces with our expert team.",
              link: "/customerdashboard/construction_companies_list",
            },
            {
              icon: "clipboard",
              title: "Project Management",
              desc: "Seamless project execution with our experienced management team.",
              link: "/customerdashboard/construction_companies_list",
            },
            {
              icon: "layers",
              title: "Architecture & Structure",
              desc: "Innovative designs crafted by our in-house architects.",
              link: "/customerdashboard/construction_companies_list",
            },
          ].map((s, i) => (
            <div key={i} className="service_card" style={{ "--order": i + 1 }}>
              <div className="service_icon">
                <img
                  src={`data:image/svg+xml;base64,${getSvg(s.icon)}`}
                  alt={s.title}
                />
              </div>
              <h3 className="service_title">{s.title}</h3>
              <div className="service_description">
                <p>{s.desc}</p>
              </div>
              <a href={s.link} className="book_now_btn">
                Book Now
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Our Values – Now visible on scroll */}
      <section className="values_section">
        <div className="section_heading">
          <h2>Our Values</h2>
          <div className="underline"></div>
        </div>
        <div className="values_container">
          {[
            {
              icon: "fa-medal",
              title: "100% Commitment to Quality",
              desc: "We never compromise on quality, using only the best materials and practices to ensure your construction stands the test of time.",
            },
            {
              icon: "fa-headset",
              title: "24/7 Customer Support",
              desc: "Our dedicated support team is always available to address your concerns and ensure a smooth construction journey.",
            },
            {
              icon: "fa-tag",
              title: "Affordable & Transparent Pricing",
              desc: "No hidden costs or surprises. We provide detailed quotes and maintain complete transparency throughout the process.",
            },
            {
              icon: "fa-leaf",
              title: "Eco-Friendly Practices",
              desc: "We prioritize sustainable building practices and materials to minimize environmental impact and create healthier spaces.",
            },
          ].map((v, i) => (
            <div key={i} className="value_item">
              <div className="value_icon">
                <i className={`fas ${v.icon}`}></i>
              </div>
              <h3 className="value_title">{v.title}</h3>
              <p className="value_description">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

const getSvg = (icon) => {
  const svgs = {
    home: "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRjlCMjA4IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgY2xhc3M9ImZlYXRoZXIgZmVhdGhlci1ob21lIj48cGF0aCBkPSJNMyA5bDktNyA5IDd2MTFhMiAyIDAgMCAxLTIgMkg1YTIgMiAwIDAgMS0yLTJ6Ij48L3BhdGg+PHBvbHlsaW5lIHBvaW50cz0iOSAyMiA5IDEyIDE1IDEyIDE1IDIyIj48L3BvbHlsaW5lPjwvc3ZnPg==",
    building:
      "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRjlCMjA4IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgY2xhc3M9ImZlYXRoZXIgZmVhdGhlci1idWlsZGluZyI+PHJlY3QgeD0iNCIgeT0iMiIgd2lkdGg9IjE2IiBoZWlnaHQ9IjIwIiByeD0iMiIgcnk9IjIiPjwvcmVjdD48bGluZSB4MT0iOSIgeTE9IjYiIHgyPSI5LjAxIiB5Mj0iNiI+PC9saW5lPjxsaW5lIHgxPSIxNSIgeTE9IjYiIHgyPSIxNS4wMSIgeTI9IjYiPjwvbGluZT48bGluZSB4MT0iOSIgeTE9IjEwIiB4Mj0iOS4wMSIgeTI9IjEwIj48L2xpbmU+PGxpbmUgeDE9IjE1IiB5MT0iMTAiIHgyPSIxNS4wMSIgeTI9IjEwIj48L2xpbmU+PGxpbmUgeDE9IjkiIHkxPSIxNCIgeDI9IjkuMDEiIHkyPSIxNCI+PC9saW5lPjxsaW5lIHgxPSIxNSIgeTE9IjE0IiB4Mj0iMTUuMDEiIHkyPSIxNCI+PC9saW5lPjwvc3ZnPg==",
    clipboard:
      "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRjlCMjA4IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgY2xhc3M9ImZlYXRoZXIgZmVhdGhlci1jbGlwYm9hcmQiPjxwYXRoIGQ9Ik0xNiAydjRoNFYyaC00eiI+PC9wYXRoPjxwYXRoIGQ9Ik0yMSAxNFY4aC00VjRINnYxNmgxNXoiPjwvcGF0aD48cGF0aCBkPSJNOSA4aDRNOSAxMmg0TTkgMTZoNCIgLz48L3N2Zz4=",
    layers:
      "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRjlCMjA4IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgY2xhc3M9ImZlYXRoZXIgZmVhdGhlci1sYXllcnMiPjxwb2x5Z29uIHBvaW50cz0iMTIgMiAyIDcgMTIgMTIgMjIgNyAxMiAyIj48L3BvbHlnb24+PHBvbHlsaW5lIHBvaW50cz0iMiAxNyAxMiAyMiAyMiAxNyI+PC9wb2x5bGluZT48cG9seWxpbmUgcG9pbnRzPSIyIDEyIDEyIDE3IDIyIDEyIj48L3BvbHlsaW5lPjwvc3ZnPg==",
  };
  return svgs[icon];
};

export default TopSections;
