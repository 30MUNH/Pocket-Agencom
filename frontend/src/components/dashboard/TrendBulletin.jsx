import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Sparkles, Flame, Zap, Award, ArrowRight, X } from 'lucide-react';

const TRENDS = [
  {
    id: 1,
    title: "Trend 'Thông báo mất tích': Biến sự cố thành Content triệu view!",
    tags: ["#Fastvertising", "#HàiHước", "#Viral"],
    trendScope: "SIMPLE_POST",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80",
    teaser: "Lô hàng 12 tấn KitKat biến mất và cách các thương hiệu lớn 'mượn cớ' thông báo thất lạc để giật spotlight. Shop của bạn có gì để báo 'mất tích' không?",
    icon: Flame,
    iconColor: "text-amber-500 bg-amber-50 dark:bg-amber-950/30",
    badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
    prefill: {
      campaignType: "awareness",
      description: "Chiến dịch bắt trend 'Thông báo mất tích' - mượn cớ thông báo thất lạc sản phẩm hoặc dịch vụ độc đáo của cửa hàng để tạo sự tò mò, hài hước và thu hút sự chú ý cực lớn từ khách hàng.",
      primaryGoal: "Tạo nội dung viral thu hút trên 10,000 tương tác và tăng nhận diện thương hiệu",
      customerProfile: "Khách hàng trẻ trung, thích theo dõi xu hướng mạng xã hội (Facebook, TikTok, Instagram) và thích nội dung hài hước.",
    }
  },
  {
    id: 2,
    title: "Trend 'Unboxing Hộp Mù (Blind Box)': Cơn sốt bóc quà kích thích tò mò!",
    tags: ["#XuHướngTiêuDùng", "#KíchThíchTòMò", "#DễÁpDụng"],
    trendScope: "CAMPAIGN",
    image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=600&q=80",
    teaser: "Sức hút từ cảm giác hồi hộp khi tự tay bóc hộp đồ chơi, mỹ phẩm hay phụ kiện ngẫu nhiên. Áp dụng ngay hình thức 'Blind Box' để x3 doanh số bán hàng.",
    icon: Zap,
    iconColor: "text-purple-500 bg-purple-50 dark:bg-purple-950/30",
    badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300",
    prefill: {
      campaignType: "sales",
      description: "Bắt trend 'Unboxing Blind Box' - Đóng gói các sản phẩm bán chạy hoặc các combo của cửa hàng dưới dạng hộp mù ngẫu nhiên kèm theo một số quà tặng giới hạn bất ngờ.",
      primaryGoal: "Thúc đẩy doanh số bán hàng tăng gấp đôi trong tháng và giới thiệu dòng sản phẩm mới.",
      customerProfile: "Khách hàng thích sự bất ngờ, đam mê sưu tầm, đặc biệt là nhóm đối tượng học sinh, sinh viên và nhân viên văn phòng trẻ tuổi.",
    }
  },
  {
    id: 3,
    title: "Trend 'Thử thách 7 ngày lột xác': Kể câu chuyện hành trình đầy cảm xúc!",
    tags: ["#Storytelling", "#TrựcQuan", "#ĐángTinCậy"],
    trendScope: "SIMPLE_POST",
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=600&q=80",
    teaser: "Tạo dựng lòng tin tuyệt đối bằng cách ghi lại hành trình thay đổi rõ rệt trước và sau khi sử dụng sản phẩm. Phù hợp nhất cho thời trang, mỹ phẩm và sức khỏe.",
    icon: Award,
    iconColor: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30",
    badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
    prefill: {
      campaignType: "retention",
      description: "Chiến dịch kể chuyện (Storytelling) ghi lại hành trình thực tế 'Thử thách 7 ngày lột xác' của khách hàng/người trải nghiệm khi sử dụng sản phẩm chăm sóc/sức khỏe/thời trang.",
      primaryGoal: "Tăng niềm tin vào sản phẩm thông qua minh chứng trực quan, nâng tỷ lệ giữ chân khách hàng cũ lên 25%.",
      customerProfile: "Khách hàng quan tâm sâu sắc tới kết quả thực tế, chú trọng chất lượng, hiệu quả lâu dài và giá trị thực sự của sản phẩm.",
    }
  }
];

export default function TrendBulletin() {
  const navigate = useNavigate();
  const [selectedTrend, setSelectedTrend] = useState(null);

  const handleCreateScript = (trend) => {
    if (trend.trendScope === 'SIMPLE_POST') {
      const serializableTrend = {
        id: trend.id,
        title: trend.title,
        tags: trend.tags,
        trendScope: trend.trendScope,
        image: trend.image,
        teaser: trend.teaser,
      };
      navigate('/user/quick-editor', { state: { trend: serializableTrend } });
    } else {
      navigate('/marketing-kit', { state: { trend: trend.prefill } });
    }
  };

  const ActiveIcon = selectedTrend ? selectedTrend.icon : null;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-primary">
            <TrendingUp size={20} />
          </div>
          <div>
            <h3 className="text-headline-md font-headline-md text-primary flex items-center gap-2">
              Bản tin Xu hướng <Sparkles className="text-secondary animate-pulse" size={18} />
            </h3>
            <p className="text-body-md text-on-surface-variant text-sm">
              Cập nhật các trào lưu marketing nóng hổi và tạo kịch bản ngay chỉ với một cú nhấp.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TRENDS.map((trend) => {
          const IconComponent = trend.icon;
          return (
            <div
              key={trend.id}
              onClick={() => setSelectedTrend(trend)}
              className="bg-surface-container-lowest dark:bg-tertiary-container rounded-3xl p-6 shadow-ambient hover:shadow-ambient-hover hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between border border-surface-container/20 group relative overflow-hidden cursor-pointer"
            >
              {/* Card top blur glow */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-secondary-container/10 dark:bg-secondary-fixed/5 rounded-full blur-xl pointer-events-none group-hover:scale-150 transition-transform duration-500" />
              
              <div>
                {/* Header card with Icon & Tags & Scope Badge */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${trend.iconColor}`}>
                    <IconComponent size={20} />
                  </div>
                  <div className="flex flex-wrap gap-1.5 justify-end items-center">
                    {trend.trendScope === 'SIMPLE_POST' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-850 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-500/20">
                        Bài đăng nhanh
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-850 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/50 dark:border-purple-500/20">
                        Chiến dịch
                      </span>
                    )}
                    {trend.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold font-label-sm ${trend.badgeColor}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <h4 className="text-body-lg font-headline-md text-primary mb-3 line-clamp-2 group-hover:text-secondary transition-colors">
                  {trend.title}
                </h4>

                {/* Teaser */}
                <p className="text-body-md text-on-surface-variant text-sm line-clamp-3 mb-6">
                  {trend.teaser}
                </p>
              </div>

              {/* Action Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCreateScript(trend);
                }}
                className="w-full bg-secondary text-on-secondary font-label-sm text-label-sm py-3.5 rounded-full hover:bg-secondary/95 transition-all flex items-center justify-center gap-2 group-hover:shadow-[0_4px_12px_rgba(109,89,91,0.2)]"
              >
                <span>{trend.trendScope === 'SIMPLE_POST' ? 'Soạn thảo nhanh' : 'Tạo kịch bản'}</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform animate-bounce-horizontal" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Detail Modal Popup */}
      {selectedTrend && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-modal-fade"
          onClick={() => setSelectedTrend(null)}
        >
          <div 
            className="bg-surface-container-lowest dark:bg-surface-container-high rounded-[2rem] p-6 md:p-8 max-w-xl w-full border border-surface-container/30 shadow-2xl relative overflow-hidden animate-modal-slide"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top blur glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-container/20 dark:bg-secondary-fixed/5 rounded-full blur-2xl pointer-events-none" />
            
            {/* Modal Container */}
            <div className="space-y-6 relative z-10">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selectedTrend.iconColor}`}>
                    {ActiveIcon && <ActiveIcon size={24} />}
                  </div>
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {selectedTrend.trendScope === 'SIMPLE_POST' ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-850 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-500/20">
                        Bài đăng nhanh
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-850 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/50 dark:border-purple-500/20">
                        Chiến dịch
                      </span>
                    )}
                    {selectedTrend.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className={`px-3 py-1 rounded-full text-xs font-semibold font-label-sm ${selectedTrend.badgeColor}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTrend(null)}
                  className="p-1.5 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant"
                >
                  <X size={20} />
                </button>
              </div>

              <div>
                <h3 className="text-xl md:text-2xl font-headline-md text-primary leading-snug">
                  {selectedTrend.title}
                </h3>
              </div>

              <div className="space-y-4 text-body-md text-on-surface-variant max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                <div>
                  <h4 className="text-label-md font-headline-md text-primary mb-1">Mô tả trào lưu:</h4>
                  <p className="leading-relaxed text-sm bg-surface-container-low p-4 rounded-2xl">
                    {selectedTrend.teaser}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-surface-container-low p-4 rounded-2xl">
                    <h4 className="text-label-sm font-headline-md text-primary mb-1">Loại chiến dịch gợi ý:</h4>
                    <span className="inline-block bg-secondary-container/60 text-secondary px-3 py-1 rounded-full text-xs font-semibold mt-1">
                      {selectedTrend.prefill.campaignType === 'awareness' ? 'Nhận diện thương hiệu' : selectedTrend.prefill.campaignType === 'sales' ? 'Thúc đẩy doanh số' : 'Tương tác & Giữ chân'}
                    </span>
                  </div>
                  <div className="bg-surface-container-low p-4 rounded-2xl">
                    <h4 className="text-label-sm font-headline-md text-primary mb-1">Khách hàng hướng tới:</h4>
                    <p className="text-xs leading-relaxed mt-1">{selectedTrend.prefill.customerProfile}</p>
                  </div>
                </div>

                <div className="bg-surface-container-low p-4 rounded-2xl space-y-3">
                  <div>
                    <h4 className="text-label-sm font-headline-md text-primary mb-0.5">Ý tưởng kịch bản:</h4>
                    <p className="text-xs leading-relaxed">{selectedTrend.prefill.description}</p>
                  </div>
                  <div className="pt-2 border-t border-surface-container-high">
                    <h4 className="text-label-sm font-headline-md text-primary mb-0.5">Mục tiêu chính:</h4>
                    <p className="text-xs font-semibold text-secondary">{selectedTrend.prefill.primaryGoal}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-2">
                <button
                  onClick={() => setSelectedTrend(null)}
                  className="flex-1 py-3.5 rounded-full border border-outline hover:bg-surface-container transition-all font-label-sm text-label-sm text-on-surface"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    handleCreateScript(selectedTrend);
                    setSelectedTrend(null);
                  }}
                  className="flex-1 bg-secondary text-on-secondary font-label-sm text-label-sm py-3.5 rounded-full hover:bg-secondary/95 transition-all flex items-center justify-center gap-2"
                >
                  <span>{selectedTrend.trendScope === 'SIMPLE_POST' ? 'Soạn thảo nhanh' : 'Tạo kịch bản'}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS keyframes */}
      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideUp {
          from { opacity: 0; transform: scale(0.95) translateY(16px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-modal-fade {
          animation: modalFadeIn 0.2s ease-out forwards;
        }
        .animate-modal-slide {
          animation: modalSlideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </section>
  );
}
