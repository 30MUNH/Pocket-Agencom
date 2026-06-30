import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, XCircle, Edit, CheckCircle2, Lightbulb, Loader2 } from 'lucide-react';
import { useMarketingPlan, useReviewPlan } from '../../hooks/useMarketingPlans';
import { PLAN_STATUS_LABELS } from '../../utils/statusLabels';
import { toast } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';

export default function PlanReviewPage() {
  const { id } = useParams();
  const user = useAuthStore((s) => s.user);
  const { data: plan, isLoading } = useMarketingPlan(id);
  const reviewPlan = useReviewPlan();
  const [newNoteText, setNewNoteText] = useState('');

  const statusLabel = plan ? (PLAN_STATUS_LABELS[plan.status]?.label || plan.status) : '';

  const handleApprove = async () => {
    try {
      await reviewPlan.mutateAsync({ id, action: 'approve' });
      toast.success('Đã duyệt kế hoạch thành công!');
    } catch (err) {
      toast.error(err.message || 'Không thể duyệt kế hoạch');
    }
  };

  const handleSuggestEdits = async () => {
    try {
      await reviewPlan.mutateAsync({ id, action: 'need_revision', note: newNoteText || undefined });
      toast.success('Đã gửi gợi ý chỉnh sửa đến khách hàng.');
    } catch (err) {
      toast.error(err.message || 'Không thể gửi gợi ý');
    }
  };

  const handleMarkReviewed = async () => {
    try {
      await reviewPlan.mutateAsync({ id, action: 'reviewed', note: newNoteText || undefined });
      toast.success('Đã đánh dấu kế hoạch đã xem xét.');
    } catch (err) {
      toast.error(err.message || 'Không thể cập nhật trạng thái');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 gap-2">
        <Loader2 className="animate-spin" size={24} />
        Đang tải kế hoạch...
      </div>
    );
  }

  if (!plan) {
    return <div className="text-center py-20">Không tìm thấy kế hoạch.</div>;
  }

  const isStaff = user?.role === 'staff' || user?.role === 'admin';

  return (
    <div className="flex-1 w-full space-y-8">
      {/* Top Header Row */}
      <div className="border-b border-surface-variant/50 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center text-on-surface-variant hover:text-primary transition-colors text-label-sm font-label-sm mb-3 dark:text-outline-variant"
          >
            <ArrowLeft size={16} className="mr-1" />
            Quay lại Hàng chờ
          </Link>
          <div className="flex items-center gap-3">
            <h2 className="text-display-lg-mobile md:text-headline-md font-headline-md text-primary dark:text-inverse-primary">
              {plan.goal}
            </h2>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-label-sm uppercase tracking-wider bg-surface-container-high text-on-surface-variant">
              {statusLabel}
            </span>
          </div>
          <p className="text-body-md text-on-surface-variant mt-1 dark:text-outline-variant">
            Được nộp bởi <span className="font-semibold">{plan.user?.name}</span>
          </p>
        </div>

        {isStaff && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleSuggestEdits}
            disabled={reviewPlan.isPending}
            className="px-5 py-3 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-label-sm transition-colors flex items-center gap-2 disabled:opacity-60"
          >
            <Edit size={16} />
            Yêu cầu Sửa
          </button>
          <button
            onClick={handleMarkReviewed}
            disabled={reviewPlan.isPending}
            className="px-5 py-3 rounded-full bg-surface-container text-label-sm transition-colors disabled:opacity-60"
          >
            Đánh dấu Đã xem
          </button>
          <button
            onClick={handleApprove}
            disabled={reviewPlan.isPending}
            className="px-7 py-3 rounded-full bg-primary text-on-primary hover:bg-primary/90 shadow-md text-label-sm transition-all flex items-center gap-2 font-bold disabled:opacity-60"
          >
            {reviewPlan.isPending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            Duyệt Kế hoạch
          </button>
        </div>
        )}
      </div>

      {/* Main Layout Grid */}
      <div className="flex flex-col xl:flex-row gap-8">
        {/* Center: Strategy Detail Column */}
        <div className="flex-1 flex flex-col gap-8">
          {/* Overview Section */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-8 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group border border-surface-variant/50">
              <div className="absolute -right-12 -top-12 w-48 h-48 bg-secondary-container/30 dark:bg-secondary-fixed-dim/5 rounded-full blur-3xl group-hover:bg-secondary-container/50 transition-colors" />
              <h3 className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-widest mb-4">
                Tóm tắt Dự án
              </h3>
              <p className="text-body-lg text-on-surface dark:text-inverse-primary leading-relaxed relative z-10">
                Một chiến dịch tập trung vào hình ảnh và kể chuyện được thiết kế để thu hút lại các khách hàng cũ trước đợt cao điểm ngày lễ. Tập trung vào phong cách tối giản và chất liệu bền vững thông qua video ngắn và chuỗi email được chọn lọc.
              </p>
            </div>

            <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-8 shadow-sm border border-surface-variant/50 flex flex-col justify-center items-start">
              <h3 className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-widest mb-2">
                Khách hàng Mục tiêu
              </h3>
              <p className="text-headline-md font-bold text-primary dark:text-inverse-primary mb-1">
                Phụ nữ 28-45
              </p>
              <p className="text-body-md text-on-surface-variant leading-relaxed">
                Chuyên gia thành thị tìm kiếm trang phục cơ bản cao cấp.
              </p>
            </div>
          </section>

          {/* Content Concepts Section */}
          <section className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-8 shadow-sm border border-surface-variant/50 space-y-8">
            <h3 className="text-headline-md font-bold text-primary dark:text-inverse-primary flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary-container dark:bg-secondary-fixed-dim/10 flex items-center justify-center text-on-secondary-container dark:text-secondary-fixed">
                <Lightbulb size={20} />
              </div>
              Ý tưởng Nội dung
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Concept 1 */}
              <div className="p-6 rounded-2xl bg-surface dark:bg-surface-variant/20 border border-surface-variant/30 hover:-translate-y-0.5 transition-all">
                <span className="inline-block px-3 py-1 bg-surface-container dark:bg-outline/20 rounded-full text-label-sm font-label-sm text-on-surface-variant dark:text-inverse-on-surface mb-4">
                  Instagram Reel
                </span>
                <h4 className="text-body-lg font-semibold text-on-surface dark:text-inverse-primary mb-2">
                  "3 Cách phối đồ với Trench Coat Cổ điển"
                </h4>
                <p className="text-body-md text-on-surface-variant mb-4">
                  Các chuyển cảnh nhanh cho thấy cùng một chiếc áo khoác đi từ văn phòng đến bữa trưa cuối tuần. Âm thanh năng lượng cao.
                </p>
                <div className="flex items-center gap-2 text-label-sm font-label-sm text-secondary dark:text-secondary-fixed">
                  <Eye size={14} /> Tập trung Nhận diện
                </div>
              </div>

              {/* Concept 2 */}
              <div className="p-6 rounded-2xl bg-surface dark:bg-surface-variant/20 border border-surface-variant/30 hover:-translate-y-0.5 transition-all">
                <span className="inline-block px-3 py-1 bg-surface-container dark:bg-outline/20 rounded-full text-label-sm font-label-sm text-on-surface-variant dark:text-inverse-on-surface mb-4">
                  Bản tin Email
                </span>
                <h4 className="text-body-lg font-semibold text-on-surface dark:text-inverse-primary mb-2">
                  "Hậu trường: Lụa Bền vững"
                </h4>
                <p className="text-body-md text-on-surface-variant mb-4">
                  Bài viết ảnh giáo dục chi tiết về nguồn cung ứng dòng lụa mới của chúng tôi. Giọng điệu mềm mại, gần gũi với các trích dẫn của người sáng lập.
                </p>
                <div className="flex items-center gap-2 text-label-sm font-label-sm text-secondary dark:text-secondary-fixed">
                  <Heart size={14} /> Tập trung Nuôi dưỡng
                </div>
              </div>
            </div>
          </section>

          {/* Approved Scripts Section */}
          <section className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-8 shadow-sm border border-surface-variant/50 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-surface-container-lowest to-secondary-container/10 dark:to-secondary-fixed-dim/5 z-0" />
            <div className="relative z-10 space-y-6">
              <h3 className="text-headline-md font-bold text-primary dark:text-inverse-primary flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center">
                  <Video size={20} />
                </div>
                Kịch bản Được Duyệt
              </h3>

              <div className="space-y-4">
                <details
                  className="group bg-surface dark:bg-surface-variant/20 rounded-2xl border border-surface-variant/30 overflow-hidden"
                  open={isScriptOpen}
                  onToggle={(e) => setIsScriptOpen(e.target.open)}
                >
                  <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-surface-container-low dark:hover:bg-surface-variant/35 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-surface-container dark:bg-outline/20 flex items-center justify-center">
                        <Play size={16} className="text-primary dark:text-inverse-primary" />
                      </div>
                      <div>
                        <h4 className="text-body-lg font-semibold text-on-surface dark:text-inverse-primary">
                          Phần Hook 'Morning Rush'
                        </h4>
                        <p className="text-label-sm font-label-sm text-on-surface-variant mt-1">
                          Thời lượng: 15 giây • TikTok
                        </p>
                      </div>
                    </div>
                    <ChevronDown className="text-on-surface-variant group-open:rotate-180 transition-transform" size={18} />
                  </summary>
                  <div className="p-6 pt-0 border-t border-surface-variant/30 bg-surface dark:bg-surface-variant/5">
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-6 mt-6">
                      <div>
                        <h5 className="text-label-sm font-label-sm text-on-surface-variant uppercase mb-2">Hình ảnh</h5>
                        <p className="text-body-md text-on-surface dark:text-inverse-primary">
                          Cận cảnh đồng hồ báo thức chỉ 7:30 sáng. Cắt nhanh sang tủ quần áo hỗn loạn. Phóng to khuôn mặt lo lắng.
                        </p>
                      </div>
                      <div>
                        <h5 className="text-label-sm font-label-sm text-on-surface-variant uppercase mb-2">Âm thanh / Trên màn hình</h5>
                        <div className="text-body-md text-on-surface bg-surface-container-low dark:bg-surface-variant/20 p-4 rounded-xl italic">
                          (Âm thanh: Tiếng tích tắc nhanh của đồng hồ dừng đột ngột bằng một tiếng xước đĩa) <br />
                          <br />
                          Chữ: "Lại không có gì để mặc?"
                        </div>
                      </div>
                    </div>
                  </div>
                </details>
              </div>
            </div>
          </section>

          {/* Rollout Timeline Section */}
          <section className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-8 shadow-sm border border-surface-variant/50 space-y-8">
            <h3 className="text-headline-md font-bold text-primary dark:text-inverse-primary flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary-container dark:bg-secondary-fixed-dim/10 flex items-center justify-center text-on-secondary-container dark:text-secondary-fixed">
                <Calendar size={20} />
              </div>
              Lộ trình Triển khai
            </h3>

            <div className="relative border-l-2 border-surface-variant/50 dark:border-outline/20 ml-6 space-y-10 pb-4">
              <div className="relative pl-8">
                <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center ring-4 ring-surface-container-lowest dark:ring-tertiary-container">
                  <div className="w-2 h-2 rounded-full bg-on-primary" />
                </div>
                <h4 className="text-body-lg font-semibold text-on-surface dark:text-inverse-primary">
                  Tuần 1: Giai đoạn Teaser
                </h4>
                <p className="text-body-md text-on-surface-variant mt-2">
                  Đăng 3 Instagram Stories gợi ý về bộ sưu tập mới. Gửi email 'Truy cập sớm cho VIP' tới danh sách phân khúc.
                </p>
              </div>

              <div className="relative pl-8">
                <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full bg-surface-variant dark:bg-outline/35 flex items-center justify-center ring-4 ring-surface-container-lowest dark:ring-tertiary-container" />
                <h4 className="text-body-lg font-semibold text-on-surface dark:text-inverse-primary">
                  Tuần 2: Ra mắt Chính thức
                </h4>
                <p className="text-body-md text-on-surface-variant mt-2">
                  Xuất bản video chính trên Reels và TikTok. Kích hoạt chuỗi email chào mừng cho người đăng ký mới.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Right Sidebar: Internal Notes Thread */}
        <aside className="w-full xl:w-[380px] shrink-0 flex flex-col gap-6">
          <div className="sticky top-28 bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-6 shadow-sm border border-surface-variant/50 flex flex-col h-[calc(100vh-140px)]">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-surface-variant/30">
              <MessageSquare className="text-primary dark:text-inverse-primary" size={24} />
              <div>
                <h3 className="text-headline-md font-bold text-primary dark:text-inverse-primary">Ghi chú Nội bộ</h3>
                <p className="text-label-sm font-label-sm text-on-surface-variant">Chỉ dành riêng cho Pocket Agencom</p>
              </div>
            </div>

            {/* Scrollable history thread */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-6 scrollbar-none">
              {notes.map((note) => {
                if (note.type === 'log') {
                  return (
                    <div key={note.id} className="flex gap-4 items-center justify-center my-3">
                      <div className="h-px bg-surface-variant/30 dark:bg-outline/25 flex-1" />
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider px-2 dark:text-outline-variant">
                        {note.text}
                      </span>
                      <div className="h-px bg-surface-variant/30 dark:bg-outline/25 flex-1" />
                    </div>
                  );
                }

                return (
                  <div key={note.id} className="flex gap-4">
                    <img
                      alt="Avatar"
                      className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-surface-container-lowest shadow-sm"
                      src={note.avatar}
                    />
                    <div
                      className={`rounded-2xl rounded-tl-none p-4 flex-1 border ${
                        note.isHighlight
                          ? 'bg-secondary-container/20 border-secondary-container/40 dark:bg-secondary/25 dark:border-secondary/35'
                          : 'bg-surface border-surface-variant/30 dark:bg-surface-variant/10 dark:border-outline/10'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-label-sm font-bold text-on-surface dark:text-inverse-primary">
                          {note.author}
                        </span>
                        <span className="text-[10px] text-on-surface-variant dark:text-outline-variant">{note.time}</span>
                      </div>
                      <p className="text-body-md text-on-surface-variant dark:text-inverse-on-surface text-sm leading-relaxed">
                        {note.text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Note input box */}
            <form onSubmit={handlePostNote} className="mt-6 pt-4 border-t border-surface-variant/30 dark:border-outline/20">
              <textarea
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Thêm ghi chú hoặc báo cáo vấn đề..."
                rows={3}
                className="w-full bg-secondary-container/30 dark:bg-surface-variant/20 border-none rounded-2xl p-4 text-body-md text-primary dark:text-inverse-primary placeholder:text-on-surface-variant/60 focus:ring-2 focus:ring-secondary-container resize-none transition-shadow"
              />
              <div className="flex justify-end mt-3">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full bg-primary text-on-primary hover:bg-primary/95 text-label-sm font-label-sm transition-colors font-bold"
                >
                  Đăng Ghi chú
                </button>
              </div>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}
