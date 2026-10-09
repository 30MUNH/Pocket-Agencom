const prisma = require('../config/prisma');
const { GoogleGenerativeAI } = require('@google/generative-ai');

let embeddingModelInstance = null;

function getEmbeddingModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error('GEMINI_API_KEY is not configured for RAG embeddings.');
  }
  if (!embeddingModelInstance) {
    const genAI = new GoogleGenerativeAI(apiKey);
    embeddingModelInstance = genAI.getGenerativeModel({ model: 'gemini-embedding-2' });
  }
  return embeddingModelInstance;
}

// Returns a 768-dim vector for the given text using Gemini Embedding 2 MRL
async function generateEmbedding(text) {
  const model = getEmbeddingModel();
  const result = await model.embedContent({
    content: { parts: [{ text }] },
    outputDimensionality: 768,
  });

  const values = result?.embedding?.values;
  if (!Array.isArray(values) || values.length !== 768) {
    throw new Error(`Invalid embedding dimensions: expected 768, got ${values?.length}`);
  }

  return values;
}

// Insert via Prisma (embedding omitted — Unsupported type), then set the vector with raw SQL
async function saveToKnowledgeBase(content, metadata = {}) {
  const enrichedMetadata = {
    ...metadata,
    embeddingModel: 'gemini-embedding-2',
    dimensions: 768,
    createdAt: new Date().toISOString(),
  };

  const embedding = await generateEmbedding(content);

  const record = await prisma.knowledgeBase.create({
    data: { content, metadata: enrichedMetadata },
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
// Isolates vector space by filtering to gemini-embedding-2 embeddings.
async function findSimilarStrategies(userQuery, limit = 3) {
  try {
    const embedding = await generateEmbedding(userQuery);
    const vector = JSON.stringify(embedding);

    const rows = await prisma.$queryRaw`
      SELECT id, content, metadata,
             1 - (embedding <=> ${vector}::vector) AS similarity
      FROM knowledge_base
      WHERE embedding IS NOT NULL
        AND (
          metadata->>'embeddingModel' = 'gemini-embedding-2'
          OR metadata->>'embeddingModel' IS NULL
        )
      ORDER BY embedding <=> ${vector}::vector
      LIMIT ${Number(limit)}
    `;

    return rows;
  } catch (err) {
    console.warn('[RAG Notice] Search unavailable:', err.message || err);
    return [];
  }
}

// Reindex legacy records or records missing the gemini-embedding-2 model tag
async function reindexKnowledgeBase() {
  try {
    const records = await prisma.knowledgeBase.findMany();
    let reindexedCount = 0;

    for (const record of records) {
      try {
        const meta = typeof record.metadata === 'object' && record.metadata !== null ? record.metadata : {};
        if (meta.embeddingModel === 'gemini-embedding-2') {
          continue; // Already on current model
        }

        const embedding = await generateEmbedding(record.content);
        const updatedMetadata = {
          ...meta,
          embeddingModel: 'gemini-embedding-2',
          dimensions: 768,
          reindexedAt: new Date().toISOString(),
        };

        await prisma.knowledgeBase.update({
          where: { id: record.id },
          data: { metadata: updatedMetadata },
        });

        await prisma.$executeRaw`
          UPDATE knowledge_base
          SET embedding = ${JSON.stringify(embedding)}::vector
          WHERE id = ${record.id}::uuid
        `;
        reindexedCount++;
      } catch (itemErr) {
        console.warn(`[RAG Reindex] Skipped item ${record.id}:`, itemErr.message);
      }
    }

    return { total: records.length, reindexedCount };
  } catch (err) {
    console.warn('[RAG Reindex Notice] Table inaccessible:', err.message);
    return { total: 0, reindexedCount: 0 };
  }
}

module.exports = {
  generateEmbedding,
  saveToKnowledgeBase,
  findSimilarStrategies,
  reindexKnowledgeBase,
  getEmbeddingModel,
};

