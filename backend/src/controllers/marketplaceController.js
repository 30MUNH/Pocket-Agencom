const marketplaceService = require('../services/marketplaceService');
const { success } = require('../utils/response');

async function getMarketCampaigns(req, res, next) {
  try {
    const campaigns = await marketplaceService.getMarketCampaigns(req.user);
    return success(res, campaigns);
  } catch (err) {
    next(err);
  }
}

async function apply(req, res, next) {
  try {
    const application = await marketplaceService.applyToCampaign(
      req.params.id,
      req.user,
      req.body
    );
    return success(res, application, 201);
  } catch (err) {
    next(err);
  }
}

async function getApplications(req, res, next) {
  try {
    const applications = await marketplaceService.getCampaignApplications(
      req.params.id,
      req.user
    );
    return success(res, applications);
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const application = await marketplaceService.updateApplicationStatus(
      req.params.id,
      req.user,
      req.body
    );
    return success(res, application);
  } catch (err) {
    next(err);
  }
}

async function toggleRecruiting(req, res, next) {
  try {
    const campaign = await marketplaceService.toggleRecruiting(
      req.params.id,
      req.user,
      req.body.isLookingForKol
    );
    return success(res, campaign);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMarketCampaigns,
  apply,
  getApplications,
  updateStatus,
  toggleRecruiting,
};
