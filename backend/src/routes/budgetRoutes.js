const express = require('express');
const budgetController = require('../controllers/budgetController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

// GET /api/dashboard/monthly-spend
router.get('/dashboard/monthly-spend', budgetController.getMonthlySpend);

// GET /api/campaigns/:id/budget
router.get('/campaigns/:id/budget', budgetController.getCampaignBudget);

// POST /api/expenses
router.post('/expenses', budgetController.addExpense);

module.exports = router;
