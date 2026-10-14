const prisma = require('../src/config/prisma');
const { auditRecords } = require('../src/services/storageReferenceAudit');

async function main() {
  const projectHost = process.env.SUPABASE_PROJECT_HOST || null;
  const bucketNames = (process.env.SUPABASE_STORAGE_BUCKETS || '').split(',').filter(Boolean);
  const result = await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');
    const [users, scheduledPosts, marketingPlans, businessProfiles, templates, mediaAssets, marketingPlanAssets] = await Promise.all([
      tx.user.findMany({ select: { id: true, avatarUrl: true, avatarMediaAssetId: true } }),
      tx.scheduledPost.findMany({ select: { id: true, userId: true, imageUrl: true, content: true, mediaAssetId: true } }),
      tx.marketingPlan.findMany({ select: { id: true, userId: true, contentIdeas: true, videoScripts: true, checklist: true, playbook: true, seoKeywords: true, budgetBreakdown: true, deploymentChannels: true, existingResources: true, campaignReason: true, goal: true } }),
      tx.businessProfile.findMany({ select: { id: true, userId: true, fileUrl: true, previewImage: true } }),
      tx.template.findMany({ select: { id: true, fileUrl: true, previewImage: true } }),
      tx.mediaAsset.findMany({ select: { id: true, userId: true, url: true } }),
      tx.marketingPlanAsset.findMany({ select: { marketingPlanId: true, mediaAssetId: true } }),
    ]);
    return auditRecords({ users, scheduledPosts, marketingPlans, businessProfiles, templates, mediaAssets, marketingPlanAssets }, { supabaseProjectHost: projectHost, buckets: bucketNames });
  }, { isolationLevel: 'RepeatableRead' });
  process.stdout.write(`${JSON.stringify({ generatedAt: new Date().toISOString(), ...result }, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`Storage reference audit failed: ${String(error?.message || error).replace(/https?:\/\/[^\s]+/g, '[redacted URL]')}\n`);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
