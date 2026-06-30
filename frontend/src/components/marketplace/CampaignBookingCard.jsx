import { Check, ArrowRight } from 'lucide-react';

export default function CampaignBookingCard({
  creator,
  budget,
  onBudgetChange,
  onSubmit,
  isSubmitting = false,
}) {
  return (
    <div className="sticky top-24 space-y-6">
      {/* Selected Creator Card */}
      <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-3xl p-6 shadow-[4px_24px_40px_rgba(255,143,163,0.08)] border border-surface-variant/50 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 100% 0%, var(--tw-colors-secondary-container) 0%, transparent 50%)',
          }}
        ></div>
        <h3 className="text-[11px] font-bold text-on-surface-variant mb-4 uppercase tracking-wider">
          Nhà sáng tạo đã chọn
        </h3>
        
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-secondary-container relative shrink-0">
            <img
              alt={creator.name}
              className="w-full h-full object-cover"
              src={creator.avatar}
            />
          </div>
          <div>
            <h4 className="font-headline-md text-primary dark:text-inverse-primary text-lg font-bold leading-tight">
              {creator.name}
            </h4>
            <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
              {creator.verified && (
                <span className="bg-secondary-container text-on-secondary-container rounded-full p-0.5">
                  <Check size={10} className="stroke-[3]" />
                </span>
              )}
              {creator.handle || `@${creator.name.toLowerCase().replace(/\s+/g, '')}`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {creator.category && (
            <span className="px-3 py-1 bg-surface-container dark:bg-surface-variant/40 rounded-full text-[11px] text-on-surface-variant font-medium">
              {creator.category}
            </span>
          )}
          {creator.location && (
            <span className="px-3 py-1 bg-surface-container dark:bg-surface-variant/40 rounded-full text-[11px] text-on-surface-variant font-medium">
              {creator.location}
            </span>
          )}
        </div>
      </div>

      {/* Budget & Submit Card */}
      <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-3xl p-6 shadow-[4px_24px_40px_rgba(255,143,163,0.08)] border border-surface-variant/50">
        <h3 className="text-[11px] font-bold text-on-surface-variant mb-4 uppercase tracking-wider">
          Tóm tắt Chi phí
        </h3>
        
        <div className="mb-6">
          <label
            htmlFor="budget-input"
            className="block font-label-sm text-label-sm text-on-surface mb-2 font-semibold"
          >
            Ngân sách Đề xuất (USD)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">$</span>
            <input
              className="w-full bg-surface-container dark:bg-surface-variant/20 border-none rounded-xl pl-8 pr-4 py-3 text-body-md focus:ring-2 focus:ring-secondary-fixed focus:bg-surface-container-lowest transition-all font-bold text-lg text-primary dark:text-inverse-primary"
              id="budget-input"
              type="number"
              placeholder="0.00"
              value={budget}
              onChange={(e) => onBudgetChange(e.target.value)}
            />
          </div>
          <p className="text-[11px] text-on-surface-variant mt-2 leading-relaxed">
            Mức giá thông thường của nhà sáng tạo bắt đầu từ khoảng{' '}
            <span className="font-semibold text-primary dark:text-inverse-primary">
              {creator.priceRange ? creator.priceRange : `$${creator.startingPrice || 150}`}
            </span>.
          </p>
        </div>

        <hr className="border-surface-variant/50 mb-6" />

        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="w-full py-4 px-6 bg-secondary-container hover:bg-secondary-fixed text-on-secondary-container dark:bg-on-secondary-fixed-variant dark:text-secondary-fixed rounded-full font-headline-md text-sm md:text-base font-bold hover:-translate-y-0.5 hover:shadow-lg active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:pointer-events-none"
        >
          {isSubmitting ? 'Đang gửi yêu cầu...' : 'Gửi Yêu cầu Đặt lịch'}
          {!isSubmitting && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
        </button>
        
        <p className="text-[11px] text-center text-on-surface-variant mt-4 leading-relaxed">
          Bạn sẽ không bị tính phí cho đến khi nhà sáng tạo xem xét và chấp nhận đề xuất.
        </p>
      </div>
    </div>
  );
}
