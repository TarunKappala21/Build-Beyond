// CompanySettings.jsx
import React, { useEffect, useState, useRef } from "react";
import "./CompanySettings.css";
import SettingsSidebar from "./components/SettingsSidebar";
import ProfileSection from "./components/ProfileSection";
import SecuritySection from "./components/SecuritySection";
import HelpSection from "./components/HelpSection";
import API_BASE from "../../../../api/backendBase";


const API_GET = `${API_BASE}/api/companysettings`;
const API_POST_UPDATE = `${API_BASE}/api/update-company-profile`;

export default function CompanySettings() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [company, setCompany] = useState({
    workerProfile: {
      name: "",
      location: "",
      size: "",
      specializations: [],
      currentOpenings: [],
      about: "",
      whyJoin: ""
    },
    customerProfile: {
      name: "",
      location: "",
      projectsCompleted: 0,
      yearsInBusiness: 0,
      about: "",
      didYouKnow: "",
      completedProjects: []
    }
  });

  const [activeSection, setActiveSection] = useState("profile");

  // Edit mode toggles
  const [editingWorker, setEditingWorker] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(false);

  // Worker form state (controlled)
  const [workerForm, setWorkerForm] = useState({
    companyName: "",
    companyLocation: "",
    companySize: "",
    specializations: "",
    currentOpenings: [],
    aboutCompany: "",
    whyJoinUs: ""
  });

  // Customer form refs/controlled + file inputs
  const [customerForm, setCustomerForm] = useState({
    companyName: "",
    companyLocation: "",
    projectsCompleted: 0,
    yearsInBusiness: 0,
    customerAboutCompany: "",
    didYouKnow: "",
    // completedProjects will be array of objects with title, description, image, location, tenderId, materialCertificate, gpsLink
    completedProjects: []
  });
  // we will store file inputs in refs so we can append them to FormData conditionally
  const projectFileInputs = useRef([]);
  const certificateFileInputs = useRef([]);

  useEffect(() => {
    fetchCompany();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchCompany() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_GET, {
        credentials: "include"
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Failed to fetch settings. ${res.status} ${res.statusText} ${txt}`);
      }
      const payload = await res.json();
      if (!payload || !payload.company) {
        throw new Error("Invalid response shape (company missing).");
      }
      setCompany(payload.company);

      // populate forms from payload
      const w = payload.company.workerProfile || {};
      setWorkerForm({
        companyName: w.name || "",
        companyLocation: w.location || "",
        companySize: w.size || "",
        specializations: (w.specializations && w.specializations.join(", ")) || "",
        currentOpenings: w.currentOpenings ? [...w.currentOpenings] : [],
        aboutCompany: w.about || "",
        whyJoinUs: w.whyJoin || ""
      });

      const c = payload.company.customerProfile || {};
      setCustomerForm({
        companyName: c.name || "",
        companyLocation: c.location || "",
        projectsCompleted: c.projectsCompleted || 0,
        yearsInBusiness: c.yearsInBusiness || 0,
        customerAboutCompany: c.about || "",
        didYouKnow: c.didYouKnow || "",
        completedProjects: c.completedProjects && c.completedProjects.length ? c.completedProjects.map(p => ({ ...p })) : []
      });

      // reset file inputs refs
      projectFileInputs.current = c.completedProjects && c.completedProjects.length ? c.completedProjects.map(() => ({ before: null, after: null })) : [];
      certificateFileInputs.current = [];
    } catch (err) {
      console.error("Fetch error", err);
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  // Worker form handlers
  function handleWorkerChange(e) {
    const { name, value } = e.target;
    setWorkerForm(prev => ({ ...prev, [name]: value }));
  }

  function addOpening() {
    setWorkerForm(prev => ({ ...prev, currentOpenings: [...prev.currentOpenings, ""] }));
  }
  function updateOpening(idx, value) {
    setWorkerForm(prev => {
      const arr = [...prev.currentOpenings];
      arr[idx] = value;
      return { ...prev, currentOpenings: arr };
    });
  }
  function removeOpening(idx) {
    setWorkerForm(prev => {
      const arr = prev.currentOpenings.filter((_, i) => i !== idx);
      return { ...prev, currentOpenings: arr };
    });
  }

  async function submitWorkerProfile(e) {
    e.preventDefault();
    // basic validation
    if (!workerForm.companyLocation || workerForm.companyLocation.length < 2) {
      alert("Please enter a valid location.");
      return;
    }
    if (!workerForm.companySize) {
      alert("Please select a company size.");
      return;
    }

    try {
      const payload = {
        profileType: "worker",
        companyLocation: workerForm.companyLocation,
        companySize: workerForm.companySize,
        specializations: workerForm.specializations,
        aboutCompany: workerForm.aboutCompany,
        whyJoinUs: workerForm.whyJoinUs,
        currentOpenings: workerForm.currentOpenings
      };

      const res = await fetch(API_POST_UPDATE, {
        method: "POST",
        credentials: "include",
        headers: {
          // Do not set Content-Type because we are sending JSON here
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update worker profile.");

      // reload fresh data
      await fetchCompany();
      setEditingWorker(false);
      alert("Worker profile updated successfully.");
    } catch (err) {
      console.error("Worker update error:", err);
      alert("Error updating worker profile: " + (err.message || err));
    }
  }

  // Customer handlers (FormData because files may be included)
  function handleCustomerChange(e) {
    const { name, value } = e.target;
    setCustomerForm(prev => ({ ...prev, [name]: value }));
  }

  // completed project items management
  function addProject() {
    setCustomerForm(prev => ({ ...prev, completedProjects: [...prev.completedProjects, { title: "", description: "", beforeImage: "", afterImage: "", location: "", tenderId: "", materialCertificate: "", gpsLink: "" }] }));
    projectFileInputs.current.push({ before: null, after: null });
    certificateFileInputs.current.push(null);
  }
  function updateProject(idx, key, value) {
    setCustomerForm(prev => {
      const arr = prev.completedProjects.map((p, i) => (i === idx ? { ...p, [key]: value } : p));
      return { ...prev, completedProjects: arr };
    });
  }
  function removeProject(idx) {
    setCustomerForm(prev => {
      const arr = prev.completedProjects.filter((_, i) => i !== idx);
      projectFileInputs.current.splice(idx, 1);
      certificateFileInputs.current.splice(idx, 1);
      return { ...prev, completedProjects: arr };
    });
  }

  function handleBeforeImageChange(e, idx) {
    const file = e.target.files[0];
    if (!projectFileInputs.current[idx]) projectFileInputs.current[idx] = { before: null, after: null };
    projectFileInputs.current[idx].before = file || null;

    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        updateProject(idx, "beforeImage", reader.result);
      };
      reader.readAsDataURL(file);
    }
  }

  function handleAfterImageChange(e, idx) {
    const file = e.target.files[0];
    if (!projectFileInputs.current[idx]) projectFileInputs.current[idx] = { before: null, after: null };
    projectFileInputs.current[idx].after = file || null;

    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        updateProject(idx, "afterImage", reader.result);
      };
      reader.readAsDataURL(file);
    }
  }

  function handleCertificateFileChange(e, idx) {
    const file = e.target.files[0];
    certificateFileInputs.current[idx] = file || null;

    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        updateProject(idx, "materialCertificate", reader.result);
      };
      reader.readAsDataURL(file);
    }
  }

  async function submitCustomerProfile(e) {
    e.preventDefault();
    // Basic validations
    if (!customerForm.customerCompanyLocation && !customerForm.companyLocation) {
      // allow companyLocation field name difference
      // earlier set companyLocation vs customerCompanyLocation
    }

    // Build FormData
    const fd = new FormData();
    fd.append("profileType", "customer");
    fd.append("companyLocation", customerForm.companyLocation || "");
    fd.append("projectsCompleted", customerForm.projectsCompleted || 0);
    fd.append("yearsInBusiness", customerForm.yearsInBusiness || 0);
    fd.append("customerAboutCompany", customerForm.customerAboutCompany || "");
    fd.append("didYouKnow", customerForm.didYouKnow || "");

    // completedProjects - JSON + files (images and certificates)
    const projectsPayload = customerForm.completedProjects.map((p, i) => ({
      title: p.title || "",
      description: p.description || "",
      beforeImage: p.beforeImage || "",
      afterImage: p.afterImage || "",
      location: p.location || "",
      tenderId: p.tenderId || "",
      materialCertificate: p.materialCertificate || "",
      gpsLink: p.gpsLink || ""
    }));
    fd.append("completedProjects", JSON.stringify(projectsPayload));
    
    projectFileInputs.current.forEach((files, idx) => {
      if (files && files.before) {
        fd.append("projectBeforeImages", files.before, `project_before_${idx}.${files.before.name.split('.').pop()}`);
      }
      if (files && files.after) {
        fd.append("projectAfterImages", files.after, `project_after_${idx}.${files.after.name.split('.').pop()}`);
      }
    });
    
    certificateFileInputs.current.forEach((file, idx) => {
      if (file) {
        fd.append("certificateFiles", file, `certificate_${idx}.${file.name.split('.').pop()}`);
      }
    });

    try {
      const res = await fetch(API_POST_UPDATE, {
        method: "POST",
        credentials: "include",
        // DO NOT set Content-Type; browser will set multipart boundary
        body: fd
      });

      const contentType = res.headers.get("content-type") || "";
      if (!res.ok) {
        // try to parse json
        if (contentType.includes("application/json")) {
          const err = await res.json();
          throw new Error(err.message || "Failed to update customer profile");
        } else {
          const text = await res.text();
          throw new Error("Server returned error: " + text);
        }
      }

      // success
      await fetchCompany();
      setEditingCustomer(false);
      alert("Customer profile updated successfully.");
    } catch (err) {
      console.error("Customer update error:", err);
      alert("Error updating customer profile: " + (err.message || err));
    }
  }

  if (loading) {
    return <div className="cs-loading">Loading company settings...</div>;
  }

  if (error) {
    return (
      <div className="cs-error">
        <p>Error loading settings: {error}</p>
        <button className="cs-btn-primary" onClick={fetchCompany}>Retry</button>
      </div>
    );
  }

  return (
    <div className="cs-root">
      <div className="cs-inner">
        <header className="cs-header">
          <h1 className="cs-title">Company Settings</h1>
          <p className="cs-subtitle">Manage your company profile and settings</p>
        </header>

        <div className="cs-grid">
          <SettingsSidebar
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />

          <main className="cs-content">
            {/* PROFILE SECTION */}
            {activeSection === "profile" && (
              <ProfileSection
                company={company}
                workerForm={workerForm}
                customerForm={customerForm}
                editingWorker={editingWorker}
                editingCustomer={editingCustomer}
                onWorkerFormChange={handleWorkerChange}
                onCustomerFormChange={handleCustomerChange}
                onWorkerSubmit={submitWorkerProfile}
                onCustomerSubmit={submitCustomerProfile}
                onEditWorker={() => setEditingWorker(true)}
                onEditCustomer={() => setEditingCustomer(true)}
                onCancelWorker={() => {
                  setEditingWorker(false);
                  fetchCompany();
                }}
                onCancelCustomer={() => {
                  setEditingCustomer(false);
                  fetchCompany();
                }}
                onAddOpening={addOpening}
                onUpdateOpening={updateOpening}
                onRemoveOpening={removeOpening}
                onAddProject={addProject}
                onUpdateProject={updateProject}
                onRemoveProject={removeProject}
                onBeforeImageChange={handleBeforeImageChange}
                onAfterImageChange={handleAfterImageChange}
                onCertificateChange={handleCertificateFileChange}
              />
            )}

            {/* SECURITY SECTION */}
            {activeSection === "security" && <SecuritySection />}

            {/* HELP CENTER */}
            {activeSection === "help" && <HelpSection />}
          </main>
        </div>
      </div>
    </div>
  );
}
