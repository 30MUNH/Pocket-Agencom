import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { useBooking } from '../../hooks/useBookings';
import { BOOKING_STATUS_LABELS } from '../../utils/statusLabels';

export default function BookingConfirmationPage() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const { data: booking, isLoading } = useBooking(bookingId);

  const statusInfo = booking ? BOOKING_STATUS_LABELS[booking.status] : null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center gap-2">
        <Loader2 className="animate-spin" size={24} />
        Đang tải xác nhận...
      </div>
    );
  }

  return (
    <div className="bg-background text-on-background min-h-screen flex items-center justify-center font-body-md py-12 px-6">
      <main className="w-full max-w-[600px]">
        <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] shadow-[4px_24px_40px_rgba(255,143,163,0.08)] p-8 md:p-12 text-center relative overflow-hidden border border-surface-variant/50">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-secondary-container/20 to-transparent pointer-events-none" />

          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-secondary-container dark:bg-secondary/40 mb-8 relative z-10">
            <CheckCircle2 size={48} className="text-secondary dark:text-white" />
          </div>

          <h1 className="text-headline-md font-bold text-primary dark:text-inverse-primary mb-3 relative z-10">
            Đã gửi yêu cầu đặt lịch!
          </h1>
          <p className="text-body-md text-on-surface-variant mb-10 relative z-10 max-w-sm mx-auto">
            Yêu cầu #{bookingId} đã được gửi thành công. Nhân viên sẽ xem xét và thông báo cho bạn.
          </p>

          {booking && (
            <div className="bg-surface dark:bg-surface-variant/10 rounded-2xl p-6 text-left mb-10 border border-surface-variant/50 relative z-10">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-surface-variant/50">
                <img
                  alt="Creator Avatar"
                  className="w-16 h-16 rounded-full object-cover shadow-sm bg-surface-container"
                  src={booking.kol?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${booking.kol?.name}`}
                />
                <div>
                  <p className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider mb-1">Nhà sáng tạo</p>
                  <p className="font-body-lg font-bold text-primary">{booking.kol?.name}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-body-md text-on-surface-variant">Chiến dịch</span>
                  <span className="text-body-md text-primary font-medium text-right">{booking.campaignName}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-body-md text-on-surface-variant">Dịch vụ</span>
                  <span className="text-body-md text-primary font-medium">{booking.package?.packageName}</span>
                </div>
                <div className="flex justify-between items-center pt-4 mt-2 border-t border-surface-variant/50">
                  <span className="text-body-md text-on-surface-variant">Trạng thái</span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary-container/50 text-secondary rounded-full text-xs font-semibold">
                    <Clock size={12} />
                    {statusInfo?.label || booking.status}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 relative z-10">
            <Link to="/bookings" className="w-full py-4 px-6 bg-primary text-on-primary rounded-full font-label-sm text-center uppercase tracking-wider hover:bg-primary/95 transition-all font-bold">
              Xem đơn đặt của tôi
            </Link>
            <Link to="/dashboard" className="w-full py-4 px-6 text-primary rounded-full font-label-sm text-center uppercase tracking-wider hover:bg-secondary-container/20 transition-colors">
              Quay lại Bảng điều khiển
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
