const crypto = require('node:crypto');
const { AppError } = require('../middleware/errorHandler');
const DEFAULT_STORAGE = () => require('./storageService');
const PLAN_FIELDS = ['goal', 'contentIdeas', 'videoScripts', 'checklist', 'playbook', 'seoKeywords', 'budgetBreakdown', 'deploymentChannels', 'existingResources', 'campaignReason'];
const REMOVE_TIMEOUT_MS = 10_000;
const MAX_RETRY_DELAY_MS = 60 * 60 * 1000;

function retryDelayMs(attemptCount) {
  return Math.min(1000 * (2 ** Math.min(Math.max(0, attemptCount), 12)), MAX_RETRY_DELAY_MS);
}

function parseId(value) {
  const text = String(value ?? '');
  if (!/^[1-9]\d*$/.test(text)) return null;
  const id = Number(text);
  return Number.isSafeInteger(id) ? id : null;
}

function referenceNeedles(asset) {
  const values = new Set();
  if (asset.url) {
    values.add(asset.url);
    try { values.add(new URL(asset.url).pathname); } catch { /* malformed legacy URLs are matched by exact value */ }
  }
  if (asset.storagePath) {
    values.add(asset.storagePath);
    values.add(encodeURIComponent(asset.storagePath));
  }
  values.add(`\"mediaAssetId\":${asset.id}`);
  values.add(`\"mediaAssetId\": ${asset.id}`);
  values.add(`\"assetId\":${asset.id}`);
  values.add(`\"assetId\": ${asset.id}`);
  return [...values].filter(Boolean);
}

function containsReference(value, needles, assetId) {
  if (value == null) return false;
  if (typeof value === 'number') return value === assetId;
  if (typeof value === 'string') {
    if (needles.some((needle) => needle && value.includes(needle))) return true;
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object') return containsReference(parsed, needles, assetId);
    } catch { /* ordinary text */ }
    return false;
  }
  if (Array.isArray(value)) return value.some((entry) => containsReference(entry, needles, assetId));
  if (typeof value === 'object') {
    return Object.entries(value).some(([key, entry]) => {
      if (/^(mediaAssetId|assetId)$/i.test(key)) return Number(entry) === assetId;
      return containsReference(entry, needles, assetId);
    });
  }
  return false;
}

async function countReferences(tx, asset) {
  const needles = referenceNeedles(asset);
  const urlContains = (field) => needles.map((needle) => ({ [field]: { contains: needle } }));
  const [avatarRefs, postRefs, planAssetRefs, plans, templateRefs] = await Promise.all([
    tx.user.count({ where: { OR: [{ avatarMediaAssetId: asset.id }, ...urlContains('avatarUrl')] } }),
    tx.scheduledPost.count({ where: { OR: [{ mediaAssetId: asset.id }, ...urlContains('imageUrl'), ...urlContains('content')] } }),
    tx.marketingPlanAsset.count({ where: { mediaAssetId: asset.id } }),
    tx.marketingPlan.findMany({
      where: { OR: PLAN_FIELDS.flatMap((field) => urlContains(field)) },
      select: Object.fromEntries(['id', ...PLAN_FIELDS].map((field) => [field, true])),
    }),
    tx.template.count({ where: { OR: [...urlContains('fileUrl'), ...urlContains('previewImage')] } }),
  ]);
  const planTextRefs = plans.filter((plan) => PLAN_FIELDS.some((field) => containsReference(plan[field], needles, asset.id))).length;
  return avatarRefs + postRefs + planAssetRefs + planTextRefs + templateRefs;
}

function createMediaAssetReferenceService({
  prismaClient = require('../config/prisma'),
  storageOperations,
  now = () => new Date(),
  removeTimeoutMs = REMOVE_TIMEOUT_MS,
} = {}) {
  const storage = storageOperations || DEFAULT_STORAGE().createStorageService();

  async function withAssetLock(tx, id, fn) {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`media-asset:${id}`}, 0))`;
    return fn();
  }

  async function markDeleting(userId, id) {
    return prismaClient.$transaction(async (tx) => withAssetLock(tx, id, async () => {
      const asset = await tx.mediaAsset.findUnique({ where: { id } });
      if (!asset || asset.userId !== userId) throw new AppError('Media asset not found.', 404);
      if (asset.lifecycleState === 'deleting') return { operationId: asset.deletionOperationId };
      const references = await countReferences(tx, asset);
      if (references) throw new AppError('Media asset is still referenced and cannot be deleted.', 409);
      if (asset.sourceKind === 'legacy_unverified' || asset.sourceKind === 'legacy_internal_verified') {
        throw new AppError('Legacy assets are preserved until their references are verified.', 409);
      }
      if (asset.sourceKind === 'external_url') {
        await tx.mediaAsset.delete({ where: { id } });
        return { externalDeleted: true };
      }
      if (asset.sourceKind !== 'private_storage' || !asset.storageBucket || !asset.storagePath) {
        throw new AppError('Media asset storage metadata is invalid.', 409);
      }
      const operationId = crypto.randomUUID();
      await tx.mediaAsset.updateMany({
        where: { id, lifecycleState: 'active' },
        data: { lifecycleState: 'deleting', deletionOperationId: operationId, deletionStartedAt: now(), deletionLastAttemptAt: null, deletionAttemptCount: 0, deletionLastError: null },
      });
      return { operationId };
    }));
  }

  async function resumeDeletion(assetId) {
    const id = parseId(assetId);
    if (!id) throw new AppError('Invalid media asset ID.', 400);
    const prepared = await prismaClient.$transaction(async (tx) => withAssetLock(tx, id, async () => {
      const asset = await tx.mediaAsset.findUnique({ where: { id } });
      if (!asset) return { gone: true };
      if (asset.lifecycleState !== 'deleting' || !asset.deletionOperationId) return { gone: false, pending: false };
      const current = now();
      await tx.mediaAssetAccessLease.deleteMany({ where: { mediaAssetId: id, expiresAt: { lte: current } } });
      const lease = await tx.mediaAssetAccessLease.findFirst({ where: { mediaAssetId: id, expiresAt: { gt: current } }, select: { id: true } });
      if (lease) return { pending: true, operationId: asset.deletionOperationId };
      return { asset, operationId: asset.deletionOperationId };
    }));
    if (prepared.gone) return { deleted: true };
    if (prepared.pending || !prepared.asset) return { deleted: false, pending: true };

    let timeout;
    try {
      await Promise.race([
        storage.removePrivateObject({ bucket: prepared.asset.storageBucket, path: prepared.asset.storagePath }),
        new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('storage timeout')), removeTimeoutMs); }),
      ]);
    } catch (error) {
      const missing = error?.statusCode === 404 || /not found|does not exist/i.test(error?.message || '');
      if (!missing) await prismaClient.$transaction(async (tx) => withAssetLock(tx, id, async () => {
        await tx.mediaAsset.updateMany({
          where: { id, lifecycleState: 'deleting', deletionOperationId: prepared.operationId },
          data: { deletionAttemptCount: { increment: 1 }, deletionLastAttemptAt: now(), deletionLastError: 'storage_remove_failed' },
        });
      }));
      if (!missing) throw new AppError('Private asset deletion is pending recovery.', 503);
    } finally { clearTimeout(timeout); }

    return prismaClient.$transaction(async (tx) => withAssetLock(tx, id, async () => {
      const current = await tx.mediaAsset.findUnique({ where: { id } });
      if (!current) return { deleted: true };
      if (current.lifecycleState !== 'deleting' || current.deletionOperationId !== prepared.operationId) return { deleted: false, pending: true };
      if (await countReferences(tx, current)) throw new AppError('Media asset became referenced during deletion recovery.', 409);
      const lease = await tx.mediaAssetAccessLease.findFirst({ where: { mediaAssetId: id, expiresAt: { gt: now() } }, select: { id: true } });
      if (lease) return { deleted: false, pending: true };
      await tx.mediaAsset.deleteMany({ where: { id, lifecycleState: 'deleting', deletionOperationId: prepared.operationId } });
      return { deleted: true };
    }));
  }

  async function deleteOwnedAsset(ownerId, assetId) {
    const id = parseId(assetId);
    if (!id) throw new AppError('Invalid media asset ID.', 400);
    const prepared = await markDeleting(ownerId, id);
    if (prepared.externalDeleted) return { deleted: true };
    return resumeDeletion(id);
  }

  async function recoverDeletingAssets({ limit = 100 } = {}) {
    const assets = await prismaClient.mediaAsset.findMany({ where: { lifecycleState: 'deleting' }, select: { id: true, deletionAttemptCount: true, deletionLastAttemptAt: true }, take: limit, orderBy: { deletionStartedAt: 'asc' } });
    const current = now();
    const eligible = assets.filter((asset) => !asset.deletionAttemptCount || !asset.deletionLastAttemptAt || current.getTime() - asset.deletionLastAttemptAt.getTime() >= retryDelayMs(asset.deletionAttemptCount));
    const results = [];
    for (const asset of eligible) {
      try { results.push(await resumeDeletion(asset.id)); }
      catch { results.push({ deleted: false, pending: true }); }
    }
    return results;
  }

  return { deleteOwnedAsset, resumeDeletion, recoverDeletingAssets };
}

module.exports = { createMediaAssetReferenceService, countReferences, containsReference, retryDelayMs, REMOVE_TIMEOUT_MS, MAX_RETRY_DELAY_MS };
