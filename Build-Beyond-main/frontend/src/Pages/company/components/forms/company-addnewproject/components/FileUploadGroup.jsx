import React from "react";

const FileUploadGroup = ({ mainImage, setMainImage, additionalImages, setAdditionalImages }) => (
  <>
    <div className="form-group">
      <label htmlFor="mainImage">Main Project File</label>
      <input type="file" id="mainImage" name="mainImage" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setMainImage(e.target.files[0] || null)} />
    </div>
    <div className="form-group">
      <label htmlFor="additionalImages">Additional Project Files</label>
      <input type="file" id="additionalImages" name="additionalImages" accept=".pdf,.jpg,.jpeg,.png" multiple onChange={(e) => setAdditionalImages(Array.from(e.target.files || []))} />
    </div>
  </>
);

export default FileUploadGroup;
