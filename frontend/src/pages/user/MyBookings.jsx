import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, DollarSign, Clock, AlertCircle, CheckCircle, MoreVertical, Compass, Loader2 } from 'lucide-react';
import { useBookings } from '../../hooks/useBookings';
import { BOOKING_STATUS_LABELS, formatCurrency, formatDate } from '../../utils/statusLabels';

const FILTER_TABS = [
  { key: 'All', label: 'Tất cả' },
  { key: 'Pending', label: 'Chờ duyệt' },
  { key: 'In Progress', label: 'Đang thực hiện' },
  { key: 'Completed', label: 'Đã hoàn thành' },
];

export default function MyBookings() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const { data: bookings = [], isLoading, error } = useBookings();

  const filteredBookings = bookings.filter((b) => {
    const statusInfo = BOOKING_STATUS_LABELS[b.status] || { filter: 'All' };
    const matchesFilter = activeFilter === 'All' || statusInfo.filter === activeFilter;
    const matchesSearch =
      String(b.id).includes(searchTerm.toLowerCase()) ||
      b.kol?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.campaignName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex-1 w-full space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-display-lg-mobile md:text-display-lg font-display-lg text-primary dark:text-inverse-primary mb-2">
            Đơn đặt campaign
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Quản lý và theo dõi các chiến dịch chợ sáng tạo KOL của bạn.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-stretch sm:items-center">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
            <input
              type="text"
              placeholder="Tìm theo tên, mã đơn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border-none rounded-full text-body-md focus:ring-2 focus:ring-secondary-container focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${
              activeFilter === tab.key
                ? 'bg-secondary-container text-on-secondary-container'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16 gap-2 text-on-surface-variant">
          <Loader2 className="animate-spin" size={24} />
          Đang tải đơn đặt...
        </div>
      )}

      {error && (
        <div className="text-center py-16 text-error">{error.message}</div>
      )}

      {!isLoading && !error && (
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const statusInfo = BOOKING_STATUS_LABELS[booking.status] || { label: booking.status };
            return (
              <div
                key={booking.id}
                onClick={() => navigate(`/bookings/${booking.id}`)}
                className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-6 border border-surface-variant/30 hover:shadow-md transition-all cursor-pointer flex flex-col md:flex-row md:items-center gap-4"
              >
                <img
                  src={booking.kol?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${booking.kol?.name}`}
                  alt={booking.kol?.name}
                  className="w-14 h-14 rounded-full object-cover"
                />
                <div className="flex-1">
                  <p className="font-bold text-primary">#{booking.id} — {booking.campaignName}</p>
                  <p className="text-sm text-on-surface-variant">{booking.kol?.name} · {booking.package?.packageName}</p>
                </div>
                <div className="flex items-center gap-4 text-sm text-on-surface-variant">
                  <span className="flex items-center gap-1"><Calendar size={14} />{formatDate(booking.createdAt)}</span>
                  <span className="flex items-center gap-1"><DollarSign size={14} />{formatCurrency(booking.budget)}</span>
                  <span className="px-3 py-1 rounded-full bg-secondary-container/30 text-xs font-bold">{statusInfo.label}</span>
                </div>
              </div>
            );
          })}
          {filteredBookings.length === 0 && (
            <div className="text-center py-16">
              <Compass size={48} className="mx-auto text-on-surface-variant mb-4" />
              <p className="text-on-surface-variant mb-4">Chưa có đơn đặt nào.</p>
              <button onClick={() => navigate('/marketplace')} className="px-6 py-3 bg-primary text-on-primary rounded-full font-bold text-sm">
                Khám phá KOL
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
