import { useParams, Link } from 'react-router-dom';
import { useMemo } from 'react';
import { ArrowLeft, MessageSquare, Calendar, Check, Star, Globe, TrendingUp, Users } from 'lucide-react';
import { CREATORS_DATA } from './mockData';
import BrandElementCard from '../../components/marketplace/BrandElementCard';

export default function KOLDetailPage() {
  const { id } = useParams();

  const creator = useMemo(() => {
    return CREATORS_DATA.find((c) => c.id === id) || CREATORS_DATA[0];
  }, [id]);

  const formatFollowers = (count) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(0) + 'K';
    }
    return count;
  };

  return (
    <div className="space-y-8">
      {/* Back button and title */}
      <div>
        <Link
          to="/marketplace"
          className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors group inline-flex"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-label-sm uppercase tracking-widest text-[11px] font-bold">Quay lại Chợ KOL/KOC</span>
        </Link>
      </div>

      {/* Hero Canvas Header */}
      <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] shadow-[4px_24px_40px_rgba(255,143,163,0.08)] overflow-hidden border border-surface-container/20">
        {/* Cover Photo */}
        <div className="h-64 md:h-80 bg-surface-container/40 relative">
          <img
            className="w-full h-full object-cover"
            src={creator.coverImage}
            alt={`${creator.name} cover`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        </div>

        {/* Profile Info Overlay Row */}
        <div className="relative px-6 md:px-12 pb-8 pt-0 -mt-16 md:-mt-20 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 z-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left w-full md:w-auto">
            {/* Profile Avatar */}
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-surface-container-lowest shadow-md shrink-0 bg-surface-container">
              <img
                className="w-full h-full object-cover"
                src={creator.avatar}
                alt={creator.name}
              />
            </div>
            
            {/* Meta text details */}
            <div className="pb-2">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                <h2 className="text-display-lg-mobile md:text-headline-md font-bold text-white md:text-primary dark:md:text-inverse-primary leading-tight">
                  {creator.name}
                </h2>
                {creator.verified && (
                  <span className="bg-secondary-container text-on-secondary-container rounded-full p-0.5 w-5 h-5 flex items-center justify-center">
                    <Check size={12} className="stroke-[3]" />
                  </span>
                )}
              </div>
              <p className="text-xs text-white/95 md:text-on-surface-variant flex justify-center md:justify-start items-center gap-1 mt-1">
                {creator.handle}
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-2 gap-y-0.5 mt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
                  {creator.category}
                </span>
                <span className="text-white/60 md:text-outline text-[11px]">•</span>
                <span className="text-xs text-white/90 md:text-on-surface-variant flex items-center gap-0.5">
                  <Star size={12} className="fill-[#FFB400] text-[#FFB400]" /> {creator.rating} (52 đánh giá)
                </span>
              </div>
            </div>
          </div>

          {/* Action Callouts */}
          <div className="flex gap-3 w-full md:w-auto justify-center md:justify-end pb-2">
            <button
              onClick={() => alert(`Đang mở cửa sổ nhắn tin với ${creator.name}...`)}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-outline-variant text-primary hover:bg-surface-container transition-colors text-xs font-semibold"
            >
              <MessageSquare size={16} />
              Nhắn tin
            </button>
            <Link
              to={`/marketplace/book/${creator.id}`}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary text-on-primary hover:bg-inverse-surface transition-colors text-xs font-semibold shadow-sm"
            >
              <Calendar size={16} />
              Đặt lịch ngay
            </Link>
          </div>
        </div>
      </div>

      {/* Main split details grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Left Column: Data Analysis & Showcases */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Section: Overview Metrics */}
          <section className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-8 shadow-[4px_24px_40px_rgba(255,143,163,0.08)] border border-surface-container/20">
            <h3 className="font-headline-md text-base text-primary dark:text-inverse-primary font-bold mb-6 flex items-center gap-2">
              <TrendingUp size={18} className="text-secondary" />
              Hiệu suất Kênh
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-surface-container-low dark:bg-surface-variant/10 p-5 rounded-2xl">
                <p className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider">Tổng Người theo dõi</p>
                <p className="text-display-lg-mobile font-bold text-primary dark:text-inverse-primary mt-2">
                  {formatFollowers(creator.followers)}
                </p>
                <p className="text-[10px] text-outline mt-1">+2.4% so với tháng trước</p>
              </div>
              <div className="bg-surface-container-low dark:bg-surface-variant/10 p-5 rounded-2xl">
                <p className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider">Tỷ lệ Tương tác</p>
                <p className="text-display-lg-mobile font-bold text-primary dark:text-inverse-primary mt-2">
                  {creator.engagement}%
                </p>
                <p className="text-[10px] text-outline mt-1">Trung bình ngành: 3.2%</p>
              </div>
              <div className="bg-surface-container-low dark:bg-surface-variant/10 p-5 rounded-2xl">
                <p className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider">Lượt xem Trung bình</p>
                <p className="text-display-lg-mobile font-bold text-primary dark:text-inverse-primary mt-2">
                  {formatFollowers(creator.followers * 0.35)}
                </p>
                <p className="text-[10px] text-outline mt-1">Tỷ lệ giữ chân người xem video 94%</p>
              </div>
            </div>
          </section>

          {/* Section: Audience Demographics */}
          <section className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-8 shadow-[4px_24px_40px_rgba(255,143,163,0.08)] border border-surface-container/20">
            <h3 className="font-headline-md text-base text-primary dark:text-inverse-primary font-bold mb-6 flex items-center gap-2">
              <Users size={18} className="text-secondary" />
              Nhân khẩu học Khán giả
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Gender Split */}
              <div>
                <h4 className="text-xs font-bold text-primary dark:text-inverse-primary mb-4">Phân chia Giới tính</h4>
                <div className="space-y-4">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-secondary font-bold">Nữ ({creator.audienceGender.female}%)</span>
                    <span className="text-primary dark:text-inverse-primary font-bold">Nam ({creator.audienceGender.male}%)</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-surface-container dark:bg-surface-variant/20 overflow-hidden flex">
                    <div
                      className="bg-secondary-container h-full"
                      style={{ width: `${creator.audienceGender.female}%` }}
                    ></div>
                    <div
                      className="bg-primary h-full"
                      style={{ width: `${creator.audienceGender.male}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Age Groups */}
              <div>
                <h4 className="text-xs font-bold text-primary dark:text-inverse-primary mb-4">Nhóm Tuổi</h4>
                <div className="space-y-3">
                  {creator.audienceAge.map((item) => (
                    <div key={item.range} className="flex items-center gap-3">
                      <span className="w-12 text-xs font-semibold text-on-surface-variant">{item.range}</span>
                      <div className="flex-1 h-2 rounded-full bg-surface-container dark:bg-surface-variant/20 overflow-hidden">
                        <div
                          className="bg-secondary h-full rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                      <span className="w-8 text-right text-xs font-bold text-primary dark:text-inverse-primary">
                        {item.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Section: Past Campaigns */}
          <section className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-8 shadow-[4px_24px_40px_rgba(255,143,163,0.08)] border border-surface-container/20">
            <h3 className="font-headline-md text-base text-primary dark:text-inverse-primary font-bold mb-6">
              Chiến dịch Đã Thực hiện
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {creator.pastCampaigns.map((camp) => (
                <div
                  key={camp.title}
                  className="bg-surface rounded-2xl overflow-hidden border border-surface-container/30 hover:shadow-md transition-shadow"
                >
                  <div className="h-40 bg-surface-container relative">
                    <img className="w-full h-full object-cover" src={camp.image} alt={camp.title} />
                    <span className="absolute top-3 right-3 bg-black/65 backdrop-blur text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                      {camp.type}
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] text-secondary font-bold uppercase tracking-wider">{camp.brand}</p>
                    <h4 className="font-bold text-xs text-primary dark:text-inverse-primary mt-1">{camp.title}</h4>
                    <p className="text-[11px] text-on-surface-variant mt-2">Lượt xem/Ấn tượng: {camp.views}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section: Brand Testimonials */}
          <section className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-8 shadow-[4px_24px_40px_rgba(255,143,163,0.08)] border border-surface-container/20">
            <h3 className="font-headline-md text-base text-primary dark:text-inverse-primary font-bold mb-6">
              Đánh giá &amp; Phản hồi từ Thương hiệu
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {creator.testimonials.map((test) => (
                <BrandElementCard key={test.brandName} testimonial={test} />
              ))}
            </div>
          </section>

        </div>

        {/* Right Column: Profile Specs & Sticky CTA */}
        <div className="lg:col-span-4 space-y-6">
          {/* Creator Profile Specs */}
          <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-6 shadow-[4px_24px_40px_rgba(255,143,163,0.08)] border border-surface-container/20">
            <h3 className="text-xs font-bold text-primary dark:text-inverse-primary uppercase tracking-widest mb-4">
              Về Nhà sáng tạo
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed mb-6">
              {creator.bio}
            </p>

            <h4 className="text-[11px] font-bold text-primary dark:text-inverse-primary uppercase tracking-widest mb-3">
              Chi tiết &amp; Kênh liên kết
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2.5 border-b border-surface-variant/40">
                <span className="text-xs text-on-surface-variant">Người theo dõi Instagram</span>
                <span className="text-xs font-bold text-primary dark:text-inverse-primary">
                  {creator.platforms.includes('IG') ? formatFollowers(creator.followers * 0.6) : 'Không có'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-surface-variant/40">
                <span className="text-xs text-on-surface-variant">Người theo dõi TikTok</span>
                <span className="text-xs font-bold text-primary dark:text-inverse-primary">
                  {creator.platforms.includes('TT') ? formatFollowers(creator.followers * 0.8) : 'Không có'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-surface-variant/40">
                <span className="text-xs text-on-surface-variant">Người đăng ký YouTube</span>
                <span className="text-xs font-bold text-primary dark:text-inverse-primary">
                  {creator.platforms.includes('YT') ? formatFollowers(creator.followers * 0.4) : 'Không có'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2.5">
                <span className="text-xs text-on-surface-variant">Vị trí Chính</span>
                <span className="text-xs font-bold text-primary dark:text-inverse-primary flex items-center gap-1">
                  <Globe size={12} />
                  {creator.location}
                </span>
              </div>
            </div>
          </div>

          {/* Sticky Booking CTA */}
          <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-6 shadow-[4px_24px_40px_rgba(255,143,163,0.08)] border border-surface-container/20 sticky top-24">
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Chi phí Ước tính</p>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-display-lg-mobile font-bold text-primary dark:text-inverse-primary">
                {creator.priceRange ? creator.priceRange : `$${creator.startingPrice}`}
              </span>
            </div>
            
            <Link
              to={`/marketplace/book/${creator.id}`}
              className="w-full mt-6 py-4 bg-secondary-container hover:bg-secondary-fixed text-on-secondary-container dark:bg-on-secondary-fixed-variant dark:text-secondary-fixed rounded-full font-headline-md text-sm font-bold flex items-center justify-center gap-2 hover:-translate-y-0.5 active:scale-95 transition-all shadow-sm"
            >
              Bắt đầu Đặt lịch Hợp tác
            </Link>
            <p className="text-[10px] text-center text-on-surface-variant mt-4">
              Yêu cầu xác thực ngân sách trước khi gửi đến nhà sáng tạo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
