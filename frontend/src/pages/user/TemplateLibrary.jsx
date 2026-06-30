import { useState } from 'react';
import { Quote } from 'lucide-react';

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
    desc: 'Tạo sự hào hứng cho bất động sản sắp ra mắt với đồ họa hé lộ thanh lịch, độ tương phản cao.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAeoWLiQc2cI1pe1WQ522C78g06SGiMA4gncjyn5IAT7Lo-XW3Yg8GXK0bVIdCOjyBr-nE19UDBmWsR_LULyyO9QKCwkJ2aas1fxE3_CVWRwMLsMeiWBKuUdzwd5M-MKF1Oo2cSGNlXqVWkdC7q6nthTjQlU2j99D-3JE-C6PwjTBymq0S4_kUKaYu3VkPHeMkmZoLuaC8HNu31JdvsFJeXc_p0Mph9aosJJBaFt_khY9y2SaGh0FhnofaNFZ7bYtl2m2Z9WpNsxdY',
  },
  {
    id: 2,
    title: 'Banner Cập nhật Thị trường',
    category: 'Promotion',
    desc: 'Chia sẻ thông tin chuyên sâu về thị trường địa phương một cách chuyên nghiệp với mẫu banner gọn gàng, có cấu trúc này.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBORr4w69xkSB-v5sh27zZ9D6ByL2j-6Bs7cUyqQI3xwmLtCRVc42_OUQ1pU3KK3Or-6EiMeC8FTQmteQkFomqPFkKBltehjrqvLnCJytve_otfKnIACSpHaEq0-btZMBGR6z9JyvX_1CJhkQLL-8a-UWgiiE3v6NerhBfaMyDqk60vF1KQT5xlRjMUW2EOzLnnUex8Q_o8pA0GYYufT2Jic2QLHCVVnV3-8GzqUIRdv0R81I2lLAiGerzDWXEBenajV4WPzz3rVHY',
  },
  {
    id: 3,
    title: 'Kịch bản Tiếp cận Mùa xuân',
    category: 'Script',
    desc: 'Kịch bản trò chuyện ấm áp, không gây áp lực, hoàn hảo để kết nối lại với các khách hàng cũ.',
    isQuote: true,
    quoteText: '"Chào [Tên], bạn có nghĩ đến việc chuyển nhà vào mùa xuân này không? Hãy trò chuyện nhé..."',
  },
  {
    id: 4,
    title: 'Lời chúc Kỳ nghỉ cho Khách hàng',
    category: 'Seasonal',
    desc: 'Gửi những lời chúc kỳ nghỉ trang nhã, phù hợp với thương hiệu mà không bị rập khuôn hay lộn xộn.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCL-sfmMKoNvPth1CUrLdVasStaAEAcwxSQ3u_YhNEzlNaYd200xa9TO5XwXj2BtDF2S1BOeTMWO9etbmFEClhP9afAE0Hmo_DhI32qfY0Gtt8XkQaN2qa4waRT14XLXiSiBr-2KyJfe_9_yZ1UgsbCe4TIw0pZ-gm0eG3u2ZVREs4RWhiunCWfT2mkONrEBKPfZryBUI0XFtqdJ1SCiTGlw4IMCo93zfEYdNchL9zF6W4sLMhF0HL0k2_1k3vzRAaQJO5gGBrAQ2E',
  },
];

const CATEGORY_MAP = {
  Social: 'Bài đăng MXH',
  Promotion: 'Khuyến mãi',
  Seasonal: 'Theo mùa',
  Script: 'Kịch bản',
};

export default function TemplateLibrary() {
  const [activeTab, setActiveTab] = useState('all');

  const filteredTemplates = TEMPLATES.filter((tmpl) => {
    if (activeTab === 'all') return true;
    return tmpl.category === activeTab;
  });

  return (
    <div className="flex-1 w-full space-y-8">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-display-lg-mobile md:text-display-lg font-display-lg-mobile md:font-display-lg text-primary mb-2">
            Thư viện Mẫu
          </h2>
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
                  ? 'bg-secondary-container text-on-secondary-container'
                  : 'bg-surface-container-lowest text-on-surface-variant hover:bg-secondary-container/30'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
        {filteredTemplates.map((tmpl) => (
          <article
            key={tmpl.id}
            className="bg-surface-container-lowest rounded-xl p-4 shadow-ambient hover:-translate-y-1 transition-transform duration-300 flex flex-col group border border-surface-container/20"
          >
            {/* Visual Preview */}
            <div className="w-full aspect-[4/3] rounded-lg overflow-hidden mb-4 relative bg-surface-container flex items-center justify-center">
              {tmpl.isQuote ? (
                <>
                  <div className="absolute inset-0 bg-gradient-to-br from-secondary-container/40 to-surface-container-lowest" />
                  <div className="relative z-10 flex flex-col items-center p-6 text-center">
                    <Quote className="text-secondary mb-3 shrink-0" size={36} />
                    <p className="text-body-md font-body-md text-primary italic line-clamp-3">
                      {tmpl.quoteText}
                    </p>
                  </div>
                </>
              ) : (
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  alt={tmpl.title}
                  src={tmpl.image}
                />
              )}
              {/* Category Badge */}
              <div className="absolute top-3 left-3 bg-surface-container-lowest/90 backdrop-blur-sm px-3 py-1 rounded-full text-[11px] font-label-sm text-primary uppercase tracking-wider">
                {CATEGORY_MAP[tmpl.category] || tmpl.category}
              </div>
            </div>

            {/* Info details */}
            <div className="flex flex-col flex-1">
              <h3 className="text-headline-md font-headline-md text-primary mb-1 text-[20px]">
                {tmpl.title}
              </h3>
              <p className="text-body-md font-body-md text-on-surface-variant mb-6 line-clamp-2 text-[14px]">
                {tmpl.desc}
              </p>
              <div className="mt-auto flex gap-3 pt-2">
                <button className="flex-1 bg-surface-container-low text-primary py-2.5 rounded-full text-label-sm font-label-sm hover:bg-secondary-container/50 transition-colors">
                  Xem trước
                </button>
                <button className="flex-1 bg-primary text-on-primary py-2.5 rounded-full text-label-sm font-label-sm hover:opacity-90 transition-opacity">
                  Dùng Mẫu này
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
