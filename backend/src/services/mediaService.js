const prisma = require('../config/prisma');
const { AppError } = require('../middleware/errorHandler');

// Demo memory fallback store in case database tables are not migrated yet
let demoMediaAssetsStore = [
  {
    id: 1,
    userId: 1,
    name: 'Logo_Thương_Hiệu_Brand.png',
    url: 'https://images.unsplash.com/photo-1542744094-3a317272018a?auto=format&fit=crop&w=800&q=80',
    fileType: 'image',
    sizeBytes: 450000,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    id: 2,
    userId: 1,
    name: 'Poster_Chiến_Dịch_BlindBox.jpg',
    url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80',
    fileType: 'image',
    sizeBytes: 1200000,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 3,
    userId: 1,
    name: 'Video_Review_Product_Teaser.mp4',
    url: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80',
    fileType: 'video',
    sizeBytes: 8500000,
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
  }
];

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
      orderBy: { createdAt: 'desc' }
    });

    if (assets && assets.length > 0) {
      return assets;
    }
  } catch (err) {
    console.warn('[Prisma Fallback] Falling back to demo media assets memory store');
  }

  return demoMediaAssetsStore;
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
