#!/usr/bin/env node
/**
 * Shoppingey.com Sitemap Generator
 * Reads /src/data/reviews.ts and generates /public/sitemap.xml covering all
 * static pages, category hubs, and product review articles.
 *
 * Usage: npm run generate:sitemap
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const reviewsFilePath = path.join(rootDir, 'src', 'data', 'reviews.ts');
const outputPath = path.join(rootDir, 'public', 'sitemap.xml');

const SITE_URL = 'https://www.shoppingey.com';
const today = new Date().toISOString().slice(0, 10);

const source = fs.readFileSync(reviewsFilePath, 'utf8');

// Extract category slugs from CATEGORIES array block
const categoriesBlockMatch = source.match(/export const CATEGORIES[\s\S]*?=\s*\[([\s\S]*?)\n\];/);
const categorySlugs = [];
if (categoriesBlockMatch) {
  const regex = /slug:\s*['"]([a-z0-9-]+)['"]/g;
  let match;
  while ((match = regex.exec(categoriesBlockMatch[1])) !== null) {
    categorySlugs.push(match[1]);
  }
}

// Extract review slugs and lastUpdated dates from REVIEWS array block
const reviewsBlockMatch = source.match(/export const REVIEWS[\s\S]*?=\s*\[([\s\S]*?)\n\];/);
const reviewEntries = [];
if (reviewsBlockMatch) {
  const slugRegex = /slug:\s*['"]([a-z0-9-]+)['"][\s\S]*?lastUpdated:\s*['"]([0-9-]+)['"]/g;
  let match;
  while ((match = slugRegex.exec(reviewsBlockMatch[1])) !== null) {
    reviewEntries.push({ slug: match[1], lastUpdated: match[2] });
  }
}

const staticRoutes = [
  { path: '/', changefreq: 'daily', priority: '1.0', lastmod: today },
  { path: '/about', changefreq: 'monthly', priority: '0.6', lastmod: today },
  { path: '/how-we-review', changefreq: 'monthly', priority: '0.7', lastmod: today },
  { path: '/affiliate-disclosure', changefreq: 'yearly', priority: '0.4', lastmod: today },
  { path: '/privacy-policy', changefreq: 'yearly', priority: '0.3', lastmod: today },
  { path: '/terms', changefreq: 'yearly', priority: '0.3', lastmod: today },
  { path: '/contact', changefreq: 'yearly', priority: '0.4', lastmod: today },
];

const urls = [
  ...staticRoutes,
  ...categorySlugs.map((slug) => ({
    path: `/category/${slug}`,
    changefreq: 'weekly',
    priority: '0.85',
    lastmod: today,
  })),
  ...reviewEntries.map((entry) => ({
    path: `/review/${entry.slug}`,
    changefreq: 'weekly',
    priority: '0.9',
    lastmod: entry.lastUpdated || today,
  })),
];

const xmlLines = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls.map(
    (u) => `  <url>
    <loc>${SITE_URL}${u.path}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  ),
  '</urlset>',
  '',
];

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, xmlLines.join('\n'), 'utf8');
console.log(
  `Generated public/sitemap.xml with ${urls.length} URLs (${categorySlugs.length} categories, ${reviewEntries.length} reviews).`
);
