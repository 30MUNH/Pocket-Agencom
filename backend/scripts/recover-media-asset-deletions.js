const prisma = require('../src/config/prisma');
const { createMediaAssetReferenceService } = require('../src/services/mediaAssetReferenceService');

async function main() {
  if ((process.env.PRIVATE_STORAGE_MODE || 'disabled') !== 'private') {
    throw new Error('Recovery requires PRIVATE_STORAGE_MODE=private and configured private buckets.');
  }
  const service = createMediaAssetReferenceService({ prismaClient: prisma });
  const results = await service.recoverDeletingAssets({ limit: 100 });
  process.stdout.write(`${JSON.stringify({ scanned: results.length, completed: results.filter((result) => result.deleted).length, pending: results.filter((result) => result.pending).length })}\n`);
}

main().catch(() => {
  process.stderr.write('Private asset recovery did not complete; inspect redacted server health and retry later.\n');
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
