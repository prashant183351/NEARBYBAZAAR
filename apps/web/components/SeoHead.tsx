import Head from 'next/head';
import { getMetaTitle, getMetaDescription } from '@nearbybazaar/lib/seo';
import { stripTrackingParams, normalizeUrl } from '@nearbybazaar/lib/canonical';

interface SeoHeadProps {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    canonicalUrl?: string;
    noindex?: boolean;
    keywords?: string[];
    jsonLd?: Record<string, any> | Record<string, any>[]; // JSON-LD structured data
}

const DEFAULT_IMAGE = '/og-default.png';
const SITE_NAME = 'NearbyBazaar';
const BASE_URL = 'https://nearbybazaar.com';

export const SeoHead: React.FC<SeoHeadProps> = ({
    title,
    description,
    image,
    url,
    canonicalUrl,
    noindex = false,
    keywords = [],
    jsonLd,
}) => {
    const metaTitle = getMetaTitle(title || 'NearbyBazaar', SITE_NAME);
    const metaDescription = getMetaDescription(description || 'Shop local, shop smart with NearbyBazaar.');
    const ogImage = image || DEFAULT_IMAGE;
    const pageUrl = url || BASE_URL;

    // Generate canonical URL: use provided canonical or strip tracking from current URL
    let canonical = canonicalUrl;
    if (!canonical && typeof window !== 'undefined') {
        // Client-side: use current URL and strip tracking params
        canonical = stripTrackingParams(window.location.href);
    } else if (!canonical && pageUrl) {
        // Server-side: use provided URL
        canonical = normalizeUrl(pageUrl);
    }

    // Prepare JSON-LD scripts
    const jsonLdArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

    return (
        <Head>
            <title>{metaTitle}</title>
            <meta name="description" content={metaDescription} />

            {/* Keywords (if any) */}
            {keywords.length > 0 && (
                <meta name="keywords" content={keywords.join(', ')} />
            )}

            {/* Robots directive */}
            <meta name="robots" content={noindex ? 'noindex, follow' : 'index, follow'} />

            {/* Canonical URL - prevents duplicate content issues */}
            {canonical && <link rel="canonical" href={canonical} />}

            {/* Open Graph tags */}
            <meta property="og:title" content={metaTitle} />
            <meta property="og:description" content={metaDescription} />
            <meta property="og:image" content={ogImage} />
            <meta property="og:url" content={canonical || pageUrl} />
            <meta property="og:site_name" content={SITE_NAME} />
            <meta property="og:type" content="website" />

            {/* Twitter Card tags */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={metaTitle} />
            <meta name="twitter:description" content={metaDescription} />
            <meta name="twitter:image" content={ogImage} />

            {/* JSON-LD Structured Data for rich search results */}
            {jsonLdArray.map((schema, index) => (
                <script
                    key={`jsonld-${index}`}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
                />
            ))}
        </Head>
    );
};
