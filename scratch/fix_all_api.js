const fs = require('fs');

// ─── 1. Files that use axios ──────────────────────────────────────────────────
const axiosFiles = [
  'frontend/src/Pages/company/components/company-ongoing/CompanyOngoing.jsx',
  'frontend/src/Pages/company/components/company-ongoing/components/ProjectUpdates.jsx',
  'frontend/src/store/slices/customerProfileSlice.js',
];

const axiosImportOld = /import axios from ['"]axios['"];?/g;

axiosFiles.forEach(filePath => {
  if (!fs.existsSync(filePath)) { console.log('SKIP:', filePath); return; }
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('axiosInstance')) { console.log('ALREADY DONE:', filePath); return; }

  // Figure out relative depth
  const depth = filePath.split('/').length - 2; // relative to frontend/src
  const srcParts = filePath.replace('frontend/src/', '').split('/');
  const fileDepth = srcParts.length - 1; // dirs from src/
  const prefix = '../'.repeat(fileDepth);
  const importPath = `${prefix}api/axiosInstance`;

  content = content.replace(
    /import axios from ['"]axios['"];?\r?\n/,
    `import axiosInstance from '${importPath}';\n`
  );
  content = content.replace(/\baxios\.(get|post|put|delete|patch)\b/g, 'axiosInstance.$1');

  fs.writeFileSync(filePath, content);
  console.log('Fixed (axios):', filePath, '  -> import from', importPath);
});

// ─── 2. Files that use fetch with hardcoded/relative /api URLs ─────────────────
const fetchFiles = [
  'frontend/src/Pages/company/components/company-bids/CompanyBids.jsx',
  'frontend/src/Pages/company/components/company-employees/CompanyEmployees.jsx',
  'frontend/src/Pages/company/components/company-project-requests/CompanyProjectRequests.jsx',
  'frontend/src/Pages/company/components/company-public-profile/CompanyPublicProfile.jsx',
  'frontend/src/Pages/company/components/company-settings/CompanySettings.jsx',
  'frontend/src/Pages/company/components/forms/company-addnewproject/CompanyAddNewProject.jsx',
  'frontend/src/Pages/admin/AdminCompanyDetail/AdminCompanyDetail.jsx',
  'frontend/src/Pages/admin/AdminDesignRequestDetail/AdminDesignRequestDetail.jsx',
  'frontend/src/Pages/admin/AdminWorkerDetail/AdminWorkerDetail.jsx',
  'frontend/src/Pages/platformmanager/PlatformManagerVerificationTasks.jsx',
  'frontend/src/Pages/NotFound.jsx',
  'frontend/src/Pages/Unauthorized.jsx',
];

const apiBaseConst = `const _API_BASE = import.meta.env.VITE_API_BASE_URL || '';\n`;

fetchFiles.forEach(filePath => {
  if (!fs.existsSync(filePath)) { console.log('SKIP:', filePath); return; }
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('VITE_API_BASE_URL')) { console.log('ALREADY DONE:', filePath); return; }

  // Insert the const after the last import line
  const lastImportMatch = [...content.matchAll(/^import [^\n]+\n/gm)];
  if (lastImportMatch.length === 0) {
    content = apiBaseConst + content;
  } else {
    const lastImport = lastImportMatch[lastImportMatch.length - 1];
    const insertAt = lastImport.index + lastImport[0].length;
    content = content.slice(0, insertAt) + '\n' + apiBaseConst + '\n' + content.slice(insertAt);
  }

  // Replace fetch('/api/  →  fetch(`${_API_BASE}/api/
  // Note: we need to close the template literal properly.
  // Pattern: fetch("/api/foo", opts) → fetch(`${_API_BASE}/api/foo`, opts)
  content = content.replace(/fetch\(["']\/api\/([^"']+)["']/g, 'fetch(`${_API_BASE}/api/$1`');

  // Replace backtick-based api URLs
  content = content.replace(/fetch\(`\/api\//g, 'fetch(`${_API_BASE}/api/');

  // Handle variables like const API_GET = "..." and const BACKEND_BASE = "..."
  // These are already empty string "" from previous fix — no action needed

  fs.writeFileSync(filePath, content);
  console.log('Fixed (fetch):', filePath);
});

console.log('\nAll done!');
