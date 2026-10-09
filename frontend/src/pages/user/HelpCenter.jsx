import { useState } from 'react';
import { MessagesSquare, ChevronDown, Send, MessageCircle, X, Phone, Mail, Clock, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { toast } from '../../store/toastStore';

const FAQS = [
  {
    id: 1,
    question: 'Làm cách nào để tôi cập nhật thông tin doanh nghiệp?',
    answer: 'Bạn có thể cập nhật thông tin thương hiệu, USP, đối tượng khách hàng mục tiêu bằng cách điều hướng đến "Hồ sơ Doanh nghiệp" ở thanh menu bên trái. Dữ liệu này sẽ được AI sử dụng để cá nhân hóa toàn bộ kế hoạch marketing của bạn.',
  },
  {
    id: 2,
    question: 'Tính năng Giờ Vàng AI hoạt động như thế nào?',
    answer: 'Hệ thống tự động phân tích khung giờ tương tác cao nhất trên các nền tảng mạng xã hội (thường từ 19:30 - 21:00) tại thị trường Việt Nam. Khi bạn lên lịch đăng bài, hệ thống sẽ tự động gợi ý và ghim bài viết vào khung Giờ Vàng để tối ưu lượng reach.',
  },
  {
    id: 3,
    question: 'Tôi có thể tải xuống và sử dụng kế hoạch marketing ở đâu?',
    answer: 'Sau khi AI tạo kế hoạch trong "Bộ công cụ Marketing", bạn có thể bấm nút "Lưu kế hoạch" để lưu vào danh sách của bạn hoặc bấm "Xuất file" để tải về bản tài liệu Markdown (.md) hoàn chỉnh để chia sẻ cho đồng nghiệp hoặc lưu trữ.',
  },
  {
    id: 4,
    question: 'Làm thế nào để tạo hình ảnh AI cho bài đăng mạng xã hội?',
    answer: 'Bạn có thể vào "Kho Media" và bấm "Tạo ảnh AI", hoặc ngay trong chi tiết ý tưởng bài viết tại trang Kết quả kế hoạch / Quick Editor, bấm vào biểu tượng "Tạo ảnh AI" để tạo hình ảnh theo đúng kích thước mạng xã hội (1:1, 4:5, 16:9, 9:16).',
  },
  {
    id: 5,
    question: 'Tôi có mất chi phí phát sinh nào khi sử dụng AI không?',
    answer: 'Pocket Agencom áp dụng cơ chế 100% Zero-Cost Free-Tier AI với các mô hình hiệu năng cao nguồn mở. Hạn mức sử dụng hàng ngày được cấp mới mỗi 24 giờ mà không phát sinh bất kỳ khoản phí nào.',
  },
];

export default function HelpCenter() {
  const user = useAuthStore((s) => s.user);
  const [openId, setOpenId] = useState(1);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Form states
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const toggleFaq = (id) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Vui lòng nhập họ và tên của bạn.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      toast.error('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }
    if (!message.trim()) {
      toast.error('Vui lòng nhập nội dung cần hỗ trợ.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setMessage('');
      toast.success('Yêu cầu hỗ trợ đã được gửi thành công! Chúng tôi sẽ phản hồi trong 24 giờ.');
    }, 800);
  };

  return (
    <div className="flex-1 w-full space-y-8 relative pb-20">
      {/* Header Section */}
      <div className="text-center md:text-left mb-12">
        <h2 className="text-display-lg-mobile md:text-display-lg font-display-lg-mobile md:font-display-lg text-primary dark:text-inverse-primary mb-4">
          Chúng tôi có thể giúp gì cho bạn hôm nay?
        </h2>
        <p className="text-body-lg text-on-surface-variant max-w-2xl">
          Tìm câu trả lời cho các câu hỏi thường gặp hoặc gửi yêu cầu cho đội ngũ hỗ trợ khách hàng để được trợ giúp nhanh nhất.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: FAQs */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-3xl shadow-ambient p-8 border border-surface-container/20">
            <h3 className="text-headline-md font-headline-md text-primary dark:text-inverse-primary mb-6 flex items-center gap-3">
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
                      <h4 className="text-body-lg font-body-lg text-primary dark:text-inverse-primary font-semibold">
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
                      <p className="text-body-md font-body-md text-on-surface-variant leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Contact Support Form */}
        <div className="lg:col-span-5">
          <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-3xl shadow-ambient p-8 sticky top-24 border border-surface-container/20">
            <div className="mb-6">
              <span className="text-label-sm font-label-sm text-secondary uppercase tracking-widest mb-2 block font-bold">
                Bàn Hỗ trợ Trực tuyến
              </span>
              <h3 className="text-headline-md font-headline-md text-primary dark:text-inverse-primary mb-2">Cần thêm trợ giúp?</h3>
              <p className="text-on-surface-variant text-sm">
                Gửi tin nhắn cho chúng tôi và đội ngũ kỹ thuật sẽ phản hồi lại bạn qua email trong vòng 24 giờ làm việc.
              </p>
            </div>

            {isSubmitted ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 text-center space-y-3 animate-fade-in">
                <CheckCircle2 size={40} className="text-emerald-600 dark:text-emerald-400 mx-auto" />
                <h4 className="text-base font-bold text-emerald-900 dark:text-emerald-200">Đã gửi yêu cầu thành công!</h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  Cảm ơn bạn. Chúng tôi đã ghi nhận nội dung và sẽ phản hồi sớm nhất qua email {email}.
                </p>
                <button
                  type="button"
                  onClick={() => setIsSubmitted(false)}
                  className="mt-2 inline-block px-4 py-2 text-xs font-semibold rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                >
                  Gửi yêu cầu khác
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-label-sm font-label-sm text-on-surface dark:text-inverse-primary mb-1.5" htmlFor="help-name">
                    Họ và Tên
                  </label>
                  <input
                    className="w-full bg-surface-container-low dark:bg-surface-variant/20 border-none focus:ring-2 focus:ring-secondary text-body-md py-3 px-5 rounded-full text-primary dark:text-inverse-primary placeholder-outline outline-none transition-shadow"
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
                  <label className="block text-label-sm font-label-sm text-on-surface dark:text-inverse-primary mb-1.5" htmlFor="help-email">
                    Địa chỉ Email
                  </label>
                  <input
                    className="w-full bg-surface-container-low dark:bg-surface-variant/20 border-none focus:ring-2 focus:ring-secondary text-body-md py-3 px-5 rounded-full text-primary dark:text-inverse-primary placeholder-outline outline-none transition-shadow"
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
                  <label className="block text-label-sm font-label-sm text-on-surface dark:text-inverse-primary mb-1.5" htmlFor="help-message">
                    Chúng tôi có thể giúp gì?
                  </label>
                  <textarea
                    className="w-full bg-surface-container-low dark:bg-surface-variant/20 border-none focus:ring-2 focus:ring-secondary text-body-md py-3 px-5 rounded-2xl text-primary dark:text-inverse-primary placeholder-outline resize-none h-28 outline-none transition-shadow"
                    id="help-message"
                    placeholder="Mô tả chi tiết câu hỏi hoặc vấn đề bạn đang gặp phải..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  />
                </div>
                {/* Submit */}
                <button
                  className="w-full bg-secondary-container hover:bg-[#ebd0d2] text-on-secondary-container py-3.5 rounded-full text-label-sm font-bold uppercase tracking-wider transition-colors flex justify-center items-center gap-2 mt-2 shadow-sm disabled:opacity-60"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      Gửi yêu cầu hỗ trợ
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

      {/* Floating Support Drawer / Modal */}
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
                    Thời gian phản hồi thông thường qua email: <strong>dưới 2 giờ</strong> trong giờ hành chính.
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
