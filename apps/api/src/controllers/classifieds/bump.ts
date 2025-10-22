import { Request, Response } from 'express';
import { Classified } from '../../models/Classified';
// import { Subscription } from '../../models/Subscription';
import { AuditLog } from '../../models/AuditLog';

// POST /v1/classifieds/:id/bump
export async function bumpClassified(req: Request, res: Response) {
  const { id } = req.params;
  const vendorId = req.user?.id || req.body.vendorId;
  if (!vendorId) return res.status(401).json({ error: 'Vendor not authenticated' });
  const classified = await Classified.findById(id);
  if (!classified || classified.deleted) return res.status(404).json({ error: 'Not found' });
  if (classified.vendor.toString() !== vendorId)
    return res.status(403).json({ error: 'Not your listing' });

  // Cooldown logic: 24h between bumps
  const now = new Date();
  const lastBump = classified.lastBump || (classified as any).createdAt;
  const cooldown = 24 * 60 * 60 * 1000;
  if (now.getTime() - new Date(lastBump).getTime() < cooldown) {
    return res.status(429).json({ error: 'You can only bump this listing once every 24 hours.' });
  }

  // Plan rules: check bumps allowed (stub, can be extended)
  // ...

  // Bump: update bumpScore and lastBump
  classified.bumpScore = (classified.bumpScore || 0) + 1;
  classified.lastBump = now;
  await classified.save();

  // Audit log
  await AuditLog.create({
    user: vendorId,
    action: 'classified_bump',
    resource: 'classified',
    resourceId: id,
    details: { bumpScore: classified.bumpScore, lastBump: now },
    immutable: true,
  });

  res.json({ ok: true, classified });
}
