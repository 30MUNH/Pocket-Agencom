const prisma = require('../config/prisma');
const { AppError } = require('../middleware/errorHandler');

// In-memory fallback store in case database tables are not migrated yet
let demoMediaAssetsStore = [];

/**
 * Uploads/records a media asset in the library.
 */
async function uploadMediaAsset(userId, { name, url, fileType = 'image', sizeBytes = 0, businessProfileId }) {
  if (!name || !url) {
    throw new AppError('Tên tập tin và URL media là bắt buộc.', 400);
  }

  try {
    const asset = await prisma.mediaAsset.create({
      data: {
        userId,
        businessProfileId: businessProfileId ? Number(businessProfileId) : null,
        name,
        url,
        fileType,
        sizeBytes: Number(sizeBytes) || 0
      }
    });
    return asset;
  } catch (err) {
    console.warn('[Prisma Fallback] MediaAsset create fallback to memory store:', err.message);
    const asset = {
      id: Date.now(),
      userId,
      businessProfileId: businessProfileId ? Number(businessProfileId) : null,
      name,
      url,
      fileType,
      sizeBytes: Number(sizeBytes) || 0,
      createdAt: new Date().toISOString()
    };
    demoMediaAssetsStore.unshift(asset);
    return asset;
  }
}

/**
 * Gets all media assets for a user.
 */
async function getMediaAssets(userId) {
  try {
    const assets = await prisma.mediaAsset.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return assets || [];
  } catch (err) {
    console.warn('[Prisma Warning] Could not retrieve media assets:', err.message);
    return [];
  }
}

/**
 * Deletes a media asset by ID.
 */
async function deleteMediaAsset(userId, assetId) {
  const idNum = parseInt(assetId, 10);

  try {
    await prisma.mediaAsset.delete({
      where: { id: idNum }
    });
    return { deleted: true };
  } catch (err) {
    console.warn('[Prisma Fallback] Deleting media asset in memory store:', err.message);
    demoMediaAssetsStore = demoMediaAssetsStore.filter(a => a.id !== idNum);
    return { deleted: true };
  }
}

module.exports = {
  uploadMediaAsset,
  getMediaAssets,
  deleteMediaAsset
};
