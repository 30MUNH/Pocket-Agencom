import { Users, FileClock, LifeBuoy, BookOpen, ArrowUpRight, Megaphone, CheckSquare, ShieldCheck, ArrowRight } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import { Link } from 'react-router-dom';
import { useMarketingPlans } from '../../hooks/useMarketingPlans';

const activities = [
  {
    id: 1,
    type: 'staff_create',
    text: 'Nexus Agency đã tạo một tài khoản nhân viên mới.',
    time: '10 phút trước',
  },
  {
    id: 2,
    type: 'review_submit',
    text: 'Elevate Marketing đã nộp một kế hoạch tùy chỉnh để kiểm duyệt.',
    time: '1 giờ trước',
  },
  {
    id: 3,
    type: 'ticket_alert',
    text: 'Yêu cầu hỗ trợ khẩn cấp #4092 được mở bởi Alpha Retail.',
    time: '3 giờ trước',
    isUrgent: true,
  },
];

export default function StaffDashboard() {
  const { data: plans = [], isLoading: plansLoading, isError: plansError } = useMarketingPlans();
  const reviewQueue = plans.filter((plan) => ['saved', 'reviewed', 'need_revision'].includes(plan.status));
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <PageHeader title="Tổng quan Nhân viên" description="Theo dõi kế hoạch cần duyệt và xử lý yêu cầu hỗ trợ." />
      
      <section aria-label="Kế hoạch cần kiểm duyệt" className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4 tracking-tight">Kế hoạch cần kiểm duyệt</h2>
        {plansLoading && <p className="text-xs text-slate-500">Đang tải kế hoạch…</p>}
        {plansError && <p role="alert" className="text-xs text-red-500">Không thể tải kế hoạch. Vui lòng tải lại trang.</p>}
        {!plansLoading && !plansError && reviewQueue.length === 0 && <p className="text-xs text-slate-500">Chưa có kế hoạch cần kiểm duyệt.</p>}
        {!plansLoading && !plansError && reviewQueue.length > 0 && (
          <div className="divide-y divide-slate-100">
            {reviewQueue.map((plan) => (
              <div key={plan.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-bold text-sm text-slate-900">{plan.goal}</p>
                  <p className="text-xs text-slate-500">{plan.user?.name || 'Khách hàng'} · {plan.status}</p>
                </div>
                <Link className="rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-2 text-xs font-bold text-white transition-colors" to={`/staff/plan-review/${plan.id}`}>
                  Xem kế hoạch
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-900">
        Số liệu và hoạt động bên dưới là dữ liệu minh họa; bảng điều khiển chưa kết nối với dữ liệu trực tiếp.
      </p>

      {/* Bento Grid: Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Users */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between h-40 transition-all hover:border-slate-300">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-slate-100 p-2.5 rounded-xl text-slate-800">
              <Users size={22} />
            </div>
            <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
              <ArrowUpRight size={13} className="mr-0.5" /> 12%
            </span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
              8,402
            </h3>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Tổng Người dùng Hoạt động</p>
          </div>
        </div>

        {/* Card 2: Pending Reviews */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between h-40 transition-all hover:border-slate-300">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-[#FFCED2]/40 p-2.5 rounded-xl text-slate-900 border border-[#FFCED2]">
              <FileClock size={22} />
            </div>
            <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse mt-2"></span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
              47
            </h3>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Kế hoạch Chờ Kiểm duyệt</p>
          </div>
        </div>

        {/* Card 3: Support Tickets */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between h-40 transition-all hover:border-slate-300">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-slate-100 p-2.5 rounded-xl text-slate-800">
              <LifeBuoy size={22} />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
              12
            </h3>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Yêu cầu Hỗ trợ Đang mở</p>
          </div>
        </div>

        {/* Card 4: Active Templates */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between h-40 transition-all hover:border-slate-300">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-slate-100 p-2.5 rounded-xl text-slate-800">
              <BookOpen size={22} />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
              156
            </h3>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Mẫu chiến dịch Hoạt động</p>
          </div>
        </div>
      </div>

      {/* Lower Section: Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities Feed */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Hoạt động Gần đây
            </h3>
            <button className="text-xs text-slate-500 hover:text-slate-900 transition-colors font-bold">
              Xem tất cả
            </button>
          </div>
          <div className="flex flex-col gap-3 flex-1">
            {activities.map((act) => (
              <div
                key={act.id}
                className="flex items-start gap-3.5 p-3.5 rounded-xl border border-slate-100 hover:bg-slate-50/70 transition-colors cursor-pointer"
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    act.isUrgent
                      ? 'bg-rose-50 text-rose-600'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <ShieldCheck size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">
                    {act.text}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {act.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links & Actions */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-6">
              Hành động Nhân viên
            </h3>
            <div className="flex flex-col gap-3">
              <button className="flex items-center justify-between w-full p-3.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all group">
                <div className="flex items-center gap-3">
                  <Megaphone className="text-slate-500 group-hover:text-slate-900" size={18} />
                  <span className="text-xs font-bold text-slate-800">
                    Phát thông báo chung
                  </span>
                </div>
                <ArrowRight className="text-slate-400 group-hover:translate-x-1 transition-transform" size={14} />
              </button>

              <button className="flex items-center justify-between w-full p-3.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all group">
                <div className="flex items-center gap-3">
                  <CheckSquare className="text-slate-500 group-hover:text-slate-900" size={18} />
                  <span className="text-xs font-bold text-slate-800">
                    Kiểm duyệt Kế hoạch Chờ
                  </span>
                </div>
                <span className="bg-[#FFCED2] text-slate-900 text-[11px] font-bold px-2 py-0.5 rounded-full">
                  47
                </span>
              </button>

              <button className="flex items-center justify-between w-full p-3.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all group">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="text-slate-500 group-hover:text-slate-900" size={18} />
                  <span className="text-xs font-bold text-slate-800">
                    Quản lý Đại lý
                  </span>
                </div>
                <ArrowRight className="text-slate-400 group-hover:translate-x-1 transition-transform" size={14} />
              </button>
            </div>
          </div>

          {/* Sync status widget */}
          <div className="mt-6">
            <div className="w-full py-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-center">
              <p className="text-xs text-slate-500">
                Không gian làm việc đã đồng bộ hoàn toàn.
                <br />
                <span className="text-[11px] text-slate-400">Đồng bộ lần cuối 2 phút trước</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
