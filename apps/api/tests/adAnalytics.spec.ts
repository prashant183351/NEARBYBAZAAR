import { logImpression, logClick, logOrder, getVendorAnalytics, getAdminAnalytics } from '../src/services/adAnalytics';
import mongoose from 'mongoose';

describe('adAnalytics Service', () => {
  const mockUpdate = jest.fn();
  const mockFind = jest.fn();
  const mockAggregate = jest.fn();

  beforeAll(() => {
    jest.spyOn(mongoose.Model, 'findOneAndUpdate').mockImplementation(mockUpdate);
    jest.spyOn(mongoose.Model, 'find').mockImplementation(mockFind);
    jest.spyOn(mongoose.Model, 'aggregate').mockImplementation(mockAggregate);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('logImpression increments impressions', async () => {
    mockUpdate.mockResolvedValue({ adId: 'ad1', vendorId: 'v1', impressions: 1 });
    await logImpression('ad1', 'v1');
    expect(mockUpdate).toHaveBeenCalledWith(
      { adId: 'ad1', vendorId: 'v1' },
      { $inc: { impressions: 1 } },
      { upsert: true, new: true },
    );
  });

  it('logClick increments clicks', async () => {
    mockUpdate.mockResolvedValue({ adId: 'ad1', vendorId: 'v1', clicks: 1 });
    await logClick('ad1', 'v1');
    expect(mockUpdate).toHaveBeenCalledWith(
      { adId: 'ad1', vendorId: 'v1' },
      { $inc: { clicks: 1 } },
      { upsert: true, new: true },
    );
  });

  it('logOrder increments orders and revenue', async () => {
    mockUpdate.mockResolvedValue({ adId: 'ad1', vendorId: 'v1', orders: 1, revenue: 100 });
    await logOrder('ad1', 'v1', 100);
    expect(mockUpdate).toHaveBeenCalledWith(
      { adId: 'ad1', vendorId: 'v1' },
      { $inc: { orders: 1, revenue: 100 } },
      { upsert: true, new: true },
    );
  });

  it('getVendorAnalytics returns vendor analytics', async () => {
    mockFind.mockResolvedValue([{ adId: 'ad1', vendorId: 'v1', clicks: 2 }]);
    const result = await getVendorAnalytics('v1');
    expect(mockFind).toHaveBeenCalledWith({ vendorId: 'v1' });
    expect(result).toEqual([{ adId: 'ad1', vendorId: 'v1', clicks: 2 }]);
  });

  it('getAdminAnalytics returns aggregated analytics', async () => {
    const aggResult = [{ totalClicks: 10, totalImpressions: 100, totalOrders: 5, totalRevenue: 500 }];
    mockAggregate.mockResolvedValue(aggResult);
    const result = await getAdminAnalytics();
    expect(mockAggregate).toHaveBeenCalledWith([
      {
        $group: {
          _id: null,
          totalClicks: { $sum: '$clicks' },
          totalImpressions: { $sum: '$impressions' },
          totalOrders: { $sum: '$orders' },
          totalRevenue: { $sum: '$revenue' },
        },
      },
    ]);
    expect(result).toEqual(aggResult);
  });
});
