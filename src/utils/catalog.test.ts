import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AmazonAffiliateButton } from '../components/AmazonAffiliateButton';
import { CATEGORIES, REVIEWS, SITE_CONFIG, type ProductReview } from '../data/reviews';
import {
  buildBreadcrumbJsonLd,
  buildCategoryCollectionJsonLd,
  buildFaqJsonLd,
  buildHomePageJsonLd,
  buildProductReviewJsonLd,
  buildReviewSocialMeta,
  buildSameCategoryCrossLinkMap,
  buildSitewideJsonLd,
  containsStaticDollarPrice,
  getAmazonAffiliateUrl,
  getCategoryBySlug,
  getCategoryReviewCount,
  getCompanionReviews,
  getReviewsByCategory,
  getSameCategoryCrossLinks,
  searchReviews,
  sortReviews,
} from './catalog';
import { parsePathname, resolveAssetUrl, stripBasePath, withBasePath } from './router';

test('catalog has exactly 6 required categories and 6 reviews per category (36 total)', () => {
  assert.equal(CATEGORIES.length, 6);
  assert.deepEqual(
    CATEGORIES.map((c) => c.slug),
    ['home-tech', 'home-electronics', 'home-kitchen', 'home-decor', 'tools', 'gardening-gadgets']
  );
  assert.equal(getCategoryBySlug('homeElectronics')?.slug, 'home-electronics');
  assert.equal(REVIEWS.length, 36);
  assert.equal(new Set(REVIEWS.map((r) => r.slug)).size, 36, 'All 36 review slugs must be unique');
  assert.equal(new Set(REVIEWS.map((r) => r.asin)).size, 36, 'All 36 Amazon ASINs must be unique');
  assert.equal(new Set(REVIEWS.map((r) => r.image)).size, 36, 'All 36 product images must be unique');

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

test('internal linking mesh: every review has 4 distinct inlineLinks, 3 distinct companions (zero overlap), exact 7 incoming links, and diameter <= 2', () => {
  const incomingLinks = new Map<string, Set<string>>();
  const pageAdj = new Map<string, Set<string>>();
  for (const review of REVIEWS) {
    incomingLinks.set(review.slug, new Set());
    pageAdj.set(review.slug, new Set());
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
    assert.equal(
      sameCatCompanions.length,
      1,
      `Review ${review.slug} must have exactly 1 same-category companion`
    );
    assert.equal(
      crossCatCompanions.length,
      2,
      `Review ${review.slug} must have exactly 2 cross-category companions`
    );

    const inlineLinks = review.sections
      .map((s) => s.inlineLink)
      .filter((l): l is NonNullable<typeof l> => Boolean(l));
    assert.equal(
      inlineLinks.length,
      4,
      `Review ${review.slug} must contain exactly 4 contextual inline internal links (got ${inlineLinks.length})`
    );

    const editorialTargets = new Set<string>();
    const coveredCategories = new Set<string>();

    for (const comp of companions) {
      assert.notEqual(comp.review.slug, review.slug, 'Companion should not self-link');
      assert.ok(comp.reason.length > 10);
      assert.equal(
        editorialTargets.has(comp.review.slug),
        false,
        `Duplicate companion target ${comp.review.slug} in ${review.slug}`
      );
      editorialTargets.add(comp.review.slug);
      coveredCategories.add(comp.review.categorySlug);
      incomingLinks.get(comp.review.slug)?.add(review.slug);
      pageAdj.get(review.slug)?.add(comp.review.slug);
    }

    let sameCatInlineCount = 0;
    let crossCatInlineCount = 0;
    for (const link of inlineLinks) {
      assert.notEqual(link.targetSlug, review.slug, `Inline link in ${review.slug} must not self-link`);
      const target = REVIEWS.find((r) => r.slug === link.targetSlug);
      assert.ok(target, `Inline link target "${link.targetSlug}" in ${review.slug} must exist`);
      assert.equal(
        editorialTargets.has(link.targetSlug),
        false,
        `Inline link ${link.targetSlug} in ${review.slug} overlaps another inline link or companion`
      );
      editorialTargets.add(link.targetSlug);
      coveredCategories.add(target.categorySlug);
      if (target.categorySlug === review.categorySlug) sameCatInlineCount += 1;
      else crossCatInlineCount += 1;
      incomingLinks.get(target.slug)?.add(review.slug);
      pageAdj.get(review.slug)?.add(target.slug);
    }

    assert.equal(sameCatInlineCount, 1, `Review ${review.slug} must have 1 same-category inline link`);
    assert.equal(crossCatInlineCount, 3, `Review ${review.slug} must have 3 cross-category inline links`);
    assert.equal(editorialTargets.size, 7, `Review ${review.slug} must link to 7 unique editorial articles`);
    assert.equal(
      coveredCategories.size,
      CATEGORIES.length,
      `Review ${review.slug} must link across all ${CATEGORIES.length} categories`
    );

    // Also include same-category sibling cards rendered in #more-in-category
    for (const sibling of REVIEWS) {
      if (sibling.categorySlug === review.categorySlug && sibling.slug !== review.slug) {
        pageAdj.get(review.slug)?.add(sibling.slug);
      }
    }
  }

  // Verify symmetric incoming equity: every single review receives exactly 7 incoming editorial links
  for (const review of REVIEWS) {
    const incomingCount = incomingLinks.get(review.slug)?.size ?? 0;
    assert.equal(
      incomingCount,
      7,
      `Review ${review.slug} receives ${incomingCount} incoming editorial links (expected 7)`
    );
  }

  // Verify all-pairs shortest path <= 2 across the rendered review pages
  for (const source of REVIEWS) {
    const dist = new Map<string, number>([[source.slug, 0]]);
    const queue: string[] = [source.slug];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      const currDist = dist.get(curr)!;
      for (const next of pageAdj.get(curr) ?? []) {
        if (!dist.has(next)) {
          dist.set(next, currDist + 1);
          queue.push(next);
        }
      }
    }
    assert.equal(dist.size, REVIEWS.length, `Not all reviews reachable from ${source.slug}`);
    for (const [targetSlug, hops] of dist.entries()) {
      assert.ok(
        hops <= 2,
        `Path from ${source.slug} to ${targetSlug} took ${hops} clicks (expected <= 2)`
      );
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
  assert.equal(homeSchemas[0].mainEntity.numberOfItems, 6);

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

test('Technical SEO: sitemap includes ONLY the 45 indexable URLs and excludes noindex legal/utility pages', async () => {
  const { buildAllSeoRoutes, buildSitemapRoutes, generateSitemapXml } = await import(
    '../../scripts/generate-seo'
  );
  const allRoutes = buildAllSeoRoutes();
  assert.equal(allRoutes.length, 49, 'Expected 49 total pre-rendered routes');

  const indexableRoutes = buildSitemapRoutes();
  assert.equal(
    indexableRoutes.length,
    45,
    'Expected 45 indexable sitemap routes (1 home + 2 E-E-A-T editorial + 6 categories + 36 reviews)'
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
  assert.equal(locs.length, 45);
  assert.equal(new Set(locs).size, 45, 'Sitemap must have zero duplicate URLs');

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
  assert.equal(imageLocs.length, 42, 'Expected Image Sitemap tags for all 6 categories + 36 reviews');
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

test('Googlebot & AI readiness: robots.txt, llms.txt, llms-full.txt, ai-catalog.json, speakable, and Product isRelatedTo', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const robotsTxt = fs.readFileSync(path.resolve(process.cwd(), 'public/robots.txt'), 'utf8');

  for (const bot of [
    'Googlebot',
    'Googlebot-Image',
    'Google-Extended',
    'OAI-SearchBot',
    'GPTBot',
    'ClaudeBot',
    'PerplexityBot',
  ]) {
    assert.ok(robotsTxt.includes(`User-agent: ${bot}`), `robots.txt should welcome ${bot}`);
  }
  assert.ok(robotsTxt.includes('Disallow: /*?q='), 'robots.txt must block duplicate ?q= search queries');
  assert.ok(robotsTxt.includes('Sitemap: https://www.shoppingey.com/sitemap.xml'));

  const sitewide = buildSitewideJsonLd() as Record<string, any>[];
  assert.ok(Array.isArray(sitewide[0].knowsAbout) && sitewide[0].knowsAbout.length >= 5);

  const sampleSchema = buildProductReviewJsonLd(
    REVIEWS[0],
    getCategoryBySlug(REVIEWS[0].categorySlug)
  ) as Record<string, any>;
  assert.ok(sampleSchema.isRelatedTo.length >= 5, 'Expected merged same-category cluster + cross-category related products');
  const relatedUrls = sampleSchema.isRelatedTo.map((item: { url: string }) => item.url);
  assert.equal(new Set(relatedUrls).size, relatedUrls.length, 'Product.isRelatedTo must not contain duplicates');
  const sampleCategoryName = getCategoryBySlug(REVIEWS[0].categorySlug)?.name;
  const sameCategoryRelatedCount = sampleSchema.isRelatedTo.filter(
    (item: { category?: string }) => item.category === sampleCategoryName
  ).length;
  assert.ok(sameCategoryRelatedCount >= 3, 'Product.isRelatedTo must include at least 3 same-category products');
  assert.equal(sampleSchema.mainEntityOfPage.speakable['@type'], 'SpeakableSpecification');

  const { generateLlmsTxt, generateLlmsFullTxt, generateAiCatalogJson } = await import(
    '../../scripts/generate-seo'
  );
  const llms = generateLlmsTxt();
  const llmsFull = generateLlmsFullTxt();
  const aiJson = generateAiCatalogJson();
  const parsedAi = JSON.parse(aiJson);

  assert.equal(parsedAi.categories.length, 6);
  assert.equal(parsedAi.reviews.length, 36);
  for (const rev of parsedAi.reviews) {
    assert.ok(
      Array.isArray(rev.relatedSameCategory) && rev.relatedSameCategory.length >= 3,
      `Expected >= 3 same-category cluster entries in ai-catalog.json for ${rev.slug}`
    );
  }
  assert.equal(containsStaticDollarPrice(llms), false, 'llms.txt must not contain static dollar prices');
  assert.equal(containsStaticDollarPrice(llmsFull), false, 'llms-full.txt must not contain static dollar prices');
  assert.equal(containsStaticDollarPrice(aiJson), false, 'ai-catalog.json must not contain static dollar prices');

  for (const cat of CATEGORIES) {
    assert.ok(llms.includes(`https://www.shoppingey.com/category/${cat.slug}`));
  }
  for (const rev of REVIEWS) {
    assert.ok(llms.includes(`https://www.shoppingey.com/review/${rev.slug}`), `Missing ${rev.slug} in llms.txt`);
    assert.ok(llmsFull.includes(`ASIN: ${rev.asin}`), `Missing ASIN ${rev.asin} in llms-full.txt`);
  }
});

test('automatic same-category cross-linking guarantees >= 3 high-relevance cluster links for existing and newly added reviews', () => {
  const clusterMap = buildSameCategoryCrossLinkMap(REVIEWS, 3);
  assert.equal(clusterMap.size, REVIEWS.length);

  for (const review of REVIEWS) {
    const links = clusterMap.get(review.slug) ?? [];
    assert.ok(
      links.length >= 3,
      `Expected at least 3 same-category cross-links for ${review.slug}, got ${links.length}`
    );

    const seen = new Set<string>();
    for (let i = 0; i < links.length; i += 1) {
      const link = links[i];
      assert.notEqual(link.review.slug, review.slug, 'Auto cross-link must never self-link');
      assert.equal(
        link.review.categorySlug,
        review.categorySlug,
        `Cross-link target ${link.review.slug} must match source category ${review.categorySlug}`
      );
      assert.equal(seen.has(link.review.slug), false, 'Auto cross-links must be deduplicated');
      seen.add(link.review.slug);
      assert.ok(link.relevanceScore > 0, 'Relevance score must be positive');
      assert.ok(link.reason.length >= 20, 'Cross-link reason must be descriptive');
      assert.equal(containsStaticDollarPrice(link.reason), false, 'Reason must not contain static dollar price');
      if (i > 0) {
        assert.ok(
          links[i - 1].relevanceScore >= link.relevanceScore,
          'Auto cross-links must be sorted by descending relevanceScore'
        );
      }
    }

    const boundedTop3 = getSameCategoryCrossLinks(review, REVIEWS, { minLinks: 3, maxLinks: 3 });
    assert.equal(boundedTop3.length, 3);
    assert.deepEqual(
      boundedTop3.map((l) => l.review.slug),
      links.slice(0, 3).map((l) => l.review.slug)
    );
  }

  // Verify zero-manual-link new article automatically receives >= 3 semantically relevant same-category links
  const syntheticElectronicsReview: ProductReview = {
    ...REVIEWS[0],
    slug: 'synthetic-dolby-atmos-hdmi-earc-streaming-amp',
    categorySlug: 'home-electronics',
    asin: 'B0SYNTH001',
    productName: 'StreamAmp 4K HDMI eARC Dolby Atmos Wireless Hub',
    reviewTitle: 'StreamAmp 4K HDMI eARC Hub Review (2026)',
    metaDescription:
      'Hands-on StreamAmp 4K HDMI eARC hub review testing Dolby Atmos pass-through, Bluetooth 5.3 streaming audio, and USB-C power.',
    priceTier: 'Premium',
    rating: 4.7,
    scoreOutOf10: 9.2,
    quickVerdict:
      'Brings effortless 4K HDR streaming, lossless HDMI eARC Dolby Atmos routing, and Bluetooth wireless audio to living room theaters.',
    highlights: [
      'HDMI eARC pass-through supports Dolby Atmos and 4K HDR TVs',
      'Bluetooth 5.3 low-latency wireless audio pairing for headphones and projectors',
      '100W USB-C power delivery keeps desk hubs tidy',
    ],
    pros: ['Zero-lag HDMI eARC Atmos audio', 'Compact brushed metal enclosure'],
    cons: ['Requires High-Speed HDMI cable'],
    sections: [
      {
        id: 'overview',
        heading: 'HDMI eARC & Wireless Audio Performance',
        paragraphs: ['Delivers crisp 4K Atmos streaming without manual link configuration.'],
      },
    ],
    specs: [
      { label: 'Video Output', value: '4K HDR10+ Dolby Vision' },
      { label: 'Audio Routing', value: 'HDMI eARC Dolby Atmos & Bluetooth 5.3' },
    ],
    companions: [],
  };

  const syntheticLinks = getSameCategoryCrossLinks(
    syntheticElectronicsReview,
    [...REVIEWS, syntheticElectronicsReview],
    { minLinks: 3 }
  );
  assert.ok(syntheticLinks.length >= 3, 'New review without manual links must still receive >= 3 same-category links');
  assert.ok(
    syntheticLinks
      .slice(0, 3)
      .every((item) => item.review.categorySlug === 'home-electronics' && item.sharedTopics.length >= 1),
    'Top 3 auto-links for new Home Electronics review must stay inside home-electronics with shared topic matches'
  );
  assert.ok(
    syntheticLinks
      .slice(0, 3)
      .some((item) => item.review.slug === 'soundpulse-dolby-atmos-soundbar-subwoofer'),
    'HDMI eARC Dolby Atmos test article should rank SoundPulse Atmos Soundbar inside its top 3 auto-links'
  );
});

test('Social head configuration: all 36 review pages emit comprehensive dynamic Open Graph & Twitter Card tags', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const { buildAllSeoRoutes, renderRouteHtml } = await import('../../scripts/generate-seo');

  const indexTemplate = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
  assert.ok(
    indexTemplate.includes(
      "<meta name='impact-site-verification' value='391f589b-27ef-4de9-acf5-e3a46b472439'>"
    ),
    'index.html must preserve Impact verification meta tag'
  );
  assert.ok(
    indexTemplate.includes(
      '<meta name="ads.txt" content="google.com, pub-5379808297296166, DIRECT, f08c47fec0942fa0" />'
    ),
    'index.html <head> must contain ads.txt verification meta tag'
  );
  assert.ok(
    indexTemplate.includes(
      '<meta name="google-adsense-account" content="ca-pub-5379808297296166" />'
    ),
    'index.html <head> must contain google-adsense-account meta tag'
  );
  const publicAdsTxt = fs.readFileSync(path.resolve(process.cwd(), 'public/ads.txt'), 'utf8').trim();
  assert.equal(publicAdsTxt, 'google.com, pub-5379808297296166, DIRECT, f08c47fec0942fa0');

  const allRoutes = buildAllSeoRoutes();
  const reviewRoutes = allRoutes.filter((r) => r.path.startsWith('/review/'));
  assert.equal(reviewRoutes.length, 36);

  for (const review of REVIEWS) {
    const category = getCategoryBySlug(review.categorySlug);
    const socialMeta = buildReviewSocialMeta(review, category);
    assert.equal(containsStaticDollarPrice(socialMeta.socialTitle), false);
    assert.equal(containsStaticDollarPrice(socialMeta.socialDescription), false);
    assert.equal(socialMeta.twitterLabels.length, 2);
    assert.ok(socialMeta.tags.length >= 4);

    const route = reviewRoutes.find((r) => r.path === `/review/${review.slug}`);
    assert.ok(route, `Expected pre-render route for ${review.slug}`);

    const html = renderRouteHtml(indexTemplate, route);
    const headHtml = html.slice(0, html.indexOf('</head>'));
    const expectedUrl = `https://www.shoppingey.com/review/${review.slug}`;

    const requiredSnippets = [
      `<meta name='impact-site-verification' value='391f589b-27ef-4de9-acf5-e3a46b472439'>`,
      `<meta property="og:site_name" content="Shoppingey.com" />`,
      `<meta property="og:locale" content="en_US" />`,
      `<meta property="og:type" content="article" />`,
      `<meta property="og:url" content="${expectedUrl}" />`,
      `<meta property="og:image" content="${socialMeta.imageUrl}" />`,
      `<meta property="og:image:secure_url" content="${socialMeta.imageUrl}" />`,
      `<meta property="og:image:type" content="${socialMeta.imageType}" />`,
      `<meta property="og:image:width" content="1200" />`,
      `<meta property="og:image:height" content="896" />`,
      `<meta property="og:updated_time" content="${socialMeta.modifiedTime}" />`,
      `<meta property="article:published_time" content="${socialMeta.publishedTime}" />`,
      `<meta property="article:modified_time" content="${socialMeta.modifiedTime}" />`,
      `<meta property="article:publisher" content="https://www.shoppingey.com" />`,
      `<meta name="twitter:card" content="summary_large_image" />`,
      `<meta name="twitter:domain" content="www.shoppingey.com" />`,
      `<meta name="twitter:url" content="${expectedUrl}" />`,
      `<meta name="twitter:image" content="${socialMeta.imageUrl}" />`,
      `<meta name="twitter:label1" content="Lab Score" />`,
      `<meta name="twitter:label2" content="Price Tier" />`,
    ];

    for (const snippet of requiredSnippets) {
      assert.ok(
        headHtml.includes(snippet),
        `Missing required social meta tag "${snippet}" in rendered head for ${review.slug}`
      );
    }

    assert.ok(
      headHtml.includes(`<meta property="article:tag" content="${review.asin}" />`),
      `Missing ASIN article:tag in rendered head for ${review.slug}`
    );
  }

  // Non-review route must emit clean website OG/Twitter cards without stray article tags
  const homeRoute = allRoutes.find((r) => r.path === '/')!;
  const homeHead = renderRouteHtml(indexTemplate, homeRoute).split('</head>')[0];
  assert.ok(homeHead.includes('<meta property="og:type" content="website" />'));
  assert.equal(homeHead.includes('article:published_time'), false);
  assert.equal(homeHead.includes('twitter:label1'), false);
});

test('Breadcrumb navigation trail renders Home > Category on CategoryPage and Home > Category > Product on ReviewPage', async () => {
  const { CategoryPage } = await import('../pages/CategoryPage');
  const { ReviewPage } = await import('../pages/ReviewPage');

  for (const cat of CATEGORIES) {
    const categoryHtml = renderToStaticMarkup(
      React.createElement(CategoryPage, { slug: cat.slug })
    );
    assert.ok(
      categoryHtml.includes('aria-label="Breadcrumb"'),
      `CategoryPage ${cat.slug} must render Breadcrumb nav`
    );
    assert.ok(
      categoryHtml.includes('itemType="https://schema.org/BreadcrumbList"') ||
        categoryHtml.includes('itemtype="https://schema.org/BreadcrumbList"'),
      `CategoryPage ${cat.slug} must emit BreadcrumbList microdata`
    );
    const escapedCatName = cat.name.replace(/&/g, '&amp;');
    assert.ok(
      categoryHtml.includes('>Home<') && categoryHtml.includes(`>${escapedCatName}<`),
      `CategoryPage ${cat.slug} must display Home > ${cat.name} trail`
    );
  }

  for (const rev of REVIEWS) {
    const cat = getCategoryBySlug(rev.categorySlug)!;
    const reviewHtml = renderToStaticMarkup(
      React.createElement(ReviewPage, { slug: rev.slug })
    );
    assert.ok(
      reviewHtml.includes('aria-label="Breadcrumb"'),
      `ReviewPage ${rev.slug} must render Breadcrumb nav`
    );
    assert.ok(
      reviewHtml.includes(`href="/category/${cat.slug}"`),
      `ReviewPage ${rev.slug} breadcrumb must link back to /category/${cat.slug}`
    );
    assert.ok(
      reviewHtml.includes('aria-current="page"'),
      `ReviewPage ${rev.slug} breadcrumb must mark current product page`
    );
  }
});

test('AdSense monetization: Auto Ads script in head, high-CTR ad slots across pages, and Privacy Policy cookie disclosure', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const { ADSENSE_CLIENT_ID, ADSENSE_SLOTS } = await import('../config/adsense');
  const { HomePage } = await import('../pages/HomePage');
  const { CategoryPage } = await import('../pages/CategoryPage');
  const { ReviewPage } = await import('../pages/ReviewPage');
  const { LegalPages } = await import('../pages/LegalPages');

  assert.equal(ADSENSE_CLIENT_ID, 'ca-pub-5379808297296166');
  const slotIds = Object.values(ADSENSE_SLOTS).map((s) => s.slotId);
  assert.equal(new Set(slotIds).size, slotIds.length, 'Every AdSense slotId must be unique');

  const indexHtml = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
  const headHtml = indexHtml.slice(0, indexHtml.indexOf('</head>'));
  assert.ok(
    headHtml.includes(
      'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5379808297296166'
    ),
    'index.html <head> must contain the exact Google AdSense Auto Ads script'
  );
  assert.ok(headHtml.includes('crossorigin="anonymous"'));

  const homeHtml = renderToStaticMarkup(React.createElement(HomePage, {}));
  assert.ok(homeHtml.includes('data-ad-placement="homeLeaderboard"'));
  assert.ok(homeHtml.includes('data-ad-placement="homeMidBanner"'));
  assert.ok(homeHtml.includes('data-ad-client="ca-pub-5379808297296166"'));

  const catHtml = renderToStaticMarkup(React.createElement(CategoryPage, { slug: 'home-tech' }));
  assert.ok(catHtml.includes('data-ad-placement="categoryTopBanner"'));
  assert.ok(catHtml.includes('data-ad-placement="categoryInFeed"'));

  const reviewHtml = renderToStaticMarkup(
    React.createElement(ReviewPage, { slug: REVIEWS[0].slug })
  );
  for (const placement of [
    'reviewPostHero',
    'reviewSidebarSticky',
    'reviewInArticle',
    'reviewPostVerdict',
  ]) {
    assert.ok(
      reviewHtml.includes(`data-ad-placement="${placement}"`),
      `ReviewPage must include ${placement} AdSense slot`
    );
  }
  assert.ok(reviewHtml.includes('data-ad-layout="in-article"'));

  const privacyHtml = renderToStaticMarkup(
    React.createElement(LegalPages, { page: 'privacy-policy' })
  );
  assert.ok(
    privacyHtml.includes('Google AdSense') && privacyHtml.includes('myadcenter.google.com'),
    'Privacy Policy must disclose Google AdSense cookies and ad personalization opt-out'
  );
});
