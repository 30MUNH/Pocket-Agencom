import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Lightbulb,
  UserPlus,
  Sparkles,
  ClipboardList,
  Library,
  Megaphone,
  Mail,
  MoreVertical,
  Eye,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useMarketingPlans } from '../../hooks/useMarketingPlans';
import TrendBulletin from '../../components/dashboard/TrendBulletin';


const QUICK_ACTIONS = [
  {
    title: 'Tạo Hồ sơ',
    desc: 'Thiết lập bản sắc thương hiệu.',
    icon: UserPlus,
    path: '/settings',
  },
  {
    title: 'Tạo Bộ công cụ Marketing',
    desc: 'Sáng tạo tài nguyên bằng AI.',
    icon: Sparkles,
    path: '/marketing-kit',
  },
  {
    title: 'Xem kế hoạch',
    desc: 'Theo dõi các chiến lược đang chạy.',
    icon: ClipboardList,
    path: '/plans',
  },
  {
    title: 'Thư viện mẫu',
    desc: 'Tìm ý tưởng cho bài viết.',
    icon: Library,
    path: '/templates',
  },
];

const RECENT_PLANS = [
  {
    id: 1,
    title: 'Chiến dịch Lễ hội Q4',
    updated: 'Cập nhật 2 ngày trước',
    status: 'Đang thực hiện',
    icon: Megaphone,
    statusBg: 'bg-secondary-container text-on-secondary-container',
  },
  {
    id: 2,
    title: 'Khởi động lại Bản tin',
    updated: 'Hoàn thành tuần trước',
    status: 'Đã hoàn thành',
    icon: Mail,
    statusBg: 'bg-surface-container-high text-on-surface-variant',
  },
];

const RECOMMENDED_TEMPLATES = [
  {
    id: 1,
    name: 'Sản phẩm Tối giản',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJ6a5mo2tCKfN59gPPD7awdvYbpVL365R0ePmQCFAQyMnItFeUNIHReulg8AXS0QkQHPdv1Zc246Sya82D9t_B0yqNY0mxLnW6FcaKO9wvAaAyVJuc-AxYn8N1WkmoUp8IyCErUwasgXXWnqtSwcCZ3KzebesHFilO33lEqdWvkFHCykK_wox3FYjHB1Q1bvgHvaYThBObX00ynSi9qoLb_v6wxwKtI_7C7GIFLmVi9cvMI1D6AGO2mZ0FGyGVuMw5f_Wir_j40IA',
  },
  {
    id: 2,
    name: 'Trích dẫn hay',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCI0MGH9110q1lXo3us0x8LEpTty3MuKlOwGqnPDxrUDdP2s2_189wLtJUrp_06Ae2swb0rvkio5XbsJ7P-9pLdPlbd_TzLKBnFIbHr00beWFxUxN4RpAVgW02MZoVAYdPOpz_A1CE7sA1F78w3D2DcMX3NKobYeEnM0zqEQZIQffqM7b8hpZJVbynK5hoV1vDi-VLIE_tOOEpcFOuXQSdx0iU9tax9u0XCPdsstYKU8BAIace8plOkvFUxVogkcb6ORyENHmGyiDs',
  },
];

export default function UserDashboard() {
  const user = useAuthStore((s) => s.user);
  const { data: plansData, isLoading: isPlansLoading } = useMarketingPlans();

  const recentPlans = useMemo(() => {
    return plansData?.slice(0, 3) || [];
  }, [plansData]);

  const getStatusLabel = (status) => {
    switch (status) {
      case 'draft': return 'Bản nháp';
      case 'saved': return 'Đã lưu';
      case 'reviewed': return 'Đã kiểm duyệt';
      case 'approved': return 'Đã phê duyệt';
      case 'need_revision': return 'Cần chỉnh sửa';
      default: return status;
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'approved': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300';
      case 'need_revision': return 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300';
      case 'reviewed': return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300';
      default: return 'bg-secondary-container text-on-secondary-container';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Vừa xong';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) {
      return 'Vừa xong';
    }
  };

  return (
    <div className="flex-1 w-full space-y-12">
      {/* Welcome Header */}
      <section>
        <h2 className="text-display-lg-mobile md:text-display-lg font-display-lg text-primary mb-2">
          Chào mừng trở lại, {user?.name || 'Khách hàng'}.
        </h2>
        <p className="text-body-lg font-body-lg text-on-surface-variant">
          Dưới đây là tổng quan nhanh các hoạt động tiếp thị của bạn hôm nay.
        </p>
      </section>

      {/* Tip of the Day Banner */}
      <section>
        <div className="bg-secondary-container rounded-3xl p-8 relative overflow-hidden shadow-ambient flex flex-col md:flex-row items-center justify-between gap-8 group hover:-translate-y-[2px] transition-transform duration-300">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/30 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-2 text-primary font-label-sm text-label-sm uppercase tracking-wider mb-4 bg-white/50 px-3 py-1 rounded-full">
              <Lightbulb size={16} />
              Mẹo hay trong ngày
            </span>
            <h3 className="text-headline-md font-headline-md text-primary mb-4">
              Tính nhất quán là cốt lõi
            </h3>
            <p className="text-body-md font-body-md text-on-secondary-container">
              Đăng bài đều đặn trên các kênh mạng xã hội có thể tăng tỷ lệ tương tác lên tới 30%. Hãy dùng Thư viện mẫu để tạo hàng loạt nội dung cho tuần này.
            </p>
          </div>
          <div className="relative z-10 shrink-0">
            <Link
              to="/templates"
              className="inline-block bg-primary text-on-primary px-8 py-3 rounded-full font-label-sm text-label-sm hover:opacity-90 transition-opacity"
            >
              Xem Thư viện
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Action Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {QUICK_ACTIONS.map((action, i) => {
          const Icon = action.icon;
          return (
            <Link
              key={i}
              to={action.path}
              className="bg-surface-container-lowest rounded-3xl p-6 shadow-ambient hover:shadow-ambient-hover hover:-translate-y-[2px] transition-all duration-300 flex flex-col items-start gap-4 group"
            >
              <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <Icon size={24} />
              </div>
              <div>
                <h4 className="text-label-sm font-label-sm text-primary mb-2">
                  {action.title}
                </h4>
                <p className="text-body-md font-body-md text-on-surface-variant text-sm">
                  {action.desc}
                </p>
              </div>
            </Link>
          );
        })}
      </section>

      {/* Trending Newsletter Section */}
      <TrendBulletin />

      {/* Main Content Splitted Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Plans */}
        <section className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-headline-md font-headline-md text-primary">Kế hoạch gần đây</h3>
            <Link
              to="/plans"
              className="text-label-sm font-label-sm text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1"
            >
              Xem tất cả <ArrowRight size={16} />
            </Link>
          </div>
          <div className="flex flex-col gap-4">
            {isPlansLoading && (
              <div className="flex items-center justify-center py-10 gap-2 text-on-surface-variant">
                <Loader2 className="animate-spin" size={20} />
                Đang tải kế hoạch...
              </div>
            )}
            
            {!isPlansLoading && recentPlans.length === 0 && (
              <div className="text-center p-8 bg-surface-container-lowest dark:bg-tertiary-container rounded-3xl border border-surface-container/20">
                <p className="text-on-surface-variant text-sm">Bạn chưa tạo kế hoạch marketing nào.</p>
                <Link to="/marketing-kit" className="text-primary font-bold text-xs mt-2 inline-block">Tạo kế hoạch bằng AI ngay</Link>
              </div>
            )}

            {!isPlansLoading && recentPlans.map((plan) => {
              return (
                <div
                  key={plan.id}
                  className="bg-surface-container-lowest rounded-3xl p-6 shadow-ambient hover:shadow-ambient-hover transition-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-secondary-container/50 flex items-center justify-center text-primary shrink-0">
                      <Megaphone size={24} />
                    </div>
                    <div>
                      <h4 className="text-label-sm font-label-sm text-primary mb-1 line-clamp-1 max-w-[250px] md:max-w-[400px]">
                        {plan.goal}
                      </h4>
                      <p className="text-body-md font-body-md text-on-surface-variant text-sm">
                        Loại: {plan.campaignType || 'Tiêu chuẩn'} • {formatDate(plan.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 font-label-sm text-[11px] rounded-full font-bold ${getStatusBg(plan.status)}`}>
                      {getStatusLabel(plan.status)}
                    </span>
                    <Link
                      to={`/plans/result/${plan.id}`}
                      className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant"
                    >
                      <Eye size={18} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Templates Sidebar */}
        <section className="lg:col-span-1 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-headline-md font-headline-md text-primary">Mẫu thiết kế</h3>
            <Link
              to="/templates"
              className="text-label-sm font-label-sm text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1"
            >
              Khám phá <ArrowRight size={16} />
            </Link>
          </div>
          <div className="bg-surface-container-lowest rounded-3xl shadow-ambient p-6">
            <div className="grid grid-cols-2 gap-4">
              {RECOMMENDED_TEMPLATES.map((tmpl) => (
                <div key={tmpl.id} className="group cursor-pointer">
                  <div className="aspect-square rounded-2xl overflow-hidden mb-3 relative">
                    <img
                      alt={tmpl.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src={tmpl.image}
                    />
                    <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Eye className="text-white" size={24} />
                    </div>
                  </div>
                  <h4 className="text-label-sm font-label-sm text-primary truncate">
                    {tmpl.name}
                  </h4>
                </div>
              ))}
            </div>
            <Link
              to="/templates"
              className="block w-full mt-6 py-3 text-center rounded-full bg-secondary-container text-primary font-label-sm text-label-sm hover:bg-secondary-container/80 transition-colors"
            >
              Khám phá Thư viện
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
