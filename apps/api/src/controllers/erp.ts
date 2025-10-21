import { Request, Response } from 'express';
import { writeToString } from 'fast-csv';

// Simulated in-memory error CSV (replace with persistent storage as needed)
let lastErrorRows: Array<{ row: any; error: string }> = [];

export function recordSyncErrors(rows: Array<{ row: any; error: string }>) {
    lastErrorRows = rows;
}

export async function downloadErrorCsv(_req: Request, res: Response) {
    if (!lastErrorRows.length) {
        return res.status(404).send('No error file available');
    }
    const csv = await writeToString(lastErrorRows.map(({ row, error }) => ({ ...row, error })), {
        headers: true,
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="erp-errors.csv"');
    res.send(csv);
}


import { Order } from '../models/Order';

// Export vendor orders in ERP format (CSV/XLSX)
export async function exportOrdersFile(req: Request, res: Response) {
    const vendorId = req.query.vendorId as string;
    const format = (req.query.format as string) || 'csv';
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '1000', 10);

    // Permission check (TODO: implement real auth)
    // ...existing code...

    // Build query for orders
    const query: any = { vendor: vendorId };
    if (startDate) query.createdAt = { $gte: startDate };
    if (endDate) query.createdAt = { ...(query.createdAt || {}), $lte: endDate };

    // Paginate orders
    const orders = await Order.find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

    // Map to ERP payload (removed unused payload variable)
    let fileBuffer: Buffer;
    let mimeType: string;
    let filename: string;
    if (format === 'xlsx') {
        // XLSX export
        const XLSX = require('xlsx');
        const worksheet = XLSX.utils.json_to_sheet(orders);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
        fileBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filename = 'orders.xlsx';
    } else {
        // CSV export
        const { stringify } = require('csv-stringify/sync');
        const csv = stringify(orders, { header: true });
        fileBuffer = Buffer.from(csv);
        mimeType = 'text/csv';
        filename = 'orders.csv';
    }

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(fileBuffer);
}
