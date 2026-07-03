const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

let modifiedCount = 0;

walkDir('frontend/src', (file) => {
  if (!file.endsWith('.jsx') && !file.endsWith('.js')) return;

  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Replace /api calls
  content = content.replace(/['"`]https:\/\/build-beyond\.onrender\.com\/api/g, match => match[0] + '/api');

  // Replace constant declarations and other base URL usages
  content = content.replace(/= ["']https:\/\/build-beyond\.onrender\.com["']/g, '= ""');
  
  // Replace template literals for images
  content = content.replace(/`https:\/\/build-beyond\.onrender\.com\//g, '`/');
  
  // Replace specific path functions
  content = content.replace(/`https:\/\/build-beyond\.onrender\.com\$\{path/g, '`${path');

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    modifiedCount++;
    console.log('Modified:', file);
  }
});
console.log('Total modified:', modifiedCount);
