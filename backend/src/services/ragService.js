const prisma = require('../config/prisma');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });

// Returns a 768-dim vector for the given text
async function generateEmbedding(text) {
  const result = await embeddingModel.embedContent(text);
  return result.embedding.values;
}

// Insert via Prisma (embedding omitted — Unsupported type), then set the vector with raw SQL
async function saveToKnowledgeBase(content, metadata = {}) {
  const embedding = await generateEmbedding(content);

  const record = await prisma.knowledgeBase.create({
    data: { content, metadata },
  });

  await prisma.$executeRaw`
    UPDATE knowledge_base
    SET embedding = ${JSON.stringify(embedding)}::vector
    WHERE id = ${record.id}::uuid
  `;

  return record;
}

// Top-N closest strategies by cosine distance (<=>). Returns [] on any failure
// so callers can always proceed without RAG context.
async function findSimilarStrategies(userQuery, limit = 3) {
  try {
    const embedding = await generateEmbedding(userQuery);
    const vector = JSON.stringify(embedding);

    const rows = await prisma.$queryRaw`
      SELECT id, content, metadata,
             1 - (embedding <=> ${vector}::vector) AS similarity
      FROM knowledge_base
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> ${vector}::vector
      LIMIT ${Number(limit)}
    `;

    return rows;
  } catch (err) {
    console.error('[RAG Search Error]', err.message || err);
    return [];
  }
}

module.exports = { generateEmbedding, saveToKnowledgeBase, findSimilarStrategies };
