import { useState } from 'react';
import { Search, MessageSquare, Check, X, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBookings, useUpdateBookingStatus } from '../../hooks/useBookings';
import { BOOKING_STATUS_LABELS, formatCurrency, formatDate } from '../../utils/statusLabels';
import { toast } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';

export default function StaffBookingManagement() {
  const user = useAuthStore((s) => s.user);
  const { data: bookings = [], isLoading, error } = useBookings();
  const updateStatus = useUpdateBookingStatus();
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState('all');

  const handleApprove = async (id) => {
    try {
      const booking = bookings.find((b) => b.id === id);
      const nextStatus = booking?.status === 'pending' ? 'staff_reviewing' : 'approved';
      await updateStatus.mutateAsync({ id, status: nextStatus });
      toast.success('Đã cập nhật trạng thái đơn đặt');
    } catch (err) {
      toast.error(err.message || 'Không thể duyệt đơn');
    }
  };

  const handleReject = async (id) => {
    try {
      await updateStatus.mutateAsync({ id, status: 'cancelled', note: 'Rejected by staff' });
      toast.success('Đã từ chối đơn đặt');
    } catch (err) {
      toast.error(err.message || 'Không thể từ chối đơn');
    }
  };

  const handleConfirm = async (id) => {
    try {
      await updateStatus.mutateAsync({ id, status: 'confirmed' });
      toast.success('Đã xác nhận đơn đặt');
    } catch (err) {
      toast.error(err.message || 'Không thể xác nhận đơn');
    }
  };

  const filteredRequests = bookings.filter((r) => {
    const matchesSearch =
      r.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.kol?.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.campaignName?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      filterTab === 'all' ||
      (filterTab === 'pending' && ['pending', 'staff_reviewing', 'need_more_info'].includes(r.status)) ||
      (filterTab === 'approved' && ['approved', 'confirmed', 'in_progress'].includes(r.status)) ||
      (filterTab === 'completed' && r.status === 'completed');

    return matchesSearch && matchesStatus;
  });

  const isStaff = user?.role === 'staff' || user?.role === 'admin';

  return (
    <div className="flex-1 w-full space-y-8">
      <div>
        <h1 className="text-display-lg-mobile md:text-display-lg font-bold text-primary mb-2">
          Quản lý Đặt lịch
        </h1>
        <p className="text-on-surface-variant">Xem xét và phê duyệt các yêu cầu đặt KOL từ thương hiệu.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
          <input
            type="text"
            placeholder="Tìm theo thương hiệu, KOL, chiến dịch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-full border-none focus:ring-2 focus:ring-secondary-container"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'pending', 'approved', 'completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-4 py-2 rounded-full text-xs font-bold capitalize ${
                filterTab === tab ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-low text-on-surface-variant'
              }`}
            >
              {tab === 'all' ? 'Tất cả' : tab}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16 gap-2">
          <Loader2 className="animate-spin" size={24} />
          Đang tải...
        </div>
      )}

      {error && <div className="text-center py-16 text-error">{error.message}</div>}

      {!isLoading && !error && (
        <div className="space-y-4">
          {filteredRequests.map((request) => {
            const statusInfo = BOOKING_STATUS_LABELS[request.status] || { label: request.status };
            return (
              <div key={request.id} className="bg-surface-container-lowest rounded-[2rem] p-6 border border-surface-variant/30 flex flex-col lg:flex-row lg:items-center gap-4">
                <img
                  src={request.user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${request.user?.name}`}
                  alt=""
                  className="w-12 h-12 rounded-full"
                />
                <div className="flex-1">
                  <p className="font-bold text-primary">{request.campaignName}</p>
                  <p className="text-sm text-on-surface-variant">
                    {request.user?.name} → {request.kol?.name || 'Chưa phân bổ'}
                  </p>
                  <p className="text-xs text-on-surface-variant mt-1">{formatDate(request.createdAt)} · {formatCurrency(request.budget)}</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-secondary-container/30 text-xs font-bold">{statusInfo.label}</span>

                {isStaff && (
                  <div className="flex gap-2">
                    {request.status === 'pending' && (
                      <button onClick={() => handleApprove(request.id)} disabled={updateStatus.isPending} className="p-2 rounded-full bg-secondary-container text-on-secondary-container hover:opacity-80 disabled:opacity-50" title="Bắt đầu duyệt">
                        <MessageSquare size={16} />
                      </button>
                    )}
                    {request.status === 'staff_reviewing' && (
                      <button onClick={() => handleApprove(request.id)} disabled={updateStatus.isPending} className="p-2 rounded-full bg-emerald-100 text-emerald-800 disabled:opacity-50" title="Duyệt">
                        <Check size={16} />
                      </button>
                    )}
                    {request.status === 'approved' && (
                      <button onClick={() => handleConfirm(request.id)} disabled={updateStatus.isPending} className="px-4 py-2 rounded-full bg-primary text-on-primary text-xs font-bold disabled:opacity-50">
                        Xác nhận
                      </button>
                    )}
                    {!['completed', 'cancelled'].includes(request.status) && (
                      <button onClick={() => handleReject(request.id)} disabled={updateStatus.isPending} className="p-2 rounded-full bg-error-container/30 text-error disabled:opacity-50" title="Từ chối">
                        <X size={16} />
                      </button>
                    )}
                    <Link to={`/bookings/${request.id}`} className="px-4 py-2 rounded-full bg-surface-container text-xs font-bold text-primary">
                      Chi tiết
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
          {filteredRequests.length === 0 && (
            <p className="text-center py-16 text-on-surface-variant">Không có yêu cầu nào.</p>
          )}
        </div>
      )}
    </div>
  );
}
