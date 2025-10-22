import { Request, Response } from 'express';
import { parseCsvStream } from '../services/csv';
import { Product } from '../models/Product';
import { Service } from '../models/Service';
import { Classified } from '../models/Classified';
import { AuditLog } from '../models/AuditLog';
import { Readable } from 'stream';

// Simulate queue job (stub)
async function enqueueImportJob(type: string, rows: any[], userId: string) {
  // TODO: Use real queue/job system
  for (const row of rows) {
    try {
      if (type === 'product') await Product.create(row);
      if (type === 'service') await Service.create(row);
      if (type === 'classified') await Classified.create(row);
      await AuditLog.create({
        user: userId,
        action: 'import',
        resource: type,
        resourceId: row.id,
        details: row,
      });
    } catch (err) {
      // Log or collect errors
    }
  }
}

export async function importCsv(req: Request, res: Response) {
  const { type } = req.body;
  if (!['product', 'service', 'classified'].includes(type))
    return res.status(400).json({ error: 'Invalid type' });
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const rows: any[] = [];
  const stream = Readable.from(req.file.buffer);

  parseCsvStream(
    stream,
    async (row) => {
      rows.push(row);
    },
    async () => {
      // Enqueue job for async processing
      await enqueueImportJob(type, rows, (req as any).user?.id);
    },
    () => {
      /* handle parse error */
    },
  );

  res.json({ success: true, message: 'Import started. You will be notified when complete.' });
}
