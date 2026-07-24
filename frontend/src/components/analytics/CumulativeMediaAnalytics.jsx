import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Layers, 
  ExternalLink, 
  RefreshCw, 
  Store, 
  Globe, 
  Sparkles, 
  ShoppingBag, 
  Share2, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  SlidersHorizontal,
  LayoutGrid,
  ListFilter
} from 'lucide-react';
import MetricCard, { formatMetricValue } from './MetricCard';
import { analyticsApi } from '../../api/analyticsApi';

// Dynamic Icon Resolver for connected platforms
export function PlatformIcon({ platformKey = '', className = 'h-5 w-5' }) {
  const p = platformKey.toLowerCase();
  
  if (p.includes('tiktok')) {
    return (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.09-1.51-.71-.53-1.3-1.22-1.74-2v6.62c.04 2.87-1.39 5.86-3.99 7.06-2.58 1.25-6.02.9-8.15-1.14-2.28-2.26-2.47-6.27-.42-8.77 1.83-2.3 5.34-2.88 7.82-1.33v4.19c-1.41-.95-3.41-.74-4.57.51-.97 1.09-1.01 2.89-.08 4 .98 1.22 2.85 1.48 4.09.57.85-.59 1.28-1.63 1.25-2.67V.02z"/>
      </svg>
    );
  }

  if (p.includes('facebook')) {
    return (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/>
      </svg>
    );
  }

  if (p.includes('instagram')) {
    return (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
      </svg>
    );
  }

  if (p.includes('shopee')) {
    return <ShoppingBag className={className} />;
  }

  if (p.includes('lazada') || p.includes('tiki')) {
    return <Store className={className} />;
  }

  return <Globe className={className} />;
}

export default function CumulativeMediaAnalytics({ businessId = null, initialPlatformsData = null }) {
  const [analyticsData, setAnalyticsData] = useState(initialPlatformsData);
  const [loading, setLoading] = useState(!initialPlatformsData);
  const [error, setError] = useState(null);
  
  // Layout views: 'stacked' (all platforms rendered sequentially) or platformId for single tab
  const [activeTab, setActiveTab] = useState('all');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      let res;
      if (businessId) {
        res = await analyticsApi.getBusinessAnalyticsById(businessId);
      } else {
        res = await analyticsApi.getMyBusinessAnalytics();
      }
      setAnalyticsData(res);
    } catch (err) {
      console.error('[Analytics Fetch Error]', err);
      setError(err.message || 'Không thể tải dữ liệu truyền thông tích lũy.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialPlatformsData) {
      fetchAnalytics();
    }
  }, [businessId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center backdrop-blur-md">
        <RefreshCw className="h-8 w-8 animate-spin text-indigo-400 mb-4" />
        <p className="text-slate-300 font-medium">Đang tổng hợp dữ liệu truyền thông tích lũy...</p>
        <p className="text-xs text-slate-500 mt-1">Phân tích đa kênh theo thời gian thực</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center text-rose-300">
        <AlertCircle className="mx-auto h-8 w-8 text-rose-400 mb-2" />
        <p className="font-semibold">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-500/20 px-4 py-2 text-sm font-medium text-rose-200 hover:bg-rose-500/30 transition-colors"
        >
          <RefreshCw className="h-4 w-4" /> Thử lại
        </button>
      </div>
    );
  }

  const platforms = analyticsData?.platforms || [];
  const summary = analyticsData?.summary || {};

  if (platforms.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center backdrop-blur-md">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          <Share2 className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-white">Chưa kết nối nền tảng truyền thông</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
          Thêm các liên kết mạng xã hội (TikTok, Facebook, Shopee...) để hệ thống tự động phân tích và đo lường chỉ số tích lũy cho thương hiệu.
        </p>
      </div>
    );
  }

  // Filter platforms based on tab selection
  const visiblePlatforms = activeTab === 'all'
    ? platforms
    : platforms.filter(p => p.id === activeTab || p.platformKey === activeTab);

  return (
    <div className="space-y-8">
      {/* Header Banner & Summary Overview */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-700/70 bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 p-6 sm:p-8 shadow-xl backdrop-blur-xl">
        <div className="pointer-events-none absolute -left-12 -top-12 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />
        
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">
              <Sparkles className="h-3.5 w-3.5" /> Truyền thông tích lũy (Cumulative Media Analytics)
            </div>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Phân tích chỉ số đa nền tảng
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Đo lường & tổng hợp tự động từ {platforms.length} liên kết kênh truyền thông đã kết nối.
            </p>
          </div>

          <button
            onClick={fetchAnalytics}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm font-medium text-slate-200 shadow-md transition-all hover:bg-slate-700 hover:text-white"
          >
            <RefreshCw className="h-4 w-4" /> Làm mới dữ liệu
          </button>
        </div>

        {/* Global Summary KPIs */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <span className="text-xs font-semibold uppercase text-slate-400">Tổng tiếp cận (Reach / Traffic)</span>
            <p className="mt-1 text-2xl font-bold text-indigo-400">
              {formatMetricValue(summary.totalReach || 0, 'number', '', 'lượt')}
            </p>
            <span className="text-xs text-slate-500">Tất cả kênh truyền thông</span>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <span className="text-xs font-semibold uppercase text-slate-400">Tổng GMV E-Commerce</span>
            <p className="mt-1 text-2xl font-bold text-emerald-400">
              {formatMetricValue(summary.totalGMV || 0, 'currency', '₫', 'VND')}
            </p>
            <span className="text-xs text-slate-500">Tổng doanh số sàn liên kết</span>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <span className="text-xs font-semibold uppercase text-slate-400">Số kênh đang theo dõi</span>
            <p className="mt-1 text-2xl font-bold text-purple-400">
              {summary.totalConnectedPlatforms || platforms.length} Nền tảng
            </p>
            <span className="text-xs text-slate-500">
              {summary.socialPlatformCount || 0} Social • {summary.ecommercePlatformCount || 0} E-Commerce
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs (Dynamic platforms list) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('all')}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
            activeTab === 'all'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <LayoutGrid className="h-4 w-4" /> Tất cả nền tảng ({platforms.length})
        </button>

        {platforms.map((platform) => (
          <button
            key={platform.id}
            onClick={() => setActiveTab(platform.id)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
              activeTab === platform.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <PlatformIcon platformKey={platform.platformKey} className="h-4 w-4" />
            <span>{platform.platformName}</span>
            <span className="ml-1 text-xs opacity-75 uppercase px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
              {platform.platformType}
            </span>
          </button>
        ))}
      </div>

      {/* Render Dynamic Platform Sections */}
      <div className="space-y-8">
        {visiblePlatforms.map((platform) => (
          <div
            key={platform.id}
            className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 sm:p-7 backdrop-blur-md transition-all"
          >
            {/* Platform Sub-Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-5 mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 shadow-inner">
                  <PlatformIcon platformKey={platform.platformKey} className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white">{platform.platformName}</h3>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${
                      platform.platformType === 'ecommerce'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    }`}>
                      {platform.platformType === 'ecommerce' ? 'Sàn TMĐT' : 'Mạng Xã Hội'}
                    </span>
                  </div>
                  <a
                    href={platform.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-indigo-400 transition-colors mt-0.5"
                  >
                    <span>{platform.url}</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>

              {platform.aiInsight && (
                <div className="rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2 text-xs text-slate-300 max-w-sm">
                  <span className="font-semibold text-indigo-400 flex items-center gap-1 mb-0.5">
                    <Sparkles className="h-3 w-3" /> Đánh giá AI Kênh:
                  </span>
                  <p className="line-clamp-2 text-slate-400">{platform.aiInsight.replace(/###/g, '')}</p>
                </div>
              )}
            </div>

            {/* Dynamic Metric Cards Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {platform.metrics && platform.metrics.map((metric, idx) => (
                <MetricCard key={metric.key || idx} metric={metric} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
