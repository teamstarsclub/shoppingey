import { useEffect, useState, useCallback } from 'react';

export type AppRoute =
  | { type: 'home'; query?: string }
  | { type: 'category'; slug: string }
  | { type: 'review'; slug: string }
  | { type: 'legal'; page: 'about' | 'how-we-review' | 'affiliate-disclosure' | 'privacy-policy' | 'terms' | 'contact' }
  | { type: 'not-found'; path: string };

const LEGAL_PAGES = new Set([
  'about',
  'how-we-review',
  'affiliate-disclosure',
  'privacy-policy',
  'terms',
  'contact',
]);

export function parsePathname(pathname: string, search = ''): AppRoute {
  const cleanPath = pathname.replace(/\/+$/, '') || '/';

  if (cleanPath === '/') {
    const params = new URLSearchParams(search);
    const q = params.get('q')?.trim() || undefined;
    return { type: 'home', query: q };
  }

  const segments = cleanPath.slice(1).split('/');

  if (segments.length === 2 && segments[0] === 'category') {
    return { type: 'category', slug: decodeURIComponent(segments[1]) };
  }

  if (segments.length === 2 && segments[0] === 'review') {
    return { type: 'review', slug: decodeURIComponent(segments[1]) };
  }

  if (segments.length === 1 && LEGAL_PAGES.has(segments[0])) {
    return {
      type: 'legal',
      page: segments[0] as
        | 'about'
        | 'how-we-review'
        | 'affiliate-disclosure'
        | 'privacy-policy'
        | 'terms'
        | 'contact',
    };
  }

  return { type: 'not-found', path: cleanPath };
}

export function navigateTo(to: string): void {
  if (typeof window === 'undefined') return;
  const current = window.location.pathname + window.location.search;
  if (current === to) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  window.history.pushState({}, '', to);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
}

export function useRouter() {
  const [locationState, setLocationState] = useState(() => ({
    pathname: typeof window !== 'undefined' ? window.location.pathname : '/',
    search: typeof window !== 'undefined' ? window.location.search : '',
  }));

  useEffect(() => {
    const handlePopState = () => {
      setLocationState({
        pathname: window.location.pathname,
        search: window.location.search,
      });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((to: string) => {
    navigateTo(to);
  }, []);

  const route = parsePathname(locationState.pathname, locationState.search);

  return {
    pathname: locationState.pathname,
    search: locationState.search,
    route,
    navigate,
  };
}
