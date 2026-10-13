const prisma = require('../config/prisma');
const { AppError } = require('../middleware/errorHandler');

/**
 * Uploads/records a media asset in the library.
 */
async function uploadMediaAsset(userId, { name, url, fileType = 'image', sizeBytes = 0, businessProfileId }) {
  if (!name || !url) {
    throw new AppError('Tên tập tin và URL media là bắt buộc.', 400);
  }

  return prisma.mediaAsset.create({
    data: {
      userId,
      businessProfileId: businessProfileId ? Number(businessProfileId) : null,
      name,
      url,
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
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  return assets || [];
}

/**
 * Deletes a media asset by ID with strict user ownership verification.
 */
async function deleteMediaAsset(userId, assetId) {
  const idNum = parseInt(assetId, 10);

  const existing = await prisma.mediaAsset.findUnique({ where: { id: idNum } });
  if (!existing || existing.userId !== userId) {
    throw new AppError('Không tìm thấy tài sản truyền thông hoặc bạn không có quyền xóa.', 404);
  }

  await prisma.mediaAsset.delete({ where: { id: idNum } });
  return { deleted: true };
}

module.exports = {
  uploadMediaAsset,
  getMediaAssets,
  deleteMediaAsset
};
