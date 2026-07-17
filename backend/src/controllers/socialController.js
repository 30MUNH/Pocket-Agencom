const socialService = require('../services/socialService');
const { success } = require('../utils/response');

async function addPlatform(req, res, next) {
  try {
    const { platform, url } = req.body;
    if (!platform || !url) {
      return res.status(400).json({
        success: false,
        error: { message: 'Nền tảng và đường dẫn URL là bắt buộc.' }
      });
    }
    const result = await socialService.addPlatform(req.user.id, { platform, url });
    return success(res, result, 201);
  } catch (err) {
    next(err);
  }
}

async function getPlatforms(req, res, next) {
  try {
    const result = await socialService.getPlatforms(req.user.id);
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

async function deletePlatform(req, res, next) {
  try {
    const { id } = req.params;
    const result = await socialService.deletePlatform(req.user.id, id);
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

async function triggerAnalysis(req, res, next) {
  try {
    const { id } = req.params;
    const result = await socialService.triggerAnalysis(req.user.id, id);
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  addPlatform,
  getPlatforms,
  deletePlatform,
  triggerAnalysis
};
