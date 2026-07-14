import { useState, useEffect } from 'react';
import { Sparkles, Brain, TrendingUp, FileText, Palette, CheckCircle2 } from 'lucide-react';

const LOADING_STEPS = [
  {
    icon: Brain,
    message: 'Đang phân tích dữ liệu ngành hàng của bạn...',
    sub: 'AI đang nghiên cứu bối cảnh doanh nghiệp và thị trường mục tiêu.',
  },
  {
    icon: TrendingUp,
    message: 'AI đang tìm kiếm các kịch bản video xu hướng...',
    sub: 'Khám phá các format nội dung TikTok & Reels đang viral tại Việt Nam.',
  },
  {
    icon: FileText,
    message: 'Đang thiết lập danh sách công việc tối ưu chi phí...',
    sub: 'Xây dựng checklist hành động cụ thể từ A đến Z cho chiến dịch.',
  },
  {
    icon: Palette,
    message: 'Đang tạo ý tưởng nội dung sáng tạo...',
    sub: 'Thiết kế các ý tưởng phù hợp với ngân sách và ngành hàng.',
  },
  {
    icon: CheckCircle2,
    message: 'Sắp xong rồi! Đang đóng gói cẩm nang Playbook...',
    sub: 'Tổng hợp toàn bộ chiến lược thành quy trình thực thi hoàn chỉnh.',
  },
];

export default function AILoadingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  // Rotate messages every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Smooth progress bar (reaches ~90% over 30s, never hits 100 until done)
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) return prev;
        // Fast at first, slows down as it approaches 92
        const increment = Math.max(0.3, (92 - prev) * 0.04);
        return Math.min(92, prev + increment);
      });
    }, 300);
    return () => clearInterval(interval);
  }, []);

  const step = LOADING_STEPS[currentStep];
  const StepIcon = step.icon;

  return (
    <div className="fixed inset-0 bg-surface-container-lowest/95 dark:bg-surface/98 backdrop-blur-xl z-50 flex flex-col items-center justify-center transition-all duration-500">
      {/* Ambient background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-secondary-container/30 dark:bg-secondary-fixed/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-primary-container/20 dark:bg-primary/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-lg px-6">
        {/* Animated icon ring */}
        <div className="relative mb-10">
          {/* Outer ring - slow spin */}
          <div className="w-28 h-28 rounded-full border-[3px] border-secondary-container/50 dark:border-outline/20 border-t-secondary dark:border-t-secondary-fixed animate-spin" style={{ animationDuration: '3s' }} />
          {/* Inner ring - reverse spin */}
          <div className="absolute inset-3 w-[76px] h-[76px] rounded-full border-2 border-primary-container/40 border-b-primary animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-secondary-container dark:bg-secondary/20 flex items-center justify-center shadow-lg">
              <StepIcon className="text-on-secondary-container dark:text-secondary-fixed transition-all duration-500" size={24} />
            </div>
          </div>
          {/* Sparkle accents */}
          <Sparkles className="absolute -top-2 -right-2 text-secondary/60 animate-pulse" size={16} />
          <Sparkles className="absolute -bottom-1 -left-3 text-primary/40 animate-pulse delay-500" size={12} />
        </div>

        {/* Message area with smooth transitions */}
        <div className="text-center space-y-3 mb-10 min-h-[80px]" key={currentStep}>
          <h2
            className="text-xl md:text-2xl font-bold text-primary dark:text-inverse-primary animate-fade-in"
            style={{ animation: 'fadeSlideUp 0.5s ease-out' }}
          >
            {step.message}
          </h2>
          <p
            className="text-sm text-on-surface-variant max-w-sm mx-auto leading-relaxed"
            style={{ animation: 'fadeSlideUp 0.5s ease-out 0.1s both' }}
          >
            {step.sub}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-xs space-y-3">
          <div className="h-1.5 bg-surface-container dark:bg-surface-variant/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-secondary to-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-on-surface-variant font-medium">
              Đang xử lý...
            </span>
            <span className="text-[11px] font-bold text-primary dark:text-inverse-primary tabular-nums">
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        {/* Step indicators */}
        <div className="flex gap-2 mt-8">
          {LOADING_STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === currentStep
                  ? 'w-8 bg-secondary dark:bg-secondary-fixed'
                  : i < currentStep
                  ? 'w-3 bg-secondary/40 dark:bg-secondary-fixed/30'
                  : 'w-3 bg-surface-container-high dark:bg-outline/20'
              }`}
            />
          ))}
        </div>

        {/* Reassuring footer */}
        <p className="mt-8 text-[10px] text-outline dark:text-outline-variant tracking-wide uppercase font-semibold">
          Gemini AI đang làm việc • Thường mất 20-30 giây
        </p>
      </div>

      {/* CSS keyframes */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
