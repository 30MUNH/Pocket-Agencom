const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const schema = fs.readFileSync(path.join(__dirname, '../prisma/schema.prisma'), 'utf8');
const migrationDir = path.join(__dirname, '../prisma/migrations/20261014090000_private_asset_references');

test('private storage schema defines classification lifecycle ownership and leases', () => {
  for (const value of ['legacy_unverified', 'legacy_internal_verified', 'external_url', 'private_storage']) assert.ok(schema.includes(value));
  for (const value of ['storageBucket', 'storagePath', 'avatarMediaAssetId', 'mediaAssetId', 'MarketingPlanAsset', 'MediaAssetAccessLease', 'deletionOperationId']) assert.ok(schema.includes(value));
  assert.match(schema, /@@unique\(\[userId, id\]\)/);
});

test('forward migration preserves rows and enforces source shapes and same-owner references', () => {
  const sql = fs.readFileSync(path.join(migrationDir, 'migration.sql'), 'utf8');
  assert.match(sql, /UPDATE "media_assets"[\s\S]+source_kind[\s\S]+legacy_unverified/);
  assert.match(sql, /CHECK/);
  assert.match(sql, /\("source_kind" = 'private_storage' AND "storage_bucket" IS NOT NULL AND "storage_bucket" IN/);
  assert.match(sql, /FOREIGN KEY \("user_id", "media_asset_id"\)/);
  assert.match(sql, /ON DELETE RESTRICT/);
  assert.doesNotMatch(sql, /DELETE FROM|DROP TABLE|TRUNCATE/i);
});
