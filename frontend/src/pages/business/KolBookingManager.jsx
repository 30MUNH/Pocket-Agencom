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

// Platform Badge Helper
function PlatformTag({ platform = 'TikTok' }) {
  const p = platform.toLowerCase();
  if (p.includes('tiktok')) {
    return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-black text-white border border-slate-700">TikTok</span>;
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
      return { label: 'Đã gửi lời mời', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30', icon: Send };
    case 'NEGOTIATING':
      return { label: 'Đang trao đổi', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30', icon: MessageSquare };
    case 'ACCEPTED':
      return { label: 'Đã chấp nhận', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: CheckCircle2 };
    case 'COMPLETED':
      return { label: 'Hoàn thành', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30', icon: Sparkles };
    case 'CANCELLED':
      return { label: 'Đã hủy', color: 'bg-rose-500/15 text-rose-400 border-rose-500/30', icon: XCircle };
    default:
      return { label: 'Đã gửi lời mời', color: 'bg-slate-700 text-slate-300 border-slate-600', icon: Send };
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

    // Intercept when setting to ACCEPTED
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

    // Direct status update for other statuses
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
      // 1. Update Booking Status to ACCEPTED
      await kolBookingApi.updateStatus(pendingStatusUpdate.bookingId, 'ACCEPTED');
      setBookings(prev => prev.map(b => b.id === pendingStatusUpdate.bookingId ? { ...b, kolStatus: 'ACCEPTED' } : b));

      // 2. Automatically log expense in Budget Management system
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
      <div className="relative overflow-hidden rounded-3xl border border-slate-700/70 bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 p-6 sm:p-8 shadow-xl backdrop-blur-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300 mb-1">
              <ShoppingBag className="h-3.5 w-3.5" /> Quản lý Lịch đặt & Thương lượng KOL
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Quản lý Lịch đặt KOL / KOC
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">
              Theo dõi toàn bộ vòng đời booking KOL từ khi gửi lời mời, thương lượng đến khi chốt hợp đồng và giải ngân.
            </p>
          </div>

          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all shrink-0"
          >
            <Plus className="h-4 w-4" /> Gửi lời mời KOL mới
          </button>
        </div>
      </div>

      {/* Shopee-Inspired Order Navigation Tabs */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/80 p-1.5 backdrop-blur-md">
        <div className="flex items-center gap-1 min-w-max">
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
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
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
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          type="text"
          placeholder="Tìm kiếm theo tên KOL hoặc ghi chú..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-slate-800 bg-slate-900/60 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
        />
      </div>

      {/* Booking Cards List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
          <RefreshCw className="h-7 w-7 animate-spin text-indigo-400 mb-2" />
          <span className="text-xs">Đang tải lịch đặt KOL...</span>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-12 text-center text-slate-400">
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
                className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg backdrop-blur-md transition-all hover:border-slate-700"
              >
                {/* Header Row: Status & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">Mã booking #{booking.id}</span>
                    <span className="text-slate-600">•</span>
                    <PlatformTag platform={booking.kolPlatform} />
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${statusConfig.color}`}>
                      <StatusIcon className="h-3.5 w-3.5" />
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
                      className="h-14 w-14 shrink-0 rounded-2xl bg-slate-950 border border-slate-800 object-cover"
                    />

                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        {booking.kolName}
                        {booking.kolContactLink && (
                          <a
                            href={booking.kolContactLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-indigo-400 transition-colors"
                            title="Xem liên kết cá nhân"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </h3>

                      <p className="text-xs text-slate-300 line-clamp-1">{booking.note || 'Chưa có ghi chú'}</p>
                      
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" /> Lịch đề xuất:{' '}
                          {booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString('vi-VN') : 'Chưa xếp ngày'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Status Transition Action Controls */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 self-end md:self-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400 self-center">Chuyển trạng thái:</span>
                    <select
                      value={booking.kolStatus}
                      onChange={(e) => handleStatusChangeClick(booking, e.target.value)}
                      className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-bold text-white focus:border-indigo-500 focus:outline-none"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Send className="h-5 w-5 text-indigo-400" /> Gửi lời mời KOL mới
              </h3>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Tên KOL / KOC</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Linh Ngọc Đàm, Duy Thẩm..."
                  value={kolName}
                  onChange={(e) => setKolName(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Nền tảng chính</label>
                <select
                  value={kolPlatform}
                  onChange={(e) => setKolPlatform(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="TikTok">TikTok</option>
                  <option value="YouTube">YouTube</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Facebook">Facebook</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Liên kết cá nhân / Kênh</label>
                <input
                  type="url"
                  placeholder="https://tiktok.com/@username"
                  value={kolContactLink}
                  onChange={(e) => setKolContactLink(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Ngày dự kiến lên bài</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Ghi chú lời mời</label>
                <textarea
                  placeholder="Nhập nội dung thỏa thuận sơ bộ..."
                  value={inviteNote}
                  onChange={(e) => setInviteNote(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white focus:border-indigo-500 focus:outline-none h-20 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-slate-400 hover:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingInvite}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2 text-xs font-bold text-white shadow-md disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-emerald-500/40 bg-slate-900 p-6 shadow-2xl text-white">
            
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">Tự động đồng bộ Ngân sách</span>
                <h3 className="text-base font-bold text-white">Thêm chi phí book KOL này?</h3>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Bạn đang chuyển trạng thái KOL <strong className="text-white">{pendingStatusUpdate.bookingObj?.kolName}</strong> sang <span className="text-emerald-400 font-bold">"Đã chấp nhận"</span>. Bạn có muốn tự động ghi nhận chi phí này vào bảng Ngân sách chiến dịch không?
            </p>

            <form onSubmit={handleConfirmBudgetSync} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Số tiền thỏa thuận (VND)</label>
                <input
                  type="number"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs font-bold text-emerald-400 focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Ghi chú chi phí</label>
                <input
                  type="text"
                  value={budgetNote}
                  onChange={(e) => setBudgetNote(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleSkipBudgetSync}
                  className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-400 hover:bg-slate-800 transition-colors"
                >
                  Bỏ qua (Chỉ cập nhật trạng thái)
                </button>

                <button
                  type="submit"
                  disabled={isSyncingBudget}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-xs font-bold text-white shadow-md disabled:opacity-50"
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
