const prismaPath = require.resolve('../../src/config/prisma');

const users = new Set([501, 502, 99991, 99992, 88888]);
const quotas = new Map();
const scheduledPosts = new Map();
const mediaAssets = new Map();
let nextPostId = 1;
let nextAssetId = 1;
let quotaFailure = null;
let transactionQueue = Promise.resolve();

const clone = (value) => value == null ? value : structuredClone(value);

function quotaKey(where) {
  const unique = where.userId_dateKey_type;
  return `${unique.userId}:${unique.dateKey}:${unique.type}`;
}

function throwQuotaFailure() {
  if (!quotaFailure) return;
  const error = quotaFailure;
  quotaFailure = null;
  throw error;
}

const prisma = {
  aiQuotaUsage: {
    findUnique: async ({ where }) => {
      throwQuotaFailure();
      return clone(quotas.get(quotaKey(where)) || null);
    },
    findMany: async ({ where }) => {
      throwQuotaFailure();
      return [...quotas.values()]
        .filter((record) => record.userId === where.userId && record.dateKey === where.dateKey)
        .map(clone);
    },
    upsert: async ({ where, update, create }) => {
      throwQuotaFailure();
      const key = quotaKey(where);
      const current = quotas.get(key);
      const next = current
        ? { ...current, count: current.count + update.count.increment }
        : { ...create };
      quotas.set(key, next);
      return clone(next);
    },
  },
  scheduledPost: {
    create: async ({ data }) => {
      if (!users.has(data.userId)) {
        const error = new Error('Foreign key constraint failed on scheduled_posts_user_id_fkey');
        error.code = 'P2003';
        throw error;
      }
      const post = { id: nextPostId++, ...clone(data) };
      scheduledPosts.set(post.id, post);
      return clone(post);
    },
    findMany: async ({ where }) => [...scheduledPosts.values()]
      .filter((post) => post.userId === where.userId)
      .map(clone),
    findUnique: async ({ where }) => clone(scheduledPosts.get(where.id) || null),
    update: async ({ where, data }) => {
      const existing = scheduledPosts.get(where.id);
      if (!existing) throw Object.assign(new Error('Record not found'), { code: 'P2025' });
      const updated = { ...existing, ...clone(data) };
      scheduledPosts.set(where.id, updated);
      return clone(updated);
    },
    delete: async ({ where }) => {
      const existing = scheduledPosts.get(where.id);
      if (!existing) throw Object.assign(new Error('Record not found'), { code: 'P2025' });
      scheduledPosts.delete(where.id);
      return clone(existing);
    },
  },
  mediaAsset: {
    create: async ({ data }) => {
      if (!users.has(data.userId)) {
        const error = new Error('Foreign key constraint failed on media_assets_user_id_fkey');
        error.code = 'P2003';
        throw error;
      }
      const asset = { id: nextAssetId++, ...clone(data), createdAt: new Date() };
      mediaAssets.set(asset.id, asset);
      return clone(asset);
    },
    findMany: async ({ where }) => [...mediaAssets.values()]
      .filter((asset) => asset.userId === where.userId)
      .map(clone),
    findUnique: async ({ where }) => clone(mediaAssets.get(where.id) || null),
    delete: async ({ where }) => {
      const existing = mediaAssets.get(where.id);
      if (!existing) throw Object.assign(new Error('Record not found'), { code: 'P2025' });
      mediaAssets.delete(where.id);
      return clone(existing);
    },
  },
  $transaction: async (callback) => {
    const previous = transactionQueue;
    let release;
    transactionQueue = new Promise((resolve) => { release = resolve; });
    await previous;
    try {
      return await callback(prisma);
    } finally {
      release();
    }
  },
};

prisma.__fixture = {
  failNextQuotaOperation(error = new Error('Fixture database unavailable')) {
    quotaFailure = error;
  },
  resetQuota(userId, dateKey, type = 'text') {
    quotas.delete(`${userId}:${dateKey}:${type}`);
  },
};

require.cache[prismaPath] = {
  id: prismaPath,
  filename: prismaPath,
  loaded: true,
  exports: prisma,
};

module.exports = prisma;
