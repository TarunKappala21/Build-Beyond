import React from "react";

const CompletionImagesUpload = ({ completionImages, setCompletionImages }) => (
  <div className="form-group" style={{
    backgroundColor: "#e8f5e9",
    padding: "15px",
    borderRadius: "8px",
    border: "2px solid #4caf50"
  }}>
    <label htmlFor="completionImages" style={{ color: "#2e7d32", fontWeight: "600" }}>
      📸 Project Completion Images (Recommended)
    </label>
    <p style={{ fontSize: "0.9em", color: "#555", marginBottom: "10px" }}>
      Upload final project images to showcase the completed work to customers. These will be displayed in the customer's review section.
    </p>
    <input
      type="file"
      id="completionImages"
      name="completionImages"
      accept=".jpg,.jpeg,.png"
      multiple
      onChange={(e) => setCompletionImages(Array.from(e.target.files || []))}
      style={{ width: "100%" }}
    />
    <small style={{ color: "#666", display: "block", marginTop: "5px" }}>
      {completionImages.length > 0 ? `${completionImages.length} image(s) selected` : "No images selected yet"}
    </small>
  </div>
);

export default CompletionImagesUpload;
