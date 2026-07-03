const fs = require('fs');

// Replace `axios.` with `axiosInstance.` in files that now import axiosInstance
const files = [
  'frontend/src/Pages/customer/components/customer-ongoing/CustomerOngoing.jsx',
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace axios.get/post/put/delete/patch with axiosInstance.*
  content = content.replace(/\baxios\.(get|post|put|delete|patch)\b/g, 'axiosInstance.$1');
  // Remove withCredentials from axiosInstance calls since it's set in the instance
  content = content.replace(/,\s*\{\s*withCredentials:\s*true\s*\}\)/g, ')');
  content = content.replace(/\{\s*withCredentials:\s*true\s*\},\s*\}/g, '}');
  
  fs.writeFileSync(file, content);
  console.log('Done:', file);
});
