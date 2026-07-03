// src/Pages/customer/Customer.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "../../components/ProtectedRoute";

import CustomerNavbar from "./components/customer-navbar/CustomerNavbar";
import CustomerFooter from "./components/cutomer-footer/CustomerFooter";
import CustomerHome from "./components/customer-home/CustomerHome";
import CustomerConstruction from "./components/customer-construction/CustomerConstruction";
import CustomerArchitect from "./components/customer-architect/CustomerArchitect";
import CustomerInterior from "./components/customer-interior/CustomerInterior";
import CustomerOngoing from "./components/customer-ongoing/CustomerOngoing";
import CustomerBidspace from "./components/customer-bidspace/CustomerBidspace";
import CustomerJobStatus from "./components/customer-jobstatus/CustomerJobStatus";
import CustomerSettings from "./components/customer-settings/CustomerSettings";
import CustomerPaymentHistory from "./components/customer-payments/CustomerPaymentHistory";
import PaymentCheckout from "./components/customer-payments/PaymentCheckout";
import Chat from "../../components/Chat/Chat";

import ArchitectForm from "./components/Forms/ArchitectForm";
import InteriorDesignForm from "./components/Forms/InteriorDesignForm";
import ConstructionForm from "./components/Forms/ConstructionForm";
import BidForm from "./components/Forms/BidForm";

const Customer = () => {
  return (
    <>
      <CustomerNavbar />
      <div style={{ paddingTop: "70px" }}>
        <Routes>
          {/* THIS IS THE KEY: Wrap all sub-routes in path="*" */}
          <Route
            path="*"
            element={
              <Routes>
                <Route path="home" element={<CustomerHome />} />
                <Route
                  path="construction_companies_list"
                  element={<CustomerConstruction />}
                />
                <Route path="architect" element={<CustomerArchitect />} />
                <Route path="architect_form" element={<ArchitectForm />} />
                <Route
                  path="interior_designer"
                  element={<CustomerInterior />}
                />
                <Route
                  path="interiordesign_form"
                  element={<InteriorDesignForm />}
                />
                <Route path="ongoing_projects" element={<CustomerOngoing />} />
                <Route path="bidspace" element={<CustomerBidspace />} />
                <Route path="bidform" element={<BidForm />} />
                <Route path="job_status" element={<CustomerJobStatus />} />
                <Route path="customersettings" element={<CustomerSettings />} />
                <Route
                  path="payment-history"
                  element={<CustomerPaymentHistory />}
                />
                <Route
                  path="payment-checkout/:projectId"
                  element={<PaymentCheckout />}
                />
                <Route path="constructionform" element={<ConstructionForm />} />
                <Route
                  path="chat/:roomId"
                  element={<Chat userRole="customer" />}
                />
                <Route path="*" element={<CustomerHome />} />
              </Routes>
            }
          />
        </Routes>
      </div>
      <CustomerFooter />
    </>
  );
};

export default Customer;
