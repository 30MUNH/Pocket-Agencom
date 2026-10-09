const express = require('express');
const budgetController = require('../controllers/budgetController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/dashboard/monthly-spend
router.get('/dashboard/monthly-spend', authMiddleware, budgetController.getMonthlySpend);

// GET /api/campaigns/:id/budget
router.get('/campaigns/:id/budget', authMiddleware, budgetController.getCampaignBudget);

// POST /api/expenses
router.post('/expenses', authMiddleware, budgetController.addExpense);

module.exports = router;
