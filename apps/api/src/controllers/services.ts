import { Request, Response } from 'express';
import { Service, ServiceZ } from '../models/Service';
import { resolveLatestSlug } from '../services/slugHistory';

export async function listServices(_req: Request, res: Response) {
  const services = await Service.find({ deleted: false });
  res.json({ services });
}

export async function getService(req: Request, res: Response) {
  const service = await Service.findById(req.params.id);
  if (!service || service.deleted) return res.status(404).json({ error: 'Not found' });
  res.json({ service });
}

export async function getServiceBySlug(req: Request, res: Response) {
  const { slug } = req.params as { slug: string };
  const service = await Service.findOne({ slug, deleted: false });
  if (service) return res.json({ service });
  // fallback to slug history
  const latest = await resolveLatestSlug('service', slug);
  if (latest) {
    res.set('Location', `/s/${latest}`);
    return res.status(301).end();
  }
  return res.status(404).json({ error: 'Not found' });
}

export async function createService(req: Request, res: Response) {
  const parse = ServiceZ.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.issues });
  const service = await Service.create(parse.data);
  res.status(201).json({ service });
}

export async function updateService(req: Request, res: Response) {
  const parse = ServiceZ.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.issues });
  const service = await Service.findByIdAndUpdate(req.params.id, parse.data, { new: true });
  if (!service) return res.status(404).json({ error: 'Not found' });
  res.json({ service });
}

export async function deleteService(req: Request, res: Response) {
  const service = await Service.findByIdAndUpdate(req.params.id, { deleted: true }, { new: true });
  if (!service) return res.status(404).json({ error: 'Not found' });
  res.json({ service });
}
