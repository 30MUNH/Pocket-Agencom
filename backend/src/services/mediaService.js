const prisma = require('../config/prisma');
const { AppError } = require('../middleware/errorHandler');
const { validateExternalMediaUrl } = require('./externalMediaUrl');
const { requireOwnedBusinessProfile } = require('./businessProfileAccess');
const { createMediaAssetReferenceService } = require('./mediaAssetReferenceService');
const mediaAssetReferenceService = createMediaAssetReferenceService();

/**
 * Uploads/records a media asset in the library.
 */
async function uploadMediaAsset(userId, { name, url, fileType = 'image', sizeBytes = 0, businessProfileId }) {
  if (!name || !url) {
    throw new AppError('Tên tập tin và URL media là bắt buộc.', 400);
  }

  const canonicalUrl = validateExternalMediaUrl(url);
  const profile = businessProfileId == null ? null : await requireOwnedBusinessProfile(userId, businessProfileId, prisma);
  return prisma.mediaAsset.create({
    data: {
      userId,
      businessProfileId: profile?.id || null,
      name,
      url: canonicalUrl,
      sourceKind: 'external_url',
      fileType,
      sizeBytes: Number(sizeBytes) || 0
    }
  });
}

/**
 * Gets all media assets for a user.
 */
async function getMediaAssets(userId) {
  const assets = await prisma.mediaAsset.findMany({
    where: { userId, lifecycleState: 'active' },
    orderBy: { createdAt: 'desc' },
  });
  return (assets || []).map(({ id, name, url, sourceKind, fileType, sizeBytes, createdAt }) => ({ id, name, url: sourceKind === 'private_storage' ? null : url, sourceKind, fileType, sizeBytes, createdAt }));
}

/**
 * Deletes a media asset by ID with strict user ownership verification.
 */
async function deleteMediaAsset(userId, assetId) {
  return mediaAssetReferenceService.deleteOwnedAsset(userId, assetId);
}

module.exports = {
  uploadMediaAsset,
  getMediaAssets,
  deleteMediaAsset
};
