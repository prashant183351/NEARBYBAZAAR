import * as affiliateService from '../src/services/affiliate';
import { Types } from 'mongoose';

jest.mock('../src/models/Affiliate', () => ({
  Affiliate: {
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));
jest.mock('../src/models/AffiliateLedger', () => ({
  AffiliateLedger: {
    create: jest.fn(),
  },
}));

describe('affiliate.ts service', () => {
  const { Affiliate } = require('../src/models/Affiliate');
  const { AffiliateLedger } = require('../src/models/AffiliateLedger');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('generateReferralCode creates code and saves affiliate', async () => {
    Affiliate.create.mockResolvedValue({});
    const userId = new Types.ObjectId();
    const code = await affiliateService.generateReferralCode(userId);
    expect(typeof code).toBe('string');
    expect(code.length).toBeGreaterThanOrEqual(8);
    expect(Affiliate.create).toHaveBeenCalledWith({ userId, code });
  });

  it('trackAffiliateClick increments clicks and logs ledger', async () => {
    Affiliate.findOneAndUpdate.mockResolvedValue({ _id: 'affid' });
    AffiliateLedger.create.mockResolvedValue({});
    await affiliateService.trackAffiliateClick('CODE123');
    expect(Affiliate.findOneAndUpdate).toHaveBeenCalledWith({ code: 'CODE123' }, { $inc: { clicks: 1 } });
    expect(AffiliateLedger.create).toHaveBeenCalledWith({ affiliateId: 'affid', type: 'click', amount: 0 });
  });

  it('trackAffiliateClick does not log ledger if affiliate not found', async () => {
    Affiliate.findOneAndUpdate.mockResolvedValue(null);
    await affiliateService.trackAffiliateClick('CODE404');
    expect(AffiliateLedger.create).not.toHaveBeenCalled();
  });

  it('trackAffiliateSignup increments signups and logs ledger', async () => {
    Affiliate.findOneAndUpdate.mockResolvedValue({ _id: 'affid' });
    AffiliateLedger.create.mockResolvedValue({});
    await affiliateService.trackAffiliateSignup('CODE123', 'newUserId');
    expect(Affiliate.findOneAndUpdate).toHaveBeenCalledWith({ code: 'CODE123' }, { $inc: { signups: 1 } });
    expect(AffiliateLedger.create).toHaveBeenCalledWith({ affiliateId: 'affid', type: 'signup', refId: 'newUserId', amount: 0 });
  });

  it('trackAffiliateSignup does not log ledger if affiliate not found', async () => {
    Affiliate.findOneAndUpdate.mockResolvedValue(null);
    await affiliateService.trackAffiliateSignup('CODE404', 'newUserId');
    expect(AffiliateLedger.create).not.toHaveBeenCalled();
  });

  it('trackAffiliateSale increments sales/commission and logs ledger', async () => {
    Affiliate.findOneAndUpdate.mockResolvedValue({ _id: 'affid' });
    AffiliateLedger.create.mockResolvedValue({});
    await affiliateService.trackAffiliateSale('CODE123', 'orderId', 42.5);
    expect(Affiliate.findOneAndUpdate).toHaveBeenCalledWith(
      { code: 'CODE123' },
      { $inc: { sales: 1, commissionEarned: 42.5 } },
    );
    expect(AffiliateLedger.create).toHaveBeenCalledWith({ affiliateId: 'affid', type: 'sale', refId: 'orderId', amount: 42.5 });
  });

  it('trackAffiliateSale does not log ledger if affiliate not found', async () => {
    Affiliate.findOneAndUpdate.mockResolvedValue(null);
    await affiliateService.trackAffiliateSale('CODE404', 'orderId', 10);
    expect(AffiliateLedger.create).not.toHaveBeenCalled();
  });

  it('recordAffiliatePayout updates commissionPaid and logs ledger', async () => {
    Affiliate.findByIdAndUpdate.mockResolvedValue({});
    AffiliateLedger.create.mockResolvedValue({});
    await affiliateService.recordAffiliatePayout('affid', 99.99);
    expect(Affiliate.findByIdAndUpdate).toHaveBeenCalledWith('affid', { $inc: { commissionPaid: 99.99 } });
    expect(AffiliateLedger.create).toHaveBeenCalledWith({ affiliateId: 'affid', type: 'payout', amount: 99.99 });
  });
});
