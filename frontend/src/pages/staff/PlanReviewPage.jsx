import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  CheckCircle2,
  Lightbulb,
  Loader2,
  Video,
  Play,
  ChevronDown,
  Calendar,
  MessageSquare,
  Eye,
} from 'lucide-react';
import { useMarketingPlan, useReviewPlan } from '../../hooks/useMarketingPlans';
import { PLAN_STATUS_LABELS } from '../../utils/statusLabels';
import { toast } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';
import { normalizePlanContent } from '../../utils/planContent';

export default function PlanReviewPage() {
  const { id } = useParams();
  const user = useAuthStore((s) => s.user);
  const { data: rawPlan, isLoading } = useMarketingPlan(id);
  const plan = useMemo(() => (rawPlan ? normalizePlanContent(rawPlan) : null), [rawPlan]);
  const reviewPlan = useReviewPlan();
  const [newNoteText, setNewNoteText] = useState('');
  const [notes, setNotes] = useState([
    {
      id: 1,
      type: 'log',
      text: 'Hệ thống đã nhận yêu cầu từ User',
    },
    {
      id: 2,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Staff',
      author: 'Staff Member',
      time: '1 ngày trước',
      text: 'Yêu cầu kế hoạch tiếp thị đầy đủ thông tin. Đang tiến hành tạo cẩm nang chi tiết.',
      isHighlight: false,
    },
  ]);

  const handlePostNote = (e) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    const newNote = {
      id: Date.now(),
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Staff',
      author: user?.name || 'Staff Member',
      time: 'Vừa xong',
      text: newNoteText,
      isHighlight: true,
    };
    setNotes([...notes, newNote]);
    setNewNoteText('');
  };

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
    <div className="flex-1 w-full space-y-8 max-w-7xl mx-auto">
      {/* Top Header Row */}
      <div className="border-b border-slate-200/80 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center text-slate-500 hover:text-slate-900 transition-colors text-xs font-semibold uppercase tracking-wider mb-3"
          >
            <ArrowLeft size={14} className="mr-1.5" />
            Quay lại Hàng chờ
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              {plan.goal}
            </h2>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#FFCED2] text-slate-900">
              {statusLabel}
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Được nộp bởi <span className="font-semibold text-slate-900">{plan.user?.name}</span>
          </p>
        </div>

        {isStaff && (
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleSuggestEdits}
            disabled={reviewPlan.isPending}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all flex items-center gap-2 disabled:opacity-60 shadow-sm"
          >
            <Edit size={16} />
            Yêu cầu Sửa
          </button>
          <button
            onClick={handleMarkReviewed}
            disabled={reviewPlan.isPending}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all disabled:opacity-60 shadow-sm"
          >
            Đánh dấu Đã xem
          </button>
          <button
            onClick={handleApprove}
            disabled={reviewPlan.isPending}
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 shadow-sm text-sm transition-all flex items-center gap-2 font-bold disabled:opacity-60"
          >
            {reviewPlan.isPending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            Duyệt Kế hoạch
          </button>
        </div>
        )}
      </div>

      {plan.hasLegacyContent && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3.5 text-sm text-amber-900">
          Kế hoạch lịch sử này có nội dung tham chiếu một tính năng đã ngừng hoạt động. Nội dung gốc được giữ nguyên để đối chiếu; các thao tác tạo lại hoặc tái sử dụng tự động đã được tắt.
        </div>
      )}

      {/* Main Layout Grid */}
      <div className="flex flex-col xl:flex-row gap-8">
        {/* Center: Strategy Detail Column */}
        <div className="flex-1 flex flex-col gap-8">
          {/* Overview Section */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white rounded-2xl p-7 shadow-sm border border-slate-200/80 relative overflow-hidden group">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                Tóm tắt Dự án
              </h3>
              <p className="text-slate-800 leading-relaxed relative z-10 whitespace-pre-wrap font-medium">
                {typeof plan.playbook === 'string'
                  ? plan.playbook
                  : (plan.campaignReason || plan.campaignType || plan.goal || 'Chưa có thông tin tóm tắt.')}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-7 shadow-sm border border-slate-200/80 flex flex-col justify-center items-start">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Khách hàng Mục tiêu
              </h3>
              <p className="text-xl font-bold text-slate-900 mb-1">
                {plan.businessProfile?.targetCustomer || plan.targetCustomer || 'Chưa xác định'}
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                {plan.businessProfile?.businessType || plan.businessProfile?.productDescription || plan.businessType || 'Doanh nghiệp'}
              </p>
            </div>
          </section>

          {/* Content Concepts Section */}
          <section className="bg-white rounded-2xl p-7 shadow-sm border border-slate-200/80 space-y-6">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FFCED2] flex items-center justify-center text-slate-900">
                <Lightbulb size={18} />
              </div>
              Ý tưởng Nội dung
            </h3>

            {plan.contentIdeas && plan.contentIdeas.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {plan.contentIdeas.map((idea, index) => (
                  <div key={index} className="p-5 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:border-slate-300 transition-all">
                    <span className="inline-block px-2.5 py-1 bg-white border border-slate-200/80 rounded-md text-xs font-semibold text-slate-700 mb-3 shadow-xs">
                      {idea.channel || idea.format || 'Đa kênh'}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 mb-2">
                      {idea.title}
                    </h4>
                    <p className="text-sm text-slate-600 mb-3 whitespace-pre-wrap leading-relaxed">
                      {idea.description}
                    </p>
                    {idea.format && (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                        <Eye size={13} /> {idea.format}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Chưa có ý tưởng nội dung.</p>
            )}
          </section>

          {/* Approved Scripts Section */}
          <section className="bg-white rounded-2xl p-7 shadow-sm border border-slate-200/80 space-y-6">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                <Video size={18} />
              </div>
              Kịch bản Video
            </h3>

            {plan.videoScripts && plan.videoScripts.length > 0 ? (
              <div className="space-y-3.5">
                {plan.videoScripts.map((script, index) => (
                  <details
                    key={index}
                    className="group bg-slate-50/60 rounded-xl border border-slate-200/80 overflow-hidden"
                    open={index === 0}
                  >
                    <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-100/60 transition-colors">
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center shadow-xs">
                          <Play size={14} className="text-slate-900 fill-slate-900" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">
                            {script.scene || script.title || `Phân cảnh ${index + 1}`}
                          </h4>
                          {script.title && script.scene && (
                            <p className="text-xs text-slate-500 mt-0.5">
                              {script.title}
                            </p>
                          )}
                        </div>
                      </div>
                      <ChevronDown className="text-slate-400 group-open:rotate-180 transition-transform" size={16} />
                    </summary>
                    <div className="p-4 pt-1 border-t border-slate-200/60 bg-white">
                      <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-5 mt-3">
                        <div>
                          <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Hình ảnh / Hành động</h5>
                          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {script.visual || script.action || 'Không có mô tả hình ảnh'}
                          </p>
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Âm thanh / Lời thoại</h5>
                          <div className="text-sm text-slate-800 bg-slate-50 border border-slate-100 p-3.5 rounded-lg italic leading-relaxed whitespace-pre-wrap">
                            {script.audio || script.dialogue || script.action || 'Không có lời thoại'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Chưa có kịch bản video.</p>
            )}
          </section>

          {/* Rollout Timeline Section */}
          <section className="bg-white rounded-2xl p-7 shadow-sm border border-slate-200/80 space-y-6">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FFCED2] flex items-center justify-center text-slate-900">
                <Calendar size={18} />
              </div>
              Lộ trình Triển khai
            </h3>

            {Array.isArray(plan.playbook) && plan.playbook.length > 0 ? (
              <div className="relative border-l-2 border-slate-200 ml-4 space-y-8 pb-3">
                {plan.playbook.map((phase, index) => (
                  <div key={index} className="relative pl-6">
                    <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-slate-900 ring-4 ring-white" />
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h4 className="text-base font-bold text-slate-900">
                        {phase.phaseName || `Giai đoạn ${index + 1}`}
                      </h4>
                      {phase.duration && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                          {phase.duration}
                        </span>
                      )}
                    </div>
                    {phase.objective && (
                      <p className="text-sm text-slate-600 mt-1.5 font-medium">
                        {phase.objective}
                      </p>
                    )}
                    {Array.isArray(phase.keyActions) && phase.keyActions.length > 0 && (
                      <ul className="mt-2 space-y-1 text-sm text-slate-600 list-disc list-inside">
                        {phase.keyActions.map((action, aIdx) => (
                          <li key={aIdx}>{typeof action === 'string' ? action.replace(/\*\*/g, '') : action}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            ) : Array.isArray(plan.checklist) && plan.checklist.length > 0 ? (
              <div className="relative border-l-2 border-slate-200 ml-4 space-y-6 pb-3">
                {plan.checklist.map((item, index) => (
                  <div key={index} className="relative pl-6">
                    <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-slate-900 ring-4 ring-white" />
                    <h4 className="text-base font-bold text-slate-900">
                      {item.title}
                    </h4>
                    {item.desc && (
                      <p className="text-sm text-slate-600 mt-1">
                        {item.desc}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : typeof plan.playbook === 'string' && plan.playbook.trim() ? (
              <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap pl-4 font-normal">
                {plan.playbook}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Chưa có lộ trình triển khai.</p>
            )}
          </section>
        </div>

        {/* Right Sidebar: Internal Notes Thread */}
        <aside className="w-full xl:w-[360px] shrink-0 flex flex-col gap-6">
          <div className="sticky top-24 bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex flex-col h-[calc(100vh-140px)]">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-800">
                <MessageSquare size={16} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Ghi chú Nội bộ</h3>
                <p className="text-xs text-slate-500">Chỉ dành riêng cho Pocket Agencom</p>
              </div>
            </div>

            {/* Scrollable history thread */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4">
              {notes.map((note) => {
                if (note.type === 'log') {
                  return (
                    <div key={note.id} className="flex gap-3 items-center justify-center my-2">
                      <div className="h-px bg-slate-200 flex-1" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                        {note.text}
                      </span>
                      <div className="h-px bg-slate-200 flex-1" />
                    </div>
                  );
                }

                return (
                  <div key={note.id} className="flex gap-3">
                    <img
                      alt="Avatar"
                      className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-slate-200 shadow-xs"
                      src={note.avatar}
                    />
                    <div
                      className={`rounded-xl rounded-tl-none p-3.5 flex-1 border ${
                        note.isHighlight
                          ? 'bg-slate-50 border-slate-200/80'
                          : 'bg-white border-slate-200/70'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-slate-900">
                          {note.author}
                        </span>
                        <span className="text-[10px] text-slate-400">{note.time}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {note.text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Note input box */}
            <form onSubmit={handlePostNote} className="mt-4 pt-3.5 border-t border-slate-100">
              <textarea
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Thêm ghi chú hoặc báo cáo vấn đề..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white resize-none transition-all"
              />
              <div className="flex justify-end mt-2.5">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition-colors shadow-xs"
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
