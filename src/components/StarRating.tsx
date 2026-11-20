import React from 'react';
import { Star } from 'lucide-react';

export interface StarRatingProps {
  rating: number;
  scoreOutOf10?: number;
  size?: 'sm' | 'md';
  showNumeric?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  scoreOutOf10,
  size = 'sm',
  showNumeric = true,
}) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.35;
  const iconSize = size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5';

  return (
    <div
      className="inline-flex items-center gap-1.5"
      aria-label={`Rated ${rating.toFixed(1)} out of 5 stars`}
    >
      <div className="flex items-center gap-0.5 text-[#F59E0B]" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((index) => {
          const isFilled = index < fullStars;
          const isHalf = !isFilled && index === fullStars && hasHalfStar;

          if (isFilled) {
            return <Star key={index} className={`${iconSize} fill-[#F59E0B] text-[#F59E0B]`} />;
          }
          if (isHalf) {
            return (
              <span key={index} className={`relative inline-block ${iconSize}`}>
                <Star className={`${iconSize} text-[#D1D5DB]`} />
                <span className="absolute inset-0 overflow-hidden w-1/2">
                  <Star className={`${iconSize} fill-[#F59E0B] text-[#F59E0B]`} />
                </span>
              </span>
            );
          }
          return <Star key={index} className={`${iconSize} text-[#D1D5DB]`} />;
        })}
      </div>
      {showNumeric && (
        <span className="text-[13px] font-semibold text-[#111827] tabular-nums">
          {rating.toFixed(1)}
          <span className="font-normal text-[#4B5563]"> / 5</span>
          {scoreOutOf10 !== undefined && (
            <span className="ml-1.5 text-[#4B5563] font-normal">
              · <strong className="font-semibold text-[#111827]">{scoreOutOf10.toFixed(1)}/10</strong>
            </span>
          )}
        </span>
      )}
    </div>
  );
};
