import { refundOrder } from '../src/controllers/payments';
import { Order } from '../src/models/Order';
import { PaymentIntent } from '../src/models/PaymentIntent';
import { CommissionLedger } from '../src/models/CommissionLedger';
import { AuditLog } from '../src/models/AuditLog';

jest.mock('../src/models/RefundPolicy', () => ({ RefundPolicy: { findOne: jest.fn().mockResolvedValue({ active: true, daysWindow: 30 }) } }));

describe('Refunds & partial refunds', () => {
  const mockRes = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  it('partially refunds one line and reverses commission proportionally', async () => {
    const orderId = '64f000000000000000000001';
    const lineId = '64f0000000000000000000ab';
    const order: any = {
      _id: orderId,
      currency: 'INR',
      items: [{ _id: lineId, price: 200, quantity: 2, commission: 40 }], // Rs. 400 line, Rs. 40 commission
      save: jest.fn().mockResolvedValue(true),
      createdAt: new Date(),
    };
  jest.spyOn(Order, 'findById').mockResolvedValue(order);

    const pi: any = { status: 'succeeded', refund: jest.fn().mockResolvedValue(true) };
  jest.spyOn(PaymentIntent, 'findOne').mockResolvedValue(pi);

    const ledgerCreate = jest.fn().mockResolvedValue(true);
  jest.spyOn(CommissionLedger, 'create').mockImplementation(ledgerCreate as any);
  jest.spyOn(AuditLog, 'create').mockResolvedValue({} as any);

    const req: any = { body: { orderId, refundAmount: 200, lineItemId: lineId }, user: { id: 'u1' } };
    const res = mockRes();

    await refundOrder(req, res as any);

    // Rs. 400 line; refund 200 => 50% refund => reverse 50% of 40 = 20
    expect(order.items[0].commission).toBe(20);
    expect(ledgerCreate).toHaveBeenCalledWith(expect.objectContaining({ orderId, lineItemId: lineId, amount: -20 }));
    expect(pi.refund).toHaveBeenCalledWith(200, undefined);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});
