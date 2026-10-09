import React, { useState, useEffect } from 'react';
import { Wallet, RefreshCw } from 'lucide-react';
import { budgetApi } from '../../api/budgetApi';

export default function MonthlySpendWidget() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSpend = async () => {
    try {
      setLoading(true);
      const res = await budgetApi.getMonthlySpend();
      setData(res);
    } catch (err) {
      console.error('[Monthly Spend Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpend();
  }, []);

  if (loading) {
    return (
      <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-3xl p-6 shadow-ambient border border-surface-variant/30 text-center text-on-surface-variant">
        <RefreshCw className="mx-auto h-6 w-6 animate-spin text-primary mb-2" />
        <span className="text-xs font-medium">Đang tổng hợp chi tiêu tháng...</span>
      </div>
    );
  }

  const {
    monthYear = 'Tháng này',
    totalMonthlySpend = 0,
    monthlyBudgetGoal = 50000000,
    budgetUtilization = 0,
    breakdown = { adsSpend: 0, otherSpend: 0 }
  } = data || {};

  return (
    <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-3xl p-6 shadow-ambient hover:shadow-ambient-hover border border-surface-variant/30 transition-all duration-300 relative overflow-hidden group">
      {/* Decorative ambient gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-container/40 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-variant/20 pb-4 mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-secondary-container text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Wallet size={22} />
          </div>
          <div>
            <h3 className="text-label-sm font-label-sm text-primary dark:text-inverse-primary font-bold">
              Tổng chi tiêu tháng
            </h3>
            <span className="text-xs text-on-surface-variant capitalize">{monthYear}</span>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-secondary-container text-secondary text-xs font-bold border border-secondary-container/60">
          {budgetUtilization}% Định mức
        </span>
      </div>

      {/* Main Metric */}
      <div className="relative z-10">
        <span className="text-xs font-medium text-on-surface-variant block">Đã giải ngân</span>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-primary dark:text-inverse-primary">
            {totalMonthlySpend.toLocaleString('vi-VN')} ₫
          </span>
        </div>
        <div className="mt-2 text-xs text-on-surface-variant">
          Định mức mục tiêu: <span className="font-bold text-primary dark:text-inverse-primary">{monthlyBudgetGoal.toLocaleString('vi-VN')} ₫</span>
        </div>
      </div>

      {/* Breakdown Cards Grid */}
      <div className="mt-5 grid grid-cols-2 gap-2.5 pt-4 border-t border-surface-variant/20 relative z-10">
        <div className="bg-surface-container-low dark:bg-surface-variant/20 rounded-2xl p-2.5 text-center border border-surface-variant/30">
          <span className="text-[10px] font-bold uppercase text-on-surface-variant block">Quảng cáo Ads</span>
          <span className="text-xs font-bold text-primary dark:text-inverse-primary mt-1 block truncate">
            {(breakdown.adsSpend || 0).toLocaleString('vi-VN')} ₫
          </span>
        </div>

        <div className="bg-surface-container-low dark:bg-surface-variant/20 rounded-2xl p-2.5 text-center border border-surface-variant/30">
          <span className="text-[10px] font-bold uppercase text-on-surface-variant block">Khác</span>
          <span className="text-xs font-bold text-primary dark:text-inverse-primary mt-1 block truncate">
            {(breakdown.otherSpend || 0).toLocaleString('vi-VN')} ₫
          </span>
        </div>
      </div>
    </div>
  );
}
