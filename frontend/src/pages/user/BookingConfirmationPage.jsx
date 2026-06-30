import { Link } from 'react-router-dom';
import { CheckCircle2, Clock } from 'lucide-react';

export default function BookingConfirmationPage() {
  return (
    <div className="bg-background text-on-background min-h-screen flex items-center justify-center font-body-md py-12 px-6">
      <main className="w-full max-w-[600px]">
        <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] shadow-[4px_24px_40px_rgba(255,143,163,0.08)] p-8 md:p-12 text-center relative overflow-hidden border border-surface-variant/50">
          {/* Decorative background gradient */}
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-secondary-container/20 to-transparent pointer-events-none" />

          {/* Success Checkmark Circle */}
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-secondary-container dark:bg-secondary/40 mb-8 relative z-10">
            <CheckCircle2 size={48} className="text-secondary dark:text-white" />
          </div>

          {/* Header */}
          <h1 className="text-headline-md font-bold text-primary dark:text-inverse-primary mb-3 relative z-10">
            Đã gửi yêu cầu đặt lịch!
          </h1>
          <p className="text-body-md text-on-surface-variant mb-10 relative z-10 max-w-sm mx-auto">
            Yêu cầu của bạn đã được gửi thành công đến KOL. Chúng tôi sẽ thông báo cho bạn ngay sau khi họ xem xét.
          </p>

          {/* Summary Card Details */}
          <div className="bg-surface dark:bg-surface-variant/10 rounded-2xl p-6 text-left mb-10 border border-surface-variant/50 relative z-10">
            {/* Creator profile snippet */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-surface-variant/50">
              <img
                alt="Creator Avatar"
                className="w-16 h-16 rounded-full object-cover shadow-sm bg-surface-container"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDB4NAOlE6uYxgjZdyNsjfJv3WRk93VEEYyw2XaOh3QLUWIY8-Tazdn6cywr2FKZCGtuk56twEzi7oFrnxk_Z3eeObysLIVzN-_3KomAuK9traHVGdM4h-b84NM8vR8VNXT-RkNzAAagSf0HFIWupvhUPFBHyDhBHi6TX1qsRl8kbKx7XACAEKJYAUFiQy2zS18e2RUsNs6oFiuwP42NYW-QC04_PbjaA30xZJTIvNp1CryUtInh8AcWF5WGRWO7p_fKcXdSFsTmOo"
              />
              <div>
                <p className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider mb-1">
                  Nhà sáng tạo
                </p>
                <p className="font-body-lg font-bold text-primary dark:text-inverse-primary">
                  Alex Chen
                </p>
              </div>
            </div>

            {/* Core Details */}
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <span className="text-body-md text-on-surface-variant">Chiến dịch</span>
                <span className="text-body-md text-primary dark:text-inverse-primary font-medium text-right">
                  Ra mắt Mùa hè 2026
                </span>
              </div>

              <div className="flex justify-between items-start">
                <span className="text-body-md text-on-surface-variant">Dịch vụ</span>
                <div className="text-right flex flex-col items-end gap-1">
                  <span className="inline-block px-3 py-1 bg-surface-container dark:bg-outline/20 rounded-full text-label-sm text-xs text-on-surface-variant dark:text-inverse-on-surface">
                    1x Video Reel Instagram
                  </span>
                  <span className="inline-block px-3 py-1 bg-surface-container dark:bg-outline/20 rounded-full text-label-sm text-xs text-on-surface-variant dark:text-inverse-on-surface">
                    2x Bài đăng Story
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 mt-2 border-t border-surface-variant/50">
                <span className="text-body-md text-on-surface-variant">Trạng thái</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary-container/50 dark:bg-secondary/40 text-secondary dark:text-white rounded-full text-label-sm text-xs font-semibold">
                  <Clock size={12} />
                  Đang chờ nhân viên duyệt
                </span>
              </div>
            </div>
          </div>

          {/* Action Route Buttons */}
          <div className="flex flex-col gap-3 relative z-10">
            <Link
              to="/bookings"
              className="w-full py-4 px-6 bg-primary text-on-primary rounded-full font-label-sm text-label-sm text-center uppercase tracking-wider hover:bg-primary/95 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 duration-200 font-bold"
            >
              Xem đơn đặt của tôi
            </Link>
            <Link
              to="/dashboard"
              className="w-full py-4 px-6 text-primary dark:text-inverse-primary rounded-full font-label-sm text-label-sm text-center uppercase tracking-wider hover:bg-secondary-container/20 transition-colors duration-200"
            >
              Quay lại Bảng điều khiển
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
