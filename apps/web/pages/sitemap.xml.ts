import type { GetServerSideProps } from 'next';

// This page writes XML directly to the response; no React render needed
export default function SiteMap() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const response = await fetch(`${apiUrl}/v1/sitemap/index`).catch(() => null);
    let xml = '';
    if (response && response.ok) {
      xml = await response.text();
    } else {
      // Minimal fallback sitemap index to avoid build failures when API is down in CI
      xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></sitemapindex>`;
    }

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader(
      'Cache-Control',
      'public, max-age=3600, s-maxage=7200, stale-while-revalidate=86400',
    );
    res.write(xml);
    res.end();
  } catch (err) {
    const fallback = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></sitemapindex>`;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.write(fallback);
    res.end();
  }
  return { props: {} };
};
