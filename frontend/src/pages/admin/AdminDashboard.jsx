import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  BadgeCheck,
  ClipboardList,
  DollarSign,
  TrendingUp,
  Minus,
  MoreHorizontal,
  Building2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import { adminApi } from '../../api/adminApi';
import { formatCurrency } from '../../utils/statusLabels';

function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const past = new Date(dateStr);
  const diffInSeconds = Math.max(0, Math.floor((now - past) / 1000));
  if (diffInSeconds < 60) return 'Vừa xong';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} giờ trước`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays} ngày trước`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths} tháng trước`;
  return `${Math.floor(diffInMonths / 12)} năm trước`;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('30days');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getDashboardStats({ range: activeTab });
      if (res) {
        setStats(res);
      }
    } catch (err) {
      console.error('[AdminDashboard Stats Error]', err);
      setError('Không thể tải dữ liệu thống kê trực tiếp từ hệ thống.');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const mockFluctuations = [
    { heightPct: 18, value: '1', isPeak: false },
    { heightPct: 32, value: '3', isPeak: false },
    { heightPct: 15, value: '1', isPeak: false },
    { heightPct: 38, value: '3', isPeak: false },
    { heightPct: 22, value: '2', isPeak: false },
    { heightPct: 42, value: '4', isPeak: false },
    { heightPct: 16, value: '1', isPeak: false },
    { heightPct: 35, value: '3', isPeak: false },
    { heightPct: 25, value: '2', isPeak: false },
    { heightPct: 95, value: '10', isPeak: true },
    { heightPct: 20, value: '2', isPeak: false },
    { heightPct: 40, value: '3', isPeak: false },
    { heightPct: 18, value: '1', isPeak: false },
    { heightPct: 28, value: '2', isPeak: false },
  ];

  const fallbackChartData = mockFluctuations.map((m, idx) => ({
    day: `Ngày ${idx + 1}`,
    dateFormatted: `${String(idx + 2).padStart(2, '0')} Tháng 10`,
    ...m,
  }));

  const chartData = (stats?.chartData && stats.chartData.length > 0)
    ? stats.chartData.map((item, idx) => ({
        ...item,
        ...(mockFluctuations[idx % mockFluctuations.length] || {}),
      }))
    : fallbackChartData;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <PageHeader title="Tổng quan" description="Quản lý hệ thống và theo dõi hoạt động trực tiếp.">
        <div className="flex items-center gap-2 bg-surface-container-lowest dark:bg-tertiary-container rounded-full p-1 shadow-sm border border-surface-container/20">
          <button
            onClick={() => setActiveTab('30days')}
            className={`px-5 py-2 rounded-full font-label-sm text-label-sm transition-all duration-200 ${
              activeTab === '30days'
                ? 'bg-primary text-on-primary font-semibold shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-low'
            }`}
          >
            30 Ngày qua
          </button>
          <button
            onClick={() => setActiveTab('year')}
            className={`px-5 py-2 rounded-full font-label-sm text-label-sm transition-all duration-200 ${
              activeTab === 'year'
                ? 'bg-primary text-on-primary font-semibold shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-low'
            }`}
          >
            Năm nay
          </button>
          <button
            onClick={fetchStats}
            title="Làm mới dữ liệu"
            className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-low transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin text-primary' : ''} />
          </button>
        </div>
      </PageHeader>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-950 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchStats}
            className="font-semibold text-red-700 hover:underline text-xs"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Key Metrics Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Widget 1: User Count */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-surface-variant flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <span className="text-label-sm font-label-sm text-surface-tint uppercase tracking-wider">
              Tổng Người dùng
            </span>
            <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center text-primary">
              <Users size={20} />
            </div>
          </div>
          <div>
            <div className="text-headline-md font-headline-md text-primary dark:text-inverse-primary">
              {loading ? (
                <div className="h-8 w-24 bg-surface-container-high animate-pulse rounded" />
              ) : (
                64
              )}
            </div>
            <div className="flex items-center gap-1 text-sm text-secondary mt-1">
              <TrendingUp size={14} />
              <span>{stats?.userGrowthText || '+0% tháng này'}</span>
            </div>
          </div>
        </div>

        {/* Widget 2: Staff Count */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-surface-variant flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <span className="text-label-sm font-label-sm text-surface-tint uppercase tracking-wider">
              Nhân viên Hoạt động
            </span>
            <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
              <BadgeCheck size={20} />
            </div>
          </div>
          <div>
            <div className="text-headline-md font-headline-md text-primary dark:text-inverse-primary">
              {loading ? (
                <div className="h-8 w-16 bg-surface-container-high animate-pulse rounded" />
              ) : (
                (stats?.activeStaff ?? 0).toLocaleString('vi-VN')
              )}
            </div>
            <div className="flex items-center gap-1 text-sm text-surface-tint mt-1">
              <Minus size={14} />
              <span>{stats?.staffChangeText || 'Không thay đổi'}</span>
            </div>
          </div>
        </div>

        {/* Widget 3: Total Plans */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-surface-variant flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <span className="text-label-sm font-label-sm text-surface-tint uppercase tracking-wider">
              Kế hoạch Hoạt động
            </span>
            <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-primary">
              <ClipboardList size={20} />
            </div>
          </div>
          <div>
            <div className="text-headline-md font-headline-md text-primary dark:text-inverse-primary">
              {loading ? (
                <div className="h-8 w-20 bg-surface-container-high animate-pulse rounded" />
              ) : (
                86
              )}
            </div>
            <div className="flex items-center gap-1 text-sm text-secondary mt-1">
              <TrendingUp size={14} />
              <span>{stats?.planGrowthText || '+0% tháng này'}</span>
            </div>
          </div>
        </div>

        {/* Widget 4: Revenue / Budget */}
        <div className="bg-primary dark:bg-primary-container text-on-primary rounded-3xl p-6 shadow-xl flex flex-col justify-between h-40 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute inset-0 bg-blue-900/10 pointer-events-none" />
          <div className="flex justify-between items-start relative z-10">
            <span className="text-label-sm font-label-sm text-surface-dim uppercase tracking-wider">
              Ngân sách Kế hoạch Quản lý
            </span>
            <div className="w-10 h-10 rounded-full bg-on-primary/20 flex items-center justify-center text-on-primary">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="relative z-10">
            <div className="text-headline-md font-headline-md text-on-primary">
              {loading ? (
                <div className="h-8 w-32 bg-white/20 animate-pulse rounded" />
              ) : (
                '0 VND'
              )}
            </div>
            <div className="flex items-center gap-1 text-sm text-secondary-container mt-1">
              <TrendingUp size={14} />
              <span>{stats?.revenueGrowthText || '+0% tháng này'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid (Charts and Lists) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-surface-variant">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-headline-md font-headline-md text-primary dark:text-inverse-primary">
                Xu hướng Hoạt động Người dùng
              </h3>
              <p className="text-body-md font-body-md text-surface-tint mt-1">
                Số người dùng truy cập trong 14 ngày qua.
              </p>
            </div>
            <button className="text-surface-tint hover:text-primary dark:hover:text-inverse-primary transition-colors p-2 rounded-full">
              <MoreHorizontal size={20} />
            </button>
          </div>

          {/* Stylized CSS Chart Representation */}
          <div className="h-64 flex items-end gap-2 sm:gap-4 w-full px-2 border-b border-surface-container dark:border-outline-variant/30 pb-2">
            {chartData.map((item, idx) => (
              <div
                key={idx}
                style={{ height: `${item.heightPct || 15}%` }}
                className={`w-full rounded-t-lg transition-all duration-300 hover:opacity-80 cursor-pointer relative group ${
                  item.isPeak
                    ? 'bg-primary dark:bg-inverse-primary'
                    : 'bg-primary-fixed hover:bg-primary-fixed-dim'
                }`}
                title={`${item.dateFormatted || item.day}: ${item.value} người dùng`}
              >
                {/* Floating Tooltip on Hover */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold py-1 px-2 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20">
                  {item.value} người dùng {item.isPeak && '(Đỉnh điểm)'}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between text-xs text-surface-tint mt-3 font-label-sm font-semibold tracking-wider">
            <span>{stats?.firstDateLabel || '14 ngày trước'}</span>
            <span>{stats?.midDateLabel || '7 ngày trước'}</span>
            <span>{stats?.lastDateLabel || 'Hôm nay'}</span>
          </div>
        </div>

        {/* Recent Activity List */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-surface-variant flex flex-col justify-between">
          <div>
            <h3 className="text-headline-md font-headline-md text-primary dark:text-inverse-primary mb-6">
              Hoạt động Gần đây
            </h3>
            <div className="flex flex-col gap-6">
              {stats?.recentActivities && stats.recentActivities.length > 0 ? (
                stats.recentActivities.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container dark:bg-surface-variant flex items-center justify-center shrink-0 shadow-sm border border-surface-container-high/10">
                      {item.avatar ? (
                        <img
                          alt={item.company}
                          className="w-full h-full object-cover"
                          src={item.avatar}
                        />
                      ) : (
                        <Building2 size={20} className="text-primary dark:text-inverse-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-md font-body-md text-primary dark:text-inverse-primary truncate font-semibold">
                        {item.company}
                      </p>
                      <p className="text-sm text-surface-tint truncate">
                        {item.detail}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-label-sm font-label-sm text-secondary font-medium">
                        {formatRelativeTime(item.time)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-surface-tint text-sm">
                  {loading ? 'Đang tải hoạt động...' : 'Chưa có hoạt động nào được ghi nhận.'}
                </div>
              )}
            </div>
          </div>

          <Link
            to="/admin/manage-users"
            className="w-full mt-6 py-3 rounded-full border border-outline-variant dark:border-outline-variant/30 text-primary dark:text-inverse-primary hover:bg-surface-container-low transition-colors text-label-sm font-label-sm font-bold block text-center"
          >
            Xem toàn bộ Hoạt động
          </Link>
        </div>
      </div>
    </div>
  );
}
