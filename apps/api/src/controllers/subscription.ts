import { Request, Response } from 'express';
import { Subscription } from '../models/Subscription';
import { ClassifiedPlan } from '../models/ClassifiedPlan';

// POST /v1/subscribe - Subscribe or upgrade vendor plan
export async function subscribePlan(req: Request, res: Response) {
  const { vendorId, planId } = req.body;
  // Validate plan
  const plan = await ClassifiedPlan.findById(planId);
  if (!plan || plan.deleted) return res.status(404).json({ error: 'Plan not found' });
  // Simulate payment (stub)
  // In future: generate PhonePe payment link, handle webhook
  const now = new Date();
  // Log vendor acceptance of refund policy
  const { RefundPolicy } = require('../models/RefundPolicy');
  const activePolicy = await RefundPolicy.findOne({ active: true });
  // You may want to store this in a separate AcceptanceLog model for full audit
  if (activePolicy) {
    // For demo, just log to console or store in subscription
    console.log(`Vendor ${vendorId} accepted refund policy at ${now}: ${activePolicy.text}`);
  }
  const sub = await Subscription.create({
    vendor: vendorId,
    plan: planId,
    startDate: now,
    status: 'active',
    refundPolicyAcceptedAt: now,
  });
  res.status(201).json({ subscription: sub });
}

// POST /v1/subscription/webhook - Placeholder for payment confirmation
export async function subscriptionWebhook(_req: Request, res: Response) {
  // In future: update subscription status based on payment gateway callback
  res.json({ ok: true, message: 'Webhook received (stub)' });
}
