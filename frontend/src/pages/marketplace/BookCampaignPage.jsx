import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Upload, CheckCircle2 } from 'lucide-react';
import { CREATORS_DATA } from './mockData';
import CampaignBookingCard from '../../components/marketplace/CampaignBookingCard';

export default function BookCampaignPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const creator = useMemo(() => {
    return CREATORS_DATA.find((c) => c.id === id) || CREATORS_DATA[0];
  }, [id]);

  // Form states
  const [campaignName, setCampaignName] = useState('');
  const [campaignGoal, setCampaignGoal] = useState('Brand Awareness');
  const [productName, setProductName] = useState('');
  const [productCategory, setProductCategory] = useState('Beauty & Skincare');
  const [productDesc, setProductDesc] = useState('');
  const [targetCustomer, setTargetCustomer] = useState('');
  const [platform, setPlatform] = useState('tiktok');
  const [targetDate, setTargetDate] = useState('');
  const [dosDonts, setDosDonts] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [referenceLinks, setReferenceLinks] = useState('');
  const [budget, setBudget] = useState(creator.startingPrice || 200);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!campaignName || !productName) {
      alert('Vui lòng điền đầy đủ các trường bắt buộc có dấu *');
      return;
    }

    setIsSubmitting(true);
    // Mock API submission
    setTimeout(() => {
      setIsSubmitting(false);
      navigate('/bookings/confirmation');
    }, 1500);
  };

  return (
    <div className="space-y-8">
      {/* Title / Back */}
      <div className="flex items-center gap-4">
        <Link
          to={`/marketplace/kol/${creator.id}`}
          className="p-2 bg-surface-container-low hover:bg-surface-container-high rounded-full text-on-surface transition-colors inline-flex"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-display-lg-mobile md:text-display-lg font-bold text-primary dark:text-inverse-primary leading-tight">
            Đặt lịch Chiến dịch
          </h1>
          <p className="text-on-surface-variant font-body-md text-sm mt-1">
            Hoàn tất các chi tiết cho chiến dịch hợp tác của bạn với {creator.name}.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Left: Main Form Column */}
        <form onSubmit={handleSubmit} className="lg:col-span-8 space-y-8">
          
          {/* Section 1: Campaign Overview */}
          <section className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-8 shadow-[4px_24px_40px_rgba(255,143,163,0.08)] border border-surface-variant/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-fixed opacity-50 rounded-bl-full -z-10 blur-2xl"></div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h2 className="font-headline-md text-base text-primary dark:text-inverse-primary font-bold">Tổng quan Chiến dịch</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block font-label-sm text-xs text-on-surface mb-2 font-semibold" htmlFor="campaign-name">
                  Tên Chiến dịch <span className="text-error">*</span>
                </label>
                <input
                  className="w-full bg-surface-container dark:bg-surface-variant/20 border-none rounded-xl px-4 py-3 text-body-md focus:ring-2 focus:ring-secondary focus:bg-surface-container-lowest transition-all text-primary dark:text-inverse-primary"
                  id="campaign-name"
                  type="text"
                  placeholder="Ví dụ: Ra mắt Sản phẩm Mùa hè 2026"
                  required
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                />
              </div>

              <div>
                <label className="block font-label-sm text-xs text-on-surface mb-2 font-semibold" htmlFor="campaign-goal">
                  Mục tiêu Chính
                </label>
                <select
                  className="w-full bg-surface-container dark:bg-surface-variant/20 border-none rounded-xl px-4 py-3 text-body-md focus:ring-2 focus:ring-secondary focus:bg-surface-container-lowest transition-all text-primary dark:text-inverse-primary cursor-pointer"
                  id="campaign-goal"
                  value={campaignGoal}
                  onChange={(e) => setCampaignGoal(e.target.value)}
                >
                  <option value="Brand Awareness">Nhận diện Thương hiệu</option>
                  <option value="Lead Generation">Thu hút Khách hàng Tiềm năng</option>
                  <option value="Sales Conversion">Chuyển đổi Doanh số</option>
                  <option value="Product Launch">Ra mắt Sản phẩm</option>
                </select>
              </div>
            </div>
          </section>

          {/* Section 2: Product Info */}
          <section className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-8 shadow-[4px_24px_40px_rgba(255,143,163,0.08)] border border-surface-variant/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h2 className="font-headline-md text-base text-primary dark:text-inverse-primary font-bold">Thông tin Sản phẩm</h2>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-label-sm text-xs text-on-surface mb-2 font-semibold" htmlFor="product-name">
                    Tên Sản phẩm <span className="text-error">*</span>
                  </label>
                  <input
                    className="w-full bg-surface-container dark:bg-surface-variant/20 border-none rounded-xl px-4 py-3 text-body-md focus:ring-2 focus:ring-secondary focus:bg-surface-container-lowest transition-all text-primary dark:text-inverse-primary"
                    id="product-name"
                    type="text"
                    required
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-label-sm text-xs text-on-surface mb-2 font-semibold" htmlFor="product-category">
                    Danh mục
                  </label>
                  <select
                    className="w-full bg-surface-container dark:bg-surface-variant/20 border-none rounded-xl px-4 py-3 text-body-md focus:ring-2 focus:ring-secondary focus:bg-surface-container-lowest transition-all text-primary dark:text-inverse-primary cursor-pointer"
                    id="product-category"
                    value={productCategory}
                    onChange={(e) => setProductCategory(e.target.value)}
                  >
                    <option value="Beauty & Skincare">Làm đẹp &amp; Chăm sóc da</option>
                    <option value="Fashion & Apparel">Thời trang &amp; May mặc</option>
                    <option value="Home & Lifestyle">Nhà cửa &amp; Đời sống</option>
                    <option value="Technology">Công nghệ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-label-sm text-xs text-on-surface mb-2 font-semibold" htmlFor="product-desc">
                  Mô tả Sản phẩm
                </label>
                <textarea
                  className="w-full bg-surface-container dark:bg-surface-variant/20 border-none rounded-xl px-4 py-3 text-body-md focus:ring-2 focus:ring-secondary focus:bg-surface-container-lowest transition-all resize-none text-primary dark:text-inverse-primary"
                  id="product-desc"
                  rows="3"
                  placeholder="Mô tả ngắn gọn các lợi ích và tính năng chính..."
                  value={productDesc}
                  onChange={(e) => setProductDesc(e.target.value)}
                ></textarea>
              </div>

              <div>
                <label className="block font-label-sm text-xs text-on-surface mb-2 font-semibold" htmlFor="target-customer">
                  Khách hàng Mục tiêu
                </label>
                <input
                  className="w-full bg-surface-container dark:bg-surface-variant/20 border-none rounded-xl px-4 py-3 text-body-md focus:ring-2 focus:ring-secondary focus:bg-surface-container-lowest transition-all text-primary dark:text-inverse-primary"
                  id="target-customer"
                  type="text"
                  placeholder="Ví dụ: Đối tượng Gen Z và Millennial quan tâm đến chăm sóc da"
                  value={targetCustomer}
                  onChange={(e) => setTargetCustomer(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Section 3: Content Requirements */}
          <section className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-8 shadow-[4px_24px_40px_rgba(255,143,163,0.08)] border border-surface-variant/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h2 className="font-headline-md text-base text-primary dark:text-inverse-primary font-bold">Yêu cầu Nội dung</h2>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-label-sm text-xs text-on-surface mb-2 font-semibold">Nền tảng</label>
                  <div className="flex items-center gap-4">
                    <label className="flex-1 relative cursor-pointer group">
                      <input
                        type="radio"
                        checked={platform === 'tiktok'}
                        onChange={() => setPlatform('tiktok')}
                        className="sr-only peer"
                      />
                      <div className="w-full p-4 rounded-xl border-2 border-surface-container bg-surface-container-low dark:border-surface-variant/30 dark:bg-surface-variant/15 peer-checked:border-secondary peer-checked:bg-secondary-container/20 text-center transition-all flex flex-col items-center gap-2">
                        <span className="font-bold text-sm text-on-surface">TikTok</span>
                      </div>
                    </label>
                    <label className="flex-1 relative cursor-pointer group">
                      <input
                        type="radio"
                        checked={platform === 'instagram'}
                        onChange={() => setPlatform('instagram')}
                        className="sr-only peer"
                      />
                      <div className="w-full p-4 rounded-xl border-2 border-surface-container bg-surface-container-low dark:border-surface-variant/30 dark:bg-surface-variant/15 peer-checked:border-secondary peer-checked:bg-secondary-container/20 text-center transition-all flex flex-col items-center gap-2">
                        <span className="font-bold text-sm text-on-surface">Instagram</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block font-label-sm text-xs text-on-surface mb-2 font-semibold" htmlFor="campaign-date">
                    Ngày Lên sóng Mục tiêu
                  </label>
                  <input
                    className="w-full bg-surface-container dark:bg-surface-variant/20 border-none rounded-xl px-4 py-3 text-body-md focus:ring-2 focus:ring-secondary focus:bg-surface-container-lowest transition-all text-primary dark:text-inverse-primary"
                    id="campaign-date"
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block font-label-sm text-xs text-on-surface mb-2 font-semibold" htmlFor="dos-donts">
                  Nên và Không nên làm
                </label>
                <textarea
                  className="w-full bg-surface-container dark:bg-surface-variant/20 border-none rounded-xl px-4 py-3 text-body-md focus:ring-2 focus:ring-secondary focus:bg-surface-container-lowest transition-all resize-none text-primary dark:text-inverse-primary"
                  id="dos-donts"
                  rows="4"
                  placeholder="Nên: Nhấn mạnh thành phần hữu cơ. Không nên: Nhắc đến đối thủ cạnh tranh..."
                  value={dosDonts}
                  onChange={(e) => setDosDonts(e.target.value)}
                ></textarea>
                <p className="text-xs text-on-surface-variant mt-2 ml-1">
                  Nguyên tắc rõ ràng giúp nhà sáng tạo cung cấp nội dung tốt hơn và nhanh hơn.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4: Logistics */}
          <section className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-8 shadow-[4px_24px_40px_rgba(255,143,163,0.08)] border border-surface-variant/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-sm">
                4
              </div>
              <h2 className="font-headline-md text-base text-primary dark:text-inverse-primary font-bold">Hậu cần &amp; Tham chiếu</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block font-label-sm text-xs text-on-surface mb-2 font-semibold" htmlFor="delivery-address">
                  Địa chỉ Gửi sản phẩm Mẫu
                </label>
                <textarea
                  className="w-full bg-surface-container dark:bg-surface-variant/20 border-none rounded-xl px-4 py-3 text-body-md focus:ring-2 focus:ring-secondary focus:bg-surface-container-lowest transition-all resize-none text-primary dark:text-inverse-primary"
                  id="delivery-address"
                  rows="2"
                  placeholder="Nhập địa chỉ để gửi sản phẩm mẫu..."
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                ></textarea>
              </div>

              <div>
                <label className="block font-label-sm text-xs text-on-surface mb-2 font-semibold" htmlFor="reference-links">
                  Liên kết Tham chiếu (Moodboard, ví dụ trước đây)
                </label>
                <input
                  className="w-full bg-surface-container dark:bg-surface-variant/20 border-none rounded-xl px-4 py-3 text-body-md focus:ring-2 focus:ring-secondary focus:bg-surface-container-lowest transition-all text-primary dark:text-inverse-primary"
                  id="reference-links"
                  type="url"
                  placeholder="https://pinterest.com/..."
                  value={referenceLinks}
                  onChange={(e) => setReferenceLinks(e.target.value)}
                />
              </div>

              <div>
                <label className="block font-label-sm text-xs text-on-surface mb-2 font-semibold">Tải lên Tài nguyên Thương hiệu</label>
                <div className="border-2 border-dashed border-outline-variant rounded-2xl p-8 text-center bg-surface-container-low dark:bg-surface-variant/5 hover:bg-surface-container transition-colors cursor-pointer group flex flex-col items-center justify-center">
                  <Upload size={32} className="text-on-surface-variant group-hover:text-primary transition-colors mb-2" />
                  <p className="font-body-md text-xs text-primary dark:text-inverse-primary">
                    Kéo &amp; thả tệp hoặc <span className="font-bold underline">duyệt tệp</span>
                  </p>
                  <p className="text-[10px] text-on-surface-variant mt-1">Hỗ trợ JPG, PNG, PDF tối đa 10MB</p>
                </div>
              </div>
            </div>
          </section>
        </form>

        {/* Right: Sticky Checkout Sidebar */}
        <div className="lg:col-span-4">
          <CampaignBookingCard
            creator={creator}
            budget={budget}
            onBudgetChange={setBudget}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
}
