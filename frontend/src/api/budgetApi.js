import axiosClient from './axiosClient';

export const budgetApi = {
  getCampaignBudget: (campaignId) => axiosClient.get(`/campaigns/${campaignId}/budget`),
  addExpense: (expenseData) => axiosClient.post('/expenses', expenseData),
  getMonthlySpend: () => axiosClient.get('/dashboard/monthly-spend'),
};
