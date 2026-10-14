const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { auditRecords } = require('../src/services/storageReferenceAudit');

test('classifies avatar post marketing plan and JSON references', () => {
  const report = auditRecords({
    users: [{ id: 'u1', avatarUrl: 'https://cdn.example/avatar.png', avatarMediaAssetId: 'a1' }],
    scheduledPosts: [{ id: 7, userId: 'u1', imageUrl: 'https://project.supabase.co/storage/v1/object/public/media/pic.png', content: 'Post\n\n[IMAGE_URL: https://external.example/photo.png]' }],
    marketingPlans: [{ id: 9, userId: 'u1', contentIdeas: JSON.stringify([{ imageUrl: 'https://external.example/idea.png' }]), videoScripts: null, checklist: null, playbook: null, seoKeywords: null, budgetBreakdown: null }],
    templates: [{ id: 2, fileUrl: 'https://cdn.example/file.png', previewImage: 'https://cdn.example/preview.png' }],
    mediaAssets: [{ id: 'a1', userId: 'u1', url: 'https://external.example/owned.png' }],
    marketingPlanAssets: [{ marketingPlanId: 9, mediaAssetId: 'a1' }],
  }, { supabaseProjectHost: 'project.supabase.co', buckets: ['media'] });
  const fields = report.references.map((item) => item.field);
  assert.ok(fields.includes('User.avatarUrl'));
  assert.ok(fields.includes('User.avatarMediaAssetId'));
  assert.ok(fields.includes('ScheduledPost.imageUrl'));
  assert.ok(fields.includes('ScheduledPost.content[IMAGE_URL]'));
  assert.ok(fields.includes('MarketingPlan.contentIdeas'));
  assert.ok(fields.includes('Template.fileUrl'));
  assert.ok(fields.includes('Template.previewImage'));
  assert.ok(fields.includes('MarketingPlanAsset.mediaAssetId'));
  assert.equal(report.mediaAssets[0].classification, 'legacy_unverified');
});

test('redacts URL credentials signed tokens and user content', () => {
  const report = auditRecords({
    users: [{ id: 'u1', avatarUrl: 'https://name:password@example.test/a.png?token=secret' }],
    scheduledPosts: [{ id: 1, userId: 'u1', imageUrl: null, content: 'private campaign words https://x.test/i.png?signature=secret' }],
    marketingPlans: [{ id: 2, userId: 'u1', contentIdeas: JSON.stringify({ narrative: 'private campaign words', image: 'https://x.test/i.png?token=secret' }) }],
  });
  const output = JSON.stringify(report);
  for (const secret of ['password', 'secret', 'private campaign words', 'token=']) assert.equal(output.includes(secret), false);
});

test('read-only inventory queries current Prisma URL-bearing fields only', () => {
  const script = fs.readFileSync(require.resolve('../scripts/audit-storage-references'), 'utf8');
  assert.match(script, /tx\.template\.findMany\(\{ select: \{ id: true, fileUrl: true, previewImage: true \} \}\)/);
  assert.doesNotMatch(script, /tx\.businessProfile\.findMany/);
  assert.match(script, /SET TRANSACTION READ ONLY/);
});
