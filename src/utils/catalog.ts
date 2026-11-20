import {
  CATEGORIES,
  REVIEWS,
  SITE_CONFIG,
  type Category,
  type CategorySlug,
  type PriceTier,
  type ProductReview,
} from '../data/reviews';

export type SortOption = 'rating' | 'newest' | 'price-asc' | 'price-desc';

const PRICE_TIER_RANK: Record<PriceTier, number> = {
  'Budget-Friendly': 1,
  'Mid-Range': 2,
  Premium: 3,
};

export function getAmazonAffiliateUrl(asin: string): string {
  return `https://amazon.com/dp/${asin.trim()}?tag=${SITE_CONFIG.affiliateTag}`;
}

export function getCategoryBySlug(
  slug: string,
  categories: Category[] = CATEGORIES
): Category | undefined {
  return categories.find((cat) => cat.slug === slug);
}

export function getReviewBySlug(
  slug: string,
  reviews: ProductReview[] = REVIEWS
): ProductReview | undefined {
  return reviews.find((rev) => rev.slug === slug);
}

export function getReviewsByCategory(
  categorySlug: CategorySlug | string,
  reviews: ProductReview[] = REVIEWS
): ProductReview[] {
  return reviews.filter((rev) => rev.categorySlug === categorySlug);
}

export function getCategoryReviewCount(
  categorySlug: CategorySlug,
  reviews: ProductReview[] = REVIEWS
): number {
  return reviews.filter((rev) => rev.categorySlug === categorySlug).length;
}

export function searchReviews(
  reviews: ProductReview[],
  query: string,
  categoryFilter: CategorySlug | 'all' = 'all'
): ProductReview[] {
  const normalizedQuery = query.trim().toLowerCase();

  return reviews.filter((review) => {
    if (categoryFilter !== 'all' && review.categorySlug !== categoryFilter) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const category = getCategoryBySlug(review.categorySlug);
    const haystack = [
      review.productName,
      review.reviewTitle,
      review.quickVerdict,
      review.editorialBadge,
      review.priceTier,
      review.asin,
      category?.name ?? '',
      ...review.highlights,
      ...review.pros,
      ...review.specs.map((s) => `${s.label} ${s.value}`),
    ]
      .join(' ')
      .toLowerCase();

    return normalizedQuery
      .split(/\s+/)
      .every((token) => haystack.includes(token));
  });
}

export function sortReviews(
  reviews: ProductReview[],
  sortBy: SortOption
): ProductReview[] {
  const copy = [...reviews];
  switch (sortBy) {
    case 'rating':
      return copy.sort((a, b) => b.scoreOutOf10 - a.scoreOutOf10 || b.rating - a.rating);
    case 'newest':
      return copy.sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated));
    case 'price-asc':
      return copy.sort(
        (a, b) =>
          PRICE_TIER_RANK[a.priceTier] - PRICE_TIER_RANK[b.priceTier] ||
          b.scoreOutOf10 - a.scoreOutOf10
      );
    case 'price-desc':
      return copy.sort(
        (a, b) =>
          PRICE_TIER_RANK[b.priceTier] - PRICE_TIER_RANK[a.priceTier] ||
          b.scoreOutOf10 - a.scoreOutOf10
      );
    default:
      return copy;
  }
}

export interface ResolvedCompanion {
  review: ProductReview;
  category: Category | undefined;
  reason: string;
}

export function getCompanionReviews(
  review: ProductReview,
  reviews: ProductReview[] = REVIEWS,
  categories: Category[] = CATEGORIES
): ResolvedCompanion[] {
  return review.companions
    .map((comp) => {
      const target = reviews.find((r) => r.slug === comp.slug);
      if (!target) return null;
      return {
        review: target,
        category: categories.find((c) => c.slug === target.categorySlug),
        reason: comp.reason,
      };
    })
    .filter((item): item is ResolvedCompanion => item !== null);
}

export function formatDisplayDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return isoDate;
  const date = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

// ============================================================================
// GOOGLE RICH RESULTS JSON-LD BUILDERS
// ============================================================================

export function buildSitewideJsonLd(): Record<string, unknown>[] {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.domain,
      email: SITE_CONFIG.contactEmail,
      description: SITE_CONFIG.tagline,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.domain,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_CONFIG.domain}/?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  ];
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: `${SITE_CONFIG.domain}${item.path}`,
    })),
  };
}

export function buildCategoryCollectionJsonLd(
  category: Category,
  categoryReviews: ProductReview[]
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${category.name} Reviews — ${SITE_CONFIG.name}`,
    description: category.metaDescription,
    url: `${SITE_CONFIG.domain}/category/${category.slug}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: categoryReviews.length,
      itemListElement: categoryReviews.map((review, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${SITE_CONFIG.domain}/review/${review.slug}`,
        name: review.productName,
      })),
    },
  };
}

export function buildProductReviewJsonLd(
  review: ProductReview,
  category?: Category
): Record<string, unknown> {
  const reviewUrl = `${SITE_CONFIG.domain}/review/${review.slug}`;
  const imageUrl = review.image.startsWith('http')
    ? review.image
    : `${SITE_CONFIG.domain}${review.image}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: review.productName,
    description: review.metaDescription,
    sku: review.asin,
    image: [imageUrl],
    category: category?.name ?? review.categorySlug,
    url: reviewUrl,
    review: {
      '@type': 'Review',
      name: review.reviewTitle,
      reviewBody: review.quickVerdict,
      datePublished: review.lastUpdated,
      dateModified: review.lastUpdated,
      author: {
        '@type': 'Person',
        name: review.author.name,
        jobTitle: review.author.role,
      },
      publisher: {
        '@type': 'Organization',
        name: SITE_CONFIG.name,
        url: SITE_CONFIG.domain,
      },
      reviewRating: {
        '@type': 'Rating',
        ratingValue: review.rating.toFixed(1),
        bestRating: '5',
        worstRating: '1',
      },
      positiveNotes: {
        '@type': 'ItemList',
        itemListElement: review.pros.map((pro, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: pro,
        })),
      },
      negativeNotes: {
        '@type': 'ItemList',
        itemListElement: review.cons.map((con, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: con,
        })),
      },
    },
  };
}

export function buildFaqJsonLd(review: ProductReview): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: review.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Utility used in tests and quality checks to guarantee Amazon Associates compliance:
 * Ensures zero static dollar prices (like $89.99 or $120) exist in review copy.
 */
export function containsStaticDollarPrice(text: string): boolean {
  return /\$\s*\d+(?:,\d{3})*(?:\.\d{1,2})?/.test(text);
}
