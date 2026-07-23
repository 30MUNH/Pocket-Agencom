import { useState, useMemo } from 'react';
import { ShoppingBag, ShoppingCart, Store, AtSign, Video, ExternalLink, Plus, Trash2, CheckCircle2, AlertCircle, Link as LinkIcon } from 'lucide-react';
import { toast } from '../../store/toastStore';

function FacebookIcon({ size = 18, className }) {
  return (
    <svg width={size} height={size} className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function InstagramIcon({ size = 18, className }) {
  return (
    <svg width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  );
}

function YoutubeIcon({ size = 18, className }) {
  return (
    <svg width={size} height={size} className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

// Regex Patterns for Platform Validation
export const PLATFORM_VALIDATION_RULES = {
  shopee: {
    name: 'Shopee',
    pattern: /^https?:\/\/(www\.)?shopee\.(vn|com)\/.*$/i,
    errorMessage: 'Đường dẫn không hợp lệ. Vui lòng nhập đúng liên kết từ Shopee (shopee.vn hoặc shopee.com)',
    icon: ShoppingBag,
    color: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
  },
  lazada: {
    name: 'Lazada',
    pattern: /^https?:\/\/(www\.)?lazada\.vn\/.*$/i,
    errorMessage: 'Đường dẫn không hợp lệ. Vui lòng nhập đúng liên kết từ Lazada (lazada.vn)',
    icon: ShoppingCart,
    color: 'text-indigo-600 bg-indigo-500/10 border-indigo-500/20',
  },
  tiki: {
    name: 'Tiki',
    pattern: /^https?:\/\/(www\.)?tiki\.vn\/.*$/i,
    errorMessage: 'Đường dẫn không hợp lệ. Vui lòng nhập đúng liên kết từ Tiki (tiki.vn)',
    icon: Store,
    color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  },
  tiktok_shop: {
    name: 'TikTok Shop',
    pattern: /^https?:\/\/(www\.|shop\.)?tiktok\.com\/.*$/i,
    errorMessage: 'Đường dẫn không hợp lệ. Vui lòng nhập đúng liên kết TikTok Shop (tiktok.com)',
    icon: Video,
    color: 'text-slate-900 dark:text-white bg-slate-500/10 border-slate-500/20',
  },
  chotot: {
    name: 'Chợ Tốt',
    pattern: /^https?:\/\/(www\.)?chotot\.com\/.*$/i,
    errorMessage: 'Đường dẫn không hợp lệ. Vui lòng nhập đúng liên kết Chợ Tốt (chotot.com)',
    icon: Store,
    color: 'text-yellow-600 bg-yellow-500/10 border-yellow-500/20',
  },
  threads: {
    name: 'Threads',
    pattern: /^https?:\/\/(www\.)?threads\.net\/.*$/i,
    errorMessage: 'Đường dẫn không hợp lệ. Vui lòng nhập đúng liên kết Threads (threads.net)',
    icon: AtSign,
    color: 'text-neutral-900 dark:text-neutral-100 bg-neutral-500/10 border-neutral-500/20',
  },
  facebook: {
    name: 'Facebook',
    pattern: /^https?:\/\/(www\.)?(facebook\.com|fb\.com)\/.*$/i,
    errorMessage: 'Đường dẫn không hợp lệ. Vui lòng nhập đúng liên kết Facebook (facebook.com hoặc fb.com)',
    icon: FacebookIcon,
    color: 'text-blue-600 bg-blue-600/10 border-blue-600/20',
  },
  instagram: {
    name: 'Instagram',
    pattern: /^https?:\/\/(www\.)?instagram\.com\/.*$/i,
    errorMessage: 'Đường dẫn không hợp lệ. Vui lòng nhập đúng liên kết Instagram (instagram.com)',
    icon: InstagramIcon,
    color: 'text-pink-600 bg-pink-500/10 border-pink-500/20',
  },
  tiktok: {
    name: 'TikTok',
    pattern: /^https?:\/\/(www\.)?tiktok\.com\/.*$/i,
    errorMessage: 'Đường dẫn không hợp lệ. Vui lòng nhập đúng liên kết TikTok (tiktok.com)',
    icon: Video,
    color: 'text-slate-900 dark:text-white bg-slate-500/10 border-slate-500/20',
  },
  youtube: {
    name: 'YouTube',
    pattern: /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.*$/i,
    errorMessage: 'Đường dẫn không hợp lệ. Vui lòng nhập đúng liên kết YouTube (youtube.com hoặc youtu.be)',
    icon: YoutubeIcon,
    color: 'text-red-600 bg-red-600/10 border-red-600/20',
  },
};

// Platform Configurations per Role
const SME_PLATFORMS = ['shopee', 'lazada', 'tiki', 'tiktok_shop', 'chotot', 'threads'];
const KOL_PLATFORMS = ['facebook', 'instagram', 'tiktok', 'youtube', 'threads'];

/**
 * Utility function to validate URL based on platform
 */
export function validateSocialUrl(platformKey, url) {
  if (!url || typeof url !== 'string') return { isValid: false, error: 'URL không được để trống' };

  // Prepend https:// if user pasted url without protocol
  let formattedUrl = url.trim();
  if (!/^https?:\/\//i.test(formattedUrl)) {
    formattedUrl = `https://${formattedUrl}`;
  }

  const rule = PLATFORM_VALIDATION_RULES[platformKey];
  if (!rule) {
    return { isValid: false, error: 'Nền tảng không hợp lệ' };
  }

  const isValid = rule.pattern.test(formattedUrl);
  return {
    isValid,
    error: isValid ? null : rule.errorMessage,
    formattedUrl,
  };
}

export default function SocialLinksManager({ userRole = 'SME', initialLinks = [], onChange }) {
  // Normalize userRole
  const isKOL = (userRole || '').toUpperCase() === 'KOL';
  const availablePlatformKeys = isKOL ? KOL_PLATFORMS : SME_PLATFORMS;

  const [selectedPlatform, setSelectedPlatform] = useState(availablePlatformKeys[0]);
  const [urlInput, setUrlInput] = useState('');
  const [links, setLinks] = useState(initialLinks);

  // Real-time Validation State
  const validationResult = useMemo(() => {
    if (!urlInput.trim()) return { isValid: false, error: null };
    return validateSocialUrl(selectedPlatform, urlInput);
  }, [selectedPlatform, urlInput]);

  const handleAddLink = (e) => {
    e.preventDefault();
    if (!validationResult.isValid) return;

    // Avoid duplicate platforms or URLs
    const rule = PLATFORM_VALIDATION_RULES[selectedPlatform];
    const newLink = {
      id: `link-${Date.now()}`,
      platform: selectedPlatform,
      platformName: rule.name,
      url: validationResult.formattedUrl,
    };

    const updatedLinks = [...links, newLink];
    setLinks(updatedLinks);
    setUrlInput('');
    toast.success(`Đã thêm liên kết ${rule.name}!`);

    if (onChange) onChange(updatedLinks);
  };

  const handleDeleteLink = (id) => {
    const updatedLinks = links.filter((item) => item.id !== id);
    setLinks(updatedLinks);
    toast.success('Đã xóa liên kết');

    if (onChange) onChange(updatedLinks);
  };

  return (
    <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-6 border border-surface-variant/30 shadow-sm space-y-6">
      {/* Component Title & Description */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <LinkIcon size={18} className="text-primary" />
          <h3 className="font-bold text-base text-primary">
            {isKOL ? 'Liên kết Mạng Xã Hội' : 'Kênh Bán Hàng & Thương Mại Điện Tử'}
          </h3>
        </div>
        <p className="text-xs text-on-surface-variant">
          {isKOL
            ? 'Quản lý danh sách kênh mạng xã hội chính thức (Facebook, Instagram, TikTok, YouTube, Threads).'
            : 'Quản lý các gian hàng Shopee, Lazada, Tiki, TikTok Shop, Chợ Tốt và Threads của doanh nghiệp.'}
        </p>
      </div>

      {/* Form Controls */}
      <form onSubmit={handleAddLink} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Platform Selector */}
          <div>
            <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1.5">
              Nền tảng {isKOL ? '(KOL)' : '(SME)'}
            </label>
            <select
              value={selectedPlatform}
              onChange={(e) => {
                setSelectedPlatform(e.target.value);
                setUrlInput('');
              }}
              className="w-full p-3 rounded-2xl bg-surface-container-lowest dark:bg-surface-container border border-surface-variant/40 text-xs font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {availablePlatformKeys.map((key) => {
                const p = PLATFORM_VALIDATION_RULES[key];
                return (
                  <option key={key} value={key}>
                    {p.name}
                  </option>
                );
              })}
            </select>
          </div>

          {/* URL Input */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1.5">
              Đường dẫn (URL)
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={`Nhập đường dẫn ${PLATFORM_VALIDATION_RULES[selectedPlatform]?.name}...`}
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className={`w-full pl-3.5 pr-10 py-3 rounded-2xl bg-surface-container-lowest dark:bg-surface-container border text-xs focus:outline-none focus:ring-2 ${
                  urlInput.trim()
                    ? validationResult.isValid
                      ? 'border-emerald-500 focus:ring-emerald-500/40 text-on-surface'
                      : 'border-rose-500 focus:ring-rose-500/40 text-rose-600'
                    : 'border-surface-variant/40 focus:ring-primary/50 text-on-surface'
                }`}
              />
              {urlInput.trim() && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {validationResult.isValid ? (
                    <CheckCircle2 size={16} className="text-emerald-500" />
                  ) : (
                    <AlertCircle size={16} className="text-rose-500" />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Validation Error Message */}
        {urlInput.trim() && !validationResult.isValid && (
          <div className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-200 dark:border-rose-800/40 animate-in fade-in duration-200">
            <AlertCircle size={14} className="shrink-0" />
            <span>{validationResult.error}</span>
          </div>
        )}

        {/* Add Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!validationResult.isValid}
            className="px-6 py-2.5 rounded-full bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus size={15} /> Thêm liên kết
          </button>
        </div>
      </form>

      {/* Added Links List */}
      <div className="pt-2 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          Danh sách liên kết đã thêm ({links.length})
        </h4>

        <div className="space-y-2.5">
          {links.map((link) => {
            const rule = PLATFORM_VALIDATION_RULES[link.platform] || PLATFORM_VALIDATION_RULES.threads;
            const Icon = rule.icon;
            return (
              <div
                key={link.id}
                className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-surface-variant/15 border border-surface-variant/20 transition-all hover:border-surface-variant/40"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2.5 rounded-xl border shrink-0 ${rule.color}`}>
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-primary block leading-tight">
                      {rule.name}
                    </span>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-on-surface-variant hover:text-primary hover:underline truncate flex items-center gap-1 mt-0.5"
                    >
                      <span className="truncate">{link.url}</span>
                      <ExternalLink size={11} className="shrink-0" />
                    </a>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteLink(link.id)}
                  className="p-2 rounded-full text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/50 transition-colors shrink-0"
                  title="Xóa liên kết"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}

          {links.length === 0 && (
            <div className="py-8 text-center text-on-surface-variant/70 text-xs italic bg-surface-variant/10 rounded-2xl border border-dashed border-surface-variant/30">
              Chưa có liên kết nào. Hãy chọn nền tảng và nhập đường dẫn bên trên để thêm.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
