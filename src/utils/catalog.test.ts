import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AmazonAffiliateButton } from '../components/AmazonAffiliateButton';
import { CATEGORIES, REVIEWS, SITE_CONFIG } from '../data/reviews';
import {
  buildBreadcrumbJsonLd,
  buildCategoryCollectionJsonLd,
  buildFaqJsonLd,
  buildHomePageJsonLd,
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
import { parsePathname, resolveAssetUrl, stripBasePath, withBasePath } from './router';

test('catalog has exactly 5 required categories and 6 reviews per category (30 total)', () => {
  assert.equal(CATEGORIES.length, 5);
  assert.deepEqual(
    CATEGORIES.map((c) => c.slug),
    ['home-tech', 'home-kitchen', 'home-decor', 'tools', 'gardening-gadgets']
  );
  assert.equal(REVIEWS.length, 30);
  assert.equal(new Set(REVIEWS.map((r) => r.slug)).size, 30, 'All 30 review slugs must be unique');
  assert.equal(new Set(REVIEWS.map((r) => r.asin)).size, 30, 'All 30 Amazon ASINs must be unique');
  assert.equal(new Set(REVIEWS.map((r) => r.image)).size, 30, 'All 30 product images must be unique');

  for (const cat of CATEGORIES) {
    assert.equal(
      getCategoryReviewCount(cat.slug, REVIEWS),
      6,
      `Expected exactly 6 reviews in ${cat.slug}`
    );
  }
});

test('Amazon affiliate URL and rendered button HTML strictly match exact required code per ASIN', () => {
  assert.equal(SITE_CONFIG.affiliateTag, 'liveblog36507-20');
  for (const review of REVIEWS) {
    assert.match(review.asin, /^B0[A-Z0-9]{8}$/, `Invalid 10-char ASIN format: ${review.asin}`);
    assert.equal(
      getAmazonAffiliateUrl(review.asin),
      `https://amazon.com/dp/${review.asin}?tag=liveblog36507-20`
    );

    const html = renderToStaticMarkup(
      React.createElement(AmazonAffiliateButton, { asin: review.asin })
    );
    const expectedAnchor =
      `<a href="https://amazon.com/dp/${review.asin}?tag=liveblog36507-20" class="amazon-affiliate-button" rel="sponsored nofollow noopener noreferrer" target="_blank">` +
      `<img src="https://g.top4top.io/p_390434fjf1.png" alt="Buy On Amazon" width="780" height="241" loading="lazy" decoding="async" style="max-width:240px;width:100%;height:auto"/>` +
      `</a>`;
    assert.ok(
      html.includes(expectedAnchor),
      `Affiliate button markup mismatch for ${review.asin}:\nGot:      ${html}\nExpected: ${expectedAnchor}`
    );
    assert.equal(html.includes('amazon-btn-fallback'), false, 'Fallback wrapper must not exist');
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

test('internal linking mesh: every review has 2 inline links (same + cross category), 3 valid companions, zero orphans, and zero self-links', () => {
  const incomingLinks = new Map<string, Set<string>>();
  for (const review of REVIEWS) {
    incomingLinks.set(review.slug, new Set());
  }

  for (const review of REVIEWS) {
    const companions = getCompanionReviews(review, REVIEWS, CATEGORIES);
    assert.equal(
      companions.length,
      3,
      `Review ${review.slug} must have exactly 3 valid companions (got ${companions.length})`
    );
    const sameCatCompanions = companions.filter((c) => c.review.categorySlug === review.categorySlug);
    const crossCatCompanions = companions.filter((c) => c.review.categorySlug !== review.categorySlug);
    assert.ok(
      sameCatCompanions.length >= 2,
      `Review ${review.slug} must have at least 2 same-category companions`
    );
    assert.ok(
      crossCatCompanions.length >= 1,
      `Review ${review.slug} must have at least 1 cross-category companion`
    );
    for (const comp of companions) {
      assert.notEqual(comp.review.slug, review.slug, 'Companion should not self-link');
      assert.ok(comp.reason.length > 10);
      incomingLinks.get(comp.review.slug)?.add(review.slug);
    }

    const inlineLinks = review.sections
      .map((s) => s.inlineLink)
      .filter((l): l is NonNullable<typeof l> => Boolean(l));
    assert.ok(
      inlineLinks.length >= 2,
      `Review ${review.slug} must contain at least 2 contextual inline internal links (got ${inlineLinks.length})`
    );

    let hasSameCatInline = false;
    let hasCrossCatInline = false;
    for (const link of inlineLinks) {
      assert.notEqual(link.targetSlug, review.slug, `Inline link in ${review.slug} must not self-link`);
      const target = REVIEWS.find((r) => r.slug === link.targetSlug);
      assert.ok(target, `Inline link target "${link.targetSlug}" in ${review.slug} must exist`);
      if (target.categorySlug === review.categorySlug) hasSameCatInline = true;
      else hasCrossCatInline = true;
      incomingLinks.get(target.slug)?.add(review.slug);
    }

    assert.ok(hasSameCatInline, `Review ${review.slug} must have at least 1 same-category inline link`);
    assert.ok(hasCrossCatInline, `Review ${review.slug} must have at least 1 cross-category inline link`);
  }

  // Verify zero orphan articles: every single review receives >= 3 distinct incoming editorial links
  for (const review of REVIEWS) {
    const incomingCount = incomingLinks.get(review.slug)?.size ?? 0;
    assert.ok(
      incomingCount >= 3,
      `Review ${review.slug} only receives ${incomingCount} incoming links (expected >= 3 for strong internal linking)`
    );
  }
});

test('searchReviews filters accurately by text query and category dropdown', () => {
  const drillResults = searchReviews(REVIEWS, 'brushless drill', 'all');
  assert.equal(drillResults.length, 1);
  assert.equal(drillResults[0].categorySlug, 'tools');

  const kitchenFiltered = searchReviews(REVIEWS, 'drill', 'home-kitchen');
  assert.equal(kitchenFiltered.length, 0);

  const brassResults = searchReviews(REVIEWS, 'brass', 'all');
  assert.ok(brassResults.length >= 2, 'Expected brass query to match multiple brass products');

  const decorOnly = searchReviews(REVIEWS, 'brass', 'home-decor');
  assert.ok(decorOnly.some((r) => r.slug === 'lumaglow-cordless-rechargeable-led-table-lamp'));
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

test('JSON-LD schema builders emit valid Home CollectionPage, Product, Review, Pros/Cons, FAQPage, Category, and BreadcrumbList', () => {
  const review = REVIEWS[0];
  const category = getCategoryBySlug(review.categorySlug)!;

  const homeSchemas = buildHomePageJsonLd() as Record<string, any>[];
  assert.equal(homeSchemas.length, 1);
  assert.equal(homeSchemas[0]['@type'], 'CollectionPage');
  assert.equal(homeSchemas[0]['@id'], 'https://www.shoppingey.com/#webpage');
  assert.equal(homeSchemas[0].mainEntity['@type'], 'ItemList');
  assert.equal(homeSchemas[0].mainEntity.numberOfItems, 5);

  const productSchema = buildProductReviewJsonLd(review, category) as Record<string, any>;
  assert.equal(productSchema['@type'], 'Product');
  assert.equal(productSchema['@id'], `https://www.shoppingey.com/review/${review.slug}#product`);
  assert.equal(productSchema.productID, review.asin);
  assert.equal(
    productSchema.mainEntityOfPage['@id'],
    `https://www.shoppingey.com/review/${review.slug}#webpage`
  );
  assert.equal(productSchema.review['@type'], 'Review');
  assert.equal(productSchema.review.headline, review.reviewTitle);
  assert.equal(productSchema.review.itemReviewed['@id'], productSchema['@id']);
  assert.equal(productSchema.review.reviewRating.bestRating, '5');
  assert.equal(productSchema.review.reviewRating.worstRating, '1');
  assert.equal(productSchema.review.positiveNotes.itemListElement.length, review.pros.length);
  assert.equal(productSchema.review.negativeNotes.itemListElement.length, review.cons.length);

  const faqSchema = buildFaqJsonLd(review) as Record<string, any>;
  assert.equal(faqSchema['@type'], 'FAQPage');
  assert.equal(faqSchema['@id'], `https://www.shoppingey.com/review/${review.slug}#faq`);
  assert.equal(faqSchema.mainEntity.length, review.faqs.length);

  const categorySchema = buildCategoryCollectionJsonLd(
    category,
    getReviewsByCategory(category.slug)
  ) as Record<string, any>;
  assert.equal(categorySchema['@type'], 'CollectionPage');
  assert.equal(categorySchema.primaryImageOfPage['@type'], 'ImageObject');
  assert.equal(categorySchema.mainEntity['@type'], 'ItemList');
  assert.equal(categorySchema.mainEntity.numberOfItems, 6);

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

test('GitHub Pages subpath routing and asset resolution work across / and /repo/ bases', () => {
  assert.equal(stripBasePath('/shoppingey', '/shoppingey/'), '/');
  assert.equal(stripBasePath('/shoppingey/', '/shoppingey/'), '/');
  assert.equal(stripBasePath('/shoppingey/category/tools', '/shoppingey/'), '/category/tools');
  assert.deepEqual(
    parsePathname('/shoppingey/review/torqpro-20v-brushless-cordless-drill-kit', '', '/shoppingey/'),
    { type: 'review', slug: 'torqpro-20v-brushless-cordless-drill-kit' }
  );
  assert.deepEqual(parsePathname('/shoppingey/', '', '/shoppingey/'), {
    type: 'home',
    query: undefined,
  });

  assert.equal(withBasePath('/', '/shoppingey/'), '/shoppingey/');
  assert.equal(withBasePath('/category/tools', '/shoppingey/'), '/shoppingey/category/tools');
  assert.equal(
    resolveAssetUrl('/src/assets/images/product.jpg', '/shoppingey/'),
    '/shoppingey/src/assets/images/product.jpg'
  );
  assert.equal(
    resolveAssetUrl('/src/assets/images/product.jpg', '/'),
    '/src/assets/images/product.jpg'
  );
});

test('Technical SEO: sitemap includes ONLY the 38 indexable URLs and excludes noindex legal/utility pages', async () => {
  const { buildAllSeoRoutes, buildSitemapRoutes, generateSitemapXml } = await import(
    '../../scripts/generate-seo'
  );
  const allRoutes = buildAllSeoRoutes();
  assert.equal(allRoutes.length, 42, 'Expected 42 total pre-rendered routes');

  const indexableRoutes = buildSitemapRoutes();
  assert.equal(
    indexableRoutes.length,
    38,
    'Expected 38 indexable sitemap routes (1 home + 2 E-E-A-T editorial + 5 categories + 30 reviews)'
  );

  const nonIndexablePaths = ['/affiliate-disclosure', '/privacy-policy', '/terms', '/contact'];
  for (const hiddenPath of nonIndexablePaths) {
    const route = allRoutes.find((r) => r.path === hiddenPath);
    assert.ok(route, `Expected pre-rendered route for ${hiddenPath}`);
    assert.equal(route.indexable, false, `${hiddenPath} must not be marked indexable`);
    assert.equal(route.robots, 'noindex, follow', `${hiddenPath} must emit noindex, follow`);
  }

  const xml = generateSitemapXml();
  const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
  assert.equal(locs.length, 38);
  assert.equal(new Set(locs).size, 38, 'Sitemap must have zero duplicate URLs');

  for (const hiddenPath of nonIndexablePaths) {
    assert.equal(
      locs.includes(`https://www.shoppingey.com${hiddenPath}`),
      false,
      `Non-indexable URL must be excluded from sitemap.xml: ${hiddenPath}`
    );
  }

  for (const mustInclude of ['/', '/about', '/how-we-review']) {
    assert.ok(
      locs.includes(`https://www.shoppingey.com${mustInclude}`),
      `High-value URL missing from sitemap.xml: ${mustInclude}`
    );
  }

  for (const review of REVIEWS) {
    assert.ok(
      locs.includes(`https://www.shoppingey.com/review/${review.slug}`),
      `Missing review URL in sitemap: ${review.slug}`
    );
  }
  assert.ok(xml.includes('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"'));
  const imageLocs = [...xml.matchAll(/<image:loc>(.*?)<\/image:loc>/g)].map((m) => m[1]);
  assert.equal(imageLocs.length, 35, 'Expected Image Sitemap tags for all 5 categories + 30 reviews');
});

test('Technical SEO: enriched Organization PNG logo, Product/Review E-E-A-T, unique titles, and meta descriptions meet Google guidelines', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  assert.ok(
    fs.existsSync(path.resolve(process.cwd(), 'public/logo-512.png')),
    'Google Rich Results requires a raster PNG Organization logo at public/logo-512.png'
  );

  const sitewide = buildSitewideJsonLd() as Record<string, any>[];
  assert.equal(sitewide[0]['@id'], 'https://www.shoppingey.com/#organization');
  assert.equal(sitewide[0].logo['@type'], 'ImageObject');
  assert.equal(sitewide[0].logo.url, 'https://www.shoppingey.com/logo-512.png');
  assert.equal(sitewide[0].publishingPrinciples, 'https://www.shoppingey.com/how-we-review');
  assert.equal(sitewide[1].publisher['@id'], 'https://www.shoppingey.com/#organization');

  const { buildSitemapRoutes } = await import('../../scripts/generate-seo');
  const indexableRoutes = buildSitemapRoutes();
  assert.equal(
    new Set(indexableRoutes.map((r) => r.title)).size,
    indexableRoutes.length,
    'Every indexable page must have a unique <title>'
  );
  assert.equal(
    new Set(indexableRoutes.map((r) => r.description)).size,
    indexableRoutes.length,
    'Every indexable page must have a unique <meta name="description">'
  );
  for (const r of indexableRoutes) {
    if (r.path !== '/') {
      assert.equal(
        r.path.endsWith('/'),
        false,
        `Non-root canonical path must not have trailing slash (matches extensionless .html on GitHub Pages): ${r.path}`
      );
    }
  }

  for (const review of REVIEWS) {
    assert.ok(
      review.metaDescription.length >= 110 && review.metaDescription.length <= 165,
      `Review ${review.slug} metaDescription length (${review.metaDescription.length}) outside optimal 110-165 range`
    );
    const schema = buildProductReviewJsonLd(
      review,
      getCategoryBySlug(review.categorySlug)
    ) as Record<string, any>;
    assert.equal(schema.brand['@type'], 'Brand');
    assert.equal(schema.mpn, review.asin);
    assert.ok(schema.additionalProperty.length >= 4);
    assert.equal(schema.review.author.url, 'https://www.shoppingey.com/about');
  }

  for (const category of CATEGORIES) {
    assert.ok(
      category.metaDescription.length >= 110 && category.metaDescription.length <= 165,
      `Category ${category.slug} metaDescription length (${category.metaDescription.length}) outside optimal 110-165 range`
    );
  }
});
