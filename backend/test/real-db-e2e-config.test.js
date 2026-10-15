const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveRealDbE2eTarget } = require('../src/config/realDbE2eConfig');

const appEnv = {
  DATABASE_URL: 'postgresql://app:secret@db.example:6543/postgres?pgbouncer=true',
  DIRECT_URL: 'postgresql://app:secret@db.example:5432/postgres',
};

test('real database tests require an explicit opt-in', () => {
  assert.throws(
    () => resolveRealDbE2eTarget({ optedIn: false, env: {}, appEnv }),
    /PA_REAL_DB_E2E=true/,
  );
});

test('real database tests only use the configured application database', () => {
  assert.throws(
    () => resolveRealDbE2eTarget({
      optedIn: true,
      env: { DATABASE_URL: 'postgresql://app:secret@other.example:5432/test' },
      appEnv,
    }),
    /must match backend \.env/,
  );
});

test('real database target details omit credentials', () => {
  const target = resolveRealDbE2eTarget({ optedIn: true, env: {}, appEnv });
  assert.deepEqual(target, {
    host: 'db.example',
    port: '5432',
    database: 'postgres',
    schema: 'public',
  });
  assert.equal(JSON.stringify(target).includes('secret'), false);
});

test('real database tests reject non-PostgreSQL targets', () => {
  assert.throws(
    () => resolveRealDbE2eTarget({ optedIn: true, env: {}, appEnv: { DATABASE_URL: 'mysql://db.example/app' } }),
    /must be a PostgreSQL URL/,
  );
});
