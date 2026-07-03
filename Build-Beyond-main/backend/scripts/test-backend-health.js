const https = require('https');

const backendUrl = process.env.BACKEND_URL || 'https://build-beyond.onrender.com';

console.log(`\n🔍 Testing backend connectivity to: ${backendUrl}\n`);

// Test 1: Health check endpoint
https.get(`${backendUrl}/`, (res) => {
  console.log(`✅ GET / - Status: ${res.statusCode}`);
  let data = '';
  res.on('data', (chunk) => (data += chunk));
  res.on('end', () => console.log(`   Response: ${data.substring(0, 100)}`));
}).on('error', (err) => {
  console.log(`❌ GET / - Error: ${err.message}`);
});

// Test 2: API endpoint
setTimeout(() => {
  https.get(`${backendUrl}/api/ongoing_projects`, (res) => {
    console.log(`\n✅ GET /api/ongoing_projects - Status: ${res.statusCode}`);
    let data = '';
    res.on('data', (chunk) => (data += chunk));
    res.on('end', () => console.log(`   Response: ${data.substring(0, 100)}`));
  }).on('error', (err) => {
    console.log(`\n❌ GET /api/ongoing_projects - Error: ${err.message}`);
  });
}, 2000);
