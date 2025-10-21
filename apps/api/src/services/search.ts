import { ProductType } from '../models/Product';
import { ServiceType } from '../models/Service';

let client: any | null = null;
let productsIndex: any | null = null;
let servicesIndex: any | null = null;

function isSearchEnabled() {
  return process.env.SEARCH_ENABLED === 'true' && !!process.env.MEILI_HOST;
}

export function getClient(): any | null {
  if (!isSearchEnabled()) return null;
  if (client) return client;
  // Lazy import to avoid adding to bundle if not enabled
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { MeiliSearch } = require('meilisearch');
  client = new MeiliSearch({
    host: process.env.MEILI_HOST,
    apiKey: process.env.MEILI_API_KEY,
  });
  return client;
}

export async function ensureIndexes() {
  const c = getClient();
  if (!c) return;
  productsIndex = await c.getIndex('products').catch(async () => c.createIndex('products', { primaryKey: 'id' }));
  servicesIndex = await c.getIndex('services').catch(async () => c.createIndex('services', { primaryKey: 'id' }));

  // Configure index settings (searchable/filterable attributes)
  await productsIndex!.updateSettings({
    searchableAttributes: ['name', 'description', 'slug', 'attributesText'],
    filterableAttributes: ['vendor', 'categories', 'price', 'currency', 'deleted'],
    sortableAttributes: ['price', 'createdAt', 'updatedAt'],
  });

  await servicesIndex!.updateSettings({
    searchableAttributes: ['name', 'description', 'slug'],
    filterableAttributes: ['vendor', 'price', 'currency', 'duration', 'deleted'],
    sortableAttributes: ['price', 'duration', 'createdAt', 'updatedAt'],
  });
}

function buildProductRecord(p: ProductType) {
  const attrs = (p.attributes || []) as any[];
  const attrPairs: string[] = [];
  for (const a of attrs) {
    const key = a.key || '';
    const vs = a.valueString ?? (typeof a.value === 'string' ? a.value : undefined);
    const vn = a.valueNumber ?? (typeof a.value === 'number' ? a.value : undefined);
    const vb = a.valueBoolean ?? (typeof a.value === 'boolean' ? a.value : undefined);
    const val = vs ?? vn ?? vb ?? '';
    if (key && (val !== undefined && val !== null && val !== '')) {
      attrPairs.push(`${key}:${String(val)}`);
    }
  }
  return {
    id: String(p._id),
    name: p.name,
    description: p.description || '',
    slug: p.slug,
    vendor: String(p.vendor),
    categories: (p.categories || []).map((c: any) => String(c)),
    price: p.price,
    currency: p.currency,
    deleted: !!p.deleted,
    createdAt: p.createdAt?.toISOString?.() || new Date().toISOString(),
    updatedAt: p.updatedAt?.toISOString?.() || new Date().toISOString(),
    attributesText: attrPairs.join(' '),
  };
}

function buildServiceRecord(s: ServiceType) {
  return {
    id: String(s._id),
    name: s.name,
    description: s.description || '',
    slug: s.slug,
    vendor: String(s.vendor),
    price: s.price,
    currency: s.currency,
    duration: s.duration,
    deleted: !!s.deleted,
    createdAt: s.createdAt?.toISOString?.() || new Date().toISOString(),
    updatedAt: s.updatedAt?.toISOString?.() || new Date().toISOString(),
  };
}

export async function indexProduct(p: ProductType) {
  if (!isSearchEnabled()) return;
  await ensureIndexes();
  await productsIndex!.addDocuments([buildProductRecord(p)]);
}

export async function removeProduct(id: string) {
  if (!isSearchEnabled()) return;
  await ensureIndexes();
  await productsIndex!.deleteDocument(id);
}

export async function indexService(s: ServiceType) {
  if (!isSearchEnabled()) return;
  await ensureIndexes();
  await servicesIndex!.addDocuments([buildServiceRecord(s)]);
}

export async function removeService(id: string) {
  if (!isSearchEnabled()) return;
  await ensureIndexes();
  await servicesIndex!.deleteDocument(id);
}

export async function searchProducts(q: string, opts: { offset?: number; limit?: number; filters?: string } = {}) {
  if (!isSearchEnabled()) return { hits: [], estimatedTotalHits: 0 };
  await ensureIndexes();
  return productsIndex!.search(q, { offset: opts.offset, limit: opts.limit ?? 20, filter: opts.filters });
}

export async function searchServices(q: string, opts: { offset?: number; limit?: number; filters?: string } = {}) {
  if (!isSearchEnabled()) return { hits: [], estimatedTotalHits: 0 };
  await ensureIndexes();
  return servicesIndex!.search(q, { offset: opts.offset, limit: opts.limit ?? 20, filter: opts.filters });
}

export async function configureSynonyms() {
  if (!isSearchEnabled()) return;
  await ensureIndexes();
  const synonyms = {
    phone: ['smartphone', 'cellphone', 'mobile'],
    smartphone: ['phone', 'mobile'],
    tv: ['television'],
    fridge: ['refrigerator'],
  } as Record<string, string[]>;
  await productsIndex!.updateSettings({ synonyms });
  await servicesIndex!.updateSettings({ synonyms });
}
