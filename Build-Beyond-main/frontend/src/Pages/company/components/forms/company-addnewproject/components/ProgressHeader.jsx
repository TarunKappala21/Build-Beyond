import React from "react";

const ProgressHeader = ({ projectId }) => (
  <h1>{projectId ? "Edit Construction Project" : "Add New Project"}</h1>
);

export default ProgressHeader;
