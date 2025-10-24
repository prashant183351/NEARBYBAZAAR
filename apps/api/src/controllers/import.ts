import { Request, Response } from 'express';
import { parseCsvStream } from '../services/csv';
import { Product } from '../models/Product';
import { Service } from '../models/Service';
import { Classified } from '../models/Classified';
import { AuditLog } from '../models/AuditLog';
import { Readable } from 'stream';

// Define a type for importable row (could be improved per model)
type ImportRow = Record<string, unknown> & { id?: string };

// Simulate queue job (stub)
async function enqueueImportJob(
  type: 'product' | 'service' | 'classified',
  rows: ImportRow[],
  userId: string,
) {
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
      // TODO: Log error to a persistent store or error queue
      console.error(`Import error for ${type}:`, err);
    }
  }
}

// Extend Express Request type for user and file (if not already globally extended)
interface ImportRequestUser {
  id: string;
  email: string;
  role: 'vendor' | 'user' | 'admin';
  scopes?: string[];
}

interface ImportRequest extends Request {
  user?: ImportRequestUser;
  file?: Express.Multer.File & { buffer: Buffer };
}

export async function importCsv(req: ImportRequest, res: Response) {
  const { type } = req.body as { type: 'product' | 'service' | 'classified' };
  if (!['product', 'service', 'classified'].includes(type)) {
    return res.status(400).json({ error: 'Invalid type' });
  }
  if (!req.file || !req.file.buffer) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const rows: ImportRow[] = [];
  const stream = Readable.from(req.file.buffer);

  parseCsvStream(
    stream,
    async (row: ImportRow) => {
      rows.push(row);
    },
    async () => {
      // Enqueue job for async processing
      await enqueueImportJob(type, rows, req.user?.id || 'unknown');
    },
    (err?: Error) => {
      // handle parse error
      console.error('CSV parse error:', err);
      res.status(500).json({ error: 'CSV parse error', details: err?.message });
    },
  );

  res.json({ success: true, message: 'Import started. You will be notified when complete.' });
}
