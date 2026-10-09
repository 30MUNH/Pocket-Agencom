import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Wand2, 
  Loader2, 
  Download, 
  Copy, 
  Check, 
  Image as ImageIcon, 
  Layers, 
  RefreshCw,
  ExternalLink,
  Sliders,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useGenerateImagePrompt, useGenerateSocialImage } from '../../hooks/useMarketingPlans';
import { toast } from '../../store/toastStore';

const ASPECT_RATIOS = [
  { id: '1:1', label: '1:1 Vuông', desc: 'Feed Instagram / Facebook', cssAspect: 'aspect-square' },
  { id: '4:5', label: '4:5 Dọc', desc: 'Feed Facebook / Instagram tối ưu', cssAspect: 'aspect-[4/5]' },
  { id: '9:16', label: '9:16 Dọc', desc: 'TikTok, Reels, Story', cssAspect: 'aspect-[9/16]' },
  { id: '16:9', label: '16:9 Ngang', desc: 'Banner cover, Blog, YouTube', cssAspect: 'aspect-video' },
];

const PLATFORMS = ['Facebook', 'Instagram', 'TikTok', 'LinkedIn'];

const STYLE_PRESETS = [
  { id: 'studio', label: 'Chụp Studio cao cấp', promptModifier: 'professional studio product photography, clean background, sharp focus, 8k resolution, soft commercial lighting' },
  { id: 'lifestyle', label: 'Phong cách sống tự nhiên', promptModifier: 'authentic modern lifestyle commercial photography, warm natural sunlight, relaxed aesthetic, aesthetic Vietnamese setting' },
  { id: 'editorial', label: 'Tối giản & Nghệ thuật', promptModifier: 'minimalist editorial branding photography, clean lines, elegant beige and neutral palette, high-end magazine look' },
  { id: 'vibrant', label: 'Banner quảng cáo rực rỡ', promptModifier: 'vivid modern commercial advertising visuals, vibrant energetic colors, dynamic composition, eye-catching marketing render' },
];

export default function SocialImageGeneratorModal({
  isOpen,
  onClose,
  initialContent = '',
  platform: initialPlatform = 'Facebook',
  businessProfileId,
  ideaTitle = '',
  onAttach = null,
}) {
  const [platform, setPlatform] = useState(initialPlatform);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [stylePreset, setStylePreset] = useState('studio');
  const [prompt, setPrompt] = useState('');
  const [contextText, setContextText] = useState(initialContent || ideaTitle || '');
  const [generatedResult, setGeneratedResult] = useState(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const generatePromptMutation = useGenerateImagePrompt();
  const generateImageMutation = useGenerateSocialImage();

  useEffect(() => {
    if (initialContent || ideaTitle) {
      setContextText(initialContent || ideaTitle);
    }
    if (initialPlatform) {
      setPlatform(initialPlatform);
    }
  }, [initialContent, ideaTitle, initialPlatform]);

  if (!isOpen) return null;

  const handleAutoGeneratePrompt = async () => {
    const textToAnalyze = contextText.trim();
    if (!textToAnalyze) {
      toast.error('Vui lòng nhập bối cảnh bài viết hoặc tiêu đề ý tưởng để AI tạo prompt.');
      return;
    }

    try {
      const selectedStyle = STYLE_PRESETS.find((s) => s.id === stylePreset);
      const res = await generatePromptMutation.mutateAsync({
        postContent: textToAnalyze,
        platform,
        businessProfileId: businessProfileId ? Number(businessProfileId) : undefined,
      });

      const basePrompt = res?.imagePrompt || '';
      const finalPrompt = selectedStyle?.promptModifier 
        ? `${basePrompt}, ${selectedStyle.promptModifier}`
        : basePrompt;

      setPrompt(finalPrompt);
      toast.success('Đã tạo visual prompt gợi ý!');
    } catch (err) {
      toast.error(err.message || 'Không thể tạo gợi ý prompt bằng AI.');
    }
  };

  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      toast.error('Vui lòng nhập hoặc tạo mô tả hình ảnh (prompt) trước khi tạo ảnh.');
      return;
    }

    try {
      const res = await generateImageMutation.mutateAsync({
        prompt: prompt.trim(),
        aspectRatio,
        platform,
        businessProfileId: businessProfileId ? Number(businessProfileId) : undefined,
      });

      if (res && res.imageUrl) {
        setGeneratedResult(res);
        toast.success('Tạo ảnh AI thành công! Đã lưu vào Media Library.');
      } else {
        toast.error('Không nhận được hình ảnh từ dịch vụ AI.');
      }
    } catch (err) {
      const errorMsg = err.message || err.response?.data?.message || 'Có lỗi xảy ra khi tạo ảnh AI.';
      toast.error(errorMsg);
    }
  };

  const handleCopyUrl = async () => {
    if (!generatedResult?.imageUrl) return;
    try {
      await navigator.clipboard.writeText(generatedResult.imageUrl);
      setCopiedUrl(true);
      toast.success('Đã sao chép liên kết hình ảnh!');
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      toast.error('Không thể sao chép liên kết.');
    }
  };

  const handleDownload = async () => {
    if (!generatedResult?.imageUrl) return;
    try {
      const response = await fetch(generatedResult.imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `agencom-ai-${platform.toLowerCase()}-${aspectRatio.replace(':', 'x')}-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Đang tải ảnh xuống máy...');
    } catch {
      // Fallback: open in new tab
      window.open(generatedResult.imageUrl, '_blank');
    }
  };

  const handleAttachImage = () => {
    if (!generatedResult?.imageUrl) return;
    if (onAttach) {
      onAttach(generatedResult);
      toast.success('Đã đính kèm ảnh vào nội dung!');
      onClose();
    }
  };

  const currentRatio = ASPECT_RATIOS.find((r) => r.id === aspectRatio) || ASPECT_RATIOS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] shadow-2xl border border-surface-variant/40 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-surface-variant/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 text-white flex items-center justify-center shadow-md">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-primary dark:text-inverse-primary leading-tight">
                Studio Tạo Ảnh AI Mạng Xã Hội
              </h3>
              <p className="text-xs text-on-surface-variant">
                Sinh ảnh truyền thông theo đúng tỉ lệ chuẩn & tự động đồng bộ Media Library
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body: Split View (Left Controls, Right Preview) */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Controls Column (7 cols) */}
          <div className="md:col-span-7 space-y-5">
            {/* Platform Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">
                Nền tảng mục tiêu
              </label>
              <div className="grid grid-cols-4 gap-2">
                {PLATFORMS.map((p) => (
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

            {/* Aspect Ratio Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">
                Tỉ lệ khung hình (Aspect Ratio)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio.id}
                    onClick={() => setAspectRatio(ratio.id)}
                    className={`p-2.5 rounded-xl text-left transition-all border ${
                      aspectRatio === ratio.id
                        ? 'bg-primary text-on-primary border-primary shadow-sm'
                        : 'bg-surface-container hover:bg-surface-container-high text-on-surface border-outline-variant/30'
                    }`}
                  >
                    <div className="font-bold text-xs">{ratio.label}</div>
                    <div className={`text-[10px] mt-0.5 truncate ${aspectRatio === ratio.id ? 'text-on-primary/80' : 'text-on-surface-variant'}`}>
                      {ratio.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Style Preset Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">
                Phong cách thị giác (Visual Style)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {STYLE_PRESETS.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setStylePreset(style.id)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold text-left transition-all border ${
                      stylePreset === style.id
                        ? 'bg-secondary-container text-on-secondary-container border-secondary font-bold'
                        : 'bg-surface-container hover:bg-surface-container-high text-on-surface border-outline-variant/30'
                    }`}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Post Context / Draft Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Nội dung bài viết / Ý tưởng
                </label>
                <button
                  onClick={handleAutoGeneratePrompt}
                  disabled={generatePromptMutation.isPending || !contextText.trim()}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-secondary hover:text-secondary/80 disabled:opacity-50 transition-colors"
                >
                  {generatePromptMutation.isPending ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Wand2 size={13} />
                  )}
                  Tự động sinh Prompt bằng AI
                </button>
              </div>
              <textarea
                value={contextText}
                onChange={(e) => setContextText(e.target.value)}
                placeholder="Nhập nội dung bài viết hoặc thông điệp chính muốn truyền tải..."
                rows={2}
                className="w-full p-3 rounded-xl bg-surface-container-low dark:bg-surface-variant/20 border border-outline-variant/40 text-xs text-primary dark:text-inverse-primary resize-none focus:outline-none focus:ring-2 focus:ring-secondary/40"
              />
            </div>

            {/* Editable AI Image Prompt */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Prompt chi tiết gửi cho mô hình tạo ảnh (FLUX / Diffusion)
                </label>
                <span className="text-[10px] text-on-surface-variant/70">
                  {prompt.length} ký tự (Khuyến khích tiếng Anh)
                </span>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Mô tả chi tiết hình ảnh bằng tiếng Anh hoặc bấm 'Tự động sinh Prompt bằng AI' ở trên..."
                rows={3}
                className="w-full p-3 rounded-xl bg-surface-container-low dark:bg-surface-variant/20 border border-outline-variant/40 text-xs text-primary dark:text-inverse-primary resize-none focus:outline-none focus:ring-2 focus:ring-secondary/40 font-mono"
              />
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerateImage}
              disabled={generateImageMutation.isPending || !prompt.trim()}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 active:scale-[0.98] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {generateImageMutation.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Đang khởi tạo & kết xuất ảnh với AI ({aspectRatio})...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Tạo ảnh AI ngay</span>
                </>
              )}
            </button>
          </div>

          {/* Preview & Result Column (5 cols) */}
          <div className="md:col-span-5 flex flex-col items-center justify-center bg-surface-container/30 dark:bg-surface-variant/10 rounded-2xl p-4 border border-surface-variant/40 min-h-[380px]">
            {generateImageMutation.isPending ? (
              <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-secondary-container/60 flex items-center justify-center text-secondary animate-pulse">
                    <Sparkles size={28} />
                  </div>
                  <Loader2 className="absolute inset-0 m-auto w-20 h-20 text-secondary animate-spin opacity-40" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-primary dark:text-inverse-primary">
                    Đang tạo hình ảnh truyền thông...
                  </h4>
                  <p className="text-xs text-on-surface-variant mt-1 max-w-xs">
                    Mô hình đang kết xuất visual thương hiệu theo tỉ lệ {aspectRatio} và lưu trữ bảo đảm lên Supabase Storage.
                  </p>
                </div>
              </div>
            ) : generatedResult?.imageUrl ? (
              <div className="w-full flex flex-col items-center space-y-4">
                <div className={`w-full max-h-[320px] rounded-xl overflow-hidden shadow-lg border border-secondary-container/40 relative group ${currentRatio.cssAspect}`}>
                  <img
                    src={generatedResult.imageUrl}
                    alt={generatedResult.prompt || 'Generated AI Social Image'}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[10px] font-bold">
                    <CheckCircle2 size={12} className="text-emerald-400" />
                    <span>Đã lưu vào Kho Media</span>
                  </div>
                  <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-0.5 rounded text-[10px] font-mono">
                    {aspectRatio}
                  </div>
                </div>

                {/* Result Action Buttons */}
                <div className="w-full grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={handleDownload}
                    className="py-2.5 px-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Download size={14} />
                    Tải về máy
                  </button>
                  <button
                    onClick={handleCopyUrl}
                    className="py-2.5 px-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {copiedUrl ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    {copiedUrl ? 'Đã chép link' : 'Sao chép link'}
                  </button>
                </div>

                {onAttach && (
                  <button
                    onClick={handleAttachImage}
                    className="w-full py-2.5 px-4 rounded-xl bg-secondary text-on-secondary hover:bg-secondary/90 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    <CheckCircle2 size={14} />
                    Chèn ảnh vào bài viết này
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-6 space-y-3 text-on-surface-variant">
                <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center">
                  <ImageIcon size={24} className="opacity-60" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-primary dark:text-inverse-primary">
                    Khung xem trước ảnh AI ({aspectRatio})
                  </p>
                  <p className="text-[11px] text-on-surface-variant max-w-xs leading-relaxed">
                    Chọn nền tảng, tạo prompt bằng AI hoặc chỉnh sửa mô tả, sau đó bấm &quot;Tạo ảnh AI ngay&quot;.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
