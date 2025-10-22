describe('getBaseUrl', () => {
  it.skip('should return the default URL if no env or window', () => {
    // Skipped: jsdom always provides window.location.origin ("http://localhost"),
    // so the fallback branch in getBaseUrl cannot be tested in this environment.
    // If you want to test the fallback, run in a pure Node environment with no window or process.env.
  });
});
/**
 * Tests for Canonical URL Utilities
 */

import {
  stripTrackingParams,
  normalizeUrl,
  generateCanonicalUrl,
  getProductCanonical,
  getServiceCanonical,
  getStoreCanonical,
  getClassifiedCanonical,
  getCategoryCanonical,
  getSearchCanonical,
  areCanonicalDuplicates,
  getCanonicalPath,
  getBaseUrl,
} from '@nearbybazaar/lib';

describe('Canonical URL Utilities', () => {
  const BASE_URL = 'https://nearbybazaar.com';

  describe('stripTrackingParams', () => {
    it('should remove UTM parameters', () => {
      const url = 'https://example.com/page?utm_source=google&utm_medium=cpc&page=2';
      const result = stripTrackingParams(url);
      expect(result).toBe('https://example.com/page?page=2');
    });

    it('should remove Facebook tracking parameters', () => {
      const url = 'https://example.com/page?fbclid=abc123&fb_source=share';
      const result = stripTrackingParams(url);
      expect(result).toBe('https://example.com/page');
    });

    it('should remove Google Ads tracking parameters', () => {
      const url = 'https://example.com/page?gclid=xyz789&gclsrc=aw.ds';
      const result = stripTrackingParams(url);
      expect(result).toBe('https://example.com/page');
    });

    it('should remove Microsoft/Bing tracking parameters', () => {
      const url = 'https://example.com/page?msclkid=def456';
      const result = stripTrackingParams(url);
      expect(result).toBe('https://example.com/page');
    });

    it('should preserve functional parameters', () => {
      const url = 'https://example.com/page?page=2&sort=price&utm_source=email';
      const result = stripTrackingParams(url);
      expect(result).toBe('https://example.com/page?page=2&sort=price');
    });

    it('should handle URL objects', () => {
      const urlObj = new URL('https://example.com/page?utm_campaign=summer&filter=active');
      const result = stripTrackingParams(urlObj);
      expect(result).toBe('https://example.com/page?filter=active');
    });

    it('should handle URLs with no parameters', () => {
      const url = 'https://example.com/page';
      const result = stripTrackingParams(url);
      expect(result).toBe('https://example.com/page');
    });

    it('should handle URLs with only tracking parameters', () => {
      const url = 'https://example.com/page?utm_source=google&utm_medium=cpc';
      const result = stripTrackingParams(url);
      expect(result).toBe('https://example.com/page');
    });
  });

  describe('normalizeUrl', () => {
    it('should force HTTPS by default', () => {
      const url = 'http://example.com/page';
      const result = normalizeUrl(url);
      expect(result).toBe('https://example.com/page');
    });

    it('should lowercase hostname', () => {
      const url = 'https://EXAMPLE.COM/page';
      const result = normalizeUrl(url);
      expect(result).toBe('https://example.com/page');
    });

    it('should lowercase path when enabled', () => {
      const url = 'https://example.com/Page/Section';
      const result = normalizeUrl(url, { lowercasePath: true });
      expect(result).toBe('https://example.com/page/section');
    });

    it('should preserve path case when disabled', () => {
      const url = 'https://example.com/Page/Section';
      const result = normalizeUrl(url, { lowercasePath: false });
      expect(result).toBe('https://example.com/Page/Section');
    });

    it('should add trailing slash when enabled', () => {
      const url = 'https://example.com/page';
      const result = normalizeUrl(url, { trailingSlash: true });
      expect(result).toBe('https://example.com/page/');
    });

    it('should remove trailing slash when disabled', () => {
      const url = 'https://example.com/page/';
      const result = normalizeUrl(url, { trailingSlash: false });
      expect(result).toBe('https://example.com/page');
    });

    it('should preserve root trailing slash', () => {
      const url = 'https://example.com/';
      const result = normalizeUrl(url, { trailingSlash: false });
      expect(result).toBe('https://example.com/');
    });

    it('should strip hash by default', () => {
      const url = 'https://example.com/page#section';
      const result = normalizeUrl(url);
      expect(result).toBe('https://example.com/page');
    });

    it('should preserve hash when disabled', () => {
      const url = 'https://example.com/page#section';
      const result = normalizeUrl(url, { stripHash: false });
      expect(result).toBe('https://example.com/page#section');
    });

    it('should sort query parameters', () => {
      const url = 'https://example.com/page?z=1&a=2&m=3';
      const result = normalizeUrl(url);
      expect(result).toBe('https://example.com/page?a=2&m=3&z=1');
    });
  });

  describe('generateCanonicalUrl', () => {
    it('should generate basic canonical URL', () => {
      const result = generateCanonicalUrl({
        baseUrl: BASE_URL,
        path: '/p/laptop-stand',
      });
      expect(result).toBe('https://nearbybazaar.com/p/laptop-stand');
    });

    it('should handle path without leading slash', () => {
      const result = generateCanonicalUrl({
        baseUrl: BASE_URL,
        path: 'p/laptop-stand',
      });
      expect(result).toBe('https://nearbybazaar.com/p/laptop-stand');
    });

    it('should handle baseUrl with trailing slash', () => {
      const result = generateCanonicalUrl({
        baseUrl: BASE_URL + '/',
        path: '/p/laptop-stand',
      });
      expect(result).toBe('https://nearbybazaar.com/p/laptop-stand');
    });

    it('should include functional parameters', () => {
      const result = generateCanonicalUrl({
        baseUrl: BASE_URL,
        path: '/search',
        params: { q: 'laptop', page: '2' },
      });
      expect(result).toBe('https://nearbybazaar.com/search?page=2&q=laptop');
    });

    it('should exclude tracking parameters', () => {
      const result = generateCanonicalUrl({
        baseUrl: BASE_URL,
        path: '/p/laptop',
        params: { utm_source: 'google', page: '1' },
      });
      expect(result).toBe('https://nearbybazaar.com/p/laptop?page=1');
    });

    it('should handle array parameters', () => {
      const result = generateCanonicalUrl({
        baseUrl: BASE_URL,
        path: '/search',
        params: { tag: ['electronics', 'laptops'] },
      });
      expect(result).toContain('tag=electronics');
      expect(result).toContain('tag=laptops');
    });

    it('should skip undefined and null parameters', () => {
      const result = generateCanonicalUrl({
        baseUrl: BASE_URL,
        path: '/page',
        params: { a: 'value', b: undefined, c: '', d: '' },
      });
      expect(result).toBe('https://nearbybazaar.com/page?a=value');
    });

    it('should force HTTPS by default', () => {
      const result = generateCanonicalUrl({
        baseUrl: 'http://example.com',
        path: '/page',
      });
      expect(result).toMatch(/^https:\/\//);
    });

    it('should lowercase path by default', () => {
      const result = generateCanonicalUrl({
        baseUrl: BASE_URL,
        path: '/Page/Section',
      });
      expect(result).toBe('https://nearbybazaar.com/page/section');
    });
  });

  describe('getProductCanonical', () => {
    it('should generate product canonical URL', () => {
      const result = getProductCanonical(BASE_URL, 'laptop-stand');
      expect(result).toBe('https://nearbybazaar.com/p/laptop-stand');
    });

    it('should include variant parameter if provided', () => {
      const result = getProductCanonical(BASE_URL, 'laptop-stand', { variant: 'black' });
      expect(result).toBe('https://nearbybazaar.com/p/laptop-stand?variant=black');
    });

    it('should not include variant if not provided', () => {
      const result = getProductCanonical(BASE_URL, 'laptop-stand', {});
      expect(result).toBe('https://nearbybazaar.com/p/laptop-stand');
    });
  });

  describe('getServiceCanonical', () => {
    it('should generate service canonical URL', () => {
      const result = getServiceCanonical(BASE_URL, 'home-cleaning');
      expect(result).toBe('https://nearbybazaar.com/s/home-cleaning');
    });
  });

  describe('getStoreCanonical', () => {
    it('should generate store canonical URL', () => {
      const result = getStoreCanonical(BASE_URL, 'johns-electronics');
      expect(result).toBe('https://nearbybazaar.com/store/johns-electronics');
    });

    it('should include tab parameter if provided', () => {
      const result = getStoreCanonical(BASE_URL, 'johns-electronics', { tab: 'services' });
      expect(result).toBe('https://nearbybazaar.com/store/johns-electronics?tab=services');
    });

    it('should not include tab if not provided', () => {
      const result = getStoreCanonical(BASE_URL, 'johns-electronics', {});
      expect(result).toBe('https://nearbybazaar.com/store/johns-electronics');
    });
  });

  describe('getClassifiedCanonical', () => {
    it('should generate classified canonical URL', () => {
      const result = getClassifiedCanonical(BASE_URL, 'used-bike');
      expect(result).toBe('https://nearbybazaar.com/c/used-bike');
    });
  });

  describe('getCategoryCanonical', () => {
    it('should generate category canonical URL', () => {
      const result = getCategoryCanonical(BASE_URL, 'electronics');
      expect(result).toBe('https://nearbybazaar.com/category/electronics');
    });

    it('should include page parameter if not first page', () => {
      const result = getCategoryCanonical(BASE_URL, 'electronics', { page: 2 });
      expect(result).toBe('https://nearbybazaar.com/category/electronics?page=2');
    });

    it('should not include page 1', () => {
      const result = getCategoryCanonical(BASE_URL, 'electronics', { page: 1 });
      expect(result).toBe('https://nearbybazaar.com/category/electronics');
    });

    it('should include sort parameter if not default', () => {
      const result = getCategoryCanonical(BASE_URL, 'electronics', { sort: 'price-asc' });
      expect(result).toBe('https://nearbybazaar.com/category/electronics?sort=price-asc');
    });

    it('should not include default sort', () => {
      const result = getCategoryCanonical(BASE_URL, 'electronics', { sort: 'default' });
      expect(result).toBe('https://nearbybazaar.com/category/electronics');
    });

    it('should include both page and sort', () => {
      const result = getCategoryCanonical(BASE_URL, 'electronics', { page: 2, sort: 'price-asc' });
      expect(result).toBe('https://nearbybazaar.com/category/electronics?page=2&sort=price-asc');
    });
  });

  describe('getSearchCanonical', () => {
    it('should generate search canonical URL', () => {
      const result = getSearchCanonical(BASE_URL);
      expect(result).toBe('https://nearbybazaar.com/search');
    });

    it('should include query parameter', () => {
      const result = getSearchCanonical(BASE_URL, { q: 'laptop' });
      expect(result).toBe('https://nearbybazaar.com/search?q=laptop');
    });

    it('should include page parameter if not first page', () => {
      const result = getSearchCanonical(BASE_URL, { q: 'laptop', page: 2 });
      expect(result).toBe('https://nearbybazaar.com/search?page=2&q=laptop');
    });

    it('should include type parameter if not "all"', () => {
      const result = getSearchCanonical(BASE_URL, { q: 'laptop', type: 'products' });
      expect(result).toBe('https://nearbybazaar.com/search?q=laptop&type=products');
    });

    it('should not include type if "all"', () => {
      const result = getSearchCanonical(BASE_URL, { q: 'laptop', type: 'all' });
      expect(result).toBe('https://nearbybazaar.com/search?q=laptop');
    });

    it('should handle all parameters', () => {
      const result = getSearchCanonical(BASE_URL, { q: 'laptop', page: 2, type: 'products' });
      expect(result).toBe('https://nearbybazaar.com/search?page=2&q=laptop&type=products');
    });
  });

  describe('areCanonicalDuplicates', () => {
    it('should return true for URLs with different tracking params', () => {
      const url1 = 'https://example.com/page?utm_source=google';
      const url2 = 'https://example.com/page?utm_source=facebook';
      expect(areCanonicalDuplicates(url1, url2)).toBe(true);
    });

    it('should return true for same URL with and without tracking', () => {
      const url1 = 'https://example.com/page';
      const url2 = 'https://example.com/page?utm_source=google';
      expect(areCanonicalDuplicates(url1, url2)).toBe(true);
    });

    it('should return false for different paths', () => {
      const url1 = 'https://example.com/page1';
      const url2 = 'https://example.com/page2';
      expect(areCanonicalDuplicates(url1, url2)).toBe(false);
    });

    it('should return false for different functional params', () => {
      const url1 = 'https://example.com/page?page=1';
      const url2 = 'https://example.com/page?page=2';
      expect(areCanonicalDuplicates(url1, url2)).toBe(false);
    });

    it('should handle case differences', () => {
      const url1 = 'https://example.com/Page';
      const url2 = 'https://example.com/page';
      expect(areCanonicalDuplicates(url1, url2)).toBe(true);
    });

    it('should handle protocol differences', () => {
      const url1 = 'http://example.com/page';
      const url2 = 'https://example.com/page';
      expect(areCanonicalDuplicates(url1, url2)).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      const url1 = 'not-a-url';
      const url2 = 'https://example.com/page';
      expect(areCanonicalDuplicates(url1, url2)).toBe(false);
    });
  });

  describe('getCanonicalPath', () => {
    it('should extract path from full URL', () => {
      const url = 'https://example.com/page/section?query=test';
      const result = getCanonicalPath(url);
      expect(result).toBe('/page/section?query=test');
    });

    it('should handle path-only input', () => {
      const path = '/page/section';
      const result = getCanonicalPath(path);
      expect(result).toBe('/page/section');
    });

    it('should normalize path', () => {
      const url = 'https://example.com/Page/Section';
      const result = getCanonicalPath(url);
      expect(result).toBe('/page/section');
    });

    it('should strip tracking params from path', () => {
      const url = 'https://example.com/page?utm_source=test&page=2';
      const result = getCanonicalPath(url);
      expect(result).toBe('/page?page=2');
    });

    it('should add leading slash if missing', () => {
      const path = 'page/section';
      const result = getCanonicalPath(path);
      expect(result).toBe('/page/section');
    });
  });

  describe('Edge cases and real-world scenarios', () => {
    it('should handle product URLs from different referrers with same canonical', () => {
      const fromGoogle = 'https://nearbybazaar.com/p/laptop?utm_source=google&utm_campaign=summer';
      const fromFacebook = 'https://nearbybazaar.com/p/laptop?fbclid=abc123';
      const fromEmail = 'https://nearbybazaar.com/p/laptop?utm_source=email&mc_cid=xyz';

      const canonical1 = stripTrackingParams(fromGoogle);
      const canonical2 = stripTrackingParams(fromFacebook);
      const canonical3 = stripTrackingParams(fromEmail);

      expect(canonical1).toBe('https://nearbybazaar.com/p/laptop');
      expect(canonical2).toBe('https://nearbybazaar.com/p/laptop');
      expect(canonical3).toBe('https://nearbybazaar.com/p/laptop');
    });

    it('should preserve important pagination while removing tracking', () => {
      const url = 'https://nearbybazaar.com/category/electronics?page=3&utm_source=google';
      const result = stripTrackingParams(url);
      expect(result).toBe('https://nearbybazaar.com/category/electronics?page=3');
    });

    it('should handle complex multi-parameter scenarios', () => {
      const url =
        'https://nearbybazaar.com/search?q=laptop&page=2&sort=price&utm_source=google&gclid=abc&fbclid=xyz';
      const result = stripTrackingParams(url);
      expect(result).toBe('https://nearbybazaar.com/search?q=laptop&page=2&sort=price');
    });
  });
});
