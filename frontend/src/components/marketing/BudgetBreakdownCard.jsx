import { Wallet, Megaphone, Users, Clapperboard, ShieldCheck } from 'lucide-react';

const FALLBACK_BUDGET = 20000000;

const ALLOCATIONS = [
  {
    key: 'ads',
    label: 'Chạy Quảng cáo (Ads)',
    percent: 40,
    icon: Megaphone,
    barClass: 'bg-gradient-to-r from-pink-500 to-rose-500',
    dotClass: 'bg-pink-500',
    chipClass: 'bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400',
  },
  {
    key: 'kol',
    label: 'Booking KOL/KOC',
    percent: 30,
    icon: Users,
    barClass: 'bg-gradient-to-r from-violet-500 to-purple-500',
    dotClass: 'bg-violet-500',
    chipClass: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
  },
  {
    key: 'production',
    label: 'Sản xuất nội dung',
    percent: 20,
    icon: Clapperboard,
    barClass: 'bg-gradient-to-r from-sky-400 to-blue-500',
    dotClass: 'bg-sky-400',
    chipClass: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400',
  },
  {
    key: 'contingency',
    label: 'Chi phí dự phòng',
    percent: 10,
    icon: ShieldCheck,
    barClass: 'bg-gradient-to-r from-amber-400 to-orange-400',
    dotClass: 'bg-amber-400',
    chipClass: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  },
];

/**
 * monthlyMarketingBudget is free text ("10.000.000 - 20.000.000 VND", "20 triệu"...).
 * Take the largest number found; treat small values with "triệu/tr" as millions.
 */
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

const formatVnd = (value) => `${Math.round(value).toLocaleString('vi-VN')}₫`;

export default function BudgetBreakdownCard({ rawBudget }) {
  const totalBudget = parseBudget(rawBudget);

  return (
    <section className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2.5rem] p-8 shadow-[0_4px_24px_rgba(255,143,163,0.06)] border border-surface-variant/30 relative overflow-hidden">
      <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-secondary-container/40 dark:bg-secondary-fixed-dim/5 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center gap-3 relative z-10">
        <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-md">
          <Wallet size={18} />
        </div>
        <div>
          <h3 className="text-headline-md font-bold text-primary dark:text-inverse-primary text-xl leading-tight">
            Dự toán Kinh phí
          </h3>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Phân bổ ngân sách đề xuất cho chiến dịch
          </p>
        </div>
      </div>

      {/* Total budget */}
      <div className="mt-6 rounded-2xl bg-surface-container dark:bg-surface-variant/30 p-5 relative z-10">
        <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
          Tổng ngân sách / tháng
        </span>
        <p className="text-2xl md:text-3xl font-bold text-primary dark:text-inverse-primary mt-1 font-display">
          {formatVnd(totalBudget)}
        </p>
      </div>

      {/* Stacked overview bar */}
      <div className="mt-6 flex h-3 w-full rounded-full overflow-hidden bg-surface-container dark:bg-surface-variant/30 relative z-10">
        {ALLOCATIONS.map((item) => (
          <div
            key={item.key}
            className={`${item.barClass} h-full first:rounded-l-full last:rounded-r-full`}
            style={{ width: `${item.percent}%` }}
            title={`${item.label}: ${item.percent}%`}
          />
        ))}
      </div>

      {/* Legend list with per-slice progress bars */}
      <ul className="mt-6 space-y-5 relative z-10">
        {ALLOCATIONS.map((item) => {
          const Icon = item.icon;
          const amount = (totalBudget * item.percent) / 100;
          return (
            <li key={item.key} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${item.dotClass}`} />
                  <Icon size={14} className="text-on-surface-variant shrink-0" />
                  <span className="text-sm font-medium text-primary dark:text-inverse-primary truncate">
                    {item.label}
                  </span>
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${item.chipClass}`}>
                  {item.percent}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-surface-container dark:bg-surface-variant/30 overflow-hidden">
                <div
                  className={`h-full rounded-full ${item.barClass} transition-all duration-700 ease-out`}
                  style={{ width: `${item.percent}%` }}
                />
              </div>
              <p className="text-xs font-bold text-on-surface-variant text-right">
                ≈ {formatVnd(amount)}
              </p>
            </li>
          );
        })}
      </ul>

      <p className="mt-6 text-[11px] text-on-surface-variant/70 italic relative z-10">
        * Tỷ lệ phân bổ do AI đề xuất dựa trên mục tiêu chiến dịch, có thể tùy chỉnh khi thực thi.
      </p>
    </section>
  );
}
