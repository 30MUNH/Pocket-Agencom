const packageService = require('../services/packageService');
const { success } = require('../utils/response');

async function getById(req, res, next) {
  try {
    const pkg = await packageService.getPackageById(req.params.id);
    return success(res, pkg);
  } catch (err) {
    next(err);
  }
}

module.exports = { getById };
