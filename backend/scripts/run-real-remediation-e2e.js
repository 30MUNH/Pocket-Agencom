const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const dotenv = require('dotenv');
const { resolveRealDbE2eTarget } = require('../src/config/realDbE2eConfig');

if (process.env.PA_REAL_DB_E2E !== 'true') throw new Error('Set PA_REAL_DB_E2E=true for real remediation tests.');
const envFile = path.resolve(__dirname, '../.env');
const appEnv = dotenv.parse(fs.readFileSync(envFile));
const target = resolveRealDbE2eTarget({ optedIn: true, env: process.env, appEnv });
if (target.host !== 'aws-1-ap-southeast-1.pooler.supabase.com' || target.port !== '5432'
  || !appEnv.SUPABASE_URL?.includes('jypgdzzwmzqkcsaqaerj.supabase.co')) {
  throw new Error('Verified Pocket Agencom Supabase target mismatch.');
}
const env = { ...process.env, ...appEnv, NODE_ENV: 'development', PA_REAL_DB_E2E: 'true',
  FREE_ONLY_MODE: 'true', AI_ALLOW_PAID_MODELS: 'false' };
delete env.PA_TEST_DATABASE_URL;
const backup = spawnSync(process.execPath, [path.resolve(__dirname, 'backup-real-db.js')], {
  cwd: path.resolve(__dirname, '..'), env, encoding: 'utf8', timeout: 240000,
});
if (backup.stdout) process.stdout.write(backup.stdout);
if (backup.stderr) process.stderr.write(backup.stderr);
if (backup.error || backup.status !== 0) throw new Error('Verified pre-test backup failed.');
const info = JSON.parse(backup.stdout.trim().split('\n').at(-1));
if (!info.verified || !fs.existsSync(info.file)) throw new Error('Pre-test backup was not verified.');
const result = spawnSync(process.execPath, ['--test', '--test-reporter=spec', 'test/real-remediation-db.test.js'], {
  cwd: path.resolve(__dirname, '..'), env, stdio: 'inherit', timeout: 300000,
});
if (result.error) throw new Error(`Real remediation runner failed: ${result.error.code || result.error.name}`);
process.exitCode = result.status ?? 1;
