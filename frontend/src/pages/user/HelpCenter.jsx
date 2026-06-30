import { useState } from 'react';
import { MessagesSquare, ChevronDown, Send, MessageCircle } from 'lucide-react';

const FAQS = [
  {
    id: 1,
    question: 'Làm cách nào để tôi cập nhật thông tin thanh toán của mình?',
    answer: 'Bạn có thể cập nhật chi tiết thanh toán của mình bằng cách điều hướng đến Cài đặt > Thanh toán. Tại đó, nhấp vào "Chỉnh sửa phương thức thanh toán" để nhập thông tin thẻ mới của bạn một cách an toàn.',
  },
  {
    id: 2,
    question: 'Tôi có thể nâng cấp gói của mình sau này không?',
    answer: 'Hoàn toàn được. Bạn có thể thay đổi cấp độ đăng ký của mình bất kỳ lúc nào. Mọi thay đổi sẽ được tính theo tỷ lệ cho chu kỳ thanh toán hiện tại của bạn. Chỉ cần truy cập Kế hoạch của tôi để xem các tùy chọn nâng cấp.',
  },
  {
    id: 3,
    question: 'Tôi có thể tìm thấy các mẫu Bộ công cụ Marketing ở đâu?',
    answer: 'Tất cả các mẫu đang hoạt động được lưu trữ trong Thư viện Mẫu của bạn. Bạn có thể tìm kiếm theo loại chiến dịch, nền tảng hoặc ngành nghề để tìm thấy chính xác những gì bạn cần một cách nhanh chóng.',
  },
  {
    id: 4,
    question: 'Làm cách nào để tôi mời các thành viên trong nhóm?',
    answer: 'Để thêm thành viên nhóm, hãy truy cập Cài đặt > Thành viên và nhấp vào "Mời người dùng". Nhập địa chỉ email của họ và chỉ định vai trò cho họ. Họ sẽ nhận được email hướng dẫn tham gia không gian làm việc của bạn.',
  },
];

export default function HelpCenter() {
  const [openId, setOpenId] = useState(1); // First open by default

  const toggleFaq = (id) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="flex-1 w-full space-y-8 relative pb-20">
      {/* Header Section */}
      <div className="text-center md:text-left mb-12">
        <h2 className="text-display-lg-mobile md:text-display-lg font-display-lg-mobile md:font-display-lg text-primary mb-4">
          Chúng tôi có thể giúp gì cho bạn hôm nay?
        </h2>
        <p className="text-body-lg text-on-surface-variant max-w-2xl">
          Tìm câu trả lời cho các câu hỏi thường gặp hoặc liên hệ với đội ngũ hỗ trợ chăm sóc khách hàng của chúng tôi để được trợ giúp cá nhân hóa.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: FAQs */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-surface-container-lowest rounded-3xl shadow-ambient p-8 border border-surface-container/20">
            <h3 className="text-headline-md font-headline-md text-primary mb-6 flex items-center gap-3">
              <MessagesSquare className="text-secondary-fixed-dim" size={24} />
              Câu hỏi thường gặp
            </h3>
            <div className="space-y-4">
              {FAQS.map((faq) => {
                const isOpen = openId === faq.id;
                return (
                  <div
                    key={faq.id}
                    className="border-b border-surface-container-high pb-4 last:border-none cursor-pointer"
                    onClick={() => toggleFaq(faq.id)}
                  >
                    <div className="flex justify-between items-center py-2">
                      <h4 className="text-body-lg font-body-lg text-primary font-semibold">
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
                        isOpen ? 'max-h-[200px] opacity-100 mt-2' : 'max-h-0 opacity-0'
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
          <div className="bg-surface-container-lowest rounded-3xl shadow-ambient p-8 sticky top-24 border border-surface-container/20">
            <div className="mb-8">
              <span className="text-label-sm font-label-sm text-secondary uppercase tracking-widest mb-2 block">
                Bàn Hỗ trợ Concierge
              </span>
              <h3 className="text-headline-md font-headline-md text-primary mb-2">Cần thêm trợ giúp?</h3>
              <p className="text-on-surface-variant text-sm">
                Gửi tin nhắn cho chúng tôi và đội ngũ hỗ trợ của chúng tôi sẽ phản hồi lại bạn trong vòng 24 giờ.
              </p>
            </div>
            <form className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-label-sm font-label-sm text-on-surface mb-2" htmlFor="help-name">
                  Họ và Tên
                </label>
                <input
                  className="w-full bg-surface-container-low border-none focus:ring-2 focus:ring-secondary-container text-body-md py-3 px-6 rounded-full text-primary placeholder-outline outline-none transition-shadow"
                  id="help-name"
                  placeholder="Nguyễn Văn A"
                  type="text"
                />
              </div>
              {/* Email */}
              <div>
                <label className="block text-label-sm font-label-sm text-on-surface mb-2" htmlFor="help-email">
                  Địa chỉ Email
                </label>
                <input
                  className="w-full bg-surface-container-low border-none focus:ring-2 focus:ring-secondary-container text-body-md py-3 px-6 rounded-full text-primary placeholder-outline outline-none transition-shadow"
                  id="help-email"
                  placeholder="nguyenvana@example.com"
                  type="email"
                />
              </div>
              {/* Message */}
              <div>
                <label className="block text-label-sm font-label-sm text-on-surface mb-2" htmlFor="help-message">
                  Chúng tôi có thể giúp gì?
                </label>
                <textarea
                  className="w-full bg-surface-container-low border-none focus:ring-2 focus:ring-secondary-container text-body-md py-4 px-6 rounded-[1.5rem] text-primary placeholder-outline resize-none h-32 outline-none transition-shadow"
                  id="help-message"
                  placeholder="Mô tả vấn đề hoặc câu hỏi của bạn..."
                />
              </div>
              {/* Submit */}
              <button
                className="w-full bg-secondary-container hover:bg-[#ebd0d2] text-on-secondary-container py-4 rounded-full text-label-sm font-label-sm uppercase tracking-wider transition-colors flex justify-center items-center gap-2 mt-4"
                type="button"
              >
                Gửi yêu cầu hỗ trợ
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Floating Chat Widget */}
      <button className="fixed bottom-8 right-8 z-50 w-14 h-14 bg-secondary-container text-on-secondary-container rounded-full shadow-[0_8px_32px_rgba(255,143,163,0.3)] hover:scale-105 transition-transform flex items-center justify-center">
        <MessageCircle size={24} />
      </button>
    </div>
  );
}
