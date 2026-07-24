import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Star, 
  DollarSign, 
  Percent, 
  Hash, 
  Eye, 
  Users, 
  ShoppingBag, 
  Zap,
  HelpCircle
} from 'lucide-react';

/**
 * Utility helper to format values dynamically based on metric format
 */
export function formatMetricValue(value, format = 'number', currencySymbol = '₫', unit = '') {
  if (value === null || value === undefined) return '0';

  const numericVal = Number(value);

  switch (format) {
    case 'currency':
      if (isNaN(numericVal)) return `${value} ${currencySymbol || unit}`;
      if (currencySymbol === '₫' || unit === 'VND') {
        return new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND',
          maximumFractionDigits: 0
        }).format(numericVal);
      }
      return `${currencySymbol || ''}${new Intl.NumberFormat('en-US').format(numericVal)}`;

    case 'percentage':
      if (isNaN(numericVal)) return `${value}%`;
      return `${numericVal.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}%`;

    case 'rating':
      return `${numericVal.toFixed(1)} ${unit || '/ 5'}`;

    case 'number':
    default:
      if (isNaN(numericVal)) return String(value);
      if (numericVal >= 1000000) {
        return `${(numericVal / 1000000).toFixed(1)}M ${unit}`.trim();
      }
      if (numericVal >= 10000) {
        return `${(numericVal / 1000).toFixed(1)}K ${unit}`.trim();
      }
      return `${numericVal.toLocaleString('vi-VN')} ${unit}`.trim();
  }
}

/**
 * Icon picker helper based on metric key or category
 */
function getMetricIcon(key = '', category = '') {
  const k = key.toLowerCase();
  if (k.includes('gmv') || k.includes('revenue') || k.includes('aov') || k.includes('price')) return DollarSign;
  if (k.includes('er') || k.includes('conversion') || k.includes('completion') || k.includes('rate')) return Percent;
  if (k.includes('rating') || k.includes('star')) return Star;
  if (k.includes('views') || k.includes('impressions') || k.includes('traffic')) return Eye;
  if (k.includes('reach') || k.includes('follower') || k.includes('growth')) return Users;
  if (category === 'ecommerce') return ShoppingBag;
  if (category === 'social') return Zap;
  return Hash;
}

export default function MetricCard({ metric, className = '' }) {
  if (!metric) return null;

  const {
    label = 'Chỉ số',
    value = 0,
    format = 'number',
    currencySymbol = '₫',
    unit = '',
    trend = '',
    description = '',
    category = 'general',
    key = ''
  } = metric;

  const formattedValue = formatMetricValue(value, format, currencySymbol, unit);
  const IconComponent = getMetricIcon(key, category);

  // Parse trend direction
  const isPositiveTrend = trend.startsWith('+');
  const isNegativeTrend = trend.startsWith('-');
  
  const TrendIcon = isPositiveTrend ? TrendingUp : isNegativeTrend ? TrendingDown : Minus;

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/70 p-5 shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/50 hover:shadow-indigo-500/10 ${className}`}>
      {/* Background Subtle Accent Glow */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-indigo-500/10 blur-2xl" />

      {/* Card Header: Icon & Trend */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 shadow-inner">
            <IconComponent className="h-5 w-5" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {category === 'ecommerce' ? 'E-Commerce' : category === 'social' ? 'Social' : 'Analytics'}
          </span>
        </div>

        {trend && (
          <div
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
              isPositiveTrend
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : isNegativeTrend
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            <TrendIcon className="h-3.5 w-3.5" />
            <span>{trend}</span>
          </div>
        )}
      </div>

      {/* Card Body: Metric Label & Main Value */}
      <div className="mt-2">
        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-300">
          <span>{label}</span>
          {description && (
            <span className="group relative cursor-help text-slate-500 hover:text-slate-300">
              <HelpCircle className="h-3.5 w-3.5" />
              <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-950 px-2.5 py-1 text-xs text-slate-200 opacity-0 shadow-xl transition-opacity group-hover:opacity-100 border border-slate-800 z-20">
                {description}
              </span>
            </span>
          )}
        </div>

        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {formattedValue}
          </span>
        </div>
      </div>
    </div>
  );
}
