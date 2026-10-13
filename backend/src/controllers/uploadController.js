const { uploadCampaignAsset } = require('../services/storageService');
const { AppError } = require('../middleware/errorHandler');
const { success } = require('../utils/response');

async function uploadAvatar(req, res, next) {
  try {
    if (!req.file) throw new AppError('Vui lòng chọn ảnh đại diện cần tải lên', 400);
    const { publicUrl } = await uploadCampaignAsset(req.file, `user-${req.user.id}`, 'avatars');
    return success(res, { url: publicUrl });
  } catch (err) {
    next(err);
  }
}

async function uploadSingle(req, res, next) {
  try {
    if (!req.file) throw new AppError('Vui lòng chọn tập tin cần tải lên', 400);
    const { publicUrl } = await uploadCampaignAsset(req.file, `user-${req.user.id}`);
    return success(res, { url: publicUrl });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadAvatar, uploadSingle };
