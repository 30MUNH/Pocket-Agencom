const { AppError } = require('../middleware/errorHandler');
const crypto = require('node:crypto');
const { requireOwnedBusinessProfile } = require('./businessProfileAccess');
const PRIVATE_BUCKETS = Object.freeze({ campaign: 'campaign-assets-private', avatars: 'avatars-private' });

const URL_LIFETIME_SECONDS = 600;
const LEASE_LIFETIME_MS = 30_000;
const SIGNING_TIMEOUT_MS = 8_000;
const NOT_FOUND = 'Media asset not found.';

function validAssetId(assetId) {
  const text = String(assetId ?? '');
  return /^[1-9]\d*$/.test(text) ? Number(text) : null;
}

function createMediaAccessService(options = {}) {
  const prismaClient = options.prismaClient || require('../config/prisma');
  const storageClient = options.storageClient || require('../config/supabase');
  const storageOperations = options.storageOperations || require('./storageService').createStorageService({ storageClient });
  const referenceOperations = options.referenceOperations || require('./mediaAssetReferenceService').createMediaAssetReferenceService({ prismaClient, storageOperations });
  const mode = options.mode || (() => process.env.PRIVATE_STORAGE_MODE || 'disabled');
  const now = options.now || (() => new Date());
  const signingTimeoutMs = options.signingTimeoutMs ?? SIGNING_TIMEOUT_MS;
  async function withSigningTimeout(promise) {
    let timeout;
    try {
      return await Promise.race([
        promise,
        new Promise((_, reject) => { timeout = setTimeout(() => reject(new AppError('Private asset access timed out.', 503)), signingTimeoutMs); }),
      ]);
    } finally { clearTimeout(timeout); }
  }

  async function createOwnedMediaAsset({ ownerId, file, purpose, metadata = {} }) {
    const profile = metadata.businessProfileId == null
      ? null
      : await requireOwnedBusinessProfile(ownerId, metadata.businessProfileId, prismaClient);
    let staged;
    const operationId = crypto.randomUUID();
    try {
      await storageOperations.uploadPrivateObject({ ownerId, file, purpose, onPrepared: async (object) => {
        staged = await prismaClient.mediaAsset.create({
          data: {
            userId: Number(ownerId),
            businessProfileId: profile?.id || null,
            name: String(metadata.name || file.originalname || 'Uploaded image').slice(0, 180),
            url: null,
            sourceKind: 'private_storage',
            storageBucket: object.bucket,
            storagePath: object.path,
            fileType: 'image',
            sizeBytes: object.byteLength,
            lifecycleState: 'deleting',
            deletionOperationId: operationId,
            // An in-progress transfer is excluded from deletion recovery.
            deletionStartedAt: now(),
            deletionLastError: 'upload_pending',
          },
        });
      } });
      return await prismaClient.mediaAsset.update({
        where: { id: staged.id, lifecycleState: 'deleting', deletionOperationId: operationId },
        data: { lifecycleState: 'active', deletionOperationId: null, deletionStartedAt: null, deletionLastError: null },
      });
    } catch (error) {
      if (staged) {
        try {
          await prismaClient.mediaAsset.updateMany({
            where: { id: staged.id, lifecycleState: 'deleting', deletionOperationId: operationId, deletionLastError: 'upload_pending' },
            data: { deletionLastError: null },
          });
          await referenceOperations.resumeDeletion(staged.id);
        } catch { /* The deleting row remains available for explicit reconciliation. */ }
      }
      if (!staged && error?.statusCode) throw error;
      throw new AppError('Unable to save private asset metadata.', 503);
    }
  }

  async function deleteOwnedMediaAsset(ownerId, assetId) {
    return referenceOperations.deleteOwnedAsset(ownerId, assetId);
  }

  async function getAuthorizedMediaAccess({ requester, assetId, disposition = 'inline' }) {
    if (mode() !== 'private') throw new AppError('Private asset access is disabled.', 503);
    const id = validAssetId(assetId);
    if (!id || !requester?.id) throw new AppError(NOT_FOUND, 404);
    const result = await prismaClient.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`media-asset:${id}`}, 0))::text`;
      const asset = await tx.mediaAsset.findUnique({ where: { id } });
      if (!asset || Number(asset.userId) !== Number(requester.id) || asset.lifecycleState !== 'active') return { denied: true };
      const owner = await tx.user.findUnique({ where: { id: asset.userId }, select: { id: true, status: true } });
      if (!owner || owner.status !== 'active') return { inactive: true };
      if (asset.sourceKind !== 'private_storage') {
        if (asset.url) return { url: asset.url, expiresAt: null, temporary: false };
        return { denied: true };
      }
      if (!Object.values(PRIVATE_BUCKETS).includes(asset.storageBucket) || !asset.storagePath) return { denied: true };
      const createdAt = now();
      const expiresAt = new Date(createdAt.getTime() + LEASE_LIFETIME_MS);
      const lease = await tx.mediaAssetAccessLease.create({ data: { userId: asset.userId, mediaAssetId: asset.id, expiresAt } });
      return { asset, leaseId: lease.id };
    });
    if (result.denied) throw new AppError(NOT_FOUND, 404);
    if (result.inactive) throw new AppError('Account is inactive.', 403);
    if (result.url) return result;

    try {
      const signOptions = disposition === 'attachment' ? { download: true } : { download: false };
      const { data, error } = await withSigningTimeout(
        storageClient.storage.from(result.asset.storageBucket).createSignedUrl(result.asset.storagePath, URL_LIFETIME_SECONDS, signOptions),
      );
      if (error || !data?.signedUrl) throw new AppError('Private asset signing failed.', 503);
      return { url: data.signedUrl, expiresAt: new Date(now().getTime() + URL_LIFETIME_SECONDS * 1000).toISOString(), temporary: true };
    } finally {
      await prismaClient.mediaAssetAccessLease.delete({ where: { id: result.leaseId } }).catch(() => {});
    }
  }

  async function getAdminUserAvatarAccess({ requester, targetUserId }) {
    if (!['admin', 'staff'].includes(requester?.role)) throw new AppError(NOT_FOUND, 404);
    if (mode() !== 'private') throw new AppError('Private asset access is disabled.', 503);
    const targetId = validAssetId(targetUserId);
    if (!targetId) throw new AppError(NOT_FOUND, 404);
    const result = await prismaClient.$transaction(async (tx) => {
      const target = await tx.user.findUnique({
        where: { id: targetId },
        select: { id: true, status: true, avatarMediaAssetId: true },
      });
      if (!target || target.status !== 'active' || !target.avatarMediaAssetId) return { denied: true };
      const id = Number(target.avatarMediaAssetId);
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`media-asset:${id}`}, 0))::text`;
      const asset = await tx.mediaAsset.findUnique({ where: { id } });
      if (!asset || Number(asset.userId) !== targetId || asset.sourceKind !== 'private_storage' || asset.lifecycleState !== 'active') return { denied: true };
      if (asset.storageBucket !== PRIVATE_BUCKETS.avatars || !asset.storagePath) return { denied: true };
      const lease = await tx.mediaAssetAccessLease.create({
        data: { userId: targetId, mediaAssetId: asset.id, expiresAt: new Date(now().getTime() + LEASE_LIFETIME_MS) },
      });
      return { asset, leaseId: lease.id };
    });
    if (result.denied) throw new AppError(NOT_FOUND, 404);
    try {
      const { data, error } = await withSigningTimeout(
        storageClient.storage.from(result.asset.storageBucket).createSignedUrl(result.asset.storagePath, URL_LIFETIME_SECONDS, { download: false }),
      );
      if (error || !data?.signedUrl) throw new AppError('Private avatar signing failed.', 503);
      return { url: data.signedUrl, expiresAt: new Date(now().getTime() + URL_LIFETIME_SECONDS * 1000).toISOString(), temporary: true };
    } finally {
      await prismaClient.mediaAssetAccessLease.delete({ where: { id: result.leaseId } }).catch(() => {});
    }
  }

  return { createOwnedMediaAsset, deleteOwnedMediaAsset, getAuthorizedMediaAccess, getAdminUserAvatarAccess };
}

module.exports = { createMediaAccessService, URL_LIFETIME_SECONDS, LEASE_LIFETIME_MS, SIGNING_TIMEOUT_MS };
