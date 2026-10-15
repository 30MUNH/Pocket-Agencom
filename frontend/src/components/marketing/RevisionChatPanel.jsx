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
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 md:p-5 shadow-lg border border-slate-200/90 space-y-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#FFCED2] flex items-center justify-center shadow-xs shrink-0 text-slate-900">
            <Sparkles size={16} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 leading-tight">
              Trợ lý chỉnh sửa AI
            </p>
            <p className="text-xs text-slate-500">
              Chưa ưng ý? Mô tả điều chỉnh, AI sẽ tái cấu trúc và cập nhật kế hoạch cho bạn trong vài giây.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
          <form
            onSubmit={handleSend}
            className="flex-1 flex items-center gap-2 bg-slate-50 rounded-xl pl-4 pr-1.5 py-1.5 border border-slate-200 focus-within:border-slate-900 focus-within:bg-white transition-all"
          >
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={refinePlanMutation.isPending}
              placeholder="Bạn muốn điều chỉnh gì? (VD: Đổi video sang quay điện thoại, thêm kênh TikTok Ads...)"
              className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none min-w-0 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!message.trim() || refinePlanMutation.isPending}
              aria-label="Gửi yêu cầu chỉnh sửa"
              className="w-8 h-8 rounded-lg bg-[#FFCED2] text-slate-900 flex items-center justify-center shrink-0 hover:bg-[#ffbfc5] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
            >
              {refinePlanMutation.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Send size={14} className="-ml-0.5" />
              )}
            </button>
          </form>

          <button
            onClick={handleExecute}
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm hover:bg-slate-800 transition-all shrink-0"
          >
            <Rocket size={14} />
            Thực hiện chiến dịch
          </button>
        </div>
      </div>
    </div>
  );
}
