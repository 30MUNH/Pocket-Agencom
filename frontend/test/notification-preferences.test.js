import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { toggleNotificationPreference } from '../src/utils/notificationPreferences.js';

test('notification preference toggling is a pure state calculation', () => {
  const current = Object.freeze({ goldenTime: true, dailyTrend: false });
  const updated = toggleNotificationPreference(current, 'goldenTime');
  assert.deepEqual(updated, { goldenTime: false, dailyTrend: false });
  assert.deepEqual(current, { goldenTime: true, dailyTrend: false });
});

test('notification side effects run in the click handler, outside the React state updater', async () => {
  const source = await readFile(new URL('../src/pages/user/UserSettings.jsx', import.meta.url), 'utf8');
  const handler = source.match(/const handleToggleNotif = \(key\) => \{([\s\S]*?)\n  \};/)?.[1];
  assert.ok(handler);
  assert.match(handler, /setNotifSettings\(updated\)/);
  assert.match(handler, /localStorage\.setItem/);
  assert.match(handler, /toast\.success/);
  assert.doesNotMatch(handler, /setNotifSettings\(\(prev\) =>/);
});
