#!/usr/bin/env tsx
/**
 * Shoppingey.com Technical SEO Pipeline (Sitemap + Static Pre-Renderer)
 *
 * - `--sitemap`: Generates /public/sitemap.xml directly from TypeScript data
 *   with zero duplicates and Google Image Sitemap annotations.
 * - `--prerender`: Generates static HTTP-200 HTML entry files in /dist for
 *   every route (Homepage, 5 Category Hubs, 5 Reviews, 6 Editorial/Legal Pages)
 *   complete with route-specific meta tags, OpenGraph/Twitter social cards,
 *   JSON-LD structured data, and server-rendered semantic HTML.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToString } from 'react-dom/server';
import App from '../src/App';
import { CATEGORIES, REVIEWS, SITE_CONFIG } from '../src/data/reviews';
import {
  buildBreadcrumbJsonLd,
  buildCategoryCollectionJsonLd,
  buildFaqJsonLd,
  buildHomePageJsonLd,
  buildProductReviewJsonLd,
  buildSitewideJsonLd,
  buildWebPageJsonLd,
  getCategoryBySlug,
  getReviewsByCategory,
} from '../src/utils/catalog';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_SITEMAP_PATH = path.join(ROOT_DIR, 'public', 'sitemap.xml');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const DEFAULT_OG_IMAGE = `${SITE_CONFIG.domain}/src/assets/images/product_dual_basket_air_fryer_1795195713278.jpg`;

interface StaticRouteSpec {
  path: string;
  title: string;
  description: string;
  ogType: 'website' | 'article';
  image: string;
  imageAlt: string;
  changefreq: 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority: string;
  lastmod: string;
  indexable: boolean;
  robots: string;
  schemaGroupId: string;
  schemas: Record<string, unknown>[];
  articleMeta?: {
    publishedTime: string;
    modifiedTime: string;
    authorName: string;
    section?: string;
  };
}

const INDEX_ROBOTS =
  'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
const NOINDEX_ROBOTS = 'noindex, follow';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeXml(value: string): string {
  return escapeHtml(value).replace(/'/g, '&apos;');
}

function toAbsoluteUrl(relativeOrAbsolute: string): string {
  if (relativeOrAbsolute.startsWith('http://') || relativeOrAbsolute.startsWith('https://')) {
    return relativeOrAbsolute;
  }
  const clean = relativeOrAbsolute.startsWith('/') ? relativeOrAbsolute : `/${relativeOrAbsolute}`;
  return `${SITE_CONFIG.domain}${clean}`;
}

function latestReviewDate(): string {
  const sorted = [...REVIEWS]
    .map((r) => r.lastUpdated)
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a));
  return sorted[0] ?? new Date().toISOString().slice(0, 10);
}

export function buildAllSeoRoutes(): StaticRouteSpec[] {
  const latestDate = latestReviewDate();

  const homeRoute: StaticRouteSpec = {
    path: '/',
    title: 'Shoppingey.com — Independent Amazon Product Reviews (2026)',
    description:
      'Honest, hands-on Amazon product reviews tested and organized by department: Home & Tech, Home & Kitchen, Home Decor, Tools, and Gardening Gadgets.',
    ogType: 'website',
    image: DEFAULT_OG_IMAGE,
    imageAlt: 'Shoppingey.com independent Amazon product reviews and buying guides',
    changefreq: 'daily',
    priority: '1.0',
    lastmod: latestDate,
    indexable: true,
    robots: INDEX_ROBOTS,
    schemaGroupId: 'home',
    schemas: buildHomePageJsonLd(),
  };

  const editorialMeta: Array<{
    path: string;
    pageKey: string;
    schemaType: 'AboutPage' | 'ContactPage' | 'WebPage';
    title: string;
    heading: string;
    description: string;
    changefreq: 'monthly' | 'yearly';
    priority: string;
    indexable: boolean;
  }> = [
    {
      path: '/about',
      pageKey: 'about',
      schemaType: 'AboutPage',
      title: 'About Shoppingey.com — Independent Amazon Product Review Publication',
      heading: 'About Shoppingey.com',
      description:
        'Learn about Shoppingey.com, our independent editorial mission, and how we review everyday Amazon products without brand sponsorships.',
      changefreq: 'monthly',
      priority: '0.6',
      indexable: true,
    },
    {
      path: '/how-we-review',
      pageKey: 'how-we-review',
      schemaType: 'WebPage',
      title: 'How We Review Products — 5-Point Testing Criteria | Shoppingey.com',
      heading: 'How We Review Products',
      description:
        'Discover Shoppingey.com’s transparent 5-point product testing rubric covering Build Quality, Performance, Value, Ease of Use, and Durability.',
      changefreq: 'monthly',
      priority: '0.7',
      indexable: true,
    },
    {
      path: '/affiliate-disclosure',
      pageKey: 'affiliate-disclosure',
      schemaType: 'WebPage',
      title: 'Affiliate Disclosure — FTC & Amazon Associates Compliance | Shoppingey.com',
      heading: 'Affiliate Disclosure',
      description:
        'Read Shoppingey.com’s full FTC and Amazon Associates disclosure explaining how reader-supported affiliate links fund our independent reviews.',
      changefreq: 'yearly',
      priority: '0.3',
      indexable: false,
    },
    {
      path: '/privacy-policy',
      pageKey: 'privacy-policy',
      schemaType: 'WebPage',
      title: 'Privacy Policy — Cookies & Data Transparency | Shoppingey.com',
      heading: 'Privacy Policy',
      description:
        'Review Shoppingey.com’s GDPR and CCPA-aware privacy policy, including how Amazon Associates referral tracking cookies work.',
      changefreq: 'yearly',
      priority: '0.3',
      indexable: false,
    },
    {
      path: '/terms',
      pageKey: 'terms',
      schemaType: 'WebPage',
      title: 'Terms of Use & Product Disclaimer | Shoppingey.com',
      heading: 'Terms of Use & Disclaimer',
      description:
        'Terms governing your use of Shoppingey.com, including live Amazon price and availability disclaimers.',
      changefreq: 'yearly',
      priority: '0.3',
      indexable: false,
    },
    {
      path: '/contact',
      pageKey: 'contact',
      schemaType: 'ContactPage',
      title: 'Contact Editorial Team | Shoppingey.com',
      heading: 'Contact Shoppingey.com',
      description:
        'Reach the Shoppingey.com editorial team for review suggestions, factual corrections, or partnership inquiries.',
      changefreq: 'yearly',
      priority: '0.3',
      indexable: false,
    },
  ];

  const editorialRoutes: StaticRouteSpec[] = editorialMeta.map((page) => ({
    path: page.path,
    title: page.title,
    description: page.description,
    ogType: 'website',
    image: DEFAULT_OG_IMAGE,
    imageAlt: `${page.heading} — ${SITE_CONFIG.name}`,
    changefreq: page.changefreq,
    priority: page.priority,
    lastmod: latestDate,
    indexable: page.indexable,
    robots: page.indexable ? INDEX_ROBOTS : NOINDEX_ROBOTS,
    schemaGroupId: `legal-${page.pageKey}`,
    schemas: [
      buildWebPageJsonLd({
        type: page.schemaType,
        name: page.heading,
        description: page.description,
        path: page.path,
      }),
      buildBreadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: page.heading, path: page.path },
      ]),
    ],
  }));

  const categoryRoutes: StaticRouteSpec[] = CATEGORIES.map((category) => {
    const categoryReviews = getReviewsByCategory(category.slug, REVIEWS);
    const catLastMod =
      categoryReviews
        .map((r) => r.lastUpdated)
        .sort((a, b) => b.localeCompare(a))[0] ?? latestDate;

    return {
      path: `/category/${category.slug}`,
      title: `${category.name} Reviews (2026): Tested Amazon Picks | Shoppingey.com`,
      description: category.metaDescription,
      ogType: 'website',
      image: toAbsoluteUrl(category.featuredImage),
      imageAlt: `Top tested ${category.name} Amazon picks on Shoppingey.com`,
      changefreq: 'weekly',
      priority: '0.85',
      lastmod: catLastMod,
      indexable: true,
      robots: INDEX_ROBOTS,
      schemaGroupId: `category-${category.slug}`,
      schemas: [
        buildCategoryCollectionJsonLd(category, categoryReviews),
        buildBreadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: category.name, path: `/category/${category.slug}` },
        ]),
      ],
    };
  });

  const reviewRoutes: StaticRouteSpec[] = REVIEWS.map((review) => {
    const category = getCategoryBySlug(review.categorySlug, CATEGORIES);
    const breadcrumbs = [
      { name: 'Home', path: '/' },
      ...(category ? [{ name: category.name, path: `/category/${category.slug}` }] : []),
      { name: review.productName, path: `/review/${review.slug}` },
    ];

    return {
      path: `/review/${review.slug}`,
      title: `${review.productName} Review (2026): Worth Buying? | Shoppingey.com`,
      description: review.metaDescription,
      ogType: 'article',
      image: toAbsoluteUrl(review.image),
      imageAlt: review.imageAlt,
      changefreq: 'weekly',
      priority: '0.9',
      lastmod: review.lastUpdated,
      indexable: true,
      robots: INDEX_ROBOTS,
      schemaGroupId: `review-${review.slug}`,
      schemas: [
        buildProductReviewJsonLd(review, category),
        buildFaqJsonLd(review),
        buildBreadcrumbJsonLd(breadcrumbs),
      ],
      articleMeta: {
        publishedTime: review.lastUpdated,
        modifiedTime: review.lastUpdated,
        authorName: review.author.name,
        section: category?.name,
      },
    };
  });

  return [homeRoute, ...editorialRoutes, ...categoryRoutes, ...reviewRoutes];
}

export function buildSitemapRoutes(): StaticRouteSpec[] {
  return buildAllSeoRoutes().filter((route) => route.indexable);
}

export function generateSitemapXml(): string {
  const routes = buildSitemapRoutes();
  const seen = new Set<string>();
  const urlBlocks: string[] = [];

  for (const route of routes) {
    const loc = `${SITE_CONFIG.domain}${route.path}`;
    if (seen.has(loc)) {
      throw new Error(`Duplicate URL detected while generating sitemap: ${loc}`);
    }
    seen.add(loc);

    const includeImageTag =
      route.path.startsWith('/review/') || route.path.startsWith('/category/');
    const imageXml = includeImageTag
      ? `\n    <image:image>\n      <image:loc>${escapeXml(route.image)}</image:loc>\n      <image:title>${escapeXml(route.imageAlt)}</image:title>\n    </image:image>`
      : '';

    urlBlocks.push(
      `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${escapeXml(route.lastmod)}</lastmod>\n    <changefreq>${route.changefreq}</changefreq>\n    <priority>${route.priority}</priority>${imageXml}\n  </url>`
    );
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    ...urlBlocks,
    '</urlset>',
    '',
  ].join('\n');
}

function replaceMetaTag(
  html: string,
  attr: 'name' | 'property',
  key: string,
  content: string
): string {
  const escaped = escapeHtml(content);
  const regex = new RegExp(
    `<meta\\s+[^>]*${attr}=["']${key}["'][^>]*>`,
    'i'
  );
  const tag = `<meta ${attr}="${key}" content="${escaped}" />`;
  if (regex.test(html)) {
    return html.replace(regex, tag);
  }
  return html.replace('</head>', `    ${tag}\n  </head>`);
}

function renderRouteHtml(baseTemplate: string, route: StaticRouteSpec): string {
  const canonicalUrl = `${SITE_CONFIG.domain}${route.path}`;
  let html = baseTemplate;

  // Replace <title>
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(route.title)}</title>`);

  // Replace <link rel="canonical">
  html = html.replace(
    /<link\s+rel=["']canonical["'][^>]*>/i,
    `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`
  );

  // Update core SEO, OpenGraph, and Twitter Card meta tags
  html = replaceMetaTag(html, 'name', 'description', route.description);
  html = replaceMetaTag(html, 'name', 'robots', route.robots);
  html = replaceMetaTag(html, 'property', 'og:type', route.ogType);
  html = replaceMetaTag(html, 'property', 'og:title', route.title);
  html = replaceMetaTag(html, 'property', 'og:description', route.description);
  html = replaceMetaTag(html, 'property', 'og:url', canonicalUrl);
  html = replaceMetaTag(html, 'property', 'og:image', route.image);
  html = replaceMetaTag(html, 'property', 'og:image:alt', route.imageAlt);

  html = replaceMetaTag(html, 'name', 'twitter:title', route.title);
  html = replaceMetaTag(html, 'name', 'twitter:description', route.description);
  html = replaceMetaTag(html, 'name', 'twitter:image', route.image);
  html = replaceMetaTag(html, 'name', 'twitter:image:alt', route.imageAlt);

  // Remove any existing article meta tags and inject fresh ones on review pages
  html = html.replace(/\s*<meta\s+property=["']article:[^"']+["'][^>]*>/gi, '');
  if (route.articleMeta) {
    const articleTags = [
      `<meta property="article:published_time" content="${escapeHtml(route.articleMeta.publishedTime)}" />`,
      `<meta property="article:modified_time" content="${escapeHtml(route.articleMeta.modifiedTime)}" />`,
      `<meta property="article:author" content="${escapeHtml(route.articleMeta.authorName)}" />`,
      ...(route.articleMeta.section
        ? [`<meta property="article:section" content="${escapeHtml(route.articleMeta.section)}" />`]
        : []),
    ];
    html = html.replace('</head>', `    ${articleTags.join('\n    ')}\n  </head>`);
  }

  // Remove any previous hero preload links and add high-priority LCP preload on review pages
  html = html.replace(/\s*<link\s+rel=["']preload["'][^>]*data-lcp-preload=["']true["'][^>]*>/gi, '');
  if (route.path.startsWith('/review/')) {
    const relativeHeroImg = route.image.replace(SITE_CONFIG.domain, '');
    html = html.replace(
      '</head>',
      `    <link rel="preload" as="image" href="${escapeHtml(relativeHeroImg)}" fetchpriority="high" data-lcp-preload="true" />\n  </head>`
    );
  }

  // Strip previous pre-rendered JSON-LD blocks and inject exact sitewide + route JSON-LD
  html = html.replace(
    /\s*<script\s+type=["']application\/ld\+json["'][^>]*data-prerendered-schema=["'][^"']*["'][^>]*>[\s\S]*?<\/script>/gi,
    ''
  );

  const sitewideScripts = buildSitewideJsonLd().map(
    (schema) =>
      `<script type="application/ld+json" data-prerendered-schema="sitewide">${JSON.stringify(schema)}</script>`
  );
  const routeScripts = route.schemas.map(
    (schema) =>
      `<script type="application/ld+json" data-prerendered-schema="${escapeHtml(route.schemaGroupId)}">${JSON.stringify(schema)}</script>`
  );
  html = html.replace(
    '</head>',
    `    ${[...sitewideScripts, ...routeScripts].join('\n    ')}\n  </head>`
  );

  // Inject server-rendered semantic HTML inside #root so Googlebot & zero-JS bots see complete content immediately
  const ssrMarkup = renderToString(React.createElement(App, { initialPathname: route.path }));
  html = html.replace('<div id="root"></div>', `<div id="root">${ssrMarkup}</div>`);

  return html;
}

function writeSitemap(): void {
  const xml = generateSitemapXml();
  fs.mkdirSync(path.dirname(PUBLIC_SITEMAP_PATH), { recursive: true });
  fs.writeFileSync(PUBLIC_SITEMAP_PATH, xml, 'utf8');
  if (fs.existsSync(DIST_DIR)) {
    fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), xml, 'utf8');
  }
  const indexableRoutes = buildSitemapRoutes();
  console.log(
    `Generated sitemap.xml with ${indexableRoutes.length} indexable URLs (${CATEGORIES.length} categories, ${REVIEWS.length} reviews; non-indexable legal/utility pages excluded).`
  );
}

function prerenderDistRoutes(): void {
  const indexHtmlPath = path.join(DIST_DIR, 'index.html');
  if (!fs.existsSync(indexHtmlPath)) {
    throw new Error('dist/index.html not found. Run `vite build` before pre-rendering.');
  }

  const baseTemplate = fs.readFileSync(indexHtmlPath, 'utf8');
  const routes = buildAllSeoRoutes();

  for (const route of routes) {
    const renderedHtml = renderRouteHtml(baseTemplate, route);
    // Write clean extensionless .html files (e.g. dist/review/slug.html, dist/category/tools.html)
    // so GitHub Pages serves /review/slug with HTTP 200 OK and ZERO 301 trailing-slash redirects,
    // matching canonical URLs and sitemap.xml byte-for-byte.
    const cleanRelative = route.path.replace(/^\/+|\/+$/g, '');
    const outFile =
      route.path === '/' ? indexHtmlPath : path.join(DIST_DIR, `${cleanRelative}.html`);

    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, renderedHtml, 'utf8');
  }

  console.log(
    `Pre-rendered ${routes.length} static SEO HTML pages into dist/ with full metadata, JSON-LD, and semantic markup.`
  );
}

// Run when invoked directly via CLI
const isDirectExecution =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isDirectExecution) {
  const args = new Set(process.argv.slice(2));
  const runAll = args.size === 0 || args.has('--all');

  if (runAll || args.has('--sitemap')) {
    writeSitemap();
  }
  if (runAll || args.has('--prerender')) {
    prerenderDistRoutes();
  }
}
