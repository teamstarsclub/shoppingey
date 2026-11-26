import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Cpu,
  FlaskConical,
  Lamp,
  Scale,
  ShieldCheck,
  Sprout,
  Tv,
  Utensils,
  Wrench,
} from 'lucide-react';
import {
  CATEGORIES,
  REVIEWS,
  SITE_CONFIG,
  type Category,
  type CategorySlug,
} from '../data/reviews';
import {
  buildHomePageJsonLd,
  getCategoryReviewCount,
  getReviewsByCategory,
  searchReviews,
  sortReviews,
} from '../utils/catalog';
import { Link } from '../components/Link';
import { resolveAssetUrl } from '../utils/router';
import { ReviewCard } from '../components/ReviewCard';
import { SchemaMarkup } from '../components/SchemaMarkup';
import { SEOHead } from '../components/SEOHead';

export interface HomePageProps {
  initialQuery?: string;
}

function CategoryIcon({ name }: { name: Category['iconName'] }) {
  const cls = 'w-4 h-4 text-[#D97706] shrink-0';
  switch (name) {
    case 'cpu':
      return <Cpu className={cls} aria-hidden="true" />;
    case 'tv':
      return <Tv className={cls} aria-hidden="true" />;
    case 'utensils':
      return <Utensils className={cls} aria-hidden="true" />;
    case 'lamp':
      return <Lamp className={cls} aria-hidden="true" />;
    case 'wrench':
      return <Wrench className={cls} aria-hidden="true" />;
    case 'sprout':
      return <Sprout className={cls} aria-hidden="true" />;
  }
}

export const HomePage: React.FC<HomePageProps> = ({ initialQuery }) => {
  const [selectedDepartment, setSelectedDepartment] = useState<'all' | CategorySlug>('all');
  const [showAllReviews, setShowAllReviews] = useState(false);

  const filteredByContext = initialQuery
    ? searchReviews(REVIEWS, initialQuery, 'all')
    : selectedDepartment === 'all'
      ? REVIEWS
      : getReviewsByCategory(selectedDepartment, REVIEWS);

  const orderedReviews = sortReviews(filteredByContext, 'rating');
  const visibleReviews =
    initialQuery || selectedDepartment !== 'all' || showAllReviews
      ? orderedReviews
      : orderedReviews.slice(0, 9);
  const selectedCategoryObj =
    selectedDepartment === 'all'
      ? undefined
      : CATEGORIES.find((c) => c.slug === selectedDepartment);

  return (
    <>
      <SEOHead
        title={
          initialQuery
            ? `Search: ${initialQuery} | Shoppingey.com`
            : 'Shoppingey.com — Independent Amazon Product Reviews (2026)'
        }
        description="Honest, hands-on Amazon product reviews tested and organized by department: Home & Tech, Home Electronics, Home & Kitchen, Home Decor, Tools, and Gardening Gadgets."
        canonicalPath="/"
        ogType="website"
        image={REVIEWS[1]?.image ?? REVIEWS[0].image}
        imageAlt="Shoppingey.com independent Amazon product reviews and buying guides"
        robots={
          initialQuery
            ? 'noindex, follow'
            : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
        }
      />
      {!initialQuery && <SchemaMarkup id="home" schemas={buildHomePageJsonLd()} />}

      {/* Compact Trust Hero Strip */}
      <section className="bg-white border-b border-[#E5E7EB]">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-8 md:py-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-wide text-[#B45309]">
              Independent Product Testing · Updated November 2026
            </p>
            <h1 className="mt-2 text-2xl sm:text-3xl lg:text-[34px] font-extrabold tracking-tight text-[#111827] leading-[1.18]">
              Honest Amazon Product Reviews — Tested, Compared &amp; Organized by Department
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-[#4B5563]">
              We buy, bench-test, and live with everyday home, kitchen, workshop, and garden
              products so you skip sponsored hype and pick gear that lasts.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-6 lg:gap-8 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#F3F4F6] text-sm">
            <div>
              <p className="text-xl font-extrabold text-[#111827] tabular-nums">
                {REVIEWS.length}
              </p>
              <p className="text-xs text-[#4B5563]">Tested Reviews</p>
            </div>
            <div className="h-8 w-px bg-[#E5E7EB] hidden sm:block" aria-hidden="true" />
            <div>
              <p className="text-xl font-extrabold text-[#111827] tabular-nums">
                {CATEGORIES.length}
              </p>
              <p className="text-xs text-[#4B5563]">Core Departments</p>
            </div>
            <div className="h-8 w-px bg-[#E5E7EB] hidden sm:block" aria-hidden="true" />
            <div>
              <p className="text-xl font-extrabold text-[#111827] tabular-nums">100%</p>
              <p className="text-xs text-[#4B5563]">Editorial Independence</p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-10 space-y-14">
        {/* Section 1: Browse by Category — 5-Card Visual Grid */}
        <section aria-labelledby="browse-categories-heading">
          <div className="flex items-end justify-between gap-4 mb-5">
            <div>
              <h2
                id="browse-categories-heading"
                className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827]"
              >
                Browse by Category
              </h2>
              <p className="text-sm text-[#4B5563] mt-1">
                Explore hands-on buying guides across all six Shoppingey.com departments.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CATEGORIES.map((category) => {
              const count = getCategoryReviewCount(category.slug, REVIEWS);
              return (
                <Link
                  key={category.slug}
                  to={`/category/${category.slug}`}
                  className="group bg-white border border-[#E5E7EB] rounded-lg overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#D1D5DB]"
                >
                  <div className="aspect-[4/3] w-full bg-[#F8F9FA] border-b border-[#F3F4F6] flex items-center justify-center p-3 overflow-hidden">
                    <img
                      src={resolveAssetUrl(category.featuredImage)}
                      alt={`${category.name} featured product`}
                      width={400}
                      height={300}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[15px] font-bold text-[#111827] group-hover:text-[#B45309] transition-colors">
                        <CategoryIcon name={category.iconName} />
                        <span>{category.name}</span>
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#4B5563] flex-1">
                      {category.shortDescription}
                    </p>
                    <div className="mt-3 pt-2.5 border-t border-[#F3F4F6] flex items-center justify-between text-xs font-semibold">
                      <span className="text-[#4B5563] tabular-nums">
                        {count} {count === 1 ? 'Review' : 'Reviews'}
                      </span>
                      <span className="text-[#111827] group-hover:text-[#B45309] inline-flex items-center gap-1 transition-colors">
                        Explore
                        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Section 2: Latest Featured Reviews Product Grid */}
        <section id="featured-reviews" aria-labelledby="featured-reviews-heading">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
            <div>
              <h2
                id="featured-reviews-heading"
                className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827]"
              >
                {initialQuery
                  ? `Search Results for "${initialQuery}"`
                  : selectedCategoryObj
                    ? `${selectedCategoryObj.name} — Top Tested Reviews`
                    : 'Latest Featured Reviews'}
              </h2>
              <p className="text-sm text-[#4B5563] mt-1">
                {initialQuery
                  ? `Showing ${orderedReviews.length} matching tested review${orderedReviews.length === 1 ? '' : 's'}.`
                  : selectedCategoryObj
                    ? `All ${orderedReviews.length} lab-tested ${selectedCategoryObj.name} picks, ranked by Shoppingey score.`
                    : `Our highest-rated Amazon picks across all ${CATEGORIES.length} departments (${REVIEWS.length} full reviews).`}
              </p>
            </div>
            {initialQuery ? (
              <Link
                to="/"
                className="text-sm font-semibold text-[#B45309] hover:underline whitespace-nowrap"
              >
                Clear search filter
              </Link>
            ) : selectedCategoryObj ? (
              <Link
                to={`/category/${selectedCategoryObj.slug}`}
                className="inline-flex items-center gap-1 text-sm font-semibold text-[#B45309] hover:underline whitespace-nowrap"
              >
                <span>Open {selectedCategoryObj.name} Hub</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            ) : null}
          </div>

          {/* Department Filter Strip (Clean Marketplace Tabs) */}
          {!initialQuery && (
            <div
              role="tablist"
              aria-label="Filter featured reviews by department"
              className="mb-6 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar"
            >
              <button
                type="button"
                role="tab"
                aria-selected={selectedDepartment === 'all'}
                onClick={() => setSelectedDepartment('all')}
                className={`px-3.5 py-2 text-xs font-semibold rounded-md border whitespace-nowrap transition-colors cursor-pointer ${
                  selectedDepartment === 'all'
                    ? 'bg-[#131921] text-white border-[#131921]'
                    : 'bg-white text-[#374151] border-[#E5E7EB] hover:border-[#D1D5DB] hover:text-[#111827]'
                }`}
              >
                All Departments ({REVIEWS.length})
              </button>
              {CATEGORIES.map((category) => {
                const count = getCategoryReviewCount(category.slug, REVIEWS);
                const isSelected = selectedDepartment === category.slug;
                return (
                  <button
                    key={category.slug}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setSelectedDepartment(category.slug)}
                    className={`px-3.5 py-2 text-xs font-semibold rounded-md border whitespace-nowrap transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#131921] text-white border-[#131921]'
                        : 'bg-white text-[#374151] border-[#E5E7EB] hover:border-[#D1D5DB] hover:text-[#111827]'
                    }`}
                  >
                    {category.name} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {visibleReviews.length === 0 ? (
            <div className="bg-white border border-[#E5E7EB] rounded-lg p-10 text-center">
              <p className="text-base font-semibold text-[#111827]">
                No reviews found matching &ldquo;{initialQuery}&rdquo;
              </p>
              <p className="text-sm text-[#4B5563] mt-1">
                Browse one of our six product departments above or view all tested reviews.
              </p>
              <Link
                to="/"
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#131921] hover:bg-[#232F3E] rounded-md transition-colors"
              >
                View All Featured Reviews
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleReviews.map((review) => (
                  <ReviewCard key={review.slug} review={review} />
                ))}
              </div>

              {!initialQuery && selectedDepartment === 'all' && orderedReviews.length > 9 && (
                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setShowAllReviews((prev) => !prev)}
                    className="px-5 py-2.5 text-sm font-semibold text-[#111827] bg-white border border-[#D1D5DB] hover:border-[#131921] hover:bg-[#F9FAFB] rounded-md transition-colors cursor-pointer"
                  >
                    {showAllReviews
                      ? 'Show Top 9 Featured Picks'
                      : `Show All ${orderedReviews.length} Tested Reviews`}
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* Section 3: Why Trust Shoppingey.com (E-E-A-T 3-Column Trust Section) */}
        <section
          aria-labelledby="why-trust-heading"
          className="bg-white border border-[#E5E7EB] rounded-lg p-6 sm:p-8 lg:p-10"
        >
          <div className="max-w-2xl mb-8">
            <h2
              id="why-trust-heading"
              className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827]"
            >
              Why Trust {SITE_CONFIG.name}
            </h2>
            <p className="text-sm text-[#4B5563] mt-1.5 leading-relaxed">
              We built Shoppingey.com to deliver clear, unvarnished product verdicts with zero
              sponsored placements and zero inflated star ratings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2.5">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[#FEF3C7] text-[#B45309]">
                <Scale className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-base font-bold text-[#111827]">Independent Research</h3>
              <p className="text-sm leading-relaxed text-[#4B5563]">
                Brands cannot buy a recommendation or preview our scores before publication. Every
                review includes genuine drawbacks alongside strengths so you know when to skip a
                product too.
              </p>
              <Link
                to="/about"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#111827] hover:text-[#B45309] pt-1"
              >
                <span>About our editorial team</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </div>

            <div className="space-y-2.5">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[#FEF3C7] text-[#B45309]">
                <FlaskConical className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-base font-bold text-[#111827]">Transparent Testing Criteria</h3>
              <p className="text-sm leading-relaxed text-[#4B5563]">
                Every reviewed item is graded on our consistent 5-point rubric—Build Quality,
                Performance, Value, Ease of Use, and Long-Term Durability—using measurable home
                and workshop benchmarks.
              </p>
              <Link
                to="/how-we-review"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#111827] hover:text-[#B45309] pt-1"
              >
                <span>See our 5-point testing process</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </div>

            <div className="space-y-2.5">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[#FEF3C7] text-[#B45309]">
                <ShieldCheck className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-base font-bold text-[#111827]">Reader-Supported Disclosure</h3>
              <p className="text-sm leading-relaxed text-[#4B5563]">
                Shoppingey.com is reader-supported. When you click through our Amazon links and make
                a qualifying purchase, we may earn a small affiliate commission at no extra cost to
                you.
              </p>
              <Link
                to="/affiliate-disclosure"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#111827] hover:text-[#B45309] pt-1"
              >
                <span>Read full FTC &amp; Associates disclosure</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="mt-8 pt-5 border-t border-[#F3F4F6] flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[#4B5563]">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#059669]" aria-hidden="true" />
              Zero static hardcoded prices—always check live Amazon availability
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#059669]" aria-hidden="true" />
              Regularly audited for discontinued models and updated firmware
            </span>
          </div>
        </section>
      </div>
    </>
  );
};
