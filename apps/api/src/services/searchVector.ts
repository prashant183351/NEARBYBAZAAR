// Vector search and semantic queries using Meilisearch + embeddings
import { MeiliSearch } from 'meilisearch';
// import { Product } from '../models/Product';
// import { logger } from '../utils/logger';

const meili = new MeiliSearch({
  host: process.env.MEILI_HOST || 'http://localhost:7700',
  apiKey: process.env.MEILI_API_KEY || '',
});

const INDEX = 'products';

// Assume embedding function is provided by an external service (OpenAI/HuggingFace)
async function getEmbedding(text: string): Promise<number[]> {
  // TODO: Call external embedding API (OpenAI/HuggingFace) for the text
  // For now, return a dummy vector
  return Array(384).fill(0).map((_, i) => Math.sin(i + text.length));
}

// Index a product with vector embeddings (multi-lingual)
export async function indexProductVector(product: any) {
  const enText = product.description_en || product.description || '';
  const hiText = product.description_hi || '';
  const enVec = await getEmbedding(enText);
  const hiVec = await getEmbedding(hiText);
  await meili.index(INDEX).addDocuments([
    {
      id: product._id,
      name: product.name,
      description_en: enText,
      description_hi: hiText,
      vector_en: enVec,
      vector_hi: hiVec,
      ...product,
    },
  ]);
}

// Semantic search: embed query and search by vector similarity
export async function semanticSearch(query: string) {
  const queryVec = await getEmbedding(query);
  // Meilisearch vector search API (assume plugin/enterprise enabled)
  const res = await meili.index(INDEX).search('', {
    vector: queryVec,
  });
  return res.hits;
}
