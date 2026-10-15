import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Quote, X, Copy, ArrowRight, Check, Sparkles, Eye } from 'lucide-react';
import { toast } from '../../store/toastStore';

const TABS = [
  { id: 'all', label: 'Tất cả Mẫu' },
  { id: 'Social', label: 'Bài đăng MXH' },
  { id: 'Promotion', label: 'Khuyến mãi' },
  { id: 'Seasonal', label: 'Theo mùa' },
  { id: 'Script', label: 'Kịch bản Video' },
];

const TEMPLATES = [
  {
    id: 1,
    title: 'Hé lộ Danh sách Mới',
    category: 'Social',
    platform: 'Facebook',
    desc: 'Tạo sự hào hứng cho sản phẩm hoặc dịch vụ sắp ra mắt với đồ họa hé lộ thanh lịch, độ tương phản cao.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAeoWLiQc2cI1pe1WQ522C78g06SGiMA4gncjyn5IAT7Lo-XW3Yg8GXK0bVIdCOjyBr-nE19UDBmWsR_LULyyO9QKCwkJ2aas1fxE3_CVWRwMLsMeiWBKuUdzwd5M-MKF1Oo2cSGNlXqVWkdC7q6nthTjQlU2j99D-3JE-C6PwjTBymq0S4_kUKaYu3VkPHeMkmZoLuaC8HNu31JdvsFJeXc_p0Mph9aosJJBaFt_khY9y2SaGh0FhnofaNFZ7bYtl2m2Z9WpNsxdY',
    sampleContent: `✨ ĐIỀU ĐẶC BIỆT GÌ SẮP XUẤT HIỆN? ✨\n\nSau nhiều tháng ấp ủ và hoàn thiện từng chi tiết nhỏ nhất, chúng mình sắp chính thức công bố bộ sưu tập mới dành riêng cho bạn.\n\n🔍 Bạn đoán xem điều bất ngờ này là gì?\n👇 Hãy để lại dự đoán dưới phần bình luận, 3 bạn đoán đúng sớm nhất sẽ nhận ngay voucher ưu đãi 30% vào ngày mở bán!\n\n#ComingSoon #NewRelease #PocketAgencom #BoSuuTapMoi`,
  },
  {
    id: 2,
    title: 'Banner Cập nhật Thị trường',
    category: 'Promotion',
    platform: 'Facebook',
    desc: 'Chia sẻ thông tin chuyên sâu về thị trường địa phương một cách chuyên nghiệp với mẫu banner gọn gàng, có cấu trúc này.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBORr4w69xkSB-v5sh27zZ9D6ByL2j-6Bs7cUyqQI3xwmLtCRVc42_OUQ1pU3KK3Or-6EiMeC8FTQmteQkFomqPFkKBltehjrqvLnCJytve_otfKnIACSpHaEq0-btZMBGR6z9JyvX_1CJhkQLL-8a-UWgiiE3v6NerhBfaMyDqk60vF1KQT5xlRjMUW2EOzLnnUex8Q_o8pA0GYYufT2Jic2QLHCVVnV3-8GzqUIRdv0R81I2lLAiGerzDWXEBenajV4WPzz3rVHY',
    sampleContent: `📊 BÁO CÁO THỊ TRƯỜNG & XU HƯỚNG MỚI NHẤT 📊\n\nBạn đã nắm bắt những dịch chuyển quan trọng nhất trong quý này chưa?\n\n🔹 Điểm nhấn 1: Nhu cầu tiêu dùng chuyển hướng sang trải nghiệm cá nhân hóa.\n🔹 Điểm nhấn 2: Tối ưu chi phí vận hành với các công cụ tự động hóa thông minh.\n🔹 Lời khuyên: Đừng chờ đợi xu hướng qua đi, hãy chủ động đón đầu!\n\n💬 Nhắn tin cho chúng tôi ngay hôm nay để nhận tài liệu phân tích chi tiết.\n\n#MarketUpdate #KinhDoanhThongMinh #PocketAgencom #BaoCaoThiTruong`,
  },
  {
    id: 3,
    title: 'Kịch bản Tiếp cận Khách hàng Cũ',
    category: 'Script',
    platform: 'TikTok',
    desc: 'Kịch bản trò chuyện ấm áp, tự nhiên, không gây áp lực, hoàn hảo để kích hoạt lại các khách hàng cũ.',
    isQuote: true,
    quoteText: '"Chào bạn, lâu rồi chúng mình chưa có dịp trò chuyện! Mùa này thương hiệu vừa ra mắt một trải nghiệm mới toanh..."',
    sampleContent: `🎬 [HOOK - 3 GIÂY ĐẦU]:\n"Nếu bạn từng tin tưởng sử dụng dịch vụ của chúng mình năm ngoái, đây là thông điệp tri ân đặc biệt chỉ dành riêng cho bạn!"\n\n🎯 [NỘI DUNG CHÍNH - 15 GIÂY]:\n"Cảm ơn bạn đã luôn đồng hành. Mùa này, chúng mình vừa nâng cấp hoàn toàn hệ sinh thái và muốn dành tặng bạn đặc quyền ưu tiên trải nghiệm đầu tiên mà không mất thêm chi phí."\n\n🚀 [KÊU GỌI HÀNH ĐỘNG - CTA]:\n"Bấm vào link bio hoặc nhắn tin chữ 'TRI AN' để nhận mã kích hoạt ngay nhé!"\n\n#ChamSocKhachHang #ReEngagement #TikTokMarketing #PocketAgencom`,
  },
  {
    id: 4,
    title: 'Lời chúc Kỳ nghỉ & Tri ân',
    category: 'Seasonal',
    platform: 'Facebook',
    desc: 'Gửi những lời chúc kỳ nghỉ trang nhã, phù hợp với thương hiệu mà không bị rập khuôn hay lộn xộn.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCL-sfmMKoNvPth1CUrLdVasStaAEAcwxSQ3u_YhNEzlNaYd200xa9TO5XwXj2BtDF2S1BOeTMWO9etbmFEClhP9afAE0Hmo_DhI32qfY0Gtt8XkQaN2qa4waRT14XLXiSiBr-2KyJfe_9_yZ1UgsbCe4TIw0pZ-gm0eG3u2ZVREs4RWhiunCWfT2mkONrEBKPfZryBUI0XFtqdJ1SCiTGlw4IMCo93zfEYdNchL9zF6W4sLMhF0HL0k2_1k3vzRAaQJO5gGBrAQ2E',
    sampleContent: `🌿 GỬI GẮM NHỮNG LỜI CHÚC AN LÀNH VÀ HÂN HOAN NHẤT 🌿\n\nKhép lại một chặng đường đầy nỗ lực, cảm ơn quý khách hàng và đối tác đã luôn gửi gắm niềm tin yêu nơi chúng tôi.\n\nChúc bạn và gia đình một mùa kỳ nghỉ ấm áp, trọn vẹn yêu thương và sẵn sàng cho những khởi đầu bứt phá mới phía trước!\n\nTrân trọng,\nĐội ngũ Pocket Agencom.\n\n#HappyHolidays #LoiChucTriAn #PocketAgencom #KetNoiThuongHieu`,
  },
  {
    id: 5,
    title: 'Flash Sale Giờ Vàng Đột Phá',
    category: 'Promotion',
    platform: 'Facebook',
    desc: 'Mẫu thông báo giảm giá chớp nhoáng tạo cảm giác cấp bách, kích thích tỷ lệ chuyển đổi tức thì.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAeoWLiQc2cI1pe1WQ522C78g06SGiMA4gncjyn5IAT7Lo-XW3Yg8GXK0bVIdCOjyBr-nE19UDBmWsR_LULyyO9QKCwkJ2aas1fxE3_CVWRwMLsMeiWBKuUdzwd5M-MKF1Oo2cSGNlXqVWkdC7q6nthTjQlU2j99D-3JE-C6PwjTBymq0S4_kUKaYu3VkPHeMkmZoLuaC8HNu31JdvsFJeXc_p0Mph9aosJJBaFt_khY9y2SaGh0FhnofaNFZ7bYtl2m2Z9WpNsxdY',
    sampleContent: `⚡ FLASH SALE GIỜ VÀNG - CHỈ TRONG 3 TIẾNG DUY NHẤT ⚡\n\n⏰ Từ 19h00 đến 22h00 tối nay!\n💥 GIẢM TRỰC TIẾP LÊN ĐẾN 40% cho tất cả các sản phẩm bán chạy nhất.\n\n⚠️ Số lượng có hạn - Deal sẽ tự động kết thúc ngay khi hết hàng.\n👉 Đặt mua ngay tại: [Đường dẫn của bạn]\n\n#FlashSale #GioVang #UuDaiDocQuyen #PocketAgencom`,
  },
  {
    id: 6,
    title: 'Kịch bản Video Kể Chuyện Thương Hiệu (Storytelling)',
    category: 'Script',
    platform: 'TikTok',
    desc: 'Kịch bản dạng chia sẻ hậu trường chân thật, xây dựng niềm tin sâu sắc với tệp khách hàng tiềm năng.',
    isQuote: true,
    quoteText: '"Nhiều người hỏi mình tại sao lại bắt đầu dự án này khi thị trường đã có quá nhiều đối thủ..."',
    sampleContent: `🎬 [HOOK - 3 GIÂY ĐẦU]:\n"3 sai lầm lớn nhất mình ước gì có người nói cho mình trước khi bắt đầu kinh doanh..."\n\n🎯 [CÂU CHUYỆN - 20 GIÂY]:\n"Ngày đầu mở tiệm, mình nghĩ chỉ cần sản phẩm tốt là khách tự tìm đến. Nhưng thực tế là không ai biết mình là ai nếu không có một thông điệp rõ ràng. Từ đó, mình thay đổi hoàn toàn cách tiếp cận..."\n\n🚀 [BÀI HỌC & CTA]:\n"Nếu bạn cũng đang loay hoay tìm hướng đi cho thương hiệu, follow kênh ngay để học thêm nhiều bài học thực chiến nhé!"\n\n#KinhDoanhThucChien #Storytelling #TikTokCreator #PocketAgencom`,
  },
];

const CATEGORY_MAP = {
  Social: 'Bài đăng MXH',
  Promotion: 'Khuyến mãi',
  Seasonal: 'Theo mùa',
  Script: 'Kịch bản',
};

export default function TemplateLibrary() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [copied, setCopied] = useState(false);
  const previewOpenerRef = useRef(null);
  const dialogRef = useRef(null);

  const filteredTemplates = TEMPLATES.filter((tmpl) => {
    if (activeTab === 'all') return true;
    return tmpl.category === activeTab;
  });

  const handleUseTemplate = (tmpl) => {
    navigate('/user/quick-editor', {
      state: {
        template: tmpl,
        initialContent: tmpl.sampleContent,
        platform: tmpl.platform || 'Facebook',
      },
    });
  };

  const openPreview = (template, event) => {
    previewOpenerRef.current = event.currentTarget;
    setPreviewTemplate(template);
  };

  useEffect(() => {
    if (!previewTemplate) {
      previewOpenerRef.current?.focus();
      return undefined;
    }

    const dialog = dialogRef.current;
    const getFocusable = () => [...dialog.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )].filter((element) => element.getClientRects().length > 0);

    getFocusable()[0]?.focus();
    const handleDialogKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setPreviewTemplate(null);
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
  }, [previewTemplate]);

  const handleCopyContent = async (text) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Đã sao chép nội dung mẫu vào bộ nhớ tạm!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Không thể sao chép nội dung mẫu. Vui lòng cấp quyền clipboard.');
    }
  };

  return (
    <div className="flex-1 w-full space-y-8">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-display-lg-mobile md:text-display-lg font-display-lg-mobile md:font-display-lg text-primary dark:text-inverse-primary mb-2">
            Thư viện Mẫu
          </h1>
          <p className="text-body-lg font-body-lg text-on-surface-variant max-w-2xl">
            Duyệt qua bộ sưu tập các mẫu thiết kế chuyển đổi cao được tuyển chọn đặc biệt để phát triển doanh nghiệp một cách dễ dàng.
          </p>
        </div>
        {/* Filter Tabs */}
        <div className="flex overflow-x-auto pb-2 md:pb-0 gap-2 scrollbar-none">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-6 py-2.5 rounded-full text-label-sm font-label-sm transition-all duration-200 shadow-sm ${
                activeTab === tab.id
                  ? 'bg-secondary-container text-on-secondary-container font-semibold'
                  : 'bg-surface-container-lowest dark:bg-tertiary-container text-on-surface-variant hover:bg-secondary-container/30'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Starter Templates Advisory Banner */}
      <div className="p-4 rounded-2xl bg-surface-container-low dark:bg-surface-variant/20 border border-surface-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-on-surface-variant">
        <div className="flex items-center gap-2.5">
          <span className="font-bold text-secondary px-2.5 py-0.5 rounded-full bg-secondary-container text-[11px] shrink-0 border border-secondary/20">
            Mẫu dựng sẵn
          </span>
          <span>
            Mẫu khởi đầu có sẵn trong ứng dụng; nội dung bạn chỉnh sửa chỉ được lưu khi tạo bản nháp trong Quick Editor.
          </span>
        </div>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((tmpl) => (
          <article
            key={tmpl.id}
            className="bg-surface-container-lowest dark:bg-tertiary-container rounded-2xl p-5 shadow-ambient hover:-translate-y-1 transition-all duration-300 flex flex-col group border border-surface-container/20"
          >
            {/* Visual Preview */}
            <div className="w-full aspect-[4/3] rounded-xl overflow-hidden mb-4 relative bg-surface-container flex items-center justify-center">
              {tmpl.isQuote ? (
                <>
                  <div className="absolute inset-0 bg-gradient-to-br from-secondary-container/40 to-surface-container-lowest" />
                  <div className="relative z-10 flex flex-col items-center p-6 text-center">
                    <Quote className="text-secondary mb-3 shrink-0" size={36} />
                    <p className="text-body-md font-body-md text-primary dark:text-inverse-primary italic line-clamp-3">
                      {tmpl.quoteText}
                    </p>
                  </div>
                </>
              ) : (
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  alt={tmpl.title}
                  src={tmpl.image}
                  loading="lazy"
                />
              )}
              {/* Category Badge */}
              <div className="absolute top-3 left-3 bg-surface-container-lowest/90 dark:bg-surface-container/90 backdrop-blur-sm px-3 py-1 rounded-full text-[11px] font-label-sm text-primary dark:text-inverse-primary uppercase tracking-wider font-semibold shadow-sm">
                {CATEGORY_MAP[tmpl.category] || tmpl.category}
              </div>
            </div>

            {/* Info details */}
            <div className="flex flex-col flex-1">
              <h3 className="text-headline-md font-bold text-primary dark:text-inverse-primary mb-1 text-[18px]">
                {tmpl.title}
              </h3>
              <p className="text-body-md text-on-surface-variant mb-6 line-clamp-2 text-[14px]">
                {tmpl.desc}
              </p>
              <div className="mt-auto flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={(event) => openPreview(tmpl, event)}
                  className="flex-1 bg-surface-container-low dark:bg-surface-variant/30 text-primary dark:text-inverse-primary py-2.5 rounded-full text-label-sm font-semibold hover:bg-secondary-container/50 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Eye size={15} />
                  Xem trước
                </button>
                <button
                  type="button"
                  onClick={() => handleUseTemplate(tmpl)}
                  className="flex-1 bg-primary text-on-primary py-2.5 rounded-full text-label-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Sparkles size={15} />
                  Dùng Mẫu này
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Template Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm animate-fade-in">
          <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="template-preview-title" className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-surface-variant bg-white p-5 sm:p-7 shadow-ambient text-primary">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 mb-6 border-b border-surface-variant/30 pb-4">
              <div>
                <span className="inline-block bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                  {CATEGORY_MAP[previewTemplate.category] || previewTemplate.category} • {previewTemplate.platform || 'Đa kênh'}
                </span>
                <h3 id="template-preview-title" className="text-xl sm:text-2xl font-bold text-primary">
                  {previewTemplate.title}
                </h3>
                <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
                  {previewTemplate.desc}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container-high transition-colors"
                aria-label="Đóng"
              >
                <X size={20} />
              </button>
            </div>

            {/* Visual or Quote Preview */}
            <div className="mb-6 rounded-2xl overflow-hidden bg-surface-container-low dark:bg-surface-variant/20 border border-surface-variant/30 flex items-center justify-center max-h-64">
              {previewTemplate.isQuote ? (
                <div className="p-8 text-center">
                  <Quote className="text-secondary mx-auto mb-2 opacity-80" size={32} />
                  <p className="text-base italic font-medium text-primary dark:text-inverse-primary">
                    {previewTemplate.quoteText}
                  </p>
                </div>
              ) : (
                <img
                  src={previewTemplate.image}
                  alt={previewTemplate.title}
                  className="w-full h-full object-cover max-h-64"
                />
              )}
            </div>

            {/* Sample Content Box */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Nội dung Mẫu Gợi ý
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyContent(previewTemplate.sampleContent)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary hover:underline"
                >
                  {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  <span>{copied ? 'Đã chép' : 'Sao chép văn bản'}</span>
                </button>
              </div>
              <div className="bg-surface-container-low dark:bg-surface-variant/30 p-4 rounded-2xl text-xs sm:text-sm whitespace-pre-wrap leading-relaxed border border-surface-variant/20 font-sans">
                {previewTemplate.sampleContent}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-surface-variant/30">
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                className="w-full sm:w-auto rounded-full px-6 py-2.5 text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => handleUseTemplate(previewTemplate)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-primary text-on-primary px-6 py-2.5 text-xs font-bold shadow-sm hover:opacity-90 transition-opacity"
              >
                <Sparkles size={14} />
                Dùng Mẫu này trong Quick Editor
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
