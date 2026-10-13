const test = require('node:test');
const assert = require('node:assert/strict');

const clientPath = require.resolve('../src/config/supabase');
const servicePath = require.resolve('../src/services/storageService');

function loadService(upload) {
  const calls = [];
  require.cache[clientPath] = {
    id: clientPath,
    filename: clientPath,
    loaded: true,
    exports: {
      storage: {
        from(bucket) {
          return {
            async upload(path, bytes, options) {
              calls.push({ bucket, path, bytes, options });
              return upload(bucket, path);
            },
            getPublicUrl(path) {
              return { data: { publicUrl: `https://storage.example/${bucket}/${path}` } };
            },
          };
        },
      },
    },
  };
  delete require.cache[servicePath];
  return { service: require(servicePath), calls };
}

test('campaign upload fails closed without retrying in avatars', async () => {
  const prior = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const priorUrl = process.env.SUPABASE_URL;
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role';
  process.env.SUPABASE_URL = 'https://storage.example';
  try {
    const { service, calls } = loadService(() => ({ error: { message: 'row-level security policy' } }));
    await assert.rejects(
      service.uploadCampaignAsset({ originalname: 'test.png', mimetype: 'image/png', buffer: Buffer.from('x') }, 'user-7'),
      /Supabase Storage/
    );
    assert.equal(calls.length, 1);
    assert.equal(calls[0].bucket, 'campaign-assets');
  } finally {
    if (prior === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = prior;
    if (priorUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = priorUrl;
  }
});

test('upload rejects paths without an authenticated user scope', async () => {
  const prior = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const priorUrl = process.env.SUPABASE_URL;
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role';
  process.env.SUPABASE_URL = 'https://storage.example';
  try {
    const { service, calls } = loadService(() => ({ error: null }));
    await assert.rejects(
      service.uploadCampaignAsset({ originalname: 'test.png', mimetype: 'image/png', buffer: Buffer.from('x') }, 'general'),
      /user scope/
    );
    assert.equal(calls.length, 0);
  } finally {
    if (prior === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = prior;
    if (priorUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = priorUrl;
  }
});
