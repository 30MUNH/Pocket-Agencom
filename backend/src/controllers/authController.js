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
    const user = await authService.getMe(req.user.id);
    return success(res, user);
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me };
