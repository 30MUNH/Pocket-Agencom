const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createWebhookGateway } = require('../scripts/sepay-webhook-gateway');

test('gateway exposes only health and SePay POST, preserving raw bytes and auth headers', async () => {
  let upstream;
  const gateway = createWebhookGateway({ fetchImpl: async (url, options) => {
    upstream = { url: String(url), ...options };
    return new Response('{"success":true}', { status: 200 });
  } });
  assert.equal((await request(gateway).get('/api/auth/me')).status, 404);
  assert.equal((await request(gateway).post('/api/payments/orders').send({})).status, 404);
  assert.equal((await request(gateway).get('/health')).status, 200);
  assert.equal(upstream, undefined);
  const raw = '{ "id": 1, "content": "PA123456789012" }';
  const res = await request(gateway).post('/api/payments/webhooks/sepay').set('Content-Type', 'application/json')
    .set('Authorization', 'Apikey test-secret').set('X-SePay-Timestamp', '1234567890').set('X-SePay-Signature', 'sha256=test').send(raw);
  assert.equal(res.status, 200);
  assert.equal(upstream.body.toString(), raw);
  assert.equal(upstream.headers.authorization, 'Apikey test-secret');
  assert.equal(upstream.headers['x-sepay-signature'], 'sha256=test');
  assert.equal(upstream.url, 'http://127.0.0.1:5000/api/payments/webhooks/sepay');
  assert.equal((await request(gateway).post('/api/payments/webhooks/sepay').send('x'.repeat(103000))).status, 413);
  gateway.close();
});
