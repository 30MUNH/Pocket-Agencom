import { useState, useEffect } from 'react';
import {
  MessagesSquare,
  ChevronDown,
  Send,
  MessageCircle,
  X,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  Loader2,
  Sparkles,
  Ticket,
  HelpCircle
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { toast } from '../../store/toastStore';
import { supportTicketApi } from '../../api/supportTicketApi';

const FAQS = [
  {
    id: 1,
    question: 'Làm cách nào để tôi cập nhật thông tin doanh nghiệp?',
    answer: 'Bạn có thể cập nhật thông tin thương hiệu, USP, đối tượng khách hàng mục tiêu bằng cách điều hướng đến "Hồ sơ Doanh nghiệp" ở thanh menu bên trái. Dữ liệu này sẽ được AI sử dụng để cá nhân hóa toàn bộ kế hoạch marketing của bạn.',
  },
  {
    id: 2,
    question: 'Tính năng Khung Giờ Vàng đề xuất hoạt động như thế nào?',
    answer: 'Hệ thống thiết lập sẵn khung giờ vàng tương tác cao (mặc định 19:30) phù hợp với hành vi người dùng mạng xã hội phổ biến tại Việt Nam. Bạn có thể áp dụng nhanh preset này hoặc tùy biến thời gian đăng theo nhu cầu.',
  },
  {
    id: 3,
    question: 'Tôi có thể tải xuống và sử dụng kế hoạch marketing ở đâu?',
    answer: 'Sau khi AI tạo kế hoạch trong "Bộ công cụ Marketing", bạn có thể bấm nút "Lưu kế hoạch" để lưu vào danh sách hoặc bấm "Xuất file" để tải về bản Markdown (.md) hoàn chỉnh để chia sẻ hoặc lưu trữ.',
  },
  {
    id: 4,
    question: 'Làm thế nào để tạo hình ảnh AI cho bài đăng mạng xã hội?',
    answer: 'Bạn có thể vào "Kho Media" và bấm "Tạo ảnh AI", hoặc ngay trong chi tiết ý tưởng bài viết tại trang Kết quả kế hoạch / Quick Editor, bấm vào biểu tượng "Tạo ảnh AI" để tạo hình ảnh theo đúng tỷ lệ khung hình mạng xã hội (1:1, 4:5, 16:9, 9:16).',
  },
  {
    id: 5,
    question: 'Tôi có mất chi phí phát sinh nào khi sử dụng AI không?',
    answer: 'Pocket Agencom áp dụng cơ chế 100% Zero-Cost Free-Tier AI với các mô hình nguồn mở. Hạn mức sử dụng hàng ngày (50 lượt văn bản, 20 lượt tạo ảnh) được cấp mới mỗi 24 giờ hoàn toàn miễn phí.',
  },
];

const CATEGORIES = [
  { id: 'technical', label: 'Sự cố Kỹ thuật' },
  { id: 'marketing_plan', label: 'Tạo Kế hoạch Marketing' },
  { id: 'account', label: 'Tài khoản & Đăng nhập' },
  { id: 'payment', label: 'Chi phí & Gói dịch vụ' },
  { id: 'other', label: 'Yêu cầu khác' },
];

const STATUS_MAP = {
  open: { label: 'Đang mở', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300' },
  in_progress: { label: 'Đang xử lý', color: 'bg-pink-100 text-pink-800 dark:bg-pink-950/40 dark:text-pink-300' },
  resolved: { label: 'Đã giải quyết', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' },
  escalated: { label: 'Chuyển cấp', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300' },
  closed: { label: 'Đã đóng', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
};

export default function HelpCenter() {
  const user = useAuthStore((s) => s.user);
  const [openId, setOpenId] = useState(1);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Form states
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('technical');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTicket, setCreatedTicket] = useState(null);

  // Ticket history
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  const loadTickets = async () => {
    try {
      setLoadingTickets(true);
      const res = await supportTicketApi.getTickets();
      const list = res.data?.data || res.data || [];
      setTickets(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error(err.message || 'Không thể tải lịch sử yêu cầu hỗ trợ. Vui lòng thử lại.');
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const toggleFaq = (id) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Vui lòng nhập họ và tên của bạn.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      toast.error('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }
    if (!subject.trim()) {
      toast.error('Vui lòng nhập tiêu đề yêu cầu.');
      return;
    }
    if (!message.trim()) {
      toast.error('Vui lòng nhập nội dung cần hỗ trợ.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await supportTicketApi.createTicket({
        subject: subject.trim(),
        message: message.trim(),
        category,
      });

      const ticketData = res.data?.data || res.data;
      setCreatedTicket(ticketData);
      setMessage('');
      setSubject('');
      toast.success(`Yêu cầu hỗ trợ đã được tạo thành công! Mã ticket: #TK-${ticketData.id}`);
      loadTickets();
    } catch (err) {
      toast.error(err.message || 'Không thể gửi yêu cầu hỗ trợ. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 w-full space-y-10 relative pb-20">
      {/* Header Section */}
      <div className="text-center md:text-left mb-8">
        <h2 className="text-display-lg-mobile md:text-display-lg font-display-lg-mobile md:font-display-lg text-primary dark:text-inverse-primary mb-3">
          Chúng tôi có thể giúp gì cho bạn hôm nay?
        </h2>
        <p className="text-body-lg text-on-surface-variant max-w-2xl">
          Tra cứu câu hỏi thường gặp hoặc tạo phiếu hỗ trợ trực tuyến để nhận giải đáp chuyên môn từ đội ngũ kỹ thuật.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: FAQs & Ticket History */}
        <div className="lg:col-span-7 space-y-8">
          {/* FAQs Box */}
          <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-3xl shadow-ambient p-6 sm:p-8 border border-surface-container/20">
            <h3 className="text-headline-md font-bold text-primary dark:text-inverse-primary mb-6 flex items-center gap-3">
              <MessagesSquare className="text-secondary" size={24} />
              Câu hỏi thường gặp
            </h3>
            <div className="space-y-4">
              {FAQS.map((faq) => {
                const isOpen = openId === faq.id;
                return (
                  <div
                    key={faq.id}
                    className="border-b border-surface-container-high dark:border-outline-variant/20 pb-4 last:border-none cursor-pointer"
                    onClick={() => toggleFaq(faq.id)}
                  >
                    <div className="flex justify-between items-center py-2">
                      <h4 className="text-body-lg font-semibold text-primary dark:text-inverse-primary">
                        {faq.question}
                      </h4>
                      <ChevronDown
                        size={20}
                        className={`text-on-surface-variant transition-transform duration-300 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                    <div
                      className={`overflow-hidden transition-all duration-300 ${
                        isOpen ? 'max-h-[300px] opacity-100 mt-2' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <p className="text-body-md text-on-surface-variant leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ticket History */}
          <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-3xl shadow-ambient p-6 sm:p-8 border border-surface-container/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-headline-md font-bold text-primary dark:text-inverse-primary flex items-center gap-3">
                <Ticket className="text-secondary" size={24} />
                Lịch sử yêu cầu hỗ trợ ({tickets.length})
              </h3>
              <button
                type="button"
                onClick={loadTickets}
                className="inline-flex min-h-11 items-center px-2 text-xs font-semibold text-secondary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Làm mới
              </button>
            </div>

            {loadingTickets ? (
              <div className="py-8 text-center text-on-surface-variant flex items-center justify-center gap-2">
                <Loader2 size={18} className="animate-spin text-secondary" />
                <span>Đang tải danh sách yêu cầu...</span>
              </div>
            ) : tickets.length === 0 ? (
              <div className="py-8 text-center text-on-surface-variant border border-dashed border-surface-variant/40 rounded-2xl p-6">
                <HelpCircle size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">Bạn chưa gửi yêu cầu hỗ trợ nào.</p>
                <p className="text-xs text-on-surface-variant mt-1">
                  Khi gặp khó khăn kỹ thuật hoặc cần hướng dẫn, hãy điền biểu mẫu bên cạnh để tạo phiếu.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {tickets.map((t) => {
                  const statusInfo = STATUS_MAP[t.status] || STATUS_MAP.open;
                  return (
                    <div
                      key={t.id}
                      className="p-4 rounded-2xl bg-surface-container-low dark:bg-surface-variant/20 border border-surface-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-secondary">
                            #TK-{t.id}
                          </span>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                          <span className="text-[11px] text-on-surface-variant">
                            {CATEGORIES.find((c) => c.id === t.category)?.label || t.category}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-primary dark:text-inverse-primary">
                          {t.subject}
                        </h4>
                        <p className="text-xs text-on-surface-variant line-clamp-1">
                          {t.message}
                        </p>
                      </div>
                      <div className="text-[11px] text-on-surface-variant shrink-0">
                        {new Date(t.createdAt).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Contact Support Form */}
        <div className="lg:col-span-5">
          <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-3xl shadow-ambient p-6 sm:p-8 sticky top-24 border border-surface-container/20">
            <div className="mb-6">
              <span className="text-label-sm font-bold text-secondary uppercase tracking-widest mb-1 block">
                Bàn Hỗ trợ Trực tuyến
              </span>
              <h3 className="text-headline-md font-bold text-primary dark:text-inverse-primary mb-2">
                Tạo Phiếu Hỗ trợ (Support Ticket)
              </h3>
              <p className="text-on-surface-variant text-sm">
                Điền nội dung yêu cầu, hệ thống sẽ cấp mã phiếu theo dõi tức thì và thông báo đội ngũ xử lý.
              </p>
            </div>

            {createdTicket ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 text-center space-y-3 animate-fade-in">
                <CheckCircle2 size={40} className="text-emerald-600 dark:text-emerald-400 mx-auto" />
                <h4 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
                  Phiếu đã được tạo thành công!
                </h4>
                <div className="inline-block px-3 py-1 bg-white dark:bg-emerald-900/60 rounded-full font-mono font-bold text-emerald-800 dark:text-emerald-200 text-sm border border-emerald-200 dark:border-emerald-700">
                  Mã phiếu: #TK-{createdTicket.id}
                </div>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  Chúng tôi đã lưu thông tin vào cơ sở dữ liệu và sẽ hỗ trợ bạn sớm nhất qua email {email}.
                </p>
                <button
                  type="button"
                  onClick={() => setCreatedTicket(null)}
                  className="mt-2 inline-block px-5 py-2.5 text-xs font-semibold rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                >
                  Tạo thêm yêu cầu mới
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Category Selection */}
                <div>
                  <label className="block text-label-sm font-semibold text-on-surface dark:text-inverse-primary mb-1.5" htmlFor="help-category">
                    Danh mục vấn đề
                  </label>
                  <select
                    id="help-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-surface-container-low dark:bg-surface-variant/20 border border-surface-variant/30 text-body-md py-3 px-4 rounded-xl text-primary dark:text-inverse-primary outline-none focus:ring-2 focus:ring-secondary transition-all"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-label-sm font-semibold text-on-surface dark:text-inverse-primary mb-1.5" htmlFor="help-subject">
                    Tiêu đề yêu cầu
                  </label>
                  <input
                    className="w-full bg-surface-container-low dark:bg-surface-variant/20 border border-surface-variant/30 focus:ring-2 focus:ring-secondary text-body-md py-3 px-4 rounded-xl text-primary dark:text-inverse-primary placeholder-outline outline-none transition-shadow"
                    id="help-subject"
                    placeholder="Tóm tắt ngắn gọn vấn đề bạn gặp phải..."
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                </div>

                {/* Name */}
                <div>
                  <label className="block text-label-sm font-semibold text-on-surface dark:text-inverse-primary mb-1.5" htmlFor="help-name">
                    Họ và Tên
                  </label>
                  <input
                    className="w-full bg-surface-container-low dark:bg-surface-variant/20 border border-surface-variant/30 focus:ring-2 focus:ring-secondary text-body-md py-3 px-4 rounded-xl text-primary dark:text-inverse-primary placeholder-outline outline-none transition-shadow"
                    id="help-name"
                    placeholder="Nguyễn Văn A"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-label-sm font-semibold text-on-surface dark:text-inverse-primary mb-1.5" htmlFor="help-email">
                    Địa chỉ Email nhận phản hồi
                  </label>
                  <input
                    className="w-full bg-surface-container-low dark:bg-surface-variant/20 border border-surface-variant/30 focus:ring-2 focus:ring-secondary text-body-md py-3 px-4 rounded-xl text-primary dark:text-inverse-primary placeholder-outline outline-none transition-shadow"
                    id="help-email"
                    placeholder="nguyenvana@example.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-label-sm font-semibold text-on-surface dark:text-inverse-primary mb-1.5" htmlFor="help-message">
                    Mô tả chi tiết nội dung
                  </label>
                  <textarea
                    className="w-full bg-surface-container-low dark:bg-surface-variant/20 border border-surface-variant/30 focus:ring-2 focus:ring-secondary text-body-md py-3 px-4 rounded-xl text-primary dark:text-inverse-primary placeholder-outline resize-none h-28 outline-none transition-shadow"
                    id="help-message"
                    placeholder="Mô tả cụ thể các bước bạn đã thực hiện hoặc lỗi phát sinh..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  />
                </div>

                {/* Submit */}
                <button
                  className="w-full bg-secondary-container hover:bg-white text-on-secondary-container py-3.5 rounded-full text-label-sm font-bold uppercase tracking-wider transition-colors flex justify-center items-center gap-2 mt-2 shadow-sm disabled:opacity-60"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Đang khởi tạo phiếu...
                    </>
                  ) : (
                    <>
                      Gửi phiếu hỗ trợ
                      <Send size={16} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Floating Chat Button */}
      <button
        type="button"
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-8 right-8 z-50 w-14 h-14 bg-secondary-container text-on-secondary-container rounded-full shadow-[0_8px_32px_rgba(255,143,163,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
        aria-label="Mở kênh hỗ trợ trực tiếp"
      >
        <MessageCircle size={24} />
      </button>

      {/* Floating Support Modal */}
      {isChatOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:justify-center p-4 bg-primary/40 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] border border-surface-variant/40 bg-surface-container-lowest dark:bg-tertiary-container p-6 shadow-ambient text-primary dark:text-inverse-primary animate-slide-up sm:animate-scale-in">
            <div className="flex items-center justify-between pb-4 border-b border-surface-variant/30">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-secondary-container text-secondary flex items-center justify-center font-bold">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-base leading-tight">Pocket Concierge</h4>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Đang trực tuyến
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsChatOpen(false)}
                className="rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="py-5 space-y-4 text-xs sm:text-sm">
              <p className="text-on-surface-variant leading-relaxed">
                Chào bạn! Bạn cần tư vấn nhanh về cách triển khai chiến dịch, cấu hình thương hiệu hay hỗ trợ kỹ thuật? Vui lòng liên hệ với chúng tôi qua các kênh trực tiếp dưới đây:
              </p>

              <div className="space-y-2.5">
                <a
                  href="tel:19008888"
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-low dark:bg-surface-variant/20 hover:bg-secondary-container/40 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Phone size={18} className="text-secondary" />
                    <div>
                      <span className="font-bold block text-primary dark:text-inverse-primary">Hotline Kỹ thuật</span>
                      <span className="text-[11px] text-on-surface-variant">1900 8888 (8:00 - 21:00)</span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-secondary group-hover:underline">Gọi ngay</span>
                </a>

                <a
                  href="mailto:support@pocketagencom.vn"
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-low dark:bg-surface-variant/20 hover:bg-secondary-container/40 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Mail size={18} className="text-secondary" />
                    <div>
                      <span className="font-bold block text-primary dark:text-inverse-primary">Email Trợ giúp</span>
                      <span className="text-[11px] text-on-surface-variant">support@pocketagencom.vn</span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-secondary group-hover:underline">Gửi mail</span>
                </a>

                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-surface-container-low dark:bg-surface-variant/20">
                  <Clock size={18} className="text-secondary shrink-0" />
                  <span className="text-[11px] text-on-surface-variant">
                    Thời gian phản hồi thông thường: <strong>dưới 2 giờ</strong> trong giờ hành chính.
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsChatOpen(false)}
              className="w-full py-3 rounded-full bg-primary text-on-primary text-xs font-bold hover:opacity-90 transition-opacity"
            >
              Đã hiểu, quay lại
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
