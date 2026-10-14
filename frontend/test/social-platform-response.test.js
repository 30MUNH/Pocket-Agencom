import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePlatformList } from '../src/utils/normalizePlatformList.js';

test('social platform list accepts the axios client’s unwrapped array response', () => {
  const platforms = [{ id: '1', platform: 'instagram' }];
  assert.deepEqual(normalizePlatformList(platforms), platforms);
});

test('social platform list accepts the legacy wrapped response shape', () => {
  const platforms = [{ id: '2', platform: 'facebook' }];
  assert.deepEqual(normalizePlatformList({ data: platforms }), platforms);
  assert.deepEqual(normalizePlatformList({ data: null }), []);
});
