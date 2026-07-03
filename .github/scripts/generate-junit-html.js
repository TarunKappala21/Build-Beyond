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
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

function parseAttributes(attributeString) {
  const attrs = {};
  const regex = /(\w+)="([^"]*)"/g;
  let match;
  while ((match = regex.exec(attributeString)) !== null) {
    attrs[match[1]] = match[2];
  }
  return attrs;
}

function decodeXml(text) {
  return (text || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function escapeHtml(text) {
  return (text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseTestCases(xml) {
  const cases = [];
  const containerRegex = /<testcase\b([^>]*?)(?:\/>|>([\s\S]*?)<\/testcase>)/g;
  let match;

  while ((match = containerRegex.exec(xml)) !== null) {
    const attrs = parseAttributes(match[1] || '');
    const body = match[2] || '';
    const failureMatch = body.match(/<failure\b[^>]*>([\s\S]*?)<\/failure>/);
    const errorMatch = body.match(/<error\b[^>]*>([\s\S]*?)<\/error>/);
    const skippedMatch = body.match(/<skipped\b[^>]*\/?>(?:[\s\S]*?<\/skipped>)?/);

    let status = 'passed';
    let details = '';

    if (failureMatch) {
      status = 'failed';
      details = decodeXml(failureMatch[1].trim());
    } else if (errorMatch) {
      status = 'error';
      details = decodeXml(errorMatch[1].trim());
    } else if (skippedMatch) {
      status = 'skipped';
    }

    cases.push({
      classname: attrs.classname || '',
      name: attrs.name || '(unnamed test)',
      time: Number(attrs.time || 0),
      status,
      details,
    });
  }

  return cases;
}

function parseSuiteTotals(xml) {
  const suiteRegex = /<testsuite\b([^>]*)>/g;
  let tests = 0;
  let failures = 0;
  let errors = 0;
  let skipped = 0;
  let time = 0;
  let hasSuite = false;

  let match;
  while ((match = suiteRegex.exec(xml)) !== null) {
    hasSuite = true;
    const attrs = parseAttributes(match[1] || '');
    tests += Number(attrs.tests || 0);
    failures += Number(attrs.failures || 0);
    errors += Number(attrs.errors || 0);
    skipped += Number(attrs.skipped || attrs.disabled || 0);
    time += Number(attrs.time || 0);
  }

  if (!hasSuite) {
    const testCases = parseTestCases(xml);
    const inferred = {
      tests: testCases.length,
      failures: testCases.filter((t) => t.status === 'failed').length,
      errors: testCases.filter((t) => t.status === 'error').length,
      skipped: testCases.filter((t) => t.status === 'skipped').length,
      time: testCases.reduce((acc, t) => acc + (t.time || 0), 0),
    };
    return inferred;
  }

  return { tests, failures, errors, skipped, time };
}

function renderHtml({ title, generatedAt, summary, testCases }) {
  const passed = Math.max(summary.tests - summary.failures - summary.errors - summary.skipped, 0);
  const overallStatus = summary.failures === 0 && summary.errors === 0 ? 'success' : 'failure';
  const overallLabel = overallStatus === 'success' ? 'All Tests Passed' : 'Some Tests Failed';

  const rows = testCases
    .map((t) => {
      const statusClass = `status-${t.status}`;
      const details = t.details
        ? `<details><summary>Details</summary><pre>${escapeHtml(t.details)}</pre></details>`
        : '';
      return `
        <tr>
          <td>${escapeHtml(t.classname || '-')}</td>
          <td>${escapeHtml(t.name)}</td>
          <td><span class="status-pill ${statusClass}">${escapeHtml(t.status.toUpperCase())}</span></td>
          <td>${Number(t.time || 0).toFixed(3)}s</td>
          <td>${details}</td>
        </tr>
      `;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)} Report</title>
  <style>
    body { font-family: Segoe UI, Tahoma, Geneva, Verdana, sans-serif; background: #f4f7f6; color: #333; padding: 24px; }
    .container { max-width: 1100px; margin: auto; background: white; padding: 24px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); }
    h1 { color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-top: 0; }
    .status { padding: 10px 15px; border-radius: 6px; font-weight: bold; margin-bottom: 16px; }
    .success { background: #d4edda; color: #155724; }
    .failure { background: #f8d7da; color: #721c24; }
    .metrics { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 18px; }
    .metric { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 12px; min-width: 120px; }
    .metric-label { font-size: 12px; color: #64748b; }
    .metric-value { font-size: 20px; font-weight: 700; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th, td { border-bottom: 1px solid #e5e7eb; text-align: left; vertical-align: top; padding: 10px; }
    th { background: #f8fafc; color: #1f2937; font-weight: 700; }
    .status-pill { padding: 3px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; }
    .status-passed { background: #dcfce7; color: #166534; }
    .status-failed, .status-error { background: #fee2e2; color: #991b1b; }
    .status-skipped { background: #fef9c3; color: #854d0e; }
    details summary { cursor: pointer; color: #2563eb; }
    pre { white-space: pre-wrap; background: #0f172a; color: #e2e8f0; padding: 8px; border-radius: 6px; overflow: auto; }
    .footer { margin-top: 16px; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${escapeHtml(title)} Test Report</h1>
    <div class="status ${overallStatus}">Overall Status: ${overallStatus === 'success' ? '✅' : '❌'} ${overallLabel}</div>

    <div class="metrics">
      <div class="metric"><div class="metric-label">Total</div><div class="metric-value">${summary.tests}</div></div>
      <div class="metric"><div class="metric-label">Passed</div><div class="metric-value">${passed}</div></div>
      <div class="metric"><div class="metric-label">Failed</div><div class="metric-value">${summary.failures + summary.errors}</div></div>
      <div class="metric"><div class="metric-label">Skipped</div><div class="metric-value">${summary.skipped}</div></div>
      <div class="metric"><div class="metric-label">Duration</div><div class="metric-value">${Number(summary.time || 0).toFixed(3)}s</div></div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Suite</th>
          <th>Test Case</th>
          <th>Status</th>
          <th>Duration</th>
          <th>Failure Details</th>
        </tr>
      </thead>
      <tbody>
        ${rows || '<tr><td colspan="5">No test cases found in report.</td></tr>'}
      </tbody>
    </table>

    <div class="footer">Generated on ${escapeHtml(generatedAt)}</div>
  </div>
</body>
</html>`;
}

const input = getArg('input');
const output = getArg('output');
const metadata = getArg('metadata', '');
const title = getArg('title', 'Test');

if (!input || !output) {
  console.error('Usage: node generate-junit-html.js --input <junit.xml> --output <report.html> [--metadata <summary.json>] [--title <title>]');
  process.exit(1);
}

if (!fs.existsSync(input)) {
  console.error(`Input file not found: ${input}`);
  process.exit(1);
}

const xml = fs.readFileSync(input, 'utf8');
const suiteTotals = parseSuiteTotals(xml);
const testCases = parseTestCases(xml);
const generatedAt = new Date().toLocaleString();

const summary = {
  title,
  tests: suiteTotals.tests,
  failures: suiteTotals.failures,
  errors: suiteTotals.errors,
  skipped: suiteTotals.skipped,
  passed: Math.max(suiteTotals.tests - suiteTotals.failures - suiteTotals.errors - suiteTotals.skipped, 0),
  time: Number(suiteTotals.time || 0),
  status: suiteTotals.failures === 0 && suiteTotals.errors === 0 ? 'passed' : 'failed',
  generatedAt,
};

const html = renderHtml({
  title,
  generatedAt,
  summary,
  testCases,
});

ensureDir(output);
fs.writeFileSync(output, html, 'utf8');

if (metadata) {
  ensureDir(metadata);
  fs.writeFileSync(metadata, JSON.stringify(summary, null, 2), 'utf8');
}

console.log(`Generated report: ${output}`);
if (metadata) {
  console.log(`Generated summary: ${metadata}`);
}
