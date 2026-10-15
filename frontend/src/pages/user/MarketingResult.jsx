import { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Lightbulb, Heart, ClipboardCheck, Check, PlayCircle, Play, Video, Copy, BookOpen, RefreshCw, Download, Clock, Loader2, Target, Sparkles, Upload, X, Wand2 } from 'lucide-react';
import { useMarketingPlan, useSavePlan, useGeneratePost, useGeneratePostWithImage } from '../../hooks/useMarketingPlans';
import { useAuthStore } from '../../store/authStore';
import { toast } from '../../store/toastStore';
import BudgetBreakdownCard from '../../components/marketing/BudgetBreakdownCard';
import RevisionChatPanel from '../../components/marketing/RevisionChatPanel';
import CampaignBudgetTracker from '../../components/marketing/CampaignBudgetTracker';
import SocialImageGeneratorModal from '../../components/media/SocialImageGeneratorModal';
import { marketingPlanApi } from '../../api/marketingPlanApi';
import { normalizePlanContent } from '../../utils/planContent';
import AuthorizedMediaImage from '../../components/media/AuthorizedMediaImage';

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

function IdeaCard({ idea, index, totalLength, businessProfileId, existingResources, campaignReason, planId }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [detailedContent, setDetailedContent] = useState('');
  const [designTips, setDesignTips] = useState('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [generatedAiImage, setGeneratedAiImage] = useState(null);

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
          setUploadedImageUrl('');
          if (response.mediaAssetId && planId) await marketingPlanApi.attachAssets(planId, [response.mediaAssetId]);
          setGeneratedAiImage(response.mediaAssetId ? { mediaAssetId: response.mediaAssetId } : null);
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

  const handleCopyPost = async () => {
    try {
      await navigator.clipboard.writeText(detailedContent);
      setCopied(true);
      toast.success('Đã sao chép bài đăng!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Không thể sao chép bài đăng. Vui lòng cấp quyền clipboard.');
    }
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

              {/* Media Section: Displays real user upload OR AI Generated Social Media Image */}
              <div className="mt-6 space-y-3">
                {generatedAiImage || previewUrl || uploadedImageUrl ? (
                  <div className="rounded-2xl border border-secondary-container/40 overflow-hidden bg-surface-container-low dark:bg-surface-variant/20 p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-on-surface-variant px-1">
                      <span className="flex items-center gap-1.5 text-secondary">
                        <Sparkles size={13} />
                        {generatedAiImage ? `Ảnh AI (${generatedAiImage.aspectRatio || 'Social'})` : 'Ảnh đính kèm'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsImageModalOpen(true)}
                        className="text-xs text-primary hover:underline font-semibold"
                      >
                        Đổi / Tạo ảnh khác
                      </button>
                    </div>
                    <div className="relative max-h-60 rounded-xl overflow-hidden bg-black/5 dark:bg-black/20 flex items-center justify-center">
                      {generatedAiImage?.mediaAssetId ? (
                        <AuthorizedMediaImage assetId={generatedAiImage.mediaAssetId} alt="Ảnh bài đăng" className="max-h-60 w-full object-contain rounded-xl" />
                      ) : (
                        <img src={previewUrl || uploadedImageUrl} alt="Ảnh bài đăng" className="max-h-60 w-full object-contain rounded-xl" />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-secondary-container/60 bg-secondary-container/10 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-secondary-container text-secondary flex items-center justify-center shrink-0">
                        <Sparkles size={18} />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-primary dark:text-inverse-primary">
                          Tạo ảnh truyền thông AI cho bài viết này
                        </h5>
                        <p className="text-[11px] text-on-surface-variant">
                          Chuẩn tỉ lệ 1:1, 4:5, 9:16 hoặc 16:9, tự động lưu trữ Media Library.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsImageModalOpen(true)}
                      className="py-2 px-4 rounded-xl bg-secondary text-on-secondary hover:bg-secondary/90 text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <Sparkles size={13} />
                      Studio Tạo ảnh AI
                    </button>
                  </div>
                )}
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
            <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-surface-variant/30 animate-fade-in">
              <button
                onClick={handleCopyPost}
                className="py-2.5 px-3 rounded-xl bg-surface-container hover:bg-surface-container-high active:scale-[0.98] text-xs font-bold text-primary flex items-center justify-center gap-1.5 transition-all"
              >
                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                {copied ? 'Đã chép' : 'Sao chép'}
              </button>
              <button
                onClick={handleGeneratePost}
                className="py-2.5 px-3 rounded-xl bg-surface-container hover:bg-surface-container-high active:scale-[0.98] text-xs font-bold text-on-surface-variant flex items-center justify-center gap-1.5 transition-all"
              >
                <RefreshCw size={14} />
                Tạo lại
              </button>
              <button
                type="button"
                onClick={() => setIsImageModalOpen(true)}
                className="py-2.5 px-3 rounded-xl bg-secondary-container/60 hover:bg-secondary-container active:scale-[0.98] text-xs font-bold text-secondary flex items-center justify-center gap-1.5 transition-all"
              >
                <Sparkles size={14} />
                Tạo ảnh AI
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

      <SocialImageGeneratorModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        initialContent={detailedContent || idea.description}
        platform={idea.channel || 'Facebook'}
        businessProfileId={businessProfileId}
        ideaTitle={idea.title}
        onAttach={async (result) => {
          setGeneratedAiImage(result);
          if (result?.mediaAssetId && planId) {
            try { await marketingPlanApi.attachAssets(planId, [result.mediaAssetId]); }
            catch { toast.error('Ảnh đã lưu vào Media Library nhưng chưa thể gắn vào kế hoạch.'); }
          }
        }}
      />
    </div>
  );
}

export default function MarketingResult() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const planId = searchParams.get('planId');
  const { data: rawPlan, isLoading } = useMarketingPlan(planId);
  const plan = useMemo(() => (rawPlan ? normalizePlanContent(rawPlan) : null), [rawPlan]);
  const savePlan = useSavePlan();
  const user = useAuthStore((s) => s.user);
  const monthlyMarketingBudget = user?.businessProfile?.monthlyMarketingBudget;

  const contentIdeas = plan?.contentIdeas || [];
  const videoScripts = plan?.videoScripts || [];
  const seoKeywords = plan?.seoKeywords || [];

  const handleCopyAllKeywords = async () => {
    if (seoKeywords.length === 0) return;
    const textToCopy = seoKeywords.join(', ');
    try {
      await navigator.clipboard.writeText(textToCopy);
      toast.success('Đã sao chép từ khóa!');
    } catch {
      toast.error('Không thể sao chép từ khóa. Vui lòng cấp quyền clipboard.');
    }
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

  const handleExportPlan = () => {
    if (!plan) return;
    try {
      const title = plan.goal || 'Kế hoạch Marketing';
      const campaign = typeof plan.playbook === 'string' ? plan.playbook : plan.campaignType || '';

      let md = `# KẾ HOẠCH MARKETING: ${title}\n\n`;
      if (campaign) md += `> **Chiến dịch:** ${campaign}\n\n`;
      md += `*Thời gian tạo: ${new Date().toLocaleString('vi-VN')}*\n\n`;
      md += `---\n\n`;

      if (contentIdeas?.length) {
        md += `## 1. Ý tưởng Nội dung (${contentIdeas.length})\n\n`;
        contentIdeas.forEach((idea, i) => {
          md += `### ${i + 1}. ${idea.title || 'Ý tưởng'}\n`;
          if (idea.channel) md += `- **Kênh triển khai:** ${idea.channel}\n`;
          if (idea.description) md += `- **Mô tả:** ${idea.description}\n`;
          if (idea.rationale) md += `- **Lý do lựa chọn:** ${idea.rationale}\n`;
          md += `\n`;
        });
      }

      if (videoScripts?.length) {
        md += `## 2. Kịch bản Video ngắn (${videoScripts.length})\n\n`;
        videoScripts.forEach((vs, i) => {
          md += `### ${i + 1}. ${vs.title || 'Kịch bản'}\n`;
          if (vs.duration) md += `- **Thời lượng:** ${vs.duration}\n`;
          if (vs.hook) md += `- **Hook mở đầu:** ${vs.hook}\n`;
          if (vs.script) md += `- **Nội dung:**\n\n${vs.script}\n\n`;
          if (vs.callToAction) md += `- **Kêu gọi hành động (CTA):** ${vs.callToAction}\n`;
          md += `\n`;
        });
      }

      if (seoKeywords?.length) {
        md += `## 3. Bộ từ khóa SEO gợi ý\n\n`;
        md += seoKeywords.map(kw => `- ${kw}`).join('\n') + '\n\n';
      }

      if (checklist?.length) {
        md += `## 4. Checklist triển khai chiến dịch\n\n`;
        checklist.forEach((item) => {
          const checked = item.checked ? '[x]' : '[ ]';
          md += `- ${checked} ${item.title || item}\n`;
        });
        md += `\n`;
      }

      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const sanitizedName = (title || 'ke_hoach_marketing')
        .toLowerCase()
        .replace(/[^a-z0-9]/gi, '_')
        .slice(0, 50);
      link.download = `${sanitizedName}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Đã xuất file kế hoạch (.md) thành công!');
    } catch (err) {
      toast.error('Lỗi khi xuất kế hoạch: ' + (err.message || 'Thử lại sau'));
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

  const copyToClipboard = async (title, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedScript(title);
      setTimeout(() => setCopiedScript(null), 2000);
      toast.success('Đã sao chép nội dung!');
    } catch {
      toast.error('Không thể sao chép nội dung. Vui lòng cấp quyền clipboard.');
    }
  };

  return (
    <div className="flex-1 w-full space-y-12">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-surface-variant/30 pb-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-[11px] uppercase tracking-wider font-bold">
              {plan.hasLegacyContent ? 'Kế hoạch lịch sử' : 'Kế hoạch Mới Đã được Tạo'}
            </span>
            <span className="text-on-surface-variant text-sm flex items-center gap-1.5 dark:text-outline-variant">
              <Clock size={14} /> Vừa xong
            </span>
          </div>
          <h1 className="text-display-lg-mobile md:text-display-lg font-display-lg text-primary dark:text-inverse-primary max-w-2xl leading-tight">
            {plan.goal}
          </h1>
          <p className="text-body-lg text-on-surface-variant max-w-3xl">
            {typeof plan.playbook === 'string' ? plan.playbook : plan.campaignType}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {!plan.hasLegacyContent && <Link
            to="/marketing-kit"
            className="px-5 py-3 rounded-full text-label-sm font-label-sm text-primary dark:text-inverse-primary hover:bg-secondary-container/40 transition-colors flex items-center gap-2 group border border-outline-variant/30"
          >
            <RefreshCw size={14} className="text-on-surface-variant group-hover:rotate-180 transition-transform duration-500" />
            Tạo lại
          </Link>}
          <button
            onClick={handleExportPlan}
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

      {plan.hasLegacyContent && (
        <div className="rounded-2xl border border-amber-300/60 bg-amber-50 dark:bg-amber-950/20 px-5 py-4 text-sm text-amber-900 dark:text-amber-200">
          Kế hoạch lịch sử này có nội dung tham chiếu một tính năng đã ngừng hoạt động. Nội dung gốc được giữ nguyên để đối chiếu; các thao tác tạo lại hoặc tái sử dụng tự động đã được tắt.
        </div>
      )}

      {plan.mediaAssets?.length > 0 && (
        <section className="space-y-3" aria-labelledby="plan-media-title">
          <h2 id="plan-media-title" className="text-headline-md font-bold text-primary dark:text-inverse-primary">Tệp đã lưu cùng kế hoạch</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {plan.mediaAssets.map(({ mediaAsset }) => mediaAsset?.fileType === 'image' && (
              <figure key={mediaAsset.id} className="overflow-hidden rounded-2xl border border-surface-variant/30 bg-surface-container-lowest">
                <AuthorizedMediaImage assetId={mediaAsset.sourceKind === 'private_storage' ? mediaAsset.id : null} legacyUrl={mediaAsset.url} alt={mediaAsset.name} className="aspect-video w-full object-cover" />
                <figcaption className="truncate px-3 py-2 text-xs font-medium text-on-surface-variant">{mediaAsset.name}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* Bento Grid: Content Ideas */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center">
            <Lightbulb className="text-on-secondary-container" size={16} />
          </div>
          <h3 className="text-headline-md font-bold text-primary dark:text-inverse-primary">Ý tưởng Nội dung</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {contentIdeas.map((idea, index) => plan.hasLegacyContent ? (
            <article key={index} className="rounded-[2rem] border border-surface-variant/30 bg-surface-container-lowest p-6">
              <span className="text-xs font-bold text-on-surface-variant">{idea.channel || idea.format}</span>
              <h4 className="mt-2 font-bold text-primary">{idea.title}</h4>
              <p className="mt-3 text-sm text-on-surface-variant">{idea.description}</p>
            </article>
          ) : (
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
          <BudgetBreakdownCard rawBudget={plan.budget ?? monthlyMarketingBudget} budgetBreakdown={plan.budgetBreakdown} />

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
                        {script.scene || script.title || `Phân cảnh ${index + 1}`}
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
                          `[${script.scene || script.title || `Phân cảnh ${index + 1}`}] ${script.action}\nLời thoại: ${script.dialogue || ''}`
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
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-pink-50 text-pink-700 border border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800 text-xs font-bold shrink-0 self-start sm:self-auto">
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

      {/* Campaign Budget & Spend Management Tracker */}
      <section className="mt-8">
        <CampaignBudgetTracker campaignId={plan?.id || 1} />
      </section>

      {/* Revision workflow */}
      {!plan.hasLegacyContent && <RevisionChatPanel planId={plan.id} />}
    </div>
  );
}
