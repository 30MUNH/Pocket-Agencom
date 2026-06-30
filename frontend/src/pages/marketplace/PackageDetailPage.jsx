import { useParams, Link } from 'react-router-dom';
import { useMemo } from 'react';
import { ArrowLeft, CheckCircle2, Video, Star } from 'lucide-react';
import { PACKAGES_DATA } from './mockData';

export default function PackageDetailPage() {
  const { id } = useParams();

  const pkg = useMemo(() => {
    return PACKAGES_DATA.find((p) => p.id === id) || PACKAGES_DATA[0];
  }, [id]);

  return (
    <div className="space-y-8">
      {/* Back navigation */}
      <div>
        <Link
          to="/plans"
          className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors group inline-flex"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-label-sm uppercase tracking-widest text-[11px] font-bold">Quay lại Danh sách Gói dịch vụ</span>
        </Link>
      </div>

      {/* Bento grid layout */}
      <div className="grid grid-cols-12 gap-gutter">
        {/* Main Card: Package Overview Header */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-8 md:p-12 shadow-[4px_24px_40px_rgba(255,143,163,0.08)] border border-surface-container/20 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-8">
            <span className="bg-secondary-container text-on-secondary-container dark:bg-on-secondary-fixed-variant dark:text-secondary-fixed px-4 py-1.5 rounded-full text-xs font-bold">
              Đang mở đăng ký
            </span>
          </div>

          <div className="max-w-2xl space-y-6">
            <h2 className="text-display-lg-mobile md:text-display-lg font-bold text-primary dark:text-inverse-primary leading-tight">
              {pkg.name}
            </h2>
            <p className="text-body-lg text-on-surface-variant leading-relaxed">
              {pkg.description}
            </p>
          </div>

          <div className="mt-12 flex flex-wrap gap-8 items-center border-t border-surface-variant/40 pt-8">
            <div>
              <p className="text-[11px] font-bold text-outline uppercase tracking-wider mb-1">Chu kỳ Thanh toán</p>
              <p className="font-headline-md text-base font-bold text-primary dark:text-inverse-primary">
                {pkg.billingCycle}
              </p>
            </div>
            <div className="w-px h-12 bg-surface-variant/40 hidden md:block"></div>
            <div>
              <p className="text-[11px] font-bold text-outline uppercase tracking-wider mb-1">Cam kết</p>
              <p className="font-headline-md text-base font-bold text-primary dark:text-inverse-primary">
                {pkg.commitment}
              </p>
            </div>
          </div>
        </div>

        {/* Side Card: Pricing Details & CTA */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-gutter">
          <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-8 shadow-[4px_24px_40px_rgba(255,143,163,0.08)] border border-surface-container/20 text-center flex flex-col items-center justify-center flex-1">
            <p className="text-[11px] font-bold text-outline uppercase tracking-wider mb-4">Chi phí Đầu tư</p>
            <div className="flex items-baseline gap-2 mb-8">
              <span className="text-display-lg font-bold text-primary dark:text-inverse-primary">${pkg.price}</span>
              <span className="text-on-surface-variant text-sm font-semibold">/ tháng</span>
            </div>
            
            <div className="w-full space-y-4">
              <button
                onClick={() => alert(`Cảm ơn bạn đã lựa chọn ${pkg.name}! Đang chuyển hướng đến cổng thanh toán...`)}
                className="w-full py-4 bg-secondary-container hover:bg-secondary-fixed text-on-secondary-container dark:bg-on-secondary-fixed-variant dark:text-secondary-fixed rounded-full font-bold text-sm hover:shadow-md transition-all active:scale-95"
              >
                Đăng ký ngay
              </button>
              <button
                onClick={() => alert(`Đang mở cửa sổ chat hỗ trợ trực tiếp với chuyên gia...`)}
                className="w-full py-4 border border-outline-variant text-primary hover:bg-surface-container rounded-full font-bold text-sm transition-all active:scale-95 bg-surface dark:bg-surface-dim"
              >
                Liên hệ Chuyên gia
              </button>
            </div>
            <p className="mt-6 text-[10px] text-on-surface-variant font-medium">Cam kết hoàn tiền trong 30 ngày</p>
          </div>

          {/* Side Banner: Video Demo widget */}
          <div
            onClick={() => alert(`Đặt lịch thành công! Chúng tôi sẽ gửi link Zoom qua email của bạn.`)}
            className="bg-primary text-on-primary rounded-[2rem] p-8 flex items-center justify-between overflow-hidden relative group cursor-pointer shadow-sm"
          >
            <div className="z-10 space-y-2">
              <h3 className="text-sm font-bold">Bạn cần demo giới thiệu?</h3>
              <p className="text-[11px] opacity-80">Đặt lịch 15 phút giới thiệu sản phẩm</p>
            </div>
            <Video size={36} className="opacity-20 group-hover:scale-110 transition-transform duration-300" />
          </div>
        </div>

        {/* Features & Benefits grid list */}
        <div className="col-span-12 bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-8 md:p-12 shadow-[4px_24px_40px_rgba(255,143,163,0.08)] border border-surface-container/20">
          <h3 className="font-headline-md text-base text-primary dark:text-inverse-primary font-bold mb-10 flex items-center gap-3">
            <CheckCircle2 size={20} className="text-secondary shrink-0" />
            Các Tính năng &amp; Quyền lợi Cao cấp
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pkg.features.map((feature) => (
              <div key={feature.title} className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container dark:bg-on-secondary-fixed-variant dark:text-secondary-fixed flex items-center justify-center shrink-0">
                  <Star size={16} className="fill-current text-secondary dark:text-secondary-fixed" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-primary dark:text-inverse-primary mb-1">
                    {feature.title}
                  </h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust review and abstract banner bottom */}
        <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 gap-gutter mt-4">
          <div className="bg-secondary-container/40 dark:bg-surface-variant/10 rounded-[2rem] p-8 flex flex-col justify-center gap-6 border border-surface-container/10">
            <div>
              <h4 className="font-headline-md text-base font-bold text-primary dark:text-inverse-primary">
                Được tin dùng bởi hơn 5.000 Thương hiệu
              </h4>
              <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
                Cách tiếp cận tận tâm của chúng tôi đã giúp các doanh nghiệp siêu nhỏ và nhỏ tăng độ phủ mạng xã hội trung bình 340% trong vòng 90 ngày đầu tiên.
              </p>
            </div>
            
            <div className="flex -space-x-3 items-center">
              {[1, 2, 3].map((num) => (
                <div key={num} className="w-10 h-10 rounded-full border-2 border-surface-container-lowest overflow-hidden bg-surface-container shrink-0">
                  <img
                    className="w-full h-full object-cover"
                    src={`https://lh3.googleusercontent.com/aida-public/AB6AXuAQ5ipOjm-VAlUaD4oX3DmUeGadh630Q_Mp6PYEuyfOCeqfHpUzVEQUtPbf0hA8Kts9oD1YYQCGTliKOmcah-nLKWTuYDN5nxu5-POzxwdTdkk13KGxZeB2hC-7xvQRod4R3P8QkqW21-uhA9rC1re7fZkId3kBsQj55qyflSg1RN4RNCsdebAJX7oDPj00jM78S1NC7ZIhUjoJBCcQ6YzaYWREKv9j6BP4jRIvYEAY6g1bMYt_hc66JkN6H0HdQ3PaaKkk9lHT-Vg`}
                    alt="User"
                  />
                </div>
              ))}
              <div className="w-10 h-10 rounded-full border-2 border-surface-container-lowest bg-secondary-container text-on-secondary-container flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm">
                +5k
              </div>
            </div>
          </div>

          <div className="relative rounded-[2rem] overflow-hidden min-h-[220px] flex flex-col justify-end p-8 group border border-surface-container/10 shadow-sm">
            <div className="absolute inset-0 z-0">
              <img
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2000ms]"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC5niBh9TPMHmHJFWghFkIaOs4BuyEkorF-B1GuHQ8N6KUUqobrbqbOPnnkjeC-DKCWIq_VDEHT3wSM9SdeDVaBiHMSewJPPl_F20QgGfH_DUwePYkV_rJSKv9YZzaJXi0zyDpKWEjoDl6gnRjC5YyVsJJuN5nn5EoeNz6ZeHs-yMw7gb54a40izb1NzcbWSHPyy8LDtPnW7LisVttuz2znfZmUgcx756U5tIgwBt4Um5SjoVq46j2DMSshDbUj3Gdb8Q4lGe_Oau8"
                alt="Expert Review"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
            </div>
            <div className="relative z-10 text-white space-y-1">
              <h4 className="font-bold text-xs uppercase tracking-widest opacity-80">Bảo mật &amp; Chất lượng</h4>
              <h4 className="font-headline-md text-sm font-bold">Có sự Đánh giá từ Chuyên gia</h4>
              <p className="text-xs opacity-90 max-w-xs leading-relaxed pt-1">
                Mọi nội dung và đề xuất đều được kiểm duyệt bởi các chuyên gia trước khi gửi đến bạn.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
