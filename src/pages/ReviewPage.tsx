import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Award,
  Check,
  ChevronDown,
  ChevronRight,
  List,
  Ruler,
  ShieldCheck,
  X,
  ZoomIn,
} from 'lucide-react';
import { CATEGORIES, REVIEWS, type ProductReview } from '../data/reviews';
import {
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildProductReviewJsonLd,
  formatDisplayDate,
  getCategoryBySlug,
  getCompanionReviews,
  getReviewBySlug,
} from '../utils/catalog';
import { AmazonAffiliateButton } from '../components/AmazonAffiliateButton';
import { Link } from '../components/Link';
import { ProductImage } from '../components/ProductImage';
import { SchemaMarkup } from '../components/SchemaMarkup';
import { SEOHead } from '../components/SEOHead';
import { StarRating } from '../components/StarRating';
import { NotFoundPage } from './NotFoundPage';

export interface ReviewPageProps {
  slug: string;
}

type GalleryView = 'studio' | 'detail' | 'specs';

const TOC_ITEMS = [
  { id: 'verdict-scores', label: 'Verdict & Lab Scores' },
  { id: 'pros-cons', label: 'Pros & Cons' },
  { id: 'review-body', label: 'Key Features & Performance' },
  { id: 'specifications', label: 'Technical Specifications' },
  { id: 'companions', label: 'Companion Products' },
  { id: 'final-verdict', label: 'Final Verdict' },
  { id: 'faqs', label: 'Buyer FAQs' },
];

function CriteriaMeter({ label, score }: { label: string; score: number }) {
  const pct = Math.min(100, Math.max(0, score * 10));
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="font-medium text-[#374151]">{label}</span>
        <span className="font-mono font-semibold text-[#111827] tabular-nums">
          {score.toFixed(1)} / 10
        </span>
      </div>
      <div className="h-2 w-full bg-[#E5E7EB] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#F59E0B] rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function DimensionsBlueprint({ review }: { review: ProductReview }) {
  const { dimensionsSummary } = review;
  return (
    <div className="w-full aspect-[4/3] bg-[#F9FAFB] border border-[#E5E7EB] rounded-md p-5 sm:p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#E5E7EB]">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#111827]">
            <Ruler className="w-4 h-4 text-[#D97706]" aria-hidden="true" />
            Measured Dimensions &amp; Key Anatomy
          </span>
          <span className="font-mono text-[11px] text-[#4B5563]">ASIN: {review.asin}</span>
        </div>

        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="bg-white border border-[#E5E7EB] rounded p-2.5">
            <dt className="text-[11px] text-[#4B5563]">Width</dt>
            <dd className="text-sm font-mono font-semibold text-[#111827] tabular-nums mt-0.5">
              {dimensionsSummary.width}
            </dd>
          </div>
          <div className="bg-white border border-[#E5E7EB] rounded p-2.5">
            <dt className="text-[11px] text-[#4B5563]">Height</dt>
            <dd className="text-sm font-mono font-semibold text-[#111827] tabular-nums mt-0.5">
              {dimensionsSummary.height}
            </dd>
          </div>
          <div className="bg-white border border-[#E5E7EB] rounded p-2.5">
            <dt className="text-[11px] text-[#4B5563]">Depth</dt>
            <dd className="text-sm font-mono font-semibold text-[#111827] tabular-nums mt-0.5">
              {dimensionsSummary.depth}
            </dd>
          </div>
          <div className="bg-white border border-[#E5E7EB] rounded p-2.5">
            <dt className="text-[11px] text-[#4B5563]">Weight</dt>
            <dd className="text-sm font-mono font-semibold text-[#111827] tabular-nums mt-0.5">
              {dimensionsSummary.weight}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-4 pt-3 border-t border-[#E5E7EB]">
        <p className="text-[11px] font-semibold text-[#4B5563] mb-2">Hardware Callouts Verified in Lab</p>
        <ul className="space-y-1.5 text-xs text-[#111827]">
          {dimensionsSummary.callouts.map((callout, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="font-mono text-[11px] font-semibold text-[#B45309] tabular-nums">
                0{idx + 1}.
              </span>
              <span>{callout}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export const ReviewPage: React.FC<ReviewPageProps> = ({ slug }) => {
  const review = getReviewBySlug(slug, REVIEWS);
  const [galleryView, setGalleryView] = useState<GalleryView>('studio');
  const [showMobileStickyBar, setShowMobileStickyBar] = useState(false);
  const buyBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setGalleryView('studio');
    setShowMobileStickyBar(false);
  }, [slug]);

  useEffect(() => {
    const handleScroll = () => {
      if (!buyBoxRef.current) return;
      const rect = buyBoxRef.current.getBoundingClientRect();
      setShowMobileStickyBar(rect.bottom < 80);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [slug]);

  if (!review) {
    return <NotFoundPage path={`/review/${slug}`} />;
  }

  const category = getCategoryBySlug(review.categorySlug, CATEGORIES);
  const companions = getCompanionReviews(review, REVIEWS, CATEGORIES);

  const breadcrumbs = [
    { name: 'Home', path: '/' },
    ...(category
      ? [{ name: category.name, path: `/category/${category.slug}` }]
      : []),
    { name: review.productName, path: `/review/${review.slug}` },
  ];

  const schemas = [
    buildProductReviewJsonLd(review, category),
    buildFaqJsonLd(review),
    buildBreadcrumbJsonLd(breadcrumbs),
  ];

  return (
    <>
      <SEOHead
        title={`${review.productName} Review (2026): Worth Buying? | Shoppingey.com`}
        description={review.metaDescription}
        canonicalPath={`/review/${review.slug}`}
        ogType="article"
        image={review.image}
      />
      <SchemaMarkup id={`review-${review.slug}`} schemas={schemas} />

      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-5 sm:py-7 pb-20 md:pb-8">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-4">
          <ol className="flex items-center flex-wrap gap-1.5 text-xs text-[#4B5563]">
            <li>
              <Link to="/" className="hover:text-[#111827] hover:underline">
                Home
              </Link>
            </li>
            {category && (
              <>
                <li aria-hidden="true">
                  <ChevronRight className="w-3.5 h-3.5 text-[#9CA3AF]" />
                </li>
                <li>
                  <Link
                    to={`/category/${category.slug}`}
                    className="hover:text-[#111827] hover:underline"
                  >
                    {category.name}
                  </Link>
                </li>
              </>
            )}
            <li aria-hidden="true">
              <ChevronRight className="w-3.5 h-3.5 text-[#9CA3AF]" />
            </li>
            <li aria-current="page" className="font-semibold text-[#111827]">
              {review.productName}
            </li>
          </ol>
        </nav>

        {/* Top Review Affiliate Disclosure Notice */}
        <div className="mb-5 bg-white border border-[#E5E7EB] rounded-md px-4 py-2.5 flex items-center gap-2.5 text-xs text-[#4B5563]">
          <ShieldCheck className="w-4 h-4 text-[#D97706] shrink-0" aria-hidden="true" />
          <p>
            <strong className="text-[#111827]">Disclosure:</strong> Shoppingey.com independently
            tests and reviews products. Links to Amazon below are affiliate links—if you buy through
            them, we may earn a commission at no added cost to you.
          </p>
        </div>

        {/* Amazon-Style 2-Column Buy Box Hero */}
        <section
          ref={buyBoxRef}
          aria-label="Product summary and Amazon buy box"
          className="bg-white border border-[#E5E7EB] rounded-lg p-5 sm:p-7 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
        >
          {/* Left Column: Product Gallery & Thumbnail Switcher */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#F3F4F6]">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#B45309]">
                <Award className="w-4 h-4" aria-hidden="true" />
                <span>{review.editorialBadge}</span>
              </span>
              <span className="text-xs font-bold text-[#111827] bg-[#FEF3C7] px-2.5 py-1 rounded tabular-nums">
                Shoppingey Score: {review.scoreOutOf10.toFixed(1)}/10
              </span>
            </div>

            {/* Active Gallery Frame */}
            <div className="border border-[#E5E7EB] rounded-lg overflow-hidden bg-white">
              {galleryView === 'specs' ? (
                <DimensionsBlueprint review={review} />
              ) : (
                <ProductImage
                  src={review.image}
                  alt={
                    galleryView === 'detail'
                      ? `${review.productName} hardware close-up detail`
                      : review.imageAlt
                  }
                  priority={true}
                  zoomed={galleryView === 'detail'}
                  zoomOrigin={review.detailZoomOrigin}
                />
              )}
            </div>

            {/* Interactive Thumbnail Switcher */}
            <div
              role="group"
              aria-label="Product gallery views"
              className="grid grid-cols-3 gap-2.5"
            >
              <button
                type="button"
                onClick={() => setGalleryView('studio')}
                aria-pressed={galleryView === 'studio'}
                className={`p-2 rounded-md border text-left transition-all flex items-center gap-2 cursor-pointer ${
                  galleryView === 'studio'
                    ? 'border-[#F59E0B] bg-[#FFFBEB] ring-1 ring-[#F59E0B]'
                    : 'border-[#E5E7EB] bg-white hover:border-[#D1D5DB]'
                }`}
              >
                <img
                  src={review.image}
                  alt=""
                  width={48}
                  height={36}
                  referrerPolicy="no-referrer"
                  className="w-10 h-8 object-contain shrink-0 bg-white rounded"
                />
                <span className="text-xs font-semibold text-[#111827] leading-tight">
                  Studio View
                </span>
              </button>

              <button
                type="button"
                onClick={() => setGalleryView('detail')}
                aria-pressed={galleryView === 'detail'}
                className={`p-2 rounded-md border text-left transition-all flex items-center gap-2 cursor-pointer ${
                  galleryView === 'detail'
                    ? 'border-[#F59E0B] bg-[#FFFBEB] ring-1 ring-[#F59E0B]'
                    : 'border-[#E5E7EB] bg-white hover:border-[#D1D5DB]'
                }`}
              >
                <span className="w-8 h-8 rounded bg-[#F3F4F6] flex items-center justify-center shrink-0 text-[#374151]">
                  <ZoomIn className="w-4 h-4" aria-hidden="true" />
                </span>
                <span className="text-xs font-semibold text-[#111827] leading-tight">
                  Detail Zoom
                </span>
              </button>

              <button
                type="button"
                onClick={() => setGalleryView('specs')}
                aria-pressed={galleryView === 'specs'}
                className={`p-2 rounded-md border text-left transition-all flex items-center gap-2 cursor-pointer ${
                  galleryView === 'specs'
                    ? 'border-[#F59E0B] bg-[#FFFBEB] ring-1 ring-[#F59E0B]'
                    : 'border-[#E5E7EB] bg-white hover:border-[#D1D5DB]'
                }`}
              >
                <span className="w-8 h-8 rounded bg-[#F3F4F6] flex items-center justify-center shrink-0 text-[#374151]">
                  <Ruler className="w-4 h-4" aria-hidden="true" />
                </span>
                <span className="text-xs font-semibold text-[#111827] leading-tight">
                  Dimensions
                </span>
              </button>
            </div>
          </div>

          {/* Right Column: Title, Meta, Key Highlights, Quick Verdict & Above-the-Fold Affiliate CTA */}
          <div className="lg:col-span-7 flex flex-col">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827] leading-[1.2]">
              {review.reviewTitle}
            </h1>

            {/* Clean Editorial Metadata Line */}
            <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#4B5563]">
              <span>
                By <strong className="font-semibold text-[#111827]">{review.author.name}</strong>,{' '}
                {review.author.role}
              </span>
              <span aria-hidden="true">·</span>
              <span>Updated {formatDisplayDate(review.lastUpdated)}</span>
              <span aria-hidden="true">·</span>
              <span>
                Price Tier: <strong className="font-semibold text-[#111827]">{review.priceTier}</strong>
              </span>
            </div>

            {/* Star Rating Row */}
            <div className="mt-3 pb-4 border-b border-[#F3F4F6]">
              <StarRating rating={review.rating} scoreOutOf10={review.scoreOutOf10} size="md" />
            </div>

            {/* Quick Verdict */}
            <p className="mt-4 text-[15px] leading-relaxed text-[#1F2937] font-medium">
              {review.quickVerdict}
            </p>

            {/* Key Highlights */}
            <div className="mt-5">
              <h2 className="text-xs font-bold tracking-wide text-[#4B5563] mb-2.5">
                Key Highlights
              </h2>
              <ul className="space-y-2 text-sm text-[#374151]">
                {review.highlights.map((highlight, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <Check
                      className="w-4 h-4 text-[#059669] shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Above-the-Fold Affiliate CTA Box */}
            <div className="mt-6 pt-5 border-t border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <AmazonAffiliateButton asin={review.asin} align="left" />
              <div className="text-xs text-[#4B5563] space-y-1 sm:text-right">
                <p>
                  Category:{' '}
                  {category && (
                    <Link
                      to={`/category/${category.slug}`}
                      className="font-semibold text-[#111827] hover:text-[#B45309] underline"
                    >
                      {category.name}
                    </Link>
                  )}
                </p>
                <p className="font-mono text-[11px] text-[#6B7280]">
                  Ref ASIN: {review.asin}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Mobile Collapsible Table of Contents */}
        <details className="lg:hidden mt-6 bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
          <summary className="px-4 py-3 flex items-center justify-between text-sm font-bold text-[#111827] cursor-pointer">
            <span className="inline-flex items-center gap-2">
              <List className="w-4 h-4 text-[#D97706]" aria-hidden="true" />
              Table of Contents
            </span>
            <ChevronDown className="w-4 h-4 text-[#4B5563] faq-chevron transition-transform" />
          </summary>
          <nav aria-label="Article sections" className="px-4 pb-4 pt-1 border-t border-[#F3F4F6]">
            <ol className="space-y-2 text-sm">
              {TOC_ITEMS.map((item, idx) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="flex items-center gap-2 text-[#374151] hover:text-[#B45309] py-0.5"
                  >
                    <span className="font-mono text-xs text-[#9CA3AF] tabular-nums">
                      0{idx + 1}.
                    </span>
                    <span>{item.label}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </details>

        {/* Main Review Grid: Sticky Desktop Sidebar TOC + Editorial Article */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sticky Desktop Table of Contents Sidebar */}
          <aside className="hidden lg:block lg:col-span-3 sticky top-[118px] space-y-5">
            <nav
              aria-label="Table of contents"
              className="bg-white border border-[#E5E7EB] rounded-lg p-5"
            >
              <h2 className="text-xs font-bold tracking-wide text-[#4B5563] mb-3 flex items-center gap-1.5">
                <List className="w-3.5 h-3.5 text-[#D97706]" aria-hidden="true" />
                On This Page
              </h2>
              <ol className="space-y-2 text-[13px]">
                {TOC_ITEMS.map((item, idx) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="flex items-center gap-2 text-[#374151] hover:text-[#B45309] py-1 transition-colors"
                    >
                      <span className="font-mono text-[11px] text-[#9CA3AF] tabular-nums">
                        0{idx + 1}
                      </span>
                      <span className="font-medium">{item.label}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            {/* Compact Sidebar Quick CTA */}
            <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 space-y-3">
              <p className="text-xs font-semibold text-[#B45309]">{review.editorialBadge}</p>
              <p className="text-sm font-bold text-[#111827] leading-snug">
                {review.productName}
              </p>
              <StarRating rating={review.rating} scoreOutOf10={review.scoreOutOf10} />
              <div className="pt-2">
                <AmazonAffiliateButton asin={review.asin} align="left" />
              </div>
            </div>
          </aside>

          {/* Editorial Review Main Column */}
          <article className="lg:col-span-9 space-y-8 min-w-0">
            {/* 1. Verdict & 5-Point Lab Score Breakdown */}
            <section
              id="verdict-scores"
              className="scroll-mt-32 bg-white border border-[#E5E7EB] rounded-lg p-6 sm:p-8"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#F3F4F6]">
                <div>
                  <h2 className="text-xl font-bold text-[#111827]">
                    Shoppingey Lab Verdict &amp; Score Breakdown
                  </h2>
                  <p className="text-xs text-[#4B5563] mt-1">
                    Scored across our standardized 5-point independent evaluation rubric.{' '}
                    <Link to="/how-we-review" className="underline text-[#111827] hover:text-[#B45309]">
                      How we test
                    </Link>
                  </p>
                </div>
                <div className="shrink-0 bg-[#131921] text-white rounded-lg px-4 py-2.5 text-center">
                  <span className="block text-[11px] text-[#D1D5DB]">Overall Score</span>
                  <span className="text-2xl font-extrabold text-[#F59E0B] tabular-nums">
                    {review.scoreOutOf10.toFixed(1)}
                    <span className="text-xs font-normal text-[#9CA3AF]">/10</span>
                  </span>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <CriteriaMeter label="Build Quality" score={review.criteriaScores.buildQuality} />
                <CriteriaMeter label="Performance" score={review.criteriaScores.performance} />
                <CriteriaMeter label="Value" score={review.criteriaScores.value} />
                <CriteriaMeter label="Ease of Use" score={review.criteriaScores.easeOfUse} />
                <CriteriaMeter label="Durability" score={review.criteriaScores.durability} />
              </div>
            </section>

            {/* 2. Pros & Cons Split Card */}
            <section
              id="pros-cons"
              aria-labelledby="pros-cons-heading"
              className="scroll-mt-32 bg-white border border-[#E5E7EB] rounded-lg overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-[#F3F4F6]">
                <h2 id="pros-cons-heading" className="text-xl font-bold text-[#111827]">
                  Pros &amp; Cons
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#E5E7EB]">
                {/* Pros */}
                <div className="p-6">
                  <h3 className="text-sm font-bold text-[#065F46] mb-3.5 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#D1FAE5] text-[#059669]">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
                    </span>
                    What We Liked
                  </h3>
                  <ul className="space-y-2.5 text-sm leading-relaxed text-[#1F2937]">
                    {review.pros.map((pro, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <Check
                          className="w-4 h-4 text-[#059669] shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Cons */}
                <div className="p-6">
                  <h3 className="text-sm font-bold text-[#991B1B] mb-3.5 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#FEE2E2] text-[#DC2626]">
                      <X className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
                    </span>
                    Room for Improvement
                  </h3>
                  <ul className="space-y-2.5 text-sm leading-relaxed text-[#1F2937]">
                    {review.cons.map((con, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <X
                          className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* 3. Detailed Editorial Review Sections (with inline contextual internal link) */}
            <section
              id="review-body"
              className="scroll-mt-32 bg-white border border-[#E5E7EB] rounded-lg p-6 sm:p-8 space-y-8"
            >
              {review.sections.map((section) => (
                <div key={section.id} className="space-y-3.5">
                  <h2 className="text-xl font-bold text-[#111827] tracking-tight">
                    {section.heading}
                  </h2>
                  {section.paragraphs.map((paragraph, idx) => (
                    <p
                      key={idx}
                      className="text-[15.5px] leading-[1.72] text-[#374151] max-w-[72ch]"
                    >
                      {paragraph}
                    </p>
                  ))}
                  {section.inlineLink && (
                    <p className="text-[15.5px] leading-[1.72] text-[#374151] max-w-[72ch]">
                      {section.inlineLink.beforeText}
                      <Link
                        to={`/review/${section.inlineLink.targetSlug}`}
                        className="font-semibold text-[#B45309] underline decoration-[#F59E0B] underline-offset-2 hover:text-[#92400E]"
                      >
                        {section.inlineLink.linkText}
                      </Link>
                      {section.inlineLink.afterText}
                    </p>
                  )}
                </div>
              ))}
            </section>

            {/* 4. Zebra-Striped Technical Specifications Table */}
            <section
              id="specifications"
              aria-labelledby="specs-heading"
              className="scroll-mt-32 bg-white border border-[#E5E7EB] rounded-lg overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-[#F3F4F6]">
                <h2 id="specs-heading" className="text-xl font-bold text-[#111827]">
                  Technical Specifications
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <tbody className="divide-y divide-[#E5E7EB] text-sm">
                    {review.specs.map((spec, idx) => (
                      <tr
                        key={spec.label}
                        className={idx % 2 === 0 ? 'bg-white' : 'bg-[#F9FAFB]'}
                      >
                        <th
                          scope="row"
                          className="px-6 py-3.5 font-semibold text-[#111827] w-[38%] sm:w-[34%] align-top"
                        >
                          {spec.label}
                        </th>
                        <td className="px-6 py-3.5 text-[#374151] tabular-nums">
                          {spec.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 5. Mandatory "Companion & Similar Products We Reviewed" Module */}
            {companions.length > 0 && (
              <section
                id="companions"
                aria-labelledby="companions-heading"
                className="scroll-mt-32 bg-white border border-[#E5E7EB] rounded-lg p-6 sm:p-8"
              >
                <div className="mb-5">
                  <p className="text-xs font-semibold text-[#B45309]">
                    Frequently Paired &amp; Tested Together
                  </p>
                  <h2
                    id="companions-heading"
                    className="text-xl font-bold text-[#111827] mt-0.5"
                  >
                    Companion &amp; Similar Products We Reviewed
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {companions.map(({ review: compReview, category: compCategory, reason }) => (
                    <div
                      key={compReview.slug}
                      className="border border-[#E5E7EB] rounded-lg p-4 flex flex-col sm:flex-row gap-4 bg-[#FAFAFA] hover:border-[#D1D5DB] transition-colors"
                    >
                      <Link
                        to={`/review/${compReview.slug}`}
                        className="w-full sm:w-28 aspect-[4/3] sm:aspect-square bg-white border border-[#E5E7EB] rounded p-1.5 flex items-center justify-center shrink-0"
                        aria-label={`Read review of ${compReview.productName}`}
                      >
                        <img
                          src={compReview.image}
                          alt={compReview.productName}
                          width={160}
                          height={120}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain"
                        />
                      </Link>
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <p className="text-[11px] font-semibold text-[#4B5563]">
                            {compCategory?.name} · {compReview.priceTier}
                          </p>
                          <h3 className="mt-0.5 text-sm font-bold text-[#111827] leading-snug">
                            <Link
                              to={`/review/${compReview.slug}`}
                              className="hover:text-[#B45309] transition-colors"
                            >
                              {compReview.productName}
                            </Link>
                          </h3>
                          <div className="mt-1.5">
                            <StarRating rating={compReview.rating} size="sm" />
                          </div>
                          <p className="mt-2 text-xs leading-relaxed text-[#4B5563]">
                            {reason}
                          </p>
                        </div>

                        <Link
                          to={`/review/${compReview.slug}`}
                          className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#111827] hover:text-[#B45309] transition-colors"
                        >
                          <span>Read Review</span>
                          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 6. Final Verdict Box with Second Amazon Affiliate CTA */}
            <section
              id="final-verdict"
              aria-labelledby="final-verdict-heading"
              className="scroll-mt-32 bg-[#131921] text-white rounded-lg p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-2.5 max-w-2xl">
                <p className="text-xs font-semibold text-[#F59E0B]">
                  Final Verdict · {review.editorialBadge}
                </p>
                <h2
                  id="final-verdict-heading"
                  className="text-xl sm:text-2xl font-bold text-white"
                >
                  Is the {review.productName} Worth Buying?
                </h2>
                <p className="text-sm leading-relaxed text-[#D1D5DB]">
                  {review.quickVerdict}
                </p>
                <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#E5E7EB]">
                  <span className="font-semibold text-[#F59E0B] tabular-nums">
                    Shoppingey Score: {review.scoreOutOf10.toFixed(1)} / 10
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">Star Rating: {review.rating.toFixed(1)} / 5</span>
                  <span aria-hidden="true">·</span>
                  <span>Price Tier: {review.priceTier}</span>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shrink-0 self-start md:self-center">
                <AmazonAffiliateButton asin={review.asin} align="center" />
              </div>
            </section>

            {/* 7. Buyer FAQ Accordion (Native HTML <details>/<summary> for Google Crawlability) */}
            <section
              id="faqs"
              aria-labelledby="faqs-heading"
              className="scroll-mt-32 bg-white border border-[#E5E7EB] rounded-lg p-6 sm:p-8"
            >
              <h2 id="faqs-heading" className="text-xl font-bold text-[#111827] mb-4">
                Frequently Asked Buyer Questions
              </h2>
              <div className="divide-y divide-[#E5E7EB] border-t border-b border-[#E5E7EB]">
                {review.faqs.map((faq, idx) => (
                  <details key={idx} className="group py-4" open={idx === 0}>
                    <summary className="flex items-center justify-between gap-4 cursor-pointer text-[15px] font-semibold text-[#111827] hover:text-[#B45309] transition-colors">
                      <span>{faq.question}</span>
                      <ChevronDown
                        className="w-4 h-4 text-[#6B7280] shrink-0 faq-chevron transition-transform duration-200"
                        aria-hidden="true"
                      />
                    </summary>
                    <p className="mt-2.5 text-sm leading-relaxed text-[#4B5563] pr-6">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          </article>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar (Slim, non-intrusive, appears only after scrolling past Hero Buy Box) */}
      <div
        aria-hidden={!showMobileStickyBar}
        className={`md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E5E7EB] shadow-[0_-4px_16px_rgba(19,25,33,0.1)] px-3.5 py-2 flex items-center justify-between gap-3 transition-transform duration-200 ${
          showMobileStickyBar ? 'translate-y-0' : 'translate-y-full pointer-events-none'
        }`}
      >
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-[#111827] truncate">{review.productName}</p>
          <p className="text-[11px] text-[#4B5563] tabular-nums">
            Score {review.scoreOutOf10.toFixed(1)}/10 · {review.priceTier}
          </p>
        </div>
        <AmazonAffiliateButton
          asin={review.asin}
          showHelperText={false}
          compact={true}
          align="center"
        />
      </div>
    </>
  );
};
