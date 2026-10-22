const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');

process.env.NODE_ENV = 'test';
process.env.PA_TEST_DATABASE_URL ||= 'postgresql://test:test@127.0.0.1:5432/pocket_agencom_unit_test';

const { login } = require('../src/services/authService');
const { createAuthMiddleware } = require('../src/middleware/authMiddleware');
const { verifyToken } = require('../src/utils/jwt');
const { errorHandler } = require('../src/middleware/errorHandler');
const { isDemoAuthEnabled } = require('../src/services/demoAuth');

test('demo auth requires an explicit flag and is always disabled in production', () => {
  assert.equal(isDemoAuthEnabled({ NODE_ENV: 'development', DEMO_AUTH_ENABLED: 'true' }), true);
  assert.equal(isDemoAuthEnabled({ NODE_ENV: 'development', DEMO_AUTH_ENABLED: 'false' }), false);
  assert.equal(isDemoAuthEnabled({ NODE_ENV: 'production', DEMO_AUTH_ENABLED: 'true' }), false);
});

test('local demo login issues a backend JWT accepted without a database lookup', async () => {
  const previous = process.env.DEMO_AUTH_ENABLED;
  process.env.DEMO_AUTH_ENABLED = 'true';

  try {
    const session = await login('staff@pocketagencom.vn', 'demo-password');
    const claims = verifyToken(session.token);
    assert.equal(session.user.role, 'staff');
    assert.equal(claims.demo, true);

    const databaseThatMustNotRun = {
      user: {
        findUnique: async () => {
          throw new Error('Demo auth must not query the database');
        },
      },
    };
    const app = express();
    app.get('/me', createAuthMiddleware(databaseThatMustNotRun), (req, res) => res.json(req.user));
    app.use(errorHandler);

    const response = await request(app)
      .get('/me')
      .set('Authorization', `Bearer ${session.token}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.role, 'staff');
    assert.equal(response.body.isDemo, true);
  } finally {
    if (previous === undefined) delete process.env.DEMO_AUTH_ENABLED;
    else process.env.DEMO_AUTH_ENABLED = previous;
  }
});
