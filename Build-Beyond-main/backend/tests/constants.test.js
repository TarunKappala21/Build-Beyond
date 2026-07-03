const test = require('node:test');
const assert = require('node:assert/strict');

const { parseOrigins } = require('../config/constants');

test('parseOrigins splits comma-separated urls and trims whitespace', () => {
  const result = parseOrigins('https://a.com, https://b.com ,https://c.com');
  assert.deepEqual(result, ['https://a.com', 'https://b.com', 'https://c.com']);
});

test('parseOrigins returns empty array for empty input', () => {
  const result = parseOrigins('');
  assert.deepEqual(result, []);
});

test('parseOrigins trims trailing and leading spaces', () => {
  const result = parseOrigins('   https://a.com   ');
  assert.deepEqual(result, ['https://a.com']);
});

test('parseOrigins removes empty entries between commas', () => {
  const result = parseOrigins('https://a.com,,https://b.com, ,https://c.com');
  assert.deepEqual(result, ['https://a.com', 'https://b.com', 'https://c.com']);
});

test('parseOrigins keeps http scheme origin', () => {
  const result = parseOrigins('http://localhost:5173');
  assert.deepEqual(result, ['http://localhost:5173']);
});

test('parseOrigins keeps https scheme origin', () => {
  const result = parseOrigins('https://example.com');
  assert.deepEqual(result, ['https://example.com']);
});

test('parseOrigins handles path suffix origin token as-is', () => {
  const result = parseOrigins('https://example.com/app');
  assert.deepEqual(result, ['https://example.com/app']);
});

test('parseOrigins handles query suffix token as-is', () => {
  const result = parseOrigins('https://example.com?env=dev');
  assert.deepEqual(result, ['https://example.com?env=dev']);
});

test('parseOrigins handles hash suffix token as-is', () => {
  const result = parseOrigins('https://example.com/#root');
  assert.deepEqual(result, ['https://example.com/#root']);
});

test('parseOrigins handles uppercase host characters', () => {
  const result = parseOrigins('https://EXAMPLE.COM');
  assert.deepEqual(result, ['https://EXAMPLE.COM']);
});

test('parseOrigins preserves port numbers', () => {
  const result = parseOrigins('https://example.com:8443');
  assert.deepEqual(result, ['https://example.com:8443']);
});

test('parseOrigins accepts multiple localhost origins', () => {
  const result = parseOrigins('http://localhost:3000,http://localhost:5173,http://127.0.0.1:5173');
  assert.deepEqual(result, [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ]);
});

test('parseOrigins returns empty array when input is only whitespace', () => {
  const result = parseOrigins('    ');
  assert.deepEqual(result, []);
});

test('parseOrigins ignores newline and tab around values after trim', () => {
  const result = parseOrigins('\nhttps://a.com\t,\thttps://b.com\n');
  assert.deepEqual(result, ['https://a.com', 'https://b.com']);
});

test('parseOrigins handles single token with internal spaces untouched', () => {
  const result = parseOrigins('https://exa mple.com');
  assert.deepEqual(result, ['https://exa mple.com']);
});

test('parseOrigins with null input returns empty array', () => {
  const result = parseOrigins(null);
  assert.deepEqual(result, []);
});

test('parseOrigins with undefined input returns empty array', () => {
  const result = parseOrigins(undefined);
  assert.deepEqual(result, []);
});

test('parseOrigins with numeric input coerces to string', () => {
  const result = parseOrigins(12345);
  assert.deepEqual(result, ['12345']);
});

test('parseOrigins keeps duplicate values (dedupe happens elsewhere)', () => {
  const result = parseOrigins('https://a.com,https://a.com');
  assert.deepEqual(result, ['https://a.com', 'https://a.com']);
});
