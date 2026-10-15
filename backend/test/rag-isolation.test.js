const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
require('./helpers/installPrismaFixture');
const { createRagService } = require('../src/services/ragService');

const vector = [1, ...Array(767).fill(0)];

function fixture({ active = true, businessProfileId = 81, rows = [] } = {}) {
  const queries = [];
  const prismaClient = {
    $queryRaw: async (strings, ...values) => {
      const sql = strings.join('?');
      queries.push({ sql, values });
      if (sql.includes('FROM users u') && !sql.includes('FROM knowledge_base')) {
        return active ? [{ user_id: 51, business_profile_id: businessProfileId }] : [];
      }
      return rows;
    },
  };
  let embeddings = 0;
  const service = createRagService({ prismaClient, embed: async () => { embeddings += 1; return vector; } });
  return { service, queries, get embeddings() { return embeddings; } };
}

test('RAG refuses missing or inactive authenticated context before embedding', async () => {
  const f = fixture({ active: false });
  assert.deepEqual(await f.service.findSimilarStrategies('coffee', null), []);
  assert.deepEqual(await f.service.findSimilarStrategies('coffee', { userId: 51, businessProfileId: 81 }), []);
  assert.equal(f.embeddings, 0);
});

test('RAG query verifies the business in SQL and excludes legacy or mismatched vectors', async () => {
  const f = fixture({ rows: [{ id: 'allowed' }] });
  assert.deepEqual(await f.service.findSimilarStrategies('coffee', { userId: 51, businessProfileId: 81 }), [{ id: 'allowed' }]);
  const retrieval = f.queries.find(({ sql }) => sql.includes('FROM knowledge_base'));
  assert.match(retrieval.sql, /tenant_private/);
  assert.match(retrieval.sql, /approved_global/);
  assert.match(retrieval.sql, /owner_user_id/);
  assert.match(retrieval.sql, /business_profile_id/);
  assert.match(retrieval.sql, /embedding_model/);
  assert.match(retrieval.sql, /embedding_dimensions/);
  assert.doesNotMatch(retrieval.sql, /embeddingModel.*IS NULL/);
  assert.ok(retrieval.values.includes(51));
  assert.ok(retrieval.values.includes(81));
});

test('RAG writes require explicit private or admin-approved global operations', async () => {
  const f = fixture();
  await assert.rejects(() => f.service.saveToKnowledgeBase('coffee', {}, null), /authenticated/i);
  await assert.rejects(() => f.service.saveApprovedGlobalKnowledge('coffee', {}, null), /admin/i);
  await assert.rejects(() => f.service.updateKnowledgeBase('00000000-0000-0000-0000-000000000001', 'coffee', {}, null), /authenticated/i);
  await assert.rejects(() => f.service.deleteKnowledgeBase('00000000-0000-0000-0000-000000000001', null), /authenticated/i);
  assert.equal(f.embeddings, 0);
});

test('unreviewed legacy records cannot be bulk reindexed', async () => {
  const f = fixture();
  await assert.rejects(() => f.service.reindexKnowledgeBase(), /review/i);
});

test('legacy seed command cannot delete or silently reclassify existing knowledge', () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../scripts/seedRag.js'), 'utf8');
  assert.doesNotMatch(source, /knowledgeBase\.deleteMany/);
  assert.doesNotMatch(source, /saveToKnowledgeBase\(item\.content, item\.metadata\)/);
});

test('Marketing Plan passes server-derived business context and works with no permitted RAG rows', async () => {
  const ragPath = require.resolve('../src/services/ragService');
  const aiPath = require.resolve('../src/services/ai/aiService');
  const rag = require(ragPath);
  const original = rag.findSimilarStrategies;
  let receivedContext;
  rag.findSimilarStrategies = async (_query, context) => { receivedContext = context; return []; };
  delete require.cache[aiPath];
  try {
    const ai = require(aiPath);
    ai.generateStructuredContent = async () => ({ data: { contentIdeas: ['safe'] } });
    const result = await ai.generateMarketingPlan(501, {
      businessType: 'Coffee', campaignType: 'awareness', goal: 'Visits', productDescription: 'Coffee',
    }, { id: 81 });
    assert.deepEqual(receivedContext, { userId: 501, businessProfileId: 81 });
    assert.deepEqual(result, { contentIdeas: ['safe'] });
  } finally {
    rag.findSimilarStrategies = original;
    delete require.cache[aiPath];
  }
});
