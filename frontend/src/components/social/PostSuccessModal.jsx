import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Share2, 
  Copy, 
  Check, 
  ExternalLink, 
  X, 
  Sparkles, 
  Globe,
  Send,
  MessageSquare
} from 'lucide-react';
import { toast } from '../../store/toastStore';

export default function PostSuccessModal({ isOpen, onClose, post = null }) {
  const [copiedText, setCopiedText] = useState(false);

  if (!isOpen) return null;

  const postTitle = post?.title || 'Bài viết đã được tạo thành công';
  const postContent = post?.content || '';
  const postUrl = post?.url || window.location.href;

  // Social Share Intent URLs
  const shareLinks = [
    {
      name: 'Facebook',
      color: 'bg-blue-600 hover:bg-blue-700 text-white',
      icon: Globe,
      action: () => {
        const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
        window.open(fbUrl, '_blank', 'width=600,height=400');
      }
    },
    {
      name: 'TikTok',
      color: 'bg-black hover:bg-slate-900 text-white',
      icon: Send,
      action: async () => {
        try {
          await navigator.clipboard.writeText(postContent);
          toast.success('Đã sao chép nội dung bài viết! Đang mở TikTok...');
          setTimeout(() => {
            window.open('https://www.tiktok.com/upload', '_blank');
          }, 800);
        } catch (err) {
          toast.error('Không thể sao chép nội dung tự động.');
        }
      }
    },
    {
      name: 'Instagram',
      color: 'bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white',
      icon: Sparkles,
      action: async () => {
        try {
          await navigator.clipboard.writeText(postContent);
          toast.success('Đã sao chép nội dung! Hãy dán vào bài viết Instagram.');
          setTimeout(() => {
            window.open('https://www.instagram.com', '_blank');
          }, 800);
        } catch (err) {
          toast.error('Không thể sao chép nội dung.');
        }
      }
    },
    {
      name: 'Zalo',
      color: 'bg-blue-500 hover:bg-blue-600 text-white',
      icon: MessageSquare,
      action: async () => {
        try {
          await navigator.clipboard.writeText(postContent);
          toast.success('Đã sao chép nội dung bài viết cho Zalo!');
          setTimeout(() => {
            window.open('https://chat.zalo.me', '_blank');
          }, 800);
        } catch (err) {
          toast.error('Không thể sao chép nội dung.');
        }
      }
    }
  ];

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(postContent);
      setCopiedText(true);
      toast.success('Đã sao chép toàn bộ nội dung bài viết!');
      setTimeout(() => setCopiedText(false), 2000);
    } catch (err) {
      toast.error('Không thể sao chép nội dung.');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: postTitle,
          text: postContent,
          url: postUrl,
        });
        toast.success('Đã chia sẻ thành công!');
      } catch (err) {
        console.log('Native share error/cancelled:', err);
      }
    } else {
      toast.info('Trình duyệt không hỗ trợ Web Share API. Hãy sử dụng các nút bên trên!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] bg-surface-container-lowest dark:bg-tertiary-container p-6 sm:p-8 shadow-ambient border border-surface-variant/40 text-primary dark:text-inverse-primary">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-6 top-6 rounded-full p-2 text-on-surface-variant hover:bg-surface-container-high transition-colors"
        >
          <X size={20} />
        </button>

        {/* Success Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-secondary-container text-secondary flex items-center justify-center">
            <CheckCircle2 size={32} />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-secondary bg-secondary-container px-3 py-1 rounded-full">
            Tạo bài thành công
          </span>
          <h3 className="text-2xl font-bold text-primary dark:text-inverse-primary">
            Bài viết đã sẵn sàng đăng tải!
          </h3>
          <p className="text-xs text-on-surface-variant max-w-sm">
            Chọn nền tảng mạng xã hội bạn muốn xuất bản bài viết bên dưới.
          </p>
        </div>

        {/* Post Content Preview Box */}
        {postContent && (
          <div className="mt-6 rounded-3xl bg-surface-container-low dark:bg-surface-variant/20 p-4 border border-surface-variant/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                Xem trước nội dung
              </span>
              <button
                onClick={handleCopyContent}
                className="inline-flex items-center gap-1 text-xs font-bold text-secondary hover:underline"
              >
                {copiedText ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                <span>{copiedText ? 'Đã copy' : 'Sao chép nội dung'}</span>
              </button>
            </div>
            <p className="text-xs text-primary dark:text-inverse-primary line-clamp-3 leading-relaxed whitespace-pre-wrap">
              {postContent}
            </p>
          </div>
        )}

        {/* Platform Share Action Buttons */}
        <div className="mt-6 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant block text-center">
            Đăng tải lên các nền tảng:
          </span>

          <div className="grid grid-cols-2 gap-3">
            {shareLinks.map((link, idx) => {
              const Icon = link.icon;
              return (
                <button
                  key={idx}
                  onClick={link.action}
                  className={`py-3 px-4 rounded-2xl font-label-sm text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-[0.98] ${link.color}`}
                >
                  <Icon size={16} />
                  <span>{link.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Web Share API Fallback */}
        {typeof navigator !== 'undefined' && navigator.share && (
          <div className="mt-4 pt-4 border-t border-surface-variant/30 text-center">
            <button
              onClick={handleNativeShare}
              className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-full bg-secondary-container text-primary font-label-sm text-xs font-bold hover:bg-secondary-container/80 transition-colors"
            >
              <Share2 size={16} /> Chia sẻ qua ứng dụng khác (Web Share API)
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
