import { useEffect } from 'react';
import { SITE_CONFIG } from '../data/reviews';

export interface SEOHeadProps {
  title: string;
  description: string;
  canonicalPath: string;
  ogType?: 'website' | 'article';
  image?: string;
  imageAlt?: string;
  robots?: string;
  publishedTime?: string;
  modifiedTime?: string;
  authorName?: string;
  section?: string;
}

const DEFAULT_ROBOTS =
  'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

function upsertMeta(attr: 'name' | 'property', key: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function removeMeta(attr: 'name' | 'property', key: string): void {
  const el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (el?.parentNode) {
    el.parentNode.removeChild(el);
  }
}

function upsertCanonical(href: string): void {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

export function SEOHead({
  title,
  description,
  canonicalPath,
  ogType = 'website',
  image,
  imageAlt,
  robots = DEFAULT_ROBOTS,
  publishedTime,
  modifiedTime,
  authorName,
  section,
}: SEOHeadProps) {
  useEffect(() => {
    const cleanPath = canonicalPath === '/' ? '/' : canonicalPath.replace(/\/+$/, '');
    const canonicalUrl = `${SITE_CONFIG.domain}${cleanPath}`;
    const resolvedImage = image
      ? image.startsWith('http')
        ? image
        : `${SITE_CONFIG.domain}${image}`
      : `${SITE_CONFIG.domain}/src/assets/images/product_dual_basket_air_fryer_1795195713278.jpg`;
    const resolvedImageAlt = imageAlt || `${title} — ${SITE_CONFIG.name}`;

    document.title = title;
    upsertCanonical(canonicalUrl);

    upsertMeta('name', 'description', description);
    upsertMeta('name', 'robots', robots);
    upsertMeta('name', 'googlebot', robots);

    upsertMeta('property', 'og:site_name', SITE_CONFIG.name);
    upsertMeta('property', 'og:locale', 'en_US');
    upsertMeta('property', 'og:type', ogType);
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', canonicalUrl);
    upsertMeta('property', 'og:image', resolvedImage);
    upsertMeta('property', 'og:image:alt', resolvedImageAlt);

    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', resolvedImage);
    upsertMeta('name', 'twitter:image:alt', resolvedImageAlt);

    if (ogType === 'article' && publishedTime) {
      upsertMeta('property', 'article:published_time', publishedTime);
    } else {
      removeMeta('property', 'article:published_time');
    }

    if (ogType === 'article' && modifiedTime) {
      upsertMeta('property', 'article:modified_time', modifiedTime);
    } else {
      removeMeta('property', 'article:modified_time');
    }

    if (ogType === 'article' && authorName) {
      upsertMeta('property', 'article:author', authorName);
    } else {
      removeMeta('property', 'article:author');
    }

    if (ogType === 'article' && section) {
      upsertMeta('property', 'article:section', section);
    } else {
      removeMeta('property', 'article:section');
    }
  }, [
    title,
    description,
    canonicalPath,
    ogType,
    image,
    imageAlt,
    robots,
    publishedTime,
    modifiedTime,
    authorName,
    section,
  ]);

  return null;
}
