import { Router } from 'express';
import { resolveLatestSlug } from '../services/slugHistory';

const router = Router();

// GET /v1/slug/resolve/:type/:slug -> 301 to latest public URL if mapping exists
router.get('/resolve/:type/:slug', async (req, res) => {
  const { type, slug } = req.params as {
    type: 'product' | 'service' | 'classified' | 'vendor' | string;
    slug: string;
  };
  if (!['product', 'service', 'classified', 'vendor'].includes(type)) {
    return res.status(400).json({ error: 'Invalid type' });
  }
  const latest = await resolveLatestSlug(type as any, slug);
  if (!latest) return res.status(404).json({ error: 'Not found' });

  // Map resource type -> public site path base for 301 redirect
  const base: Record<string, string> = {
    product: '/p/',
    service: '/s/',
    classified: '/c/',
    vendor: '/store/',
  } as const;
  const prefix = base[type as keyof typeof base];
  const location = `${prefix}${latest}`;
  res.set('Location', location);
  return res.status(301).end();
});

export default router;
