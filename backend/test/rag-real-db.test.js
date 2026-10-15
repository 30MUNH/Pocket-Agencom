const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');

if (process.env.PA_REAL_DB_E2E !== 'true' || process.env.NODE_ENV === 'test') {
  throw new Error('Real RAG isolation requires the opted-in real database runner.');
}
const appEnv = dotenv.parse(fs.readFileSync(path.resolve(__dirname, '../.env')));
const direct = new URL(appEnv.DIRECT_URL);
if (direct.hostname !== 'aws-1-ap-southeast-1.pooler.supabase.com' || direct.port !== '5432'
  || !appEnv.SUPABASE_URL?.includes('jypgdzzwmzqkcsaqaerj.supabase.co')) {
  throw new Error('Verified Pocket Agencom Supabase target mismatch.');
}
process.env.FREE_ONLY_MODE = 'true';
process.env.AI_ALLOW_PAID_MODELS = 'false';
const { PrismaClient } = require('@prisma/client');
const { createRagService } = require('../src/services/ragService');
const prisma = new PrismaClient({ datasources: { db: { url: appEnv.DIRECT_URL } } });
const runPrefix = `pa-rag-e2e-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
const vector = [1, ...Array(767).fill(0)];
const rag = createRagService({ prismaClient: prisma, embed: async () => vector });

test('real PostgreSQL RAG isolation and write authorization', { timeout: 180000 }, async (t) => {
  t.after(async () => {
    try {
      // Every synthetic knowledge row carries this random run marker. Legacy rows do not.
      await prisma.$executeRaw`DELETE FROM knowledge_base WHERE metadata->>'testRun' = ${runPrefix}`;
      const users = await prisma.user.findMany({
        where: { email: { startsWith: runPrefix } }, select: { id: true },
      });
      const ids = users.map(({ id }) => id);
      await prisma.businessProfile.deleteMany({ where: { userId: { in: ids } } });
      await prisma.user.deleteMany({ where: { id: { in: ids }, email: { startsWith: runPrefix } } });
      assert.equal(await prisma.user.count({ where: { email: { startsWith: runPrefix } } }), 0);
      const remaining = await prisma.$queryRaw`SELECT count(*)::int AS n FROM knowledge_base WHERE metadata->>'testRun' = ${runPrefix}`;
      assert.equal(remaining[0].n, 0);
    } finally {
      await prisma.$disconnect();
    }
  });

  const identity = await prisma.$queryRaw`SELECT current_database() AS database, current_schema() AS schema`;
  assert.deepEqual(identity[0], { database: 'postgres', schema: 'public' });
  const legacyBefore = await prisma.$queryRaw`SELECT count(*)::int AS n FROM knowledge_base WHERE scope = 'unclassified'`;
  assert.equal(legacyBefore[0].n, 7);

  const owner = await prisma.user.create({ data: {
    name: 'RAG Owner', email: `${runPrefix}-owner@example.test`, passwordHash: 'test-only', role: 'user', status: 'active',
  } });
  const other = await prisma.user.create({ data: {
    name: 'RAG Other', email: `${runPrefix}-other@example.test`, passwordHash: 'test-only', role: 'user', status: 'active',
  } });
  const admin = await prisma.user.create({ data: {
    name: 'RAG Admin', email: `${runPrefix}-admin@example.test`, passwordHash: 'test-only', role: 'admin', status: 'active',
  } });
  const ownerBusiness = await prisma.businessProfile.create({ data: {
    userId: owner.id, businessType: 'Coffee', productDescription: 'Test coffee', targetCustomer: 'Test adults',
  } });
  const otherBusiness = await prisma.businessProfile.create({ data: {
    userId: other.id, businessType: 'Bakery', productDescription: 'Test bread', targetCustomer: 'Test adults',
  } });
  const own = { userId: owner.id, businessProfileId: ownerBusiness.id };
  const foreign = { userId: other.id, businessProfileId: otherBusiness.id };
  const forged = { userId: owner.id, businessProfileId: otherBusiness.id };

  assert.deepEqual(await rag.findSimilarStrategies('coffee', own), [], 'all seven unclassified legacy rows must be excluded');
  await assert.rejects(() => rag.saveToKnowledgeBase('bad', { testRun: runPrefix }, forged), /invalid/i);
  await assert.rejects(() => rag.saveApprovedGlobalKnowledge('bad', { testRun: runPrefix }, { adminUserId: owner.id }), /admin/i);
  const privateRow = await rag.saveToKnowledgeBase('private coffee', { testRun: runPrefix, scope: 'approved_global' }, own);
  assert.equal(privateRow.scope, 'tenant_private', 'metadata cannot change scope');
  assert.equal((await rag.findSimilarStrategies('coffee', own)).length, 1);
  assert.deepEqual(await rag.findSimilarStrategies('coffee', foreign), []);
  assert.deepEqual(await rag.findSimilarStrategies('coffee', forged), []);
  assert.deepEqual(await rag.findSimilarStrategies('coffee', null), []);

  await assert.rejects(() => rag.updateKnowledgeBase(privateRow.id, 'forged', { testRun: runPrefix }, forged), /not found/i);
  await assert.rejects(() => rag.deleteKnowledgeBase(privateRow.id, foreign), /not found/i);
  const globalRow = await rag.saveApprovedGlobalKnowledge('approved global', { testRun: runPrefix }, { adminUserId: admin.id });
  assert.equal(globalRow.scope, 'approved_global');
  assert.equal((await rag.findSimilarStrategies('coffee', foreign)).length, 1, 'other tenant sees approved global only');
  assert.equal((await rag.findSimilarStrategies('coffee', forged)).length, 1, 'forged business context reveals no private row');
  await assert.rejects(() => rag.updateKnowledgeBase(globalRow.id, 'forged', { testRun: runPrefix }, own), /not found/i);
  await assert.rejects(() => rag.deleteKnowledgeBase(globalRow.id, own), /not found/i);

  const mismatchId = crypto.randomUUID();
  await prisma.$executeRaw`
    INSERT INTO knowledge_base (id, content, metadata, embedding, scope, owner_user_id, business_profile_id,
      embedding_provider, embedding_model, embedding_version, embedding_dimensions)
    VALUES (${mismatchId}::uuid, 'wrong model', ${JSON.stringify({ testRun: runPrefix })}::jsonb,
      ${JSON.stringify(vector)}::vector, 'tenant_private', ${owner.id}, ${ownerBusiness.id},
      'gemini', 'other-model', 'mrl-768-v1', 768)
  `;
  const visible = await rag.findSimilarStrategies('coffee', own);
  assert.equal(visible.length, 2);
  assert.ok(visible.every((row) => row.id !== mismatchId), 'incompatible model is excluded');

  const updated = await rag.updateKnowledgeBase(privateRow.id, 'updated private coffee', { testRun: runPrefix, scope: 'approved_global' }, own);
  assert.equal(updated.scope, 'tenant_private');
  assert.equal(updated.content, 'updated private coffee');
  assert.deepEqual(await rag.deleteKnowledgeBase(privateRow.id, own), { deleted: true });
  assert.equal((await rag.findSimilarStrategies('coffee', own)).length, 1, 'approved global survives private deletion');
  const legacyAfter = await prisma.$queryRaw`SELECT count(*)::int AS n FROM knowledge_base WHERE scope = 'unclassified'`;
  assert.equal(legacyAfter[0].n, 7);
});
