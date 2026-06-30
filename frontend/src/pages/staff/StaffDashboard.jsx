import { useState } from 'react';
import { Users, FileClock, LifeBuoy, BookOpen, ArrowUpRight, Megaphone, CheckSquare, ShieldCheck, ArrowRight } from 'lucide-react';

export default function StaffDashboard() {
  const [activities, setActivities] = useState([
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
  ]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="text-display-lg-mobile md:text-display-lg font-display-lg text-primary dark:text-inverse-primary">
          Tổng quan
        </h2>
        <p className="text-body-lg font-body-lg text-on-surface-variant mt-2 max-w-2xl">
          Giám sát hoạt động hệ thống, quản lý các yêu cầu hỗ trợ và giám sát hoạt động của đại lý.
        </p>
      </div>

      {/* Bento Grid: Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Users */}
        <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-3xl p-8 shadow-[0_4px_24px_rgba(255,143,163,0.08)] border border-surface-container/10 hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-secondary-container rounded-full opacity-20 group-hover:scale-150 transition-transform duration-500 ease-out"></div>
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="bg-secondary-container/50 p-3 rounded-2xl">
              <Users className="text-secondary" size={28} />
            </div>
            <span className="flex items-center text-xs font-semibold text-primary bg-primary/5 px-2.5 py-1 rounded-lg">
              <ArrowUpRight size={14} className="mr-0.5" /> 12%
            </span>
          </div>
          <div className="relative z-10">
            <h3 className="text-display-lg-mobile font-display-lg-mobile text-primary dark:text-inverse-primary tracking-tight">
              8,402
            </h3>
            <p className="text-label-sm font-label-sm text-on-surface-variant mt-1">Tổng Người dùng Hoạt động</p>
          </div>
        </div>

        {/* Card 2: Pending Reviews */}
        <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-3xl p-8 shadow-[0_4px_24px_rgba(255,143,163,0.08)] border border-surface-container/10 hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-secondary-container rounded-full opacity-20 group-hover:scale-150 transition-transform duration-500 ease-out"></div>
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="bg-secondary-container/50 p-3 rounded-2xl">
              <FileClock className="text-secondary" size={28} />
            </div>
            <span className="w-2.5 h-2.5 bg-error rounded-full animate-pulse mt-2"></span>
          </div>
          <div className="relative z-10">
            <h3 className="text-display-lg-mobile font-display-lg-mobile text-primary dark:text-inverse-primary tracking-tight">
              47
            </h3>
            <p className="text-label-sm font-label-sm text-on-surface-variant mt-1">Kế hoạch Chờ Kiểm duyệt</p>
          </div>
        </div>

        {/* Card 3: Support Tickets */}
        <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-3xl p-8 shadow-[0_4px_24px_rgba(255,143,163,0.08)] border border-surface-container/10 hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-secondary-container rounded-full opacity-20 group-hover:scale-150 transition-transform duration-500 ease-out"></div>
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="bg-secondary-container/50 p-3 rounded-2xl">
              <LifeBuoy className="text-secondary" size={28} />
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-display-lg-mobile font-display-lg-mobile text-primary dark:text-inverse-primary tracking-tight">
              12
            </h3>
            <p className="text-label-sm font-label-sm text-on-surface-variant mt-1">Yêu cầu Hỗ trợ Đang mở</p>
          </div>
        </div>

        {/* Card 4: Active Templates */}
        <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-3xl p-8 shadow-[0_4px_24px_rgba(255,143,163,0.08)] border border-surface-container/10 hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-secondary-container rounded-full opacity-20 group-hover:scale-150 transition-transform duration-500 ease-out"></div>
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="bg-secondary-container/50 p-3 rounded-2xl">
              <BookOpen className="text-secondary" size={28} />
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-display-lg-mobile font-display-lg-mobile text-primary dark:text-inverse-primary tracking-tight">
              156
            </h3>
            <p className="text-label-sm font-label-sm text-on-surface-variant mt-1">Mẫu chiến dịch Hoạt động</p>
          </div>
        </div>
      </div>

      {/* Lower Section: Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activities Feed */}
        <div className="lg:col-span-2 bg-surface-container-lowest dark:bg-tertiary-container rounded-3xl p-8 shadow-[0_4px_24px_rgba(255,143,163,0.08)] border border-surface-container/10 flex flex-col h-full">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-headline-md font-headline-md text-primary dark:text-inverse-primary">
              Hoạt động Gần đây
            </h3>
            <button className="text-label-sm font-label-sm text-on-surface-variant hover:text-primary transition-colors font-bold">
              Xem tất cả
            </button>
          </div>
          <div className="flex flex-col gap-6 flex-1">
            {activities.map((act) => (
              <div
                key={act.id}
                className="flex items-start gap-4 p-4 rounded-2xl hover:bg-surface-container-low/50 transition-colors cursor-pointer"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                    act.isUrgent
                      ? 'bg-error-container/40 text-error'
                      : 'bg-secondary-container/40 text-secondary'
                  }`}
                >
                  <ShieldCheck size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-body-md font-body-md text-on-surface dark:text-inverse-primary">
                    {act.text}
                  </p>
                  <p className="text-label-sm font-label-sm text-on-surface-variant mt-1">
                    {act.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links & Actions */}
        <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-3xl p-8 shadow-[0_4px_24px_rgba(255,143,163,0.08)] border border-surface-container/10 flex flex-col justify-between">
          <div>
            <h3 className="text-headline-md font-headline-md text-primary dark:text-inverse-primary mb-8">
              Hành động Nhân viên
            </h3>
            <div className="flex flex-col gap-4">
              <button className="flex items-center justify-between w-full p-4 rounded-2xl bg-background border border-surface-container-high/40 hover:border-secondary-container hover:bg-secondary-container/10 transition-all group">
                <div className="flex items-center gap-4">
                  <Megaphone className="text-on-surface-variant group-hover:text-secondary" size={20} />
                  <span className="text-label-sm font-label-sm text-on-surface dark:text-inverse-primary font-bold">
                    Phát thông báo chung
                  </span>
                </div>
                <ArrowRight className="text-on-surface-variant group-hover:translate-x-1 transition-transform" size={16} />
              </button>

              <button className="flex items-center justify-between w-full p-4 rounded-2xl bg-background border border-surface-container-high/40 hover:border-secondary-container hover:bg-secondary-container/10 transition-all group">
                <div className="flex items-center gap-4">
                  <CheckSquare className="text-on-surface-variant group-hover:text-secondary" size={20} />
                  <span className="text-label-sm font-label-sm text-on-surface dark:text-inverse-primary font-bold">
                    Kiểm duyệt Kế hoạch Chờ
                  </span>
                </div>
                <span className="bg-secondary-container text-on-secondary-container text-[10px] font-bold px-2 py-0.5 rounded-full">
                  47
                </span>
              </button>

              <button className="flex items-center justify-between w-full p-4 rounded-2xl bg-background border border-surface-container-high/40 hover:border-secondary-container hover:bg-secondary-container/10 transition-all group">
                <div className="flex items-center gap-4">
                  <ShieldCheck className="text-on-surface-variant group-hover:text-secondary" size={20} />
                  <span className="text-label-sm font-label-sm text-on-surface dark:text-inverse-primary font-bold">
                    Quản lý Đại lý
                  </span>
                </div>
                <ArrowRight className="text-on-surface-variant group-hover:translate-x-1 transition-transform" size={16} />
              </button>
            </div>
          </div>

          {/* Sync status widget */}
          <div className="mt-8">
            <div className="w-full h-32 rounded-2xl bg-gradient-to-br from-secondary-container/20 to-background dark:from-secondary-container/5 dark:to-tertiary-container/50 flex items-center justify-center border border-surface-container-low dark:border-outline-variant/10 relative overflow-hidden">
              <p className="text-label-sm font-label-sm text-on-surface-variant relative z-10 text-center px-4 leading-normal">
                Không gian làm việc đã đồng bộ hoàn toàn.
                <br />
                <span className="font-normal opacity-70">Đồng bộ lần cuối 2 phút trước</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
