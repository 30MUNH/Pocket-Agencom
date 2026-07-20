import { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Lightbulb, Heart, Mail, FileText, ClipboardCheck, Check, PlayCircle, Play, Video, Copy, BookOpen, RefreshCw, Download, Clock, Loader2, Target, Sparkles, Image as ImageIcon, Upload, X, Wand2, Users, Search } from 'lucide-react';
import { useMarketingPlan, useSavePlan, useGeneratePost, useGeneratePostWithImage } from '../../hooks/useMarketingPlans';
import { useQuery } from '@tanstack/react-query';
import { kolApi } from '../../api/kolApi';
import { useAuthStore } from '../../store/authStore';
import { toast } from '../../store/toastStore';
import BudgetBreakdownCard from '../../components/marketing/BudgetBreakdownCard';
import RevisionChatPanel from '../../components/marketing/RevisionChatPanel';

/**
 * Splits AI Advisor output into { postContent, designTips }.
 * Expected markers: [NỘI DUNG BÀI ĐĂNG] and [GỢI Ý THIẾT KẾ].
 * Falls back to treating the whole text as post content.
 */
function parseAdvisorContent(text) {
  if (!text) return { postContent: '', designTips: '' };

  const postMarker = /\[NỘI DUNG BÀI ĐĂNG\]/i;
  const designMarker = /\[GỢI Ý THIẾT KẾ\]/i;

  const designIdx = text.search(designMarker);
  if (designIdx === -1) {
    return { postContent: text.replace(postMarker, '').trim(), designTips: '' };
  }

  const postContent = text
    .slice(0, designIdx)
    .replace(postMarker, '')
    .trim();
  const designTips = text
    .slice(designIdx)
    .replace(designMarker, '')
    .trim();

  return { postContent, designTips };
}

function renderBoldText(text) {
  if (!text) return '';
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, idx) => {
    if (idx % 2 === 1) {
      return (
        <strong 
          key={idx} 
          className="font-bold text-secondary dark:text-secondary-fixed bg-secondary-container/30 dark:bg-secondary/15 px-1.5 py-0.5 rounded-md inline shadow-sm text-sm"
        >
          {part}
        </strong>
      );
    }
    return part;
  });
}

function IdeaCard({ idea, index, totalLength, businessProfileId, existingResources, campaignReason }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [detailedContent, setDetailedContent] = useState('');
  const [designTips, setDesignTips] = useState('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // AI Advisor image upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const generatePostMutation = useGeneratePost();
  const generatePostWithImageMutation = useGeneratePostWithImage();

  useEffect(() => {
    // Revoke the object URL when the preview changes/unmounts to avoid leaks
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleSelectFile = (file) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Chỉ hỗ trợ ảnh JPEG, PNG hoặc WebP.');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error('Ảnh vượt quá 4MB. Vui lòng chọn ảnh nhỏ hơn.');
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveFile = (e) => {
    e.stopPropagation();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleSelectFile(e.dataTransfer.files?.[0]);
  };

  const handleGeneratePost = async () => {
    const basePayload = {
      ideaTitle: idea.title,
      ideaDescription: idea.description,
      platform: idea.channel || 'Đa kênh',
      businessProfileId: Number(businessProfileId),
      existingResources: existingResources || undefined,
      campaignReason: campaignReason || undefined,
    };

    try {
      if (selectedFile) {
        // Multi-modal: image + context → post content + design advice
        const response = await generatePostWithImageMutation.mutateAsync({
          ...basePayload,
          file: selectedFile,
        });

        if (response && response.content) {
          const { postContent, designTips: tips } = parseAdvisorContent(response.content);
          setDetailedContent(postContent);
          setDesignTips(tips);
          setUploadedImageUrl(response.imageUrl || '');
          setIsExpanded(true);
        } else {
          toast.error('Không nhận được nội dung từ AI.');
        }
      } else {
        const response = await generatePostMutation.mutateAsync(basePayload);

        if (response && response.content) {
          setDetailedContent(response.content);
          setDesignTips('');
          setIsExpanded(true);
        } else {
          toast.error('Không nhận được nội dung từ AI.');
        }
      }
    } catch (err) {
      toast.error(err.message || err.response?.data?.message || 'Có lỗi xảy ra khi tạo nội dung.');
    }
  };

  const handleCopyPost = () => {
    navigator.clipboard.writeText(detailedContent);
    setCopied(true);
    toast.success('Đã sao chép bài đăng!');
    setTimeout(() => setCopied(false), 2000);
  };

  const isGeneratingPost = generatePostMutation.isPending || generatePostWithImageMutation.isPending;

  if (isGeneratingPost) {
    return (
      <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-8 border border-secondary-container/30 shadow-[0_4px_24px_rgba(255,143,163,0.08)] flex flex-col h-full animate-pulse min-h-[320px]">
        <div className="flex justify-between items-start mb-6">
          <div className="h-4 w-16 bg-surface-container-high dark:bg-surface-variant/40 rounded"></div>
          <Heart className="text-secondary-container dark:text-outline-variant opacity-50" size={18} />
        </div>
        <div className="h-6 w-3/4 bg-surface-container-high dark:bg-surface-variant/40 rounded mb-4"></div>
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-surface-container-high dark:bg-surface-variant/40 rounded w-full"></div>
          <div className="h-4 bg-surface-container-high dark:bg-surface-variant/40 rounded w-5/6"></div>
          <div className="h-4 bg-surface-container-high dark:bg-surface-variant/40 rounded w-2/3"></div>
        </div>
        <div className="mt-6 flex items-center justify-center gap-2 py-3 bg-secondary-container/20 rounded-xl">
          <Loader2 className="animate-spin text-secondary" size={16} />
          <span className="text-xs font-bold text-secondary">
            {selectedFile ? 'AI đang phân tích ảnh & biên soạn bài đăng...' : 'Đang biên soạn bài đăng...'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-8 shadow-[0_4px_24px_rgba(255,143,163,0.08)] hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(255,143,163,0.12)] transition-all duration-500 ease-out flex flex-col h-full border border-transparent hover:border-secondary-container/50 ${
        index === totalLength - 1 && !isExpanded
          ? 'bg-gradient-to-br from-surface-container-lowest to-secondary-container/10 dark:to-secondary-fixed-dim/5'
          : ''
      } ${isExpanded ? 'md:col-span-3 border-secondary/30 ring-1 ring-secondary/15' : ''}`}
    >
      <div className="flex justify-between items-start mb-6">
        <span className="text-label-sm font-label-sm text-secondary dark:text-secondary-fixed uppercase tracking-widest">
          {idea.channel || 'Đa kênh'}
        </span>
        <Heart className="text-secondary-container dark:text-outline-variant cursor-pointer hover:fill-secondary" size={18} />
      </div>

      <h4 className="text-lg font-bold text-primary dark:text-inverse-primary mb-3">
        {idea.title}
      </h4>

      <div className="flex-1 flex flex-col justify-between">
        <div className="transition-all duration-500 ease-in-out">
          {isExpanded ? (
            <div className="animate-fade-in space-y-4">
              {/* [NỘI DUNG BÀI ĐĂNG] — ready-to-publish caption */}
              <p className="text-body-md text-on-surface-variant whitespace-pre-wrap leading-relaxed">
                {detailedContent}
              </p>

              {/* [GỢI Ý THIẾT KẾ] — AI Advisor design suggestions */}
              {designTips && (
                <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/5 border border-amber-200/70 dark:border-amber-500/20 p-5 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-amber-400/90 flex items-center justify-center shadow-sm shrink-0">
                      <Lightbulb size={15} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-amber-800 dark:text-amber-300 leading-tight">
                        Gợi ý Thiết kế từ AI Advisor
                      </p>
                      <p className="text-[11px] text-amber-700/70 dark:text-amber-400/60">
                        Cách chỉnh sửa chính tấm ảnh của bạn để đăng bài chuyên nghiệp hơn
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-amber-900/90 dark:text-amber-100/80 whitespace-pre-wrap leading-relaxed pl-1">
                    {designTips}
                  </div>
                </div>
              )}

              {/* Image Gallery Grid — user's uploaded image takes the first slot */}
              <div className="grid grid-cols-3 gap-2 mt-6">
                <div className="aspect-square rounded-xl bg-gradient-to-tr from-pink-500/20 to-purple-500/20 dark:from-pink-500/10 dark:to-purple-500/10 border border-secondary-container/20 overflow-hidden relative group">
                  {previewUrl || uploadedImageUrl ? (
                    <>
                      <img
                        src={previewUrl || uploadedImageUrl}
                        alt="Ảnh của bạn"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                        Ảnh của bạn
                      </span>
                    </>
                  ) : (
                    <img
                      src="https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=200&q=80"
                      alt="Mockup 1"
                      className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                </div>
                <div className="aspect-square rounded-xl bg-gradient-to-tr from-pink-500/20 to-purple-500/20 dark:from-pink-500/10 dark:to-purple-500/10 border border-secondary-container/20 overflow-hidden relative group">
                  <img 
                    src="https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?auto=format&fit=crop&w=200&q=80" 
                    alt="Mockup 2" 
                    className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>
                <div className="aspect-square rounded-xl bg-gradient-to-tr from-pink-500/20 to-purple-500/20 dark:from-pink-500/10 dark:to-purple-500/10 border border-secondary-container/20 overflow-hidden relative group cursor-pointer">
                  <img 
                    src="https://images.unsplash.com/photo-1611606063065-ee7946f0787a?auto=format&fit=crop&w=200&q=80" 
                    alt="Mockup 3" 
                    className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px] group-hover:bg-black/55 transition-colors">
                    <span className="text-white text-xs font-bold font-display">+6 ảnh</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-body-md text-on-surface-variant leading-relaxed">
              {idea.description}
            </p>
          )}
        </div>

        <div>
          <div className="flex flex-wrap gap-2 mt-6">
            {idea.format && (
              <span className="bg-surface-container dark:bg-surface-variant/40 px-3 py-1 rounded-md text-xs text-on-surface-variant dark:text-inverse-on-surface">
                {idea.format}
              </span>
            )}
            <span className="bg-surface-container dark:bg-surface-variant/40 px-3 py-1 rounded-md text-xs text-on-surface-variant dark:text-inverse-on-surface">
              {idea.channel || 'Marketing'}
            </span>
          </div>

          {isExpanded ? (
            <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-surface-variant/30 animate-fade-in">
              <button
                onClick={handleCopyPost}
                className="py-2.5 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high active:scale-[0.98] text-xs font-bold text-primary flex items-center justify-center gap-1.5 transition-all"
              >
                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                {copied ? 'Đã sao chép!' : 'Sao chép'}
              </button>
              <button
                onClick={handleGeneratePost}
                className="py-2.5 px-4 rounded-xl bg-secondary-container/30 hover:bg-secondary-container/50 active:scale-[0.98] text-xs font-bold text-secondary flex items-center justify-center gap-1.5 transition-all"
              >
                <RefreshCw size={14} />
                Tạo lại
              </button>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {/* AI Advisor image dropzone */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => handleSelectFile(e.target.files?.[0])}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`relative rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden ${
                  isDragging
                    ? 'border-secondary bg-secondary-container/30 scale-[1.01]'
                    : selectedFile
                      ? 'border-secondary/50 bg-secondary-container/10'
                      : 'border-outline-variant/50 hover:border-secondary/60 hover:bg-surface-container/50'
                }`}
              >
                {selectedFile ? (
                  <div className="flex items-center gap-3 p-3">
                    <img
                      src={previewUrl}
                      alt="Ảnh đã chọn"
                      className="w-14 h-14 rounded-lg object-cover shrink-0 border border-secondary-container/40"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-primary dark:text-inverse-primary truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-[11px] text-secondary dark:text-secondary-fixed font-medium flex items-center gap-1 mt-0.5">
                        <Wand2 size={11} />
                        AI sẽ phân tích ảnh & tư vấn thiết kế
                      </p>
                    </div>
                    <button
                      onClick={handleRemoveFile}
                      aria-label="Xóa ảnh"
                      className="w-7 h-7 rounded-full bg-surface-container hover:bg-error/10 hover:text-error text-on-surface-variant flex items-center justify-center shrink-0 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 py-4 px-3 text-center">
                    <div className="w-8 h-8 rounded-full bg-surface-container dark:bg-surface-variant/30 flex items-center justify-center">
                      <Upload size={14} className="text-on-surface-variant" />
                    </div>
                    <p className="text-[11px] text-on-surface-variant leading-snug">
                      Tải lên ảnh sản phẩm thực tế hoặc feedback{' '}
                      <span className="text-outline">(Không bắt buộc)</span>
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={handleGeneratePost}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 active:scale-[0.97] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group"
              >
                <Sparkles size={14} className="group-hover:rotate-12 transition-transform" />
                {selectedFile ? 'Tạo Nội dung + Tư vấn ảnh' : 'Tạo Nội dung'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MarketingResult() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const planId = searchParams.get('planId');
  const { data: plan, isLoading } = useMarketingPlan(planId);
  const savePlan = useSavePlan();
  const user = useAuthStore((s) => s.user);
  const monthlyMarketingBudget = user?.businessProfile?.monthlyMarketingBudget;

  const contentIdeas = plan?.contentIdeas || [];
  const videoScripts = plan?.videoScripts || [];
  const seoKeywords = plan?.seoKeywords || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKols, setSelectedKols] = useState([]);
  const [specialReq, setSpecialReq] = useState('');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [hoveredKolId, setHoveredKolId] = useState(null);
  const [selectedKolDetail, setSelectedKolDetail] = useState(null);

  const targetNiche = useMemo(() => {
    if (!plan?.businessProfile?.businessType) return '';
    const typeLower = plan.businessProfile.businessType.toLowerCase();
    if (typeLower.includes('trang') || typeLower.includes('phụ kiện')) return 'Thời trang & Lối sống';
    if (typeLower.includes('nghệ') || typeLower.includes('thiết bị')) return 'Công nghệ & Đồ chơi số';
    if (typeLower.includes('mỹ phẩm') || typeLower.includes('đẹp')) return 'Mỹ phẩm & Làm đẹp';
    if (typeLower.includes('ẩm thực') || typeLower.includes('uống') || typeLower.includes('f&b')) return 'Ẩm thực & Du lịch';
    if (typeLower.includes('sức khỏe') || typeLower.includes('gym')) return 'Sức khỏe & Thể thao';
    if (typeLower.includes('giáo dục') || typeLower.includes('khóa học')) return 'Giáo dục & Phát triển bản thân';
    return '';
  }, [plan]);

  const { data: kols = [], isLoading: isKolsLoading } = useQuery({
    queryKey: ['suggested-kols', targetNiche, searchQuery],
    queryFn: async () => {
      const params = { limit: 6 };
      if (searchQuery.trim()) {
        params.search = searchQuery;
      } else if (targetNiche) {
        params.niche = targetNiche;
        params.limit = 3;
      }
      let res = await kolApi.list(params);
      if (!res?.data?.length && !searchQuery.trim() && targetNiche) {
        res = await kolApi.list({ limit: 3 });
      }
      return res?.data || [];
    },
    enabled: !!plan,
  });

  const toggleSelectKol = (kolId) => {
    setSelectedKols((prev) =>
      prev.includes(kolId) ? prev.filter((id) => id !== kolId) : [...prev, kolId]
    );
  };

  const handleSendBooking = async () => {
    if (selectedKols.length === 0 && !specialReq.trim()) {
      toast.error('Vui lòng chọn ít nhất một KOL hoặc nhập yêu cầu đặc biệt.');
      return;
    }
    setIsSubmittingBooking(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmittingBooking(false);
    setBookingSuccess(true);
    toast.success('Gửi yêu cầu đặt lịch thành công!');
  };

  const handleCopyAllKeywords = () => {
    if (seoKeywords.length === 0) return;
    const textToCopy = seoKeywords.join(', ');
    navigator.clipboard.writeText(textToCopy);
    toast.success('Đã sao chép từ khóa!');
  };

  const initialChecklist = useMemo(() => {
    if (Array.isArray(plan?.checklist)) {
      return plan.checklist.map((item, i) =>
        typeof item === 'string'
          ? { id: i + 1, title: item, desc: '', checked: false }
          : item
      );
    }
    return [];
  }, [plan]);

  const [checklist, setChecklist] = useState([]);
  const [copiedScript, setCopiedScript] = useState(null);

  useEffect(() => {
    if (initialChecklist.length) setChecklist(initialChecklist);
  }, [initialChecklist]);

  const handleSave = async () => {
    if (!planId) return;
    try {
      await savePlan.mutateAsync(planId);
      toast.success('Kế hoạch đã được lưu vào Bảng điều khiển!');
      navigate('/plans');
    } catch (err) {
      toast.error(err.message || 'Không thể lưu kế hoạch');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 gap-2 text-on-surface-variant">
        <Loader2 className="animate-spin" size={24} />
        Đang tải kế hoạch...
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="text-center py-20">
        <p className="text-on-surface-variant mb-4">Không tìm thấy kế hoạch.</p>
        <Link to="/marketing-kit" className="text-primary font-bold">Tạo kế hoạch mới</Link>
      </div>
    );
  }

  const toggleCheck = (id) => {
    setChecklist(
      checklist.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const copyToClipboard = (title, text) => {
    navigator.clipboard.writeText(text);
    setCopiedScript(title);
    setTimeout(() => setCopiedScript(null), 2000);
  };

  return (
    <div className="flex-1 w-full space-y-12">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-surface-variant/30 pb-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-[11px] uppercase tracking-wider font-bold">
              Kế hoạch Mới Đã được Tạo
            </span>
            <span className="text-on-surface-variant text-sm flex items-center gap-1.5 dark:text-outline-variant">
              <Clock size={14} /> Vừa xong
            </span>
          </div>
          <h2 className="text-display-lg-mobile md:text-display-lg font-display-lg text-primary dark:text-inverse-primary max-w-2xl leading-tight">
            {plan.goal}
          </h2>
          <p className="text-body-lg text-on-surface-variant max-w-3xl">
            {typeof plan.playbook === 'string' ? plan.playbook : plan.campaignType}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            to="/marketing-kit"
            className="px-5 py-3 rounded-full text-label-sm font-label-sm text-primary dark:text-inverse-primary hover:bg-secondary-container/40 transition-colors flex items-center gap-2 group border border-outline-variant/30"
          >
            <RefreshCw size={14} className="text-on-surface-variant group-hover:rotate-180 transition-transform duration-500" />
            Tạo lại
          </Link>
          <button
            onClick={() => alert('Xuất kế hoạch thành công!')}
            className="px-5 py-3 rounded-full text-label-sm font-label-sm text-primary dark:text-inverse-primary bg-surface-container-lowest dark:bg-tertiary-container border border-outline-variant hover:border-primary dark:hover:border-primary-fixed transition-colors shadow-sm flex items-center gap-2"
          >
            <Download size={14} />
            Xuất file
          </button>
          <button
            onClick={handleSave}
            disabled={savePlan.isPending}
            className="px-5 py-3 rounded-full text-label-sm font-label-sm text-on-primary bg-primary hover:bg-primary/90 transition-colors shadow-md hover:-translate-y-0.5 transform duration-200 disabled:opacity-60 flex items-center gap-2"
          >
            {savePlan.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
            Lưu kế hoạch
          </button>
        </div>
      </div>

      {/* Bento Grid: Content Ideas */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center">
            <Lightbulb className="text-on-secondary-container" size={16} />
          </div>
          <h3 className="text-headline-md font-bold text-primary dark:text-inverse-primary">Ý tưởng Nội dung</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {contentIdeas.map((idea, index) => (
            <IdeaCard
              key={index}
              idea={idea}
              index={index}
              totalLength={contentIdeas.length}
              businessProfileId={plan.businessProfileId}
              existingResources={plan.existingResources}
              campaignReason={plan.campaignReason}
            />
          ))}
        </div>
      </section>

      {/* Main Grid split: Left Column Checklist, Right Column Scripts + Playbook */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column Checklist (4 span) */}
        <div className="lg:col-span-4 space-y-8">
          <section className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2.5rem] p-8 shadow-[0_4px_24px_rgba(255,143,163,0.06)] border border-surface-variant/30 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-secondary-container/40 dark:bg-secondary-fixed-dim/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary-container/60 dark:bg-secondary-fixed-dim/20 flex items-center justify-center">
                  <ClipboardCheck className="text-on-secondary-container dark:text-secondary-fixed" size={14} />
                </div>
                <h3 className="text-headline-md font-bold text-primary dark:text-inverse-primary text-xl">Danh sách Việc cần làm</h3>
              </div>
              <span className="text-xs font-bold text-secondary dark:text-secondary-fixed bg-secondary-container/50 dark:bg-outline/20 px-2 py-1 rounded">
                Tuần 1
              </span>
            </div>

            <ul className="space-y-4 relative z-10">
              {checklist.map((item) => (
                <li
                  key={item.id}
                  onClick={() => toggleCheck(item.id)}
                  className="group flex items-start gap-4 p-3 -mx-3 rounded-xl hover:bg-surface-container dark:hover:bg-surface-variant/20 transition-colors cursor-pointer"
                >
                  <div
                    className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all relative shrink-0 ${
                      item.checked
                        ? 'border-secondary bg-secondary-container dark:bg-secondary/40'
                        : 'border-outline-variant group-hover:border-secondary bg-surface-container-lowest dark:bg-surface-variant/30'
                    }`}
                  >
                    {item.checked && <Check size={12} className="text-secondary dark:text-white" />}
                  </div>
                  <div>
                    <p
                      className={`text-body-md font-medium transition-all ${
                        item.checked
                          ? 'text-on-surface-variant line-through opacity-70'
                          : 'text-primary dark:text-inverse-primary'
                      }`}
                    >
                      {item.title}
                    </p>
                    <p
                      className={`text-xs mt-1 transition-all ${
                        item.checked ? 'text-outline line-through' : 'text-on-surface-variant'
                      }`}
                    >
                      {item.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Bento Card: Budget Breakdown — ưu tiên kinh phí người dùng nhập khi tạo chiến dịch */}
          <BudgetBreakdownCard rawBudget={plan.budget ?? monthlyMarketingBudget} />

          {/* Gợi ý từ khóa chuẩn SEO */}
          <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2.5rem] p-6 md:p-8 shadow-[0_4px_24px_rgba(255,143,163,0.08)] border border-surface-variant/40 space-y-6">
            <div className="flex items-center gap-3 border-b border-surface-variant/30 pb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Target size={18} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-primary dark:text-inverse-primary leading-tight">Gợi ý từ khóa chuẩn SEO</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">Từ khóa giúp tăng khả năng hiển thị trên Google</p>
              </div>
            </div>

            {seoKeywords.length > 0 ? (
              <>
                <div className="flex flex-wrap gap-2">
                  {seoKeywords.map((keyword, i) => (
                    <span 
                      key={i} 
                      className="px-3 py-1.5 rounded-xl bg-surface-container-high dark:bg-surface-variant/40 text-primary dark:text-inverse-on-surface text-xs font-medium border border-outline-variant/20 hover:border-primary/50 transition-colors cursor-default"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
                
                <button
                  onClick={handleCopyAllKeywords}
                  className="w-full py-3 rounded-full text-label-sm font-label-sm text-on-primary bg-primary hover:bg-primary/95 transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 mt-4"
                >
                  <Copy size={14} />
                  Sao chép tất cả
                </button>
              </>
            ) : (
              <p className="text-on-surface-variant text-body-md">Chưa có từ khóa SEO gợi ý.</p>
            )}
          </div>
        </div>

        {/* Right Column Scripts & Playbook (8 span) */}
        <div className="lg:col-span-8 space-y-12">
          {/* Section: Short Video Scripts */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center">
                <PlayCircle className="text-on-secondary-container" size={16} />
              </div>
              <h3 className="text-headline-md font-bold text-primary dark:text-inverse-primary">Kịch bản Video ngắn</h3>
            </div>

            <div className="space-y-4">
              {videoScripts.map((script, index) => (
                <div
                  key={index}
                  className="bg-surface-container-lowest dark:bg-tertiary-container rounded-2xl p-6 shadow-sm border border-surface-variant/50 hover:shadow-[0_4px_16px_rgba(255,143,163,0.05)] transition-shadow flex flex-col sm:flex-row gap-6 items-start"
                >
                  <div className="w-full sm:w-32 h-24 rounded-xl overflow-hidden shrink-0 relative bg-surface-variant/30 dark:bg-surface-variant/10 flex items-center justify-center">
                    <Video className="text-outline" size={32} />
                    <div className="absolute inset-0 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer flex items-center justify-center">
                      <span className="bg-white/80 dark:bg-surface/80 rounded-full p-1.5 shadow-sm text-primary dark:text-inverse-primary">
                        <Play size={14} fill="currentColor" />
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-bold text-primary dark:text-inverse-primary">
                        {script.scene}
                      </h4>
                      <span className="text-xs font-bold text-on-surface-variant bg-surface-container dark:bg-outline/20 px-2.5 py-1 rounded shrink-0 ml-2">
                        Cảnh {index + 1}
                      </span>
                    </div>
                    <p className="text-sm text-on-surface-variant font-medium">
                      {script.action}
                    </p>
                    {script.dialogue && (
                      <p className="text-sm text-on-surface-variant italic border-l-2 border-secondary/40 pl-3">
                        "{script.dialogue}"
                      </p>
                    )}
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `scene-${index}`,
                          `[${script.scene}] ${script.action}\nLời thoại: ${script.dialogue || ''}`
                        )
                      }
                      className="text-label-sm font-label-sm text-secondary hover:text-primary dark:text-secondary-fixed-dim dark:hover:text-primary-fixed flex items-center gap-1.5 transition-colors"
                    >
                      <Copy size={14} />
                      {copiedScript === `scene-${index}` ? 'Đã sao chép!' : 'Sao chép Kịch bản'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Playbook / Campaign Proposal */}
          <section className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2.5rem] p-8 md:p-12 shadow-[0_4px_24px_rgba(255,143,163,0.08)] space-y-8">
            <div className="flex items-center gap-4 border-b border-surface-variant/50 pb-6">
              <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-md">
                <BookOpen size={18} />
              </div>
              <div>
                <h3 className="text-headline-md font-bold text-primary dark:text-inverse-primary font-display-md">Đề xuất Chiến dịch</h3>
                <p className="text-sm text-on-surface-variant mt-1">Quy trình thực thi chi tiết từng bước do AI thiết kế.</p>
              </div>
            </div>

            {plan.playbook ? (
              Array.isArray(plan.playbook) ? (
                /* Timeline / Card layout for structured playbook */
                <div className="relative border-l-2 border-dashed border-outline-variant/60 ml-4 pl-6 md:pl-8 space-y-12">
                  {plan.playbook.map((phase, idx) => (
                    <div key={idx} className="relative group">
                      {/* Timeline dot */}
                      <span className="absolute -left-[41px] md:-left-[49px] top-1.5 flex items-center justify-center w-8 h-8 rounded-full bg-secondary-container text-primary font-bold border-4 border-surface-container-lowest dark:border-tertiary-container text-xs shadow-sm z-10 transition-transform group-hover:scale-110 duration-200">
                        {idx + 1}
                      </span>

                      {/* Phase Card */}
                      <div className="bg-surface-container-lowest dark:bg-surface-variant/20 rounded-3xl p-6 md:p-8 border border-surface-variant/40 shadow-sm hover:shadow-md transition-all duration-300 space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-variant/20 pb-4">
                          <h4 className="text-xl font-bold text-primary dark:text-inverse-primary">
                            {phase.phaseName}
                          </h4>
                          {phase.duration && (
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 text-xs font-bold shrink-0 self-start sm:self-auto">
                              <Clock size={12} />
                              {phase.duration}
                            </span>
                          )}
                        </div>

                        {phase.objective && (
                          <div className="bg-surface-container dark:bg-surface-variant/40 rounded-2xl p-4 flex items-start gap-3">
                            <Target className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                            <div>
                              <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">Mục tiêu cốt lõi</span>
                              <p className="text-sm text-primary dark:text-inverse-primary font-medium mt-0.5">{phase.objective}</p>
                            </div>
                          </div>
                        )}

                        {Array.isArray(phase.keyActions) && phase.keyActions.length > 0 && (
                          <div className="space-y-3">
                            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">Hành động cụ thể</span>
                            <ul className="space-y-3">
                              {phase.keyActions.map((action, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-on-surface-variant">
                                  <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                                    ✓
                                  </span>
                                  <span className="leading-relaxed">
                                    {renderBoldText(action)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {Array.isArray(phase.focusChannels) && phase.focusChannels.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2 pt-2">
                            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mr-2">Kênh tập trung:</span>
                            {phase.focusChannels.map((channel, i) => (
                              <span key={i} className="px-2.5 py-1 rounded-full bg-surface-container dark:bg-surface-variant/40 border border-outline-variant/20 text-xs text-on-surface-variant dark:text-inverse-on-surface">
                                {channel}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Legacy string / markdown rendering */
                <div className="prose prose-sm max-w-none text-on-surface-variant dark:text-inverse-on-surface/80 leading-relaxed whitespace-pre-wrap">
                  {(typeof plan.playbook === 'string' ? plan.playbook : '').split('\n').map((line, i) => {
                    const trimmed = line.trim();
                    if (!trimmed) return <br key={i} />;
                    if (trimmed.startsWith('##')) {
                      return (
                        <h4 key={i} className="font-bold text-primary dark:text-inverse-primary text-lg mt-6 mb-2">
                          {trimmed.replace(/^#+\s*/, '')}
                        </h4>
                      );
                    }
                    if (/^(\d+\.|[-•])/.test(trimmed)) {
                      return (
                        <div key={i} className="flex gap-3 py-1">
                          <span className="text-secondary dark:text-secondary-fixed font-bold shrink-0">•</span>
                          <span>{trimmed.replace(/^(\d+\.\s*|[-•]\s*)/, '')}</span>
                        </div>
                      );
                    }
                    if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
                      return (
                        <p key={i} className="font-bold text-primary dark:text-inverse-primary mt-4 mb-1">
                          {trimmed.replace(/\*\*/g, '')}
                        </p>
                      );
                    }
                    return <p key={i} className="mb-2">{line}</p>;
                  })}
                </div>
              )
            ) : (
              <p className="text-on-surface-variant text-body-md">Chưa có nội dung playbook.</p>
            )}
          </section>
        </div>
      </div>

      {/* Proposed KOL, KOC Section */}
          <section className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2.5rem] p-8 md:p-12 shadow-[0_4px_24px_rgba(255,143,163,0.08)] border border-surface-variant/40 mt-12 space-y-8 relative overflow-hidden">
            {/* Glow decoration */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-variant/30 pb-6 relative z-10">
              <div>
                <h3 className="text-2xl font-bold text-primary dark:text-inverse-primary flex items-center gap-3">
                  <Sparkles className="text-secondary" size={24} />
                  Đề xuất KOL, KOC phù hợp
                </h3>
                <p className="text-sm text-on-surface-variant mt-1">
                  Danh sách KOL/KOC được đề xuất tối ưu theo ngành hàng và mục tiêu chiến dịch của bạn.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-80 shrink-0">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm tên hoặc lĩnh vực (niche)..."
                  className="w-full pl-10 pr-10 py-2 text-sm rounded-full border border-outline-variant/60 bg-surface-container-low text-primary dark:text-inverse-primary focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none transition-all placeholder:text-on-surface-variant/50"
                />
                <Search className="absolute left-3 top-2.5 text-on-surface-variant/60" size={16} />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-on-surface-variant/60 hover:text-primary transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* KOL Grid */}
            <div className="relative z-10">
              {isKolsLoading ? (
                <div className="flex items-center justify-center py-12 gap-2 text-on-surface-variant">
                  <Loader2 className="animate-spin" size={20} />
                  Đang tải đề xuất KOL...
                </div>
              ) : kols.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {kols.map((kol) => {
                    const isSelected = selectedKols.includes(kol.id);
                    return (
                      <div
                        key={kol.id}
                        onClick={() => toggleSelectKol(kol.id)}
                        onMouseEnter={() => setHoveredKolId(kol.id)}
                        onMouseLeave={() => setHoveredKolId(null)}
                        className={`relative rounded-3xl p-6 border transition-all duration-300 cursor-pointer flex flex-col justify-between h-full group ${
                          isSelected
                            ? 'border-secondary bg-secondary-container/10 shadow-md ring-1 ring-secondary'
                            : 'border-surface-variant/50 hover:border-secondary/40 hover:bg-surface-container/30 shadow-sm'
                        }`}
                      >
                        {/* Hover detail popover summary */}
                        {hoveredKolId === kol.id && (
                          <div className="absolute z-20 left-6 bottom-full mb-3 w-64 bg-surface-container-highest dark:bg-tertiary-container text-xs rounded-2xl p-4 shadow-xl border border-surface-variant/50 animate-fade-in pointer-events-none">
                            <h5 className="font-bold text-primary dark:text-inverse-primary text-sm mb-1">{kol.name}</h5>
                            <p className="text-on-surface-variant leading-relaxed line-clamp-3 mb-2">{kol.bio || 'Chưa cập nhật giới thiệu.'}</p>
                            <div className="flex items-center gap-3 text-secondary font-bold">
                              <span>⭐ {kol.rating || '4.8'}</span>
                              <span>•</span>
                              <span>{new Intl.NumberFormat('en-US', { notation: 'compact' }).format(kol.followerCount)} Followers</span>
                            </div>
                            <p className="text-[10px] text-on-surface-variant/75 mt-1.5 italic">Click để xem chi tiết Profile</p>
                          </div>
                        )}

                        {/* Checkbox badge */}
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectKol(kol.id);
                          }}
                          className={`absolute top-4 right-4 w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-secondary border-secondary text-on-secondary'
                              : 'border-outline-variant/60 bg-surface-container-low group-hover:border-secondary/50'
                          }`}
                        >
                          {isSelected && <Check size={14} strokeWidth={3} />}
                        </div>

                        <div className="space-y-4">
                          {/* Avatar & Niche */}
                          <div className="flex items-center gap-4">
                            <img
                              src={kol.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg'}
                              alt={kol.name}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedKolDetail(kol);
                              }}
                              className="w-14 h-14 rounded-2xl object-cover border border-outline-variant/30 hover:scale-105 transition-transform bg-surface-container-low"
                            />
                            <div className="min-w-0 flex-1">
                              <h4 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedKolDetail(kol);
                                }}
                                className="font-bold text-primary dark:text-inverse-primary text-base group-hover:text-secondary transition-colors line-clamp-1 hover:underline"
                              >
                                {kol.name}
                              </h4>
                              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-secondary-container/40 text-secondary text-[11px] font-bold">
                                {kol.niche}
                              </span>
                            </div>
                          </div>

                          {/* Bio */}
                          <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                            {kol.bio || 'Chưa cập nhật giới thiệu.'}
                          </p>

                          {/* Stats */}
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-surface-variant/20 text-xs">
                            <div>
                              <span className="text-[10px] text-on-surface-variant font-bold uppercase block">Followers</span>
                              <span className="font-bold text-primary dark:text-inverse-primary">
                                {new Intl.NumberFormat('en-US', { notation: 'compact' }).format(kol.followerCount)}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-on-surface-variant font-bold uppercase block">Tương tác</span>
                              <span className="font-bold text-primary dark:text-inverse-primary">
                                {kol.engagementRate ? `${kol.engagementRate}%` : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Link & Price */}
                        <div className="flex items-center justify-between mt-6 pt-3 border-t border-surface-variant/10">
                          <div>
                            <span className="text-[9px] text-on-surface-variant uppercase block">Giá thuê từ</span>
                            <span className="text-sm font-bold text-secondary font-display">
                              {kol.priceFrom ? new Intl.NumberFormat('vi-VN').format(kol.priceFrom) + 'đ' : 'Liên hệ'}
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedKolDetail(kol);
                            }}
                            className="text-xs font-bold text-primary hover:text-secondary transition-colors underline"
                          >
                            Chi tiết
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-on-surface-variant text-sm">
                    {searchQuery.trim()
                      ? `Không tìm thấy KOL/KOC nào phù hợp với từ khóa "${searchQuery}". Bạn có thể thử tìm kiếm từ khóa khác.`
                      : 'Không tìm thấy KOL phù hợp cho ngành hàng này.'}
                  </p>
                </div>
              )}
            </div>

            {/* Special Requirements Input */}
            <div className="space-y-4 pt-4 border-t border-surface-variant/30 relative z-10">
              <label className="block text-sm font-bold text-primary dark:text-inverse-primary uppercase tracking-wider">
                Yêu cầu đặc biệt về KOL, KOC (Không bắt buộc)
              </label>
              <textarea
                value={specialReq}
                onChange={(e) => setSpecialReq(e.target.value)}
                rows={3}
                placeholder="Ví dụ: Cần KOC nữ tại TP.HCM, độ tuổi từ 20-25, có phong cách quay video review năng động và tự nhiên..."
                className="w-full rounded-2xl border border-outline-variant/60 bg-surface-container-low px-4 py-3 text-sm text-primary dark:text-inverse-primary placeholder-on-surface-variant/60 focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none transition-all resize-none"
              />
            </div>

            {/* Submission State */}
            <div className="flex justify-end pt-2 relative z-10">
              {bookingSuccess ? (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 w-full text-center">
                  <p className="text-emerald-700 dark:text-emerald-400 font-bold text-sm flex items-center justify-center gap-2">
                    <Check size={18} strokeWidth={3} />
                    Đã gửi yêu cầu đặt lịch tư vấn KOL thành công! Đội ngũ Pocket Agencom sẽ liên hệ tư vấn trong vòng 24 giờ.
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleSendBooking}
                  disabled={isSubmittingBooking}
                  className="py-3 px-8 rounded-full text-label-sm font-label-sm text-on-primary bg-secondary hover:bg-secondary/95 active:scale-[0.98] disabled:opacity-50 transition-all font-bold shadow-md hover:shadow flex items-center gap-2"
                >
                  {isSubmittingBooking && <Loader2 className="animate-spin" size={14} />}
                  Xác nhận đặt lịch tư vấn KOL
                </button>
              )}
            </div>
          </section>

          {/* KOL/KOC Detail Modal */}
          {selectedKolDetail && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl border border-surface-variant/30 flex flex-col max-h-[90vh] animate-scale-up">
                {/* Modal Header — Banner + Avatar (non-scrollable) */}
                <div className="relative bg-gradient-to-r from-secondary-container/50 to-primary-container/30 px-8 pt-5 pb-6 shrink-0">
                  <button
                    onClick={() => setSelectedKolDetail(null)}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/80 dark:bg-surface/80 flex items-center justify-center text-on-surface hover:text-primary transition-colors shadow-sm z-10"
                  >
                    <X size={18} />
                  </button>

                  <div className="flex items-end gap-5 mt-4">
                    <img
                      src={selectedKolDetail.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg'}
                      alt={selectedKolDetail.name}
                      className="w-20 h-20 rounded-2xl object-cover border-[3px] border-white/80 dark:border-tertiary-container shadow-lg bg-surface-container-low"
                    />
                    <div className="space-y-1.5 pb-0.5">
                      <h3 className="text-2xl font-bold text-primary dark:text-inverse-primary leading-tight">
                        {selectedKolDetail.name}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-secondary text-xs font-bold">
                          {selectedKolDetail.niche}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-white/60 dark:bg-surface-container-high text-on-surface-variant text-xs font-medium">
                          ⭐ {selectedKolDetail.rating || '4.8'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Content (Scrollable) */}
                <div className="flex-1 overflow-y-auto px-8 pb-8 pt-6 space-y-6">

                  {/* Bio Section */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-primary dark:text-inverse-primary uppercase tracking-wider">
                      Giới thiệu
                    </h4>
                    <p className="text-sm text-on-surface-variant leading-relaxed">
                      {selectedKolDetail.bio || 'Chưa cập nhật giới thiệu chi tiết cho KOL này.'}
                    </p>
                  </div>

                  {/* Platform stats */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-primary dark:text-inverse-primary uppercase tracking-wider">
                      Kênh truyền thông & Tương tác
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedKolDetail.platformAccounts && selectedKolDetail.platformAccounts.length > 0 ? (
                        selectedKolDetail.platformAccounts.map((acc, i) => (
                          <div key={i} className="bg-surface-container dark:bg-surface-variant/20 rounded-2xl p-4 border border-surface-variant/30 flex items-center justify-between">
                            <div>
                              <span className="text-xs font-bold text-primary dark:text-inverse-primary capitalize block">
                                {acc.platform}
                              </span>
                              <span className="text-[11px] text-on-surface-variant">
                                {acc.handle || '@username'}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-bold text-secondary block">
                                {new Intl.NumberFormat('en-US', { notation: 'compact' }).format(acc.followerCount || 0)}
                              </span>
                              <span className="text-[10px] text-on-surface-variant">
                                ER: {acc.engagementRate ? `${acc.engagementRate}%` : 'N/A'}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 bg-surface-container dark:bg-surface-variant/20 rounded-2xl p-4 border border-surface-variant/30 flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-primary dark:text-inverse-primary block">
                              TikTok Account
                            </span>
                            <span className="text-[11px] text-on-surface-variant">
                              Kênh đề xuất chính
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-secondary block">
                              {new Intl.NumberFormat('en-US', { notation: 'compact' }).format(selectedKolDetail.followerCount)}
                            </span>
                            <span className="text-[10px] text-on-surface-variant">
                              ER: {selectedKolDetail.engagementRate ? `${selectedKolDetail.engagementRate}%` : '10.5%'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pricing & Packages */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-primary dark:text-inverse-primary uppercase tracking-wider">
                      Báo giá dịch vụ đề xuất
                    </h4>
                    <div className="space-y-3">
                      {selectedKolDetail.servicePackages && selectedKolDetail.servicePackages.length > 0 ? (
                        selectedKolDetail.servicePackages.map((pkg, i) => (
                          <div key={i} className="bg-surface-container-low dark:bg-surface-variant/10 rounded-2xl p-4 border border-surface-variant/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <h5 className="font-bold text-sm text-primary dark:text-inverse-primary">
                                {pkg.name}
                              </h5>
                              <p className="text-xs text-on-surface-variant mt-0.5">
                                {pkg.description || 'Chi tiết gói dịch vụ review sản phẩm.'}
                              </p>
                            </div>
                            <span className="text-base font-bold text-secondary font-display shrink-0">
                              {new Intl.NumberFormat('vi-VN').format(pkg.price)}đ
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="bg-surface-container-low dark:bg-surface-variant/10 rounded-2xl p-4 border border-surface-variant/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <h5 className="font-bold text-sm text-primary dark:text-inverse-primary">
                              Video Review Sản Phẩm (TikTok 60s)
                            </h5>
                            <p className="text-xs text-on-surface-variant mt-0.5">
                              Đã bao gồm kịch bản, quay dựng, chỉnh sửa video 1 lần và đăng tải.
                            </p>
                          </div>
                          <span className="text-base font-bold text-secondary font-display shrink-0">
                            {selectedKolDetail.priceFrom ? new Intl.NumberFormat('vi-VN').format(selectedKolDetail.priceFrom) + 'đ' : 'Liên hệ'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="bg-surface-container dark:bg-surface-variant/30 px-8 py-4 border-t border-surface-variant/30 flex items-center justify-between gap-4 shrink-0">
                  <div className="text-xs text-on-surface-variant">
                    Giá thương lượng dựa trên lượng sản phẩm & cam kết doanh số.
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedKolDetail(null)}
                      className="px-5 py-2.5 rounded-full text-xs font-bold border border-outline hover:bg-surface-container-high transition-colors"
                    >
                      Đóng
                    </button>
                    <button
                      onClick={() => {
                        if (!selectedKols.includes(selectedKolDetail.id)) {
                          toggleSelectKol(selectedKolDetail.id);
                        }
                        setSelectedKolDetail(null);
                      }}
                      className="px-5 py-2.5 rounded-full text-xs font-bold text-on-primary bg-secondary hover:bg-secondary/95 transition-colors shadow-sm"
                    >
                      {selectedKols.includes(selectedKolDetail.id) ? 'Đã Chọn KOL' : 'Chọn KOL này'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Revision Chat & Execute Campaign — sticky at the bottom of the proposal */}
          <RevisionChatPanel />
    </div>
  );
}
