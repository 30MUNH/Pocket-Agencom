import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  UserPlus,
  Sparkles,
  ClipboardList,
  Library,
  Megaphone,
  Eye,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useMarketingPlans } from '../../hooks/useMarketingPlans';
import TrendBulletin from '../../components/dashboard/TrendBulletin';
import MonthlySpendWidget from '../../components/dashboard/MonthlySpendWidget';
import PageHeader from '../../components/ui/PageHeader';

const QUICK_ACTIONS = [
  {
    title: 'Tạo Hồ sơ',
    desc: 'Thiết lập bản sắc thương hiệu.',
    icon: UserPlus,
    path: '/business-profile',
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
      case 'reviewed': return 'bg-pink-100 text-pink-800 dark:bg-pink-950/40 dark:text-pink-300';
      default: return 'bg-secondary-container text-on-secondary-container';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Vừa xong';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return 'Vừa xong';
    }
  };

  return (
    <div className="flex-1 w-full space-y-8">
      <PageHeader
        title={`Chào mừng trở lại, ${user?.name || 'Khách hàng'}`}
        description="Quản lý kế hoạch, nội dung và lịch đăng bài của doanh nghiệp tại đây."
      >
        <Link
          to="/marketing-kit"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <Sparkles size={16} aria-hidden="true" />
          Tạo kế hoạch
        </Link>
      </PageHeader>

      {/* Quick Action Bento Grid */}
      <section aria-label="Lối tắt" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {QUICK_ACTIONS.map((action, i) => {
          const Icon = action.icon;
          const title = action.path === '/business-profile' && user?.businessProfile ? 'Cập nhật hồ sơ' : action.title;
          return (
            <Link
              key={i}
              to={action.path}
              className="group flex min-h-24 items-center gap-4 rounded-xl border border-surface-variant bg-white p-4 transition-colors hover:border-primary/40 hover:bg-primary-container/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-container text-primary">
                <Icon size={20} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-on-surface">
                  {title}
                </h2>
                <p className="mt-1 text-sm leading-5 text-on-surface-variant">
                  {action.desc}
                </p>
              </div>
            </Link>
          );
        })}
      </section>

      {/* Trending Newsletter Section */}
      <TrendBulletin />

      {/* Plans and business overview */}
      <div className="grid grid-cols-1 gap-6">
        {/* Recent Plans */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight text-on-surface">Kế hoạch gần đây</h2>
            <Link
              to="/plans"
              className="inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-sm font-medium text-primary hover:bg-primary-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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
              <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant bg-white px-6 py-8 text-center">
                <ClipboardList size={24} aria-hidden="true" className="mb-3 text-on-surface-variant" />
                <p className="text-sm font-medium text-on-surface">Chưa có kế hoạch marketing</p>
                <p className="mt-1 max-w-sm text-sm text-on-surface-variant">Tạo kế hoạch đầu tiên để bắt đầu quản lý chiến dịch tại đây.</p>
                <Link to="/marketing-kit" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                  <Sparkles size={16} aria-hidden="true" /> Tạo kế hoạch
                </Link>
              </div>
            )}

            {!isPlansLoading && recentPlans.map((plan) => {
              return (
                <div
                  key={plan.id}
                  className="flex flex-col items-start justify-between gap-4 rounded-xl border border-surface-variant bg-white p-4 transition-shadow hover:shadow-ambient sm:flex-row sm:items-center"
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
                      {plan.hasLegacyContent ? 'Kế hoạch lịch sử' : getStatusLabel(plan.status)}
                    </span>
                    <Link
                      to={`/marketing-kit/result?planId=${plan.id}`}
                      aria-label={`Xem kế hoạch: ${plan.goal}`}
                      className="flex h-11 w-11 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      <Eye size={18} aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right Column Sidebar: Monthly Spend & Templates */}
        <aside className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <MonthlySpendWidget />

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight text-on-surface">Mẫu thiết kế</h2>
              <Link
                to="/templates"
                className="inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-sm font-medium text-primary hover:bg-primary-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Khám phá <ArrowRight size={16} />
              </Link>
            </div>
            <div className="rounded-xl border border-surface-variant bg-white p-4">
              <div className="grid grid-cols-2 gap-4">
                {RECOMMENDED_TEMPLATES.map((tmpl) => (
                  <Link to="/templates" key={tmpl.id} className="group block min-w-0">
                    <div className="mb-3 aspect-square overflow-hidden rounded-xl relative">
                      <img
                        alt={tmpl.name}
                        loading="lazy"
                        width="240"
                        height="240"
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                        src={tmpl.image}
                      />
                      <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Eye className="text-white" size={24} />
                      </div>
                    </div>
                    <h3 className="truncate text-sm font-semibold text-primary">{tmpl.name}</h3>
                  </Link>
                ))}
              </div>
              <Link
                to="/templates"
                className="mt-4 flex min-h-11 w-full items-center justify-center rounded-lg bg-primary-container px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary-fixed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Khám phá Thư viện
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
