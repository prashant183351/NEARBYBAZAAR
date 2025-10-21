/**
 * Sitemap XML Formatter
 * Formats sitemap data structures into XML strings
 */

import { SitemapUrl, SitemapIndexEntry, SitemapImage } from './types';

/**
 * XML escaping for sitemap values
 */
function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Format image entry as XML
 */
function formatImage(image: SitemapImage): string {
    let xml = '    <image:image>\n';
    xml += `      <image:loc>${escapeXml(image.loc)}</image:loc>\n`;

    if (image.caption) {
        xml += `      <image:caption>${escapeXml(image.caption)}</image:caption>\n`;
    }

    if (image.title) {
        xml += `      <image:title>${escapeXml(image.title)}</image:title>\n`;
    }

    if (image.geoLocation) {
        xml += `      <image:geo_location>${escapeXml(image.geoLocation)}</image:geo_location>\n`;
    }

    if (image.license) {
        xml += `      <image:license>${escapeXml(image.license)}</image:license>\n`;
    }

    xml += '    </image:image>\n';
    return xml;
}

/**
 * Format single URL entry as XML
 */
function formatUrl(url: SitemapUrl): string {
    let xml = '  <url>\n';
    xml += `    <loc>${escapeXml(url.loc)}</loc>\n`;

    if (url.lastmod) {
        xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
    }

    if (url.changefreq) {
        xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
    }

    if (url.priority !== undefined) {
        xml += `    <priority>${url.priority.toFixed(1)}</priority>\n`;
    }

    // Add images if present
    if (url.images && url.images.length > 0) {
        for (const image of url.images) {
            xml += formatImage(image);
        }
    }

    xml += '  </url>\n';
    return xml;
}

/**
 * Format sitemap index entry as XML
 */
function formatSitemapIndexEntry(entry: SitemapIndexEntry): string {
    let xml = '  <sitemap>\n';
    xml += `    <loc>${escapeXml(entry.loc)}</loc>\n`;

    if (entry.lastmod) {
        xml += `    <lastmod>${entry.lastmod}</lastmod>\n`;
    }

    xml += '  </sitemap>\n';
    return xml;
}

/**
 * Format URLs as sitemap XML
 */
export function formatSitemapXml(urls: SitemapUrl[]): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"';
    xml += ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

    for (const url of urls) {
        xml += formatUrl(url);
    }

    xml += '</urlset>';
    return xml;
}

/**
 * Format sitemap index as XML
 */
export function formatSitemapIndexXml(entries: SitemapIndexEntry[]): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    for (const entry of entries) {
        xml += formatSitemapIndexEntry(entry);
    }

    xml += '</sitemapindex>';
    return xml;
}
