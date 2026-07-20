import { useState } from 'react';
import { Wallet, ShoppingBag, Video, Sparkles } from 'lucide-react';

const FALLBACK_BUDGET = 20000000;

export function parseBudget(raw) {
  if (typeof raw === 'number' && raw > 0) return raw;
  if (!raw || typeof raw !== 'string') return FALLBACK_BUDGET;

  const matches = raw.match(/\d[\d.,]*/g);
  if (!matches) return FALLBACK_BUDGET;

  const numbers = matches
    .map((m) => Number(m.replace(/[.,]/g, '')))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (!numbers.length) return FALLBACK_BUDGET;

  let value = Math.max(...numbers);
  if (value < 1000 && /triệu|trieu|\btr\b/i.test(raw)) {
    value *= 1000000;
  }
  return value >= 100000 ? value : FALLBACK_BUDGET;
}

const formatVnd = (value) => {
  return new Intl.NumberFormat('vi-VN').format(Math.round(value)) + 'đ';
};

export default function BudgetBreakdownCard({ rawBudget }) {
  const totalBudget = parseBudget(rawBudget);
  const [activeTab, setActiveTab] = useState('shopee');

  const shopeeBudget = totalBudget * 0.51;
  const tikTokBudget = totalBudget * 0.49;

  // Shopee Channel Allocations (Table A)
  const shopeeItems = [
    { name: 'Shopee Ads', percent: 45, value: shopeeBudget * 0.45 },
    { name: 'Voucher / Freeship / Flash Sale Subsidy', percent: 30, value: shopeeBudget * 0.30 },
    { name: 'Shop operation & customer service', percent: 8, value: shopeeBudget * 0.08 },
    { name: 'Store creative: banner, ảnh, video sản phẩm', percent: 7, value: shopeeBudget * 0.07 },
    { name: 'Platform fee reserve / chi phí sàn dự phòng', percent: 10, value: shopeeBudget * 0.10 },
  ];

  // Shopee Ads Breakdown (Table B)
  const shopeeAdsItems = [
    { name: 'Search Ads', percent: 45, value: (shopeeBudget * 0.45) * 0.45 },
    { name: 'Discovery Ads', percent: 20, value: (shopeeBudget * 0.45) * 0.20 },
    { name: 'Shopee Video / Livestream Boost', percent: 15, value: (shopeeBudget * 0.45) * 0.15 },
    { name: 'Retargeting', percent: 10, value: (shopeeBudget * 0.45) * 0.10 },
    { name: 'Double-day Super Sale Push', percent: 10, value: (shopeeBudget * 0.45) * 0.10 },
  ];

  // TikTok Shop Channel Allocations (Table C)
  const tikTokItems = [
    { name: 'TikTok Shop Ads', percent: 38, value: tikTokBudget * 0.38 },
    { name: 'Affiliate/KOC commission', percent: 25, value: tikTokBudget * 0.25 },
    { name: 'Voucher / Freeship / Deal subsidy', percent: 20, value: tikTokBudget * 0.20 },
    { name: 'Livestream production & host', percent: 9, value: tikTokBudget * 0.09 },
    { name: 'Shop operation', percent: 3, value: tikTokBudget * 0.03 },
    { name: 'Platform fee reserve', percent: 5, value: tikTokBudget * 0.05 },
  ];

  return (
    <section className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-6 md:p-8 shadow-ambient border border-surface-variant/30 relative overflow-hidden w-full transition-all">
      {/* Decorative Glow */}
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-secondary-container/20 dark:bg-secondary-fixed-dim/5 rounded-full blur-3xl pointer-events-none" />

      {/* Card Header */}
      <div className="flex flex-col gap-4 border-b border-surface-variant/30 pb-6 relative z-10">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-md shrink-0 mt-0.5">
            <Wallet size={18} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-primary dark:text-inverse-primary leading-snug">
              Phân Bổ Ngân Sách Đề Xuất
            </h3>
            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
              Chi tiết phân bổ tài chính giữa các kênh thương mại điện tử
            </p>
          </div>
        </div>

        {/* Total Budget Pill */}
        <div className="bg-surface-container-low dark:bg-surface-variant/20 px-4 py-3 rounded-2xl border border-surface-variant/30 flex flex-col items-start justify-center w-full mt-1">
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
            Tổng ngân sách đề xuất
          </span>
          <span className="text-xl font-bold text-primary dark:text-inverse-primary font-display mt-1">
            {formatVnd(totalBudget)}
          </span>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex gap-2 p-1.5 bg-surface-container-low dark:bg-surface-variant/10 rounded-2xl mt-6 relative z-10">
        <button
          onClick={() => setActiveTab('shopee')}
          className={`flex-1 py-3 px-4 rounded-xl font-label-sm text-label-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === 'shopee'
              ? 'bg-secondary text-on-secondary shadow-md font-bold'
              : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-high/50'
          }`}
        >
          <ShoppingBag size={16} />
          <span>Kênh Shopee ({formatVnd(shopeeBudget)})</span>
        </button>
        <button
          onClick={() => setActiveTab('tiktok')}
          className={`flex-1 py-3 px-4 rounded-xl font-label-sm text-label-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === 'tiktok'
              ? 'bg-secondary text-on-secondary shadow-md font-bold'
              : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-high/50'
          }`}
        >
          <Video size={16} />
          <span>Kênh TikTok Shop ({formatVnd(tikTokBudget)})</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="mt-6 space-y-8 relative z-10">
        {activeTab === 'shopee' ? (
          <div className="space-y-8 animate-fade-in">
            {/* Table 1: Shopee Channel Breakdown */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-secondary" />
                <h4 className="text-sm font-bold text-primary dark:text-inverse-primary uppercase tracking-wider">
                  A. Dự toán chi phí Shopee
                </h4>
              </div>
              <div className="overflow-x-auto rounded-2xl border border-outline/20">
                <table className="w-full border-collapse text-left text-xs md:text-sm">
                  <thead>
                    <tr className="bg-surface-container-low dark:bg-surface-variant/30 text-on-surface-variant font-bold border-b border-outline/20">
                      <th className="px-4 py-3.5 font-semibold">Hạng mục chi phí</th>
                      <th className="px-4 py-3.5 font-semibold text-center w-[120px] md:w-[150px]">Tỷ lệ trong kênh</th>
                      <th className="px-4 py-3.5 font-semibold text-right w-[150px] md:w-[200px]">Ngân sách</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline/10">
                    {shopeeItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-surface-container-high/35 dark:hover:bg-surface-variant/10 transition-colors">
                        <td className="px-4 py-3 text-primary dark:text-inverse-primary font-medium">{item.name}</td>
                        <td className="px-4 py-3 text-center text-on-surface-variant font-medium">{item.percent}%</td>
                        <td className="px-4 py-3 text-right text-primary dark:text-inverse-primary font-semibold">{formatVnd(item.value)}</td>
                      </tr>
                    ))}
                    {/* Total Row */}
                    <tr className="bg-rose-50/50 dark:bg-rose-950/20 font-bold border-t border-outline/20 text-rose-600 dark:text-rose-400">
                      <td className="px-4 py-3.5">Total</td>
                      <td className="px-4 py-3.5 text-center">100%</td>
                      <td className="px-4 py-3.5 text-right font-display text-base">{formatVnd(shopeeBudget)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table 2: Shopee Ads Breakdown */}
            <div className="space-y-3 pt-2 border-t border-surface-variant/20">
              <h4 className="text-sm font-bold text-primary dark:text-inverse-primary uppercase tracking-wider flex items-center gap-2">
                <BarChart3 size={16} className="text-secondary" />
                Breakdown Shopee Ads
              </h4>
              <div className="overflow-x-auto rounded-2xl border border-outline/20">
                <table className="w-full border-collapse text-left text-xs md:text-sm">
                  <thead>
                    <tr className="bg-surface-container-low dark:bg-surface-variant/30 text-on-surface-variant font-bold border-b border-outline/20">
                      <th className="px-4 py-3.5 font-semibold">Loại quảng cáo Shopee</th>
                      <th className="px-4 py-3.5 font-semibold text-center w-[120px] md:w-[150px]">Tỷ lệ trong Shopee Ads</th>
                      <th className="px-4 py-3.5 font-semibold text-right w-[150px] md:w-[200px]">Ngân sách</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline/10">
                    {shopeeAdsItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-surface-container-high/35 dark:hover:bg-surface-variant/10 transition-colors">
                        <td className="px-4 py-3 text-primary dark:text-inverse-primary font-medium">{item.name}</td>
                        <td className="px-4 py-3 text-center text-on-surface-variant font-medium">{item.percent}%</td>
                        <td className="px-4 py-3 text-right text-primary dark:text-inverse-primary font-semibold">{formatVnd(item.value)}</td>
                      </tr>
                    ))}
                    {/* Total Row */}
                    <tr className="bg-rose-50/50 dark:bg-rose-950/20 font-bold border-t border-outline/20 text-rose-600 dark:text-rose-400">
                      <td className="px-4 py-3.5">Total</td>
                      <td className="px-4 py-3.5 text-center">100%</td>
                      <td className="px-4 py-3.5 text-right font-display text-base">{formatVnd(shopeeBudget * 0.45)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            {/* Context Text Description */}
            <div className="bg-surface-container-low dark:bg-surface-variant/20 p-4 rounded-2xl border border-surface-variant/30 text-xs md:text-sm text-on-surface-variant leading-relaxed">
              <span className="font-bold text-primary dark:text-inverse-primary">TikTok Shop</span> phải chi nhiều cho <span className="font-semibold text-secondary">affiliate/KOC</span> và <span className="font-semibold text-secondary">livestream</span>, không chỉ quảng cáo Ads đơn thuần. Để tối ưu chuyển đổi, người tiêu dùng cần kiểm chứng trực quan về sản phẩm (lực gió, kích thước, độ ồn, trải nghiệm thực tế) trước khi quyết định mua hàng. Đồng thời, nền tảng có áp dụng chi phí hoa hồng sàn (platform commission fee) cho mỗi đơn hàng thành công, vì vậy cần chuẩn bị sẵn chi phí dự phòng.
            </div>

            {/* Table 3: TikTok Shop Channel Breakdown */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-secondary" />
                <h4 className="text-sm font-bold text-primary dark:text-inverse-primary uppercase tracking-wider">
                  B. Dự toán chi phí TikTok Shop
                </h4>
              </div>
              <div className="overflow-x-auto rounded-2xl border border-outline/20">
                <table className="w-full border-collapse text-left text-xs md:text-sm">
                  <thead>
                    <tr className="bg-surface-container-low dark:bg-surface-variant/30 text-on-surface-variant font-bold border-b border-outline/20">
                      <th className="px-4 py-3.5 font-semibold">Hạng mục chi phí</th>
                      <th className="px-4 py-3.5 font-semibold text-center w-[120px] md:w-[150px]">Tỷ lệ trong kênh</th>
                      <th className="px-4 py-3.5 font-semibold text-right w-[150px] md:w-[200px]">Ngân sách</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline/10">
                    {tikTokItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-surface-container-high/35 dark:hover:bg-surface-variant/10 transition-colors">
                        <td className="px-4 py-3 text-primary dark:text-inverse-primary font-medium">{item.name}</td>
                        <td className="px-4 py-3 text-center text-on-surface-variant font-medium">{item.percent}%</td>
                        <td className="px-4 py-3 text-right text-primary dark:text-inverse-primary font-semibold">{formatVnd(item.value)}</td>
                      </tr>
                    ))}
                    {/* Total Row */}
                    <tr className="bg-rose-50/50 dark:bg-rose-950/20 font-bold border-t border-outline/20 text-rose-600 dark:text-rose-400">
                      <td className="px-4 py-3.5">Total</td>
                      <td className="px-4 py-3.5 text-center">100%</td>
                      <td className="px-4 py-3.5 text-right font-display text-base">{formatVnd(tikTokBudget)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="mt-6 text-[11px] text-on-surface-variant/70 italic relative z-10">
        * Tỷ lệ và hạng mục phân bổ chi phí được đề xuất tối ưu theo mục tiêu kinh doanh của chiến dịch.
      </p>
    </section>
  );
}

function BarChart3({ size, className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size || 24}
      height={size || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  );
}
