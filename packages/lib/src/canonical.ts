/**
 * Canonical URL Utilities
 *
 * Provides functions for generating and normalizing canonical URLs to prevent
 * duplicate content issues and improve SEO.
 *
 * Key features:
 * - Strip tracking parameters (utm_*, fbclid, gclid, etc.)
 * - Normalize URL structure (trailing slashes, protocol, etc.)
 * - Generate canonical URLs for different content types
 * - Handle multi-path scenarios (same content, different URLs)
 */

/**
 * List of tracking parameters to strip from canonical URLs
 */
const TRACKING_PARAMS = [
  // UTM parameters (Google Analytics, marketing campaigns)
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',

  // Facebook tracking
  'fbclid',
  'fb_action_ids',
  'fb_action_types',
  'fb_source',
  'fb_ref',

  // Google Ads tracking
  'gclid',
  'gclsrc',
  'dclid',

  // Microsoft/Bing tracking
  'msclkid',

  // Twitter tracking
  'twclid',

  // LinkedIn tracking
  'li_fat_id',

  // Session/user tracking
  'sessionid',
  'session_id',
  'sid',
  '_ga',

  // Referral tracking
  'ref',
  'referrer',

  // Email tracking
  'mc_cid',
  'mc_eid',

  // Other common tracking params
  'source',
  'campaign',
] as const;

export interface CanonicalUrlOptions {
  /**
   * Base URL of the site (e.g., https://nearbybazaar.com)
   */
  baseUrl: string;

  /**
   * Path component (e.g., /p/product-slug)
   */
  path: string;

  /**
   * Query parameters to include (functional params only)
   */
  params?: Record<string, string | string[] | undefined>;

  /**
   * Whether to force trailing slash (default: false)
   */
  trailingSlash?: boolean;

  /**
   * Whether to force HTTPS (default: true)
   */
  forceHttps?: boolean;

  /**
   * Whether to lowercase the path (default: true)
   */
  lowercasePath?: boolean;
}

/**
 * Strip tracking parameters from a URL string or object
 *
 * @param url - URL string or URL object
 * @returns Clean URL without tracking parameters
 *
 * @example
 * ```typescript
 * stripTrackingParams('https://example.com/page?utm_source=google&page=2')
 * // Returns: 'https://example.com/page?page=2'
 * ```
 */
export function stripTrackingParams(url: string | URL): string {
  const urlObj = typeof url === 'string' ? new URL(url) : url;
  const params = new URLSearchParams(urlObj.search);

  // Remove all tracking parameters
  for (const param of TRACKING_PARAMS) {
    params.delete(param);
  }

  // Reconstruct URL
  const cleanUrl = new URL(urlObj.origin + urlObj.pathname);

  // Add back non-tracking params
  for (const [key, value] of params.entries()) {
    cleanUrl.searchParams.set(key, value);
  }

  return cleanUrl.toString();
}

/**
 * Normalize a URL to a consistent format
 *
 * @param url - URL to normalize
 * @param options - Normalization options
 * @returns Normalized URL
 *
 * @example
 * ```typescript
 * normalizeUrl('HTTP://Example.COM/Path/?foo=bar')
 * // Returns: 'https://example.com/path?foo=bar'
 * ```
 */
export function normalizeUrl(
  url: string,
  options: {
    forceHttps?: boolean;
    lowercasePath?: boolean;
    trailingSlash?: boolean;
    stripHash?: boolean;
  } = {},
): string {
  const {
    forceHttps = true,
    lowercasePath = true,
    trailingSlash = false,
    stripHash = true,
  } = options;

  const urlObj = new URL(url);

  // Force HTTPS
  if (forceHttps && urlObj.protocol === 'http:') {
    urlObj.protocol = 'https:';
  }

  // Lowercase hostname (always)
  urlObj.hostname = urlObj.hostname.toLowerCase();

  // Lowercase path
  if (lowercasePath) {
    urlObj.pathname = urlObj.pathname.toLowerCase();
  }

  // Handle trailing slash
  if (trailingSlash && !urlObj.pathname.endsWith('/')) {
    urlObj.pathname += '/';
  } else if (!trailingSlash && urlObj.pathname.endsWith('/') && urlObj.pathname !== '/') {
    urlObj.pathname = urlObj.pathname.slice(0, -1);
  }

  // Strip hash
  if (stripHash) {
    urlObj.hash = '';
  }

  // Sort query parameters for consistency
  const sortedParams = new URLSearchParams(
    Array.from(urlObj.searchParams.entries()).sort(([a], [b]) => a.localeCompare(b)),
  );
  urlObj.search = sortedParams.toString();

  return urlObj.toString();
}

/**
 * Generate a canonical URL from components
 *
 * @param options - URL components and options
 * @returns Canonical URL string
 *
 * @example
 * ```typescript
 * generateCanonicalUrl({
 *   baseUrl: 'https://nearbybazaar.com',
 *   path: '/p/laptop-stand',
 *   params: { page: '2' }
 * })
 * // Returns: 'https://nearbybazaar.com/p/laptop-stand?page=2'
 * ```
 */
export function generateCanonicalUrl(options: CanonicalUrlOptions): string {
  const {
    baseUrl,
    path,
    params = {},
    trailingSlash = false,
    forceHttps = true,
    lowercasePath = true,
  } = options;

  // Ensure baseUrl has no trailing slash
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');

  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // Build URL
  let url = cleanBaseUrl + cleanPath;

  // Add functional parameters only (not tracking params)
  const functionalParams = Object.entries(params).filter(
    ([key]) => !TRACKING_PARAMS.includes(key as any),
  );

  if (functionalParams.length > 0) {
    const searchParams = new URLSearchParams();

    for (const [key, value] of functionalParams) {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach((v) => searchParams.append(key, v));
        } else {
          searchParams.set(key, String(value));
        }
      }
    }

    const queryString = searchParams.toString();
    if (queryString) {
      url += '?' + queryString;
    }
  }

  // Normalize the final URL
  return normalizeUrl(url, {
    forceHttps,
    lowercasePath,
    trailingSlash,
    stripHash: true,
  });
}

/**
 * Generate canonical URL for a product page
 *
 * @param baseUrl - Base URL of the site
 * @param slug - Product slug
 * @param options - Additional options
 * @returns Canonical URL
 *
 * @example
 * ```typescript
 * getProductCanonical('https://nearbybazaar.com', 'laptop-stand')
 * // Returns: 'https://nearbybazaar.com/p/laptop-stand'
 * ```
 */
export function getProductCanonical(
  baseUrl: string,
  slug: string,
  options?: { variant?: string },
): string {
  return generateCanonicalUrl({
    baseUrl,
    path: `/p/${slug}`,
    params: options?.variant ? { variant: options.variant } : {},
  });
}

/**
 * Generate canonical URL for a service page
 *
 * @param baseUrl - Base URL of the site
 * @param slug - Service slug
 * @returns Canonical URL
 */
export function getServiceCanonical(baseUrl: string, slug: string): string {
  return generateCanonicalUrl({
    baseUrl,
    path: `/s/${slug}`,
  });
}

/**
 * Generate canonical URL for a store page
 *
 * @param baseUrl - Base URL of the site
 * @param slug - Store slug
 * @param options - Additional options
 * @returns Canonical URL
 */
export function getStoreCanonical(
  baseUrl: string,
  slug: string,
  options?: { tab?: string },
): string {
  return generateCanonicalUrl({
    baseUrl,
    path: `/store/${slug}`,
    params: options?.tab ? { tab: options.tab } : {},
  });
}

/**
 * Generate canonical URL for a classified page
 *
 * @param baseUrl - Base URL of the site
 * @param slug - Classified slug
 * @returns Canonical URL
 */
export function getClassifiedCanonical(baseUrl: string, slug: string): string {
  return generateCanonicalUrl({
    baseUrl,
    path: `/c/${slug}`,
  });
}

/**
 * Generate canonical URL for a category page
 *
 * @param baseUrl - Base URL of the site
 * @param slug - Category slug
 * @param options - Pagination and filtering options
 * @returns Canonical URL
 */
export function getCategoryCanonical(
  baseUrl: string,
  slug: string,
  options?: { page?: number; sort?: string },
): string {
  const params: Record<string, string> = {};

  // Include page if not first page
  if (options?.page && options.page > 1) {
    params.page = String(options.page);
  }

  // Include sort if not default
  if (options?.sort && options.sort !== 'default') {
    params.sort = options.sort;
  }

  return generateCanonicalUrl({
    baseUrl,
    path: `/category/${slug}`,
    params,
  });
}

/**
 * Generate canonical URL for search results
 *
 * @param baseUrl - Base URL of the site
 * @param options - Search options
 * @returns Canonical URL
 */
export function getSearchCanonical(
  baseUrl: string,
  options?: { q?: string; page?: number; type?: string },
): string {
  const params: Record<string, string> = {};

  if (options?.q) {
    params.q = options.q;
  }

  if (options?.page && options.page > 1) {
    params.page = String(options.page);
  }

  if (options?.type && options.type !== 'all') {
    params.type = options.type;
  }

  return generateCanonicalUrl({
    baseUrl,
    path: '/search',
    params,
  });
}

/**
 * Check if two URLs are canonical duplicates (same canonical)
 *
 * @param url1 - First URL
 * @param url2 - Second URL
 * @returns True if both URLs should have the same canonical
 *
 * @example
 * ```typescript
 * areCanonicalDuplicates(
 *   'https://example.com/page?utm_source=google',
 *   'https://example.com/page?utm_source=facebook'
 * )
 * // Returns: true (same canonical after stripping tracking params)
 * ```
 */
export function areCanonicalDuplicates(url1: string, url2: string): boolean {
  try {
    const canonical1 = stripTrackingParams(url1);
    const canonical2 = stripTrackingParams(url2);

    const normalized1 = normalizeUrl(canonical1);
    const normalized2 = normalizeUrl(canonical2);

    return normalized1 === normalized2;
  } catch {
    return false;
  }
}

/**
 * Extract the canonical path from a full URL
 * Useful for comparing paths without domains
 *
 * @param url - Full URL or path
 * @returns Canonical path
 */
export function getCanonicalPath(url: string): string {
  try {
    const urlObj = new URL(url);
    return normalizeUrl(stripTrackingParams(urlObj), {
      forceHttps: false,
      lowercasePath: true,
      trailingSlash: false,
    }).replace(urlObj.origin, '');
  } catch {
    // Not a full URL, treat as path
    return normalizeUrl(`https://dummy.com${url.startsWith('/') ? url : '/' + url}`, {
      forceHttps: false,
      lowercasePath: true,
      trailingSlash: false,
    }).replace('https://dummy.com', '');
  }
}

/**
 * Get the base URL from environment or config
 *
 * @returns Base URL for the site
 */
export function getBaseUrl(): string {
  // In production, use environment variable
  if (
    (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_BASE_URL) ||
    (typeof global !== 'undefined' &&
      (global as any).process &&
      (global as any).process.env &&
      (global as any).process.env.NEXT_PUBLIC_BASE_URL)
  ) {
    // Prefer process.env if available
    return typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_BASE_URL
      ? process.env.NEXT_PUBLIC_BASE_URL
      : (global as any).process.env.NEXT_PUBLIC_BASE_URL;
  }

  // In browser, use window.location if available
  if (
    (typeof window !== 'undefined' && window.location && window.location.origin) ||
    (typeof global !== 'undefined' &&
      (global as any).window &&
      (global as any).window.location &&
      (global as any).window.location.origin)
  ) {
    return typeof window !== 'undefined' && window.location && window.location.origin
      ? window.location.origin
      : (global as any).window.location.origin;
  }

  // Fallback (should be configured in production)
  return 'https://nearbybazaar.com';
}
