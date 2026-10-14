const mediaService = require('../services/mediaService');
const { success } = require('../utils/response');

/**
 * GET /api/media
 */
async function getMediaAssets(req, res, next) {
  try {
    const userId = req.user.id;
    const assets = await mediaService.getMediaAssets(userId);
    return success(res, assets);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/media
 */
async function uploadMedia(req, res, next) {
  try {
    const userId = req.user.id;
    const asset = await mediaService.uploadMediaAsset(userId, req.body);
    return success(res, asset, 201);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/media/:id
 */
async function getMediaAssetAccess(req, res, next) {
  try {
    const mediaAccessService = require('../services/mediaAccessService');
    const access = await mediaAccessService.getAuthorizedMediaAccess({
      requester: req.user,
      assetId: req.params.id,
      disposition: req.query.download === 'true' ? 'attachment' : 'inline',
    });
    return success(res, access);
  } catch (err) {
    next(err);
  }
}

async function deleteMedia(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const result = await mediaService.deleteMediaAsset(userId, id);
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

async function generateImage(req, res, next) {
  try {
    const aiService = require('../services/ai/aiService');
    const { prompt, aspectRatio, platform, businessProfileId } = req.body;
    const result = await aiService.generateSocialImage({
      prompt,
      aspectRatio,
      platform,
      userId: req.user.id,
      businessProfileId,
    });
    return success(res, result, 201);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMediaAssets,
  uploadMedia,
  deleteMedia,
  getMediaAssetAccess,
  generateImage,
};
