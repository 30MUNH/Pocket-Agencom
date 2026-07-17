const kolService = require('../services/kolService');
const kolProfileService = require('../services/kolProfileService');
const { success } = require('../utils/response');

async function list(req, res, next) {
  try {
    const result = await kolService.listKols(req.query);
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const kol = await kolService.getKolById(req.params.id);
    return success(res, kol);
  } catch (err) {
    next(err);
  }
}

async function listPublicDirectory(req, res, next) {
  try {
    const result = await kolProfileService.listPublicProfiles(req.query);
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

async function getMyProfile(req, res, next) {
  try {
    const profile = await kolProfileService.getMyProfile(req.user.id);
    return success(res, profile);
  } catch (err) {
    next(err);
  }
}

async function updateMyProfile(req, res, next) {
  try {
    const profile = await kolProfileService.updateMyProfile(req.user.id, req.body);
    return success(res, profile);
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, listPublicDirectory, getMyProfile, updateMyProfile };
