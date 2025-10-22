import { Request, Response } from 'express';
import { Receipt } from '../models/Receipt';

// GET /v1/receipts/:id - Retrieve a receipt
export async function getReceipt(req: Request, res: Response) {
  const receipt = await Receipt.findById(req.params.id);
  if (!receipt) return res.status(404).json({ error: 'Not found' });
  res.json({ receipt });
}

// GET /v1/receipts?vendor=... - List receipts for a vendor
export async function listReceipts(req: Request, res: Response) {
  const { vendor } = req.query;
  const receipts = await Receipt.find(vendor ? { vendor } : {});
  res.json({ receipts });
}
