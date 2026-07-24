import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Share2, 
  Filter, 
  X, 
  Check, 
  Trash2, 
  ExternalLink,
  Bell,
  RefreshCw,
  LayoutGrid,
  List,
  Eye,
  CheckSquare
} from 'lucide-react';
import { scheduledPostApi } from '../../api/scheduledPostApi';
import PostSuccessModal from '../../components/social/PostSuccessModal';
import { toast } from '../../store/toastStore';

// Platform Icon Helper
function PlatformBadge({ platform = 'Facebook' }) {
  const p = platform.toLowerCase();
  if (p.includes('tiktok')) {
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black text-white">TikTok</span>;
  }
  if (p.includes('instagram')) {
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-600 text-white">Instagram</span>;
  }
  if (p.includes('zalo')) {
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">Zalo</span>;
  }
  return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-700 text-white">Facebook</span>;
}

// Status Styling Helper
function getStatusBadge(status) {
  switch (status) {
    case 'approved':
      return { label: 'Đã duyệt', class: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
    case 'published':
      return { label: 'Đã đăng', class: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' };
    case 'draft':
      return { label: 'Bản nháp', class: 'bg-slate-700/50 text-slate-300 border-slate-600' };
    case 'pending_approval':
    default:
      return { label: 'Chờ duyệt', class: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
  }
}

export default function ContentCalendar() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month', 'week', 'agenda'
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modals state
  const [selectedPost, setSelectedPost] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [shareModalPost, setShareModalPost] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Mock Notification Banner State
  const [activeNotification, setActiveNotification] = useState(null);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await scheduledPostApi.getPosts();
      setPosts(res || []);
    } catch (err) {
      console.error('[Calendar Fetch Error]', err);
      toast.error('Không thể tải lịch đăng bài.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Smart Golden Time Reminder Interval (checks every 30 seconds)
  useEffect(() => {
    const checkGoldenTimeReminders = () => {
      if (!posts || posts.length === 0) return;
      const now = new Date();

      // Find an approved/pending post scheduled for now or near past
      const duePost = posts.find(p => {
        if (!p.scheduledTime) return false;
        const postTime = new Date(p.scheduledTime);
        const diffMinutes = (now - postTime) / (1000 * 60);
        return (p.status === 'approved' || p.status === 'pending_approval') && diffMinutes >= -5 && diffMinutes <= 120;
      });

      if (duePost) {
        setActiveNotification(duePost);
      }
    };

    checkGoldenTimeReminders();
    const interval = setInterval(checkGoldenTimeReminders, 30000);
    return () => clearInterval(interval);
  }, [posts]);

  // Calendar Navigation Handlers
  const handlePrevMonth = () => {
    const next = new Date(currentDate);
    next.setMonth(next.getMonth() - 1);
    setCurrentDate(next);
  };

  const handleNextMonth = () => {
    const next = new Date(currentDate);
    next.setMonth(next.getMonth() + 1);
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Status toggle handler inside modal
  const handleToggleApproval = async (postId, currentStatus) => {
    const newStatus = currentStatus === 'approved' ? 'pending_approval' : 'approved';
    try {
      await scheduledPostApi.updateStatus(postId, newStatus);
      toast.success(newStatus === 'approved' ? 'Đã duyệt bài đăng thành công!' : 'Đã chuyển về trạng thái chờ duyệt.');
      
      // Update local state
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, status: newStatus } : p));
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      toast.error('Không thể cập nhật trạng thái bài viết.');
    }
  };

  const handleTriggerShare = (post) => {
    setShareModalPost({
      title: post.title,
      content: post.content,
      platform: post.platform,
      url: window.location.href
    });
    setIsShareModalOpen(true);
  };

  // Generate Days Grid for Current Month View
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday
    const totalDays = lastDayOfMonth.getDate();

    const days = [];
    
    // Padding from previous month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ isCurrentMonth: false, date: null });
    }

    // Days of current month
    for (let d = 1; d <= totalDays; d++) {
      const dayDate = new Date(year, month, d);
      days.push({
        isCurrentMonth: true,
        dayNumber: d,
        date: dayDate
      });
    }

    return days;
  };

  const daysGrid = getDaysInMonth();

  // Filter posts based on status
  const filteredPosts = posts.filter(p => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'golden_time') return p.isGoldenTime;
    return p.status === statusFilter;
  });

  const getPostsForDay = (dayDate) => {
    if (!dayDate) return [];
    return filteredPosts.filter(p => {
      if (!p.scheduledTime) return false;
      const postDate = new Date(p.scheduledTime);
      return postDate.getDate() === dayDate.getDate() &&
             postDate.getMonth() === dayDate.getMonth() &&
             postDate.getFullYear() === dayDate.getFullYear();
    });
  };

  const formattedMonthYear = currentDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      
      {/* Mock Smart Notification Banner (Golden Time Alert) */}
      {activeNotification && (
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/80 via-slate-900 to-indigo-950/80 p-4 sm:p-5 text-amber-200 shadow-xl backdrop-blur-md animate-pulse">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Bell className="h-5 w-5 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Thông báo Giờ Vàng!
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/20 font-bold border border-amber-500/30">
                    {new Date(activeNotification.scheduledTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white mt-0.5 line-clamp-1">
                  Đã đến giờ xuất bản: "{activeNotification.title}"
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => handleTriggerShare(activeNotification)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 shadow-md transition-all"
              >
                <Share2 className="h-3.5 w-3.5" /> Đăng bài ngay
              </button>
              <button
                onClick={() => setActiveNotification(null)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Banner & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300 mb-1">
            <CalendarIcon className="h-3.5 w-3.5" /> Lịch nội dung Outlook / Smart Schedule
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl flex items-center gap-2">
            Lịch đăng bài tự động
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Lên lịch đăng bài, đề xuất Giờ Vàng AI và quản lý quy trình duyệt nội dung.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPosts}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Tải lại
          </button>
        </div>
      </div>

      {/* Outlook Calendar Toolbar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between rounded-2xl border border-slate-800 bg-slate-900/70 p-4 backdrop-blur-md">
        
        {/* Date Navigation */}
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-xl border border-slate-800 bg-slate-950 p-1">
            <button
              onClick={handlePrevMonth}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1 text-xs font-bold text-slate-300 hover:text-white"
            >
              Hôm nay
            </button>
            <button
              onClick={handleNextMonth}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <span className="text-base sm:text-lg font-bold capitalize text-white">
            {formattedMonthYear}
          </span>
        </div>

        {/* Filters & View Switches */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filters */}
          <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-1">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'pending_approval', label: '🟡 Chờ duyệt' },
              { id: 'approved', label: '🟢 Đã duyệt' },
              { id: 'published', label: '🔵 Đã đăng' },
              { id: 'golden_time', label: '✨ Giờ Vàng' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all whitespace-nowrap ${
                  statusFilter === f.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* View Modes */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-950 p-1">
            <button
              onClick={() => setViewMode('month')}
              className={`rounded-lg p-1.5 text-xs font-semibold ${
                viewMode === 'month' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Xem theo tháng"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`rounded-lg p-1.5 text-xs font-semibold ${
                viewMode === 'agenda' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Xem danh sách Agenda"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Outlook Grid View */}
      {viewMode === 'month' ? (
        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/50 shadow-xl backdrop-blur-md">
          {/* Days of Week Header */}
          <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-950/80 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day, idx) => (
              <div key={idx} className="py-3 border-r border-slate-800/60 last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days Grid */}
          <div className="grid grid-cols-7 auto-rows-fr">
            {daysGrid.map((day, index) => {
              if (!day.isCurrentMonth) {
                return (
                  <div
                    key={index}
                    className="min-h-[110px] border-b border-r border-slate-800/40 bg-slate-950/40 p-2 text-slate-600 opacity-40"
                  />
                );
              }

              const dayPosts = getPostsForDay(day.date);
              const isToday =
                new Date().getDate() === day.dayNumber &&
                new Date().getMonth() === currentDate.getMonth() &&
                new Date().getFullYear() === currentDate.getFullYear();

              return (
                <div
                  key={index}
                  className={`min-h-[120px] border-b border-r border-slate-800/60 p-2 transition-colors hover:bg-slate-800/30 ${
                    isToday ? 'bg-indigo-950/30 ring-1 ring-inset ring-indigo-500/40' : ''
                  }`}
                >
                  {/* Day Number */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        isToday
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'text-slate-400'
                      }`}
                    >
                      {day.dayNumber}
                    </span>

                    {dayPosts.some(p => p.isGoldenTime) && (
                      <span className="text-[10px] font-bold text-amber-400 flex items-center gap-0.5" title="Có bài viết thuộc Giờ Vàng AI">
                        <Sparkles className="h-3 w-3" />
                      </span>
                    )}
                  </div>

                  {/* Scheduled Posts Chips */}
                  <div className="space-y-1.5">
                    {dayPosts.map((post) => {
                      const statusStyle = getStatusBadge(post.status);
                      const postTime = post.scheduledTime
                        ? new Date(post.scheduledTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                        : '';

                      return (
                        <div
                          key={post.id}
                          onClick={() => {
                            setSelectedPost(post);
                            setIsDetailModalOpen(true);
                          }}
                          className={`cursor-pointer rounded-xl border p-2 text-left shadow-sm transition-all hover:scale-[1.02] ${statusStyle.class}`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <PlatformBadge platform={post.platform} />
                            <span className="text-[10px] font-semibold text-slate-300">
                              {postTime}
                            </span>
                          </div>
                          <p className="text-xs font-bold line-clamp-1 text-white">
                            {post.title}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Agenda List View */
        <div className="space-y-3">
          {filteredPosts.map((post) => {
            const statusStyle = getStatusBadge(post.status);
            const formattedDate = post.scheduledTime
              ? new Date(post.scheduledTime).toLocaleString('vi-VN', {
                  weekday: 'short',
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : 'Chưa xếp giờ';

            return (
              <div
                key={post.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 backdrop-blur-md transition-all hover:border-indigo-500/40"
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-slate-300">
                    <Clock className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <PlatformBadge platform={post.platform} />
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold border ${statusStyle.class}`}>
                        {statusStyle.label}
                      </span>
                      {post.isGoldenTime && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          <Sparkles className="h-3 w-3" /> Giờ Vàng AI
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-white mt-1">{post.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{post.content}</p>
                    <span className="text-[11px] text-slate-500 mt-1 block">Lịch xuất bản: {formattedDate}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => handleToggleApproval(post.id, post.status)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                      post.status === 'approved'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {post.status === 'approved' ? '✓ Đã duyệt' : 'Duyệt bài'}
                  </button>

                  <button
                    onClick={() => handleTriggerShare(post)}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 shadow-md"
                  >
                    <Share2 className="h-3.5 w-3.5" /> Đăng bài
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Post Inspection & Approval Modal */}
      {isDetailModalOpen && selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-white">
            
            <button
              onClick={() => setIsDetailModalOpen(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <PlatformBadge platform={selectedPost.platform} />
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${getStatusBadge(selectedPost.status).class}`}>
                {getStatusBadge(selectedPost.status).label}
              </span>
              {selectedPost.isGoldenTime && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  <Sparkles className="h-3.5 w-3.5" /> Giờ Vàng AI
                </span>
              )}
            </div>

            <h3 className="text-lg font-bold text-white">{selectedPost.title}</h3>
            
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-4 text-xs text-slate-300 space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Nội dung bài đăng</span>
              <p className="whitespace-pre-wrap leading-relaxed">{selectedPost.content}</p>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800 pt-3">
              <span>Lịch đề xuất:</span>
              <span className="font-bold text-white">
                {selectedPost.scheduledTime
                  ? new Date(selectedPost.scheduledTime).toLocaleString('vi-VN')
                  : 'Chưa xếp giờ'}
              </span>
            </div>

            {/* Approval Toggle & Action Row */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => handleToggleApproval(selectedPost.id, selectedPost.status)}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                  selectedPost.status === 'approved'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                }`}
              >
                <CheckSquare className="h-4 w-4" />
                <span>{selectedPost.status === 'approved' ? '✓ Bài viết đã duyệt' : 'Duyệt bài đăng'}</span>
              </button>

              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  handleTriggerShare(selectedPost);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md"
              >
                <Share2 className="h-4 w-4" />
                <span>Đăng bài ngay</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Share Modal Trigger */}
      {isShareModalOpen && (
        <PostSuccessModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          post={shareModalPost}
        />
      )}

    </div>
  );
}
