import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Send, 
  MessageSquare, 
  CheckCircle2, 
  CheckSquare, 
  XCircle, 
  Plus, 
  ExternalLink, 
  Calendar as CalendarIcon, 
  DollarSign, 
  RefreshCw, 
  Search, 
  X, 
  Sparkles,
  ShoppingBag,
  Clock,
  Filter
} from 'lucide-react';
import { kolBookingApi } from '../../api/kolBookingApi';
import { budgetApi } from '../../api/budgetApi';
import { toast } from '../../store/toastStore';

// Platform Tag Helper
function PlatformTag({ platform = 'TikTok' }) {
  const p = platform.toLowerCase();
  if (p.includes('tiktok')) {
    return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-black text-white">TikTok</span>;
  }
  if (p.includes('youtube')) {
    return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-600 text-white">YouTube</span>;
  }
  if (p.includes('instagram')) {
    return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-pink-600 text-white">Instagram</span>;
  }
  return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-600 text-white">Facebook</span>;
}

// Shopee Status Badge Helper
function getShopeeStatusConfig(status) {
  switch (status) {
    case 'INVITATION_SENT':
      return { label: 'Đã gửi lời mời', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-300', icon: Send };
    case 'NEGOTIATING':
      return { label: 'Đang trao đổi', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300', icon: MessageSquare };
    case 'ACCEPTED':
      return { label: 'Đã chấp nhận', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300', icon: CheckCircle2 };
    case 'COMPLETED':
      return { label: 'Hoàn thành', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 border-purple-300', icon: Sparkles };
    case 'CANCELLED':
      return { label: 'Đã hủy', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-300', icon: XCircle };
    default:
      return { label: 'Đã gửi lời mời', color: 'bg-secondary-container text-secondary border-secondary-container/60', icon: Send };
  }
}

export default function KolBookingManager() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'INVITATION_SENT', 'NEGOTIATING', 'ACCEPTED', 'COMPLETED', 'CANCELLED'
  const [searchQuery, setSearchQuery] = useState('');

  // New Invite Modal State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [kolName, setKolName] = useState('');
  const [kolPlatform, setKolPlatform] = useState('TikTok');
  const [kolContactLink, setKolContactLink] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [inviteNote, setInviteNote] = useState('');
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);

  // Auto-Budget Sync Modal State (Triggered when status set to ACCEPTED)
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState(null); // { bookingId, targetStatus, bookingObj }
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState('15000000');
  const [budgetNote, setBudgetNote] = useState('');
  const [isSyncingBudget, setIsSyncingBudget] = useState(false);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await kolBookingApi.getBookings();
      setBookings(res || []);
    } catch (err) {
      console.error('[KOL Bookings Fetch Error]', err);
      toast.error('Không thể tải danh sách lịch đặt KOL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Status Change Interceptor
  const handleStatusChangeClick = (booking, newStatus) => {
    if (booking.kolStatus === newStatus) return;

    if (newStatus === 'ACCEPTED') {
      setPendingStatusUpdate({
        bookingId: booking.id,
        targetStatus: newStatus,
        bookingObj: booking
      });
      setBudgetNote(`Chi phí book KOL ${booking.kolName}`);
      setIsBudgetModalOpen(true);
      return;
    }

    executeStatusUpdate(booking.id, newStatus);
  };

  const executeStatusUpdate = async (bookingId, newStatus) => {
    try {
      await kolBookingApi.updateStatus(bookingId, newStatus);
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, kolStatus: newStatus } : b));
      toast.success('Đã cập nhật trạng thái lịch đặt!');
    } catch (err) {
      toast.error('Không thể cập nhật trạng thái.');
    }
  };

  // Auto-Budget Sync Modal Handlers
  const handleSkipBudgetSync = async () => {
    if (!pendingStatusUpdate) return;
    await executeStatusUpdate(pendingStatusUpdate.bookingId, 'ACCEPTED');
    setIsBudgetModalOpen(false);
    setPendingStatusUpdate(null);
  };

  const handleConfirmBudgetSync = async (e) => {
    e.preventDefault();
    if (!pendingStatusUpdate) return;

    const numericAmount = Number(budgetAmount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast.error('Vui lòng nhập số tiền chi tiêu hợp lệ.');
      return;
    }

    try {
      setIsSyncingBudget(true);
      await kolBookingApi.updateStatus(pendingStatusUpdate.bookingId, 'ACCEPTED');
      setBookings(prev => prev.map(b => b.id === pendingStatusUpdate.bookingId ? { ...b, kolStatus: 'ACCEPTED' } : b));

      await budgetApi.addExpense({
        marketingPlanId: 1,
        expenseType: 'KOL',
        amount: numericAmount,
        note: budgetNote || `Chi phí book KOL ${pendingStatusUpdate.bookingObj?.kolName}`
      });

      toast.success(`Đã cập nhật trạng thái "Đã chấp nhận" & tự động thêm ${numericAmount.toLocaleString('vi-VN')} ₫ vào Ngân sách!`);
      setIsBudgetModalOpen(false);
      setPendingStatusUpdate(null);
    } catch (err) {
      toast.error('Không thể đồng bộ vào ngân sách.');
    } finally {
      setIsSyncingBudget(false);
    }
  };

  // Create Invite Submit Handler
  const handleCreateInviteSubmit = async (e) => {
    e.preventDefault();
    if (!kolName.trim()) {
      toast.error('Vui lòng nhập tên KOL/KOC.');
      return;
    }

    try {
      setIsSubmittingInvite(true);
      const newBooking = await kolBookingApi.createBooking({
        kolName,
        kolPlatform,
        kolContactLink,
        scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : null,
        note: inviteNote
      });

      setBookings(prev => [newBooking, ...prev]);
      toast.success(`Đã gửi lời mời hợp tác tới KOL ${kolName}!`);
      setKolName('');
      setKolContactLink('');
      setInviteNote('');
      setIsInviteModalOpen(false);
      setActiveTab('INVITATION_SENT');
    } catch (err) {
      toast.error('Không thể gửi lời mời KOL.');
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  // Filter Bookings by Tab & Search
  const filteredBookings = bookings.filter(b => {
    const matchesTab = activeTab === 'all' || b.kolStatus === activeTab;
    const matchesSearch = (b.kolName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (b.note || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getStatusCount = (statusKey) => {
    if (statusKey === 'all') return bookings.length;
    return bookings.filter(b => b.kolStatus === statusKey).length;
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2.5rem] p-6 sm:p-8 shadow-ambient border border-surface-variant/40 relative overflow-hidden">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-secondary uppercase tracking-wider mb-1 bg-secondary-container px-3 py-1 rounded-full">
              <ShoppingBag size={14} /> Quản lý Lịch đặt & Thương lượng KOL
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-primary dark:text-inverse-primary sm:text-3xl">
              Quản lý Lịch đặt KOL / KOC
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-on-surface-variant">
              Theo dõi toàn bộ vòng đời booking KOL từ khi gửi lời mời, thương lượng đến khi chốt hợp đồng và giải ngân.
            </p>
          </div>

          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary text-on-primary hover:opacity-90 px-6 py-3 text-xs font-bold shadow-sm transition-opacity shrink-0"
          >
            <Plus size={16} /> Gửi lời mời KOL mới
          </button>
        </div>
      </div>

      {/* Shopee-Inspired Order Navigation Tabs */}
      <div className="overflow-x-auto rounded-[2.5rem] border border-surface-variant/40 bg-surface-container-lowest dark:bg-tertiary-container p-2 shadow-ambient">
        <div className="flex items-center gap-1.5 min-w-max">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'INVITATION_SENT', label: '📩 Đã gửi lời mời' },
            { id: 'NEGOTIATING', label: '💬 Đang trao đổi' },
            { id: 'ACCEPTED', label: '✅ Đã chấp nhận' },
            { id: 'COMPLETED', label: '🎉 Hoàn thành' },
            { id: 'CANCELLED', label: '❌ Đã hủy' },
          ].map(tab => {
            const count = getStatusCount(tab.id);
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-secondary-container text-secondary'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Filter Field */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant/60" />
        <input
          type="text"
          placeholder="Tìm kiếm theo tên KOL hoặc ghi chú..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-full border border-surface-variant/40 bg-surface-container-lowest dark:bg-tertiary-container pl-10 pr-4 py-2.5 text-xs text-primary dark:text-inverse-primary placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/40 shadow-sm"
        />
      </div>

      {/* Booking Cards List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-on-surface-variant bg-surface-container-lowest dark:bg-tertiary-container rounded-[2.5rem] border border-surface-variant/30">
          <RefreshCw className="h-7 w-7 animate-spin text-primary mb-2" />
          <span className="text-xs font-medium">Đang tải lịch đặt KOL...</span>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="rounded-[2.5rem] border border-surface-variant/30 bg-surface-container-lowest dark:bg-tertiary-container p-12 text-center text-on-surface-variant shadow-ambient">
          Chưa có lịch đặt KOL nào trong mục này.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const statusConfig = getShopeeStatusConfig(booking.kolStatus);
            const StatusIcon = statusConfig.icon;
            const dicebearAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(booking.kolName || 'KOL')}`;

            return (
              <div
                key={booking.id}
                className="overflow-hidden rounded-3xl border border-surface-variant/40 bg-surface-container-lowest dark:bg-tertiary-container p-6 shadow-ambient hover:shadow-ambient-hover transition-all duration-300"
              >
                {/* Header Row: Status & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-variant/20 pb-3.5 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-on-surface-variant">Mã booking #{booking.id}</span>
                    <span className="text-on-surface-variant/40">•</span>
                    <PlatformTag platform={booking.kolPlatform} />
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-bold ${statusConfig.color}`}>
                      <StatusIcon size={14} />
                      <span>{statusConfig.label}</span>
                    </span>
                  </div>
                </div>

                {/* Main Body */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left Info Column */}
                  <div className="flex items-start gap-4">
                    <img
                      src={dicebearAvatar}
                      alt={booking.kolName}
                      className="h-14 w-14 shrink-0 rounded-2xl bg-surface-container-high border border-surface-variant/30 object-cover"
                    />

                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-primary dark:text-inverse-primary flex items-center gap-2">
                        {booking.kolName}
                        {booking.kolContactLink && (
                          <a
                            href={booking.kolContactLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-on-surface-variant hover:text-secondary transition-colors"
                            title="Xem liên kết cá nhân"
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </h3>

                      <p className="text-xs text-on-surface-variant line-clamp-1">{booking.note || 'Chưa có ghi chú'}</p>
                      
                      <div className="flex items-center gap-3 text-[11px] text-on-surface-variant pt-1">
                        <span className="flex items-center gap-1">
                          <CalendarIcon size={12} /> Lịch đề xuất:{' '}
                          {booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString('vi-VN') : 'Chưa xếp ngày'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Status Transition Action Controls */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 self-end md:self-auto pt-3 md:pt-0 border-t md:border-t-0 border-surface-variant/20">
                    <span className="text-[11px] font-semibold text-on-surface-variant self-center">Chuyển trạng thái:</span>
                    <select
                      value={booking.kolStatus}
                      onChange={(e) => handleStatusChangeClick(booking, e.target.value)}
                      className="rounded-2xl border border-surface-variant/40 bg-surface-container-low dark:bg-surface-variant/20 px-3 py-1.5 text-xs font-bold text-primary dark:text-inverse-primary focus:outline-none focus:ring-2 focus:ring-secondary/40"
                    >
                      <option value="INVITATION_SENT">📩 Đã gửi lời mời</option>
                      <option value="NEGOTIATING">💬 Đang trao đổi</option>
                      <option value="ACCEPTED">✅ Đã chấp nhận</option>
                      <option value="COMPLETED">🎉 Hoàn thành</option>
                      <option value="CANCELLED">❌ Đã hủy</option>
                    </select>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Send Invite Modal ("Gửi lời mời KOL mới") */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] border border-surface-variant/40 bg-surface-container-lowest dark:bg-tertiary-container p-6 sm:p-8 shadow-ambient text-primary dark:text-inverse-primary">
            
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-primary dark:text-inverse-primary flex items-center gap-2">
                <Send size={18} className="text-secondary" /> Gửi lời mời KOL mới
              </h3>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="rounded-full p-1 text-on-surface-variant hover:bg-surface-container-high"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Tên KOL / KOC</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Linh Ngọc Đàm, Duy Thẩm..."
                  value={kolName}
                  onChange={(e) => setKolName(e.target.value)}
                  className="w-full rounded-2xl border border-surface-variant/40 bg-surface-container-low dark:bg-surface-variant/20 p-3 text-xs text-primary dark:text-inverse-primary focus:outline-none focus:ring-2 focus:ring-secondary/40"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Nền tảng chính</label>
                <select
                  value={kolPlatform}
                  onChange={(e) => setKolPlatform(e.target.value)}
                  className="w-full rounded-2xl border border-surface-variant/40 bg-surface-container-low dark:bg-surface-variant/20 p-3 text-xs text-primary dark:text-inverse-primary focus:outline-none focus:ring-2 focus:ring-secondary/40"
                >
                  <option value="TikTok">TikTok</option>
                  <option value="YouTube">YouTube</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Facebook">Facebook</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Liên kết cá nhân / Kênh</label>
                <input
                  type="url"
                  placeholder="https://tiktok.com/@username"
                  value={kolContactLink}
                  onChange={(e) => setKolContactLink(e.target.value)}
                  className="w-full rounded-2xl border border-surface-variant/40 bg-surface-container-low dark:bg-surface-variant/20 p-3 text-xs text-primary dark:text-inverse-primary focus:outline-none focus:ring-2 focus:ring-secondary/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Ngày dự kiến lên bài</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full rounded-2xl border border-surface-variant/40 bg-surface-container-low dark:bg-surface-variant/20 p-3 text-xs text-primary dark:text-inverse-primary focus:outline-none focus:ring-2 focus:ring-secondary/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Ghi chú lời mời</label>
                <textarea
                  placeholder="Nhập nội dung thỏa thuận sơ bộ..."
                  value={inviteNote}
                  onChange={(e) => setInviteNote(e.target.value)}
                  className="w-full rounded-2xl border border-surface-variant/40 bg-surface-container-low dark:bg-surface-variant/20 p-3 text-xs text-primary dark:text-inverse-primary focus:outline-none focus:ring-2 focus:ring-secondary/40 h-20 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-variant/30">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="rounded-full px-4 py-2 text-xs font-bold text-on-surface-variant hover:bg-surface-container-high"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingInvite}
                  className="rounded-full bg-primary text-on-primary hover:opacity-90 px-5 py-2 text-xs font-bold shadow-sm disabled:opacity-50"
                >
                  {isSubmittingInvite ? 'Đang gửi...' : 'Gửi lời mời ngay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Auto-Budget Sync Modal (Prompted when setting status to ACCEPTED) */}
      {isBudgetModalOpen && pendingStatusUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] border border-surface-variant/40 bg-surface-container-lowest dark:bg-tertiary-container p-6 sm:p-8 shadow-ambient text-primary dark:text-inverse-primary">
            
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-secondary-container text-secondary flex items-center justify-center shrink-0">
                <DollarSign size={20} />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-secondary block">Tự động đồng bộ Ngân sách</span>
                <h3 className="text-base font-bold text-primary dark:text-inverse-primary">Thêm chi phí book KOL này?</h3>
              </div>
            </div>

            <p className="text-xs text-on-surface-variant mb-4 leading-relaxed">
              Bạn đang chuyển trạng thái KOL <strong className="text-primary dark:text-inverse-primary">{pendingStatusUpdate.bookingObj?.kolName}</strong> sang <span className="text-emerald-600 dark:text-emerald-400 font-bold">"Đã chấp nhận"</span>. Bạn có muốn tự động ghi nhận chi phí này vào bảng Ngân sách chiến dịch không?
            </p>

            <form onSubmit={handleConfirmBudgetSync} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">Số tiền thỏa thuận (VND)</label>
                <input
                  type="number"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  className="w-full rounded-2xl border border-surface-variant/40 bg-surface-container-low dark:bg-surface-variant/20 p-3 text-xs font-bold text-primary dark:text-inverse-primary focus:outline-none focus:ring-2 focus:ring-secondary/40"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">Ghi chú chi phí</label>
                <input
                  type="text"
                  value={budgetNote}
                  onChange={(e) => setBudgetNote(e.target.value)}
                  className="w-full rounded-2xl border border-surface-variant/40 bg-surface-container-low dark:bg-surface-variant/20 p-3 text-xs text-primary dark:text-inverse-primary focus:outline-none focus:ring-2 focus:ring-secondary/40"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-surface-variant/30">
                <button
                  type="button"
                  onClick={handleSkipBudgetSync}
                  className="rounded-full px-4 py-2.5 text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors"
                >
                  Bỏ qua (Chỉ cập nhật)
                </button>

                <button
                  type="submit"
                  disabled={isSyncingBudget}
                  className="rounded-full bg-primary text-on-primary hover:opacity-90 px-5 py-2.5 text-xs font-bold shadow-sm disabled:opacity-50"
                >
                  {isSyncingBudget ? 'Đang lưu...' : '+ Thêm vào Ngân sách'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
