import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  RefreshCw, 
  PieChart, 
  ArrowUpRight, 
  Megaphone, 
  Users, 
  CreditCard 
} from 'lucide-react';
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
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 text-center text-slate-400 backdrop-blur-md">
        <RefreshCw className="mx-auto h-6 w-6 animate-spin text-indigo-400 mb-2" />
        <span className="text-xs">Đang tổng hợp chi tiêu tháng...</span>
      </div>
    );
  }

  const {
    monthYear = 'Tháng này',
    totalMonthlySpend = 0,
    monthlyBudgetGoal = 50000000,
    budgetUtilization = 0,
    breakdown = { kolSpend: 0, adsSpend: 0, customSpend: 0 }
  } = data || {};

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/90 to-indigo-950/40 p-6 shadow-xl backdrop-blur-xl transition-all hover:border-slate-700">
      {/* Background Subtle Accent Glow */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-500/10 blur-2xl" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-inner">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Tổng chi tiêu tháng</h3>
            <span className="text-xs text-slate-400 capitalize">{monthYear}</span>
          </div>
        </div>

        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
          {budgetUtilization}% Định mức
        </span>
      </div>

      {/* Total Spend Stat */}
      <div>
        <span className="text-xs font-medium text-slate-400">Tổng đã giải ngân</span>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {totalMonthlySpend.toLocaleString('vi-VN')} ₫
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-400">
          Định mức mục tiêu: <span className="font-bold text-slate-200">{monthlyBudgetGoal.toLocaleString('vi-VN')} ₫</span>
        </div>
      </div>

      {/* Spend Breakdown Cards Grid */}
      <div className="mt-5 grid grid-cols-3 gap-2.5 pt-4 border-t border-slate-800/80">
        <div className="rounded-2xl border border-purple-500/20 bg-purple-500/10 p-2.5 text-center">
          <span className="text-[10px] font-bold uppercase text-purple-300 block">KOL Booking</span>
          <span className="text-xs font-extrabold text-white mt-1 block truncate">
            {(breakdown.kolSpend || 0).toLocaleString('vi-VN')} ₫
          </span>
        </div>

        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-2.5 text-center">
          <span className="text-[10px] font-bold uppercase text-indigo-300 block">Quảng cáo Ads</span>
          <span className="text-xs font-extrabold text-white mt-1 block truncate">
            {(breakdown.adsSpend || 0).toLocaleString('vi-VN')} ₫
          </span>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-2.5 text-center">
          <span className="text-[10px] font-bold uppercase text-slate-300 block">Khác</span>
          <span className="text-xs font-extrabold text-white mt-1 block truncate">
            {(breakdown.customSpend || 0).toLocaleString('vi-VN')} ₫
          </span>
        </div>
      </div>
    </div>
  );
}
