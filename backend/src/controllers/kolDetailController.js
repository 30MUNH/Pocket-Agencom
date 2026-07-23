const kolDetailService = require('../services/kolDetailService');
const { success } = require('../utils/response');

async function addMedia(req, res, next) {
  try {
    const result = await kolDetailService.addMedia(req.params.id, req.user, req.body);
    return success(res, result, 201);
  } catch (err) {
    next(err);
  }
}

async function deleteMedia(req, res, next) {
  try {
    const result = await kolDetailService.deleteMedia(req.params.id, req.params.mediaId, req.user);
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

async function getProfileDetails(req, res, next) {
  try {
    const profile = await kolDetailService.getProfileDetails(req.params.id);
    return success(res, profile);
  } catch (err) {
    next(err);
  }
}

async function addReview(req, res, next) {
  try {
    const review = await kolDetailService.addReview(req.params.id, req.user, req.body);
    return success(res, review, 201);
  } catch (err) {
    next(err);
  }
}

async function addPerformance(req, res, next) {
  try {
    const performance = await kolDetailService.addPerformance(req.params.id, req.user, req.body);
    return success(res, performance, 201);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  addMedia,
  deleteMedia,
  getProfileDetails,
  addReview,
  addPerformance,
};
