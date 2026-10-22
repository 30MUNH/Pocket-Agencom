const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');
const { errorHandler } = require('../src/middleware/errorHandler');
const { isDatabaseUnavailable } = require('../src/utils/databaseError');

test('recognizes the observed Prisma pooler error even without errorCode', () => {
  const error = Object.assign(new Error("Can't reach database server at `example.pooler.supabase.com:6543`"), {
    name: 'PrismaClientInitializationError', errorCode: undefined,
  });
  assert.equal(isDatabaseUnavailable(error), true);
  assert.equal(isDatabaseUnavailable({ code: 'P1001' }), true);
  assert.equal(isDatabaseUnavailable({ code: 'P2024' }), true);
  assert.equal(isDatabaseUnavailable({ name: 'PrismaClientInitializationError', errorCode: 'P1000', message: 'Authentication failed' }), false);
  assert.equal(isDatabaseUnavailable({ code: 'P2021', message: 'Table does not exist' }), false);
});

test('database outage returns a useful 503 without exposing the URL or credentials', async () => {
  const app = express();
  app.get('/outage', (req, res, next) => next(Object.assign(new Error("Can't reach database server at example:6543; password=private-test-password"), {
    name: 'PrismaClientInitializationError',
  })));
  app.use(errorHandler);
  const response = await request(app).get('/outage');
  assert.equal(response.status, 503);
  assert.equal(response.body.success, false);
  assert.equal(response.body.error.details.code, 'DATABASE_UNAVAILABLE');
  assert.match(response.body.error.message, /Supabase/);
  assert.doesNotMatch(response.text, /private-test-password|example:6543/);
});
