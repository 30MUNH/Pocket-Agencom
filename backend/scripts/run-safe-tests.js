const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const testsDirectory = path.resolve(__dirname, '../test');
const allTestFiles = fs.readdirSync(testsDirectory)
  .filter((file) => file.endsWith('.test.js') && file !== 'real-db-e2e.test.js')
  .sort();
const suites = {
  all: allTestFiles,
  unit: ['ai-provider.test.js', 'domain-removal.test.js', 'test-database-guard.test.js'],
  api: ['application-integration.test.js'],
};
const suiteName = process.argv[2] || 'all';

if (!suites[suiteName]) {
  process.stderr.write(`Unknown test suite "${suiteName}". Use all, unit, or api.\n`);
  process.exit(2);
}

const testFiles = suites[suiteName].map((file) => path.join('test', file));

const env = { ...process.env };
for (const key of Object.keys(env)) {
  if (/(?:DATABASE_URL|DIRECT_URL|PA_TEST_DATABASE_URL|API_KEY|TOKEN|SECRET|PASSWORD|SUPABASE|SCRAPING|CLOUDFLARE|GROQ|GEMINI|OPENROUTER|FAL)/i.test(key)) {
    delete env[key];
  }
}
delete env.NODE_OPTIONS;
env.NODE_ENV = 'test';
env.FREE_ONLY_MODE = 'true';
env.AI_ALLOW_PAID_MODELS = 'false';
const blockedDatabaseUrl = 'postgresql://127.0.0.1:1/pocket_agencom_blocked_test';
env.DATABASE_URL = blockedDatabaseUrl;
env.DIRECT_URL = blockedDatabaseUrl;

const result = spawnSync(process.execPath, ['--test', '--test-reporter=spec', ...testFiles], {
  cwd: path.resolve(__dirname, '..'),
  env,
  stdio: 'inherit',
});

if (result.error) {
  process.stderr.write(`Unable to start isolated backend tests: ${result.error.message}\n`);
  process.exitCode = 1;
} else {
  process.exitCode = result.status ?? 1;
}
