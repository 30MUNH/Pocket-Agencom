import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('retired frontend URLs are absent and wildcard renders a neutral 404', async () => {
  const source = await read('src/App.jsx');
  const retiredPaths = [
    '/kols', '/marketplace', '/bookings', '/kol-bookings', '/kol/', '/chat',
    '/campaigns/:id/applications', '/admin/kols', '/staff/bookings',
  ];
  retiredPaths.forEach((path) => assert.equal(source.includes(`path="${path}`), false, path));
  assert.match(source, /path="\*" element=\{<NotFoundPage \/>\}/);
  assert.doesNotMatch(source, /Navigate to="\/dashboard"/);
});

test('navigation exposes plan review but no retired marketplace items', async () => {
  const source = await read('src/components/layout/Sidebar.jsx');
  assert.doesNotMatch(source, /KOL|KOC|marketplace|booking/i);
  assert.match(source, /\/plans/);
  assert.match(source, /Duyệt kế hoạch/);
});

test('registration always submits a business user', async () => {
  const source = await read('src/pages/auth/RegisterPage.jsx');
  assert.doesNotMatch(source, /role:\s*['"]kol['"]/i);
  assert.doesNotMatch(source, /KOL|KOC/);
});

test('spending UI uses the ads/other API contract and keeps the total', async () => {
  const source = await read('src/components/dashboard/MonthlySpendWidget.jsx');
  assert.match(source, /adsSpend/);
  assert.match(source, /otherSpend/);
  assert.match(source, /totalMonthlySpend/);
  assert.doesNotMatch(source, /kolSpend|customSpend/);
});

test('historical plans show a retired-feature notice and disable reuse actions', async () => {
  const source = await read('src/pages/user/MarketingResult.jsx');
  assert.match(source, /hasLegacyContent/);
  assert.match(source, /tính năng đã ngừng hoạt động/i);
});
