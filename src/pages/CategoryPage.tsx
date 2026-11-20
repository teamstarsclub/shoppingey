import React, { useState, useEffect } from 'react';
import { ArrowRight, Check, ChevronRight, SlidersHorizontal, X } from 'lucide-react';
import { CATEGORIES, REVIEWS, type PriceTier } from '../data/reviews';
import {
  buildBreadcrumbJsonLd,
  buildCategoryCollectionJsonLd,
  formatDisplayDate,
  getCategoryBySlug,
  getCategoryReviewCount,
  getReviewsByCategory,
  sortReviews,
  type SortOption,
} from '../utils/catalog';
import { AmazonAffiliateButton } from '../components/AmazonAffiliateButton';
import { Link } from '../components/Link';
import { resolveAssetUrl } from '../utils/router';
import { ProductImage } from '../components/ProductImage';
import { SchemaMarkup } from '../components/SchemaMarkup';
import { SEOHead } from '../components/SEOHead';
import { StarRating } from '../components/StarRating';
import { NotFoundPage } from './NotFoundPage';

export interface CategoryPageProps {
  slug: string;
}

const PRICE_TIERS: Array<'all' | PriceTier> = ['all', 'Budget-Friendly', 'Mid-Range', 'Premium'];

export const CategoryPage: React.FC<CategoryPageProps> = ({ slug }) => {
  const category = getCategoryBySlug(slug, CATEGORIES);
  const [sortBy, setSortBy] = useState<SortOption>('rating');
  const [tierFilter, setTierFilter] = useState<'all' | PriceTier>('all');

  useEffect(() => {
    setSortBy('rating');
    setTierFilter('all');
  }, [slug]);

  if (!category) {
    return <NotFoundPage path={`/category/${slug}`} />;
  }

  const allCategoryReviews = getReviewsByCategory(category.slug, REVIEWS);
  const filteredReviews = allCategoryReviews.filter(
    (rev) => tierFilter === 'all' || rev.priceTier === tierFilter
  );
  const displayedReviews = sortReviews(filteredReviews, sortBy);
  const otherCategories = CATEGORIES.filter((c) => c.slug !== category.slug);

  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: category.name, path: `/category/${category.slug}` },
  ];

  const schemas = [
    buildCategoryCollectionJsonLd(category, allCategoryReviews),
    buildBreadcrumbJsonLd(breadcrumbs),
  ];

  return (
    <>
      <SEOHead
        title={`${category.name} Reviews (2026): Tested Amazon Picks | Shoppingey.com`}
        description={category.metaDescription}
        canonicalPath={`/category/${category.slug}`}
        ogType="website"
        image={category.featuredImage}
      />
      <SchemaMarkup id={`category-${category.slug}`} schemas={schemas} />

      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-5">
          <ol className="flex items-center flex-wrap gap-1.5 text-xs text-[#4B5563]">
            <li>
              <Link to="/" className="hover:text-[#111827] hover:underline">
                Home
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="w-3.5 h-3.5 text-[#9CA3AF]" />
            </li>
            <li aria-current="page" className="font-semibold text-[#111827]">
              {category.name}
            </li>
          </ol>
        </nav>

        {/* Category Hero Header */}
        <section className="bg-white border border-[#E5E7EB] rounded-lg p-6 sm:p-8 mb-6">
          <p className="text-xs font-semibold text-[#B45309]">
            Department Buying Guide · {allCategoryReviews.length}{' '}
            {allCategoryReviews.length === 1 ? 'Tested Review' : 'Tested Reviews'}
          </p>
          <h1 className="mt-1.5 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827]">
            Best {category.name} Reviews on Amazon (2026)
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-[#4B5563] max-w-3xl">
            {category.seoIntro}
          </p>
        </section>

        {/* Scalable Filter & Sort Toolbar */}
        <section
          aria-label="Filter and sort reviews"
          className="bg-white border border-[#E5E7EB] rounded-lg px-4 py-3 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4B5563] mr-1">
              <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
              Price Tier:
            </span>
            <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-[#F3F4F6] rounded-md">
              {PRICE_TIERS.map((tier) => {
                const active = tierFilter === tier;
                return (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setTierFilter(tier)}
                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                      active
                        ? 'bg-white text-[#111827] shadow-xs font-semibold'
                        : 'text-[#4B5563] hover:text-[#111827]'
                    }`}
                  >
                    {tier === 'all' ? 'All Tiers' : tier}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-3">
            <span className="text-xs text-[#4B5563] tabular-nums">
              Showing {displayedReviews.length} of {allCategoryReviews.length}
            </span>
            <div className="flex items-center gap-2">
              <label htmlFor="category-sort-select" className="text-xs font-semibold text-[#4B5563]">
                Sort by:
              </label>
              <select
                id="category-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="text-xs font-medium text-[#111827] bg-[#F9FAFB] border border-[#E5E7EB] rounded-md px-2.5 py-1.5 cursor-pointer hover:border-[#D1D5DB]"
              >
                <option value="rating">Highest Rated</option>
                <option value="newest">Newest Updated</option>
                <option value="price-asc">Price Tier: Budget to Premium</option>
                <option value="price-desc">Price Tier: Premium to Budget</option>
              </select>
            </div>
          </div>
        </section>

        {/* Product Review Listing Cards */}
        {displayedReviews.length === 0 ? (
          <div className="bg-white border border-[#E5E7EB] rounded-lg p-10 text-center">
            <p className="text-base font-semibold text-[#111827]">
              No {tierFilter} reviews published in {category.name} yet.
            </p>
            <p className="text-sm text-[#4B5563] mt-1">
              Reset the Price Tier filter to view our tested flagship pick in this department.
            </p>
            <button
              type="button"
              onClick={() => setTierFilter('all')}
              className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-[#131921] hover:bg-[#232F3E] rounded-md transition-colors cursor-pointer"
            >
              Show All {category.name} Reviews
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {displayedReviews.map((review) => (
              <article
                key={review.slug}
                className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden grid grid-cols-1 lg:grid-cols-12"
              >
                {/* Product Image Column */}
                <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-[#F3F4F6] flex flex-col justify-between bg-white p-4">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-semibold text-[#B45309]">{review.editorialBadge}</span>
                    <span className="font-mono font-semibold text-[#111827] tabular-nums">
                      Score {review.scoreOutOf10.toFixed(1)}/10
                    </span>
                  </div>
                  <Link
                    to={`/review/${review.slug}`}
                    aria-label={`Read full review of ${review.productName}`}
                    className="block group"
                  >
                    <ProductImage
                      src={review.image}
                      alt={review.imageAlt}
                      priority={true}
                      className="group-hover:scale-[1.03]"
                    />
                  </Link>
                  <p className="mt-2 text-[11px] text-[#4B5563] text-center">
                    Updated {formatDisplayDate(review.lastUpdated)} · By {review.author.name}
                  </p>
                </div>

                {/* Details, Specs Preview & Pros/Cons Snapshot */}
                <div className="lg:col-span-5 p-6 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#F3F4F6]">
                  <div>
                    <div className="flex flex-wrap items-center gap-x-2 text-xs text-[#4B5563]">
                      <span>{category.name}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-medium text-[#111827]">{review.priceTier}</span>
                    </div>

                    <h2 className="mt-1.5 text-xl font-bold text-[#111827] leading-snug">
                      <Link
                        to={`/review/${review.slug}`}
                        className="hover:text-[#B45309] transition-colors"
                      >
                        {review.productName}
                      </Link>
                    </h2>

                    <div className="mt-2">
                      <StarRating
                        rating={review.rating}
                        scoreOutOf10={review.scoreOutOf10}
                        size="md"
                      />
                    </div>

                    <p className="mt-3 text-sm leading-relaxed text-[#374151]">
                      {review.quickVerdict}
                    </p>

                    {/* Key Specs Preview */}
                    <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 pt-3 border-t border-[#F3F4F6] text-xs">
                      {review.specs.slice(0, 4).map((spec) => (
                        <div key={spec.label}>
                          <dt className="text-[#4B5563]">{spec.label}</dt>
                          <dd className="font-semibold text-[#111827] mt-0.5">{spec.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>

                  {/* Mini Pros / Cons Snapshot */}
                  <div className="mt-5 pt-4 border-t border-[#F3F4F6] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="font-bold text-[#065F46] mb-1.5">What We Liked</p>
                      <ul className="space-y-1 text-[#374151]">
                        {review.pros.slice(0, 2).map((pro, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <Check className="w-3.5 h-3.5 text-[#059669] shrink-0 mt-0.5" aria-hidden="true" />
                            <span>{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-bold text-[#991B1B] mb-1.5">Worth Knowing</p>
                      <ul className="space-y-1 text-[#374151]">
                        {review.cons.slice(0, 2).map((con, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <X className="w-3.5 h-3.5 text-[#DC2626] shrink-0 mt-0.5" aria-hidden="true" />
                            <span>{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Right Conversion Box */}
                <div className="lg:col-span-3 p-6 bg-[#FAFAFA] flex flex-col justify-center gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-[#4B5563]">Shoppingey Verdict</p>
                    <p className="text-2xl font-extrabold text-[#111827] tabular-nums">
                      {review.scoreOutOf10.toFixed(1)}
                      <span className="text-sm font-normal text-[#4B5563]"> / 10</span>
                    </p>
                    <p className="text-xs text-[#4B5563]">
                      Price Tier: <strong className="text-[#111827]">{review.priceTier}</strong>
                    </p>
                  </div>

                  <Link
                    to={`/review/${review.slug}`}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-[#131921] hover:bg-[#232F3E] rounded-md transition-colors whitespace-nowrap"
                  >
                    <span>Read Full Review</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>

                  <AmazonAffiliateButton asin={review.asin} align="left" />
                </div>
              </article>
            ))}
          </div>
        )}

        {/* More Categories to Explore (Internal Crawlability Strip) */}
        <section
          aria-labelledby="more-categories-heading"
          className="mt-12 pt-8 border-t border-[#E5E7EB]"
        >
          <h2
            id="more-categories-heading"
            className="text-lg font-bold text-[#111827] mb-4"
          >
            More Categories to Explore
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {otherCategories.map((other) => {
              const count = getCategoryReviewCount(other.slug, REVIEWS);
              return (
                <Link
                  key={other.slug}
                  to={`/category/${other.slug}`}
                  className="bg-white border border-[#E5E7EB] rounded-lg p-4 flex items-center gap-3.5 hover:border-[#D1D5DB] hover:shadow-sm transition-all group"
                >
                  <img
                    src={resolveAssetUrl(other.featuredImage)}
                    alt={other.name}
                    width={64}
                    height={48}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-16 h-12 object-contain bg-white border border-[#F3F4F6] rounded p-0.5 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#111827] group-hover:text-[#B45309] transition-colors truncate">
                      {other.name}
                    </p>
                    <p className="text-xs text-[#4B5563] mt-0.5 tabular-nums">
                      {count} {count === 1 ? 'Review' : 'Reviews'}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#111827] shrink-0" aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
};
