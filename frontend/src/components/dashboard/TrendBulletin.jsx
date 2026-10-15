import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Sparkles, Flame, Zap, Award, ArrowRight, X, RefreshCw } from 'lucide-react';
import { marketingPlanApi } from '../../api/marketingPlanApi';
import { toast } from '../../store/toastStore';

const TRENDS = [
  {
    id: 1,
    title: "Trend 'Thông báo mất tích': Biến sự cố thành Content triệu view!",
    tags: ["#Fastvertising", "#HàiHước", "#Viral"],
    trendScope: "SIMPLE_POST",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80",
    teaser: "Lô hàng 12 tấn KitKat biến mất và cách các thương hiệu lớn 'mượn cớ' thông báo thất lạc để giật spotlight. Shop của bạn có gì để báo 'mất tích' không?",
    iconName: "Flame",
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
    iconName: "Zap",
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
    iconName: "Award",
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

function getTrendIcon(iconName) {
  switch (iconName) {
    case 'Zap':
      return Zap;
    case 'Award':
      return Award;
    case 'Flame':
    default:
      return Flame;
  }
}

export default function TrendBulletin() {
  const navigate = useNavigate();
  const [trendsList, setTrendsList] = useState(TRENDS);
  const [selectedTrend, setSelectedTrend] = useState(null);
  const [isLoadingTrends, setIsLoadingTrends] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadTrends() {
      try {
        setIsLoadingTrends(true);
        const data = await marketingPlanApi.getTrends();
        if (mounted && Array.isArray(data) && data.length > 0) {
          setTrendsList(data);
        }
      } catch (err) {
        console.warn('Could not load dynamic trends, using curated defaults:', err.message);
      } finally {
        if (mounted) setIsLoadingTrends(false);
      }
    }
    loadTrends();
    return () => { mounted = false; };
  }, []);

  const handleRefreshTrends = async () => {
    try {
      setIsRefreshing(true);
      const data = await marketingPlanApi.refreshTrends();
      if (Array.isArray(data) && data.length > 0) {
        setTrendsList(data);
        toast.success('✨ Đã làm mới các trào lưu tiếp thị AI thành công!');
      }
    } catch (err) {
      toast.error('Không thể làm mới trào lưu: ' + (err.message || 'Lỗi kết nối'));
    } finally {
      setIsRefreshing(false);
    }
  };

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

  const ActiveIcon = selectedTrend ? (selectedTrend.icon || getTrendIcon(selectedTrend.iconName)) : null;

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900">
            <TrendingUp size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 tracking-tight">
              Bản tin Xu hướng <Sparkles className="text-amber-500 animate-pulse" size={16} />
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cập nhật các trào lưu marketing nóng hổi và tạo kịch bản ngay chỉ với một cú nhấp.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRefreshTrends}
          disabled={isRefreshing || isLoadingTrends}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-sm self-start sm:self-auto disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
          <span>{isRefreshing ? "AI đang săn trend..." : "Làm mới trào lưu AI"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {trendsList.map((trend) => {
          const IconComponent = trend.icon || getTrendIcon(trend.iconName);
          return (
            <div
              key={trend.id}
              onClick={() => setSelectedTrend(trend)}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 flex flex-col justify-between border border-slate-200/80 group relative overflow-hidden cursor-pointer"
            >
              <div>
                {/* Header card with Icon & Tags & Scope Badge */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${trend.iconColor}`}>
                    <IconComponent size={20} />
                  </div>
                  <div className="flex flex-wrap gap-1.5 justify-end items-center">
                    {trend.trendScope === 'SIMPLE_POST' ? (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Bài đăng nhanh
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        Chiến dịch
                      </span>
                    )}
                    {trend.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${trend.badgeColor}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <h4 className="text-sm font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-black transition-colors leading-snug">
                  {trend.title}
                </h4>

                {/* Teaser */}
                <p className="text-xs text-slate-500 line-clamp-3 mb-6 leading-relaxed">
                  {trend.teaser}
                </p>
              </div>

              {/* Action Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCreateScript(trend);
                }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white transition-colors hover:bg-slate-800 shadow-sm"
              >
                <span>{trend.trendScope === 'SIMPLE_POST' ? 'Soạn thảo nhanh' : 'Tạo kịch bản'}</span>
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Detail Modal Popup */}
      {selectedTrend && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-modal-fade"
          onClick={() => setSelectedTrend(null)}
        >
          <div 
            className="bg-white rounded-2xl p-6 md:p-8 max-w-xl w-full border border-slate-200 shadow-2xl relative overflow-hidden animate-modal-slide text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Container */}
            <div className="space-y-5 relative z-10">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${selectedTrend.iconColor}`}>
                    {ActiveIcon && <ActiveIcon size={22} />}
                  </div>
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {selectedTrend.trendScope === 'SIMPLE_POST' ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Bài đăng nhanh
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        Chiến dịch
                      </span>
                    )}
                    {selectedTrend.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${selectedTrend.badgeColor}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTrend(null)}
                  className="p-1.5 rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-700"
                >
                  <X size={18} />
                </button>
              </div>

              <div>
                <h3 className="text-lg md:text-xl font-bold text-slate-900 leading-snug">
                  {selectedTrend.title}
                </h3>
              </div>

              <div className="space-y-3.5 text-xs text-slate-600 max-h-[50vh] overflow-y-auto pr-1">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Mô tả trào lưu:</h4>
                  <p className="leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    {selectedTrend.teaser}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Loại chiến dịch gợi ý:</h4>
                    <span className="inline-block bg-slate-200/80 text-slate-800 px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1">
                      {selectedTrend.prefill.campaignType === 'awareness' ? 'Nhận diện thương hiệu' : selectedTrend.prefill.campaignType === 'sales' ? 'Thúc đẩy doanh số' : 'Tương tác & Giữ chân'}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Khách hàng hướng tới:</h4>
                    <p className="text-xs leading-relaxed mt-1">{selectedTrend.prefill.customerProfile}</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2.5">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-0.5">Ý tưởng kịch bản:</h4>
                    <p className="text-xs leading-relaxed text-slate-600">{selectedTrend.prefill.description}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-200/70">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-0.5">Mục tiêu chính:</h4>
                    <p className="text-xs font-semibold text-slate-800">{selectedTrend.prefill.primaryGoal}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setSelectedTrend(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all text-xs font-bold text-slate-700"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    handleCreateScript(selectedTrend);
                    setSelectedTrend(null);
                  }}
                  className="flex-1 bg-slate-900 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-sm"
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
