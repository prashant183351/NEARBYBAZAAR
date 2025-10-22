// SEO Helpers
const MAX_TITLE = 60;
const MAX_DESC = 160;

export function clamp(str: string, max: number): string {
  if (!str) return '';
  return str.length > max ? str.slice(0, max - 3).trim() + '...' : str;
}

export function sanitizeMeta(str: string): string {
  if (!str) return '';
  return str
    .replace(/[\u0000-\u001F\u007F<>"'`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getMetaTitle(title: string, siteName: string = 'NearbyBazaar'): string {
  return clamp(sanitizeMeta(`${title} | ${siteName}`), MAX_TITLE);
}

export function getMetaDescription(desc: string): string {
  return clamp(sanitizeMeta(desc), MAX_DESC);
}

export function getCanonicalUrl(base: string, path: string): string {
  if (!base.endsWith('/')) base += '/';
  return new URL(path, base).toString();
}
