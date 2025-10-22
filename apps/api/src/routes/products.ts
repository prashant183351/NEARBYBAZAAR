import { Router } from 'express';
import * as products from '../controllers/products';
import { authorize } from '../middleware/auth';
import { Product } from '../models/Product';

const router = Router();

router.get('/', products.listProducts);
router.get('/:slug', products.getProduct);
router.post(
  '/',
  authorize({
    action: 'create',
    resource: 'product',
    getContext: (req) => ({ ownerId: (req.body?.vendor as string) || null }),
  }),
  products.createProduct,
);
router.put(
  '/:slug',
  authorize({
    action: 'update',
    resource: 'product',
    getContext: async (req) => {
      const product = await Product.findOne({ slug: req.params.slug }).select('vendor');
      return { resourceOwnerId: product ? String(product.vendor) : null };
    },
  }),
  products.updateProduct,
);
router.delete(
  '/:slug',
  authorize({
    action: 'delete',
    resource: 'product',
    getContext: async (req) => {
      const product = await Product.findOne({ slug: req.params.slug }).select('vendor');
      return { resourceOwnerId: product ? String(product.vendor) : null };
    },
  }),
  products.deleteProduct,
);

export default router;
