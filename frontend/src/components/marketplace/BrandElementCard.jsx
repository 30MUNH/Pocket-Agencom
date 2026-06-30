import { Star } from 'lucide-react';

export default function BrandElementCard({ testimonial }) {
  const ratingStars = Array.from({ length: 5 }, (_, index) => {
    const starValue = index + 1;
    const isFilled = starValue <= Math.floor(testimonial.rating);
    return (
      <Star
        key={index}
        size={14}
        className={isFilled ? 'fill-[#fbbf24] text-[#fbbf24]' : 'text-surface-variant'}
      />
    );
  });

  return (
    <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-6 shadow-[4px_24px_40px_rgba(255,143,163,0.08)] border border-surface-container/20 flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          {/* Avatar Icon */}
          <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-sm select-none">
            {testimonial.avatarLetter || testimonial.brandName.charAt(0)}
          </div>
          <div>
            <h4 className="font-headline-md text-sm font-semibold text-primary dark:text-inverse-primary">
              {testimonial.brandName}
            </h4>
            <p className="text-[11px] text-on-surface-variant leading-none mt-0.5">
              {testimonial.role || 'Quản lý Thương hiệu'}
            </p>
          </div>
        </div>

        {/* Rating & Date */}
        <div className="flex flex-col items-end gap-1">
          <div className="flex gap-0.5">{ratingStars}</div>
          <span className="text-[10px] text-on-surface-variant">{testimonial.date || 'Gần đây'}</span>
        </div>
      </div>

      {/* Review Comment */}
      <p className="font-body-md text-xs text-on-surface leading-relaxed">
        {testimonial.comment}
      </p>
    </div>
  );
}
