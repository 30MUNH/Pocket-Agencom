const authService = require('../services/authService');
const { success } = require('../utils/response');

async function register(req, res, next) {
  try {
    const result = await authService.register(req.body);
    return success(res, result, 201);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body.email, req.body.password);
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    if (req.user.isDemo) {
      return success(res, {
        ...req.user,
        createdAt: new Date().toISOString(),
        businessProfile: {
          businessName: 'Pocket Demo Store',
          socialPlatforms: [],
        },
      });
    }

    const user = await authService.getMe(req.user.id);
    return success(res, user);
  } catch (err) {
    next(err);
  }
}

async function updateBusinessProfile(req, res, next) {
  try {
    const profile = await authService.updateBusinessProfile(req.user.id, req.body);
    return success(res, profile);
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const user = await authService.updateProfile(req.user.id, req.body);
    return success(res, user);
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await authService.changePassword(req.user.id, currentPassword, newPassword);
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me, updateBusinessProfile, updateProfile, changePassword };
