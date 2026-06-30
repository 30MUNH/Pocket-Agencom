const kolService = require('../services/kolService');
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

module.exports = { list, getById };
