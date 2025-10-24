import { Request, Response } from 'express';
import { ClassifiedPlan, ClassifiedPlanZ } from '../models/ClassifiedPlan';

export async function listPlans(_req: Request, res: Response) {
  const plans = await ClassifiedPlan.find({ deleted: false });
  res.json({ plans });
}

export async function getPlan(req: Request, res: Response) {
  const plan = await ClassifiedPlan.findById(req.params.id);
  if (!plan || plan.deleted) return res.status(404).json({ error: 'Not found' });
  res.json({ plan });
}

export async function createPlan(req: Request, res: Response) {
  const parse = ClassifiedPlanZ.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.issues });
  const plan = await ClassifiedPlan.create(parse.data);
  res.status(201).json({ plan });
}

export async function updatePlan(req: Request, res: Response) {
  const parse = ClassifiedPlanZ.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.issues });
  const plan = await ClassifiedPlan.findByIdAndUpdate(req.params.id, parse.data, { new: true });
  if (!plan) return res.status(404).json({ error: 'Not found' });
  res.json({ plan });
}

export async function deletePlan(req: Request, res: Response) {
  const plan = await ClassifiedPlan.findByIdAndUpdate(
    req.params.id,
    { deleted: true },
    { new: true },
  );
  if (!plan) return res.status(404).json({ error: 'Not found' });
  res.json({ plan });
}
