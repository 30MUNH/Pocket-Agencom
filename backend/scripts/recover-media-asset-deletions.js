require('dotenv').config({ path: require('node:path').resolve(__dirname, '../.env') });
const prisma = require('../src/config/prisma');
const { createMediaAssetReferenceService } = require('../src/services/mediaAssetReferenceService');

async function main() {
  if ((process.env.PRIVATE_STORAGE_MODE || 'disabled') !== 'private') {
    throw new Error('Recovery requires PRIVATE_STORAGE_MODE=private and configured private buckets.');
  }
  const service = createMediaAssetReferenceService({ prismaClient: prisma });
  const reconcileStaged = process.argv.includes('--reconcile-interrupted-uploads');
  if (reconcileStaged && process.env.PA_STORAGE_UPLOADS_QUIESCED !== 'true') {
    throw new Error('Stop all upload workers and set PA_STORAGE_UPLOADS_QUIESCED=true before reconciling interrupted uploads.');
  }
  const interrupted = reconcileStaged
    ? await service.reconcileInterruptedUploads({ uploadsQuiesced: true, limit: 100 })
    : [];
  const results = await service.recoverDeletingAssets({ limit: 100 });
  process.stdout.write(`${JSON.stringify({ scanned: results.length, completed: results.filter((result) => result.deleted).length, pending: results.filter((result) => result.pending).length, interruptedUploadsReconciled: interrupted.filter((result) => result.deleted).length, interruptedUploadsPending: interrupted.filter((result) => result.pending).length })}\n`);
}

main().catch(() => {
  process.stderr.write('Private asset recovery did not complete; inspect redacted server health and retry later.\n');
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
