const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');
const { resolveRealDbE2eTarget } = require('../src/config/realDbE2eConfig');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
  const appEnv = dotenv.parse(fs.readFileSync(path.resolve(__dirname, '../.env')));
  const target = resolveRealDbE2eTarget({
    optedIn: process.env.PA_REAL_DB_E2E === 'true',
    env: process.env,
    appEnv,
  });
  const prisma = require('../src/config/prisma');
  const [identity] = await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');
    return tx.$queryRaw`SELECT current_database() AS database, current_schema() AS schema`;
  }, { isolationLevel: 'RepeatableRead' });
  if (identity.database !== target.database || identity.schema !== target.schema) {
    throw new Error('Connected database identity does not match the configured target.');
  }

  const { createApp } = require('../src/app');
  const port = Number(process.env.PORT || 5055);
  const server = createApp().listen(port, '127.0.0.1', () => {
    console.log(`Real DB API listening on 127.0.0.1:${port}; target ${target.host}:${target.port}/${target.database}`);
  });
  const shutdown = async () => {
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
  server.once('error', (error) => {
    console.error(`Real DB API failed to listen: ${error.message}`);
    process.exitCode = 1;
  });
}

main().catch((error) => {
  const safe = String(error?.message || error).replace(/postgres(?:ql)?:\/\/[^\s"']+/gi, '[redacted database URL]');
  console.error(`Real DB API startup failed: ${safe}`);
  process.exitCode = 1;
});
