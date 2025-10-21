/**
 * JSON-LD Schema.org Structured Data Utilities
 * 
 * Generate valid JSON-LD for rich search results in Google, Bing, and other search engines.
 * Supports: Product, Service, LocalBusiness, Organization schemas.
 */

export interface ProductSchemaInput {
  name: string;
  description?: string;
  image?: string | string[];
  brand?: string;
  sku?: string;
  price: number;
  priceCurrency?: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder' | 'Discontinued';
  url?: string;
  seller?: {
    name: string;
    url?: string;
  };
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
}

export interface ServiceSchemaInput {
  name: string;
  description?: string;
  provider: {
    name: string;
    url?: string;
  };
  areaServed?: string;
  offers?: {
    price: number;
    priceCurrency?: string;
  };
  image?: string | string[];
  url?: string;
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
}

export interface LocalBusinessSchemaInput {
  name: string;
  description?: string;
  image?: string | string[];
  url?: string;
  telephone?: string;
  email?: string;
  address?: {
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
  geo?: {
    latitude: number;
    longitude: number;
  };
  priceRange?: string; // e.g., "₹₹"
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
  openingHours?: string[]; // e.g., ["Mo-Fr 09:00-18:00"]
}

export interface OrganizationSchemaInput {
  name: string;
  description?: string;
  url?: string;
  logo?: string;
  email?: string;
  telephone?: string;
  address?: {
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
  sameAs?: string[]; // social media URLs
}

/**
 * Generate Product schema for e-commerce items
 */
export function generateProductSchema(input: ProductSchemaInput): Record<string, any> {
  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.name,
  };

  if (input.description) schema.description = input.description;
  if (input.image) {
    schema.image = Array.isArray(input.image) ? input.image : [input.image];
  }
  if (input.brand) schema.brand = { '@type': 'Brand', name: input.brand };
  if (input.sku) schema.sku = input.sku;
  if (input.url) schema.url = input.url;

  // Offers (price and availability)
  schema.offers = {
    '@type': 'Offer',
    price: input.price.toFixed(2),
    priceCurrency: input.priceCurrency || 'INR',
    availability: `https://schema.org/${input.availability || 'InStock'}`,
  };

  if (input.url) schema.offers.url = input.url;

  if (input.seller) {
    schema.offers.seller = {
      '@type': 'Organization',
      name: input.seller.name,
    };
    if (input.seller.url) schema.offers.seller.url = input.seller.url;
  }

  // Aggregate rating (if available)
  if (input.aggregateRating && input.aggregateRating.reviewCount > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: input.aggregateRating.ratingValue.toFixed(1),
      reviewCount: input.aggregateRating.reviewCount,
      bestRating: '5',
      worstRating: '1',
    };
  }

  return schema;
}

/**
 * Generate Service schema for service offerings
 */
export function generateServiceSchema(input: ServiceSchemaInput): Record<string, any> {
  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: input.name,
    provider: {
      '@type': 'Organization',
      name: input.provider.name,
    },
  };

  if (input.description) schema.description = input.description;
  if (input.provider.url) schema.provider.url = input.provider.url;
  if (input.areaServed) schema.areaServed = input.areaServed;
  if (input.url) schema.url = input.url;

  if (input.image) {
    schema.image = Array.isArray(input.image) ? input.image : [input.image];
  }

  // Service offers (pricing)
  if (input.offers) {
    schema.offers = {
      '@type': 'Offer',
      price: input.offers.price.toFixed(2),
      priceCurrency: input.offers.priceCurrency || 'INR',
    };
  }

  // Aggregate rating
  if (input.aggregateRating && input.aggregateRating.reviewCount > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: input.aggregateRating.ratingValue.toFixed(1),
      reviewCount: input.aggregateRating.reviewCount,
      bestRating: '5',
      worstRating: '1',
    };
  }

  return schema;
}

/**
 * Generate LocalBusiness schema for store pages
 */
export function generateLocalBusinessSchema(input: LocalBusinessSchemaInput): Record<string, any> {
  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: input.name,
  };

  if (input.description) schema.description = input.description;
  if (input.url) schema.url = input.url;

  if (input.image) {
    schema.image = Array.isArray(input.image) ? input.image : [input.image];
  }

  if (input.telephone) schema.telephone = input.telephone;
  if (input.email) schema.email = input.email;
  if (input.priceRange) schema.priceRange = input.priceRange;

  // Address
  if (input.address) {
    schema.address = {
      '@type': 'PostalAddress',
    };
    if (input.address.streetAddress) schema.address.streetAddress = input.address.streetAddress;
    if (input.address.addressLocality) schema.address.addressLocality = input.address.addressLocality;
    if (input.address.addressRegion) schema.address.addressRegion = input.address.addressRegion;
    if (input.address.postalCode) schema.address.postalCode = input.address.postalCode;
    if (input.address.addressCountry) schema.address.addressCountry = input.address.addressCountry;
  }

  // Geo coordinates
  if (input.geo) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: input.geo.latitude,
      longitude: input.geo.longitude,
    };
  }

  // Opening hours
  if (input.openingHours && input.openingHours.length > 0) {
    schema.openingHoursSpecification = input.openingHours.map(hours => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: hours.split(' ')[0], // e.g., "Mo-Fr"
      opens: hours.split(' ')[1]?.split('-')[0], // e.g., "09:00"
      closes: hours.split(' ')[1]?.split('-')[1], // e.g., "18:00"
    }));
  }

  // Aggregate rating
  if (input.aggregateRating && input.aggregateRating.reviewCount > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: input.aggregateRating.ratingValue.toFixed(1),
      reviewCount: input.aggregateRating.reviewCount,
      bestRating: '5',
      worstRating: '1',
    };
  }

  return schema;
}

/**
 * Generate Organization schema (more generic than LocalBusiness)
 */
export function generateOrganizationSchema(input: OrganizationSchemaInput): Record<string, any> {
  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: input.name,
  };

  if (input.description) schema.description = input.description;
  if (input.url) schema.url = input.url;
  if (input.logo) schema.logo = input.logo;
  if (input.email) schema.email = input.email;
  if (input.telephone) schema.telephone = input.telephone;

  // Address
  if (input.address) {
    schema.address = {
      '@type': 'PostalAddress',
    };
    if (input.address.streetAddress) schema.address.streetAddress = input.address.streetAddress;
    if (input.address.addressLocality) schema.address.addressLocality = input.address.addressLocality;
    if (input.address.addressRegion) schema.address.addressRegion = input.address.addressRegion;
    if (input.address.postalCode) schema.address.postalCode = input.address.postalCode;
    if (input.address.addressCountry) schema.address.addressCountry = input.address.addressCountry;
  }

  // Social media links
  if (input.sameAs && input.sameAs.length > 0) {
    schema.sameAs = input.sameAs;
  }

  return schema;
}

/**
 * Convert JSON-LD object to HTML script tag string
 */
export function jsonLdToScriptTag(jsonLd: Record<string, any>): string {
  return `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;
}

/**
 * Validate that required fields are present for Product schema
 */
export function validateProductSchema(input: Partial<ProductSchemaInput>): string[] {
  const errors: string[] = [];
  if (!input.name) errors.push('Product name is required');
  if (input.price === undefined || input.price === null) errors.push('Product price is required');
  return errors;
}

/**
 * Validate that required fields are present for Service schema
 */
export function validateServiceSchema(input: Partial<ServiceSchemaInput>): string[] {
  const errors: string[] = [];
  if (!input.name) errors.push('Service name is required');
  if (!input.provider || !input.provider.name) errors.push('Service provider name is required');
  return errors;
}

/**
 * Validate that required fields are present for LocalBusiness schema
 */
export function validateLocalBusinessSchema(input: Partial<LocalBusinessSchemaInput>): string[] {
  const errors: string[] = [];
  if (!input.name) errors.push('Business name is required');
  return errors;
}
