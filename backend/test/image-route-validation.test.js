const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');

function loadRoutes() {
  let providerCalls = 0;
  const authPath = require.resolve('../src/middleware/authMiddleware');
  require.cache[authPath] = { id: authPath, filename: authPath, loaded: true, exports: {
    authMiddleware(req, _res, next) { req.user = { id: 4, role: 'user' }; next(); },
    requireRole() { return (_req, _res, next) => next(); },
  } };
  for (const [path, name] of [
    ['../src/controllers/mediaController', 'generateImage'],
    ['../src/controllers/marketingPlanController', 'generateSocialImage'],
  ]) {
    const id = require.resolve(path);
    const handler = (_req, res) => { providerCalls += 1; res.json({ ok: true }); };
    const other = (_req, res) => res.json({ ok: true });
    require.cache[id] = { id, filename: id, loaded: true, exports: new Proxy({}, { get: (_target, key) => key === name ? handler : other }) };
  }
  for (const path of ['../src/routes/mediaRoutes', '../src/routes/marketingPlanRoutes']) delete require.cache[require.resolve(path)];
  const app = express();
  app.use(express.json());
  app.use('/api/media', require('../src/routes/mediaRoutes'));
  app.use('/api/marketing-plans', require('../src/routes/marketingPlanRoutes'));
  return { app, calls: () => providerCalls };
}

test('both image endpoints reject missing, oversized and unsupported input before provider work', async () => {
  const { app, calls } = loadRoutes();
  for (const endpoint of ['/api/media/generate-image', '/api/marketing-plans/generate-image']) {
    for (const body of [
      {},
      { prompt: 'A'.repeat(1001) },
      { prompt: 'Coffee photo', aspectRatio: '2:1' },
      { prompt: 7 },
    ]) {
      const response = await request(app).post(endpoint).send(body);
      assert.equal(response.status, 422, `${endpoint}: ${JSON.stringify(body).slice(0, 40)}`);
    }
  }
  assert.equal(calls(), 0);
  assert.equal((await request(app).post('/api/media/generate-image').send({ prompt: 'Coffee photo', aspectRatio: '1:1' })).status, 200);
  assert.equal(calls(), 1);
});
