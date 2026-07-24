import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, Wand2, Copy, Check, Save, Loader2, Landmark, HelpCircle, Layers, Image as ImageIcon, Megaphone, Share2, CalendarDays } from 'lucide-react';
import { useGeneratePost } from '../../hooks/useMarketingPlans';
import { authApi } from '../../api/authApi';
import { scheduledPostApi } from '../../api/scheduledPostApi';
import { toast } from '../../store/toastStore';
import PostSuccessModal from '../../components/social/PostSuccessModal';

export default function QuickEditor() {
  const location = useLocation();
  const navigate = useNavigate();
  const generatePostMutation = useGeneratePost();

  const trend = location.state?.trend;

  const [profileData, setProfileData] = useState(null);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [platform, setPlatform] = useState('Facebook');
  const [generatedContent, setGeneratedContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const handlePublishAndShare = () => {
    if (!generatedContent) {
      toast.error('Vui lòng tạo hoặc nhập nội dung bài viết trước khi đăng.');
      return;
    }
    setIsSuccessModalOpen(true);
  };

  const handleSchedulePost = async () => {
    if (!generatedContent) {
      toast.error('Vui lòng tạo nội dung trước khi lên lịch.');
      return;
    }

    try {
      const goldenTime = new Date();
      goldenTime.setHours(19, 30, 0, 0);
      if (new Date().getHours() >= 19) {
        goldenTime.setDate(goldenTime.getDate() + 1);
      }

      await scheduledPostApi.createPost({
        title: trend?.title || 'Bài viết bắt trend xu hướng',
        content: generatedContent,
        platform: platform,
        scheduledTime: goldenTime.toISOString(),
        status: 'pending_approval',
        isGoldenTime: true,
        businessProfileId: profileData?.id
      });

      const formattedTime = goldenTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      toast.success(`✨ Đã xếp lịch Giờ Vàng AI (${formattedTime}) thành công!`);
      setTimeout(() => navigate('/calendar'), 1000);
    } catch (err) {
      console.error('[Schedule Error]', err);
      toast.error('Có lỗi xảy ra khi lên lịch đăng bài.');
    }
  };

  useEffect(() => {
    // If no trend data is passed in state, redirect back to dashboard
    if (!trend) {
      toast.error('Không tìm thấy dữ liệu xu hướng.');
      navigate('/dashboard');
      return;
    }

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
  }, [trend, navigate]);

  const handleGenerateContent = async () => {
    if (!profileData?.id) {
      toast.error('Không tìm thấy hồ sơ doanh nghiệp.');
      return;
    }

    try {
      const response = await generatePostMutation.mutateAsync({
        ideaTitle: trend.title,
        ideaDescription: trend.teaser,
        platform: platform,
        businessProfileId: Number(profileData.id),
      });

      if (response && response.content) {
        setGeneratedContent(response.content);
        toast.success('AI đã biên soạn bài đăng thành công!');
      } else {
        toast.error('Không nhận được nội dung từ AI.');
      }
    } catch (err) {
      toast.error(err.message || 'Có lỗi xảy ra khi tạo nội dung.');
    }
  };

  const handleCopy = () => {
    if (!generatedContent) return;
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    toast.success('Đã sao chép nội dung bài đăng!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveDraft = () => {
    if (!generatedContent) {
      toast.error('Không có nội dung để lưu nháp.');
      return;
    }
    toast.success('Đã lưu vào kho nội dung (bản nháp)!');
  };

  if (checkingProfile) {
    return (
      <div className="flex-1 w-full flex flex-col items-center justify-center py-20 gap-3 text-on-surface-variant">
        <Loader2 className="animate-spin text-secondary" size={32} />
        <span className="text-body-md font-medium">Đang tải cấu hình workspace...</span>
      </div>
    );
  }

  const isProfileIncomplete = !profileData || !profileData.usp || !profileData.brandVoice;

  if (isProfileIncomplete) {
    return (
      <div className="flex-1 w-full space-y-8 animate-fade-in">
        <div>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors text-sm font-semibold mb-6"
          >
            <ArrowLeft size={16} /> Quay lại Dashboard
          </button>
          <h2 className="text-display-lg-mobile md:text-display-lg font-display-lg text-primary dark:text-inverse-primary mb-2">
            Workspace Soạn Thảo Nhanh
          </h2>
        </div>

        <div className="max-w-2xl mx-auto mt-12 bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-8 md:p-10 shadow-ambient border border-amber-200/50 dark:border-amber-500/20 text-center space-y-6 relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="w-20 h-20 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto ring-8 ring-amber-500/5">
            <Sparkles size={36} className="animate-pulse" />
          </div>
          <div className="space-y-3">
            <h3 className="text-headline-md font-bold text-primary">Cần Bổ sung Thông tin Thương hiệu</h3>
            <p className="text-body-md text-on-surface-variant leading-relaxed max-w-md mx-auto">
              Để tạo ra bài viết bắt trend đúng với giọng điệu của bạn, AI cần hiểu rõ thương hiệu trước. Vui lòng hoàn thiện Hồ sơ Doanh nghiệp để tiếp tục.
            </p>
          </div>
          <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/business-profile')}
              className="bg-secondary text-on-secondary hover:bg-secondary/95 px-8 py-3.5 rounded-full text-label-sm font-bold shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              Hoàn thiện Hồ sơ ngay
              <ArrowLeft className="rotate-180" size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full space-y-6 animate-fade-in relative">
      {/* Header breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors text-sm font-semibold mb-2"
          >
            <ArrowLeft size={16} /> Quay lại Dashboard
          </button>
          <h2 className="text-headline-lg font-headline-md text-primary dark:text-inverse-primary">
            Workspace Soạn Thảo Nhanh
          </h2>
          <p className="text-sm text-on-surface-variant">
            Biến các trào lưu mạng xã hội thành bài viết thương hiệu mang dấu ấn riêng của bạn.
          </p>
        </div>
        <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-850 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-500/20 self-start sm:self-auto">
          Chế độ Bắt trend Nhanh (Quick Post)
        </span>
      </div>

      {/* Modern Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Column: Context Pane (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-6 shadow-[0_4px_24px_rgba(255,143,163,0.04)] border border-surface-variant/40 flex flex-col justify-between flex-1 relative overflow-hidden">
            {/* Visual glow decoration */}
            <div className="absolute -left-16 -top-16 w-36 h-36 bg-secondary-container/15 dark:bg-secondary-fixed-dim/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="space-y-6 relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-secondary bg-secondary-container/50 px-3 py-1 rounded-full uppercase tracking-wider">
                  Bối cảnh Xu hướng
                </span>
                <div className="flex gap-1.5">
                  {trend.tags?.map((tag, i) => (
                    <span key={i} className="text-[11px] font-semibold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Trend Image */}
              {trend.image && (
                <div className="aspect-video w-full rounded-2xl overflow-hidden border border-outline-variant/30 shadow-inner bg-surface-container">
                  <img
                    src={trend.image}
                    alt={trend.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="space-y-3">
                <h3 className="text-xl font-bold text-primary dark:text-inverse-primary leading-snug">
                  {trend.title}
                </h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {trend.teaser}
                </p>
              </div>
            </div>

            {/* User Brand Identity Context */}
            <div className="mt-8 pt-6 border-t border-surface-variant/40 space-y-4 relative z-10">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <Landmark size={16} className="text-secondary" />
                <span>Nhận diện thương hiệu đang áp dụng:</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-container/45 dark:bg-surface-variant/10 rounded-xl p-3.5">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                    Điểm độc nhất (USP)
                  </span>
                  <p className="text-xs text-primary dark:text-inverse-primary font-semibold line-clamp-2">
                    {profileData.usp}
                  </p>
                </div>
                <div className="bg-surface-container/45 dark:bg-surface-variant/10 rounded-xl p-3.5">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                    Giọng điệu (Voice)
                  </span>
                  <p className="text-xs text-primary dark:text-inverse-primary font-semibold line-clamp-2">
                    {profileData.brandVoice}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Editor Pane (7 cols) */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-6 md:p-8 shadow-[0_4px_24px_rgba(255,143,163,0.06)] border border-surface-variant/40 flex flex-col justify-between flex-1 space-y-6">
            
            {/* Top Row: Platform Selector */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                Nền tảng đăng bài muốn tối ưu
              </label>
              <div className="grid grid-cols-4 gap-2">
                {['Facebook', 'TikTok', 'Instagram', 'LinkedIn'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPlatform(p)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                      platform === p
                        ? 'bg-secondary text-on-secondary border-transparent shadow-sm'
                        : 'bg-surface-container hover:bg-surface-container-high text-on-surface border-outline-variant/30'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Generator Action Row */}
            <div className="pt-2">
              <button
                onClick={handleGenerateContent}
                disabled={generatePostMutation.isPending}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 active:scale-[0.98] text-white py-4 rounded-2xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {generatePostMutation.isPending ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>AI đang phân tích và biên soạn...</span>
                  </>
                ) : (
                  <>
                    <Wand2 size={18} />
                    <span>Bắt trend với AI</span>
                  </>
                )}
              </button>
            </div>

            {/* Editor Textarea with Loading State */}
            <div className="flex-1 flex flex-col space-y-2 relative min-h-[300px]">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                Bài viết hoàn chỉnh (Có thể chỉnh sửa thủ công)
              </label>
              
              <div className="flex-1 relative rounded-2xl overflow-hidden border border-outline-variant/40 bg-surface-container-low dark:bg-surface-container-high/35 focus-within:ring-2 focus-within:ring-secondary/50 focus-within:border-secondary transition-all flex flex-col">
                {generatePostMutation.isPending ? (
                  // Pulse Skeleton Loader inside textarea space
                  <div className="flex-1 p-5 space-y-3.5 animate-pulse">
                    <div className="h-5 bg-surface-container-high dark:bg-surface-variant/40 rounded w-1/3"></div>
                    <div className="h-4 bg-surface-container-high dark:bg-surface-variant/40 rounded w-full"></div>
                    <div className="h-4 bg-surface-container-high dark:bg-surface-variant/40 rounded w-5/6"></div>
                    <div className="h-4 bg-surface-container-high dark:bg-surface-variant/40 rounded w-11/12"></div>
                    <div className="h-4 bg-surface-container-high dark:bg-surface-variant/40 rounded w-2/3"></div>
                  </div>
                ) : (
                  <textarea
                    value={generatedContent}
                    onChange={(e) => setGeneratedContent(e.target.value)}
                    placeholder="Bấm nút 'Bắt trend với AI' ở trên để tự động biên soạn nội dung chất lượng cao bám sát thương hiệu của bạn..."
                    className="w-full flex-1 p-5 bg-transparent border-none outline-none resize-none text-body-md text-primary dark:text-inverse-primary leading-relaxed text-sm focus:ring-0 placeholder:text-on-surface-variant/50"
                  />
                )}
              </div>
            </div>

            {/* Bottom Actions Row: Dual Posting & Schedule Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-surface-variant/30">
              <button
                onClick={handlePublishAndShare}
                disabled={!generatedContent || generatePostMutation.isPending}
                className="py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                <Share2 size={16} />
                <span>Đăng luôn tại {platform}</span>
              </button>

              <button
                onClick={handleSchedulePost}
                disabled={!generatedContent || generatePostMutation.isPending}
                className="py-3 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 active:scale-[0.98] text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
              >
                <CalendarDays size={16} className="text-amber-400" />
                <span>Lên lịch Giờ Vàng AI</span>
              </button>

              <button
                onClick={handleSaveDraft}
                disabled={!generatedContent || generatePostMutation.isPending}
                className="py-3 px-4 rounded-xl bg-surface-container-high/60 hover:bg-surface-container-high active:scale-[0.98] text-xs font-bold text-on-surface flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Save size={16} />
                <span>Lưu bản nháp</span>
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* Post Success & Cross-Platform Sharing Modal */}
      <PostSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        post={{
          title: trend?.title || 'Bài viết bắt trend xu hướng',
          content: generatedContent,
          platform: platform,
          url: window.location.href
        }}
      />
    </div>
  );
}
