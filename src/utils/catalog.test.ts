import test from 'node:test';
import assert from 'node:assert/strict';
import { CATEGORIES, REVIEWS, SITE_CONFIG } from '../data/reviews';
import {
  buildBreadcrumbJsonLd,
  buildCategoryCollectionJsonLd,
  buildFaqJsonLd,
  buildProductReviewJsonLd,
  buildSitewideJsonLd,
  containsStaticDollarPrice,
  getAmazonAffiliateUrl,
  getCategoryBySlug,
  getCategoryReviewCount,
  getCompanionReviews,
  getReviewsByCategory,
  searchReviews,
  sortReviews,
} from './catalog';
import { parsePathname } from './router';

test('catalog has exactly 5 required categories and 1 review per category (5 total)', () => {
  assert.equal(CATEGORIES.length, 5);
  assert.deepEqual(
    CATEGORIES.map((c) => c.slug),
    ['home-tech', 'home-kitchen', 'home-decor', 'tools', 'gardening-gadgets']
  );
  assert.equal(REVIEWS.length, 5);

  for (const cat of CATEGORIES) {
    assert.equal(
      getCategoryReviewCount(cat.slug, REVIEWS),
      1,
      `Expected exactly 1 starter review in ${cat.slug}`
    );
  }
});

test('Amazon affiliate URL strictly uses liveblog36507-20 tag and valid 10-char ASINs', () => {
  assert.equal(SITE_CONFIG.affiliateTag, 'liveblog36507-20');
  for (const review of REVIEWS) {
    assert.match(review.asin, /^B0[A-Z0-9]{8,9}$/, `Invalid ASIN format: ${review.asin}`);
    assert.equal(
      getAmazonAffiliateUrl(review.asin),
      `https://amazon.com/dp/${review.asin}?tag=liveblog36507-20`
    );
  }
});

test('zero hardcoded static dollar prices anywhere in reviews or categories (Amazon Associates compliance)', () => {
  for (const cat of CATEGORIES) {
    const combined = `${cat.name} ${cat.shortDescription} ${cat.seoIntro} ${cat.metaDescription}`;
    assert.equal(containsStaticDollarPrice(combined), false, `Found static dollar price in category ${cat.slug}`);
  }

  for (const rev of REVIEWS) {
    const textChunks = [
      rev.productName,
      rev.reviewTitle,
      rev.metaDescription,
      rev.quickVerdict,
      ...rev.highlights,
      ...rev.pros,
      ...rev.cons,
      ...rev.sections.flatMap((s) => s.paragraphs),
      ...rev.specs.map((s) => `${s.label} ${s.value}`),
      ...rev.faqs.flatMap((f) => [f.question, f.answer]),
    ];

    for (const chunk of textChunks) {
      assert.equal(
        containsStaticDollarPrice(chunk),
        false,
        `Found forbidden static dollar price in ${rev.slug}: "${chunk}"`
      );
    }
  }
});

test('every review has valid companion recommendations and at least one inline internal link', () => {
  for (const review of REVIEWS) {
    const companions = getCompanionReviews(review, REVIEWS, CATEGORIES);
    assert.ok(companions.length >= 1, `Review ${review.slug} must have at least 1 valid companion`);
    for (const comp of companions) {
      assert.notEqual(comp.review.slug, review.slug, 'Companion should not self-link');
      assert.ok(comp.reason.length > 10);
    }

    const inlineLinks = review.sections
      .map((s) => s.inlineLink)
      .filter((l): l is NonNullable<typeof l> => Boolean(l));
    assert.ok(inlineLinks.length >= 1, `Review ${review.slug} must contain at least 1 inline internal link`);
    for (const link of inlineLinks) {
      const target = REVIEWS.find((r) => r.slug === link.targetSlug);
      assert.ok(target, `Inline link target "${link.targetSlug}" in ${review.slug} must exist`);
    }
  }
});

test('searchReviews filters accurately by text query and category dropdown', () => {
  const drillResults = searchReviews(REVIEWS, 'brushless drill', 'all');
  assert.equal(drillResults.length, 1);
  assert.equal(drillResults[0].categorySlug, 'tools');

  const kitchenFiltered = searchReviews(REVIEWS, 'drill', 'home-kitchen');
  assert.equal(kitchenFiltered.length, 0);

  const brassResults = searchReviews(REVIEWS, 'brass', 'all');
  assert.ok(brassResults.length >= 2, 'Expected brass query to match both brass lamp and brass hose timer');

  const decorOnly = searchReviews(REVIEWS, 'brass', 'home-decor');
  assert.equal(decorOnly.length, 1);
  assert.equal(decorOnly[0].slug, 'lumaglow-cordless-rechargeable-led-table-lamp');
});

test('sortReviews orders by rating, newest, and price tier', () => {
  const byRating = sortReviews(REVIEWS, 'rating');
  assert.ok(byRating[0].scoreOutOf10 >= byRating[byRating.length - 1].scoreOutOf10);

  const byNewest = sortReviews(REVIEWS, 'newest');
  assert.ok(byNewest[0].lastUpdated >= byNewest[byNewest.length - 1].lastUpdated);

  const byPriceAsc = sortReviews(REVIEWS, 'price-asc');
  assert.equal(byPriceAsc[0].priceTier, 'Budget-Friendly');
  assert.equal(byPriceAsc[byPriceAsc.length - 1].priceTier, 'Premium');

  const byPriceDesc = sortReviews(REVIEWS, 'price-desc');
  assert.equal(byPriceDesc[0].priceTier, 'Premium');
});

test('JSON-LD schema builders emit valid Product, Review, Pros/Cons, FAQPage, CollectionPage, and BreadcrumbList', () => {
  const review = REVIEWS[0];
  const category = getCategoryBySlug(review.categorySlug)!;

  const productSchema = buildProductReviewJsonLd(review, category) as Record<string, any>;
  assert.equal(productSchema['@type'], 'Product');
  assert.equal(productSchema.review['@type'], 'Review');
  assert.equal(productSchema.review.reviewRating.bestRating, '5');
  assert.equal(productSchema.review.reviewRating.worstRating, '1');
  assert.equal(productSchema.review.positiveNotes.itemListElement.length, review.pros.length);
  assert.equal(productSchema.review.negativeNotes.itemListElement.length, review.cons.length);

  const faqSchema = buildFaqJsonLd(review) as Record<string, any>;
  assert.equal(faqSchema['@type'], 'FAQPage');
  assert.equal(faqSchema.mainEntity.length, review.faqs.length);

  const categorySchema = buildCategoryCollectionJsonLd(
    category,
    getReviewsByCategory(category.slug)
  ) as Record<string, any>;
  assert.equal(categorySchema['@type'], 'CollectionPage');
  assert.equal(categorySchema.mainEntity['@type'], 'ItemList');
  assert.equal(categorySchema.mainEntity.numberOfItems, 1);

  const breadcrumbs = buildBreadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: category.name, path: `/category/${category.slug}` },
  ]) as Record<string, any>;
  assert.equal(breadcrumbs['@type'], 'BreadcrumbList');
  assert.equal(breadcrumbs.itemListElement.length, 2);

  const sitewide = buildSitewideJsonLd();
  assert.equal(sitewide.length, 2);
});

test('parsePathname parses clean semantic paths without hash routing', () => {
  assert.deepEqual(parsePathname('/'), { type: 'home', query: undefined });
  assert.deepEqual(parsePathname('/', '?q=air+fryer'), { type: 'home', query: 'air fryer' });
  assert.deepEqual(parsePathname('/category/home-kitchen/'), {
    type: 'category',
    slug: 'home-kitchen',
  });
  assert.deepEqual(parsePathname('/review/torqpro-20v-brushless-cordless-drill-kit'), {
    type: 'review',
    slug: 'torqpro-20v-brushless-cordless-drill-kit',
  });
  assert.deepEqual(parsePathname('/affiliate-disclosure'), {
    type: 'legal',
    page: 'affiliate-disclosure',
  });
  assert.deepEqual(parsePathname('/unknown-route'), {
    type: 'not-found',
    path: '/unknown-route',
  });
});
