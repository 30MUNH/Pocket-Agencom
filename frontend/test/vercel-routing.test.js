import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
const spaRewrite = config.rewrites?.find((rewrite) => rewrite.destination === '/index.html');

test('Vercel SPA fallback matches client-side routes', () => {
  assert.ok(spaRewrite, 'expected a rewrite to /index.html');
  const matches = new RegExp(`^${spaRewrite.source}$`);

  for (const pathname of ['/', '/login', '/dashboard', '/staff/plan-review/123']) {
    assert.match(pathname, matches, `${pathname} should reach the SPA entry point`);
  }
});

test('Vercel SPA fallback leaves backend API paths outside the frontend rewrite', () => {
  assert.ok(spaRewrite, 'expected a rewrite to /index.html');
  const matches = new RegExp(`^${spaRewrite.source}$`);

  for (const pathname of ['/api', '/api/auth/login', '/api/unknown']) {
    assert.doesNotMatch(pathname, matches, `${pathname} must not be rewritten to HTML`);
  }
});

test('Vercel SPA fallback leaves file-like paths to static-file handling', () => {
  assert.ok(spaRewrite, 'expected a rewrite to /index.html');
  const matches = new RegExp(`^${spaRewrite.source}$`);

  for (const pathname of [
    '/assets/app.js',
    '/assets/app.css',
    '/images/logo.png',
    '/FaviconLogo.svg',
    '/assets/hanken-grotesk-latin-400-normal.woff2',
  ]) {
    assert.doesNotMatch(pathname, matches, `${pathname} must not be rewritten to HTML`);
  }
});
