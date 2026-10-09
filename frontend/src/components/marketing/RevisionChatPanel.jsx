import { useState } from 'react';
import { Send, Rocket, Sparkles, Loader2 } from 'lucide-react';
import { useRefinePlan } from '../../hooks/useMarketingPlans';
import { toast } from '../../store/toastStore';

export default function RevisionChatPanel({ planId = null, onPlanUpdated = null }) {
  const [message, setMessage] = useState('');
  const refinePlanMutation = useRefinePlan();

  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;

    if (!planId) {
      toast.error('Chưa có mã kế hoạch để chỉnh sửa.');
      return;
    }

    try {
      const response = await refinePlanMutation.mutateAsync({
        id: planId,
        instruction: trimmed,
      });

      setMessage('');
      toast.success(
        response?.revisionSummary
          ? `AI đã điều chỉnh: ${response.revisionSummary}`
          : 'AI đã cập nhật kế hoạch theo yêu cầu của bạn!'
      );

      if (typeof onPlanUpdated === 'function' && response) {
        onPlanUpdated(response);
      }
    } catch (err) {
      toast.error(err.message || 'Không thể điều chỉnh kế hoạch.');
    }
  };

  const handleExecute = () => {
    toast.success('Kế hoạch đã sẵn sàng để thực hiện!');
  };

  return (
    <div className="sticky bottom-4 z-30">
      <div className="bg-surface-container-lowest/95 dark:bg-tertiary-container/95 backdrop-blur-md rounded-[2rem] p-5 md:p-6 shadow-[0_8px_40px_rgba(255,143,163,0.18)] border border-secondary-container/40 ring-1 ring-secondary/10 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-md shrink-0">
            <Sparkles size={14} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-primary dark:text-inverse-primary leading-tight">
              Trợ lý chỉnh sửa AI
            </p>
            <p className="text-[11px] text-on-surface-variant">
              Chưa ưng ý? Mô tả điều chỉnh, AI sẽ tái cấu trúc và cập nhật kế hoạch cho bạn trong vài giây.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch gap-3">
          <form
            onSubmit={handleSend}
            className="flex-1 flex items-center gap-2 bg-surface-container dark:bg-surface-variant/30 rounded-full pl-5 pr-1.5 py-1.5 border border-outline-variant/30 focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/15 transition-all"
          >
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={refinePlanMutation.isPending}
              placeholder="Bạn muốn điều chỉnh gì? (VD: Đổi video sang quay điện thoại, thêm kênh TikTok Ads...)"
              className="flex-1 bg-transparent text-sm text-primary dark:text-inverse-primary placeholder:text-on-surface-variant/60 focus:outline-none min-w-0 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!message.trim() || refinePlanMutation.isPending}
              aria-label="Gửi yêu cầu chỉnh sửa"
              className="w-10 h-10 rounded-full bg-secondary text-on-secondary flex items-center justify-center shrink-0 hover:bg-secondary/90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              {refinePlanMutation.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} className="-ml-0.5" />
              )}
            </button>
          </form>

          <button
            onClick={handleExecute}
            className="px-6 py-3 rounded-full bg-primary text-on-primary text-label-sm font-label-sm font-bold flex items-center justify-center gap-2 shadow-md hover:bg-primary/90 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all shrink-0"
          >
            <Rocket size={15} />
            Thực hiện chiến dịch
          </button>
        </div>
      </div>
    </div>
  );
}
