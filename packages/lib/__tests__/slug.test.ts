import { generateSlug, dedupeSlug, updateSlugHistory } from '../src/slug';

describe('generateSlug', () => {
    it('should slugify a string', () => {
        expect(generateSlug('Hello World!')).toBe('hello-world');
    });

    it('should transliterate unicode', () => {
        expect(generateSlug('Café')).toBe('cafe');
        expect(generateSlug('Über')).toBe('uber');
    });

    it('should handle locale edge cases (drop non-latin by default)', () => {
        // Current implementation removes non-latin characters without transliteration
        expect(generateSlug('Привет мир')).toBe('');
        expect(generateSlug('你好世界')).toBe('');
    });
});

describe('dedupeSlug', () => {
    it('should deduplicate slugs', () => {
        const existing = new Set(['foo', 'foo-2', 'foo-3']);
        expect(dedupeSlug('foo', existing)).toBe('foo-4');
    });
    it('should return base if not present', () => {
        const existing = new Set(['bar']);
        expect(dedupeSlug('baz', existing)).toBe('baz');
    });
});

describe('updateSlugHistory', () => {
    it('should add old slug to history', () => {
        const { slug, slugHistory } = updateSlugHistory('old-slug', ['older-slug'], 'new-slug');
        expect(slug).toBe('new-slug');
        expect(slugHistory).toEqual(['older-slug', 'old-slug']);
    });
    it('should not add if unchanged', () => {
        const { slug, slugHistory } = updateSlugHistory('same', ['a'], 'same');
        expect(slug).toBe('same');
        expect(slugHistory).toEqual(['a']);
    });
});
