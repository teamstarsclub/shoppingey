import React from 'react';
import { ArrowRight, Check } from 'lucide-react';
import type { ProductReview } from '../data/reviews';
import { getCategoryBySlug } from '../utils/catalog';
import { AmazonAffiliateButton } from './AmazonAffiliateButton';
import { Link } from './Link';
import { ProductImage } from './ProductImage';
import { StarRating } from './StarRating';

export interface ReviewCardProps {
  review: ProductReview;
}

/**
 * Storefront-grade Product Review Card used on Homepage & grids.
 * Keeps metadata crisp and scannable with uniform 4:3 imagery and aligned CTAs.
 */
export const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const category = getCategoryBySlug(review.categorySlug);

  return (
    <article className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {/* Studio Image Container */}
      <Link
        to={`/review/${review.slug}`}
        className="block border-b border-[#F3F4F6] group"
        aria-label={`Read full review of ${review.productName}`}
      >
        <ProductImage
          src={review.image}
          alt={review.imageAlt}
          className="group-hover:scale-[1.03]"
        />
      </Link>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Quiet Editorial Metadata Line (No pill clutter) */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#4B5563]">
          <span className="font-semibold text-[#B45309]">{review.editorialBadge}</span>
          <span aria-hidden="true">·</span>
          {category && (
            <Link
              to={`/category/${category.slug}`}
              className="hover:text-[#111827] hover:underline transition-colors"
            >
              {category.name}
            </Link>
          )}
          <span aria-hidden="true">·</span>
          <span>{review.priceTier}</span>
        </div>

        {/* Product Title */}
        <h3 className="mt-2 text-[17px] font-bold leading-snug text-[#111827]">
          <Link
            to={`/review/${review.slug}`}
            className="hover:text-[#B45309] transition-colors"
          >
            {review.productName}
          </Link>
        </h3>

        {/* Rating & Lab Score */}
        <div className="mt-2">
          <StarRating rating={review.rating} scoreOutOf10={review.scoreOutOf10} />
        </div>

        {/* 3 Quick Scannable Highlights */}
        <ul className="mt-3.5 space-y-1.5 text-[13px] leading-snug text-[#374151] flex-1">
          {review.highlights.slice(0, 3).map((item, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-[#059669] shrink-0 mt-0.5" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        {/* Actions Footer */}
        <div className="mt-5 pt-4 border-t border-[#F3F4F6] flex flex-col gap-3">
          <Link
            to={`/review/${review.slug}`}
            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-[13px] font-semibold text-[#111827] bg-[#F3F4F6] hover:bg-[#E5E7EB] rounded-md transition-colors whitespace-nowrap"
          >
            <span>Read Full Review</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>

          <AmazonAffiliateButton asin={review.asin} align="center" />
        </div>
      </div>
    </article>
  );
};
