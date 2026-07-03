import React, { useEffect, useState, useMemo, useCallback } from "react";
import "./CompanyHiring.css";
import WorkerCard from "./components/WorkerCard";
import WorkerRequestCard from "./components/WorkerRequestCard";
import RequestedWorkersTable from "./components/RequestedWorkersTable";
import ProfileModal from "./components/ProfileModal";
import HireModal from "./components/HireModal";
import API_BASE from "../../../../api/backendBase";

function useDebounced(fn, wait = 300) {
  const timeoutRef = React.useRef(null);
  return useCallback((...args) => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => fn(...args), wait);
  }, [fn, wait]);
}

const CompanyHiring = () => {
  const [activeTab, setActiveTab] = useState("find-workers");
  const [workers, setWorkers] = useState([]);
  const [workerRequests, setWorkerRequests] = useState([]);
  const [requestedWorkers, setRequestedWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileModalWorker, setProfileModalWorker] = useState(null);
  const [hireModalOpen, setHireModalOpen] = useState(false);
  const [hireForm, setHireForm] = useState({
    position: "",
    location: "",
    salary: "",
    workerId: "",
    workerName: ""
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    fetch(`${API_BASE}/api/companyhiring`, {
      method: "GET",
      credentials: "include"
    })
      .then(async (res) => {
        const contentType = res.headers.get("content-type") || "";
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Request failed (${res.status}): ${text.substring(0, 200)}`);
        }
        if (!contentType.includes("application/json")) {
          const text = await res.text();
          throw new Error(`Expected JSON but got: ${text.substring(0, 200)}`);
        }
        return res.json();
      })
      .then((data) => {
        if (!mounted) return;
        setWorkers(Array.isArray(data.workers) ? data.workers : []);
        setWorkerRequests(Array.isArray(data.workerRequests) ? data.workerRequests : []);
        setRequestedWorkers(Array.isArray(data.requestedWorkers) ? data.requestedWorkers : []);
      })
      .catch((err) => {
        console.error("Hiring fetch error:", err);
        setError(err.message || "Failed to load data");
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const debouncedSearch = useDebounced((v) => setSearchTerm(v), 250);

  const filteredWorkers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return workers;
    return workers.filter(w => {
      const name = (w.name || "").toLowerCase();
      const email = (w.email || "").toLowerCase();
      const skills = (w.specialties || []).join(" ").toLowerCase();
      return name.includes(q) || email.includes(q) || skills.includes(q);
    });
  }, [workers, searchTerm]);

  const filteredWorkerRequests = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return workerRequests;
    return workerRequests.filter(r => {
      const name = (r.workerId?.name || "").toLowerCase();
      const role = (r.positionApplying || "").toLowerCase();
      const loc = (r.location || "").toLowerCase();
      return name.includes(q) || role.includes(q) || loc.includes(q);
    });
  }, [workerRequests, searchTerm]);

  const filteredRequestedWorkers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return requestedWorkers.filter(r => {
      const statusMatch = statusFilter === "all" || (r.status || "").toLowerCase() === statusFilter;
      if (!statusMatch) return false;
      if (!q) return true;
      const text = `${r.worker?.name || ""} ${r.worker?.email || ""} ${r.positionApplying || ""} ${r.location || ""}`.toLowerCase();
      return text.includes(q);
    });
  }, [requestedWorkers, searchTerm, statusFilter]);

  const openProfileModal = (data) => {
    setProfileModalWorker(data);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const closeProfileModal = () => setProfileModalWorker(null);

  const openHireModal = (worker) => {
    setHireForm({ position: "", location: "", salary: "", workerId: worker._id, workerName: worker.name });
    setHireModalOpen(true);
  };
  const closeHireModal = () => {
    setHireModalOpen(false);
    setHireForm({ position: "", location: "", salary: "", workerId: "", workerName: "" });
  };

  const submitHireRequest = async (e) => {
    e.preventDefault();
    const locationRegex = /^(?=.*[a-zA-Z])[a-zA-Z0-9\s,\.\-']{2,}$/;
    if (!hireForm.position || hireForm.position.trim().length < 2) { alert("Please enter a valid position title (min 2 characters)." ); return; }
    if (!hireForm.location || !locationRegex.test(hireForm.location)) { alert("Please enter a valid location (e.g., Guntur)." ); return; }
    const salaryVal = parseFloat(hireForm.salary);
    if (!hireForm.salary || isNaN(salaryVal) || salaryVal <= 0) { alert("Please enter a valid salary greater than 0." ); return; }
    if (!hireForm.workerId) { alert("Missing worker ID."); return; }
    try {
      const res = await fetch(`${API_BASE}/companytoworker`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position: hireForm.position.trim(), location: hireForm.location.trim(), salary: salaryVal, workerId: hireForm.workerId })
      });
      const contentType = res.headers.get("content-type") || "";
      const data = contentType.includes("application/json") ? await res.json() : null;
      if (!res.ok) { throw new Error(data?.error || data?.message || `Failed (${res.status})`); }
      alert(data?.message || "Hire request sent successfully.");
      closeHireModal();
    } catch (err) {
      console.error("Hire request error:", err);
      alert("Error: " + (err.message || "Failed to send request"));
    }
  };

  const updateRequestStatus = async (requestId, status) => {
    if (!requestId) return;
    if (!["accepted", "rejected"].includes(status)) return;
    if (!window.confirm(`Are you sure you want to ${status} this request?`)) return;
    try {
      const res = await fetch(`${API_BASE}/worker-request/${requestId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const contentType = res.headers.get("content-type") || "";
      const data = contentType.includes("application/json") ? await res.json() : null;
      if (!res.ok) { throw new Error(data?.error || `Failed (${res.status})`); }
      alert(data?.message || `Request ${status} successfully.`);
      setWorkerRequests(prev => prev.filter(r => String(r._id) !== String(requestId)));
    } catch (err) {
      console.error("Update request error:", err);
      alert("Error updating request: " + (err.message || ""));
    }
  };

  const handleHireFormChange = (field, value) => { setHireForm(f => ({ ...f, [field]: value })); };

  return (
    <div className="comhiring_container">
      <div className="comhiring_tabs">
        <div className={`comhiring_tab ${activeTab === "find-workers" ? "active" : ""}`} onClick={() => setActiveTab("find-workers")}>Find Workers</div>
        <div className={`comhiring_tab ${activeTab === "worker-requests" ? "active" : ""}`} onClick={() => setActiveTab("worker-requests")}>Worker Requests</div>
        <div className={`comhiring_tab ${activeTab === "requested-workers" ? "active" : ""}`} onClick={() => setActiveTab("requested-workers")}>Requested Workers</div>
      </div>

      <div className="comhiring_sectionHeader">
        <h2 className="comhiring_title">
          {activeTab === "find-workers" && "Available Workers"}
          {activeTab === "worker-requests" && "Pending Worker Requests"}
          {activeTab === "requested-workers" && "Requested Workers Status"}
        </h2>

        <div className="comhiring_controls">
          <input className="comhiring_search" placeholder={activeTab === "find-workers" ? "Search workers..." : activeTab === "worker-requests" ? "Search requests..." : "Search requested workers..."} onChange={(e) => debouncedSearch(e.target.value)} />
          {activeTab === "requested-workers" && (
            <select className="comhiring_select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="accepted">Accepted</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          )}
        </div>
      </div>

      {loading && <div className="comhiring_info">Loading...</div>}
      {error && <div className="comhiring_error">Error: {error}</div>}

      {activeTab === "find-workers" && !loading && (
        <div className="comhiring_workerGrid">
          {filteredWorkers.length === 0 && <div className="comhiring_info">No workers found.</div>}
          {filteredWorkers.map(worker => (
            <WorkerCard
              key={worker._id || worker.id || Math.random()}
              worker={worker}
              onView={openProfileModal}
              onHire={openHireModal}
            />
          ))}
        </div>
      )}

      {activeTab === "worker-requests" && !loading && (
        <div className="comhiring_requestList">
          {filteredWorkerRequests.length === 0 && <div className="comhiring_info">No worker requests at this time.</div>}
          {filteredWorkerRequests.map(req => (
            <WorkerRequestCard
              key={req._id}
              request={req}
              onView={openProfileModal}
              onAccept={(id) => updateRequestStatus(id, "accepted")}
              onReject={(id) => updateRequestStatus(id, "rejected")}
            />
          ))}
        </div>
      )}

      {activeTab === "requested-workers" && !loading && (
        <RequestedWorkersTable items={filteredRequestedWorkers} />
      )}

      {profileModalWorker && (
        <ProfileModal
          worker={profileModalWorker}
          onClose={closeProfileModal}
          onHire={openHireModal}
        />
      )}

      <HireModal
        open={hireModalOpen}
        form={hireForm}
        onChange={handleHireFormChange}
        onSubmit={submitHireRequest}
        onCancel={closeHireModal}
      />
    </div>
  );
};
export default CompanyHiring;
