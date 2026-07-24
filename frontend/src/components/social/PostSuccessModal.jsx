import React, { useState } from 'react';
import { 
  CheckCircle2, 
  X, 
  Copy, 
  Check, 
  Share2, 
  ExternalLink, 
  Sparkles, 
  Send, 
  MessageCircle, 
  Globe
} from 'lucide-react';
import { toast } from '../../store/toastStore';

// Custom Brand Icons
function FacebookIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function TikTokIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.09-1.51-.71-.53-1.3-1.22-1.74-2v6.62c.04 2.87-1.39 5.86-3.99 7.06-2.58 1.25-6.02.9-8.15-1.14-2.28-2.26-2.47-6.27-.42-8.77 1.83-2.3 5.34-2.88 7.82-1.33v4.19c-1.41-.95-3.41-.74-4.57.51-.97 1.09-1.01 2.89-.08 4 .98 1.22 2.85 1.48 4.09.57.85-.59 1.28-1.63 1.25-2.67V.02z"/>
    </svg>
  );
}

function InstagramIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  );
}

function ZaloIcon({ className = "w-5 h-5" }) {
  return (
    <div className={`flex items-center justify-center font-bold text-xs bg-blue-600 text-white rounded-md px-1 py-0.5 ${className}`}>
      Zalo
    </div>
  );
}

export default function PostSuccessModal({ isOpen, onClose, post }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !post) return null;

  const {
    title = 'Bài viết mới',
    content = '',
    url = window.location.href,
    platform = 'Facebook'
  } = post;

  const fullShareText = `${title}\n\n${content}\n\n${url ? `Chi tiết: ${url}` : ''}`.trim();

  // Robust Clipboard Handler with fallback
  const handleCopyToClipboard = async (customMessage = 'Đã sao chép nội dung bài viết!') => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(fullShareText);
      } else {
        // Fallback for non-HTTPS or older browsers
        const textArea = document.createElement('textarea');
        textArea.value = fullShareText;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      toast.success(customMessage);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Clipboard copy error:', err);
      toast.error('Không thể sao chép tự động. Vui lòng chọn và sao chép thủ công.');
    }
  };

  // Facebook Share Intent
  const handleFacebookShare = () => {
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url || window.location.href)}&quote=${encodeURIComponent(title)}`;
    window.open(shareUrl, '_blank', 'width=600,height=500,location=no,menubar=no,toolbar=no');
  };

  // TikTok Intent (Copy text + Open TikTok Web)
  const handleTikTokShare = async () => {
    await handleCopyToClipboard('Đã copy nội dung. Hãy dán vào TikTok!');
    setTimeout(() => {
      window.open('https://www.tiktok.com/upload', '_blank');
    }, 600);
  };

  // Instagram Intent (Copy text + Open Instagram Web)
  const handleInstagramShare = async () => {
    await handleCopyToClipboard('Đã copy nội dung. Hãy dán vào Instagram!');
    setTimeout(() => {
      window.open('https://www.instagram.com', '_blank');
    }, 600);
  };

  // Zalo Share Intent
  const handleZaloShare = async () => {
    await handleCopyToClipboard('Đã copy nội dung. Hãy dán vào Zalo!');
    const zaloShareUrl = `https://zalo.me/share?url=${encodeURIComponent(url || window.location.href)}&title=${encodeURIComponent(title)}`;
    window.open(zaloShareUrl, '_blank');
  };

  // Native Web Share API Handler
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: content.substring(0, 120) + '...',
          url: url || window.location.href,
        });
        toast.success('Đã chia sẻ thành công!');
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Web Share Error:', err);
        }
      }
    } else {
      handleCopyToClipboard('Thiết bị không hỗ trợ Menu chia sẻ. Đã sao chép nội dung vào bộ nhớ tạm!');
    }
  };

  const isWebShareSupported = typeof navigator !== 'undefined' && Boolean(navigator.share);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-700/80 bg-slate-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl text-white">
        
        {/* Decorative Top Accent Glow */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-indigo-500/20 blur-3xl" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Success Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-inner">
            <CheckCircle2 className="h-9 w-9 animate-bounce" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              Bài viết đã được tạo thành công!
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">
              Nội dung chuẩn SEO & bắt trend đã sẵn sàng để đăng tải.
            </p>
          </div>
        </div>

        {/* Post Preview Box */}
        <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-left">
          <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5 mb-2.5">
            <span className="text-xs font-bold uppercase text-indigo-400 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" /> {platform} Post
            </span>
            <span className="text-[11px] text-slate-500">Sẵn sàng xuất bản</span>
          </div>
          <h4 className="text-sm font-bold text-slate-200 line-clamp-1">{title}</h4>
          <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {content}
          </p>
        </div>

        {/* Social Publishing Options */}
        <div className="mt-6 space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 text-left">
            Đăng tải lên các nền tảng:
          </label>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {/* Facebook Share Button */}
            <button
              onClick={handleFacebookShare}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-blue-600/30 bg-blue-600/10 p-3 text-blue-400 hover:bg-blue-600 hover:text-white transition-all hover:scale-105 shadow-md"
            >
              <FacebookIcon className="h-5 w-5" />
              <span className="text-xs font-bold">Facebook</span>
            </button>

            {/* TikTok Share Button */}
            <button
              onClick={handleTikTokShare}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-800/80 p-3 text-slate-200 hover:bg-black hover:text-white transition-all hover:scale-105 shadow-md"
            >
              <TikTokIcon className="h-5 w-5" />
              <span className="text-xs font-bold">TikTok</span>
            </button>

            {/* Instagram Share Button */}
            <button
              onClick={handleInstagramShare}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-pink-500/30 bg-pink-500/10 p-3 text-pink-400 hover:bg-gradient-to-tr hover:from-amber-500 hover:via-pink-500 hover:to-purple-600 hover:text-white transition-all hover:scale-105 shadow-md"
            >
              <InstagramIcon className="h-5 w-5" />
              <span className="text-xs font-bold">Instagram</span>
            </button>

            {/* Zalo Share Button */}
            <button
              onClick={handleZaloShare}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-3 text-blue-400 hover:bg-blue-600 hover:text-white transition-all hover:scale-105 shadow-md"
            >
              <ZaloIcon className="h-5 w-5" />
              <span className="text-xs font-bold">Zalo</span>
            </button>
          </div>

          {/* Secondary Actions: Native Web Share & Copy */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            {isWebShareSupported && (
              <button
                onClick={handleNativeShare}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/15 px-4 py-2.5 text-xs font-bold text-indigo-300 hover:bg-indigo-500 hover:text-white transition-all"
              >
                <Share2 className="h-4 w-4" /> Chia sẻ qua...
              </button>
            )}

            <button
              onClick={() => handleCopyToClipboard('Đã sao chép nội dung bài viết!')}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/90 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-all"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? 'Đã sao chép!' : 'Sao chép bài viết'}</span>
            </button>
          </div>
        </div>

        {/* Footer Done Action */}
        <div className="mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 text-sm transition-all shadow-lg shadow-indigo-600/30"
          >
            Hoàn tất
          </button>
        </div>

      </div>
    </div>
  );
}
