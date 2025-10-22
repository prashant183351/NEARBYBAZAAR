import { GetServerSideProps } from 'next';
import { SeoHead } from '../../components/SeoHead';
import { StoreHeader } from '../../components/StoreHeader';
import { ItemGrid } from '../../components/ItemGrid';
import { getStoreCanonical } from '@nearbybazaar/lib/canonical';
import { generateLocalBusinessSchema } from '@nearbybazaar/lib/jsonld';

interface Vendor {
  _id: string;
  name: string;
  email: string;
  slug: string;
  logoUrl?: string;
  planTier?: string;
  description?: string;
}

interface Item {
  _id: string;
  name: string;
  slug: string;
  price?: number;
  currency?: string;
  description?: string;
  media?: string[];
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface StorePageProps {
  vendor: Vendor;
  products: Item[];
  services: Item[];
  classifieds: Item[];
  productsMeta: PaginationMeta;
  servicesMeta: PaginationMeta;
  classifiedsMeta: PaginationMeta;
  currentTab: 'products' | 'services' | 'classifieds';
  currentPage: number;
}

export default function StorePage({
  vendor,
  products,
  services,
  classifieds,
  productsMeta,
  servicesMeta,
  classifiedsMeta,
  currentTab,
  currentPage,
}: StorePageProps) {
  // Internationalize title/description (add city/category if available)
  // For demo, assume vendor.city and vendor.category may exist
  const city = (vendor as any).city;
  const category = (vendor as any).category;
  let intlTitle = vendor.name;
  if (category && city) {
    intlTitle = `${vendor.name} | ${category} in ${city}`;
  } else if (category) {
    intlTitle = `${vendor.name} | ${category}`;
  } else if (city) {
    intlTitle = `${vendor.name} | ${city}`;
  }
  const description =
    vendor.description ||
    `Shop products, services, and classifieds from ${vendor.name}${city ? ' in ' + city : ''}${category ? ' (' + category + ')' : ''}`;
  const imageUrl = vendor.logoUrl || '/og-default.png';

  // Generate canonical URL (with tab parameter if not 'products')
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://nearbybazaar.com';
  const canonicalUrl = getStoreCanonical(
    baseUrl,
    vendor.slug,
    currentTab !== 'products' ? { tab: currentTab } : undefined,
  );

  // Generate LocalBusiness JSON-LD schema
  const businessSchema = generateLocalBusinessSchema({
    name: vendor.name,
    description: vendor.description,
    url: `${baseUrl}/store/${vendor.slug}`,
    telephone: (vendor as any).phone,
    email: vendor.email,
    image: vendor.logoUrl,
    address: city
      ? {
          streetAddress: (vendor as any).address || '',
          addressLocality: city,
          addressRegion: (vendor as any).state || '',
          postalCode: (vendor as any).postalCode || '',
          addressCountry: 'IN',
        }
      : undefined,
    geo:
      (vendor as any).latitude && (vendor as any).longitude
        ? {
            latitude: (vendor as any).latitude,
            longitude: (vendor as any).longitude,
          }
        : undefined,
    priceRange: category ? '₹₹' : undefined,
    aggregateRating: (vendor as any).averageRating
      ? {
          ratingValue: (vendor as any).averageRating,
          reviewCount: (vendor as any).reviewCount || 0,
        }
      : undefined,
    openingHours: (vendor as any).openingHours || undefined,
  });

  // Determine active items and meta
  let activeItems: Item[] = [];
  let activeMeta: PaginationMeta = productsMeta;
  if (currentTab === 'products') {
    activeItems = products;
    activeMeta = productsMeta;
  } else if (currentTab === 'services') {
    activeItems = services;
    activeMeta = servicesMeta;
  } else {
    activeItems = classifieds;
    activeMeta = classifiedsMeta;
  }

  return (
    <>
      <SeoHead
        title={intlTitle}
        description={description}
        image={imageUrl}
        url={`https://nearbybazaar.com/store/${vendor.slug}`}
        canonicalUrl={canonicalUrl}
        jsonLd={businessSchema}
      />
      <main style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>
        <StoreHeader
          name={vendor.name}
          description={description}
          planTier={vendor.planTier}
          logoUrl={vendor.logoUrl}
        />

        {/* Tab navigation */}
        <nav style={{ marginBottom: 32, borderBottom: '1px solid #ddd' }}>
          <a
            href={`/store/${vendor.slug}?tab=products`}
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              fontWeight: currentTab === 'products' ? 'bold' : 'normal',
              borderBottom: currentTab === 'products' ? '3px solid #000' : 'none',
              textDecoration: 'none',
              color: '#000',
            }}
          >
            Products ({productsMeta.total})
          </a>
          <a
            href={`/store/${vendor.slug}?tab=services`}
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              fontWeight: currentTab === 'services' ? 'bold' : 'normal',
              borderBottom: currentTab === 'services' ? '3px solid #000' : 'none',
              textDecoration: 'none',
              color: '#000',
            }}
          >
            Services ({servicesMeta.total})
          </a>
          <a
            href={`/store/${vendor.slug}?tab=classifieds`}
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              fontWeight: currentTab === 'classifieds' ? 'bold' : 'normal',
              borderBottom: currentTab === 'classifieds' ? '3px solid #000' : 'none',
              textDecoration: 'none',
              color: '#000',
            }}
          >
            Classifieds ({classifiedsMeta.total})
          </a>
        </nav>

        {/* Active tab content */}
        <section>
          {activeItems.length === 0 ? (
            <p style={{ color: '#999', textAlign: 'center', padding: 40 }}>
              No {currentTab} available at this time.
            </p>
          ) : (
            <>
              <ItemGrid items={activeItems} type={currentTab} />
              {/* Pagination controls */}
              {activeMeta.totalPages > 1 && (
                <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center', gap: 8 }}>
                  {currentPage > 1 && (
                    <a
                      href={`/store/${vendor.slug}?tab=${currentTab}&page=${currentPage - 1}`}
                      style={{
                        padding: '8px 16px',
                        border: '1px solid #ddd',
                        borderRadius: 4,
                        textDecoration: 'none',
                        color: '#000',
                      }}
                    >
                      Previous
                    </a>
                  )}
                  <span style={{ padding: '8px 16px' }}>
                    Page {currentPage} of {activeMeta.totalPages}
                  </span>
                  {currentPage < activeMeta.totalPages && (
                    <a
                      href={`/store/${vendor.slug}?tab=${currentTab}&page=${currentPage + 1}`}
                      style={{
                        padding: '8px 16px',
                        border: '1px solid #ddd',
                        borderRadius: 4,
                        textDecoration: 'none',
                        color: '#000',
                      }}
                    >
                      Next
                    </a>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.params as { slug: string };
  const { tab = 'products', page = '1' } = context.query;
  const currentTab = ['products', 'services', 'classifieds'].includes(tab as string)
    ? (tab as 'products' | 'services' | 'classifieds')
    : 'products';
  const currentPage = Math.max(1, parseInt(page as string, 10) || 1);
  const limit = 12;

  // Fetch vendor by slug from API
  const API_BASE = process.env.API_URL || 'http://localhost:4000';

  try {
    // Fetch vendor
    const vendorRes = await fetch(`${API_BASE}/v1/vendors/slug/${slug}`);
    if (!vendorRes.ok) {
      return { notFound: true };
    }
    const vendor: Vendor = await vendorRes.json();

    // Fetch products, services, classifieds with pagination
    const [productsRes, servicesRes, classifiedsRes] = await Promise.all([
      fetch(
        `${API_BASE}/v1/products?vendor=${vendor._id}&page=${currentTab === 'products' ? currentPage : 1}&limit=${limit}`,
      ),
      fetch(
        `${API_BASE}/v1/services?vendor=${vendor._id}&page=${currentTab === 'services' ? currentPage : 1}&limit=${limit}`,
      ),
      fetch(
        `${API_BASE}/v1/classifieds?vendor=${vendor._id}&page=${currentTab === 'classifieds' ? currentPage : 1}&limit=${limit}`,
      ),
    ]);

    const productsData = await productsRes.json();
    const servicesData = await servicesRes.json();
    const classifiedsData = await classifiedsRes.json();

    return {
      props: {
        vendor,
        products: productsData.items || [],
        services: servicesData.items || [],
        classifieds: classifiedsData.items || [],
        productsMeta: productsData.meta || { total: 0, page: 1, limit, totalPages: 0 },
        servicesMeta: servicesData.meta || { total: 0, page: 1, limit, totalPages: 0 },
        classifiedsMeta: classifiedsData.meta || { total: 0, page: 1, limit, totalPages: 0 },
        currentTab,
        currentPage,
      },
    };
  } catch (error) {
    console.error('Error fetching store data:', error);
    // Fallback to sample data for development
    const vendor: Vendor = {
      _id: 'sample-id',
      name: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      email: 'vendor@example.com',
      slug,
      planTier: 'Free',
      description: `Welcome to our store!`,
    };

    const sampleProducts: Item[] = Array.from({ length: 5 }, (_, i) => ({
      _id: `prod-${i}`,
      name: `Product ${i + 1}`,
      slug: `product-${i + 1}`,
      price: (i + 1) * 100,
      currency: 'INR',
      description: `Sample product ${i + 1}`,
    }));

    const sampleServices: Item[] = Array.from({ length: 3 }, (_, i) => ({
      _id: `svc-${i}`,
      name: `Service ${i + 1}`,
      slug: `service-${i + 1}`,
      price: (i + 1) * 500,
      currency: 'INR',
      description: `Sample service ${i + 1}`,
    }));

    const sampleClassifieds: Item[] = Array.from({ length: 2 }, (_, i) => ({
      _id: `class-${i}`,
      name: `Classified ${i + 1}`,
      slug: `classified-${i + 1}`,
      price: (i + 1) * 1000,
      currency: 'INR',
      description: `Sample classified ${i + 1}`,
    }));

    return {
      props: {
        vendor,
        products: sampleProducts,
        services: sampleServices,
        classifieds: sampleClassifieds,
        productsMeta: { total: 5, page: 1, limit, totalPages: 1 },
        servicesMeta: { total: 3, page: 1, limit, totalPages: 1 },
        classifiedsMeta: { total: 2, page: 1, limit, totalPages: 1 },
        currentTab,
        currentPage,
      },
    };
  }
};
