
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import { SeoHead } from '../../components/SeoHead';
import { generateServiceSchema } from '@nearbybazaar/lib/jsonld';

interface Service {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    price?: number;
    currency?: string;
    duration?: string; // e.g., "2 hours"
    vendorId?: string;
    vendorName?: string;
    vendorUrl?: string;
    media?: string[];
    averageRating?: number;
    reviewCount?: number;
    areaServed?: string[];
}

interface Props {
    service: Service;
}

export default function ServiceDetail({ service }: Props) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://nearbybazaar.com';
    
    // Generate Service JSON-LD schema
    const serviceSchema = generateServiceSchema({
        name: service.name,
        description: service.description,
        provider: {
            name: service.vendorName || 'NearbyBazaar Vendor',
            url: service.vendorUrl,
        },
        offers: service.price ? {
            price: service.price,
            priceCurrency: service.currency || 'INR',
        } : undefined,
            areaServed: service.areaServed ? service.areaServed.join(', ') : undefined,
        aggregateRating: service.averageRating ? {
            ratingValue: service.averageRating,
            reviewCount: service.reviewCount || 0,
        } : undefined,
        url: `${baseUrl}/s/${service.slug}`,
        image: service.media?.[0],
    });

    return (
        <>
            <SeoHead 
                title={`${service.name} | Service`} 
                description={service.description || `Book ${service.name} service`}
                url={`${baseUrl}/s/${service.slug}`}
                image={service.media?.[0]}
                jsonLd={serviceSchema}
            />
            <main style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>
                <h1>{service.name}</h1>
                {service.media?.[0] && (
                    <img 
                        src={service.media[0]} 
                        alt={service.name} 
                        style={{ maxWidth: '100%', height: 'auto', marginBottom: 24 }}
                    />
                )}
                <p style={{ fontSize: 18, color: '#666', marginBottom: 16 }}>
                    {service.description || 'No description available.'}
                </p>
                {service.price && (
                    <p style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
                        {service.currency === 'INR' ? '₹' : service.currency} {service.price}
                        {service.duration && <span style={{ fontSize: 16, color: '#666' }}> / {service.duration}</span>}
                    </p>
                )}
                {service.vendorName && (
                    <p style={{ marginBottom: 16 }}>
                        Provider: {service.vendorUrl ? (
                            <Link href={service.vendorUrl}>{service.vendorName}</Link>
                        ) : service.vendorName}
                    </p>
                )}
                {service.areaServed && service.areaServed.length > 0 && (
                    <p style={{ marginBottom: 16 }}>
                        Available in: {service.areaServed.join(', ')}
                    </p>
                )}
                {service.averageRating && (
                    <p style={{ marginBottom: 24 }}>
                        ⭐ {service.averageRating.toFixed(1)} ({service.reviewCount || 0} reviews)
                    </p>
                )}
                <Link href={`/book/${service.slug}`}>
                    <button style={{ 
                        padding: '12px 24px', 
                        fontSize: 16, 
                        backgroundColor: '#000', 
                        color: '#fff', 
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer'
                    }}>
                        Book This Service
                    </button>
                </Link>
            </main>
        </>
    );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { slug } = context.params as { slug: string };
    
    // TODO: Fetch actual service data from API
    // For now, return stub data
    const service: Service = {
        _id: 'stub-service-id',
        name: slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        slug,
        description: 'This is a sample service description. Replace with actual data from API.',
        price: 1500,
        currency: 'INR',
        duration: '2 hours',
        vendorName: 'Sample Vendor',
        vendorUrl: '/store/sample-vendor',
        media: ['/service-placeholder.jpg'],
        averageRating: 4.5,
        reviewCount: 12,
        areaServed: ['Mumbai', 'Navi Mumbai'],
    };

    return { props: { service } };
};
