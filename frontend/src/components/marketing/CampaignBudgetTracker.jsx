import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, RefreshCw, Plus, Receipt, Sparkles } from 'lucide-react';
import { budgetApi } from '../../api/budgetApi';
import { toast } from '../../store/toastStore';

export default function CampaignBudgetTracker({ campaignId = 1, initialData = null }) {
  const [budgetData, setBudgetData] = useState(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [isSyncingAds, setIsSyncingAds] = useState(false);

  // Form states for new expense logging
  const [expenseType, setExpenseType] = useState('');
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
    if (!expenseType.trim()) {
      toast.error('Vui lòng nhập loại chi phí.');
      return;
    }
    const numericAmount = Number(amountInput);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast.error('Vui lòng nhập số tiền chi tiêu hợp lệ.');
      return;
    }

    try {
      setIsSubmitting(true);
      await budgetApi.addExpense({
        marketingPlanId: campaignId,
        expenseType: expenseType.trim(),
        amount: numericAmount,
        note: noteInput || `Chi phí ${expenseType.trim()}`
      });

      toast.success(`Đã ghi nhận chi phí "${expenseType.trim()}" (${numericAmount.toLocaleString('vi-VN')} ₫)!`);
      setExpenseType('');
      setAmountInput('');
      setNoteInput('');
      fetchBudget();
    } catch (err) {
      toast.error('Không thể ghi nhận chi phí.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Simulated Mock Sync for Ads Spend
  const handleSyncAdsSpend = async () => {
    try {
      setIsSyncingAds(true);
      await new Promise(r => setTimeout(r, 1200));

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
      <div className="flex items-center justify-center p-8 text-on-surface-variant bg-surface-container-lowest dark:bg-tertiary-container rounded-3xl border border-surface-variant/30">
        <RefreshCw className="h-6 w-6 animate-spin text-primary mr-2" />
        <span className="text-sm font-medium">Đang tính toán ngân sách chiến dịch...</span>
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
      ? 'bg-error'
      : percentageUsed >= 80
      ? 'bg-amber-500'
      : 'bg-emerald-500';

  return (
    <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2.5rem] p-6 sm:p-8 shadow-ambient border border-surface-variant/40 space-y-6 relative overflow-hidden">
      
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-surface-variant/30 pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-secondary uppercase tracking-wider mb-1 bg-secondary-container px-3 py-1 rounded-full">
            <DollarSign size={14} /> Quản lý Ngân sách & Chi tiêu
          </span>
          <h3 className="text-2xl font-bold text-primary dark:text-inverse-primary mt-1">
            Theo dõi ngân sách chiến dịch
          </h3>
          <p className="text-xs text-on-surface-variant mt-0.5">
            So sánh chi phí thực tế với ngân sách tiếp thị đã phê duyệt.
          </p>
        </div>

        {/* Mock Sync Ads Button */}
        <button
          type="button"
          onClick={handleSyncAdsSpend}
          disabled={isSyncingAds}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-surface-variant/50 bg-secondary-container hover:bg-secondary-container/80 px-5 py-2.5 text-xs font-bold text-primary transition-all disabled:opacity-50 shrink-0"
        >
          <RefreshCw size={14} className={isSyncingAds ? 'animate-spin' : ''} />
          <span>{isSyncingAds ? 'Đang kết nối Ads API...' : 'Đồng bộ chi phí Ads'}</span>
        </button>
      </div>

      {/* Budget Summary Metrics & Progress Bar */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface-container-low dark:bg-surface-variant/20 rounded-2xl p-4 border border-surface-variant/30">
            <span className="text-xs text-on-surface-variant block font-medium">Tổng ngân sách cấp</span>
            <span className="text-xl font-bold text-primary dark:text-inverse-primary mt-1 block">
              {totalBudget.toLocaleString('vi-VN')} ₫
            </span>
          </div>

          <div className="bg-surface-container-low dark:bg-surface-variant/20 rounded-2xl p-4 border border-surface-variant/30">
            <span className="text-xs text-on-surface-variant block font-medium">Đã thực chi</span>
            <span className="text-xl font-bold text-secondary mt-1 block">
              {totalSpent.toLocaleString('vi-VN')} ₫
            </span>
          </div>

          <div className="bg-surface-container-low dark:bg-surface-variant/20 rounded-2xl p-4 border border-surface-variant/30">
            <span className="text-xs text-on-surface-variant block font-medium">Ngân sách còn lại</span>
            <span className={`text-xl font-bold mt-1 block ${remainingBudget > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-error'}`}>
              {remainingBudget.toLocaleString('vi-VN')} ₫
            </span>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-on-surface-variant">Tiến độ giải ngân</span>
            <span className={percentageUsed >= 100 ? 'text-error font-bold' : 'text-primary dark:text-inverse-primary'}>
              {percentageUsed}% ({totalSpent.toLocaleString('vi-VN')} ₫ / {totalBudget.toLocaleString('vi-VN')} ₫)
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-surface-container-high dark:bg-surface-variant/40 border border-surface-variant/30">
            <div
              className={`h-full transition-all duration-500 ${progressColor}`}
              style={{ width: `${Math.min(100, percentageUsed)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Log Expense Form */}
      <form onSubmit={handleAddExpense} className="bg-surface-container-low dark:bg-surface-variant/20 rounded-3xl p-5 border border-surface-variant/30 space-y-3">
        <span className="text-xs font-bold text-primary dark:text-inverse-primary uppercase tracking-wider block">
          Ghi nhận chi phí mới
        </span>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-on-surface-variant mb-1">Loại chi phí</label>
            <input
              type="text"
              placeholder="Nhập loại chi phí (Ví dụ: Booking KOL, Ads, Thiết kế...)"
              value={expenseType}
              onChange={(e) => setExpenseType(e.target.value)}
              className="w-full rounded-2xl border border-surface-variant/40 bg-surface-container-lowest dark:bg-tertiary-container p-3 text-xs text-primary dark:text-inverse-primary focus:outline-none focus:ring-2 focus:ring-secondary/40"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-on-surface-variant mb-1">Số tiền (VND)</label>
            <input
              type="number"
              placeholder="Ví dụ: 5000000"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="w-full rounded-2xl border border-surface-variant/40 bg-surface-container-lowest dark:bg-tertiary-container p-3 text-xs text-primary dark:text-inverse-primary focus:outline-none focus:ring-2 focus:ring-secondary/40"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-on-surface-variant mb-1">Ghi chú / Mô tả</label>
            <input
              type="text"
              placeholder="Nhập ghi chú chi tiết..."
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              className="w-full rounded-2xl border border-surface-variant/40 bg-surface-container-lowest dark:bg-tertiary-container p-3 text-xs text-primary dark:text-inverse-primary focus:outline-none focus:ring-2 focus:ring-secondary/40"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary text-on-primary hover:opacity-90 px-6 py-2.5 text-xs font-label-sm font-bold shadow-sm transition-opacity disabled:opacity-50"
          >
            <Plus size={16} /> Ghi nhận chi phí
          </button>
        </div>
      </form>

      {/* Expenses Table List */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          Danh sách chi phí đã ghi nhận ({expenses.length})
        </h4>

        <div className="space-y-2.5">
          {expenses.map((exp) => (
            <div
              key={exp.id}
              className="flex items-center justify-between gap-3 rounded-2xl bg-surface-container-lowest dark:bg-tertiary-container p-4 border border-surface-variant/30 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-secondary-container text-secondary border border-secondary-container/60">
                  {exp.expenseType}
                </span>

                <div>
                  <p className="text-xs font-bold text-primary dark:text-inverse-primary">{exp.note || `Chi phí ${exp.expenseType}`}</p>
                  <span className="text-[11px] text-on-surface-variant">
                    {new Date(exp.date || exp.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>

              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                +{Number(exp.amount).toLocaleString('vi-VN')} ₫
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
