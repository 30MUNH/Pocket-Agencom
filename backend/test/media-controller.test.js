const test = require('node:test');
const assert = require('node:assert/strict');

const mediaServicePath = require.resolve('../src/services/mediaService');
const originalMediaServiceModule = require.cache[mediaServicePath];
require.cache[mediaServicePath] = { id: mediaServicePath, filename: mediaServicePath, loaded: true, exports: {} };
const mediaAccessModule = require('../src/services/mediaAccessService');
const originalFactory = mediaAccessModule.createMediaAccessService;
mediaAccessModule.createMediaAccessService = () => ({
  async getAuthorizedMediaAccess(input) {
    return { url: 'https://storage.example/signed', expiresAt: '2030-01-01T00:10:00.000Z', temporary: true, input };
  },
});
const mediaController = require('../src/controllers/mediaController');
test.after(() => {
  mediaAccessModule.createMediaAccessService = originalFactory;
  if (originalMediaServiceModule) require.cache[mediaServicePath] = originalMediaServiceModule;
  else delete require.cache[mediaServicePath];
});

test('media access controller delegates to the configured access service', async () => {
  const req = { user: { id: 4 }, params: { id: '12' }, query: { download: 'true' } };
  const res = {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  let forwardedError;
  await mediaController.getMediaAssetAccess(req, res, (error) => { forwardedError = error; });

  assert.equal(forwardedError, undefined);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.temporary, true);
  assert.deepEqual(res.body.data.input, { requester: req.user, assetId: '12', disposition: 'attachment' });
});
