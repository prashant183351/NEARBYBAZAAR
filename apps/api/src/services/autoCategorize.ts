// Auto product categorization using ML classifier (stub: replace with real model)
import { Product } from '../models/Product';
import { Category } from '../models/Category';

// Dummy classifier: returns most common category or random
export async function suggestCategoryForProduct(product: any): Promise<string> {
  // TODO: Replace with real ML model (e.g. HuggingFace, custom API)
  // Example: using product.name for future ML input
  // logger.debug(`Suggesting category for product: ${product?.name}`);
  void product; // reference to avoid unused warning

  const categories = await Category.find().lean();
  if (!categories.length) return '';
  // For now, pick a random category
  const idx = Math.floor(Math.random() * categories.length);
  return categories[idx]._id.toString();
}

// Batch suggest for admin review
export async function batchSuggestCategories(limit = 20) {
  const products = await Product.find({ category: { $exists: false } })
    .limit(limit)
    .lean();
  const suggestions = [];
  for (const p of products) {
    const cat = await suggestCategoryForProduct(p);
    suggestions.push({ productId: p._id, suggestedCategory: cat, name: p.name });
  }
  return suggestions;
}
