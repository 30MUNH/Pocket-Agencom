const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const dotenv = require('dotenv');
const { resolveRealDbE2eTarget } = require('../src/config/realDbE2eConfig');

const optedIn = process.env.PA_REAL_DB_E2E === 'true';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

function safeError(error) {
  return String(error?.message || error).replace(/postgres(?:ql)?:\/\/[^\s"']+/gi, '[redacted database URL]');
}

async function main() {
  const target = resolveRealDbE2eTarget({ optedIn, env: process.env, appEnv: dotenv.parse(fs.readFileSync(path.resolve(__dirname, '../.env'))) });
  const prisma = require('../src/config/prisma');
  try {
    const snapshot = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');
      const server = (await tx.$queryRaw`SELECT current_database() AS database, current_schema() AS schema, version() AS version`)[0];
      if (server.database !== target.database || server.schema !== target.schema) {
        throw new Error('Connected database identity does not match the configured target.');
      }

      const tables = await tx.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = ${target.schema} AND table_type = 'BASE TABLE' ORDER BY table_name`;
      const columns = await tx.$queryRaw`SELECT table_name, column_name, ordinal_position, data_type, udt_name, is_nullable, column_default FROM information_schema.columns WHERE table_schema = ${target.schema} ORDER BY table_name, ordinal_position`;
      const constraints = await tx.$queryRaw`SELECT c.relname AS table_name, con.conname AS name, con.contype AS type, pg_get_constraintdef(con.oid, true) AS definition FROM pg_constraint con JOIN pg_class c ON c.oid = con.conrelid JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = ${target.schema} ORDER BY c.relname, con.conname`;
      const indexes = await tx.$queryRaw`SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname = ${target.schema} ORDER BY tablename, indexname`;
      const enums = await tx.$queryRaw`SELECT t.typname AS name, e.enumlabel AS value, e.enumsortorder AS sort_order FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = ${target.schema} ORDER BY t.typname, e.enumsortorder`;
      const policies = await tx.$queryRaw`SELECT tablename, policyname, permissive, roles, cmd, qual, with_check FROM pg_policies WHERE schemaname = ${target.schema} ORDER BY tablename, policyname`;
      const data = {};
      const counts = {};
      for (const { table_name: table } of tables) {
        if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(table)) throw new Error('Unexpected table identifier in configured schema.');
        const records = await tx.$queryRawUnsafe(`SELECT row_to_json(t)::text AS record FROM "${target.schema}"."${table}" AS t`);
        data[table] = records.map(({ record }) => record);
        counts[table] = records.length;
      }

      return {
        format: 'pocket-agencom-prisma-logical-snapshot-v1',
        createdAt: new Date().toISOString(),
        target: { ...target, server: server.version.split(' ').slice(0, 2).join(' ') },
        schema: { columns, constraints, indexes, enums, policies },
        counts,
        data,
      };
    }, { isolationLevel: 'RepeatableRead', timeout: 180000, maxWait: 15000 });

    const folder = '/tmp/pocket-agencom-db-backups';
    fs.mkdirSync(folder, { recursive: true, mode: 0o700 });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const file = path.join(folder, `pocket-agencom-${timestamp}.json.gz`);
    const compressed = zlib.gzipSync(Buffer.from(JSON.stringify(snapshot)), { level: 9 });
    fs.writeFileSync(file, compressed, { mode: 0o600, flag: 'wx' });

    const verified = JSON.parse(zlib.gunzipSync(fs.readFileSync(file)).toString('utf8'));
    const countsMatch = Object.entries(verified.counts).every(([table, count]) => verified.data[table]?.length === count);
    if (!countsMatch || !verified.schema.columns.length || Object.keys(verified.data).length !== Object.keys(verified.counts).length) {
      fs.unlinkSync(file);
      throw new Error('Snapshot verification failed.');
    }

    const digest = crypto.createHash('sha256').update(compressed).digest('hex');
    const rows = Object.values(verified.counts).reduce((sum, count) => sum + count, 0);
    console.log(JSON.stringify({ file, sha256: digest, tables: Object.keys(verified.data).length, columns: verified.schema.columns.length, rows, counts: verified.counts, verified: true }));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(`Real database backup failed: ${safeError(error)}`);
  process.exitCode = 1;
});
