import { useEffect } from 'react';
import { SITE_CONFIG } from '../data/reviews';

export interface SEOHeadProps {
  title: string;
  description: string;
  canonicalPath: string;
  ogType?: 'website' | 'article';
  socialTitle?: string;
  socialDescription?: string;
  image?: string;
  imageAlt?: string;
  imageType?: string;
  imageWidth?: number;
  imageHeight?: number;
  robots?: string;
  publishedTime?: string;
  modifiedTime?: string;
  authorName?: string;
  section?: string;
  tags?: string[];
  twitterLabels?: Array<{ label: string; data: string }>;
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
  const els = document.head.querySelectorAll<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  els.forEach((el) => {
    if (el.parentNode) {
      el.parentNode.removeChild(el);
    }
  });
}

function replaceMultiMeta(attr: 'name' | 'property', key: string, values: string[]): void {
  removeMeta(attr, key);
  for (const val of values) {
    const el = document.createElement('meta');
    el.setAttribute(attr, key);
    el.setAttribute('content', val);
    document.head.appendChild(el);
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
  socialTitle,
  socialDescription,
  image,
  imageAlt,
  imageType,
  imageWidth = 1200,
  imageHeight = 896,
  robots = DEFAULT_ROBOTS,
  publishedTime,
  modifiedTime,
  authorName,
  section,
  tags,
  twitterLabels,
}: SEOHeadProps) {
  useEffect(() => {
    const cleanPath = canonicalPath === '/' ? '/' : canonicalPath.replace(/\/+$/, '');
    const canonicalUrl = `${SITE_CONFIG.domain}${cleanPath}`;
    const resolvedDomain = new URL(SITE_CONFIG.domain).hostname;
    const resolvedImage = image
      ? image.startsWith('http')
        ? image
        : `${SITE_CONFIG.domain}${image.startsWith('/') ? '' : '/'}${image}`
      : `${SITE_CONFIG.domain}/src/assets/images/product_dual_basket_air_fryer_1795195713278.jpg`;
    const resolvedImageAlt = imageAlt || `${title} — ${SITE_CONFIG.name}`;
    const resolvedImageType =
      imageType ||
      (resolvedImage.toLowerCase().endsWith('.png')
        ? 'image/png'
        : resolvedImage.toLowerCase().endsWith('.webp')
          ? 'image/webp'
          : 'image/jpeg');
    const resolvedSocialTitle = socialTitle || title;
    const resolvedSocialDescription = socialDescription || description;

    document.title = title;
    upsertCanonical(canonicalUrl);

    upsertMeta('name', 'description', description);
    upsertMeta('name', 'robots', robots);
    upsertMeta('name', 'googlebot', robots);

    upsertMeta('property', 'og:site_name', SITE_CONFIG.name);
    upsertMeta('property', 'og:locale', 'en_US');
    upsertMeta('property', 'og:type', ogType);
    upsertMeta('property', 'og:title', resolvedSocialTitle);
    upsertMeta('property', 'og:description', resolvedSocialDescription);
    upsertMeta('property', 'og:url', canonicalUrl);
    upsertMeta('property', 'og:image', resolvedImage);
    upsertMeta('property', 'og:image:secure_url', resolvedImage);
    upsertMeta('property', 'og:image:type', resolvedImageType);
    upsertMeta('property', 'og:image:width', String(imageWidth));
    upsertMeta('property', 'og:image:height', String(imageHeight));
    upsertMeta('property', 'og:image:alt', resolvedImageAlt);

    if (ogType === 'article' && modifiedTime) {
      upsertMeta('property', 'og:updated_time', modifiedTime);
    } else {
      removeMeta('property', 'og:updated_time');
    }

    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:domain', resolvedDomain);
    upsertMeta('name', 'twitter:url', canonicalUrl);
    upsertMeta('name', 'twitter:title', resolvedSocialTitle);
    upsertMeta('name', 'twitter:description', resolvedSocialDescription);
    upsertMeta('name', 'twitter:image', resolvedImage);
    upsertMeta('name', 'twitter:image:alt', resolvedImageAlt);

    if (twitterLabels && twitterLabels.length > 0) {
      twitterLabels.slice(0, 2).forEach((entry, index) => {
        upsertMeta('name', `twitter:label${index + 1}`, entry.label);
        upsertMeta('name', `twitter:data${index + 1}`, entry.data);
      });
      if (twitterLabels.length < 2) {
        removeMeta('name', 'twitter:label2');
        removeMeta('name', 'twitter:data2');
      }
    } else {
      removeMeta('name', 'twitter:label1');
      removeMeta('name', 'twitter:data1');
      removeMeta('name', 'twitter:label2');
      removeMeta('name', 'twitter:data2');
    }

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

    if (ogType === 'article') {
      upsertMeta('property', 'article:publisher', SITE_CONFIG.domain);
    } else {
      removeMeta('property', 'article:publisher');
    }

    if (ogType === 'article' && section) {
      upsertMeta('property', 'article:section', section);
    } else {
      removeMeta('property', 'article:section');
    }

    if (ogType === 'article' && tags && tags.length > 0) {
      replaceMultiMeta('property', 'article:tag', tags);
    } else {
      removeMeta('property', 'article:tag');
    }
  }, [
    title,
    description,
    canonicalPath,
    ogType,
    socialTitle,
    socialDescription,
    image,
    imageAlt,
    imageType,
    imageWidth,
    imageHeight,
    robots,
    publishedTime,
    modifiedTime,
    authorName,
    section,
    tags,
    twitterLabels,
  ]);

  return null;
}
