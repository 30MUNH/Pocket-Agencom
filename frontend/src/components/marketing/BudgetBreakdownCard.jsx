import { useState } from 'react';
import { Wallet, Sparkles } from 'lucide-react';
import { normalizeBudgetChannels } from '../../utils/budgetBreakdown';

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

/* ── Channel icon helper ─────────────────────────────────────────────────────── */
function ChannelIcon({ name, size = 16 }) {
  const n = (name || '').toLowerCase();
  if (n.includes('shopee')) return <ShoppingBagIcon size={size} />;
  if (n.includes('tiktok')) return <VideoIcon size={size} />;
  if (n.includes('facebook') || n.includes('meta')) return <FacebookIcon size={size} />;
  if (n.includes('instagram')) return <InstagramIcon size={size} />;
  if (n.includes('youtube')) return <YoutubeIcon size={size} />;
  if (n.includes('google')) return <GoogleIcon size={size} />;
  return <Sparkles size={size} />;
}

/* ── MAIN COMPONENT ──────────────────────────────────────────────────────────── */
export default function BudgetBreakdownCard({ rawBudget, budgetBreakdown }) {
  const totalBudget = parseBudget(rawBudget);
  const channels = normalizeBudgetChannels(budgetBreakdown?.channels);
  const hasDynamic = channels.length > 0;

  const [activeTabIdx, setActiveTabIdx] = useState(0);

  /* ── Dynamic rendering (AI-generated) ──────────────────────────────────────── */
  if (hasDynamic) {
    const activeChannel = channels[activeTabIdx] || channels[0];
    const channelBudget = totalBudget * (activeChannel.percentOfTotal / 100);
    const items = (activeChannel.items || []).map((item) => ({
      ...item,
      value: channelBudget * (item.percent / 100),
    }));

    return (
      <section className="bg-white rounded-2xl p-7 shadow-sm border border-slate-200/80 relative overflow-hidden w-full transition-all">
        {/* Card Header */}
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 relative z-10">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FFCED2] text-slate-900 flex items-center justify-center shrink-0 mt-0.5">
              <Wallet size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-snug">
                Phân Bổ Ngân Sách Đề Xuất
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Chi tiết phân bổ tài chính theo kênh triển khai chiến dịch
              </p>
            </div>
          </div>

          {/* Total Budget Pill */}
          <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-200/80 flex flex-col items-start justify-center w-full mt-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Tổng ngân sách đề xuất
            </span>
            <span className="text-xl font-bold text-slate-900 mt-0.5">
              {formatVnd(totalBudget)}
            </span>
          </div>
        </div>

        {/* Tabs Selector — Dynamic */}
        {channels.length > 1 && (
          <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl mt-5 relative z-10 flex-wrap">
            {channels.map((ch, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTabIdx(idx)}
                className={`flex-1 min-w-0 py-2.5 px-3 rounded-lg text-xs transition-all flex items-center justify-center gap-2 ${
                  activeTabIdx === idx
                    ? 'bg-[#FFCED2] text-slate-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 font-medium'
                }`}
              >
                <ChannelIcon name={ch.channelName} size={16} />
                <span className="truncate">
                  {ch.channelName} ({ch.percentOfTotal}%)
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Tab Content */}
        <div className="mt-6 space-y-6 relative z-10 animate-fade-in" key={activeTabIdx}>
          {/* Channel description */}
          {activeChannel.description && (
            <div className="bg-surface-container-low dark:bg-surface-variant/20 p-4 rounded-2xl border border-surface-variant/30 text-xs md:text-sm text-on-surface-variant leading-relaxed">
              <span className="font-bold text-primary dark:text-inverse-primary">{activeChannel.channelName}</span>
              {' — '}
              {activeChannel.description}
            </div>
          )}

          {/* Budget table */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-secondary" />
              <h4 className="text-sm font-bold text-primary dark:text-inverse-primary uppercase tracking-wider">
                Dự toán chi phí {activeChannel.channelName}
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
                  {items.map((item, idx) => (
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
                    <td className="px-4 py-3.5 text-right font-display text-base">{formatVnd(channelBudget)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <p className="mt-6 text-[11px] text-on-surface-variant/70 italic relative z-10">
          * Tỷ lệ và hạng mục phân bổ chi phí được AI đề xuất tối ưu theo kênh triển khai và mục tiêu kinh doanh của chiến dịch.
        </p>
      </section>
    );
  }

  /* ── Fallback (no AI breakdown — old plans) ────────────────────────────────── */
  return (
    <section className="bg-white rounded-2xl p-7 shadow-sm border border-slate-200/80 relative overflow-hidden w-full transition-all">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 relative z-10">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#FFCED2] text-slate-900 flex items-center justify-center shrink-0 mt-0.5">
            <Wallet size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 leading-snug">
              Phân Bổ Ngân Sách Đề Xuất
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Chưa có dữ liệu phân bổ chi tiết từ AI. Tạo chiến dịch mới để nhận phân bổ ngân sách tự động.
            </p>
          </div>
        </div>

        <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-200/80 flex flex-col items-start justify-center w-full mt-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Tổng ngân sách đề xuất
          </span>
          <span className="text-xl font-bold text-slate-900 mt-0.5">
            {formatVnd(totalBudget)}
          </span>
        </div>
      </div>

      <p className="mt-5 text-[11px] text-slate-400 italic relative z-10">
        * Để nhận phân bổ ngân sách chi tiết theo kênh, vui lòng tạo chiến dịch mới.
      </p>
    </section>
  );
}

/* ── Simple SVG Icon Components ──────────────────────────────────────────────── */

function ShoppingBagIcon({ size }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  );
}

function VideoIcon({ size }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/>
    </svg>
  );
}

function FacebookIcon({ size }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  );
}

function InstagramIcon({ size }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  );
}

function YoutubeIcon({ size }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/>
      <path d="m10 15 5-3-5-3z"/>
    </svg>
  );
}

function GoogleIcon({ size }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>
    </svg>
  );
}
