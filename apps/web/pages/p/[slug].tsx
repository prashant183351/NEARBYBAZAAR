import { GetServerSideProps } from 'next';
import { useCart } from '../../context/CartContext';
import { SeoHead } from '../../components/SeoHead';
import dynamic from 'next/dynamic';
const Product3DViewer = dynamic(() => import('../../components/Product3DViewer'), { ssr: false });
import { getProductCanonical } from '@nearbybazaar/lib/canonical';
import { generateProductSchema } from '@nearbybazaar/lib/jsonld';

interface ProductPageProps {
  slug: string;
}

export default function ProductPage({ slug }: ProductPageProps) {
  const { addToCart } = useCart();
  const name = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://nearbybazaar.com';

  // Generate canonical URL (strips any tracking parameters)
  const canonicalUrl = getProductCanonical(baseUrl, slug);

  // Generate JSON-LD Product schema for rich search results
  const productSchema = generateProductSchema({
    name,
    description: `Details for product: ${name}`,
    sku: `SKU-${slug.toUpperCase()}`,
    price: 999, // Example price - in real app, fetch from API
    priceCurrency: 'INR',
    availability: 'InStock',
    url: canonicalUrl,
    image: `${baseUrl}/products/${slug}.jpg`, // Example image
    seller: {
      name: 'NearbyBazaar Vendor', // In real app, fetch actual vendor
      url: `${baseUrl}/store/vendor-slug`,
    },
  });

  // Simulate product data with 3D model for demo
  const product = {
    slug,
    name,
    model3d:
      slug === 'chair-3d-demo'
        ? 'https://modelviewer.dev/shared-assets/models/Astronaut.glb'
        : undefined,
    arEnabled: true,
    arMeta: { 'ios-src': 'https://modelviewer.dev/shared-assets/models/Astronaut.usdz' },
  };
  return (
    <>
      <SeoHead
        title={`${name} | Product`}
        description={`Details for product: ${name}`}
        canonicalUrl={canonicalUrl}
        jsonLd={productSchema}
      />
      <main style={{ padding: 32 }}>
        <h1>Product Detail</h1>
        <p>Slug: {slug}</p>
        {product.model3d && (
          <Product3DViewer
            modelUrl={product.model3d}
            ar={product.arEnabled}
            arMeta={product.arMeta}
          />
        )}
        <button onClick={() => addToCart({ slug, name })}>Add to Cart</button>
      </main>
    </>
  );
}
export const getServerSideProps: GetServerSideProps<ProductPageProps> = async (context) => {
  const { slug } = context.params as { slug: string };
  return { props: { slug } };
};
