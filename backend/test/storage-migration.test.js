const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildObjectManifest,
  encryptObjectBytes,
  decryptObjectBytes,
  verifyBackupObjects,
  migrateVerifiedMediaAssets,
} = require('../src/services/storageBackup');
const { safeSourceObject } = require('../scripts/backup-storage-objects');

test('manifest records deterministic backup key, byte length, MIME type, and SHA-256 only', () => {
  const manifest = buildObjectManifest([{ sourceBucket: 'campaign-assets', sourcePath: 'user/a.png', bytes: Buffer.from('image'), contentType: 'image/png', signedUrl: 'https://x?token=secret' }], { timestamp: '2026-10-14T00:00:00.000Z' });
  assert.equal(manifest.objects[0].byteLength, 5);
  assert.equal(manifest.objects[0].contentType, 'image/png');
  assert.match(manifest.objects[0].sha256, /^[a-f0-9]{64}$/);
  assert.doesNotMatch(JSON.stringify(manifest), /token=secret|signedUrl/);
});

test('encrypted object bytes round-trip and checksum validation detects corruption', async () => {
  const key = Buffer.alloc(32, 7);
  const original = Buffer.from('private image bytes');
  const encrypted = encryptObjectBytes(original, key);
  assert.deepEqual(decryptObjectBytes(encrypted, key), original);
  const manifest = buildObjectManifest([{ sourceBucket: 'old', sourcePath: 'a', bytes: original, contentType: 'image/png' }]);
  await assert.rejects(verifyBackupObjects(manifest, async () => Buffer.from('corrupt')),
    { code: 'STORAGE_BACKUP_CHECKSUM_MISMATCH' });
});

test('default migration is dry-run and never deletes sources or legacy rows', async () => {
  const calls = [];
  const plan = [{
    approved: true, mediaAssetId: 22, ownerId: 4, expectedUrl: 'https://old.example/a.png',
    sourceBucket: 'campaign-assets', sourcePath: 'user-4/a.png', destinationBucket: 'campaign-assets-private',
    destinationPath: 'opaque-22.png', expectedSha256: '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
  }];
  const adapters = {
    async readSource() { calls.push('read'); return { bytes: Buffer.from('hello'), contentType: 'image/png' }; },
    async writePrivate() { calls.push('write'); },
    async readPrivate() { calls.push('read-destination'); return calls.includes('write') ? { bytes: Buffer.from('hello'), contentType: 'image/png' } : null; },
    database: { async $transaction(callback) { calls.push('transaction'); return callback({ async $queryRaw() { calls.push('asset-lock'); }, mediaAsset: { async updateMany(args) { calls.push(['update', args]); return { count: 1 }; } } }); } },
  };
  const dryRun = await migrateVerifiedMediaAssets(plan, adapters);
  assert.equal(dryRun.dryRun, true);
  assert.deepEqual(calls, []);

  await migrateVerifiedMediaAssets(plan, adapters, { dryRun: false, approved: true });
  assert.deepEqual(calls.map((item) => Array.isArray(item) ? item[0] : item), ['read', 'read-destination', 'write', 'read-destination', 'transaction', 'asset-lock', 'update']);
  assert.equal(calls.some((item) => String(item).includes('delete') || String(item).includes('remove')), false);
});

test('migration refuses unapproved or mismatched source inventory entries', async () => {
  let called = false;
  const adapters = { async readSource() { called = true; } };
  const validItem = {
    approved: true, mediaAssetId: 22, ownerId: 4, expectedUrl: 'https://old.example/a.png',
    sourceBucket: 'campaign-assets', sourcePath: 'user-4/a.png', destinationBucket: 'campaign-assets-private',
    destinationPath: 'opaque-22.png', expectedSha256: '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
  };
  await assert.rejects(migrateVerifiedMediaAssets([validItem], adapters, { dryRun: false, approved: false }), { code: 'STORAGE_MIGRATION_NOT_APPROVED' });
  await assert.rejects(migrateVerifiedMediaAssets([{ ...validItem, sourceBucket: '../bad' }], adapters, { dryRun: false, approved: true }), { code: 'STORAGE_MIGRATION_INVALID_SOURCE' });
  assert.equal(called, false);
});

test('migration resumes from an already-copied matching private object', async () => {
  const calls = [];
  const item = {
    approved: true, mediaAssetId: 22, ownerId: 4, expectedUrl: 'https://old.example/a.png',
    sourceBucket: 'campaign-assets', sourcePath: 'user-4/a.png', destinationBucket: 'campaign-assets-private',
    destinationPath: 'opaque-22.png', expectedSha256: '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
  };
  const adapters = {
    async readSource() { calls.push('source-read'); return { bytes: Buffer.from('hello'), contentType: 'image/png' }; },
    async readPrivate() { calls.push('destination-read'); return { bytes: Buffer.from('hello'), contentType: 'image/png' }; },
    async writePrivate() { calls.push('unexpected-write'); throw new Error('must not overwrite'); },
    database: { async $transaction(callback) { return callback({ async $queryRaw() { calls.push('lock'); }, mediaAsset: { async updateMany() { calls.push('reference-update'); return { count: 1 }; } } }); } },
  };
  const result = await migrateVerifiedMediaAssets([item], adapters, { dryRun: false, approved: true });
  assert.equal(result.copied, 1);
  assert.deepEqual(calls, ['source-read', 'destination-read', 'lock', 'reference-update']);
});

test('byte-backup scope accepts only inventory-verified exact bucket and object paths', () => {
  assert.equal(safeSourceObject({ verified: true, sourceBucket: 'legacy-public', sourcePath: 'user-4/image.png' }), true);
  for (const sourcePath of ['/absolute.png', '../escape.png', 'user/../escape.png', 'a\\b.png']) {
    assert.equal(safeSourceObject({ verified: true, sourceBucket: 'legacy-public', sourcePath }), false);
  }
  assert.equal(safeSourceObject({ verified: false, sourceBucket: 'legacy-public', sourcePath: 'a.png' }), false);
});

test('live copy and isolated restore require the exact separately approved project URL', () => {
  const copyScript = require('node:fs').readFileSync(require.resolve('../scripts/migrate-legacy-storage'), 'utf8');
  const restoreScript = require('node:fs').readFileSync(require.resolve('../scripts/verify-storage-backup'), 'utf8');
  assert.match(copyScript, /SUPABASE_URL !== process\.env\.STORAGE_MIGRATION_PROJECT_URL/);
  assert.match(restoreScript, /SUPABASE_URL !== process\.env\.STORAGE_RESTORE_PROJECT_URL/);
});
