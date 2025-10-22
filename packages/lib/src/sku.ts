// Deterministic SKU Generator Utility
import crypto from 'crypto';

export function generateSKU({
  name,
  category,
  date,
  id,
  prefix = 'NBZ',
}: {
  name: string;
  category?: string;
  date?: Date | string;
  id?: string;
  prefix?: string;
}): string {
  const base = [
    prefix,
    name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, ''),
    category
      ? category
          .trim()
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')
      : '',
    id ? id : '',
    date ? (typeof date === 'string' ? date : date.toISOString().slice(0, 10)) : '',
  ]
    .filter(Boolean)
    .join('-');
  // Deterministic hash for uniqueness
  const hash = crypto.createHash('sha1').update(base).digest('hex').slice(0, 8).toUpperCase();
  return `${base}-${hash}`;
}
