import { getMetaTitle, getMetaDescription, clamp, sanitizeMeta, getCanonicalUrl } from '../src/seo';

describe('SEO helpers', () => {
    it('should format meta title', () => {
        expect(getMetaTitle('Product')).toMatch(/^Product \| NearbyBazaar/);
    });
    it('should trim meta description', () => {
        expect(getMetaDescription('a'.repeat(200))).toHaveLength(160);
    });
    it('should clamp long strings', () => {
        expect(clamp('x'.repeat(100), 10)).toBe('xxxxxxx...');
    });
    it('should sanitize meta strings', () => {
        expect(sanitizeMeta('bad <meta> \u0000\u001F')).toBe('bad meta');
    });
    it('should handle empty/undefined', () => {
        expect(clamp('', 10)).toBe('');
        expect(sanitizeMeta(undefined as any)).toBe('');
    });
    it('should generate canonical URLs', () => {
        expect(getCanonicalUrl('https://site.com', '/foo')).toBe('https://site.com/foo');
        expect(getCanonicalUrl('https://site.com/', '/foo')).toBe('https://site.com/foo');
    });
});
