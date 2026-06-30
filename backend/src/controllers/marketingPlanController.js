const marketingPlanService = require('../services/marketingPlanService');
const { success } = require('../utils/response');

async function generate(req, res, next) {
  try {
    const plan = await marketingPlanService.generatePlan(req.user.id, req.body);
    return success(res, plan, 201);
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const plans = await marketingPlanService.getPlans(req.user);
    return success(res, plans);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const plan = await marketingPlanService.getPlanById(req.params.id, req.user);
    return success(res, plan);
  } catch (err) {
    next(err);
  }
}

async function save(req, res, next) {
  try {
    const plan = await marketingPlanService.savePlan(req.params.id, req.user.id);
    return success(res, plan);
  } catch (err) {
    next(err);
  }
}

async function review(req, res, next) {
  try {
    const plan = await marketingPlanService.reviewPlan(req.params.id, req.user, req.body);
    return success(res, plan);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const result = await marketingPlanService.deletePlan(req.params.id, req.user.id);
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

module.exports = { generate, list, getById, save, review, remove };
