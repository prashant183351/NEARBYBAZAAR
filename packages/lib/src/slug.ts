// Slug generator utility for NearbyBazaar
// Deterministic, locale-aware, safe for URLs

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]+/g, '-')      // Replace non-alphanum with dash
    .replace(/^-+|-+$/g, '')          // Trim leading/trailing dashes
    .replace(/--+/g, '-');            // Collapse multiple dashes
}

// Optionally, add a function to ensure uniqueness (append counter if needed)
export function uniqueSlug(base: string, existing: Set<string>): string {
  let slug = generateSlug(base);
  let counter = 1;
  while (existing.has(slug)) {
    slug = `${generateSlug(base)}-${counter++}`;
  }
  return slug;
}

// Alias for test compatibility
export function dedupeSlug(base: string, existing: Set<string>): string {
  if (!existing.has(base)) return base;
  let counter = 2;
  let candidate = `${base}-${counter}`;
  while (existing.has(candidate)) {
    candidate = `${base}-${++counter}`;
  }
  return candidate;
}

// Slug history updater for test compatibility
export function updateSlugHistory(oldSlug: string, history: string[], newSlug: string): { slug: string; slugHistory: string[] } {
  if (oldSlug !== newSlug && !history.includes(oldSlug)) {
    return { slug: newSlug, slugHistory: [...history, oldSlug] };
  }
  return { slug: newSlug, slugHistory: history };
}
