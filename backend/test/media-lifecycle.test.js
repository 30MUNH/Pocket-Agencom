const test = require('node:test');
const assert = require('node:assert/strict');
const { createMediaAssetReferenceService, retryDelayMs, REFERENCE_TRANSACTION_TIMEOUT_MS, MAX_RETRY_DELAY_MS } = require('../src/services/mediaAssetReferenceService');

function setup({ asset, references = {}, leases = [], removeResult = null } = {}) {
  const calls = [];
  const tx = {
    async $queryRaw() { calls.push(['lock']); },
    mediaAsset: {
      async findUnique() { return asset; },
      async updateMany({ where, data }) { calls.push(['mark', where, data]); for (const [key, value] of Object.entries(data)) asset[key] = value?.increment ? (asset[key] || 0) + value.increment : value; return { count: 1 }; },
      async deleteMany({ where }) { calls.push(['delete-row', where]); asset.removed = true; return { count: 1 }; },
    },
    user: { async count() { return references.avatars || 0; } },
    scheduledPost: { async count() { return references.posts || 0; } },
    marketingPlanAsset: { async count() { return references.planRelations || 0; } },
    marketingPlan: {
      async findMany({ where }) {
        const candidates = where?.OR || [];
        return (references.plans || []).filter((plan) => candidates.some((candidate) => {
          const [field, condition] = Object.entries(candidate)[0] || [];
          return field && String(plan[field] ?? '').includes(condition?.contains ?? '\0');
        }));
      },
    },
    template: { async count() { return references.templates || 0; } },
    mediaAssetAccessLease: {
      async deleteMany({ where }) { calls.push(['expired-leases', where]); return { count: 0 }; },
      async findFirst() { return leases.find((lease) => lease.expiresAt > new Date('2026-01-01T00:00:00Z')) || null; },
      async count() { return 0; },
    },
  };
  const prismaClient = { async $transaction(callback, options) { calls.push(['transaction-options', options]); return callback(tx); }, mediaAssetAccessLease: tx.mediaAssetAccessLease };
  const storageOperations = { async removePrivateObject(input) { calls.push(['remove-object', input]); if (removeResult) throw removeResult; return { removed: true }; } };
  return { calls, asset, storageOperations, service: createMediaAssetReferenceService({ prismaClient, storageOperations, now: () => new Date('2026-01-01T00:00:00Z') }) };
}

const privateAsset = () => ({ id: 12, userId: 4, sourceKind: 'private_storage', lifecycleState: 'active', storageBucket: 'campaign-assets-private', storagePath: 'private.png', deletionOperationId: null, deletionStartedAt: null, deletionLastAttemptAt: null, deletionAttemptCount: 0 });

test('retry backoff grows exponentially and caps at one hour', () => {
  assert.equal(retryDelayMs(0), 1000);
  assert.equal(retryDelayMs(3), 8000);
  assert.equal(retryDelayMs(99), MAX_RETRY_DELAY_MS);
});

test('referenced assets and legacy markers block physical cleanup', async () => {
  const referenced = setup({ asset: privateAsset(), references: { plans: [{ contentIdeas: '[{"imageUrl":"https://project.supabase.co/storage/v1/object/public/campaign-assets/private.png"}]' }] } });
  await assert.rejects(referenced.service.deleteOwnedAsset(4, '12'), { statusCode: 409 });
  assert.equal(referenced.calls.some(([name]) => name === 'remove-object'), false);
});

test('legacy image markers and ScheduledPost references block cleanup', async () => {
  const state = setup({ asset: { ...privateAsset(), url: 'https://old.example/path/private.png' }, references: { posts: 1 } });
  await assert.rejects(state.service.deleteOwnedAsset(4, 12), { statusCode: 409 });
  assert.equal(state.calls.some(([name]) => name === 'remove-object'), false);
});

test('serialized JSON asset-ID references block row and object deletion', async () => {
  const state = setup({ asset: privateAsset(), references: { plans: [{ contentIdeas: '{\"mediaAssetId\": 12}' }] } });
  await assert.rejects(state.service.deleteOwnedAsset(4, 12), { statusCode: 409 });
  assert.equal(state.calls.some(([name]) => name === 'remove-object'), false);
});

test('pretty-printed serialized JSON asset-ID references with arbitrary key spacing block deletion', async () => {
  const state = setup({ asset: privateAsset(), references: { plans: [{ contentIdeas: '{\n  \"mediaAssetId\"  :  12\n}' }] } });
  await assert.rejects(state.service.deleteOwnedAsset(4, 12), { statusCode: 409 });
  assert.equal(state.calls.some(([name]) => name === 'remove-object'), false);
});

test('attachment and signing leases cannot begin after deleting state starts', async () => {
  const { service, asset } = setup({ asset: privateAsset() });
  const result = await service.deleteOwnedAsset(4, 12);
  assert.equal(asset.lifecycleState, 'deleting');
  assert.equal(result.deleted, true);
});

test('asset reference scans use a transaction deadline above the default five seconds', async () => {
  const { service, calls } = setup({ asset: privateAsset() });
  await service.deleteOwnedAsset(4, 12);
  const options = calls.filter(([name]) => name === 'transaction-options').map(([, value]) => value);
  assert.ok(options.length >= 2);
  assert.ok(options.every((value) => value.timeout === REFERENCE_TRANSACTION_TIMEOUT_MS));
});

test('Storage timeout preserves deleting state and retry operation identity', async () => {
  const timeout = Object.assign(new Error('secret signed URL path'), { statusCode: 503 });
  const { service, asset } = setup({ asset: privateAsset(), removeResult: timeout });
  await assert.rejects(service.deleteOwnedAsset(4, 12), { statusCode: 503 });
  assert.equal(asset.lifecycleState, 'deleting');
  assert.equal(asset.deletionAttemptCount, 1);
  assert.equal(asset.deletionLastError, 'storage_remove_failed');
  assert.equal(asset.deletionOperationId.length > 0, true);
});

test('active signing leases keep private deletion pending without a Storage call', async () => {
  const state = setup({ asset: privateAsset(), leases: [{ expiresAt: new Date('2026-01-01T00:00:20Z') }] });
  const result = await state.service.deleteOwnedAsset(4, 12);
  assert.equal(result.pending, true);
  assert.equal(state.asset.lifecycleState, 'deleting');
  assert.equal(state.calls.some(([name]) => name === 'remove-object'), false);
});

test('retry resumes the same deletion operation after transient failure', async () => {
  const state = setup({ asset: privateAsset(), removeResult: new Error('temporary outage') });
  await assert.rejects(state.service.deleteOwnedAsset(4, 12), { statusCode: 503 });
  const operationId = state.asset.deletionOperationId;
  state.storageOperations.removePrivateObject = async (input) => { state.calls.push(['remove-object', input]); return { removed: true }; };
  const result = await state.service.deleteOwnedAsset(4, 12);
  assert.equal(result.deleted, true);
  assert.equal(state.asset.deletionOperationId, operationId);
});

test('expired signing leases are recovered and Storage not-found is idempotent', async () => {
  const notFound = Object.assign(new Error('Object not found'), { statusCode: 404 });
  const state = setup({ asset: privateAsset(), leases: [{ expiresAt: new Date('2025-12-31T23:59:00Z') }], removeResult: notFound });
  const result = await state.service.deleteOwnedAsset(4, 12);
  assert.equal(result.deleted, true);
  assert.equal(state.asset.removed, true);
});

test('legacy and unverified assets are never physically removed', async () => {
  const { service, calls } = setup({ asset: { ...privateAsset(), sourceKind: 'legacy_unverified', storageBucket: null, storagePath: null } });
  await assert.rejects(service.deleteOwnedAsset(4, 12), { statusCode: 409 });
  assert.equal(calls.some(([name]) => name === 'remove-object'), false);
});
