import { Request, Response } from 'express';
import { Booking, BookingZ } from '../models/Booking';
import { calculateCommission } from '../services/commission/calc';

export async function createBooking(req: Request, res: Response) {
  const parse = BookingZ.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.issues });
  const bookingData = parse.data;
  // Calculate commission if booking is confirmed or completed
  if (bookingData.status === 'confirmed' || bookingData.status === 'completed') {
    const result = await calculateCommission({
      price: bookingData.amountPaid ?? bookingData.total,
      category: bookingData.category ?? '',
      vendorId: bookingData.vendor ?? '',
      quantity: 1,
    });
    bookingData.commission = result.commission;
    bookingData.commissionBreakdown = result.breakdown;
    bookingData.commissionStatus = bookingData.status === 'completed' ? 'applied' : 'pending';
    bookingData.commissionRefundable = false;
  }
  if (bookingData.status === 'cancelled') {
    bookingData.commissionRefundable = true;
  }
  const booking = await Booking.create(bookingData);
  res.status(201).json({ booking });
}

// More logic to be added in later chunks
