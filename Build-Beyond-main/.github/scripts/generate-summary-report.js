#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);

function getArg(name, fallback = '') {
  const index = args.indexOf(`--${name}`);
  if (index === -1) return fallback;
  return args[index + 1] || fallback;
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function escapeHtml(text) {
  return (text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function readSummary(filePath, fallbackTitle) {
  if (!filePath || !fs.existsSync(filePath)) {
    return {
      title: fallbackTitle,
      status: 'failed',
      tests: 0,
      passed: 0,
      failures: 0,
      errors: 0,
      skipped: 0,
      time: 0,
      generatedAt: new Date().toLocaleString(),
    };
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return {
    title: data.title || fallbackTitle,
    status: data.status || 'failed',
    tests: Number(data.tests || 0),
    passed: Number(data.passed || 0),
    failures: Number(data.failures || 0),
    errors: Number(data.errors || 0),
    skipped: Number(data.skipped || 0),
    time: Number(data.time || 0),
    generatedAt: data.generatedAt || new Date().toLocaleString(),
  };
}

function cardHtml({ label, summary, link }) {
  const passed = summary.status === 'passed';
  const failedCount = summary.failures + summary.errors;

  return `
    <div class="link-card">
      <div>
        <div class="card-title">${escapeHtml(label)}</div>
        <div class="meta">${summary.tests} total · ${summary.passed} passed · ${failedCount} failed · ${summary.skipped} skipped</div>
      </div>
      <span class="result ${passed ? 'ok' : 'bad'}">${passed ? 'Passed' : 'Failed'}</span>
      <a href="${escapeHtml(link)}" class="btn">View Detailed Report</a>
    </div>
  `;
}

const backendSummaryPath = getArg('backend');
const frontendSummaryPath = getArg('frontend');
const outputPath = getArg('output');
const generatedAt = getArg('generatedAt', new Date().toLocaleString());

if (!outputPath) {
  console.error('Usage: node generate-summary-report.js --backend <backend-summary.json> --frontend <frontend-summary.json> --output <index.html> [--generatedAt "..."]');
  process.exit(1);
}

const backend = readSummary(backendSummaryPath, 'Backend API Tests');
const frontend = readSummary(frontendSummaryPath, 'Frontend UI Tests');
const overallPassed = backend.status === 'passed' && frontend.status === 'passed';

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>FDFED Project Test Report</title>
  <style>
    body { font-family: Segoe UI, Tahoma, Geneva, Verdana, sans-serif; background: #f4f7f6; color: #333; padding: 40px; }
    .container { max-width: 900px; margin: auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
    h1 { color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: 10px; }
    .status { padding: 10px 15px; border-radius: 6px; font-weight: bold; margin-bottom: 20px; }
    .success { background: #d4edda; color: #155724; }
    .failure { background: #f8d7da; color: #721c24; }
    .link-card { display: grid; grid-template-columns: 1fr auto auto; gap: 16px; align-items: center; padding: 15px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 10px; transition: 0.2s; }
    .link-card:hover { border-color: #3498db; background: #f9fcff; }
    .card-title { font-weight: 700; color: #1f2937; }
    .meta { font-size: 12px; color: #6b7280; margin-top: 4px; }
    .result.ok { color: #166534; font-weight: 700; }
    .result.bad { color: #991b1b; font-weight: 700; }
    .btn { text-decoration: none; background: #3498db; color: white; padding: 8px 16px; border-radius: 4px; font-size: 14px; }
    .footer { margin-top: 30px; font-size: 12px; color: #95a5a6; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <h1>FDFED Test Summary</h1>
    <div class="status ${overallPassed ? 'success' : 'failure'}">
      Overall Status: ${overallPassed ? '✅ All Tests Passed' : '❌ Some Tests Failed'}
    </div>

    ${cardHtml({ label: 'Backend API Tests', summary: backend, link: 'backend/test-report.html' })}
    ${cardHtml({ label: 'Frontend UI Tests', summary: frontend, link: 'frontend/test-report.html' })}

    <p style="margin-top: 30px;">
      <b>Instructions:</b> Open the detailed report links to see each unit test case result.
      For local integration tests, keep required services like Redis and MongoDB running.
    </p>

    <div class="footer">Generated on ${escapeHtml(generatedAt)}</div>
  </div>
</body>
</html>`;

ensureDir(outputPath);
fs.writeFileSync(outputPath, html, 'utf8');
console.log(`Generated summary report: ${outputPath}`);
