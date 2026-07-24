const budgetService = require('../services/budgetService');
const { success } = require('../utils/response');

/**
 * GET /api/campaigns/:id/budget
 */
async function getCampaignBudget(req, res, next) {
  try {
    const { id } = req.params;
    const result = await budgetService.getCampaignBudget(id);
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/expenses
 */
async function addExpense(req, res, next) {
  try {
    const userId = req.user.id;
    const expense = await budgetService.addExpense(userId, req.body);
    return success(res, expense, 201);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/dashboard/monthly-spend
 */
async function getMonthlySpend(req, res, next) {
  try {
    const userId = req.user.id;
    const result = await budgetService.getMonthlySpend(userId);
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCampaignBudget,
  addExpense,
  getMonthlySpend
};
