const test = require('node:test');
const assert = require('node:assert/strict');

function loadServices(prisma, ai) {
  for (const [path, exports] of [
    ['../src/config/prisma', prisma],
    ['../src/services/ai/aiService', ai],
  ]) {
    const id = require.resolve(path);
    require.cache[id] = { id, filename: id, loaded: true, exports };
  }
  for (const path of ['../src/services/marketingPlanService', '../src/services/mediaService', '../src/services/scheduledPostService']) {
    delete require.cache[require.resolve(path)];
  }
  return {
    plans: require('../src/services/marketingPlanService'),
    media: require('../src/services/mediaService'),
    posts: require('../src/services/scheduledPostService'),
  };
}

test('foreign business IDs cannot reach AI providers or create media and posts', async () => {
  const effects = [];
  const prisma = {
    businessProfile: {
      async findFirst({ where }) { return where.id === 11 && where.userId === 4 ? { id: 11, userId: 4, businessType: 'Coffee' } : null; },
      async findUnique({ where }) { return { id: where.id, userId: 8, businessType: 'Private' }; },
    },
    mediaAsset: { async create() { effects.push('media'); return { id: 1 }; } },
    scheduledPost: { async create() { effects.push('post'); return { id: 1 }; } },
  };
  const ai = {
    async generateImagePrompt() { effects.push('prompt'); return { imagePrompt: 'private' }; },
    async generateSocialImage() { effects.push('image'); return { mediaAssetId: 1 }; },
  };
  const { plans, media, posts } = loadServices(prisma, ai);
  await assert.rejects(plans.generateImagePrompt(4, { postContent: 'Fresh coffee', businessProfileId: 22 }), { statusCode: 404 });
  await assert.rejects(plans.generateSocialImage(4, { prompt: 'Fresh coffee', businessProfileId: 22 }), { statusCode: 404 });
  await assert.rejects(media.uploadMediaAsset(4, { name: 'photo', url: 'https://example.com/a.png', businessProfileId: 22 }), { statusCode: 404 });
  await assert.rejects(posts.createScheduledPost(4, { title: 'Post', content: 'Copy', businessProfileId: 22 }), { statusCode: 404 });
  assert.deepEqual(effects, []);
});

test('same-user business IDs continue to support image prompts and media registration', async () => {
  const effects = [];
  const prisma = {
    businessProfile: { async findFirst({ where }) { return where.id === 11 && where.userId === 4 ? { id: 11, userId: 4, businessType: 'Coffee', usp: 'Fresh' } : null; } },
    mediaAsset: { async create({ data }) { effects.push(data.businessProfileId); return { id: 1, ...data }; } },
  };
  const ai = { async generateImagePrompt({ brandContext }) { effects.push(brandContext); return { imagePrompt: 'Fresh coffee' }; } };
  const { plans, media } = loadServices(prisma, ai);
  assert.deepEqual(await plans.generateImagePrompt(4, { postContent: 'Fresh coffee', businessProfileId: 11 }), { imagePrompt: 'Fresh coffee' });
  await media.uploadMediaAsset(4, { name: 'photo', url: 'https://example.com/a.png', businessProfileId: 11 });
  assert.deepEqual(effects, ['Coffee - USP: Fresh - Giọng điệu: ', 11]);
});

test('failed AI plan validation cannot enter the persistence transaction', async () => {
  let writes = 0;
  const prisma = {
    businessProfile: { async findUnique() { return null; } },
    async $transaction() { writes += 1; throw new Error('unexpected persistence'); },
  };
  const ai = { async generateMarketingPlan() { throw Object.assign(new Error('AI returned an incomplete Marketing Plan. Please retry generation.'), { statusCode: 502 }); } };
  const { plans } = loadServices(prisma, ai);
  await assert.rejects(plans.generatePlan(4, { businessType: 'Coffee', campaignType: 'Launch', productDescription: 'Fresh coffee', targetCustomer: 'Adults', goal: 'Grow sales' }), { statusCode: 502 });
  assert.equal(writes, 0);
});
