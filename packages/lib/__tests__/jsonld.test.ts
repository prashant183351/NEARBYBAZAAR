/**
 * Tests for JSON-LD schema generation
 * Feature #155: JSON-LD Schema
 */

import {
  generateProductSchema,
  generateServiceSchema,
  generateLocalBusinessSchema,
  generateOrganizationSchema,
  validateProductSchema,
  validateServiceSchema,
  validateLocalBusinessSchema,
  jsonLdToScriptTag,
} from '../src/jsonld';

describe('JSON-LD Schema Generation', () => {
  describe('Validation error branches', () => {
    it('validateProductSchema returns errors for missing fields', () => {
      expect(validateProductSchema({})).toEqual([
        'Product name is required',
        'Product price is required',
      ]);
      expect(validateProductSchema({ name: 'X' })).toEqual(['Product price is required']);
      expect(validateProductSchema({ price: 1 })).toEqual(['Product name is required']);
    });
    it('validateServiceSchema returns errors for missing fields', () => {
      expect(validateServiceSchema({})).toEqual([
        'Service name is required',
        'Service provider name is required',
      ]);
      expect(validateServiceSchema({ name: 'X' })).toEqual(['Service provider name is required']);
      expect(validateServiceSchema({ provider: { name: 'Y' } })).toEqual([
        'Service name is required',
      ]);
    });
    it('validateLocalBusinessSchema returns errors for missing fields', () => {
      expect(validateLocalBusinessSchema({})).toEqual(['Business name is required']);
    });
  });

  describe('Edge cases for optional/empty fields', () => {
    it('generateProductSchema omits aggregateRating if reviewCount is 0', () => {
      const schema = generateProductSchema({
        name: 'P',
        price: 1,
        aggregateRating: { ratingValue: 4.5, reviewCount: 0 },
      });
      expect(schema.aggregateRating).toBeUndefined();
    });
    it('generateServiceSchema omits aggregateRating if reviewCount is 0', () => {
      const schema = generateServiceSchema({
        name: 'S',
        provider: { name: 'P' },
        aggregateRating: { ratingValue: 4.5, reviewCount: 0 },
      });
      expect(schema.aggregateRating).toBeUndefined();
    });
    it('generateLocalBusinessSchema omits aggregateRating if reviewCount is 0', () => {
      const schema = generateLocalBusinessSchema({
        name: 'B',
        aggregateRating: { ratingValue: 4.5, reviewCount: 0 },
      });
      expect(schema.aggregateRating).toBeUndefined();
    });
    it('generateOrganizationSchema includes sameAs if present and non-empty', () => {
      const schema = generateOrganizationSchema({
        name: 'Org',
        sameAs: ['https://twitter.com/org'],
      });
      expect(schema.sameAs).toEqual(['https://twitter.com/org']);
    });
    it('generateOrganizationSchema omits sameAs if empty', () => {
      const schema = generateOrganizationSchema({ name: 'Org', sameAs: [] });
      expect(schema.sameAs).toBeUndefined();
    });
    it('generateLocalBusinessSchema omits openingHoursSpecification if openingHours is empty', () => {
      const schema = generateLocalBusinessSchema({ name: 'B', openingHours: [] });
      expect(schema.openingHoursSpecification).toBeUndefined();
    });
  });
  describe('generateProductSchema', () => {
    it('should generate Product schema with required fields', () => {
      const schema = generateProductSchema({
        name: 'Test Product',
        price: 999,
        priceCurrency: 'INR',
      });

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('Product');
      expect(schema.name).toBe('Test Product');
      expect(schema.offers).toBeDefined();
      expect(schema.offers['@type']).toBe('Offer');
      expect(schema.offers.priceCurrency).toBe('INR');
    });

    it('should include optional fields when provided', () => {
      const schema = generateProductSchema({
        name: 'Full Product',
        description: 'A complete product',
        sku: 'TEST-001',
        brand: 'TestBrand',
        price: 1500,
        priceCurrency: 'INR',
        availability: 'InStock',
        url: 'https://example.com/product',
        image: 'https://example.com/image.jpg',
      });

      expect(schema.description).toBe('A complete product');
      expect(schema.sku).toBe('TEST-001');
      expect(schema.brand).toBeDefined();
      expect(schema.brand.name).toBe('TestBrand');
      expect(schema.url).toBe('https://example.com/product');
      expect(Array.isArray(schema.image)).toBe(true);
      expect(schema.image[0]).toBe('https://example.com/image.jpg');
      expect(schema.offers.availability).toContain('InStock');
    });

    it('should handle seller information', () => {
      const schema = generateProductSchema({
        name: 'Product with Seller',
        price: 1000,
        seller: {
          name: 'Test Vendor',
          url: 'https://example.com/vendor',
        },
      });

      expect(schema.offers.seller).toBeDefined();
      expect(schema.offers.seller.name).toBe('Test Vendor');
    });

    it('should include aggregateRating', () => {
      const schema = generateProductSchema({
        name: 'Rated Product',
        price: 500,
        aggregateRating: {
          ratingValue: 4.5,
          reviewCount: 100,
        },
      });

      expect(schema.aggregateRating).toBeDefined();
      expect(schema.aggregateRating.reviewCount).toBe(100);
    });
  });

  describe('generateServiceSchema', () => {
    it('should generate Service schema with required fields', () => {
      const schema = generateServiceSchema({
        name: 'Test Service',
        provider: {
          name: 'Test Provider',
        },
      });

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('Service');
      expect(schema.name).toBe('Test Service');
      expect(schema.provider).toBeDefined();
      expect(schema.provider.name).toBe('Test Provider');
    });

    it('should include offers when provided', () => {
      const schema = generateServiceSchema({
        name: 'Paid Service',
        provider: { name: 'Provider' },
        offers: {
          price: 1500,
          priceCurrency: 'INR',
        },
      });

      expect(schema.offers).toBeDefined();
      expect(schema.offers.priceCurrency).toBe('INR');
    });

    it('should include areaServed', () => {
      const schema = generateServiceSchema({
        name: 'Local Service',
        provider: { name: 'Provider' },
        areaServed: 'Mumbai',
      });

      expect(schema.areaServed).toBe('Mumbai');
    });
  });

  describe('generateLocalBusinessSchema', () => {
    it('should generate LocalBusiness schema', () => {
      const schema = generateLocalBusinessSchema({
        name: 'Test Business',
      });

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('LocalBusiness');
      expect(schema.name).toBe('Test Business');
    });

    it('should include address', () => {
      const schema = generateLocalBusinessSchema({
        name: 'Business',
        address: {
          addressLocality: 'Mumbai',
          addressCountry: 'IN',
        },
      });

      expect(schema.address).toBeDefined();
      expect(schema.address.addressLocality).toBe('Mumbai');
    });

    it('should include geo coordinates', () => {
      const schema = generateLocalBusinessSchema({
        name: 'Business',
        geo: {
          latitude: 19.076,
          longitude: 72.8777,
        },
      });

      expect(schema.geo).toBeDefined();
      expect(schema.geo.latitude).toBe(19.076);
    });

    it('should include priceRange', () => {
      const schema = generateLocalBusinessSchema({
        name: 'Business',
        priceRange: '₹₹',
      });

      expect(schema.priceRange).toBe('₹₹');
    });
  });

  describe('generateOrganizationSchema', () => {
    it('should generate Organization schema', () => {
      const schema = generateOrganizationSchema({
        name: 'Test Org',
      });

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('Organization');
      expect(schema.name).toBe('Test Org');
    });

    it('should include social media links', () => {
      const schema = generateOrganizationSchema({
        name: 'Social Org',
        sameAs: ['https://facebook.com/test', 'https://twitter.com/test'],
      });

      expect(schema.sameAs).toBeDefined();
      expect(schema.sameAs).toHaveLength(2);
    });
  });

  describe('Validation Functions', () => {
    it('validateProductSchema - valid input', () => {
      const errors = validateProductSchema({
        name: 'Product',
        price: 100,
      });

      expect(errors).toHaveLength(0);
    });

    it('validateProductSchema - missing required fields', () => {
      const errors = validateProductSchema({
        name: 'Product',
      } as any);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('validateServiceSchema - valid input', () => {
      const errors = validateServiceSchema({
        name: 'Service',
        provider: { name: 'Provider' },
      });

      expect(errors).toHaveLength(0);
    });

    it('validateServiceSchema - missing provider', () => {
      const errors = validateServiceSchema({
        name: 'Service',
      } as any);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('validateLocalBusinessSchema - valid input', () => {
      const errors = validateLocalBusinessSchema({
        name: 'Business',
      });

      expect(errors).toHaveLength(0);
    });

    it('validateLocalBusinessSchema - missing name', () => {
      const errors = validateLocalBusinessSchema({} as any);

      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('jsonLdToScriptTag', () => {
    it('should convert to HTML script tag', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'Test',
      };

      const tag = jsonLdToScriptTag(schema);

      expect(tag).toContain('<script type="application/ld+json">');
      expect(tag).toContain('</script>');
      expect(tag).toContain('"@type":"Product"');
    });
  });
});
