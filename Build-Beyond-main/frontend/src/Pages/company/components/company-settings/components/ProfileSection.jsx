import React, { useState } from "react";
import WorkerProfileDisplay from "./WorkerProfileDisplay";
import WorkerProfileForm from "./WorkerProfileForm";
import CustomerProfileDisplay from "./CustomerProfileDisplay";
import CustomerProfileForm from "./CustomerProfileForm";

export default function ProfileSection({
  company,
  workerForm,
  customerForm,
  editingWorker,
  editingCustomer,
  onWorkerFormChange,
  onCustomerFormChange,
  onWorkerSubmit,
  onCustomerSubmit,
  onEditWorker,
  onEditCustomer,
  onCancelWorker,
  onCancelCustomer,
  onAddOpening,
  onUpdateOpening,
  onRemoveOpening,
  onAddProject,
  onUpdateProject,
  onRemoveProject,
  onBeforeImageChange,
  onAfterImageChange,
  onCertificateChange
}) {
  const [activeProfileTab, setActiveProfileTab] = useState("worker");

  return (
    <section className="cs-section cs-active">
      <div className="cs-profile-tabs">
        <button
          className={`cs-profile-tab ${activeProfileTab === "worker" ? "active" : ""}`}
          onClick={() => setActiveProfileTab("worker")}
        >
          Worker Profile
        </button>
        <button
          className={`cs-profile-tab ${activeProfileTab === "customer" ? "active" : ""}`}
          onClick={() => setActiveProfileTab("customer")}
        >
          Customer Profile
        </button>
      </div>

      {/* WORKER PROFILE */}
      <div
        className={`cs-profile-content ${
          activeProfileTab === "worker" ? "cs-visible" : ""
        }`}
      >
        {!editingWorker ? (
          <WorkerProfileDisplay company={company} onEdit={onEditWorker} />
        ) : (
          <WorkerProfileForm
            workerForm={workerForm}
            onFormChange={onWorkerFormChange}
            onSubmit={onWorkerSubmit}
            onCancel={onCancelWorker}
            onAddOpening={onAddOpening}
            onUpdateOpening={onUpdateOpening}
            onRemoveOpening={onRemoveOpening}
          />
        )}
      </div>

      {/* CUSTOMER PROFILE */}
      <div
        className={`cs-profile-content ${
          activeProfileTab === "customer" ? "cs-visible" : ""
        }`}
      >
        {!editingCustomer ? (
          <CustomerProfileDisplay company={company} onEdit={onEditCustomer} />
        ) : (
          <CustomerProfileForm
            customerForm={customerForm}
            onFormChange={onCustomerFormChange}
            onSubmit={onCustomerSubmit}
            onCancel={onCancelCustomer}
            onAddProject={onAddProject}
            onUpdateProject={onUpdateProject}
            onRemoveProject={onRemoveProject}
            onBeforeImageChange={onBeforeImageChange}
            onAfterImageChange={onAfterImageChange}
            onCertificateChange={onCertificateChange}
          />
        )}
      </div>
    </section>
  );
}
