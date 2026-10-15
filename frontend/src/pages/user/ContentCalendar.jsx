import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Sparkles, 
  Clock, 
  Share2, 
  X, 
  Trash2, 
  Bell,
  RefreshCw,
  LayoutGrid,
  List,
  CheckSquare,
  Edit2
} from 'lucide-react';
import { scheduledPostApi } from '../../api/scheduledPostApi';
import PostSuccessModal from '../../components/social/PostSuccessModal';
import { toast } from '../../store/toastStore';
import AuthorizedMediaImage from '../../components/media/AuthorizedMediaImage';

// Platform Icon Helper
function PlatformBadge({ platform = 'Facebook' }) {
  const p = platform.toLowerCase();
  if (p.includes('tiktok')) {
    return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-black text-white">TikTok</span>;
  }
  if (p.includes('instagram')) {
    return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-pink-600 text-white">Instagram</span>;
  }
  if (p.includes('zalo')) {
    return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-600 text-white">Zalo</span>;
  }
  return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-700 text-white">Facebook</span>;
}

// Status Styling Helper
function getStatusBadge(status) {
  switch (status) {
    case 'approved':
      return { label: 'Đã duyệt', class: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300' };
    case 'published':
      return { label: 'Đã đăng', class: 'bg-pink-100 text-pink-800 dark:bg-pink-950/40 dark:text-pink-300 border-pink-300' };
    case 'draft':
      return { label: 'Bản nháp', class: 'bg-surface-container text-on-surface-variant border-surface-variant' };
    case 'pending_approval':
    default:
      return { label: 'Chờ duyệt', class: 'bg-secondary-container text-secondary border-secondary-container/60' };
  }
}

export default function ContentCalendar() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month', 'agenda'
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modals state
  const [selectedPost, setSelectedPost] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [shareModalPost, setShareModalPost] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Create / Edit Post Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const formModalRef = useRef(null);
  const formModalOpenerRef = useRef(null);
  const [formMode, setFormMode] = useState('create'); // 'create' | 'edit'
  const [editingPostId, setEditingPostId] = useState(null);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    platform: 'Facebook',
    scheduledTime: '',
    imageUrl: '',
    mediaAssetId: null,
    status: 'pending_approval',
    isGoldenTime: false,
  });

  // Mock Notification Banner State
  const [activeNotification, setActiveNotification] = useState(null);

  useEffect(() => {
    if (!isFormModalOpen) {
      formModalOpenerRef.current?.focus();
      return undefined;
    }

    const dialog = formModalRef.current;
    const getFocusable = () => [...dialog.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )].filter((element) => element.getClientRects().length > 0);

    getFocusable()[0]?.focus();
    const handleDialogKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsFormModalOpen(false);
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = getFocusable();
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleDialogKeyDown);
    return () => document.removeEventListener('keydown', handleDialogKeyDown);
  }, [isFormModalOpen]);

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
      
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, status: newStatus } : p));
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost(prev => ({ ...prev, status: newStatus }));
      }
    } catch {
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

  const handleOpenCreateModal = (event) => {
    formModalOpenerRef.current = event.currentTarget;
    const defaultTime = new Date();
    defaultTime.setHours(19, 30, 0, 0);
    if (new Date().getHours() >= 19) {
      defaultTime.setDate(defaultTime.getDate() + 1);
    }
    const tzOffset = defaultTime.getTimezoneOffset() * 60000;
    const localISOTime = new Date(defaultTime.getTime() - tzOffset).toISOString().slice(0, 16);

    setFormData({
      title: '',
      content: '',
      platform: 'Facebook',
      scheduledTime: localISOTime,
      imageUrl: '',
      mediaAssetId: null,
      status: 'pending_approval',
      isGoldenTime: true,
    });
    setFormMode('create');
    setEditingPostId(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (post, event) => {
    formModalOpenerRef.current = event.currentTarget;
    let localISOTime = '';
    if (post.scheduledTime) {
      const d = new Date(post.scheduledTime);
      const tzOffset = d.getTimezoneOffset() * 60000;
      localISOTime = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    }

    setFormData({
      title: post.title || '',
      content: post.content || '',
      platform: post.platform || 'Facebook',
      scheduledTime: localISOTime,
      imageUrl: post.imageUrl || '',
      mediaAssetId: post.mediaAssetId || null,
      status: post.status || 'pending_approval',
      isGoldenTime: !!post.isGoldenTime,
    });
    setFormMode('edit');
    setEditingPostId(post.id);
    setIsDetailModalOpen(false);
    setIsFormModalOpen(true);
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài viết này không?')) return;
    try {
      await scheduledPostApi.deletePost(postId);
      toast.success('Đã xóa bài viết thành công.');
      setPosts(prev => prev.filter(p => p.id !== postId));
      setIsDetailModalOpen(false);
      setSelectedPost(null);
    } catch {
      toast.error('Không thể xóa bài viết.');
    }
  };

  const handleSaveForm = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề bài viết.');
      return;
    }
    if (!formData.content.trim()) {
      toast.error('Vui lòng nhập nội dung bài viết.');
      return;
    }

    try {
      setIsSubmittingForm(true);
      const payload = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        platform: formData.platform,
        scheduledTime: formData.scheduledTime ? new Date(formData.scheduledTime).toISOString() : new Date().toISOString(),
        mediaAssetId: formData.mediaAssetId || undefined,
        imageUrl: formData.mediaAssetId ? undefined : (formData.imageUrl.trim() || undefined),
        status: formData.status,
        isGoldenTime: formData.isGoldenTime,
      };

      if (formMode === 'create') {
        const created = await scheduledPostApi.createPost(payload);
        setPosts(prev => [created, ...prev]);
        toast.success('✨ Đã tạo và lên lịch bài viết mới thành công!');
      } else {
        const updated = await scheduledPostApi.updatePost(editingPostId, payload);
        setPosts(prev => prev.map(p => p.id === editingPostId ? (updated || { ...p, ...payload }) : p));
        toast.success('Đã cập nhật bài viết thành công!');
      }

      setIsFormModalOpen(false);
    } catch (err) {
      console.error('[Save Post Error]', err);
      toast.error('Có lỗi xảy ra khi lưu bài viết.');
    } finally {
      setIsSubmittingForm(false);
    }
  };

  // Generate Days Grid for Current Month View
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startingDayOfWeek = firstDayOfMonth.getDay();
    const totalDays = lastDayOfMonth.getDate();

    const days = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ isCurrentMonth: false, date: null });
    }

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
        <div className="relative overflow-hidden rounded-3xl border border-secondary-container bg-secondary-container/80 p-5 shadow-ambient text-primary animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-secondary shadow-sm">
                <Bell className="h-5 w-5 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1">
                    <Sparkles size={14} /> Thông báo Giờ Vàng!
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/70 font-bold">
                    {new Date(activeNotification.scheduledTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-primary mt-0.5 line-clamp-1">
                  Đã đến giờ xuất bản: "{activeNotification.title}"
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => handleTriggerShare(activeNotification)}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary text-on-primary hover:opacity-90 px-4 py-2 text-xs font-bold shadow-sm transition-opacity"
              >
                <Share2 size={14} /> Đăng bài ngay
              </button>
              <button
                type="button"
                onClick={() => setActiveNotification(null)}
                aria-label="Đóng thông báo giờ vàng"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full text-on-surface-variant hover:bg-white/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Banner & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-surface-variant/30 pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-secondary uppercase tracking-wider mb-1 bg-secondary-container px-3 py-1 rounded-full">
            <CalendarIcon size={14} /> Lịch nội dung
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-primary dark:text-inverse-primary sm:text-3xl">
            Lịch đăng bài tự động
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
            Lên lịch đăng bài và quản lý quy trình duyệt nội dung. Mốc 19:30 là preset có thể chỉnh sửa.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPosts}
            className="inline-flex items-center gap-2 rounded-full border border-surface-variant/40 bg-surface-container-lowest dark:bg-tertiary-container px-4 py-2 text-xs font-bold text-primary dark:text-inverse-primary hover:bg-surface-container-high transition-colors shadow-sm"
          >
            <RefreshCw size={14} /> Tải lại
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 rounded-full bg-primary text-on-primary hover:opacity-90 px-5 py-2 text-xs font-bold shadow-sm transition-all"
          >
            <Plus size={16} /> Tạo bài viết mới
          </button>
        </div>
      </div>

      {/* Outlook Calendar Toolbar */}
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between rounded-2xl bg-surface-container-lowest dark:bg-tertiary-container p-4 sm:p-6 shadow-ambient border border-surface-variant/40">
        
        {/* Date Navigation */}
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-full border border-surface-variant/40 bg-surface-container-low dark:bg-surface-variant/20 p-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Tháng trước"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1 text-xs font-bold text-primary dark:text-inverse-primary"
            >
              Hôm nay
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Tháng sau"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <span className="text-base sm:text-lg font-bold capitalize text-primary dark:text-inverse-primary">
            {formattedMonthYear}
          </span>
        </div>

        {/* Filters & View Switches */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filters */}
          <div className="flex items-center gap-1 overflow-x-auto rounded-full border border-surface-variant/40 bg-surface-container-low dark:bg-surface-variant/20 p-1">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'pending_approval', label: '🟡 Chờ duyệt' },
              { id: 'approved', label: '🟢 Đã duyệt' },
              { id: 'published', label: '🔵 Đã đăng' },
              { id: 'golden_time', label: 'Preset 19:30' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
                  statusFilter === f.id
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* View Modes */}
          <div className="flex items-center gap-1 rounded-full border border-surface-variant/40 bg-surface-container-low dark:bg-surface-variant/20 p-1">
            <button
              onClick={() => setViewMode('month')}
              className={`rounded-full p-2 text-xs font-bold ${
                viewMode === 'month' ? 'bg-primary text-on-primary' : 'text-on-surface-variant'
              }`}
              title="Xem theo tháng"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`rounded-full p-2 text-xs font-bold ${
                viewMode === 'agenda' ? 'bg-primary text-on-primary' : 'text-on-surface-variant'
              }`}
              title="Xem danh sách Agenda"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Outlook Grid View */}
      {viewMode === 'month' ? (
        <div className="overflow-hidden rounded-[2.5rem] border border-surface-variant/40 bg-surface-container-lowest dark:bg-tertiary-container shadow-ambient">
          {/* Days of Week Header */}
          <div className="grid grid-cols-7 border-b border-surface-variant/30 bg-surface-container-low dark:bg-surface-variant/20 text-center text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day, idx) => (
              <div key={idx} className="py-3.5 border-r border-surface-variant/20 last:border-r-0">
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
                    className="min-h-[110px] border-b border-r border-surface-variant/20 bg-surface-container-low/30 p-2 opacity-40"
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
                  className={`min-h-[120px] border-b border-r border-surface-variant/20 p-2 transition-colors hover:bg-surface-container-low/60 ${
                    isToday ? 'bg-secondary-container/30 ring-1 ring-inset ring-secondary/40' : ''
                  }`}
                >
                  {/* Day Number */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        isToday
                          ? 'bg-primary text-on-primary shadow-sm'
                          : 'text-on-surface-variant'
                      }`}
                    >
                      {day.dayNumber}
                    </span>

                    {dayPosts.some(p => p.isGoldenTime) && (
                      <span className="text-[10px] font-bold text-secondary flex items-center gap-0.5" title="Có bài viết thuộc Giờ Vàng đề xuất (19:30)">
                        <Sparkles size={12} />
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
                          className={`cursor-pointer rounded-2xl border p-2 text-left shadow-sm transition-all hover:scale-[1.02] ${statusStyle.class}`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <PlatformBadge platform={post.platform} />
                            <span className="text-[10px] font-bold opacity-80">
                              {postTime}
                            </span>
                          </div>
                          <p className="text-xs font-bold line-clamp-1">
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
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-surface-variant/40 bg-surface-container-lowest dark:bg-tertiary-container p-5 shadow-ambient"
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-3 rounded-2xl bg-secondary-container text-secondary">
                    <Clock size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <PlatformBadge platform={post.platform} />
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${statusStyle.class}`}>
                        {statusStyle.label}
                      </span>
                      {post.isGoldenTime && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-secondary bg-secondary-container px-2 py-0.5 rounded-full border border-secondary-container/60">
                          <Sparkles size={12} /> Giờ Vàng (19:30)
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-primary dark:text-inverse-primary mt-1">{post.title}</h3>
                    <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-1">{post.content}</p>
                    <span className="text-[11px] text-on-surface-variant mt-1 block">Lịch xuất bản: {formattedDate}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => handleToggleApproval(post.id, post.status)}
                    className={`px-4 py-2 rounded-full text-xs font-bold border transition-colors ${
                      post.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300'
                        : 'bg-surface-container text-on-surface-variant border-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    {post.status === 'approved' ? '✓ Đã duyệt' : 'Duyệt bài'}
                  </button>

                  <button
                    onClick={() => handleTriggerShare(post)}
                    className="px-5 py-2 rounded-full bg-primary text-on-primary hover:opacity-90 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-opacity"
                  >
                    <Share2 size={14} /> Đăng bài
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Post Inspection & Approval Modal */}
      {isDetailModalOpen && selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-surface-variant/40 bg-surface-container-lowest dark:bg-tertiary-container p-6 sm:p-8 shadow-ambient text-primary dark:text-inverse-primary">
            
            <button
              type="button"
              onClick={() => setIsDetailModalOpen(false)}
              aria-label="Đóng chi tiết bài viết"
              className="absolute right-6 top-6 inline-flex h-11 w-11 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <PlatformBadge platform={selectedPost.platform} />
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${getStatusBadge(selectedPost.status).class}`}>
                {getStatusBadge(selectedPost.status).label}
              </span>
              {selectedPost.isGoldenTime && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-secondary bg-secondary-container px-2.5 py-0.5 rounded-full border border-secondary-container/60">
                  <Sparkles size={14} /> Giờ Vàng (19:30)
                </span>
              )}
            </div>

            <h3 className="text-lg font-bold text-primary dark:text-inverse-primary">{selectedPost.title}</h3>
            
            <div className="mt-4 rounded-3xl bg-surface-container-low dark:bg-surface-variant/20 p-4 border border-surface-variant/30 text-xs space-y-2">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Nội dung bài đăng</span>
              <p className="whitespace-pre-wrap leading-relaxed">{selectedPost.content}</p>
            </div>

            {(selectedPost.mediaAssetId || selectedPost.imageUrl) && (
              <div className="mt-3 rounded-2xl overflow-hidden border border-surface-variant/30 max-h-56 flex items-center justify-center bg-black/5 dark:bg-black/20">
                <AuthorizedMediaImage
                  assetId={selectedPost.mediaAssetId}
                  legacyUrl={selectedPost.imageUrl}
                  alt={selectedPost.title}
                  className="w-full h-full max-h-56 object-cover"
                />
              </div>
            )}

            <div className="mt-4 flex items-center justify-between text-xs text-on-surface-variant border-t border-surface-variant/30 pt-3">
              <span>Lịch đề xuất:</span>
              <span className="font-bold text-primary dark:text-inverse-primary">
                {selectedPost.scheduledTime
                  ? new Date(selectedPost.scheduledTime).toLocaleString('vi-VN')
                  : 'Chưa xếp giờ'}
              </span>
            </div>

            {/* Approval Toggle & Action Row */}
            <div className="mt-6 flex flex-wrap gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => handleToggleApproval(selectedPost.id, selectedPost.status)}
                className={`flex-1 py-2.5 px-4 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                  selectedPost.status === 'approved'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300'
                    : 'bg-secondary-container text-secondary border-secondary-container/60 hover:bg-secondary-container/80'
                }`}
              >
                <CheckSquare size={16} />
                <span>{selectedPost.status === 'approved' ? '✓ Đã duyệt' : 'Duyệt bài'}</span>
              </button>

              <button
                type="button"
                onClick={(event) => handleOpenEditModal(selectedPost, event)}
                className="py-2.5 px-4 rounded-full border border-surface-variant/40 hover:bg-surface-container-high text-xs font-bold flex items-center justify-center gap-1.5 transition-colors text-primary dark:text-inverse-primary"
              >
                <Edit2 size={15} />
                <span>Sửa</span>
              </button>

              <button
                type="button"
                onClick={() => handleDeletePost(selectedPost.id)}
                className="py-2.5 px-3 rounded-full text-error hover:bg-error-container/30 text-xs font-bold flex items-center justify-center transition-colors"
                title="Xóa bài viết"
              >
                <Trash2 size={16} />
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  handleTriggerShare(selectedPost);
                }}
                className="flex-1 py-2.5 px-4 rounded-full bg-primary text-on-primary hover:opacity-90 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-opacity"
              >
                <Share2 size={15} />
                <span>Đăng ngay</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Create / Edit Post Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 animate-fade-in">
          <div ref={formModalRef} role="dialog" aria-modal="true" aria-labelledby="calendar-post-form-title" className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-surface-variant bg-white p-5 sm:p-7 shadow-ambient text-primary">
            
            <div className="flex items-center justify-between pb-4 border-b border-surface-variant/30 mb-5">
              <h3 id="calendar-post-form-title" className="text-xl font-bold text-primary flex items-center gap-2">
                <Sparkles size={18} className="text-secondary" />
                {formMode === 'create' ? 'Tạo bài viết mới' : 'Chỉnh sửa bài viết'}
              </h3>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                aria-label="Đóng biểu mẫu"
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4">
              <div>
                <label htmlFor="calendar-post-title" className="block text-sm font-semibold text-on-surface mb-1">Tiêu đề bài viết</label>
                <input
                  id="calendar-post-title"
                  type="text"
                  placeholder="Ví dụ: Giới thiệu sản phẩm mới hè 2026..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-lg border border-surface-variant bg-white p-3 text-base text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="calendar-post-platform" className="block text-sm font-semibold text-on-surface mb-1">Nền tảng</label>
                  <select
                    id="calendar-post-platform"
                    value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                    className="w-full rounded-2xl border border-surface-variant/40 bg-surface-container-low dark:bg-surface-variant/20 p-3 text-xs text-primary dark:text-inverse-primary focus:outline-none focus:ring-2 focus:ring-secondary/40"
                  >
                    <option value="Facebook">Facebook</option>
                    <option value="TikTok">TikTok</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Zalo">Zalo</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="calendar-post-status" className="block text-sm font-semibold text-on-surface mb-1">Trạng thái</label>
                  <select
                    id="calendar-post-status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full rounded-2xl border border-surface-variant/40 bg-surface-container-low dark:bg-surface-variant/20 p-3 text-xs text-primary dark:text-inverse-primary focus:outline-none focus:ring-2 focus:ring-secondary/40"
                  >
                    <option value="pending_approval">Chờ duyệt</option>
                    <option value="approved">Đã duyệt</option>
                    <option value="draft">Bản nháp</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="calendar-post-time" className="block text-sm font-semibold text-on-surface">Thời gian đăng bài</label>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setHours(19, 30, 0, 0);
                      if (new Date().getHours() >= 19) d.setDate(d.getDate() + 1);
                      const tzOffset = d.getTimezoneOffset() * 60000;
                      const timeStr = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
                      setFormData({ ...formData, scheduledTime: timeStr, isGoldenTime: true });
                    }}
                    className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    <Sparkles size={14} /> Dùng preset 19:30
                  </button>
                </div>
                <input
                  id="calendar-post-time"
                  type="datetime-local"
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                  className="w-full rounded-lg border border-surface-variant bg-white p-3 text-base text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                />
              </div>

              <div>
                <label htmlFor="calendar-post-image" className="block text-sm font-semibold text-on-surface mb-1">URL hình ảnh (tùy chọn)</label>
                <input
                  id="calendar-post-image"
                  type="url"
                  placeholder="https://..."
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value, mediaAssetId: null })}
                  className="w-full rounded-lg border border-surface-variant bg-white p-3 text-base text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                />
              </div>

              <div>
                <label htmlFor="calendar-post-content" className="block text-sm font-semibold text-on-surface mb-1">Nội dung bài viết</label>
                <textarea
                  id="calendar-post-content"
                  rows={4}
                  placeholder="Nhập nội dung bài đăng, hashtag, thông điệp kêu gọi hành động..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full rounded-lg border border-surface-variant bg-white p-3 text-base text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary resize-y leading-relaxed"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isGoldenTime"
                  checked={formData.isGoldenTime}
                  onChange={(e) => setFormData({ ...formData, isGoldenTime: e.target.checked })}
                  className="rounded text-secondary focus:ring-secondary/40 h-4 w-4"
                />
                <label htmlFor="isGoldenTime" className="text-xs font-medium text-on-surface-variant cursor-pointer select-none">
                  Đánh dấu đang dùng preset 19:30
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-variant/30">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="rounded-full px-5 py-2.5 text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingForm}
                  className="rounded-full bg-primary text-on-primary hover:opacity-90 px-6 py-2.5 text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                >
                  {isSubmittingForm ? 'Đang lưu...' : (formMode === 'create' ? 'Tạo bài viết' : 'Lưu thay đổi')}
                </button>
              </div>
            </form>
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
