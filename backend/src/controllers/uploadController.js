const mediaAccessService = require('../services/mediaAccessService').createMediaAccessService();
const { AppError } = require('../middleware/errorHandler');
const { success } = require('../utils/response');

async function uploadAvatar(req, res, next) {
  try {
    if (!req.file) throw new AppError('Vui lòng chọn ảnh đại diện cần tải lên', 400);
    const asset = await mediaAccessService.createOwnedMediaAsset({ ownerId: req.user.id, file: req.file, purpose: 'avatar', metadata: { name: req.file.originalname } });
    return success(res, { mediaAssetId: asset.id });
  } catch (err) {
    next(err);
  }
}

async function uploadSingle(req, res, next) {
  try {
    if (!req.file) throw new AppError('Vui lòng chọn tập tin cần tải lên', 400);
    const asset = await mediaAccessService.createOwnedMediaAsset({ ownerId: req.user.id, file: req.file, purpose: 'campaign', metadata: { name: req.file.originalname } });
    return success(res, { mediaAssetId: asset.id, name: asset.name, fileType: asset.fileType, sizeBytes: asset.sizeBytes });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadAvatar, uploadSingle };
