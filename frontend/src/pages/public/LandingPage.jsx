import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Compass,
} from 'lucide-react';

const CREATORS = [
  {
    name: 'Alex Nguyen',
    niche: 'Công nghệ & Lối sống',
    nicheLabel: 'Công nghệ & Lối sống',
    platform: 'TikTok & Instagram',
    followers: '125K',
    engRate: '5.2%',
    price: 'Từ 1.2M VND',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB2AXLHUYI6lGAhgl98vSsR0b3qBrhWeQ_AoX1rcOinmyRQFYG-WqKaSGkn_SzDLT7NUBnaKeKkEQQucy9I5skRgCrWXLLtrFq6r79FgiyiHI_D1qAxZawffb8Wi6p_s86oCciR6mqFypn3Ud9W2NaiQ56AOirvc06PJauhY_fNznnDF_3NlU7qSJSOn7OEFLN_ARa0OSwfaTGy6OBafVFMHV3DTBQLgMdNgHHWsSSERrS5bU0g497vcc0whUvCvv4gTtZ2sUMy4q8',
  },
  {
    name: 'Thùy Tiên',
    niche: 'Làm đẹp & Chăm sóc da',
    nicheLabel: 'Làm đẹp & Chăm sóc da',
    platform: 'Instagram & Lemon8',
    followers: '48K',
    engRate: '7.8%',
    price: 'Từ 800k VND',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCu-SeW1r71ZPolsvXxxI6_5n11xzfCG-C3oB6lPwzxY2mNfcNSQHyGs-_MOSR7r6uVR2ROJbC6oOzkTWDMwA8oHQYEYSZ9BOxBgR-6_JzDIkwVU0KSk3iVYjCvXkzfFP-Hzoh4M5FjGWx9gyf0u7StgxMAy66ixm4KtwfZSMQkIxGSNCkxPWcT2D6fwViDGM-9x-WFEy2TqaKXJ80ZMj9g77twqevEyZSrLJwupQDXwQBAk5z0ea6YDdLvil96QjV62ZmBJAbeE3s',
  },
  {
    name: 'Minh Hà',
    niche: 'Ẩm thực & F&B',
    nicheLabel: 'Ẩm thực & F&B',
    platform: 'Facebook & Reels',
    followers: '82K',
    engRate: '4.5%',
    price: 'Từ 1.5M VND',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD6KMU4Q0ILqv5ZhmUYKaiRS1HtruthNRjdkxlkii0YNDyUk7OYHKIxa9m8QryoaYQojl6nsPGJoIVpRYAM-Gk4KeaD--X6JkEwPRY1fP7jLI7EJ_HHvlascLB1t7dkMOm_HynEi6kSuLoKiPr9zQvTh_v59_qvHxza2BqZtVloDc3j1FNBKcYuSpbjGmdGGAOIgybRdC-0jrdTYGinLfXEGg2KXCqjXwik64xBRHbxrMbRBl7TjKUbB1R-mHydGmnGueniAlmfQZY',
  },
];

const PRICING_PLANS = [
  {
    name: 'Cơ bản (Starter)',
    price: '199k',
    period: '/tháng',
    features: ['3 Bộ công cụ Marketing', 'Ý tưởng Nội dung', 'Hỗ trợ qua Email'],
    isPopular: false,
    btnText: 'Chọn gói',
  },
  {
    name: 'Chuyên nghiệp (Pro)',
    price: '499k',
    period: '/tháng',
    features: ['Không giới hạn Bộ công cụ', 'Kịch bản Video AI', '5 buổi Tư vấn KOL/KOC', 'Hỗ trợ Ưu tiên'],
    isPopular: true,
    btnText: 'Chọn gói',
  },
  {
    name: 'Nâng cao (Advanced)',
    price: '890k',
    period: '/tháng',
    features: ['Tất cả tính năng gói Pro', 'Lộ trình tiếp thị riêng', '15 lượt đặt Creator'],
    isPopular: false,
    btnText: 'Chọn gói',
  },
  {
    name: 'Doanh nghiệp (Premium)',
    price: '3.5M+',
    period: '/tháng',
    features: ['Giải pháp Tùy chỉnh', 'Quản lý Chiến dịch Toàn diện', 'Cam kết chỉ số ROI'],
    isPopular: false,
    btnText: 'Liên hệ',
  },
];

const TESTIMONIALS = [
  {
    quote: '"Là chủ một shop thời trang nhỏ, tôi từng không biết bắt đầu từ đâu. Pocket Agencom đã cho tôi một kế hoạch rõ ràng và các mẫu thiết kế rất dễ sử dụng!"',
    name: 'Lan Anh',
    role: 'Chủ cửa hàng Thời trang',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC8VsQQK0-T3KtHp4yQNnGxqUZHR0gYFB48W6-N0iSIKJWT86AKdN3FB66mRCRc6T2pxo_ELz_UrACweONEoLlCZDmvEMQeeYDd9sjf8ipU6aFDAWqhcW89RX8QasjLQ-poOwtzaYWdKLgC5IdXq_gnlo71aqPhN2foWlscbwKxi71_bcVML3f00ccUKB8lZ5Q560eBvLlhgD9m0QDUCUYj2_8lsXRCToQmZ2jXgfRdKSCcFzhqsmtVmmCu_sP5NZwjuECe92afpgM',
  },
  {
    quote: '"Chợ KOL là một bước ngoặt lớn. Chúng tôi đã đặt 3 nhà sáng tạo nội dung cho buổi khai trương quán cà phê mới và lượng khách tăng 40%."',
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
          <div className="w-10 h-10 rounded-xl bg-secondary-container dark:bg-secondary/40 flex items-center justify-center">
            <Rocket className="text-secondary dark:text-white" size={20} />
          </div>
          <span className="text-headline-md font-bold text-primary dark:text-inverse-primary">
            Pocket Agencom
          </span>
        </div>

        {/* Desktop Nav links */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-on-surface-variant hover:text-primary dark:text-outline-variant dark:hover:text-inverse-primary text-sm font-semibold transition-colors">
            Tính năng
          </a>
          <a href="#marketplace" className="text-on-surface-variant hover:text-primary dark:text-outline-variant dark:hover:text-inverse-primary text-sm font-semibold transition-colors">
            Chợ KOL/KOC
          </a>
          <a href="#pricing" className="text-on-surface-variant hover:text-primary dark:text-outline-variant dark:hover:text-inverse-primary text-sm font-semibold transition-colors">
            Bảng giá
          </a>
          <a href="#faq" className="text-on-surface-variant hover:text-primary dark:text-outline-variant dark:hover:text-inverse-primary text-sm font-semibold transition-colors">
            Hỏi đáp
          </a>
        </nav>

        {/* Auth CTA buttons */}
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="px-5 py-2 rounded-full text-primary dark:text-inverse-primary hover:bg-surface-container-high dark:hover:bg-outline/25 transition-all text-xs font-semibold"
          >
            Đăng nhập
          </Link>
          <Link
            to="/register"
            className="px-6 py-2.5 rounded-full bg-[#FF8FA3] text-white hover:opacity-90 shadow-md transition-all text-xs font-bold uppercase tracking-wider"
          >
            Bắt đầu ngay
          </Link>
        </div>
      </header>

      {/* Main Canvas Container */}
      <main className="flex-1">
        
        {/* Hero Section */}
        <section className="px-6 py-16 md:py-24 max-w-container-max mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-secondary-container dark:bg-secondary/30 text-secondary dark:text-white rounded-full font-bold text-xs uppercase tracking-wider">
              <CheckCircle2 size={14} />
              Được tin dùng bởi 2.000+ thương hiệu nhỏ
            </div>
            <h1 className="text-display-lg font-bold text-primary dark:text-inverse-primary leading-tight">
              Tiếp thị Đơn giản hóa cho <span className="text-secondary dark:text-secondary-fixed-dim">Doanh nghiệp nhỏ</span>
            </h1>
            <p className="text-body-lg text-on-surface-variant max-w-xl">
              Pocket Agencom giúp các thương hiệu bản địa và shop online nhỏ dễ dàng tạo kế hoạch marketing ăn liền, ý tưởng nội dung, kịch bản video, mẫu thiết kế, và đặt lịch KOL/KOC phù hợp cho chiến dịch thực tế.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={() => navigate('/register')}
                className="bg-[#FF8FA3] text-white px-8 py-4 rounded-full font-bold text-body-lg shadow-[0_8px_30px_rgba(255,143,163,0.3)] hover:scale-105 transition-all"
              >
                Bắt đầu ngay
              </button>
              <a
                href="#pricing"
                className="bg-secondary-container text-on-secondary-container dark:bg-outline/20 dark:text-inverse-primary px-8 py-4 rounded-full font-bold text-body-lg hover:bg-secondary-fixed dark:hover:bg-outline/35 transition-all text-center border border-secondary-fixed/50"
              >
                Xem bảng giá
              </a>
            </div>
          </div>

          {/* Right Hero: Dashboard Mockup & Spotlight */}
          <div className="relative h-[400px] md:h-[500px]">
            {/* Dashboard Mockup Grid Frame */}
            <div className="absolute top-0 right-0 w-full h-[350px] md:h-[450px] rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(255,143,163,0.12)] border-[6px] border-white dark:border-outline/20 bg-white">
              <img
                className="w-full h-full object-cover"
                alt="SaaS interface preview"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCXKOEPBwT4BBvMBpup_NjrDkMLaiCwvrVe-nNEvFrVA71bHAfGb5nBVnvct-z7hS_rcyZPSzuWJt_cyyr9HW8CUuXrb2w70AAvtMq0VWo1rzdPmUfHI1enhovTN1Pac7F2B-UJiuxr3h5okR9lXlz0dj1UiWvwTox9g59oX2zTHQOfwJPoii8LSmyTNLe_0d17cRLHMDdhE_QMtWuoLMWvU_UTK-cBx899vr-k9Dq1rdCzhP319ATfQ8XCC4t-TS4H2W65aGuvAPQ"
              />
            </div>
            {/* Floating Creator Spot Badge Card */}
            <div className="absolute -bottom-4 -left-4 md:-left-8 w-60 bg-white dark:bg-surface-variant p-6 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.08)] border border-surface-variant/40 animate-bounce-slow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-secondary-container">
                  <img
                    className="w-full h-full object-cover"
                    alt="Sarah"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCxmdWcRBWDK046TEGl22ciOi-6MZ4PB5iKwX0jWnUQZhTck1t4UaJvDmRbLU0soYRROUXbHlu7xamwhAlRqfdF6fQjtvfJxcXznkMbe2BslXjlDUc0zEY_F5GoSc0fmRD0J4vI5fFJtqC2ZyIAs5VWWIbpmarQoaFLNPsBMtSojAvXB8tyEZSVchxpQUajLxuorW1ZYoCw0BelhB2jI8REIiaQ462ExFvPxL1w0fADjNp38XC26BmhXRlzQrGqwYAOOBazC_GeKGA"
                  />
                </div>
                <div>
                  <p className="font-bold text-primary dark:text-inverse-primary">Sarah J.</p>
                  <p className="text-label-sm text-secondary dark:text-secondary-fixed">KOC Đời sống</p>
                </div>
              </div>
              <div className="flex justify-between text-label-sm text-on-surface-variant">
                <span>Tương tác</span>
                <span className="text-secondary dark:text-secondary-fixed font-bold">4.8%</span>
              </div>
            </div>
          </div>
        </section>

        {/* Problem Pain Points Section */}
        <section className="py-20 px-6 bg-surface-container-lowest dark:bg-tertiary-container/30">
          <div className="max-w-container-max mx-auto text-center mb-16 space-y-3">
            <h2 className="text-headline-md font-bold text-primary dark:text-inverse-primary">
              Làm tiếp thị rất khó. Chúng tôi giúp bạn làm dễ dàng.
            </h2>
            <p className="text-on-surface-variant max-w-2xl mx-auto">
              Ngừng loay hoay với các công cụ phức tạp và chi phí agency đắt đỏ. Chúng tôi giải quyết 4 nỗi đau đầu lớn nhất của chủ doanh nghiệp nhỏ.
            </p>
          </div>

          <div className="max-w-container-max mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-surface-variant/25 p-8 rounded-3xl shadow-[0_4px_24px_rgba(255,143,163,0.04)] border border-[#f5e3e6] dark:border-outline/10 hover:border-[#FF8FA3] transition-all">
              <div className="w-14 h-14 bg-secondary-container dark:bg-outline/20 rounded-2xl flex items-center justify-center mb-6">
                <UserX className="text-[#FF8FA3]" size={28} />
              </div>
              <h3 className="font-bold text-lg mb-2 text-primary dark:text-inverse-primary">Không có nhân viên marketing</h3>
              <p className="text-on-surface-variant text-sm">
                AI của chúng tôi đóng vai trò là đội ngũ marketing tận tâm của bạn, 24/7.
              </p>
            </div>

            <div className="bg-white dark:bg-surface-variant/25 p-8 rounded-3xl shadow-[0_4px_24px_rgba(255,143,163,0.04)] border border-[#f5e3e6] dark:border-outline/10 hover:border-[#FF8FA3] transition-all">
              <div className="w-14 h-14 bg-secondary-container dark:bg-outline/20 rounded-2xl flex items-center justify-center mb-6">
                <Lightbulb className="text-[#FF8FA3]" size={28} />
              </div>
              <h3 className="font-bold text-lg mb-2 text-primary dark:text-inverse-primary">Thiếu ý tưởng nội dung</h3>
              <p className="text-on-surface-variant text-sm">
                Tạo hàng trăm ý tưởng nội dung lan truyền (viral) chỉ trong vài giây.
              </p>
            </div>

            <div className="bg-white dark:bg-surface-variant/25 p-8 rounded-3xl shadow-[0_4px_24px_rgba(255,143,163,0.04)] border border-[#f5e3e6] dark:border-outline/10 hover:border-[#FF8FA3] transition-all">
              <div className="w-14 h-14 bg-secondary-container dark:bg-outline/20 rounded-2xl flex items-center justify-center mb-6">
                <CreditCard className="text-[#FF8FA3]" size={28} />
              </div>
              <h3 className="font-bold text-lg mb-2 text-primary dark:text-inverse-primary">Chi phí Agency quá cao</h3>
              <p className="text-on-surface-variant text-sm">
                Đạt kết quả chuyên nghiệp chỉ với một phần nhỏ chi phí so với thuê ngoài.
              </p>
            </div>

            <div className="bg-white dark:bg-surface-variant/25 p-8 rounded-3xl shadow-[0_4px_24px_rgba(255,143,163,0.04)] border border-[#f5e3e6] dark:border-outline/10 hover:border-[#FF8FA3] transition-all">
              <div className="w-14 h-14 bg-secondary-container dark:bg-outline/20 rounded-2xl flex items-center justify-center mb-6">
                <Clock className="text-[#FF8FA3]" size={28} />
              </div>
              <h3 className="font-bold text-lg mb-2 text-primary dark:text-inverse-primary">Không có thời gian để học</h3>
              <p className="text-on-surface-variant text-sm">
                Các cẩm nang (playbook) sẵn dùng giúp bạn thực thi được ngay hôm nay.
              </p>
            </div>
          </div>
        </section>

        {/* Feature Bento Section */}
        <section id="features" className="py-20 px-6 max-w-container-max mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-display-lg font-bold text-primary dark:text-inverse-primary">
              Mọi thứ một doanh nghiệp nhỏ cần
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 (2 spans) */}
            <div className="md:col-span-2 bg-white dark:bg-surface-variant/10 rounded-[2rem] p-8 md:p-10 shadow-[0_4px_24px_rgba(255,143,163,0.08)] flex flex-col md:flex-row items-center gap-8 border border-surface-variant/50">
              <div className="flex-1 space-y-4">
                <h3 className="text-headline-md font-bold text-primary dark:text-inverse-primary">
                  Bộ công cụ Marketing thông minh
                </h3>
                <p className="text-on-surface-variant">
                  Tạo ngay lập tức một bộ tài liệu toàn diện bao gồm giọng điệu thương hiệu, chân dung khán giả và các trụ cột thông điệp chính.
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center gap-1.5 text-secondary dark:text-secondary-fixed-dim font-bold"
                >
                  Tìm hiểu thêm <Rocket size={14} />
                </button>
              </div>
              <div className="w-full md:w-1/2 h-56 rounded-2xl overflow-hidden bg-secondary-container/40">
                <img
                  className="w-full h-full object-cover"
                  alt="Marketing kit generator interface mock"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAFQ0PVIoe4LgHEWFqgYAFdzyFKMj7FSymKowjLHY9SGSElyTwaqgI-TvOPvhQ370DWylNb4UqUbhDT3S7Jgh5-0g0Fu63ciCGX36O_X-CL87ROG2D58DxX6ptc6uYGYoa4_Ufk_Ds-Mwm_S8XRKmg7oZSe0I75gVBVgyZLf2j232ZWExSTGeOzeLip8mqVmym5oAA-SbHV97rRoecFL3vswlHLOcTXzO1l3Ukmo71n32YSm2DNWeljwSoYwIi_fsImx4pyjQw5_LA"
                />
              </div>
            </div>

            {/* Feature 2 (1 span) */}
            <div className="bg-secondary-container/30 dark:bg-secondary/15 rounded-[2rem] p-8 md:p-10 shadow-[0_4px_24px_rgba(255,143,163,0.08)] border border-secondary-container/50 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-primary dark:text-inverse-primary">
                  Lộ trình Số hóa
                </h3>
                <p className="text-on-surface-variant text-sm">
                  Hướng dẫn chi tiết từng ngày để tăng mức độ hiện diện của bạn trên mọi nền tảng mạng xã hội.
                </p>
              </div>
              <div className="space-y-3 pt-6">
                <div className="h-2 w-full bg-white dark:bg-surface-variant/45 rounded-full">
                  <div className="h-2 w-3/4 bg-[#FF8FA3] rounded-full" />
                </div>
                <div className="h-2 w-full bg-white dark:bg-surface-variant/45 rounded-full">
                  <div className="h-2 w-1/2 bg-[#FF8FA3] rounded-full" />
                </div>
              </div>
            </div>

            {/* Sub-cards row */}
            <div className="bg-white dark:bg-surface-variant/10 rounded-3xl p-8 shadow-sm border border-surface-variant/50">
              <div className="w-12 h-12 bg-secondary-container dark:bg-outline/20 rounded-xl flex items-center justify-center mb-4">
                <Palette className="text-[#FF8FA3]" size={20} />
              </div>
              <h3 className="font-bold text-xl mb-1 text-primary dark:text-inverse-primary">Mẫu Canva</h3>
              <p className="text-on-surface-variant text-sm">Được thiết kế để đạt tỷ lệ chuyển đổi cao và thẩm mỹ hiện đại.</p>
            </div>

            <div className="bg-white dark:bg-surface-variant/10 rounded-3xl p-8 shadow-sm border border-surface-variant/50">
              <div className="w-12 h-12 bg-secondary-container dark:bg-outline/20 rounded-xl flex items-center justify-center mb-4">
                <Video className="text-[#FF8FA3]" size={20} />
              </div>
              <h3 className="font-bold text-xl mb-1 text-primary dark:text-inverse-primary">Ma trận Kịch bản Video</h3>
              <p className="text-on-surface-variant text-sm">Các đoạn hook và kịch bản triệu view cho TikTok, Reels &amp; Shorts.</p>
            </div>

            <div className="bg-white dark:bg-surface-variant/10 rounded-3xl p-8 shadow-sm border border-surface-variant/50">
              <div className="w-12 h-12 bg-secondary-container dark:bg-outline/20 rounded-xl flex items-center justify-center mb-4">
                <Users className="text-[#FF8FA3]" size={20} />
              </div>
              <h3 className="font-bold text-xl mb-1 text-primary dark:text-inverse-primary">Chợ KOL/KOC</h3>
              <p className="text-on-surface-variant text-sm">Tiếp cận trực tiếp các nhà sáng tạo nội dung chất lượng đã được kiểm duyệt.</p>
            </div>
          </div>
        </section>

        {/* Step Guide Section */}
        <section className="py-20 px-6 bg-surface-container-low dark:bg-tertiary-container/10">
          <div className="max-w-container-max mx-auto space-y-16">
            <h2 className="text-display-lg font-bold text-center text-primary dark:text-inverse-primary">
              Bắt đầu chiến dịch trong 4 bước đơn giản
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
              {/* Connector line (Desktop only) */}
              <div className="hidden md:block absolute top-10 left-12 right-12 h-[2px] bg-[#f5d5db] dark:bg-outline/20 -z-10" />

              {/* Step 1 */}
              <div className="text-center space-y-3">
                <div className="w-20 h-20 bg-white dark:bg-surface rounded-full shadow-md border-4 border-secondary-container dark:border-secondary flex items-center justify-center mx-auto relative z-10 font-bold text-display-lg-mobile text-[#FF8FA3]">
                  1
                </div>
                <h4 className="font-bold text-lg text-primary dark:text-inverse-primary">Xác định mục tiêu</h4>
                <p className="text-on-surface-variant text-sm max-w-[200px] mx-auto">
                  Cho chúng tôi biết sản phẩm của bạn và khách hàng mục tiêu mong muốn.
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center space-y-3">
                <div className="w-20 h-20 bg-white dark:bg-surface rounded-full shadow-md border-4 border-secondary-container dark:border-secondary flex items-center justify-center mx-auto relative z-10 font-bold text-display-lg-mobile text-[#FF8FA3]">
                  2
                </div>
                <h4 className="font-bold text-lg text-primary dark:text-inverse-primary">Nhận bộ công cụ</h4>
                <p className="text-on-surface-variant text-sm max-w-[200px] mx-auto">
                  AI tự động tạo chiến lược và tài nguyên nội dung tùy chỉnh cho bạn.
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center space-y-3">
                <div className="w-20 h-20 bg-white dark:bg-surface rounded-full shadow-md border-4 border-secondary-container dark:border-secondary flex items-center justify-center mx-auto relative z-10 font-bold text-display-lg-mobile text-[#FF8FA3]">
                  3
                </div>
                <h4 className="font-bold text-lg text-primary dark:text-inverse-primary">Đặt lịch KOL/KOC</h4>
                <p className="text-on-surface-variant text-sm max-w-[200px] mx-auto">
                  Lựa chọn từ kho KOL/KOC đã qua kiểm duyệt chất lượng.
                </p>
              </div>

              {/* Step 4 */}
              <div className="text-center space-y-3">
                <div className="w-20 h-20 bg-[#FF8FA3] rounded-full shadow-md border-4 border-white dark:border-surface-variant flex items-center justify-center mx-auto relative z-10">
                  <Rocket className="text-white" size={32} />
                </div>
                <h4 className="font-bold text-lg text-primary dark:text-inverse-primary">Bắt đầu bứt phá</h4>
                <p className="text-on-surface-variant text-sm max-w-[200px] mx-auto">
                  Thực hiện kế hoạch và theo dõi thương hiệu của bạn phát triển.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Creator spotlight Section */}
        <section id="marketplace" className="py-20 px-6 max-w-container-max mx-auto space-y-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h2 className="text-headline-md font-bold text-primary dark:text-inverse-primary mb-2">
                Các nhà sáng tạo hàng đầu
              </h2>
              <p className="text-on-surface-variant">Hợp tác với các chuyên gia có tệp khán giả phù hợp nhất với lĩnh vực của bạn.</p>
            </div>
            <Link
              to="/login"
              className="bg-primary text-on-primary px-6 py-3 rounded-full font-bold hover:opacity-90 transition-all text-sm uppercase flex items-center gap-2"
            >
              <Compass size={14} />
              Khám phá Chợ KOL/KOC
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {CREATORS.map((c) => (
              <div
                key={c.name}
                className="bg-white dark:bg-surface-variant/20 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md border border-surface-variant/50 group transition-all"
              >
                <div className="h-64 relative overflow-hidden bg-surface-container">
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    alt={c.name}
                    src={c.avatar}
                  />
                  <div className="absolute top-4 right-4 bg-white/90 dark:bg-surface/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-secondary dark:text-secondary-fixed">
                    {c.nicheLabel}
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <h4 className="font-bold text-xl text-primary dark:text-inverse-primary">{c.name}</h4>
                    <p className="text-on-surface-variant text-sm">{c.platform}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-secondary-container/40 dark:bg-surface/30 p-3 rounded-2xl">
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-0.5">Người theo dõi</p>
                      <p className="font-bold text-primary dark:text-inverse-primary text-sm">{c.followers}</p>
                    </div>
                    <div className="bg-secondary-container/40 dark:bg-surface/30 p-3 rounded-2xl">
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-0.5">Tỷ lệ tương tác</p>
                      <p className="font-bold text-secondary dark:text-secondary-fixed text-sm">{c.engRate}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-surface-variant/40">
                    <p className="font-bold text-primary dark:text-inverse-primary text-sm">{c.price}</p>
                    <button
                      onClick={() => navigate('/login')}
                      className="bg-secondary-container text-secondary dark:bg-[#FF8FA3] dark:text-white px-4 py-2 rounded-full font-bold text-xs hover:opacity-90 transition-all uppercase"
                    >
                      Đặt lịch ngay
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing Matrix Section */}
        <section id="pricing" className="py-20 px-6 bg-surface-container-low dark:bg-tertiary-container/10">
          <div className="max-w-container-max mx-auto space-y-16">
            <div className="text-center space-y-3">
              <h2 className="text-display-lg font-bold text-primary dark:text-inverse-primary">
                Bảng giá đơn giản, minh bạch
              </h2>
              <p className="text-on-surface-variant">Các gói dịch vụ mở rộng theo sự phát triển doanh nghiệp của bạn.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
              {PRICING_PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className={`bg-white dark:bg-surface-variant/15 p-8 rounded-3xl border flex flex-col transition-all relative ${
                    plan.isPopular
                      ? 'shadow-xl border-[#FF8FA3] md:scale-105 z-10'
                      : 'shadow-sm border-surface-variant/50'
                  }`}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FF8FA3] text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                      Phổ biến nhất
                    </div>
                  )}

                  <h4 className="font-bold text-lg text-primary dark:text-inverse-primary mb-2">{plan.name}</h4>
                  <div className="mb-6">
                    <span className="text-3xl font-bold text-primary dark:text-inverse-primary">{plan.price}</span>
                    <span className="text-on-surface-variant text-sm">{plan.period}</span>
                  </div>

                  <ul className="space-y-4 mb-8 flex-1">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex gap-2 text-sm text-on-surface-variant dark:text-inverse-on-surface">
                        <CheckCircle2 size={16} className="text-[#FF8FA3] shrink-0 mt-0.5" />
                        {feat}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => navigate('/register')}
                    className="w-full py-3 rounded-full font-bold text-sm uppercase tracking-wider transition-all bg-[#FF8FA3] text-white shadow-lg hover:opacity-95"
                  >
                    {plan.btnText}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 px-6 max-w-container-max mx-auto space-y-16">
          <h2 className="text-display-lg font-bold text-center text-primary dark:text-inverse-primary">
            Được các chủ doanh nghiệp yêu thích
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="bg-white dark:bg-surface-variant/10 p-8 rounded-3xl border border-surface-variant/50 shadow-[0_4px_24px_rgba(255,143,163,0.02)] flex flex-col justify-between"
              >
                <div className="space-y-6">
                  <div className="flex text-[#FF8FA3]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-on-surface dark:text-inverse-on-surface text-lg italic leading-relaxed">
                    {t.quote}
                  </p>
                </div>

                <div className="flex items-center gap-4 mt-8 pt-6 border-t border-surface-variant/40">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-secondary-container shrink-0">
                    <img className="w-full h-full object-cover" alt={t.name} src={t.avatar} />
                  </div>
                  <div>
                    <p className="font-bold text-primary dark:text-inverse-primary">{t.name}</p>
                    <p className="text-xs text-on-surface-variant">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-20 px-6 bg-white dark:bg-tertiary-container/5">
          <div className="max-w-3xl mx-auto space-y-12">
            <h2 className="text-headline-md font-bold text-center text-primary dark:text-inverse-primary">
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
                  q: 'Làm cách nào để liên hệ với các KOL/KOC?',
                  a: 'Nền tảng của chúng tôi tích hợp hệ thống đặt lịch trực tiếp. Sau khi tìm thấy nhà sáng tạo ưng ý, bạn có thể gửi đề xuất hợp tác trực tiếp qua hệ thống.',
                },
              ].map((faq, i) => (
                <div
                  key={i}
                  className="p-6 rounded-2xl bg-secondary-container/20 dark:bg-surface-variant/10 border border-secondary-container/40 dark:border-outline/10 cursor-pointer"
                  onClick={() => toggleFaq(i)}
                >
                  <div className="flex justify-between items-center font-bold text-lg text-primary dark:text-inverse-primary">
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={18}
                      className={`text-on-surface-variant transition-transform duration-300 ${
                        faqOpen[i] ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                  {faqOpen[i] && (
                    <p className="mt-4 text-on-surface-variant text-sm leading-relaxed">
                      {faq.a}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Conversion Box */}
        <section className="py-24 px-6 max-w-container-max mx-auto">
          <div className="bg-primary text-on-primary dark:bg-tertiary-container rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-lg">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,143,163,0.12),transparent)] pointer-events-none" />
            <h2 className="text-display-lg font-bold mb-4 relative z-10 leading-tight">
              Sẵn sàng bứt phá thương hiệu?
            </h2>
            <p className="text-white/80 dark:text-inverse-on-surface/80 text-body-lg mb-10 max-w-lg mx-auto relative z-10">
              Tham gia cùng hơn 2.000+ thương hiệu bản địa đơn giản hóa tiếp thị ngay hôm nay.
            </p>
            <div className="flex flex-wrap justify-center gap-4 relative z-10">
              <button
                onClick={() => navigate('/register')}
                className="bg-[#FF8FA3] text-white px-10 py-4.5 rounded-full font-bold text-lg shadow-xl hover:scale-105 transition-all uppercase tracking-wider"
              >
                Bắt đầu miễn phí
              </button>
              <button
                onClick={() => alert('Đang giả lập đặt lịch gọi demo...')}
                className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-10 py-4.5 rounded-full font-bold text-lg hover:bg-white/20 transition-all uppercase tracking-wider"
              >
                Đăng ký tư vấn
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Public Footer */}
      <footer className="bg-surface-container-low dark:bg-surface-dim border-t border-surface-container-high dark:border-outline/10">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 py-16 px-6 lg:px-12 max-w-container-max mx-auto">
          <div className="col-span-2 space-y-4">
            <span className="text-headline-md font-bold text-primary dark:text-inverse-primary block">
              Pocket Agencom
            </span>
            <p className="text-on-surface-variant text-sm max-w-xs leading-relaxed">
              Trợ lý tiếp thị cho doanh nghiệp vừa và nhỏ thời đại mới. Đơn giản, tinh tế, hiệu quả.
            </p>
          </div>
          <div>
            <h5 className="font-bold text-primary dark:text-inverse-primary mb-4 text-sm uppercase tracking-wider">
              Sản phẩm
            </h5>
            <ul className="space-y-2 text-on-surface-variant text-sm">
              <li><a href="#features" className="hover:text-secondary transition-colors">Tính năng</a></li>
              <li><a href="#marketplace" className="hover:text-secondary transition-colors">Chợ KOL/KOC</a></li>
              <li><a href="#pricing" className="hover:text-secondary transition-colors">Bảng giá</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-primary dark:text-inverse-primary mb-4 text-sm uppercase tracking-wider">
              Công ty
            </h5>
            <ul className="space-y-2 text-on-surface-variant text-sm">
              <li><a href="#" className="hover:text-secondary transition-colors">Về chúng tôi</a></li>
              <li><a href="#" className="hover:text-secondary transition-colors">Tuyển dụng</a></li>
              <li><a href="#" className="hover:text-secondary transition-colors">Liên hệ</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-primary dark:text-inverse-primary mb-4 text-sm uppercase tracking-wider">
              Pháp lý
            </h5>
            <ul className="space-y-2 text-on-surface-variant text-sm">
              <li><a href="#" className="hover:text-secondary transition-colors">Chính sách Bảo mật</a></li>
              <li><a href="#" className="hover:text-secondary transition-colors">Điều khoản Dịch vụ</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-surface-container-high dark:border-outline/10 py-8 text-center text-on-surface-variant text-xs">
          © 2026 ConciergeSaaS. Bảo lưu mọi quyền.
        </div>
      </footer>
    </div>
  );
}
