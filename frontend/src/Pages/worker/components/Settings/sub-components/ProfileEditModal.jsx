import React, { useMemo, useState } from 'react';

const LANG_OPTIONS = ['English', 'Hindi', 'Arabic'];
const SPECIALTY_OPTIONS = [
  'Sustainable design',
  'Urban planning',
  'Residential architecture',
  'Commercial architecture',
  'Interior design',
  'Landscape architecture'
];

const ProfileEditModal = ({ user, onClose, onSaved }) => {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [title, setTitle] = useState(user?.professionalTitle || '');
  const [experience, setExperience] = useState(user?.experience || 0);
  const [about, setAbout] = useState(user?.about || '');
  const [expectedPrice, setExpectedPrice] = useState(user?.expectedPrice || '');
  const [profileImage, setProfileImage] = useState(null);

  const [languages, setLanguages] = useState(Array.isArray(user?.languages) ? user.languages : []);
  const [specialties, setSpecialties] = useState(Array.isArray(user?.specialties) ? user.specialties : []);

  const [companies, setCompanies] = useState(
    Array.isArray(user?.previousCompanies) && user.previousCompanies.length
      ? user.previousCompanies.map((c) => ({ ...c, proofs: [] }))
      : [{ companyName: '', location: '', role: '', duration: '', proofs: [] }]
  );

  const [projects, setProjects] = useState(
    Array.isArray(user?.projects) && user.projects.length
      ? user.projects.map((p) => ({ ...p, images: [], invoiceOrCertificate: null }))
      : [{ name: '', year: '', yearRange: '', location: '', description: '', images: [], invoiceOrCertificate: null }]
  );

  const [errors, setErrors] = useState({});

  const handleLangToggle = (val) => {
    setLanguages((prev) => (prev.includes(val) ? prev.filter((l) => l !== val) : [...prev, val]));
  };
  const handleSpecToggle = (val) => {
    setSpecialties((prev) => (prev.includes(val) ? prev.filter((l) => l !== val) : [...prev, val]));
  };

  const addCompany = () => setCompanies((prev) => [...prev, { companyName: '', location: '', role: '', duration: '', proofs: [] }]);
  const removeCompany = (idx) => setCompanies((prev) => prev.filter((_, i) => i !== idx));
  const updateCompanyField = (idx, key, value) => setCompanies((prev) => prev.map((c, i) => (i === idx ? { ...c, [key]: value } : c)));
  const updateCompanyProofs = (idx, files) => setCompanies((prev) => prev.map((c, i) => (i === idx ? { ...c, proofs: Array.from(files || []) } : c)));

  const addProject = () => setProjects((prev) => [...prev, { name: '', year: '', yearRange: '', location: '', description: '', images: [], invoiceOrCertificate: null }]);
  const removeProject = (idx) => setProjects((prev) => prev.filter((_, i) => i !== idx));
  const updateProjectField = (idx, key, value) => setProjects((prev) => prev.map((p, i) => (i === idx ? { ...p, [key]: value } : p)));
  const updateProjectImages = (idx, files) => setProjects((prev) => prev.map((p, i) => (i === idx ? { ...p, images: Array.from(files || []) } : p)));
  const updateProjectInvoice = (idx, file) => setProjects((prev) => prev.map((p, i) => (i === idx ? { ...p, invoiceOrCertificate: (file && file[0]) || null } : p)));

  const previewUrl = useMemo(() => (profileImage ? URL.createObjectURL(profileImage) : (user?.profileImage || '')), [profileImage, user]);

  const validate = () => {
    const newErrors = {};
    // Basic
    if (!name || !name.trim()) newErrors.name = 'Name is required';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Enter a valid email';
    if (phone && !/^[0-9+()\-\s]{7,20}$/.test(phone)) newErrors.phone = 'Enter a valid phone number';
    if (experience !== '' && (isNaN(Number(experience)) || Number(experience) < 0)) newErrors.experience = 'Experience must be a non-negative number';

    // Companies: if any field or proofs provided, require all
    const companyErrors = companies.map((c) => ({ }));
    companies.forEach((c, idx) => {
      const hasAny = !!(c.companyName || c.location || c.role || c.duration || (c.proofs && c.proofs.length));
      if (hasAny) {
        if (!c.companyName) companyErrors[idx].companyName = 'Company name required';
        if (!c.location) companyErrors[idx].location = 'Location required';
        if (!c.role) companyErrors[idx].role = 'Role required';
        if (!c.duration) companyErrors[idx].duration = 'Duration required';
      }
    });
    if (companyErrors.some((ce) => Object.keys(ce).length)) newErrors.companies = companyErrors;

    // Projects: if any detail or file provided, require name; year must be number if set
    const projectErrors = projects.map((p) => ({ }));
    projects.forEach((p, idx) => {
      const hasAny = !!(p.name || p.year || p.yearRange || p.location || p.description || (p.images && p.images.length) || p.invoiceOrCertificate);
      if (hasAny) {
        if (!p.name) projectErrors[idx].name = 'Project name required';
        if (p.year !== '' && p.year !== undefined && p.year !== null) {
          const num = Number(p.year);
          if (isNaN(num) || num < 1900 || num > 2100) projectErrors[idx].year = 'Year must be between 1900 and 2100';
        }
      }
    });
    if (projectErrors.some((pe) => Object.keys(pe).length)) newErrors.projects = projectErrors;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const fd = new FormData();
      if (profileImage) fd.append('profileImage', profileImage);
      fd.append('name', name);
      fd.append('email', email);
      fd.append('phone', phone);
      fd.append('title', title);
      fd.append('experience', String(experience || ''));
      fd.append('about', about);
      fd.append('expectedPrice', expectedPrice);
      // arrays
      languages.forEach((l) => fd.append('languages', l));
      specialties.forEach((s) => fd.append('specialties', s));

      // companies
      companies.forEach((c, idx) => {
        const i = idx + 1;
        // Only send blocks that are complete, to avoid server rejection
        const hasAny = !!(c.companyName || c.location || c.role || c.duration || (c.proofs && c.proofs.length));
        const complete = !!(c.companyName && c.location && c.role && c.duration);
        if (!hasAny) return;
        if (!complete) return;
        fd.append(`companyName-${i}`, c.companyName);
        fd.append(`companyLocation-${i}`, c.location);
        fd.append(`companyRole-${i}`, c.role);
        fd.append(`companyDuration-${i}`, c.duration);
        if (Array.isArray(c.proofs)) {
          c.proofs.forEach((f) => fd.append(`companyProof-${i}`, f));
        }
      });

      // projects
      projects.forEach((p, idx) => {
        const i = idx + 1;
        const hasAny = !!(p.name || p.year || p.yearRange || p.location || p.description || (p.images && p.images.length) || p.invoiceOrCertificate);
        if (!hasAny) return;
        if (!p.name) return; // validated above
        fd.append(`projectName-${i}`, p.name);
        if (p.year) fd.append(`projectYear-${i}`, String(p.year));
        if (p.yearRange) fd.append(`projectYearRange-${i}`, p.yearRange);
        if (p.location) fd.append(`projectLocation-${i}`, p.location);
        if (p.description) fd.append(`projectDescription-${i}`, p.description);
        if (Array.isArray(p.images)) {
          p.images.forEach((f) => fd.append(`projectImages-${i}`, f));
        }
        if (p.invoiceOrCertificate) {
          fd.append(`projectInvoice-${i}`, p.invoiceOrCertificate);
        }
      });

      const resp = await fetch('/api/worker/profile/update', {
        method: 'POST',
        credentials: 'include',
        body: fd,
      });
      const data = await resp.json();
      if (!resp.ok) {
        alert(data?.message || 'Failed to update profile');
        return;
      }
      if (typeof onSaved === 'function') onSaved();
    } catch (err) {
      console.error(err);
      alert('An error occurred while saving.');
    }
  };

  return (
    <div className="wkst-modal-overlay">
      <div className="wkst-modal">
        <div className="wkst-modal-header">
          <h3>Edit Profile</h3>
          <button className="wkst-modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="wkst-form" onSubmit={onSubmit}>
          {Object.keys(errors).length > 0 && (
            <div className="wkst-alert">
              Please fix the highlighted fields.
            </div>
          )}
          <div className="wkst-two-col">
            <div className="wkst-col">
              <label>Profile Photo</label>
              <div className="wkst-avatar-upload">
                <img src={previewUrl || 'https://t4.ftcdn.net/jpg/03/64/21/11/360_F_364211147_1qgLVxv1Tcq0Ohz3FawUfrtONzz8nq3e.jpg'} alt="avatar" className="wkst-avatar" />
                <input type="file" accept="image/*" onChange={(e) => setProfileImage(e.target.files[0] || null)} />
              </div>
              <div className="wkst-hint">Upload a clear square photo; it will be shown in a circle.</div>
            </div>
            <div className="wkst-col">
              <label>Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} />
              {errors.name && <div className="wkst-error">{errors.name}</div>}
              <label>Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g., +91 98765 43210" aria-invalid={!!errors.phone} />
              {errors.phone && <div className="wkst-error">{errors.phone}</div>}
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g., you@example.com" aria-invalid={!!errors.email} />
              {errors.email && <div className="wkst-error">{errors.email}</div>}
            </div>
          </div>

          <div className="wkst-two-col">
            <div className="wkst-col">
              <label>Professional Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Architect, Interior Designer, Civil Engineer" />
              <div className="wkst-hint">How you want clients to see your role.</div>
            </div>
            <div className="wkst-col">
              <label>Years of Experience</label>
              <input type="number" min="0" value={experience} onChange={(e) => setExperience(e.target.value)} aria-invalid={!!errors.experience} />
              {errors.experience && <div className="wkst-error">{errors.experience}</div>}
            </div>
          </div>

          <div className="wkst-two-col">
            <div className="wkst-col">
              <label>Languages Spoken</label>
              <div className="wkst-checkbox-row">
                {LANG_OPTIONS.map((l) => (
                  <label key={l} className="wkst-checkbox">
                    <input type="checkbox" checked={languages.includes(l)} onChange={() => handleLangToggle(l)} /> {l}
                  </label>
                ))}
              </div>
              <div className="wkst-hint">You can add more later; select all that apply.</div>
            </div>
            <div className="wkst-col">
              <label>Specialties</label>
              <div className="wkst-checkbox-row">
                {SPECIALTY_OPTIONS.map((s) => (
                  <label key={s} className="wkst-checkbox">
                    <input type="checkbox" checked={specialties.includes(s)} onChange={() => handleSpecToggle(s)} /> {s}
                  </label>
                ))}
              </div>
              <div className="wkst-hint">Pick your top areas of expertise.</div>
            </div>
          </div>

          <label>Professional Biography / About</label>
          <textarea rows={4} value={about} onChange={(e) => setAbout(e.target.value)} />
          <div className="wkst-hint">Write a concise summary of your background, tools, and approach.</div>

          <div className="wkst-section">
            <div className="wkst-section-head">
              <h4>Previously Worked Companies</h4>
              <button type="button" className="wkst-btn sm" onClick={addCompany}>+ Add</button>
            </div>
            {companies.map((c, idx) => (
              <div key={idx} className="wkst-card">
                <div className="wkst-two-col">
                  <div className="wkst-col">
                    <label>Company Name</label>
                    <input value={c.companyName} onChange={(e) => updateCompanyField(idx, 'companyName', e.target.value)} aria-invalid={!!errors.companies?.[idx]?.companyName} />
                    {errors.companies?.[idx]?.companyName && <div className="wkst-error">{errors.companies[idx].companyName}</div>}
                  </div>
                  <div className="wkst-col">
                    <label>Company Location</label>
                    <input value={c.location} onChange={(e) => updateCompanyField(idx, 'location', e.target.value)} placeholder="city, country" aria-invalid={!!errors.companies?.[idx]?.location} />
                    {errors.companies?.[idx]?.location && <div className="wkst-error">{errors.companies[idx].location}</div>}
                  </div>
                </div>
                <div className="wkst-two-col">
                  <div className="wkst-col">
                    <label>Role / Designation</label>
                    <input value={c.role} onChange={(e) => updateCompanyField(idx, 'role', e.target.value)} aria-invalid={!!errors.companies?.[idx]?.role} />
                    {errors.companies?.[idx]?.role && <div className="wkst-error">{errors.companies[idx].role}</div>}
                  </div>
                  <div className="wkst-col">
                    <label>Years / Duration</label>
                    <input value={c.duration} onChange={(e) => updateCompanyField(idx, 'duration', e.target.value)} aria-invalid={!!errors.companies?.[idx]?.duration} />
                    {errors.companies?.[idx]?.duration && <div className="wkst-error">{errors.companies[idx].duration}</div>}
                  </div>
                </div>
                <label>Proof of Employment (offer/experience/payslip)</label>
                <input type="file" multiple accept="image/*,application/pdf" onChange={(e) => updateCompanyProofs(idx, e.target.files)} />
                {Array.isArray(c.proofs) && c.proofs.length > 0 && (
                  <div className="wkst-file-previews">
                    {c.proofs.map((file, i) => (
                      <div key={i} className="wkst-file-chip">
                        {file.type?.startsWith('image/') ? (
                          <img alt={file.name} src={URL.createObjectURL(file)} />
                        ) : (
                          <span className="wkst-file-name">{file.name || 'Document'}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="wkst-row-end">
                  <button type="button" className="wkst-btn danger sm" onClick={() => removeCompany(idx)}>Remove</button>
                </div>
              </div>
            ))}
          </div>

          <div className="wkst-section">
            <div className="wkst-section-head">
              <h4>Notable Projects</h4>
              <button type="button" className="wkst-btn sm" onClick={addProject}>+ Add</button>
            </div>
            {projects.map((p, idx) => (
              <div key={idx} className="wkst-card">
                <label>Project Name</label>
                <input value={p.name} onChange={(e) => updateProjectField(idx, 'name', e.target.value)} placeholder="e.g., Villa Renovation – After" aria-invalid={!!errors.projects?.[idx]?.name} />
                {errors.projects?.[idx]?.name && <div className="wkst-error">{errors.projects[idx].name}</div>}

                <div className="wkst-two-col">
                  <div className="wkst-col">
                    <label>Year</label>
                    <input type="number" min="1900" max="2100" value={p.year || ''} onChange={(e) => updateProjectField(idx, 'year', e.target.value)} aria-invalid={!!errors.projects?.[idx]?.year} />
                    {errors.projects?.[idx]?.year && <div className="wkst-error">{errors.projects[idx].year}</div>}
                  </div>
                  <div className="wkst-col">
                    <label>Year Range</label>
                    <input value={p.yearRange || ''} onChange={(e) => updateProjectField(idx, 'yearRange', e.target.value)} placeholder="e.g., 2022-2023" />
                  </div>
                </div>
                
                <label>Project Location</label>
                <input value={p.location || ''} onChange={(e) => updateProjectField(idx, 'location', e.target.value)} placeholder="city, country" />

                <label>Short Description</label>
                <textarea rows={3} value={p.description || ''} onChange={(e) => updateProjectField(idx, 'description', e.target.value)} />

                <label>Project Images / Gallery</label>
                <input type="file" multiple accept="image/*" onChange={(e) => updateProjectImages(idx, e.target.files)} />
                {Array.isArray(p.images) && p.images.length > 0 && (
                  <div className="wkst-file-previews">
                    {p.images.map((file, i) => (
                      <div key={i} className="wkst-file-chip">
                        <img alt={file.name} src={URL.createObjectURL(file)} />
                      </div>
                    ))}
                  </div>
                )}

                <label>Invoice / Completion Certificate (PDF or image)</label>
                <input type="file" accept="image/*,application/pdf" onChange={(e) => updateProjectInvoice(idx, e.target.files)} />
                {p.invoiceOrCertificate && (
                  <div className="wkst-file-previews">
                    <div className="wkst-file-chip">
                      {p.invoiceOrCertificate.type?.startsWith('image/') ? (
                        <img alt={p.invoiceOrCertificate.name} src={URL.createObjectURL(p.invoiceOrCertificate)} />
                      ) : (
                        <span className="wkst-file-name">{p.invoiceOrCertificate.name || 'Document'}</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="wkst-row-end">
                  <button type="button" className="wkst-btn danger sm" onClick={() => removeProject(idx)}>Remove</button>
                </div>
              </div>
            ))}
          </div>

          <label>Pricing</label>
          <input value={expectedPrice} onChange={(e) => setExpectedPrice(e.target.value)} placeholder="Eg: Expected price taker to design a 3 floor building" />
          <div className="wkst-hint">You can specify fixed/hourly/per sqft later. For now, briefly describe your expected rate.</div>

          <div className="wkst-actions">
            <button type="button" className="wkst-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="wkst-btn wkst-btn-primary">Save</button>
          </div>
        </form>
      </div>
      <style>{`
        .wkst-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:1000}
        .wkst-modal{background:#fff;border-radius:12px;max-height:90vh;overflow:auto;width:min(980px,96vw);box-shadow:0 20px 60px rgba(0,0,0,.2);}
        .wkst-modal-header{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #eee}
        .wkst-modal-close{border:none;background:transparent;font-size:18px;cursor:pointer}
        .wkst-form{padding:16px 20px}
        .wkst-two-col{display:grid;grid-template-columns:1fr 1fr;gap:16px}
        .wkst-col{display:flex;flex-direction:column}
        .wkst-form label{font-weight:600;margin-top:12px;margin-bottom:6px}
        .wkst-form input[type="text"], .wkst-form input[type="email"], .wkst-form input[type="number"], .wkst-form textarea, .wkst-form input:not([type]){border:1px solid #ddd;border-radius:8px;padding:10px 12px}
        .wkst-avatar-upload{display:flex;align-items:center;gap:12px}
        .wkst-avatar{width:72px;height:72px;border-radius:50%;object-fit:cover;border:2px solid #eee}
        .wkst-checkbox-row{display:flex;flex-wrap:wrap;gap:12px}
        .wkst-checkbox{display:flex;align-items:center;gap:6px}
        .wkst-section{margin-top:16px}
        .wkst-section-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
        .wkst-btn{background:#f2f2f2;border:1px solid #ddd;border-radius:8px;padding:8px 12px;cursor:pointer}
        .wkst-btn.sm{padding:6px 10px;font-size:12px}
        .wkst-btn.danger{background:#ffe9e9;border-color:#ffc9c9;color:#b00020}
        .wkst-btn.wkst-btn-primary{background:#1a73e8;color:#fff;border-color:#1a73e8}
        .wkst-card{border:1px solid #eee;border-radius:10px;padding:12px;margin-top:10px}
        .wkst-row-end{display:flex;justify-content:flex-end;margin-top:8px}
        .wkst-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:16px}
        .wkst-project-image{max-width:140px;border-radius:8px;margin-right:8px}
        .wkst-hint{color:#666;font-size:12px;margin-top:6px}
        .wkst-error{color:#b00020;font-size:12px;margin-top:6px}
        .wkst-alert{background:#fff4e5;border:1px solid #ffd9a8;color:#9a5b00;padding:8px 12px;border-radius:8px;margin-bottom:12px}
        .wkst-file-previews{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
        .wkst-file-chip{border:1px solid #eee;border-radius:8px;padding:6px;background:#fafafa;display:flex;align-items:center;gap:8px}
        .wkst-file-chip img{width:56px;height:56px;object-fit:cover;border-radius:6px}
        .wkst-file-name{font-size:12px;color:#333}
      `}</style>
    </div>
  );
};

export default ProfileEditModal;
