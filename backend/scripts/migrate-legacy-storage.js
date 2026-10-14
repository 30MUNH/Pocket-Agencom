const fs = require('node:fs/promises');
const path = require('node:path');
const { migrateVerifiedMediaAssets } = require('../src/services/storageBackup');

async function main() {
  const scopeFile = path.resolve(process.env.STORAGE_MIGRATION_SCOPE_FILE || '');
  if (!process.env.STORAGE_MIGRATION_SCOPE_FILE) throw new Error('STORAGE_MIGRATION_SCOPE_FILE is required.');
  const scope = JSON.parse(await fs.readFile(scopeFile, 'utf8'));
  if (scope.version !== 1 || scope.approved !== true || !Array.isArray(scope.objects)) throw new Error('Migration requires a reviewed version 1 inventory with approved=true.');
  const execute = process.argv.includes('--execute');
  if (!execute) {
    const result = await migrateVerifiedMediaAssets(scope.objects);
    process.stdout.write(`Dry run only; approved_media_assets=${result.manifest.length}; no Storage or database calls made.\n`);
    return;
  }
  if (process.env.STORAGE_LEGACY_MIGRATION_APPROVED !== '1' || process.env.STORAGE_MIGRATION_ENV_APPROVED !== 'isolated-staging') {
    throw new Error('Execution requires separate migration approval and explicit isolated-staging environment selection.');
  }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Backend Supabase credentials are required.');
  const { createClient } = require('@supabase/supabase-js');
  const prisma = require('../src/config/prisma');
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const adapters = {
    async readSource(bucket, objectPath) {
      const { data, error } = await supabase.storage.from(bucket).download(objectPath);
      if (error || !data) throw new Error('Approved legacy source object could not be read.');
      return { bytes: Buffer.from(await data.arrayBuffer()), contentType: data.type || 'application/octet-stream' };
    },
    async readPrivate(bucket, objectPath) {
      const { data, error } = await supabase.storage.from(bucket).download(objectPath);
      if (error || !data) {
        if (/not found|does not exist/i.test(error?.message || '')) throw Object.assign(new Error('Destination not found.'), { statusCode: 404 });
        throw new Error('Private destination object could not be read.');
      }
      return { bytes: Buffer.from(await data.arrayBuffer()), contentType: data.type || 'application/octet-stream' };
    },
    async writePrivate(bucket, objectPath, bytes, options) {
      const { error } = await supabase.storage.from(bucket).upload(objectPath, bytes, options);
      if (error) throw new Error('Private destination object could not be copied.');
    },
    database: prisma,
  };
  try {
    const result = await migrateVerifiedMediaAssets(scope.objects, adapters, { dryRun: false, approved: true });
    process.stdout.write(`Migration copy pass complete; records=${result.copied}. Source objects and legacy URL fields remain intact. Re-run inventory reconciliation before any cutover.\n`);
  } finally { await prisma.$disconnect(); }
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`Legacy Storage migration stopped: ${String(error?.message || error).replace(/https?:\/\/[^\s]+/g, '[redacted URL]')}\n`);
    process.exitCode = 1;
  });
}
