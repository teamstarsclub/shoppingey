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
      '@id': `${SITE_CONFIG.domain}/#organization`,
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.domain,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_CONFIG.domain}/logo-512.png`,
        width: 512,
        height: 512,
      },
      email: SITE_CONFIG.contactEmail,
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'editorial',
        email: SITE_CONFIG.contactEmail,
      },
      description: SITE_CONFIG.tagline,
      publishingPrinciples: `${SITE_CONFIG.domain}/how-we-review`,
      knowsAbout: [
        'Independent Amazon Product Reviews',
        ...CATEGORIES.map((c) => c.name),
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${SITE_CONFIG.domain}/#website`,
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.domain,
      inLanguage: 'en-US',
      publisher: {
        '@id': `${SITE_CONFIG.domain}/#organization`,
      },
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

export function buildHomePageJsonLd(): Record<string, unknown>[] {
  const homeUrl = `${SITE_CONFIG.domain}/`;
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      '@id': `${SITE_CONFIG.domain}/#webpage`,
      name: 'Shoppingey.com — Independent Amazon Product Reviews (2026)',
      description:
        'Honest, hands-on Amazon product reviews tested and organized by department: Home & Tech, Home & Kitchen, Home Decor, Tools, and Gardening Gadgets.',
      url: homeUrl,
      inLanguage: 'en-US',
      isPartOf: {
        '@id': `${SITE_CONFIG.domain}/#website`,
      },
      about: {
        '@id': `${SITE_CONFIG.domain}/#organization`,
      },
      speakable: {
        '@type': 'SpeakableSpecification',
        cssSelector: ['h1', 'main p'],
      },
      mainEntity: {
        '@type': 'ItemList',
        name: 'Shoppingey.com Product Review Departments',
        numberOfItems: CATEGORIES.length,
        itemListElement: CATEGORIES.map((cat, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: cat.name,
          url: `${SITE_CONFIG.domain}/category/${cat.slug}`,
          image: cat.featuredImage.startsWith('http')
            ? cat.featuredImage
            : `${SITE_CONFIG.domain}${cat.featuredImage}`,
        })),
      },
    },
  ];
}

export function buildWebPageJsonLd(options: {
  type?: 'WebPage' | 'AboutPage' | 'ContactPage';
  name: string;
  description: string;
  path: string;
}): Record<string, unknown> {
  const cleanPath = options.path === '/' ? '/' : options.path.replace(/\/+$/, '');
  const url = `${SITE_CONFIG.domain}${cleanPath}`;
  return {
    '@context': 'https://schema.org',
    '@type': options.type ?? 'WebPage',
    '@id': `${url}#webpage`,
    name: options.name,
    description: options.description,
    url,
    inLanguage: 'en-US',
    isPartOf: {
      '@id': `${SITE_CONFIG.domain}/#website`,
    },
  };
}

export function buildCategoryCollectionJsonLd(
  category: Category,
  categoryReviews: ProductReview[]
): Record<string, unknown> {
  const categoryUrl = `${SITE_CONFIG.domain}/category/${category.slug}`;
  const featuredImageUrl = category.featuredImage.startsWith('http')
    ? category.featuredImage
    : `${SITE_CONFIG.domain}${category.featuredImage}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${categoryUrl}#webpage`,
    name: `${category.name} Reviews — ${SITE_CONFIG.name}`,
    description: category.metaDescription,
    url: categoryUrl,
    inLanguage: 'en-US',
    primaryImageOfPage: {
      '@type': 'ImageObject',
      url: featuredImageUrl,
    },
    isPartOf: {
      '@id': `${SITE_CONFIG.domain}/#website`,
    },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: categoryReviews.length,
      itemListElement: categoryReviews.map((review, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${SITE_CONFIG.domain}/review/${review.slug}`,
        name: review.productName,
        image: review.image.startsWith('http')
          ? review.image
          : `${SITE_CONFIG.domain}${review.image}`,
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
  const brandName = review.productName.split(' ')[0] || SITE_CONFIG.name;

  const companionProducts = getCompanionReviews(review, REVIEWS, CATEGORIES).map((c) => ({
    '@type': 'Product',
    name: c.review.productName,
    sku: c.review.asin,
    url: `${SITE_CONFIG.domain}/review/${c.review.slug}`,
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${reviewUrl}#product`,
    name: review.productName,
    description: review.metaDescription,
    brand: {
      '@type': 'Brand',
      name: brandName,
    },
    sku: review.asin,
    mpn: review.asin,
    productID: review.asin,
    image: [imageUrl],
    category: category?.name ?? review.categorySlug,
    url: reviewUrl,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${reviewUrl}#webpage`,
      url: reviewUrl,
      speakable: {
        '@type': 'SpeakableSpecification',
        cssSelector: ['h1', '#verdict-scores', '#final-verdict'],
      },
    },
    ...(companionProducts.length > 0 ? { isRelatedTo: companionProducts } : {}),
    additionalProperty: review.specs.map((spec) => ({
      '@type': 'PropertyValue',
      name: spec.label,
      value: spec.value,
    })),
    review: {
      '@type': 'Review',
      '@id': `${reviewUrl}#review`,
      name: review.reviewTitle,
      headline: review.reviewTitle,
      url: reviewUrl,
      itemReviewed: {
        '@id': `${reviewUrl}#product`,
      },
      reviewBody: review.quickVerdict,
      datePublished: review.lastUpdated,
      dateModified: review.lastUpdated,
      inLanguage: 'en-US',
      author: {
        '@type': 'Person',
        name: review.author.name,
        jobTitle: review.author.role,
        url: `${SITE_CONFIG.domain}/about`,
      },
      publisher: {
        '@type': 'Organization',
        '@id': `${SITE_CONFIG.domain}/#organization`,
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
  const reviewUrl = `${SITE_CONFIG.domain}/review/${review.slug}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${reviewUrl}#faq`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${reviewUrl}#webpage`,
    },
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
