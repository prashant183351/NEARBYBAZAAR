import { Request, Response } from 'express';
import { Classified, ClassifiedZ } from '../models/Classified';
import { ClassifiedPlan } from '../models/ClassifiedPlan';
import { verifyWatermark } from '@nearbybazaar/lib/src/watermark.server';
import { resolveLatestSlug } from '../services/slugHistory';

export async function listClassifieds(_req: Request, res: Response) {
  const classifieds = await Classified.find({ deleted: false }).sort({
    isFeatured: -1,
    featuredExpiry: -1,
    createdAt: -1,
  });
  res.json({ classifieds });
}

export async function getClassified(req: Request, res: Response) {
  const classified = await Classified.findById(req.params.id);
  if (!classified || classified.deleted) return res.status(404).json({ error: 'Not found' });
  res.json({ classified });
}

export async function getClassifiedBySlug(req: Request, res: Response) {
  const { slug } = req.params as { slug: string };
  const classified = await Classified.findOne({ slug, deleted: false });
  if (classified) return res.json({ classified });
  const latest = await resolveLatestSlug('classified', slug);
  if (latest) {
    res.set('Location', `/c/${latest}`);
    return res.status(301).end();
  }
  return res.status(404).json({ error: 'Not found' });
}

export async function createClassified(req: Request, res: Response) {
  // TODO: Enforce plan quota for listings via middleware layer earlier in route
  const parse = ClassifiedZ.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.issues });

  // Enforce plan-based image limits and watermark verification
  const images = req.body.images || [];
  let plan = await ClassifiedPlan.findOne({ vendor: parse.data.vendor, deleted: false });
  if (!plan) plan = await ClassifiedPlan.findOne({ tier: 'Free', deleted: false });
  const maxImages = plan?.features?.includes('extra_images') ? 10 : 3; // Example: feature flag
  if (images.length > maxImages) {
    return res.status(400).json({
      error: `Your plan allows up to ${maxImages} images per classified.`,
      code: 'IMAGE_LIMIT_EXCEEDED',
    });
  }
  // Watermark verification (stub: expects watermark signature)
  const failedImages: number[] = [];
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    if (!img.buffer) continue; // skip if not a buffer
    const ok = await verifyWatermark(img.buffer, {
      secret: process.env.WATERMARK_SECRET || 'default_secret',
      expectedText: img.watermarkText || 'Classified',
    });
    if (!ok) failedImages.push(i);
  }
  if (failedImages.length) {
    return res
      .status(400)
      .json({ error: `Some images are missing the required watermark signature.`, failedImages });
  }

  const classified = await Classified.create(parse.data);
  res.status(201).json({ classified });
}

export async function updateClassified(req: Request, res: Response) {
  // TODO: Enforce plan feature for featured listings via middleware earlier in route
  const parse = ClassifiedZ.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.issues });
  const classified = await Classified.findByIdAndUpdate(req.params.id, parse.data, { new: true });
  if (!classified) return res.status(404).json({ error: 'Not found' });
  res.json({ classified });
}

export async function deleteClassified(req: Request, res: Response) {
  const classified = await Classified.findByIdAndUpdate(
    req.params.id,
    { deleted: true },
    { new: true },
  );
  if (!classified) return res.status(404).json({ error: 'Not found' });
  res.json({ classified });
}
