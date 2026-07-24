const prisma = require('../config/prisma');
const { AppError } = require('../middleware/errorHandler');

// Memory fallback store for expenses in case DB tables are not migrated yet
let demoExpensesStore = [
  {
    id: 1,
    marketingPlanId: 1,
    expenseType: 'KOL',
    amount: 15000000,
    note: 'Booking KOC TikTok unboxing sản phẩm',
    date: new Date(Date.now() - 86400000 * 3).toISOString(),
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    marketingPlanId: 1,
    expenseType: 'Ads',
    amount: 8500000,
    note: 'Chi phí chạy Facebook Ads chiến dịch Tháng 7',
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    createdAt: new Date().toISOString()
  },
  {
    id: 3,
    marketingPlanId: 1,
    expenseType: 'Custom',
    amount: 3200000,
    note: 'Thiết kế ấn phẩm truyền thông & Banner',
    date: new Date(Date.now() - 86400000 * 1).toISOString(),
    createdAt: new Date().toISOString()
  }
];

/**
 * Gets campaign budget summary and itemized expenses.
 */
async function getCampaignBudget(campaignId) {
  const planId = parseInt(campaignId, 10);

  let plan;
  try {
    plan = await prisma.marketingPlan.findUnique({
      where: { id: planId },
      include: { expenses: true }
    });
  } catch (err) {
    console.warn('[Prisma Fallback] getCampaignBudget falling back to memory store');
  }

  const totalBudget = plan?.budget ? Number(plan.budget) : 35000000;
  const campaignExpenses = plan?.expenses && plan.expenses.length > 0
    ? plan.expenses
    : demoExpensesStore.filter(e => e.marketingPlanId === planId || planId === 1);

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

  try {
    const expense = await prisma.expense.create({
      data: {
        marketingPlanId: planId,
        expenseType,
        amount: numericAmount,
        note: note || `Chi phí ${expenseType}`,
        date: new Date()
      }
    });
    return expense;
  } catch (err) {
    console.warn('[Prisma Fallback] Expense create fallback to memory store:', err.message);
    const expense = {
      id: Date.now(),
      marketingPlanId: planId,
      expenseType,
      amount: numericAmount,
      note: note || `Chi phí ${expenseType}`,
      date: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    demoExpensesStore.unshift(expense);
    return expense;
  }
}

/**
 * Gets aggregated monthly spend overview for the business dashboard.
 */
async function getMonthlySpend(userId) {
  let userExpenses = [];

  try {
    const userPlans = await prisma.marketingPlan.findMany({
      where: { userId },
      select: { id: true }
    });
    const planIds = userPlans.map(p => p.id);

    userExpenses = await prisma.expense.findMany({
      where: { marketingPlanId: { in: planIds } }
    });
  } catch (err) {
    console.warn('[Prisma Fallback] getMonthlySpend falling back to memory store');
    userExpenses = demoExpensesStore;
  }

  let kolSpend = 0;
  let adsSpend = 0;
  let customSpend = 0;

  userExpenses.forEach(exp => {
    const amt = Number(exp.amount || 0);
    if (exp.expenseType === 'KOL') kolSpend += amt;
    else if (exp.expenseType === 'Ads') adsSpend += amt;
    else customSpend += amt;
  });

  const totalMonthlySpend = kolSpend + adsSpend + customSpend;
  const monthlyBudgetGoal = 50000000; // Default budget baseline
  const budgetUtilization = parseFloat(((totalMonthlySpend / monthlyBudgetGoal) * 100).toFixed(1));

  return {
    monthYear: new Date().toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }),
    totalMonthlySpend,
    monthlyBudgetGoal,
    budgetUtilization,
    breakdown: {
      kolSpend,
      adsSpend,
      customSpend
    },
    recentExpenses: userExpenses.slice(0, 5)
  };
}

module.exports = {
  getCampaignBudget,
  addExpense,
  getMonthlySpend
};
