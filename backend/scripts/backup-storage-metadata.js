const fs = require('node:fs/promises');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '../..');

function requireProtectedDestination(outputPath) {
  if (!outputPath) throw new Error('--output is required.');
  const resolved = path.resolve(outputPath);
  const relative = path.relative(REPO_ROOT, resolved);
  if (!relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Backup output must be outside the repository.');
  if (!process.argv.includes('--execute') || process.env.STORAGE_METADATA_BACKUP_APPROVED !== '1') {
    throw new Error('Metadata backup requires --execute and STORAGE_METADATA_BACKUP_APPROVED=1.');
  }
  return resolved;
}

async function main() {
  const outputPath = requireProtectedDestination(process.env.STORAGE_METADATA_BACKUP_FILE);
  const prisma = require('../src/config/prisma');
  try {
    const records = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');
      const [users, scheduledPosts, marketingPlans, templates, mediaAssets, marketingPlanAssets] = await Promise.all([
        tx.user.findMany({ select: { id: true, avatarUrl: true, avatarMediaAssetId: true } }),
        tx.scheduledPost.findMany({ select: { id: true, userId: true, imageUrl: true, content: true, mediaAssetId: true } }),
        tx.marketingPlan.findMany({ select: { id: true, userId: true, contentIdeas: true, videoScripts: true, checklist: true, playbook: true, seoKeywords: true, budgetBreakdown: true, deploymentChannels: true, existingResources: true, campaignReason: true, goal: true } }),
        tx.template.findMany({ select: { id: true, fileUrl: true, previewImage: true } }),
        tx.mediaAsset.findMany(),
        tx.marketingPlanAsset.findMany(),
      ]);
      return { users, scheduledPosts, marketingPlans, templates, mediaAssets, marketingPlanAssets };
    }, { isolationLevel: 'RepeatableRead' });
    await fs.mkdir(path.dirname(outputPath), { recursive: true, mode: 0o700 });
    const file = await fs.open(outputPath, 'wx', 0o600);
    try { await file.writeFile(JSON.stringify({ version: 1, capturedAt: new Date().toISOString(), records })); }
    finally { await file.close(); }
    process.stdout.write(`Protected metadata backup written; records=${Object.values(records).reduce((count, rows) => count + rows.length, 0)}\n`);
  } finally { await prisma.$disconnect(); }
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`Metadata backup failed: ${String(error?.message || error).replace(/https?:\/\/[^\s]+/g, '[redacted URL]')}\n`);
    process.exitCode = 1;
  });
}

module.exports = { requireProtectedDestination };
