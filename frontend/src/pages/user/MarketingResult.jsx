import { useState } from 'react';
import {
  Lightbulb,
  Heart,
  Mail,
  FileText,
  ClipboardCheck,
  Check,
  PlayCircle,
  Play,
  Video,
  Copy,
  BookOpen,
  RefreshCw,
  Download,
  Save,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const INITIAL_CHECKLIST = [
  { id: 1, title: 'Đánh giá Chi phí Quảng cáo', desc: 'Kiểm tra số liệu hàng ngày cho chiến dịch Facebook.', checked: false },
  { id: 2, title: 'Lên lịch đăng Story', desc: 'Lên hàng chờ 3 cuộc thăm dò ý kiến tương tác.', checked: true },
  { id: 3, title: 'Phản hồi Bình luận', desc: 'Dành 15 phút trả lời bình luận các bài viết mới nhất.', checked: false },
  { id: 4, title: 'Kiểm tra đồng bộ kho hàng', desc: 'Xác minh danh mục sản phẩm trên Shopify đã được cập nhật.', checked: false },
];

export default function MarketingResult() {
  const [checklist, setChecklist] = useState(INITIAL_CHECKLIST);
  const [copiedScript, setCopiedScript] = useState(null);

  const toggleCheck = (id) => {
    setChecklist(
      checklist.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const copyToClipboard = (title, text) => {
    navigator.clipboard.writeText(text);
    setCopiedScript(title);
    setTimeout(() => setCopiedScript(null), 2000);
  };

  return (
    <div className="flex-1 w-full space-y-12">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-surface-variant/30 pb-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-[11px] uppercase tracking-wider font-bold">
              Kế hoạch Mới Đã được Tạo
            </span>
            <span className="text-on-surface-variant text-sm flex items-center gap-1.5 dark:text-outline-variant">
              <Clock size={14} /> Vừa xong
            </span>
          </div>
          <h2 className="text-display-lg-mobile md:text-display-lg font-display-lg text-primary dark:text-inverse-primary max-w-2xl leading-tight">
            Ra mắt Bộ sưu tập Mùa xuân
          </h2>
          <p className="text-body-lg text-on-surface-variant max-w-3xl">
            Chiến lược đa kênh toàn diện kéo dài 4 tuần được thiết kế riêng để thu hút khán giả millennial trên Instagram và TikTok.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            to="/marketing-kit"
            className="px-5 py-3 rounded-full text-label-sm font-label-sm text-primary dark:text-inverse-primary hover:bg-secondary-container/40 transition-colors flex items-center gap-2 group border border-outline-variant/30"
          >
            <RefreshCw size={14} className="text-on-surface-variant group-hover:rotate-180 transition-transform duration-500" />
            Tạo lại
          </Link>
          <button
            onClick={() => alert('Xuất kế hoạch thành công!')}
            className="px-5 py-3 rounded-full text-label-sm font-label-sm text-primary dark:text-inverse-primary bg-surface-container-lowest dark:bg-tertiary-container border border-outline-variant hover:border-primary dark:hover:border-primary-fixed transition-colors shadow-sm flex items-center gap-2"
          >
            <Download size={14} />
            Xuất file
          </button>
          <button
            onClick={() => alert('Kế hoạch đã được lưu vào Bảng điều khiển!')}
            className="px-5 py-3 rounded-full text-label-sm font-label-sm text-on-primary bg-primary hover:bg-primary/90 transition-colors shadow-md hover:-translate-y-0.5 transform duration-200"
          >
            Lưu kế hoạch
          </button>
        </div>
      </div>

      {/* Bento Grid: Content Ideas */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center">
            <Lightbulb className="text-on-secondary-container" size={16} />
          </div>
          <h3 className="text-headline-md font-bold text-primary dark:text-inverse-primary">Ý tưởng Nội dung</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-8 shadow-[0_4px_24px_rgba(255,143,163,0.08)] hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(255,143,163,0.12)] transition-all duration-300 flex flex-col h-full border border-transparent hover:border-secondary-container/50">
            <div className="flex justify-between items-start mb-6">
              <span className="text-label-sm font-label-sm text-secondary dark:text-secondary-fixed uppercase tracking-widest">
                Carousel Instagram
              </span>
              <Heart className="text-secondary-container dark:text-outline-variant cursor-pointer hover:fill-secondary" size={18} />
            </div>
            <h4 className="text-lg font-bold text-primary dark:text-inverse-primary mb-3">"Hậu trường Thiết kế"</h4>
            <p className="text-body-md text-on-surface-variant flex-1 mb-6">
              Một bài viết giáo dục gồm 5 trang chi tiết về nguồn cung ứng bền vững của chất liệu bộ sưu tập mùa xuân.
            </p>
            <div className="flex flex-wrap gap-2 mt-auto">
              <span className="bg-surface-container dark:bg-surface-variant/40 px-3 py-1 rounded-md text-xs text-on-surface-variant dark:text-inverse-on-surface">
                Giáo dục
              </span>
              <span className="bg-surface-container dark:bg-surface-variant/40 px-3 py-1 rounded-md text-xs text-on-surface-variant dark:text-inverse-on-surface">
                Giá trị Thương hiệu
              </span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-8 shadow-[0_4px_24px_rgba(255,143,163,0.08)] hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(255,143,163,0.12)] transition-all duration-300 flex flex-col h-full border border-transparent hover:border-secondary-container/50">
            <div className="flex justify-between items-start mb-6">
              <span className="text-label-sm font-label-sm text-secondary dark:text-secondary-fixed uppercase tracking-widest">
                Bản tin Email
              </span>
              <Mail className="text-secondary-container dark:text-outline-variant" size={18} />
            </div>
            <h4 className="text-lg font-bold text-primary dark:text-inverse-primary mb-3">Quyền truy cập sớm VIP</h4>
            <p className="text-body-md text-on-surface-variant flex-1 mb-6">
              Thông báo mở cổng mua sắm sớm 24 giờ độc quyền dành cho những người đăng ký email hiện tại.
            </p>
            <div className="flex flex-wrap gap-2 mt-auto">
              <span className="bg-surface-container dark:bg-surface-variant/40 px-3 py-1 rounded-md text-xs text-on-surface-variant dark:text-inverse-on-surface">
                Chuyển đổi
              </span>
              <span className="bg-surface-container dark:bg-surface-variant/40 px-3 py-1 rounded-md text-xs text-on-surface-variant dark:text-inverse-on-surface">
                Khách hàng thân thiết
              </span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-8 shadow-[0_4px_24px_rgba(255,143,163,0.08)] hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(255,143,163,0.12)] transition-all duration-300 flex flex-col h-full border border-transparent hover:border-secondary-container/50 bg-gradient-to-br from-surface-container-lowest to-secondary-container/10 dark:to-secondary-fixed-dim/5">
            <div className="flex justify-between items-start mb-6">
              <span className="text-label-sm font-label-sm text-secondary dark:text-secondary-fixed uppercase tracking-widest">
                Bài viết Blog
              </span>
              <FileText className="text-secondary-container dark:text-outline-variant" size={18} />
            </div>
            <h4 className="text-lg font-bold text-primary dark:text-inverse-primary mb-3">Hướng dẫn Phối đồ Mùa xuân</h4>
            <p className="text-body-md text-on-surface-variant flex-1 mb-6">
              Nội dung SEO dạng dài giới thiệu 5 cách phối đồ cho các sản phẩm chính của đợt ra mắt mới.
            </p>
            <div className="flex flex-wrap gap-2 mt-auto">
              <span className="bg-surface-container dark:bg-surface-variant/40 px-3 py-1 rounded-md text-xs text-on-surface-variant dark:text-inverse-on-surface">
                SEO
              </span>
              <span className="bg-surface-container dark:bg-surface-variant/40 px-3 py-1 rounded-md text-xs text-on-surface-variant dark:text-inverse-on-surface">
                Nhận diện
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid split: Left Column Checklist, Right Column Scripts + Playbook */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column Checklist (4 span) */}
        <div className="lg:col-span-4 space-y-8">
          <section className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2.5rem] p-8 shadow-[0_4px_24px_rgba(255,143,163,0.06)] border border-surface-variant/30 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-secondary-container/40 dark:bg-secondary-fixed-dim/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary-container/60 dark:bg-secondary-fixed-dim/20 flex items-center justify-center">
                  <ClipboardCheck className="text-on-secondary-container dark:text-secondary-fixed" size={14} />
                </div>
                <h3 className="text-headline-md font-bold text-primary dark:text-inverse-primary text-xl">Danh sách Việc cần làm</h3>
              </div>
              <span className="text-xs font-bold text-secondary dark:text-secondary-fixed bg-secondary-container/50 dark:bg-outline/20 px-2 py-1 rounded">
                Tuần 1
              </span>
            </div>

            <ul className="space-y-4 relative z-10">
              {checklist.map((item) => (
                <li
                  key={item.id}
                  onClick={() => toggleCheck(item.id)}
                  className="group flex items-start gap-4 p-3 -mx-3 rounded-xl hover:bg-surface-container dark:hover:bg-surface-variant/20 transition-colors cursor-pointer"
                >
                  <div
                    className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all relative shrink-0 ${
                      item.checked
                        ? 'border-secondary bg-secondary-container dark:bg-secondary/40'
                        : 'border-outline-variant group-hover:border-secondary bg-surface-container-lowest dark:bg-surface-variant/30'
                    }`}
                  >
                    {item.checked && <Check size={12} className="text-secondary dark:text-white" />}
                  </div>
                  <div>
                    <p
                      className={`text-body-md font-medium transition-all ${
                        item.checked
                          ? 'text-on-surface-variant line-through opacity-70'
                          : 'text-primary dark:text-inverse-primary'
                      }`}
                    >
                      {item.title}
                    </p>
                    <p
                      className={`text-xs mt-1 transition-all ${
                        item.checked ? 'text-outline line-through' : 'text-on-surface-variant'
                      }`}
                    >
                      {item.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Right Column Scripts & Playbook (8 span) */}
        <div className="lg:col-span-8 space-y-12">
          {/* Section: Short Video Scripts */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center">
                <PlayCircle className="text-on-secondary-container" size={16} />
              </div>
              <h3 className="text-headline-md font-bold text-primary dark:text-inverse-primary">Kịch bản Video ngắn</h3>
            </div>

            <div className="space-y-4">
              {/* Script Item 1 */}
              <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-2xl p-6 shadow-sm border border-surface-variant/50 hover:shadow-[0_4px_16px_rgba(255,143,163,0.05)] transition-shadow flex flex-col sm:flex-row gap-6 items-start">
                <div className="w-full sm:w-32 h-24 rounded-xl overflow-hidden shrink-0 relative bg-surface-variant/30 dark:bg-surface-variant/10 flex items-center justify-center">
                  <Video className="text-outline" size={32} />
                  <div className="absolute inset-0 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer flex items-center justify-center">
                    <span className="bg-white/80 dark:bg-surface/80 rounded-full p-1.5 shadow-sm text-primary dark:text-inverse-primary">
                      <Play size={14} fill="currentColor" />
                    </span>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-bold text-primary dark:text-inverse-primary">"Sự phối hợp hoàn hảo" (TikTok)</h4>
                    <span className="text-xs font-bold text-on-surface-variant bg-surface-container dark:bg-outline/20 px-2.5 py-1 rounded">
                      0:15s
                    </span>
                  </div>
                  <p className="text-sm text-on-surface-variant">
                    Một video chuyển cảnh nhịp độ nhanh thể hiện cùng một chiếc áo khoác được phối theo ba cách. Tập trung vào âm thanh thịnh hành sôi động.
                  </p>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        'Sự phối hợp hoàn hảo',
                        'Phân cảnh 1: Chuyển cảnh (0-5s). Cầm sản phẩm, búng tay. Phân cảnh 2: Người mẫu stylist bước vào mặc màu phối A. Phân cảnh 3: Xoay người để đổi sang mặc màu phối B.'
                      )
                    }
                    className="text-label-sm font-label-sm text-secondary hover:text-primary dark:text-secondary-fixed-dim dark:hover:text-primary-fixed flex items-center gap-1.5 transition-colors"
                  >
                    <Copy size={14} />
                    {copiedScript === 'Sự phối hợp hoàn hảo' ? 'Đã sao chép!' : 'Sao chép Kịch bản'}
                  </button>
                </div>
              </div>

              {/* Script Item 2 */}
              <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-2xl p-6 shadow-sm border border-surface-variant/50 hover:shadow-[0_4px_16px_rgba(255,143,163,0.05)] transition-shadow flex flex-col sm:flex-row gap-6 items-start">
                <div className="w-full sm:w-32 h-24 rounded-xl overflow-hidden shrink-0 relative bg-surface-variant/30 dark:bg-surface-variant/10 flex items-center justify-center">
                  <Video className="text-outline" size={32} />
                  <div className="absolute inset-0 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer flex items-center justify-center">
                    <span className="bg-white/80 dark:bg-surface/80 rounded-full p-1.5 shadow-sm text-primary dark:text-inverse-primary">
                      <Play size={14} fill="currentColor" />
                    </span>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-bold text-primary dark:text-inverse-primary">"Đóng gói đơn hàng cùng tôi" (Reels)</h4>
                    <span className="text-xs font-bold text-on-surface-variant bg-surface-container dark:bg-outline/20 px-2.5 py-1 rounded">
                      0:30s
                    </span>
                  </div>
                  <p className="text-sm text-on-surface-variant">
                    Video đóng gói phong cách ASMR nêu bật trải nghiệm đập hộp cao cấp và bao bì thân thiện với môi trường.
                  </p>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        'Đóng gói đơn hàng cùng tôi',
                        'Thiết kế âm thanh: tiếng giấy sột soạt, tiếng nắp hộp trượt. Phân cảnh 1: Đặt sản phẩm vào giấy lót màu hồng. Phân cảnh 2: Dán nhãn botanical để niêm phong. Phân cảnh 3: Đặt thiệp cảm ơn vào.'
                      )
                    }
                    className="text-label-sm font-label-sm text-secondary hover:text-primary dark:text-secondary-fixed-dim dark:hover:text-primary-fixed flex items-center gap-1.5 transition-colors"
                  >
                    <Copy size={14} />
                    {copiedScript === 'Đóng gói đơn hàng cùng tôi' ? 'Đã sao chép!' : 'Sao chép Kịch bản'}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Marketing Playbook (Rich Text) */}
          <section className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2.5rem] p-8 md:p-12 shadow-[0_4px_24px_rgba(255,143,163,0.08)] space-y-8">
            <div className="flex items-center gap-4 border-b border-surface-variant/50 pb-6">
              <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-md">
                <BookOpen size={18} />
              </div>
              <div>
                <h3 className="text-headline-md font-bold text-primary dark:text-inverse-primary">Cẩm nang Tiếp thị</h3>
                <p className="text-sm text-on-surface-variant mt-1">Tổng quan chiến lược và các trụ cột thông điệp cốt lõi.</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <h4 className="font-bold text-primary dark:text-inverse-primary text-lg">Mục tiêu Cốt lõi</h4>
                <p className="text-on-surface-variant text-body-md leading-relaxed">
                  Thúc đẩy doanh số bán hàng trực tuyến tăng 25% trong hai tuần đầu tiên ra mắt Bộ sưu tập Mùa xuân bằng cách tận dụng tính khan hiếm, quyền truy cập độc quyền và nội dung giáo dục chất lượng cao trên các kênh truyền thông xã hội.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-primary dark:text-inverse-primary text-lg">Chân dung Khách hàng Mục tiêu</h4>
                <p className="text-on-surface-variant text-body-md leading-relaxed">
                  <strong>"Thế hệ Millennial thông thái"</strong> - Độ tuổi 25-35. Đánh giá cao tính bền vững, chất lượng hơn số lượng, và tính thẩm mỹ. Hoạt động chủ yếu trên Instagram và TikTok. Thích nghe kể chuyện thương hiệu chân thực và minh bạch.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-primary dark:text-inverse-primary text-lg">Các Trụ cột Thông điệp Chính</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-surface-container dark:bg-surface-variant/20 p-5 rounded-xl border border-surface-variant/50 border-l-4 border-l-secondary">
                    <strong className="block text-primary dark:text-inverse-primary mb-1">1. Chất lượng Bền vững</strong>
                    <span className="text-sm text-on-surface-variant">Tập trung vào vật liệu bền đẹp lâu dài và phương pháp sản xuất nhân văn.</span>
                  </div>
                  <div className="bg-surface-container dark:bg-surface-variant/20 p-5 rounded-xl border border-surface-variant/50 border-l-4 border-l-secondary">
                    <strong className="block text-primary dark:text-inverse-primary mb-1">2. Tính Linh hoạt Dễ dàng</strong>
                    <span className="text-sm text-on-surface-variant">Nêu bật cách các sản phẩm dễ dàng phối đồ với nhau để mặc hàng ngày.</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-primary dark:text-inverse-primary text-lg font-headline-md font-bold">Các Điểm nổi bật trong Tiến độ Ra mắt</h4>
                <ul className="list-disc pl-5 space-y-2 text-on-surface-variant text-body-md">
                  <li><strong>Tuần -1 (Tạo tò mò):</strong> Hé lộ hình ảnh làm mờ, đếm ngược trên story, chiến dịch xây dựng danh sách email.</li>
                  <li><strong>Tuần 0 (Ra mắt chính thức):</strong> Email quyền truy cập sớm cho VIP, video ra mắt đầu tư chỉn chu, unbox từ người ảnh hưởng.</li>
                  <li><strong>Tuần 1 (Duy trì):</strong> Chia sẻ nội dung do người dùng tự tạo (UGC), phân tích sâu vào từng sản phẩm cụ thể.</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
