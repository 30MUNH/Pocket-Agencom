const test = require('node:test');
const assert = require('node:assert/strict');

function loadScheduledPostService(prisma) {
  const prismaPath = require.resolve('../src/config/prisma');
  const servicePath = require.resolve('../src/services/scheduledPostService');
  require.cache[prismaPath] = { id: prismaPath, filename: prismaPath, loaded: true, exports: prisma };
  delete require.cache[servicePath];
  return require('../src/services/scheduledPostService');
}

function transactionClient({ asset, created, existing }) {
  const writes = [];
  const tx = {
    async $queryRaw() { writes.push(['lock']); },
    mediaAsset: { async findUnique() { return asset; } },
    scheduledPost: {
      async create({ data }) { writes.push(['create', data]); return { id: 2, ...data }; },
      async findUnique() { return existing; },
      async update({ data }) { writes.push(['update', data]); return { ...existing, ...data }; },
    },
  };
  return { writes, prisma: { async $transaction(callback) { return callback(tx); }, scheduledPost: tx.scheduledPost } };
}

test('new scheduled attachment persists owner-checked MediaAsset ID without URL markers', async () => {
  const { writes, prisma } = transactionClient({ asset: { id: 8, userId: 4, lifecycleState: 'active' } });
  const service = loadScheduledPostService(prisma);
  await service.createScheduledPost(4, { title: 't', content: 'post\n\n[IMAGE_URL: https://old.example/p.png]', mediaAssetId: 8, imageUrl: 'https://signed.invalid/x?token=secret' });
  const data = writes.find(([name]) => name === 'create')[1];
  assert.equal(data.mediaAssetId, 8);
  assert.equal(data.imageUrl, null);
  assert.equal(data.content, 'post');
  assert.equal(data.content.includes('signed.invalid'), false);
});

test('foreign assets and internal Storage URLs are rejected on scheduled post writes', async () => {
  const foreign = transactionClient({ asset: { id: 8, userId: 99, lifecycleState: 'active' } });
  await assert.rejects(loadScheduledPostService(foreign.prisma).createScheduledPost(4, { title: 't', content: 'post', mediaAssetId: 8 }), { statusCode: 404 });
  const internal = transactionClient({ asset: null });
  const previousHost = process.env.SUPABASE_URL;
  process.env.SUPABASE_URL = 'https://project.supabase.co';
  await assert.rejects(loadScheduledPostService(internal.prisma).createScheduledPost(4, { title: 't', content: 'post', imageUrl: 'https://project.supabase.co/storage/v1/object/public/campaign-assets/user-4/x.png' }), { statusCode: 400 });
  if (previousHost === undefined) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL = previousHost;
});

test('legacy external URLs and image markers remain readable and editable', () => {
  const { formatPostWithImage } = loadScheduledPostService({});
  const post = formatPostWithImage({ id: 1, content: 'copy\n\n[IMAGE_URL: https://external.example/x.png]' });
  assert.equal(post.imageUrl, 'https://external.example/x.png');
  assert.equal(post.content, 'copy');
});
