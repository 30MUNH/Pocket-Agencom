const prisma = require('../config/prisma');
const { AppError } = require('../middleware/errorHandler');

/**
 * Gets campaign budget summary and itemized expenses.
 */
async function getCampaignBudget(campaignId) {
  const planId = parseInt(campaignId, 10);

  const plan = await prisma.marketingPlan.findUnique({
    where: { id: planId },
    include: { expenses: true }
  });
  if (!plan) throw new AppError('Không tìm thấy kế hoạch.', 404);

  const totalBudget = plan.budget ? Number(plan.budget) : 0;
  const campaignExpenses = plan.expenses;

  const totalSpent = campaignExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const remainingBudget = Math.max(0, totalBudget - totalSpent);
  const percentageUsed = totalBudget > 0 ? parseFloat(((totalSpent / totalBudget) * 100).toFixed(1)) : 0;

  return {
    campaignId: planId,
    campaignGoal: plan?.goal || 'Chiến dịch tiếp thị xu hướng',
    totalBudget,
    totalSpent,
    remainingBudget,
    percentageUsed,
    expenses: campaignExpenses
  };
}

/**
 * Logs a new expense for a campaign.
 */
async function addExpense(userId, { marketingPlanId = 1, expenseType = 'Custom', amount, note }) {
  const planId = parseInt(marketingPlanId, 10);
  const numericAmount = Number(amount);

  if (isNaN(numericAmount) || numericAmount <= 0) {
    throw new AppError('Số tiền chi tiêu không hợp lệ.', 400);
  }

  if (!['Ads', 'Custom'].includes(expenseType)) {
    throw new AppError('Loại chi phí không hợp lệ.', 400);
  }

  return prisma.expense.create({
    data: {
      marketingPlanId: planId,
      expenseType,
      amount: numericAmount,
      note: note || `Chi phí ${expenseType}`,
      date: new Date()
    }
  });
}

/**
 * Gets aggregated monthly spend overview for the business dashboard.
 */
async function getMonthlySpend(userId) {
  const userPlans = await prisma.marketingPlan.findMany({
    where: { userId },
    select: { id: true }
  });
  const planIds = userPlans.map(p => p.id);
  const userExpenses = await prisma.expense.findMany({
    where: { marketingPlanId: { in: planIds } }
  });

  const monthlyBudgetGoal = 50000000; // Default budget baseline
  const summary = summarizeMonthlySpend(userExpenses, monthlyBudgetGoal);

  return {
    monthYear: new Date().toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }),
    ...summary,
    recentExpenses: userExpenses.slice(0, 5)
  };
}

function summarizeMonthlySpend(expenses, monthlyBudgetGoal) {
  let adsSpend = 0;
  let otherSpend = 0;

  expenses.forEach((expense) => {
    const amount = Number(expense.amount || 0);
    if (expense.expenseType === 'Ads') adsSpend += amount;
    else otherSpend += amount;
  });

  const totalMonthlySpend = adsSpend + otherSpend;
  const budgetUtilization = monthlyBudgetGoal > 0
    ? Number(((totalMonthlySpend / monthlyBudgetGoal) * 100).toFixed(1))
    : 0;

  return {
    totalMonthlySpend,
    monthlyBudgetGoal,
    budgetUtilization,
    breakdown: { adsSpend, otherSpend },
  };
}

module.exports = {
  getCampaignBudget,
  addExpense,
  getMonthlySpend,
  summarizeMonthlySpend
};
