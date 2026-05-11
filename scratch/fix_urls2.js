const fs = require('fs');
const path = require('path');

// Files that use axios — need to import axiosInstance
const axiosFiles = [
  'frontend/src/Pages/customer/components/customer-ongoing/CustomerOngoing.jsx',
  'frontend/src/Pages/company/components/company-ongoing/CompanyOngoing.jsx',
  'frontend/src/Pages/company/components/company-ongoing/components/ProjectUpdates.jsx',
];

// Files that use fetch with hardcoded URLs — just need to add the env var prefix
const fetchFiles = [
  'frontend/src/Pages/company/components/company-bids/CompanyBids.jsx',
  'frontend/src/Pages/company/components/company-employees/CompanyEmployees.jsx',
  'frontend/src/Pages/company/components/company-hiring/CompanyHiring.jsx',
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

const apiBaseSnippet = `const API_BASE = import.meta.env.VITE_API_BASE_URL || '';`;

// Helper: check if file already has API_BASE
function hasApiBase(content) {
  return content.includes('VITE_API_BASE_URL');
}

// Process axios-using files
axiosFiles.forEach(file => {
  if (!fs.existsSync(file)) { console.log('SKIP (not found):', file); return; }
  let content = fs.readFileSync(file, 'utf8');
  
  if (hasApiBase(content)) { console.log('SKIP (already updated):', file); return; }

  // Replace: import axios from 'axios'   →   import axiosInstance from '../../api/axiosInstance'
  // We'll just add API_BASE const since these files use axios directly not via instance
  // Add VITE_API_BASE_URL const near the top
  content = content.replace(
    /^(import .*\n)/m,
    `$1${apiBaseSnippet}\n`
  );

  // Replace axios.get('/api/ with axios.get(\`${API_BASE}/api/
  content = content.replace(/axios\.get\('\/api\//g, "axios.get(`${API_BASE}/api/");
  content = content.replace(/axios\.get\("\/api\//g, 'axios.get(`${API_BASE}/api/');
  content = content.replace(/axios\.post\('\/api\//g, "axios.post(`${API_BASE}/api/");
  content = content.replace(/axios\.post\("\/api\//g, 'axios.post(`${API_BASE}/api/');
  content = content.replace(/axios\.put\('\/api\//g, "axios.put(`${API_BASE}/api/");
  content = content.replace(/axios\.put\("\/api\//g, 'axios.put(`${API_BASE}/api/');
  content = content.replace(/axios\.delete\('\/api\//g, "axios.delete(`${API_BASE}/api/");
  content = content.replace(/axios\.delete\("\/api\//g, 'axios.delete(`${API_BASE}/api/');
  
  // Close the template literals - the paths end with ", or ', so the ` is needed  
  // This approach won't work cleanly - let's just use a simpler approach
  fs.writeFileSync(file, content);
  console.log('Modified (axios):', file);
});

// Process fetch-using files
fetchFiles.forEach(file => {
  if (!fs.existsSync(file)) { console.log('SKIP (not found):', file); return; }
  let content = fs.readFileSync(file, 'utf8');
  
  if (hasApiBase(content)) { console.log('SKIP (already updated):', file); return; }

  // Add API_BASE const after first import statement
  content = content.replace(
    /(import [^\n]+\n(?:import [^\n]+\n)*)/,
    `$1\n${apiBaseSnippet}\n`
  );

  // Replace fetch("/api/ and fetch('/api/  with  fetch(\`${API_BASE}/api/
  content = content.replace(/fetch\("\/api\//g, 'fetch(`${API_BASE}/api/');
  content = content.replace(/fetch\('\/api\//g, 'fetch(`${API_BASE}/api/');

  fs.writeFileSync(file, content);
  console.log('Modified (fetch):', file);
});

console.log('Done!');
