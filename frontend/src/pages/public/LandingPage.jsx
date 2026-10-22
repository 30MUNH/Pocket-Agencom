import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from '../../store/toastStore';
import { PRICING_PLANS } from '../../data/pricingPlans';
import {
  CheckCircle2,
  UserX,
  Lightbulb,
  CreditCard,
  Clock,
  Palette,
  Video,
  Users,
  Rocket,
  Star,
  ChevronDown,
} from 'lucide-react';

const TESTIMONIALS = [
  {
    quote: '"Là chủ một shop thời trang nhỏ, tôi từng không biết bắt đầu từ đâu. Pocket Agencom đã cho tôi một kế hoạch rõ ràng và các mẫu thiết kế rất dễ sử dụng!"',
    name: 'Lan Anh',
    role: 'Chủ cửa hàng Thời trang',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC8VsQQK0-T3KtHp4yQNnGxqUZHR0gYFB48W6-N0iSIKJWT86AKdN3FB66mRCRc6T2pxo_ELz_UrACweONEoLlCZDmvEMQeeYDd9sjf8ipU6aFDAWqhcW89RX8QasjLQ-poOwtzaYWdKLgC5IdXq_gnlo71aqPhN2foWlscbwKxi71_bcVML3f00ccUKB8lZ5Q560eBvLlhgD9m0QDUCUYj2_8lsXRCToQmZ2jXgfRdKSCcFzhqsmtVmmCu_sP5NZwjuECe92afpgM',
  },
  {
    quote: '"Lịch nội dung và bảng ngân sách giúp chúng tôi triển khai khai trương quán cà phê đúng tiến độ, lượng khách tăng 40%."',
    name: 'Minh Đức',
    role: 'Chủ quán Cà phê',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCRBox4HF0uPZla7hWKp6Ez1VN3ffJ9YyRFPR-7OXSKCqmKwqNAcgjpztlY2p5I2hqySmKMqdNiDiNIa3ew0hMecjkYSVP4SCpocQb3JH5xK1bkKcc_r5mFog4cFLwa1WF_YJefGS2AoXmjxo0LdREc-2pT1qyE1bUNggUblL4ELDMRrOChSrneWafzlPcQPZvahU899_VsEuAfRsynFvMLpZmoPZPOlo4Xw2FUt6M8b4jijVYUb17UpR9pNbUJAvKsT-skdqPN74s',
  },
  {
    quote: '"Cuối cùng tôi đã hiểu rõ hoạt động tiếp thị của mình! Lộ trình rất đơn giản để thực hiện theo. Hoàn toàn xứng đáng với từng đồng của gói Pro."',
    name: 'Hạnh Nguyễn',
    role: 'Chủ tiệm Beauty Salon',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAs2N8_NhwAfO0U6Ii28O3Pm6LbuOCIgVE_9z8brVZBd0cBKhhkG4o_hK6jvOtv2_TnI8PcrzuG8_wxKTzlmtn8BnQBOJRq-om9Bnu7h_hHGNaXdtbvBrXvGm88vzIx9UpeSIt1V7tQw5C7QK0VUw4Z5gLxwEbVg8WTuZy47Hd6IWHYMV0GJ3I7zNqOrfT09wf8w_G01I2uWUtvVEc8Jb2a-wyVAqNMmXFsNnv3UsKf8l0d0NIshNue3LxnbBCRNPvGMsYVwkGc4tI',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [faqOpen, setFaqOpen] = useState({ 0: true, 1: false, 2: false });

  const toggleFaq = (index) => {
    setFaqOpen({ ...faqOpen, [index]: !faqOpen[index] });
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-body-md">
      
      {/* Public Navigation Header */}
      <header className="sticky top-0 z-50 bg-surface/90 dark:bg-surface-dim/90 backdrop-blur-md px-6 lg:px-12 h-20 flex items-center justify-between border-b border-surface-container-high dark:border-outline/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center overflow-hidden shadow-xs">
            <img
              alt="Agency Logo"
              className="w-full h-full object-cover"
              src="/Logo.png"
            />
          </div>
          <span className="text-xl font-extrabold text-slate-900 tracking-tight">
            Pocket <span className="bg-[#FFCED2] px-1.5 py-0.5 rounded-md text-slate-900">Agen</span>com
          </span>
        </div>

        {/* Desktop Nav links */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-slate-600 hover:text-black text-sm font-semibold transition-colors">
            Tính năng
          </a>
          <a href="#pricing" className="text-slate-600 hover:text-black text-sm font-semibold transition-colors">
            Bảng giá
          </a>
          <a href="#faq" className="text-slate-600 hover:text-black text-sm font-semibold transition-colors">
            Hỏi đáp
          </a>
        </nav>

        {/* Auth CTA buttons */}
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="px-5 py-2 rounded-full text-black font-semibold hover:bg-slate-100 transition-colors text-sm"
          >
            Đăng nhập
          </Link>
          <Link
            to="/register"
            className="px-6 py-2.5 rounded-full bg-[#FFCED2] hover:bg-[#ffbdc2] text-slate-900 font-bold shadow-sm transition-all text-sm tracking-wide"
          >
            Đăng ký
          </Link>
        </div>
      </header>

      {/* Main Canvas Container */}
      <main className="flex-1">
        
        {/* Hero Section */}
        <section className="relative overflow-hidden py-16 md:py-24 px-6 lg:px-12 max-w-container-max mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-white" id="home">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-50 text-slate-800 border border-slate-200 font-semibold text-xs uppercase tracking-wider">
              <CheckCircle2 size={16} className="text-[#e29399]" />
              Được tin dùng bởi 2.000+ thương hiệu nhỏ
            </div>
            <h1 className="text-display-lg font-bold text-black leading-tight">
              Tiếp thị Đơn giản hóa cho <span className="bg-[#FFCED2]/40 px-2 py-0.5 rounded-lg border-b-2 border-[#FFCED2]">Doanh nghiệp nhỏ</span>
            </h1>
            <p className="text-body-lg text-slate-600 max-w-xl">
              Pocket Agencom giúp các thương hiệu bản địa và shop online nhỏ tạo kế hoạch marketing, ý tưởng nội dung, kịch bản video, lịch đăng và ngân sách phù hợp cho chiến dịch thực tế.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={() => navigate('/register')}
                className="bg-[#FFCED2] hover:bg-[#ffbdc2] text-slate-900 px-8 py-3.5 rounded-full font-bold text-base shadow-sm transition-all"
              >
                Bắt đầu ngay
              </button>
              <a
                href="#pricing"
                className="bg-white text-black px-8 py-3.5 rounded-full font-bold text-base hover:bg-slate-50 transition-all border border-slate-300 text-center"
              >
                Xem bảng giá
              </a>
            </div>
          </div>

          {/* Right Hero: Dashboard Mockup & Spotlight */}
          <div className="relative h-[400px] md:h-[500px]">
            {/* Dashboard Mockup Grid Frame */}
            <div className="absolute top-0 right-0 w-full h-[350px] md:h-[450px] rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-white">
              <img
                className="w-full h-full object-cover"
                alt="SaaS interface preview"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCXKOEPBwT4BBvMBpup_NjrDkMLaiCwvrVe-nNEvFrVA71bHAfGb5nBVnvct-z7hS_rcyZPSzuWJt_cyyr9HW8CUuXrb2w70AAvtMq0VWo1rzdPmUfHI1enhovTN1Pac7F2B-UJiuxr3h5okR9lXlz0dj1UiWvwTox9g59oX2zTHQOfwJPoii8LSmyTNLe_0d17cRLHMDdhE_QMtWuoLMWvU_UTK-cBx899vr-k9Dq1rdCzhP319ATfQ8XCC4t-TS4H2W65aGuvAPQ"
              />
            </div>
            {/* Floating Creator Spot Badge Card */}
            <div className="absolute -bottom-4 -left-4 md:-left-8 w-60 bg-white p-5 rounded-2xl shadow-lg border border-slate-100">
              <div className="flex items-center gap-3.5 mb-3">
                <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-100">
                  <img
                    className="w-full h-full object-cover"
                    alt="Sarah"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCxmdWcRBWDK046TEGl22ciOi-6MZ4PB5iKwX0jWnUQZhTck1t4UaJvDmRbLU0soYRROUXbHlu7xamwhAlRqfdF6fQjtvfJxcXznkMbe2BslXjlDUc0zEY_F5GoSc0fmRD0J4vI5fFJtqC2ZyIAs5VWWIbpmarQoaFLNPsBMtSojAvXB8tyEZSVchxpQUajLxuorW1ZYoCw0BelhB2jI8REIiaQ462ExFvPxL1w0fADjNp38XC26BmhXRlzQrGqwYAOOBazC_GeKGA"
                  />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">Sarah J.</p>
                  <p className="text-xs text-slate-500">Nội dung Đời sống</p>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-600">
                <span>Tương tác</span>
                <span className="text-slate-900 font-bold bg-[#FFCED2] px-2 py-0.5 rounded-md text-xs">4.8%</span>
              </div>
            </div>
          </div>
        </section>

        {/* Problem Pain Points Section */}
        <section className="py-20 px-6 bg-white border-y border-slate-100">
          <div className="max-w-container-max mx-auto text-center mb-16 space-y-3">
            <h2 className="text-headline-md font-bold text-slate-900">
              Làm tiếp thị rất khó. Chúng tôi giúp bạn làm dễ dàng.
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Ngừng loay hoay với các công cụ phức tạp và chi phí agency đắt đỏ. Chúng tôi giải quyết 4 nỗi đau đầu lớn nhất của chủ doanh nghiệp nhỏ.
            </p>
          </div>

          <div className="max-w-container-max mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-7 rounded-2xl shadow-sm border border-slate-200/80 hover:border-slate-300 transition-all">
              <div className="w-12 h-12 bg-[#FFCED2] rounded-xl flex items-center justify-center mb-5 text-slate-900 shadow-xs">
                <UserX size={24} />
              </div>
              <h3 className="font-bold text-base mb-2 text-slate-900">Không có nhân viên marketing</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                AI của chúng tôi đóng vai trò là đội ngũ marketing tận tâm của bạn, 24/7.
              </p>
            </div>

            <div className="bg-white p-7 rounded-2xl shadow-sm border border-slate-200/80 hover:border-slate-300 transition-all">
              <div className="w-12 h-12 bg-[#FFCED2] rounded-xl flex items-center justify-center mb-5 text-slate-900 shadow-xs">
                <Lightbulb size={24} />
              </div>
              <h3 className="font-bold text-base mb-2 text-slate-900">Thiếu ý tưởng nội dung</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Tạo hàng trăm ý tưởng nội dung lan truyền (viral) chỉ trong vài giây.
              </p>
            </div>

            <div className="bg-white p-7 rounded-2xl shadow-sm border border-slate-200/80 hover:border-slate-300 transition-all">
              <div className="w-12 h-12 bg-[#FFCED2] rounded-xl flex items-center justify-center mb-5 text-slate-900 shadow-xs">
                <CreditCard size={24} />
              </div>
              <h3 className="font-bold text-base mb-2 text-slate-900">Chi phí Agency quá cao</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Đạt kết quả chuyên nghiệp chỉ với một phần nhỏ chi phí so với thuê ngoài.
              </p>
            </div>

            <div className="bg-white p-7 rounded-2xl shadow-sm border border-slate-200/80 hover:border-slate-300 transition-all">
              <div className="w-12 h-12 bg-[#FFCED2] rounded-xl flex items-center justify-center mb-5 text-slate-900 shadow-xs">
                <Clock size={24} />
              </div>
              <h3 className="font-bold text-base mb-2 text-slate-900">Không có thời gian để học</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Các cẩm nang (playbook) sẵn dùng giúp bạn thực thi được ngay hôm nay.
              </p>
            </div>
          </div>
        </section>

        {/* Feature Bento Section */}
        <section id="features" className="py-20 px-6 max-w-container-max mx-auto space-y-12 bg-white">
          <div className="text-center space-y-2">
            <h2 className="text-display-lg font-bold text-slate-900">
              Mọi thứ một doanh nghiệp nhỏ cần
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 (2 spans) */}
            <div className="md:col-span-2 bg-white rounded-2xl p-8 md:p-10 shadow-sm flex flex-col md:flex-row items-center gap-8 border border-slate-200/80">
              <div className="flex-1 space-y-4">
                <h3 className="text-headline-md font-bold text-slate-900">
                  Bộ công cụ Marketing thông minh
                </h3>
                <p className="text-slate-600">
                  Tạo ngay lập tức một bộ tài liệu toàn diện bao gồm giọng điệu thương hiệu, chân dung khán giả và các trụ cột thông điệp chính.
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center gap-1.5 text-slate-900 font-bold hover:text-accent-pink transition-colors"
                >
                  Tìm hiểu thêm <Rocket size={14} />
                </button>
              </div>
              <div className="w-full md:w-1/2 h-56 rounded-xl overflow-hidden bg-slate-50 border border-slate-100">
                <img
                  className="w-full h-full object-cover"
                  alt="Marketing kit generator interface mock"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAFQ0PVIoe4LgHEWFqgYAFdzyFKMj7FSymKowjLHY9SGSElyTwaqgI-TvOPvhQ370DWylNb4UqUbhDT3S7Jgh5-0g0Fu63ciCGX36O_X-CL87ROG2D58DxX6ptc6uYGYoa4_Ufk_Ds-Mwm_S8XRKmg7oZSe0I75gVBVgyZLf2j232ZWExSTGeOzeLip8mqVmym5oAA-SbHV97rRoecFL3vswlHLOcTXzO1l3Ukmo71n32YSm2DNWeljwSoYwIi_fsImx4pyjQw5_LA"
                />
              </div>
            </div>

            {/* Feature 2 (1 span) */}
            <div className="bg-white rounded-2xl p-8 md:p-10 shadow-sm border border-slate-200/80 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-slate-900">
                  Lộ trình Số hóa
                </h3>
                <p className="text-slate-600 text-sm">
                  Hướng dẫn chi tiết từng ngày để tăng mức độ hiện diện của bạn trên mọi nền tảng mạng xã hội.
                </p>
              </div>
              <div className="space-y-3 pt-6">
                <div className="h-2 w-full bg-slate-100 rounded-full">
                  <div className="h-2 w-3/4 bg-slate-900 rounded-full" />
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full">
                  <div className="h-2 w-1/2 bg-slate-900 rounded-full" />
                </div>
              </div>
            </div>

            {/* Sub-cards row */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200/80">
              <div className="w-12 h-12 bg-[#FFCED2] rounded-xl flex items-center justify-center mb-4 text-slate-900 shadow-xs">
                <Palette size={20} />
              </div>
              <h3 className="font-bold text-xl mb-1 text-slate-900">Mẫu Canva</h3>
              <p className="text-slate-600 text-sm">Được thiết kế để đạt tỷ lệ chuyển đổi cao và thẩm mỹ hiện đại.</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200/80">
              <div className="w-12 h-12 bg-[#FFCED2] rounded-xl flex items-center justify-center mb-4 text-slate-900 shadow-xs">
                <Video size={20} />
              </div>
              <h3 className="font-bold text-xl mb-1 text-slate-900">Ma trận Kịch bản Video</h3>
              <p className="text-slate-600 text-sm">Các đoạn hook và kịch bản triệu view cho TikTok, Reels &amp; Shorts.</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200/80">
              <div className="w-12 h-12 bg-[#FFCED2] rounded-xl flex items-center justify-center mb-4 text-slate-900 shadow-xs">
                <Users size={20} />
              </div>
              <h3 className="font-bold text-xl mb-1 text-slate-900">Phân tích hiệu quả</h3>
              <p className="text-slate-600 text-sm">Theo dõi kênh, chi tiêu và tiến độ chiến dịch trong một bảng điều khiển.</p>
            </div>
          </div>
        </section>

        {/* Step Guide Section */}
        <section className="py-20 px-6 bg-white border-t border-slate-100">
          <div className="max-w-container-max mx-auto space-y-16">
            <h2 className="text-display-lg font-bold text-center text-slate-900">
              Bắt đầu chiến dịch trong 4 bước đơn giản
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
              {/* Connector line (Desktop only) */}
              <div className="hidden md:block absolute top-10 left-12 right-12 h-[2px] bg-slate-200 -z-10" />

              {/* Step 1 */}
              <div className="text-center space-y-3">
                <div className="w-20 h-20 bg-white rounded-full shadow-sm border-2 border-slate-200 flex items-center justify-center mx-auto relative z-10 font-bold text-headline-md text-slate-900">
                  1
                </div>
                <h4 className="font-bold text-base text-slate-900">Xác định mục tiêu</h4>
                <p className="text-slate-600 text-sm max-w-[200px] mx-auto">
                  Cho chúng tôi biết sản phẩm của bạn và khách hàng mục tiêu mong muốn.
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center space-y-3">
                <div className="w-20 h-20 bg-white rounded-full shadow-sm border-2 border-slate-200 flex items-center justify-center mx-auto relative z-10 font-bold text-headline-md text-slate-900">
                  2
                </div>
                <h4 className="font-bold text-base text-slate-900">Nhận bộ công cụ</h4>
                <p className="text-slate-600 text-sm max-w-[200px] mx-auto">
                  AI tự động tạo chiến lược và tài nguyên nội dung tùy chỉnh cho bạn.
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center space-y-3">
                <div className="w-20 h-20 bg-white rounded-full shadow-sm border-2 border-slate-200 flex items-center justify-center mx-auto relative z-10 font-bold text-headline-md text-slate-900">
                  3
                </div>
                <h4 className="font-bold text-base text-slate-900">Lên lịch nội dung</h4>
                <p className="text-slate-600 text-sm max-w-[200px] mx-auto">
                  Sắp xếp nội dung theo kênh và thời điểm triển khai phù hợp.
                </p>
              </div>

              {/* Step 4 */}
              <div className="text-center space-y-3">
                <div className="w-20 h-20 bg-[#FFCED2] text-slate-900 rounded-full shadow-md border-4 border-white flex items-center justify-center mx-auto relative z-10">
                  <Rocket className="text-slate-900" size={30} />
                </div>
                <h4 className="font-bold text-base text-slate-900">Bắt đầu bứt phá</h4>
                <p className="text-slate-600 text-sm max-w-[200px] mx-auto">
                  Thực hiện kế hoạch và theo dõi thương hiệu của bạn phát triển.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Matrix Section */}
        <section id="pricing" className="py-20 px-6 bg-white border-t border-slate-100">
          <div className="max-w-container-max mx-auto space-y-16">
            <div className="text-center space-y-3">
              <h2 className="text-display-lg font-bold text-slate-900">
                Bảng giá đơn giản, minh bạch
              </h2>
              <p className="text-slate-600">Các gói dịch vụ mở rộng theo sự phát triển doanh nghiệp của bạn.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-5xl mx-auto">
              {PRICING_PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className={`bg-white p-7 rounded-2xl border flex flex-col transition-all relative ${
                    plan.isPopular
                      ? 'shadow-lg border-2 border-[#FFCED2] md:scale-105 z-10'
                      : 'shadow-sm border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#FFCED2] text-slate-900 px-3.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">
                      Phổ biến nhất
                    </div>
                  )}

                  <h4 className="font-bold text-base text-slate-900 mb-2">{plan.name}</h4>
                  <div className="mb-6">
                    <span className="text-3xl font-bold text-slate-900">{plan.price}</span>
                    <span className="text-slate-500 text-sm">{plan.period}</span>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex gap-2 text-sm text-slate-600">
                        <CheckCircle2 size={16} className="text-[#e29399] shrink-0 mt-0.5" />
                        {feat}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => navigate('/register')}
                    className={`w-full py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all ${
                      plan.isPopular
                        ? 'bg-[#FFCED2] text-slate-900 hover:bg-[#ffbcc2] shadow-sm'
                        : 'border border-slate-200 text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    {plan.btnText}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 px-6 max-w-container-max mx-auto space-y-16 bg-white border-t border-slate-100">
          <h2 className="text-display-lg font-bold text-center text-slate-900">
            Được các chủ doanh nghiệp yêu thích
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-6">
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-slate-700 text-base italic leading-relaxed">
                    {t.quote}
                  </p>
                </div>

                <div className="flex items-center gap-4 mt-8 pt-6 border-t border-slate-100">
                  <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-100 shrink-0">
                    <img className="w-full h-full object-cover" alt={t.name} src={t.avatar} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-20 px-6 bg-white border-t border-slate-100">
          <div className="max-w-3xl mx-auto space-y-12">
            <h2 className="text-headline-md font-bold text-center text-slate-900">
              Các câu hỏi thường gặp
            </h2>

            <div className="space-y-4">
              {[
                {
                  q: 'Tôi có cần ngân sách lớn không?',
                  a: 'Hoàn toàn không! Chúng tôi thiết kế Pocket Agencom dành riêng cho các doanh nghiệp nhỏ. Công cụ của chúng tôi giúp bạn tối đa hóa hiệu quả ngay cả với ngân sách hạn chế.',
                },
                {
                  q: 'Tôi có thể hủy đăng ký bất cứ lúc nào không?',
                  a: 'Có, các gói tháng của chúng tôi rất linh hoạt. Bạn có thể nâng cấp, hạ cấp hoặc hủy bất cứ lúc nào từ phần cài đặt tài khoản.',
                },
                {
                  q: 'Tôi có thể quản lý những kênh nào?',
                  a: 'Bạn có thể quản lý mạng xã hội, gian hàng thương mại điện tử, lịch nội dung, tài nguyên và ngân sách chiến dịch trong cùng một nơi.',
                },
              ].map((faq, i) => (
                <div
                  key={i}
                  className="p-6 rounded-2xl bg-white border border-slate-200/80 cursor-pointer shadow-sm hover:border-slate-300 transition-all"
                  onClick={() => toggleFaq(i)}
                >
                  <div className="flex justify-between items-center font-bold text-base text-slate-900">
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={18}
                      className={`text-slate-500 transition-transform duration-300 ${
                        faqOpen[i] ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                  {faqOpen[i] && (
                    <p className="mt-4 text-slate-600 text-sm leading-relaxed">
                      {faq.a}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Conversion Box */}
        <section className="py-20 px-6 max-w-container-max mx-auto">
          <div className="bg-slate-900 text-white rounded-3xl p-12 md:p-16 text-center relative overflow-hidden shadow-lg">
            <h2 className="text-display-lg font-bold mb-4 relative z-10 leading-tight">
              Sẵn sàng bứt phá thương hiệu?
            </h2>
            <p className="text-slate-300 text-body-lg mb-10 max-w-lg mx-auto relative z-10">
              Tham gia cùng hơn 2.000+ thương hiệu bản địa đơn giản hóa tiếp thị ngay hôm nay.
            </p>
            <div className="flex flex-wrap justify-center gap-4 relative z-10">
              <button
                onClick={() => navigate('/register')}
                className="bg-[#FFCED2] hover:bg-[#ffbcc2] text-slate-900 px-8 py-3.5 rounded-full font-bold text-base shadow-sm transition-all uppercase tracking-wider"
              >
                Bắt đầu miễn phí
              </button>
              <button
                onClick={() => toast.success('Cảm ơn bạn! Đội ngũ tư vấn chiến lược của Pocket Agencom sẽ liên hệ trong 24 giờ.')}
                className="bg-white/10 text-white border border-white/20 px-8 py-3.5 rounded-full font-bold text-base hover:bg-white/20 transition-all uppercase tracking-wider"
              >
                Đăng ký tư vấn
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Public Footer */}
      <footer className="bg-white border-t border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 py-16 px-6 lg:px-12 max-w-container-max mx-auto">
          <div className="col-span-2 space-y-4">
            <span className="text-xl font-extrabold text-slate-900 tracking-tight block">
              Pocket <span className="bg-[#FFCED2] px-1.5 py-0.5 rounded-md text-slate-900">Agen</span>com
            </span>
            <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
              Trợ lý tiếp thị cho doanh nghiệp vừa và nhỏ thời đại mới. Đơn giản, tinh tế, hiệu quả.
            </p>
          </div>
          <div>
            <h5 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider">
              Sản phẩm
            </h5>
            <ul className="space-y-2 text-slate-600 text-sm">
              <li><a href="#features" className="hover:text-slate-900 transition-colors">Tính năng</a></li>
              <li><a href="#pricing" className="hover:text-slate-900 transition-colors">Bảng giá</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider">
              Công ty
            </h5>
            <ul className="space-y-2 text-slate-600 text-sm">
              <li><a href="#" className="hover:text-slate-900 transition-colors">Về chúng tôi</a></li>
              <li><a href="#" className="hover:text-slate-900 transition-colors">Tuyển dụng</a></li>
              <li><a href="#" className="hover:text-slate-900 transition-colors">Liên hệ</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider">
              Pháp lý
            </h5>
            <ul className="space-y-2 text-slate-600 text-sm">
              <li><a href="#" className="hover:text-slate-900 transition-colors">Chính sách Bảo mật</a></li>
              <li><a href="#" className="hover:text-slate-900 transition-colors">Điều khoản Dịch vụ</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-100 py-8 text-center text-slate-400 text-xs">
          © 2026 Pocket Agencom. Bảo lưu mọi quyền.
        </div>
      </footer>
    </div>
  );
}
