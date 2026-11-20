import { useEffect } from 'react';
import { SITE_CONFIG } from '../data/reviews';

export interface SEOHeadProps {
  title: string;
  description: string;
  canonicalPath: string;
  ogType?: 'website' | 'article';
  image?: string;
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
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
}: SEOHeadProps) {
  useEffect(() => {
    const cleanPath = canonicalPath === '/' ? '/' : canonicalPath.replace(/\/+$/, '');
    const canonicalUrl = `${SITE_CONFIG.domain}${cleanPath}`;
    const resolvedImage = image
      ? image.startsWith('http')
        ? image
        : `${SITE_CONFIG.domain}${image}`
      : undefined;

    document.title = title;
    upsertCanonical(canonicalUrl);

    upsertMeta('name', 'description', description);
    upsertMeta('property', 'og:site_name', SITE_CONFIG.name);
    upsertMeta('property', 'og:type', ogType);
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', canonicalUrl);

    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);

    if (resolvedImage) {
      upsertMeta('property', 'og:image', resolvedImage);
      upsertMeta('name', 'twitter:image', resolvedImage);
    }
  }, [title, description, canonicalPath, ogType, image]);

  return null;
}
