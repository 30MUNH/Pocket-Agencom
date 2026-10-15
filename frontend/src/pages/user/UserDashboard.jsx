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
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-slate-800 shadow-sm"
        >
          <Sparkles size={15} aria-hidden="true" className="text-[#FFCED2]" />
          Tạo kế hoạch mới
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
              className="group flex min-h-20 items-center gap-3.5 rounded-xl border border-slate-200/80 bg-white p-4 transition-all hover:border-slate-300 hover:shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-800 group-hover:bg-[#FFCED2]/40 transition-colors">
                <Icon size={18} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-slate-900">
                  {title}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
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
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Kế hoạch gần đây</h2>
            <Link
              to="/plans"
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Xem tất cả <ArrowRight size={14} />
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {isPlansLoading && (
              <div className="flex items-center justify-center py-10 gap-2 text-slate-400 text-xs">
                <Loader2 className="animate-spin" size={16} />
                Đang tải kế hoạch...
              </div>
            )}
            
            {!isPlansLoading && recentPlans.length === 0 && (
              <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-8 text-center">
                <ClipboardList size={22} aria-hidden="true" className="mb-2 text-slate-400" />
                <p className="text-sm font-bold text-slate-800">Chưa có kế hoạch marketing</p>
                <p className="mt-1 text-xs text-slate-500">Tạo kế hoạch đầu tiên để bắt đầu quản lý chiến dịch tại đây.</p>
                <Link to="/marketing-kit" className="mt-3.5 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 shadow-sm transition-colors">
                  <Sparkles size={14} aria-hidden="true" className="text-[#FFCED2]" /> Tạo kế hoạch
                </Link>
              </div>
            )}

            {!isPlansLoading && recentPlans.map((plan) => {
              return (
                <div
                  key={plan.id}
                  className="flex flex-col items-start justify-between gap-3.5 rounded-xl border border-slate-200/80 bg-white p-4 transition-all hover:border-slate-300 hover:shadow-sm sm:flex-row sm:items-center"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800 shrink-0">
                      <Megaphone size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 mb-0.5 line-clamp-1 max-w-[250px] md:max-w-[400px]">
                        {plan.goal}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Loại: {plan.campaignType || 'Tiêu chuẩn'} • {formatDate(plan.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className={`px-2.5 py-0.5 text-xs rounded-full font-bold ${getStatusBg(plan.status)}`}>
                      {plan.hasLegacyContent ? 'Kế hoạch lịch sử' : getStatusLabel(plan.status)}
                    </span>
                    <Link
                      to={`/marketing-kit/result?planId=${plan.id}`}
                      aria-label={`Xem kế hoạch: ${plan.goal}`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <Eye size={16} aria-hidden="true" />
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
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Mẫu thiết kế</h2>
              <Link
                to="/templates"
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
              >
                Khám phá <ArrowRight size={14} />
              </Link>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
              <div className="grid grid-cols-2 gap-3">
                {RECOMMENDED_TEMPLATES.map((tmpl) => (
                  <Link to="/templates" key={tmpl.id} className="group block min-w-0">
                    <div className="mb-2.5 aspect-square overflow-hidden rounded-xl relative border border-slate-100">
                      <img
                        alt={tmpl.name}
                        loading="lazy"
                        width="240"
                        height="240"
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                        src={tmpl.image}
                      />
                      <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Eye className="text-white" size={20} />
                      </div>
                    </div>
                    <h3 className="truncate text-xs font-bold text-slate-800">{tmpl.name}</h3>
                  </Link>
                ))}
              </div>
              <Link
                to="/templates"
                className="mt-3.5 flex w-full items-center justify-center rounded-xl bg-slate-50 border border-slate-200 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100"
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
