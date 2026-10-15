const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const dotenv = require('dotenv');
const { resolveRealDbE2eTarget } = require('../src/config/realDbE2eConfig');

const optedIn = process.env.PA_REAL_DB_E2E === 'true';
const appEnvPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: appEnvPath });

function safeError(error) {
  return String(error?.message || error).replace(/postgres(?:ql)?:\/\/[^\s"']+/gi, '[redacted database URL]');
}

async function preflight(target) {
  const prisma = require('../src/config/prisma');
  try {
    return await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');
      const [identity] = await tx.$queryRaw`SELECT current_database() AS database, current_schema() AS schema`;
      if (identity.database !== target.database || identity.schema !== target.schema) {
        throw new Error('Connected database identity does not match the configured target.');
      }
      return identity;
    }, { isolationLevel: 'RepeatableRead', timeout: 30000 });
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  if (!optedIn) {
    throw new Error('Real database tests are disabled. Set PA_REAL_DB_E2E=true explicitly.');
  }
  if (process.env.NODE_ENV === 'test') {
    throw new Error('Unset NODE_ENV=test before starting the real database test runner.');
  }

  const appEnv = dotenv.parse(fs.readFileSync(appEnvPath));
  const target = resolveRealDbE2eTarget({ optedIn, env: process.env, appEnv });
  const identity = await preflight(target);
  console.log(`Real PostgreSQL target verified: ${target.host}:${target.port}/${identity.database} (${identity.schema})`);

  const childEnv = {
    ...process.env,
    NODE_ENV: 'development',
    FREE_ONLY_MODE: 'true',
    AI_ALLOW_PAID_MODELS: 'false',
    PA_REAL_DB_E2E: 'true',
  };
  delete childEnv.PA_TEST_DATABASE_URL;

  const backup = spawnSync(process.execPath, [path.resolve(__dirname, 'backup-real-db.js')], {
    cwd: path.resolve(__dirname, '..'),
    env: childEnv,
    encoding: 'utf8',
    timeout: 240000,
    maxBuffer: 4 * 1024 * 1024,
  });
  if (backup.stdout) process.stdout.write(backup.stdout);
  if (backup.stderr) process.stderr.write(backup.stderr);
  if (backup.error || backup.status !== 0) throw new Error(`Pre-test database backup failed: ${safeError(backup.error || 'backup process failed')}`);

  const tests = spawnSync(process.execPath, ['--test', '--test-reporter=spec', 'test/real-db-e2e.test.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: childEnv,
    stdio: 'inherit',
    timeout: 15 * 60 * 1000,
  });
  if (tests.error) throw new Error(`Unable to start real database tests: ${safeError(tests.error)}`);
  process.exitCode = tests.status ?? 1;
}

main().catch((error) => {
  console.error(`Real database test runner stopped: ${safeError(error)}`);
  process.exitCode = 2;
});
