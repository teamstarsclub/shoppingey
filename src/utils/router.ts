import { useEffect, useState, useCallback } from 'react';

export type AppRoute =
  | { type: 'home'; query?: string }
  | { type: 'category'; slug: string }
  | { type: 'review'; slug: string }
  | {
      type: 'legal';
      page:
        | 'about'
        | 'how-we-review'
        | 'affiliate-disclosure'
        | 'privacy-policy'
        | 'terms'
        | 'contact';
    }
  | { type: 'not-found'; path: string };

const LEGAL_PAGES = new Set([
  'about',
  'how-we-review',
  'affiliate-disclosure',
  'privacy-policy',
  'terms',
  'contact',
]);

/**
 * Returns the normalized Vite base path (always starts and ends with '/').
 * Supports root domains ('/') as well as GitHub Pages project subpaths ('/repo-name/').
 */
export function getBasePath(): string {
  const envBase =
    typeof import.meta !== 'undefined' &&
    import.meta.env &&
    typeof import.meta.env.BASE_URL === 'string'
      ? import.meta.env.BASE_URL
      : '/';

  if (!envBase || envBase === '/' || envBase === './') {
    return '/';
  }
  const withLeading = envBase.startsWith('/') ? envBase : `/${envBase}`;
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`;
}

/**
 * Strips the configured deployment base path from a browser pathname so route
 * matching always sees clean app-relative paths (e.g., '/category/tools').
 */
export function stripBasePath(pathname: string, basePath = getBasePath()): string {
  if (basePath === '/') {
    return pathname.replace(/\/+$/, '') || '/';
  }
  const baseNoTrailing = basePath.slice(0, -1);
  if (pathname === baseNoTrailing || pathname === basePath) {
    return '/';
  }
  if (pathname.startsWith(basePath)) {
    const stripped = `/${pathname.slice(basePath.length)}`;
    return stripped.replace(/\/+$/, '') || '/';
  }
  return pathname.replace(/\/+$/, '') || '/';
}

/**
 * Prepends the deployment base path to an internal app route or asset path.
 */
export function withBasePath(path: string, basePath = getBasePath()): string {
  if (
    !path ||
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('mailto:') ||
    path.startsWith('#')
  ) {
    return path;
  }
  if (basePath === '/') {
    return path.startsWith('/') ? path : `/${path}`;
  }
  if (path === '/') {
    return basePath;
  }
  if (path.startsWith(basePath)) {
    return path;
  }
  const cleanRelative = path.startsWith('/') ? path.slice(1) : path;
  return `${basePath}${cleanRelative}`;
}

/**
 * Resolves static product image URLs cleanly across root and subpath deployments.
 */
export function resolveAssetUrl(assetPath: string, basePath = getBasePath()): string {
  return withBasePath(assetPath, basePath);
}

export function parsePathname(pathname: string, search = '', basePath = getBasePath()): AppRoute {
  const cleanPath = stripBasePath(pathname, basePath);

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
  const resolved = withBasePath(to);
  const current = window.location.pathname + window.location.search;
  if (current === resolved) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  window.history.pushState({}, '', resolved);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
}

export function useRouter(initialPathname?: string) {
  const [locationState, setLocationState] = useState(() => ({
    pathname:
      initialPathname !== undefined
        ? initialPathname
        : typeof window !== 'undefined'
          ? window.location.pathname
          : '/',
    search:
      initialPathname !== undefined
        ? ''
        : typeof window !== 'undefined'
          ? window.location.search
          : '',
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

  const appPathname = stripBasePath(locationState.pathname);
  const route = parsePathname(locationState.pathname, locationState.search);

  return {
    pathname: appPathname,
    search: locationState.search,
    route,
    navigate,
  };
}
