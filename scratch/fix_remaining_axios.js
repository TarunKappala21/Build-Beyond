const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    if (fs.statSync(dirPath).isDirectory()) walkDir(dirPath, callback);
    else callback(dirPath);
  });
}

// Find all JSX/JS files that import axios (not axiosInstance) and use relative /api paths
let count = 0;

walkDir('frontend/src', (filePath) => {
  if (!filePath.endsWith('.jsx') && !filePath.endsWith('.js')) return;
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Only process files that import vanilla axios AND are not already updated
  if (!content.includes("from 'axios'") && !content.includes('from "axios"')) return;
  if (content.includes('axiosInstance')) return;
  if (!content.includes('/api/')) return; // No API calls

  const normalized = filePath.replace(/\\/g, '/');
  
  // Calculate relative path from file to src/api/axiosInstance
  const relToSrc = normalized.replace('frontend/src/', '');
  const depth = relToSrc.split('/').length - 1;
  const prefix = '../'.repeat(depth);
  const importPath = `${prefix}api/axiosInstance`;

  content = content.replace(
    /import axios from ['"]axios['"];\r?\n/,
    `import axiosInstance from '${importPath}';\n`
  );
  content = content.replace(/\baxios\.(get|post|put|delete|patch)\b/g, 'axiosInstance.$1');

  fs.writeFileSync(filePath, content);
  count++;
  console.log('Fixed:', normalized, '->', importPath);
});

console.log(`\nTotal fixed: ${count}`);
