import React from "react";

const RecentUpdates = ({ updateText, setUpdateText, updateImage, setUpdateImage }) => (
  <div className="form-group">
    <label>Recent Updates</label>
    <div className="update-container">
      <div className="form-group">
        <label htmlFor="update1">Update 1</label>
        <textarea id="update1" name="updates[]" rows="3" placeholder="e.g. Interior work is progressing as planned." value={updateText} onChange={(e) => setUpdateText(e.target.value)}></textarea>
      </div>
      <div className="form-group">
        <label htmlFor="updateImage1">Update File</label>
        <input type="file" id="updateImage1" name="updateImages" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setUpdateImage(e.target.files[0] || null)} />
      </div>
    </div>
  </div>
);

export default RecentUpdates;
