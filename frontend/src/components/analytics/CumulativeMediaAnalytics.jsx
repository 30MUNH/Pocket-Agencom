import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Layers, 
  ExternalLink, 
  RefreshCw, 
  Sparkles, 
  Globe, 
  AlertCircle,
  Share2,
  TrendingUp,
  LayoutGrid
} from 'lucide-react';
import { analyticsApi } from '../../api/analyticsApi';
import MetricCard from './MetricCard';
import { toast } from '../../store/toastStore';

export default function CumulativeMediaAnalytics({ businessId = null }) {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState('all');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = businessId
        ? await analyticsApi.getBusinessAnalyticsById(businessId)
        : await analyticsApi.getMyBusinessAnalytics();

      setAnalyticsData(res);
    } catch (err) {
      console.error('[Analytics Fetch Error]', err);
      toast.error('Không thể tải số liệu truyền thông tích lũy.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [businessId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-on-surface-variant bg-surface-container-lowest dark:bg-tertiary-container rounded-3xl border border-surface-variant/30 shadow-ambient">
        <RefreshCw className="h-7 w-7 animate-spin text-primary mb-3" />
        <p className="text-sm font-medium">Đang tổng hợp số liệu truyền thông đa kênh...</p>
      </div>
    );
  }

  const {
    connectedPlatforms = [],
    aggregatedMetrics = [],
    summary = {}
  } = analyticsData || {};

  if (!connectedPlatforms || connectedPlatforms.length === 0) {
    return (
      <div className="rounded-[2.5rem] border border-surface-variant/40 bg-surface-container-lowest dark:bg-tertiary-container p-8 text-center shadow-ambient">
        <Globe className="mx-auto h-12 w-12 text-on-surface-variant/60 mb-3" />
        <h3 className="text-lg font-bold text-primary dark:text-inverse-primary">Chưa có liên kết nền tảng truyền thông</h3>
        <p className="mt-1 text-xs text-on-surface-variant max-w-md mx-auto">
          Hãy liên kết các tài khoản mạng xã hội (Facebook, TikTok, Shopee...) ở phần trên để hệ thống tự động gom nhóm và tổng hợp chỉ số truyền thông tích lũy.
        </p>
      </div>
    );
  }

  // Filter metrics based on selected platform tab
  const displayMetrics = aggregatedMetrics.filter(m => {
    if (selectedPlatform === 'all') return true;
    return m.platform?.toLowerCase() === selectedPlatform.toLowerCase();
  });

  return (
    <div className="space-y-6">
      
      {/* Analytics Main Card Container */}
      <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2.5rem] p-6 sm:p-8 shadow-ambient border border-surface-variant/40 relative overflow-hidden">
        
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-surface-variant/30 pb-6 mb-6">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-secondary uppercase tracking-wider mb-1 bg-secondary-container px-3 py-1 rounded-full">
              <BarChart3 size={14} /> Truyền thông tích lũy (Cumulative Media)
            </span>
            <h3 className="text-2xl font-bold text-primary dark:text-inverse-primary mt-1">
              Phân tích chỉ số đa nền tảng
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Hệ thống tự động nhóm và tổng hợp hiệu suất từ {summary.totalConnectedPlatforms || connectedPlatforms.length} nền tảng đã kết nối.
            </p>
          </div>

          <button
            onClick={fetchAnalytics}
            className="inline-flex items-center gap-2 rounded-full border border-surface-variant/50 bg-secondary-container hover:bg-secondary-container/80 px-4 py-2 text-xs font-bold text-primary transition-all shrink-0 self-start sm:self-auto"
          >
            <RefreshCw size={14} /> Đồng bộ số liệu
          </button>
        </div>

        {/* Dynamic Platform Selection Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6">
          <button
            onClick={() => setSelectedPlatform('all')}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all whitespace-nowrap ${
              selectedPlatform === 'all'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-secondary-container text-secondary hover:opacity-80'
            }`}
          >
            <Layers size={14} /> Tất cả kênh ({summary.totalConnectedPlatforms || connectedPlatforms.length})
          </button>

          {connectedPlatforms.map((platform) => {
            const isSelected = selectedPlatform.toLowerCase() === platform.platformName.toLowerCase();
            return (
              <button
                key={platform.id}
                onClick={() => setSelectedPlatform(platform.platformName)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-secondary-container text-secondary hover:opacity-80'
                }`}
              >
                <span>{platform.platformName}</span>
                <span className="text-[10px] uppercase font-bold opacity-75">
                  ({platform.platformType})
                </span>
              </button>
            );
          })}
        </div>

        {/* Metrics Grid */}
        {displayMetrics.length === 0 ? (
          <div className="rounded-3xl border border-surface-variant/30 bg-surface-container-low p-8 text-center text-on-surface-variant">
            Chưa có chỉ số đo lường khả dụng cho kênh này.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {displayMetrics.map((metricItem, idx) => (
              <MetricCard key={idx} metric={metricItem} />
            ))}
          </div>
        )}

      </div>

    </div>
  );
}
