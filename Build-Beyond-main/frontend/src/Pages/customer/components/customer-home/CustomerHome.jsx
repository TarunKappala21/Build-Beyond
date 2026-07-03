// src/Pages/customer/components/customer-home/CustomerHome.jsx
import { useRef } from "react";
import TopSections from "./sub-components/TopSections";
import MiddleSections from "./sub-components/MiddleSections";
import BottomSections from "./sub-components/BottomSections";
import CustomerHomeScripts from "./sub-components/CustomerHomeScripts";
import "./CustomerHome.css";

const CustomerHome = () => {
  const modalRef = useRef(null);

  const openModal = (imgSrc) => {
    if (modalRef.current) {
      modalRef.current.querySelector("img").src = imgSrc;
      modalRef.current.style.display = "flex";
    }
  };

  const closeModal = () => {
    if (modalRef.current) modalRef.current.style.display = "none";
  };

  return (
    <div className="customer_home">
      {/* Back to Top */}
      <a href="#" className="back_to_top">
        <i className="fas fa-arrow-up"></i>
      </a>

      {/* Modal */}
      <div ref={modalRef} className="modal" onClick={closeModal}>
        <span className="close_modal" onClick={closeModal}>
          times
        </span>
        <div className="modal_content">
          <img src="null" alt="Portfolio" />
        </div>
      </div>

      <TopSections />
      <MiddleSections openModal={openModal} />
      <BottomSections />

      {/* Scripts */}
      <CustomerHomeScripts />
    </div>
  );
};

export default CustomerHome;
