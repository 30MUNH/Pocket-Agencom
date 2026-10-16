import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('local demo login obtains a real backend session instead of storing mock tokens', async () => {
  const source = await read('src/pages/auth/LoginPage.jsx');
  assert.match(source, /VITE_DEMO_AUTH_ENABLED/);
  assert.match(source, /loginMutation\.mutateAsync/);
  assert.match(source, /handleDemoLogin/);
  assert.doesNotMatch(source, /mock-(?:admin|staff|user)-token/);
  assert.doesNotMatch(source, /useAuthStore\.getState\(\)\.setAuth/);
});

test('Vercel rewrites deep links to the SPA entry point', async () => {
  const config = JSON.parse(await read('vercel.json'));
  assert.deepEqual(config.rewrites, [
    { source: '/(.*)', destination: '/index.html' },
  ]);
});
