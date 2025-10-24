import { sanitizeString } from '../src/utils/sanitize';

describe('sanitizeString', () => {
  it('removes all HTML tags by default', () => {
    expect(sanitizeString('<script>alert(1)</script><b>bold</b>')).toBe('bold');
  });

  it('allows safe rich text tags with richText options', () => {
    const input = '<b>bold</b><i>italic</i><a href="http://x.com" target="_blank">link</a>';
    const options = {
      allowedTags: ['b', 'i', 'a'],
      allowedAttributes: { a: ['href', 'target', 'rel'] },
      transformTags: {
        a: (_tagName: string, attribs: Record<string, any>) => ({
          tagName: 'a',
          attribs: { ...attribs, rel: 'noopener noreferrer' },
        }),
      },
      disallowedTagsMode: 'discard',
    };
    expect(sanitizeString(input, options as any)).toContain('<b>bold</b>');
    expect(sanitizeString(input, options as any)).toContain(
      '<a href="http://x.com" target="_blank" rel="noopener noreferrer">link</a>',
    );
  });

  it('removes disallowed attributes', () => {
    const input = '<a href="http://x.com" onclick="evil()">link</a>';
    expect(sanitizeString(input)).toBe('link');
  });
});
