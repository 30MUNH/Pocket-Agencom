const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { resolveTestDatabaseUrl } = require('../src/config/testDatabaseGuard');

test('test database guard requires the dedicated PA_TEST_DATABASE_URL', () => {
  assert.throws(() => resolveTestDatabaseUrl({}), /PA_TEST_DATABASE_URL is required/);
});

test('test database guard rejects normal application database URLs', () => {
  const url = 'postgresql://user:secret@localhost:5432/pocket_agencom_test';
  assert.throws(
    () => resolveTestDatabaseUrl({ PA_TEST_DATABASE_URL: url, DATABASE_URL: url }),
    /must not match the application database/,
  );
  assert.throws(
    () => resolveTestDatabaseUrl({ PA_TEST_DATABASE_URL: url }, { DIRECT_URL: url }),
    /must not match the application database/,
  );
});

test('test database guard accepts only PostgreSQL targets with an isolated database name', () => {
  assert.throws(
    () => resolveTestDatabaseUrl({ PA_TEST_DATABASE_URL: 'https://db.example/pocket_agencom_test' }),
    /must be a PostgreSQL URL/,
  );
  assert.throws(
    () => resolveTestDatabaseUrl({ PA_TEST_DATABASE_URL: 'postgresql://user:secret@host:5432/postgres' }),
    /database name must identify an isolated test database/,
  );

  const url = 'postgresql://user:secret@localhost:5432/pocket_agencom_test';
  assert.equal(resolveTestDatabaseUrl({ PA_TEST_DATABASE_URL: url }), url);
});

test('Prisma cannot initialize in test mode without an explicit isolated database URL', () => {
  const result = spawnSync(process.execPath, ['-e', "process.env.NODE_ENV = 'test'; delete process.env.PA_TEST_DATABASE_URL; require('./src/config/prisma')"], {
    cwd: path.resolve(__dirname, '..'),
    encoding: 'utf8',
    env: { ...process.env, NODE_ENV: 'test' },
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /PA_TEST_DATABASE_URL is required/);
});
