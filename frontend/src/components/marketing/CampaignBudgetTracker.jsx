import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  RefreshCw, 
  Plus, 
  Receipt, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  PieChart,
  ShoppingBag,
  Megaphone,
  CreditCard
} from 'lucide-react';
import { budgetApi } from '../../api/budgetApi';
import { toast } from '../../store/toastStore';

export default function CampaignBudgetTracker({ campaignId = 1, initialData = null }) {
  const [budgetData, setBudgetData] = useState(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [isSyncingAds, setIsSyncingAds] = useState(false);

  // Form states for new expense logging
  const [expenseType, setExpenseType] = useState('KOL');
  const [amountInput, setAmountInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBudget = async () => {
    try {
      setLoading(true);
      const res = await budgetApi.getCampaignBudget(campaignId);
      setBudgetData(res);
    } catch (err) {
      console.error('[Budget Fetch Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialData) {
      fetchBudget();
    }
  }, [campaignId]);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    const numericAmount = Number(amountInput);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast.error('Vui lòng nhập số tiền chi tiêu hợp lệ.');
      return;
    }

    try {
      setIsSubmitting(true);
      await budgetApi.addExpense({
        marketingPlanId: campaignId,
        expenseType,
        amount: numericAmount,
        note: noteInput || `Chi phí ${expenseType}`
      });

      toast.success(`Đã ghi nhận chi phí ${expenseType} (${numericAmount.toLocaleString('vi-VN')} ₫)!`);
      setAmountInput('');
      setNoteInput('');
      fetchBudget();
    } catch (err) {
      toast.error('Không thể ghi nhận chi phí.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Simulated Mock Sync for Ads Spend (TikTok/Facebook/Google Ads API)
  const handleSyncAdsSpend = async () => {
    try {
      setIsSyncingAds(true);
      // Simulate API response delay
      await new Promise(r => setTimeout(r, 1500));

      const mockAdSpendAmount = Math.floor(Math.random() * 3000000) + 1500000;
      await budgetApi.addExpense({
        marketingPlanId: campaignId,
        expenseType: 'Ads',
        amount: mockAdSpendAmount,
        note: 'Tự động đồng bộ chi phí Quảng cáo Meta/TikTok Ads'
      });

      toast.success(`Đã tự động đồng bộ chi phí Quảng cáo mới: +${mockAdSpendAmount.toLocaleString('vi-VN')} ₫!`);
      fetchBudget();
    } catch (err) {
      toast.error('Đồng bộ chi phí Ads thất bại.');
    } finally {
      setIsSyncingAds(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-slate-400">
        <RefreshCw className="h-6 w-6 animate-spin text-indigo-400 mr-2" />
        <span>Đang tính toán ngân sách chiến dịch...</span>
      </div>
    );
  }

  const {
    totalBudget = 35000000,
    totalSpent = 0,
    remainingBudget = 0,
    percentageUsed = 0,
    expenses = []
  } = budgetData || {};

  // Progress Bar Dynamic Color
  const progressColor =
    percentageUsed >= 100
      ? 'bg-rose-500'
      : percentageUsed >= 80
      ? 'bg-amber-500'
      : 'bg-emerald-500';

  return (
    <div className="space-y-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-7 backdrop-blur-md">
      
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
            <DollarSign className="h-4 w-4" /> Quản lý Ngân sách & Chi tiêu
          </div>
          <h3 className="text-xl font-bold text-white">Theo dõi ngân sách chiến dịch</h3>
          <p className="text-xs text-slate-400 mt-0.5">So sánh chi phí thực tế với ngân sách tiếp thị đã phê duyệt.</p>
        </div>

        {/* Mock Sync Ads Button */}
        <button
          type="button"
          onClick={handleSyncAdsSpend}
          disabled={isSyncingAds}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 px-4 py-2.5 text-xs font-bold text-indigo-300 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isSyncingAds ? 'animate-spin' : ''}`} />
          <span>{isSyncingAds ? 'Đang kết nối Ads API...' : 'Đồng bộ chi phí Ads'}</span>
        </button>
      </div>

      {/* Budget Summary Metrics & Progress Bar */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <span className="text-xs text-slate-400 block font-medium">Tổng ngân sách cấp</span>
            <span className="text-xl font-bold text-white mt-1 block">
              {totalBudget.toLocaleString('vi-VN')} ₫
            </span>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <span className="text-xs text-slate-400 block font-medium">Đã thực chi</span>
            <span className="text-xl font-bold text-indigo-400 mt-1 block">
              {totalSpent.toLocaleString('vi-VN')} ₫
            </span>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <span className="text-xs text-slate-400 block font-medium">Ngân sách còn lại</span>
            <span className={`text-xl font-bold mt-1 block ${remainingBudget > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {remainingBudget.toLocaleString('vi-VN')} ₫
            </span>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-400">Tiến độ giải ngân</span>
            <span className={percentageUsed >= 100 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
              {percentageUsed}% ({totalSpent.toLocaleString('vi-VN')} ₫ / {totalBudget.toLocaleString('vi-VN')} ₫)
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-950 border border-slate-800">
            <div
              className={`h-full transition-all duration-500 ${progressColor}`}
              style={{ width: `${Math.min(100, percentageUsed)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Log Expense Form */}
      <form onSubmit={handleAddExpense} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 space-y-3">
        <span className="text-xs font-bold text-white uppercase tracking-wider block">Ghi nhận chi phí mới</span>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Loại chi phí</label>
            <select
              value={expenseType}
              onChange={(e) => setExpenseType(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="KOL">Booking KOL / KOC</option>
              <option value="Ads">Quảng cáo (Ads)</option>
              <option value="Custom">Chi phí khác (Custom)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Số tiền (VND)</label>
            <input
              type="number"
              placeholder="Ví dụ: 5000000"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Ghi chú / Mô tả</label>
            <input
              type="text"
              placeholder="Nhập ghi chú chi tiết..."
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white shadow-md disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Ghi nhận chi phí
          </button>
        </div>
      </form>

      {/* Expenses Table List */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Danh sách chi phí đã ghi nhận ({expenses.length})
        </h4>

        <div className="space-y-2.5">
          {expenses.map((exp) => (
            <div
              key={exp.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5"
            >
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded-xl text-xs font-bold uppercase ${
                  exp.expenseType === 'KOL'
                    ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                    : exp.expenseType === 'Ads'
                    ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}>
                  {exp.expenseType}
                </span>

                <div>
                  <p className="text-xs font-bold text-white">{exp.note || `Chi phí ${exp.expenseType}`}</p>
                  <span className="text-[11px] text-slate-500">
                    {new Date(exp.date || exp.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>

              <span className="text-sm font-bold text-emerald-400">
                +{Number(exp.amount).toLocaleString('vi-VN')} ₫
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
