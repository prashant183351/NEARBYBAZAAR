import { Router } from 'express';
import { z } from 'zod';
import { calculateCommission } from '../../services/commission/calc';
import { Product } from '../../models/Product';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 180 }); // 3 minutes
const router = Router();

const QuoteInputZ = z.object({
  productId: z.string(),
  quantity: z.number().min(1).default(1),
});

router.post('/quote', async (req, res) => {
  const parse = QuoteInputZ.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.issues });
  const { productId, quantity } = parse.data;
  const cacheKey = `${productId}:${quantity}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  const product = await Product.findById(productId);
  if (!product || product.deleted) return res.status(404).json({ error: 'Product not found' });

  // Use commission calc service
  const commissionResult = await calculateCommission({
    price: product.price,
    category:
      Array.isArray(product.categories) && product.categories.length > 0
        ? product.categories[0].toString()
        : undefined,
    vendorId: product.vendor.toString(),
    quantity,
  });

  // Example: tax calculation (replace with real tax engine if available)
  const tax = Math.round(product.price * quantity * 0.18 * 100) / 100; // 18% GST

  const quote = {
    product: {
      id: product._id,
      name: product.name,
      price: product.price,
      category:
        Array.isArray(product.categories) && product.categories.length > 0
          ? product.categories[0].toString()
          : undefined,
      vendor: product.vendor.toString(),
    },
    quantity,
    subtotal: product.price * quantity,
    commission: commissionResult.commission,
    commissionBreakdown: commissionResult.breakdown,
    tax,
    total: product.price * quantity + tax,
    currency: product.currency || 'INR',
  };
  cache.set(cacheKey, quote);
  res.json(quote);
});

export default router;
