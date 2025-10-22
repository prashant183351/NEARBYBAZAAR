import { Request, Response } from 'express';
import { Order } from '../models/Order';
import { Booking } from '../models/Booking';
import { parse } from 'fast-csv';

// Commission report by vendor and date range
export async function commissionReport(req: Request, res: Response) {
  const { vendorId, start, end, format } = req.query;
  const startDate = start ? new Date(start as string) : new Date('2000-01-01');
  const endDate = end ? new Date(end as string) : new Date();

  // Aggregate commissions from orders and bookings
  const orderAgg = await Order.aggregate([
    {
      $match: {
        'lines.vendor': vendorId,
        createdAt: { $gte: startDate, $lte: endDate },
        deleted: false,
      },
    },
    { $unwind: '$lines' },
    { $match: { 'lines.vendor': vendorId } },
    {
      $group: {
        _id: '$lines.vendor',
        totalCommission: { $sum: '$lines.commission' },
        count: { $sum: 1 },
      },
    },
  ]);

  const bookingAgg = await Booking.aggregate([
    { $match: { vendor: vendorId, createdAt: { $gte: startDate, $lte: endDate }, deleted: false } },
    { $group: { _id: '$vendor', totalCommission: { $sum: '$commission' }, count: { $sum: 1 } } },
  ]);

  const report = {
    vendor: vendorId,
    orders: orderAgg[0] || { totalCommission: 0, count: 0 },
    bookings: bookingAgg[0] || { totalCommission: 0, count: 0 },
    totalCommission: (orderAgg[0]?.totalCommission || 0) + (bookingAgg[0]?.totalCommission || 0),
    totalCount: (orderAgg[0]?.count || 0) + (bookingAgg[0]?.count || 0),
    start: startDate,
    end: endDate,
  };

  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="commission_report_${vendorId}_${start}_${end}.csv"`,
    );
    const csvStream = parse({ headers: true });
    csvStream.pipe(res);
    csvStream.write({
      vendor: report.vendor,
      totalCommission: report.totalCommission,
      totalCount: report.totalCount,
      start: report.start,
      end: report.end,
    });
    csvStream.end();
    return;
  }

  res.json(report);
}
