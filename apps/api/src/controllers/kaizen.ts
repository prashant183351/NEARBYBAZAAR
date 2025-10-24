import { Request, Response } from 'express';
import { Kaizen, KaizenZ } from '../models/Kaizen';

export async function listKaizen(_req: Request, res: Response) {
  const entries = await Kaizen.find({ deleted: false });
  res.json({ entries });
}

export async function getKaizen(req: Request, res: Response) {
  const entry = await Kaizen.findById(req.params.id);
  if (!entry || entry.deleted) return res.status(404).json({ error: 'Not found' });
  res.json({ entry });
}

export async function createKaizen(req: Request, res: Response) {
  const parse = KaizenZ.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.issues });
  const entry = await Kaizen.create(parse.data);
  res.status(201).json({ entry });
}

export async function updateKaizen(req: Request, res: Response) {
  const parse = KaizenZ.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.issues });
  const entry = await Kaizen.findByIdAndUpdate(req.params.id, parse.data, { new: true });
  if (!entry) return res.status(404).json({ error: 'Not found' });
  res.json({ entry });
}

export async function deleteKaizen(req: Request, res: Response) {
  const entry = await Kaizen.findByIdAndUpdate(req.params.id, { deleted: true }, { new: true });
  if (!entry) return res.status(404).json({ error: 'Not found' });
  res.json({ entry });
}
