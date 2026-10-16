import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Store, Users, Target, Wand2, ArrowRight, ChevronDown, Check, Loader2, Sparkles, Layers } from 'lucide-react';
import { useGeneratePlan } from '../../hooks/useMarketingPlans';
import { toast } from '../../store/toastStore';
import { authApi } from '../../api/authApi';
import AILoadingScreen from '../../components/ai/AILoadingScreen';
import MoneyInput from '../../components/ui/MoneyInput';

export default function GenerateMarketingKit() {
  const navigate = useNavigate();
  const location = useLocation();
  const generatePlan = useGeneratePlan();
  const [activeStep, setActiveStep] = useState(2);
  const [profileData, setProfileData] = useState(null);
  const [checkingProfile, setCheckingProfile] = useState(true);

  const trendData = location.state?.trend;

  // Form states
  const [businessType, setBusinessType] = useState('ecommerce');
  const [campaignType, setCampaignType] = useState(trendData?.campaignType || 'awareness');
  const [description, setDescription] = useState(
    trendData?.description || "Dòng sản phẩm chăm sóc da hữu cơ mùa hè được thiết kế đặc biệt để bảo vệ da khỏi cái nóng cực độ, với các thành phần thực vật chất lượng cao."
  );
  const [customerProfile, setCustomerProfile] = useState(
    trendData?.customerProfile || "Khách hàng Gen-Z có ý thức bảo vệ môi trường và quan tâm đến các thành phần thuần chay."
  );
  const [primaryGoal, setPrimaryGoal] = useState(trendData?.primaryGoal || "500 lượt đăng ký mới và tỷ lệ chuyển đổi 10%");
  const [budget, setBudget] = useState(1500000);
  const [channels, setChannels] = useState('');
  const [resources, setResources] = useState('');
  const [campaignReason, setCampaignReason] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const verifyProfile = async () => {
      try {
        const user = await authApi.me();
        if (user?.businessProfile) {
          setProfileData(user.businessProfile);
        }
      } catch (err) {
        console.error('Failed to verify business profile:', err);
      } finally {
        setCheckingProfile(false);
      }
    };
    verifyProfile();
  }, []);

  if (checkingProfile) {
    return (
      <div className="flex-1 w-full flex flex-col items-center justify-center py-20 gap-3 text-on-surface-variant">
        <Loader2 className="animate-spin text-secondary" size={32} />
        <span className="text-body-md font-medium">Đang xác thực thông tin doanh nghiệp...</span>
      </div>
    );
  }

  const isProfileIncomplete = !profileData || !profileData.usp || !profileData.brandVoice;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (budget !== '' && Number(budget) === 0) {
      toast.error('Ngân sách ước tính không thể bằng 0. Vui lòng nhập ngân sách lớn hơn 0 hoặc để trống.');
      return;
    }
    setIsLoading(true);
    try {
      const plan = await generatePlan.mutateAsync({
        businessType,
        campaignType,
        productDescription: description,
        targetCustomer: customerProfile,
        goal: primaryGoal,
        budget: budget === '' ? undefined : budget,
        deploymentChannels: channels,
        existingResources: resources,
        campaignReason,
      });
      toast.success('Kế hoạch marketing đã được tạo!');
      navigate(`/marketing-kit/result?planId=${plan.id}`);
    } catch (err) {
      toast.error(err.message || 'Không thể tạo kế hoạch');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full space-y-8 relative">
      {/* Header Info */}
      <div>
        <h2 className="text-display-lg-mobile md:text-display-lg font-display-lg text-primary dark:text-inverse-primary mb-2">
          Tạo Bộ công cụ Marketing
        </h2>
        <p className="text-body-lg text-on-surface-variant max-w-2xl">
          Xác định các thông số chiến dịch của bạn bên dưới. AI của chúng tôi sẽ thiết lập một chiến lược tiếp thị thống nhất phù hợp chính xác với nhu cầu của bạn chỉ trong vài giây.
        </p>
      </div>

      {/* Non-blocking Brand Profile Notice Banner */}
      {isProfileIncomplete && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-300/60 dark:border-amber-700/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2.5">
            <Sparkles className="text-amber-600 dark:text-amber-400 shrink-0" size={18} />
            <span>
              <strong>Gợi ý:</strong> Bạn chưa thiết lập đầy đủ USP hoặc Brand Voice. Bạn vẫn có thể tạo chiến dịch ngay bây giờ, nhưng hoàn thiện hồ sơ sẽ giúp AI tối ưu ngôn phong và định vị chuẩn xác hơn.
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/business-profile')}
            className="whitespace-nowrap px-4 py-1.5 rounded-full bg-amber-200 dark:bg-amber-900/60 hover:bg-amber-300 text-amber-950 dark:text-amber-100 font-bold text-xs transition-colors shrink-0"
          >
            Bổ sung hồ sơ →
          </button>
        </div>
      )}

      {/* Stepper tracker */}
      <div className="mb-10 flex items-center justify-between relative max-w-2xl mx-auto py-2">
        {/* Connection progress bar line background */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-[2px] bg-slate-200 -z-10" />
        <div className="absolute top-1/2 -translate-y-1/2 left-0 w-[50%] h-[2px] bg-slate-900 -z-10" />

        {/* Step 1: Basics */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-900 text-white ring-4 ring-white shadow-xs">
            <Check size={16} />
          </div>
          <span className="text-xs font-semibold text-slate-700">Cơ bản</span>
        </div>

        {/* Step 2: Details */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[#FFCED2] text-slate-900 ring-4 ring-white shadow-xs font-bold text-sm">
            2
          </div>
          <span className="text-xs font-bold text-slate-900">Chi tiết</span>
        </div>

        {/* Step 3: Review */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-100 text-slate-400 ring-4 ring-white font-semibold text-sm">
            3
          </div>
          <span className="text-xs font-medium text-slate-400">Xem lại</span>
        </div>
      </div>

      {/* Trend Prefill Notification Banner */}
      {trendData && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FFCED2] flex items-center justify-center text-slate-900 shrink-0">
              <Sparkles size={16} />
            </div>
            <p className="text-slate-800 font-medium text-sm">
              Đang áp dụng dữ liệu gợi ý từ xu hướng tiếp thị. Bạn có thể tự do điều chỉnh các thông tin bên dưới.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setCampaignType('awareness');
              setDescription('Dòng sản phẩm chăm sóc da hữu cơ mùa hè được thiết kế đặc biệt để bảo vệ da khỏi cái nóng cực độ, với các thành phần thực vật chất lượng cao.');
              setCustomerProfile('Khách hàng Gen-Z có ý thức bảo vệ môi trường và quan tâm đến các thành phần thuần chay.');
              setPrimaryGoal('500 lượt đăng ký mới và tỷ lệ chuyển đổi 10%');
              navigate(location.pathname, { replace: true, state: {} });
            }}
            className="text-xs text-slate-900 hover:text-slate-700 font-bold underline whitespace-nowrap"
          >
            Khôi phục mặc định
          </button>
        </div>
      )}

      {/* Bento Grid Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Context Card & Audience Card */}
        <div className="md:col-span-8 flex flex-col gap-6">
          {/* Business Context Card */}
          <div className="bg-white rounded-2xl p-7 shadow-sm border border-slate-200/80 space-y-5">
            <h3 className="text-xl text-slate-900 font-bold flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FFCED2] flex items-center justify-center text-slate-900 shrink-0">
                <Store size={18} />
              </div>
              Bối cảnh Doanh nghiệp
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label htmlFor="campaign-business-type" className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Loại hình Doanh nghiệp
                </label>
                <div className="relative">
                  <select
                    id="campaign-business-type"
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 appearance-none cursor-pointer focus:outline-none focus:border-slate-900 transition-all shadow-xs"
                  >
                    <option value="ecommerce">Thương mại điện tử</option>
                    <option value="saas">Phần mềm dịch vụ (SaaS)</option>
                    <option value="local">Dịch vụ địa phương</option>
                    <option value="agency">Đại lý / Tư vấn</option>
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={16} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="campaign-type" className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Loại hình Chiến dịch
                </label>
                <div className="relative">
                  <select
                    id="campaign-type"
                    value={campaignType}
                    onChange={(e) => setCampaignType(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 appearance-none cursor-pointer focus:outline-none focus:border-slate-900 transition-all shadow-xs"
                  >
                    <option value="awareness">Nhận diện Thương hiệu</option>
                    <option value="leads">Thu thập Khách hàng tiềm năng</option>
                    <option value="sales">Bán hàng Trực tiếp</option>
                    <option value="retention">Giữ chân Khách hàng</option>
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={16} />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="product-description" className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                Mô tả Sản phẩm / Dịch vụ
              </label>
              <textarea
                id="product-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả ngắn gọn những gì bạn đang tiếp thị. Nêu bật các lợi ích chính hoặc điểm bán hàng độc nhất (USP)..."
                rows={4}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 resize-none focus:outline-none focus:border-slate-900 transition-all shadow-xs leading-relaxed"
              />
            </div>
          </div>

          {/* Target Audience Card */}
          <div className="bg-white rounded-2xl p-7 shadow-sm border border-slate-200/80 space-y-4">
            <h3 className="text-xl text-slate-900 font-bold flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FFCED2] flex items-center justify-center text-slate-900 shrink-0">
                <Users size={18} />
              </div>
              Khách hàng Mục tiêu
            </h3>

            <div className="space-y-1.5">
              <label htmlFor="target-customer" className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                Chân dung Khách hàng Mục tiêu
              </label>
              <input
                id="target-customer"
                type="text"
                value={customerProfile}
                onChange={(e) => setCustomerProfile(e.target.value)}
                placeholder="Ví dụ: Chủ doanh nghiệp nhỏ từ 30-50 tuổi muốn tự động hóa quy trình làm việc"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-slate-900 transition-all shadow-xs"
              />
            </div>
          </div>

          {/* Deployment Details Card */}
          <div className="bg-white rounded-2xl p-7 shadow-sm border border-slate-200/80 space-y-4">
            <h3 className="text-xl text-slate-900 font-bold flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FFCED2] flex items-center justify-center text-slate-900 shrink-0">
                <Layers size={18} />
              </div>
              Chi tiết Triển khai
            </h3>

            <div className="space-y-1.5">
              <label htmlFor="deployment-channels" className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                Kênh triển khai
              </label>
              <input
                id="deployment-channels"
                type="text"
                value={channels}
                onChange={(e) => setChannels(e.target.value)}
                placeholder="Chiến dịch diễn ra chủ yếu ở đâu ? ( Tiktok, Facebook,...)"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-slate-900 transition-all shadow-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="existing-resources" className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                Tài nguyên hiện có
              </label>
              <input
                id="existing-resources"
                type="text"
                value={resources}
                onChange={(e) => setResources(e.target.value)}
                placeholder="Có ảnh chụp sản phẩm thật, có video feedback của khách,..."
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-slate-900 transition-all shadow-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="campaign-reason" className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                Lý do triển khai chiến dịch
              </label>
              <input
                id="campaign-reason"
                type="text"
                value={campaignReason}
                onChange={(e) => setCampaignReason(e.target.value)}
                placeholder="Cần xả kho, Nhân dịp Trung thu,..."
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-slate-900 transition-all shadow-xs"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Parameters and Checkout Button */}
        <div className="md:col-span-4 flex flex-col gap-6 justify-between">
          <div className="bg-white rounded-2xl p-7 shadow-sm border border-slate-200/80 space-y-5">
            <h3 className="text-xl text-slate-900 font-bold flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FFCED2] flex items-center justify-center text-slate-900 shrink-0">
                <Target size={18} />
              </div>
              Thông số
            </h3>

            <div className="space-y-1.5">
              <label htmlFor="primary-goal" className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                Mục tiêu Chính
              </label>
              <input
                id="primary-goal"
                type="text"
                value={primaryGoal}
                onChange={(e) => setPrimaryGoal(e.target.value)}
                placeholder="Ví dụ: 50 lượt đăng ký mới trong tháng này"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-slate-900 transition-all shadow-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="estimated-budget" className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                Ngân sách Ước tính (VND)
              </label>
              <MoneyInput
                id="estimated-budget"
                value={budget}
                onChange={setBudget}
                placeholder="1.000.000"
                inputClassName="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-16 py-3 text-sm text-slate-900 focus:outline-none focus:border-slate-900 transition-all shadow-xs"
              />
            </div>
          </div>

          {/* Submit action card */}
          <div className="bg-slate-900 rounded-2xl p-7 flex flex-col items-center justify-center text-center text-white shadow-lg border border-slate-800">
            <div className="w-14 h-14 rounded-2xl bg-[#FFCED2] flex items-center justify-center text-slate-900 mb-4 shadow-sm">
              <Wand2 size={28} />
            </div>
            <h4 className="text-xl text-white font-bold mb-2">Sẵn sàng Thiết lập?</h4>
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              Xem lại thông tin và để hệ thống AI khởi tạo toàn bộ chiến dịch tối ưu cho bạn.
            </p>
            <button
              type="submit"
              className="w-full bg-[#FFCED2] hover:bg-[#ffbfc5] text-slate-900 py-3.5 px-6 rounded-xl transition-all font-bold text-sm flex justify-center items-center gap-2 shadow-sm"
            >
              Tạo Bộ công cụ Marketing
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </form>

      {/* AI Loading Overlay */}
      {isLoading && <AILoadingScreen />}
    </div>
  );
}
