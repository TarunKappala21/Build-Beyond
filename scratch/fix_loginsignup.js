const fs = require('fs');

const file = 'frontend/src/Pages/login-signup/LoginSignUp.jsx';
let content = fs.readFileSync(file, 'utf8');

// Replace fetch("/api/foo" with fetch(`${API_BASE}/api/foo`
content = content.replace(/fetch\("\/api\/([^"]+)"/g, 'fetch(`${API_BASE}/api/$1`');
content = content.replace(/fetch\('\/api\/([^']+)'/g, 'fetch(`${API_BASE}/api/$1`');

// Handle template literal paths like fetch(`/api/...`)
content = content.replace(/fetch\(`\/api\//g, 'fetch(`${API_BASE}/api/');

fs.writeFileSync(file, content);
console.log('Done! Fixed LoginSignUp.jsx fetch calls.');

// Verify
const matches = content.match(/fetch\(["'`]\/api\//g);
if (matches) {
  console.log('WARNING: Still found unfixed fetch calls:', matches.length);
} else {
  console.log('All fetch calls updated successfully.');
}
