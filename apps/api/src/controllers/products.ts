import { Request, Response } from 'express';
import { Product, ProductZ } from '../models/Product';
import { getDescendantCategoryIds } from '../models/Category';
import { resolveLatestSlug } from '../services/slugHistory';

export async function listProducts(req: Request, res: Response) {
  const { category } = req.query as Record<string, string>;

  const filter: any = { deleted: false };

  if (category) {
    try {
      const ids = await getDescendantCategoryIds(category);
      filter.categories = { $in: ids };
    } catch {
      // ignore invalid ids, no results
      filter.categories = { $in: [] };
    }
  }

  // Attribute filters: for query like ?attr.color=red&attr.size=XL
  // or ?attr_key=color&attr_val=red (single pair)
  const url = new URL(req.protocol + '://' + req.get('host') + req.originalUrl);
  // Collect attr.<key>=<value>
  const attrEntries = Array.from(url.searchParams.entries()).filter(([k]) => k.startsWith('attr.'));
  if (attrEntries.length > 0) {
    const andClauses = attrEntries.map(([k, v]) => {
      const key = k.substring(5);
      return {
        attributes: {
          $elemMatch: {
            $or: [
              { key, valueString: v },
              { key, value: v },
            ],
          },
        },
      };
    });
    filter.$and = (filter.$and || []).concat(andClauses);
  }

  const products = await Product.find(filter);
  res.json({ products });
}

export async function getProduct(req: Request, res: Response) {
  const { slug } = req.params as { slug: string };
  const product = await Product.findOne({ slug, deleted: false });
  if (product) return res.json({ product });
  // fallback to slug history
  const latest = await resolveLatestSlug('product', slug);
  if (latest) {
    res.set('Location', `/p/${latest}`);
    return res.status(301).end();
  }
  return res.status(404).json({ error: 'Not found' });
}

export async function createProduct(req: Request, res: Response) {
  const parse = ProductZ.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.errors });
  const product = await Product.create(parse.data);
  res.status(201).json({ product });
}

export async function updateProduct(req: Request, res: Response) {
  const parse = ProductZ.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.errors });
  const product = await Product.findOneAndUpdate({ slug: req.params.slug }, parse.data, {
    new: true,
  });
  if (!product) return res.status(404).json({ error: 'Not found' });
  res.json({ product });
}

export async function deleteProduct(req: Request, res: Response) {
  const product = await Product.findOneAndUpdate(
    { slug: req.params.slug },
    { deleted: true },
    { new: true },
  );
  if (!product) return res.status(404).json({ error: 'Not found' });
  res.json({ product });
}
