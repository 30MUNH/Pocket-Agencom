const prisma = require('../config/prisma');
const { randomUUID } = require('node:crypto');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { AppError } = require('../middleware/errorHandler');
const aiConfig = require('./ai/aiConfig');

const PROVIDER = 'gemini';
const VERSION = 'mrl-768-v1';
let embeddingModelInstance = null;

function getEmbeddingModel() {
  const rawKey = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
  const apiKey = rawKey.split(/[,;\n]+/).map((k) => k.trim()).filter(Boolean)[0] || '';
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured for RAG embeddings.');
  if (!aiConfig.freeTierConfirmed.gemini || !aiConfig.embedding.verifiedFreeModels.includes(aiConfig.embedding.model)) {
    throw new Error('Gemini free-tier eligibility is not confirmed for the configured RAG embedding model.');
  }
  if (!embeddingModelInstance) {
    embeddingModelInstance = new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: aiConfig.embedding.model });
  }
  return embeddingModelInstance;
}

async function generateEmbedding(text) {
  const result = await getEmbeddingModel().embedContent({
    content: { parts: [{ text }] }, outputDimensionality: aiConfig.embedding.dimensions,
  });
  return checkedVector(result?.embedding?.values);
}

function checkedVector(values) {
  if (!Array.isArray(values) || values.length !== aiConfig.embedding.dimensions
    || values.some((value) => !Number.isFinite(value))) {
    throw new Error(`Invalid embedding dimensions: expected ${aiConfig.embedding.dimensions}, got ${values?.length}`);
  }
  return values;
}

function positiveId(value) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

function actorIds(context) {
  return { userId: positiveId(context?.userId), businessProfileId: positiveId(context?.businessProfileId) };
}

function requirePrivateActor(context) {
  const ids = actorIds(context);
  if (!ids.userId || !ids.businessProfileId) throw new AppError('Authenticated business context is required.', 403);
  return ids;
}

function contentText(content) {
  if (typeof content !== 'string' || !content.trim()) throw new AppError('Knowledge content is required.', 400);
  return content.trim();
}

function safeMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return {};
  const blocked = new Set(['scope', 'ownerUserId', 'businessProfileId', 'approvedByUserId', 'approvedAt',
    'embeddingModel', 'embeddingProvider', 'embeddingVersion', 'embeddingDimensions', 'userId']);
  return Object.fromEntries(Object.entries(metadata).filter(([key]) => !blocked.has(key)));
}

function validUuid(id) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id));
}

function createRagService({ prismaClient = prisma, embed = generateEmbedding } = {}) {
  async function findSimilarStrategies(userQuery, context, limit = 3) {
    const { userId, businessProfileId } = actorIds(context);
    if (!userId || typeof userQuery !== 'string' || !userQuery.trim()) return [];
    try {
      const actor = await prismaClient.$queryRaw`
        SELECT u.id AS user_id, bp.id AS business_profile_id
        FROM users u LEFT JOIN business_profiles bp ON bp.user_id = u.id AND bp.id = ${businessProfileId}
        WHERE u.id = ${userId} AND u.status = 'active'
      `;
      if (!actor.length) return [];
      const vector = JSON.stringify(checkedVector(await embed(userQuery)));
      const n = Number(limit);
      const boundedLimit = Number.isSafeInteger(n) ? Math.min(Math.max(n, 1), 10) : 3;
      return await prismaClient.$queryRaw`
        SELECT kb.id, kb.content, kb.metadata,
               1 - (kb.embedding <=> ${vector}::vector) AS similarity
        FROM knowledge_base kb
        JOIN users u ON u.id = ${userId} AND u.status = 'active'
        LEFT JOIN business_profiles bp ON bp.user_id = u.id AND bp.id = ${businessProfileId}
        WHERE kb.embedding IS NOT NULL
          AND kb.embedding_provider = ${PROVIDER}
          AND kb.embedding_model = ${aiConfig.embedding.model}
          AND kb.embedding_version = ${VERSION}
          AND kb.embedding_dimensions = ${aiConfig.embedding.dimensions}
          AND ((kb.scope = 'approved_global' AND kb.approved_by_user_id IS NOT NULL AND kb.approved_at IS NOT NULL)
            OR (kb.scope = 'tenant_private' AND kb.owner_user_id = u.id AND kb.business_profile_id = bp.id))
        ORDER BY kb.embedding <=> ${vector}::vector
        LIMIT ${boundedLimit}
      `;
    } catch (error) {
      console.warn('[RAG Notice] Search unavailable:', error.message || error);
      return [];
    }
  }

  async function saveToKnowledgeBase(content, metadata = {}, context) {
    const { userId, businessProfileId } = requirePrivateActor(context);
    const body = contentText(content);
    const vector = JSON.stringify(checkedVector(await embed(body)));
    const rows = await prismaClient.$queryRaw`
      INSERT INTO knowledge_base (id, content, metadata, embedding, scope, owner_user_id, business_profile_id,
        embedding_provider, embedding_model, embedding_version, embedding_dimensions)
      SELECT ${randomUUID()}::uuid, ${body}, ${JSON.stringify(safeMetadata(metadata))}::jsonb, ${vector}::vector,
        'tenant_private', u.id, bp.id, ${PROVIDER}, ${aiConfig.embedding.model}, ${VERSION}, ${aiConfig.embedding.dimensions}
      FROM users u JOIN business_profiles bp ON bp.user_id = u.id AND bp.id = ${businessProfileId}
      WHERE u.id = ${userId} AND u.status = 'active'
      RETURNING id, content, metadata, scope, owner_user_id, business_profile_id
    `;
    if (!rows.length) throw new AppError('Authenticated business context is invalid.', 403);
    return rows[0];
  }

  async function saveApprovedGlobalKnowledge(content, metadata = {}, context) {
    const adminUserId = positiveId(context?.adminUserId);
    if (!adminUserId) throw new AppError('An active admin is required to approve global knowledge.', 403);
    const body = contentText(content);
    const vector = JSON.stringify(checkedVector(await embed(body)));
    const rows = await prismaClient.$queryRaw`
      INSERT INTO knowledge_base (id, content, metadata, embedding, scope, approved_by_user_id, approved_at,
        embedding_provider, embedding_model, embedding_version, embedding_dimensions)
      SELECT ${randomUUID()}::uuid, ${body}, ${JSON.stringify(safeMetadata(metadata))}::jsonb, ${vector}::vector,
        'approved_global', u.id, CURRENT_TIMESTAMP, ${PROVIDER}, ${aiConfig.embedding.model}, ${VERSION}, ${aiConfig.embedding.dimensions}
      FROM users u WHERE u.id = ${adminUserId} AND u.role = 'admin' AND u.status = 'active'
      RETURNING id, content, metadata, scope, approved_by_user_id
    `;
    if (!rows.length) throw new AppError('Only an active admin may approve global knowledge.', 403);
    return rows[0];
  }

  async function updateKnowledgeBase(id, content, metadata = {}, context) {
    const { userId, businessProfileId } = requirePrivateActor(context);
    if (!validUuid(id)) throw new AppError('Knowledge record not found.', 404);
    const body = contentText(content);
    const vector = JSON.stringify(checkedVector(await embed(body)));
    const rows = await prismaClient.$queryRaw`
      UPDATE knowledge_base kb
      SET content = ${body}, metadata = ${JSON.stringify(safeMetadata(metadata))}::jsonb,
          embedding = ${vector}::vector, embedding_provider = ${PROVIDER},
          embedding_model = ${aiConfig.embedding.model}, embedding_version = ${VERSION},
          embedding_dimensions = ${aiConfig.embedding.dimensions}
      WHERE kb.id = ${id}::uuid AND kb.scope = 'tenant_private'
        AND kb.owner_user_id = ${userId} AND kb.business_profile_id = ${businessProfileId}
        AND EXISTS (SELECT 1 FROM users u JOIN business_profiles bp ON bp.user_id = u.id
          WHERE u.id = ${userId} AND u.status = 'active' AND bp.id = ${businessProfileId})
      RETURNING id, content, metadata, scope
    `;
    if (!rows.length) throw new AppError('Knowledge record not found.', 404);
    return rows[0];
  }

  async function deleteKnowledgeBase(id, context) {
    const { userId, businessProfileId } = requirePrivateActor(context);
    if (!validUuid(id)) throw new AppError('Knowledge record not found.', 404);
    const rows = await prismaClient.$queryRaw`
      DELETE FROM knowledge_base kb
      WHERE kb.id = ${id}::uuid AND kb.scope = 'tenant_private'
        AND kb.owner_user_id = ${userId} AND kb.business_profile_id = ${businessProfileId}
        AND EXISTS (SELECT 1 FROM users u JOIN business_profiles bp ON bp.user_id = u.id
          WHERE u.id = ${userId} AND u.status = 'active' AND bp.id = ${businessProfileId})
      RETURNING id
    `;
    if (!rows.length) throw new AppError('Knowledge record not found.', 404);
    return { deleted: true };
  }

  async function reindexKnowledgeBase() {
    throw new AppError('Legacy knowledge requires individual review before reindexing.', 403);
  }

  return { findSimilarStrategies, saveToKnowledgeBase, saveApprovedGlobalKnowledge,
    updateKnowledgeBase, deleteKnowledgeBase, reindexKnowledgeBase };
}

module.exports = { generateEmbedding, getEmbeddingModel, createRagService, ...createRagService() };
