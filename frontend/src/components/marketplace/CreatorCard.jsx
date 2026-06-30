import { Link } from 'react-router-dom';
import { Star, Heart, MapPin, Check } from 'lucide-react';
import { useState } from 'react';

export default function CreatorCard({ creator, isLikedInitial = false }) {
  const [isLiked, setIsLiked] = useState(isLikedInitial);

  const formatFollowers = (count) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(0) + 'K';
    }
    return count;
  };

  return (
    <article className="bg-surface-container-lowest dark:bg-tertiary-container rounded-3xl shadow-[4px_24px_40px_rgba(255,143,163,0.08)] overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex flex-col group relative border border-surface-container/20">
      {/* Top Media Cover */}
      <div className="relative h-48 bg-surface-container/30 overflow-hidden">
        <img
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          src={creator.coverImage || creator.avatar}
          alt={creator.name}
        />
        
        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            setIsLiked(!isLiked);
          }}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface/80 dark:bg-surface-dim/80 backdrop-blur flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-secondary-container/40 transition-colors z-10"
        >
          <Heart
            size={18}
            className={isLiked ? 'fill-error text-error scale-110' : 'text-on-surface-variant'}
          />
        </button>

        {/* Rating Badge */}
        {creator.rating && (
          <div className="absolute top-4 left-4 bg-surface/90 dark:bg-surface-dim/95 backdrop-blur px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
            <Star size={14} className="fill-[#FFB400] text-[#FFB400]" />
            <span className="text-[11px] font-bold text-on-surface">{creator.rating}</span>
          </div>
        )}
      </div>

      {/* Details Area */}
      <div className="p-6 flex flex-col flex-1">
        {/* Creator Info */}
        <div className="flex justify-between items-start gap-2 mb-2">
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-headline-md text-base text-primary dark:text-inverse-primary leading-tight font-bold">
                {creator.name}
              </h3>
              {creator.verified && (
                <span className="bg-primary-container text-on-primary-container rounded-full p-0.5 w-4 h-4 flex items-center justify-center shrink-0">
                  <Check size={10} className="text-primary stroke-[3]" />
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
              <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                {creator.category}
              </span>
              {creator.location && (
                <>
                  <span className="text-outline text-[11px]">•</span>
                  <span className="text-[11px] text-outline flex items-center gap-0.5">
                    <MapPin size={10} />
                    {creator.location}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Platform Tags */}
          <div className="flex gap-1">
            {creator.platforms?.map((platform) => (
              <span
                key={platform}
                className="px-2 py-0.5 rounded-md bg-secondary-container/50 text-on-secondary-container font-label-sm text-[10px] uppercase font-bold"
              >
                {platform}
              </span>
            ))}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 my-4 py-3 border-y border-surface-variant/40 text-center">
          <div>
            <p className="text-[11px] text-on-surface-variant font-medium">Theo dõi</p>
            <p className="text-sm font-bold text-primary dark:text-inverse-primary">
              {formatFollowers(creator.followers)}
            </p>
          </div>
          <div className="border-x border-surface-variant/40">
            <p className="text-[11px] text-on-surface-variant font-medium">Tương tác</p>
            <p className="text-sm font-bold text-primary dark:text-inverse-primary">
              {creator.engagement}%
            </p>
          </div>
          <div>
            <p className="text-[11px] text-on-surface-variant font-medium">Chiến dịch</p>
            <p className="text-sm font-bold text-primary dark:text-inverse-primary">
              {creator.camps || 12}
            </p>
          </div>
        </div>

        {/* Est Price & CTA */}
        <div className="mt-auto flex items-center justify-between pt-2">
          <div>
            <p className="text-[10px] text-on-surface-variant leading-none">Chỉ từ</p>
            <p className="text-sm text-primary dark:text-inverse-primary font-bold mt-1">
              {creator.priceRange ? creator.priceRange : `$${creator.startingPrice || 150}`}
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              to={`/marketplace/kol/${creator.id}`}
              className="px-4 py-2 rounded-full border border-outline-variant text-primary hover:bg-surface-container transition-colors text-xs font-semibold"
            >
              Hồ sơ
            </Link>
            <Link
              to={`/marketplace/book/${creator.id}`}
              className="px-4 py-2 rounded-full bg-primary text-on-primary hover:bg-inverse-surface transition-colors text-xs font-semibold shadow-sm"
            >
              Đặt lịch
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
