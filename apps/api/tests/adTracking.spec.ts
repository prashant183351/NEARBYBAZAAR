import * as adTracking from '../src/services/adTracking';

jest.mock('../src/models/AdCampaign', () => ({
  AdCampaign: {
    findById: jest.fn(),
  },
}));
// Patch AdClick mock to allow static methods
const mockSave = jest.fn().mockResolvedValue(undefined);
function MockAdClick(data: any) {
  return {
    ...data,
    _id: 'clickid',
    save: mockSave,
  };
}
(MockAdClick as any).findOne = jest.fn();
(MockAdClick as any).findById = jest.fn();
(MockAdClick as any).create = jest.fn();

jest.mock('../src/models/AdClick', () => ({
  AdClick: MockAdClick,
}));
jest.mock('../src/models/Vendor', () => ({
  Vendor: {
    findById: jest.fn(),
    updateOne: jest.fn(),
  },
}));
jest.mock('../src/services/adAuction', () => ({
  calculateClickCost: jest.fn(() => 1.23),
}));

describe('adTracking service', () => {
  // Use the correct reference for the static methods
  const { AdCampaign } = require('../src/models/AdCampaign');
  const { Vendor } = require('../src/models/Vendor');
  const { AdClick: MockAdClick } = require('../src/models/AdClick');

  // No need for global patching; AdClick is now a constructor mock

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('recordImpression', () => {
    it('returns error if campaign not found', async () => {
      AdCampaign.findById.mockImplementation(() => ({ populate: async () => null }));
      (MockAdClick as any).findOne.mockResolvedValue(null); // No duplicate
      const result = await adTracking.recordClick({
        campaignId: 'cid',
        placement: 'main',
        userId: 'uid',
      });
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/not found/);
    });
    it('returns error if duplicate click', async () => {
      const mockCampaign = { vendorId: 'vid' };
      AdCampaign.findById.mockImplementation(() => ({ populate: async () => mockCampaign }));
      (MockAdClick as any).findOne.mockResolvedValue({ _id: 'clickid' }); // Simulate duplicate
      Vendor.findById.mockResolvedValue({
        wallet: { charge: jest.fn().mockResolvedValue(true) },
        updateOne: jest.fn().mockResolvedValue(undefined),
      });
      const result = await adTracking.recordClick({
        campaignId: 'cid',
        placement: 'main',
        userId: 'uid',
      });
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/Duplicate click detected/);
    });
  });

  describe('recordClick', () => {
    it('returns error if campaign not found', async () => {
      // Campaign not found, so duplicate check should not matter
      AdCampaign.findById.mockImplementation(() => ({ populate: async () => null }));
      (MockAdClick as any).findOne.mockResolvedValue(null); // Ensure no duplicate
      const result = await adTracking.recordClick({
        campaignId: 'cid',
        placement: 'main',
        userId: 'uid',
      });
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/not found/);
    });
    it('returns error if duplicate click', async () => {
      const mockCampaign = { vendorId: 'vid' };
      AdCampaign.findById.mockImplementation(() => ({ populate: async () => mockCampaign }));
      (MockAdClick as any).findOne.mockResolvedValue({ _id: 'clickid' }); // Simulate duplicate
      // Vendor lookup should not matter for duplicate
      Vendor.findById.mockResolvedValue({
        wallet: { charge: jest.fn().mockResolvedValue(true) },
        updateOne: jest.fn().mockResolvedValue(undefined),
      });
      // Must include userId to match duplicate detection logic
      const result = await adTracking.recordClick({
        campaignId: 'cid',
        placement: 'main',
        userId: 'uid',
      });
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/Duplicate click detected/);
    });
    it('creates AdClick, updates vendor, returns success', async () => {
      const mockCampaign = {
        vendorId: 'vid',
        vendor: 'vid',
        _id: 'cid',
        product: 'pid',
        recordClick: jest.fn().mockResolvedValue(undefined),
        canServe: jest.fn().mockReturnValue(true),
      };
      AdCampaign.findById.mockImplementation(() => ({ populate: async () => mockCampaign }));
      (MockAdClick as any).findOne.mockResolvedValue(null); // Not a duplicate
      Vendor.findById.mockResolvedValue({
        wallet: { charge: jest.fn().mockResolvedValue(true) },
        updateOne: jest.fn().mockResolvedValue(undefined),
      });
      const result = await adTracking.recordClick({ campaignId: 'cid', placement: 'main' });
      expect(result.success).toBe(true);
      expect(result.clickId).toBe('clickid');
      expect(result.cost).toBe(1.23);
      expect(result.message).toMatch(/Click recorded successfully/);
    });
    it('returns error if exception thrown', async () => {
      AdCampaign.findById.mockImplementation(() => ({
        populate: async () => {
          throw new Error('fail');
        },
      }));
      await expect(
        adTracking.recordClick({ campaignId: 'cid', placement: 'main' }),
      ).resolves.toMatchObject({
        success: false,
        message: expect.stringMatching(/Internal error/),
      });
    });

    it('skips duplicate detection if no userId/sessionId', async () => {
      const mockCampaign = {
        vendorId: 'vid',
        vendor: 'vid',
        _id: 'cid',
        product: 'pid',
        recordClick: jest.fn().mockResolvedValue(undefined),
        canServe: jest.fn().mockReturnValue(true),
      };
      AdCampaign.findById.mockImplementation(() => ({ populate: async () => mockCampaign }));
      (MockAdClick as any).findOne.mockResolvedValue({ _id: 'clickid' }); // Should be ignored
      Vendor.findById.mockResolvedValue({
        wallet: { charge: jest.fn().mockResolvedValue(true) },
        updateOne: jest.fn().mockResolvedValue(undefined),
      });
      const result = await adTracking.recordClick({ campaignId: 'cid', placement: 'main' });
      expect(result.success).toBe(true);
      expect(result.clickId).toBe('clickid');
    });

    it('returns error if campaign budget exhausted', async () => {
      const mockCampaign = {
        vendorId: 'vid',
        vendor: 'vid',
        _id: 'cid',
        product: 'pid',
        recordClick: jest.fn().mockResolvedValue(undefined),
        canServe: jest.fn().mockReturnValue(false),
      };
      AdCampaign.findById.mockImplementation(() => ({ populate: async () => mockCampaign }));
      (MockAdClick as any).findOne.mockResolvedValue(null);
      Vendor.findById.mockResolvedValue({
        wallet: { charge: jest.fn().mockResolvedValue(true) },
        updateOne: jest.fn().mockResolvedValue(undefined),
      });
      const result = await adTracking.recordClick({
        campaignId: 'cid',
        placement: 'main',
        userId: 'uid',
      });
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/budget exhausted/);
    });

    it('returns error if vendor wallet charge fails', async () => {
      const mockCampaign = {
        vendorId: '507f1f77bcf86cd799439011',
        vendor: '507f1f77bcf86cd799439011',
        _id: '507f1f77bcf86cd799439012',
        product: '507f1f77bcf86cd799439013',
        recordClick: jest.fn().mockResolvedValue(undefined),
        canServe: jest.fn().mockReturnValue(true),
      };
      AdCampaign.findById.mockImplementation(() => ({ populate: async () => mockCampaign }));
      (MockAdClick as any).findOne.mockResolvedValue(null);
      Vendor.findById.mockResolvedValue(null); // Simulate vendor not found, triggers chargeVendorWallet to return false
      const result = await adTracking.recordClick({
        campaignId: '507f1f77bcf86cd799439012',
        placement: 'main',
        userId: 'uid',
      });
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/Failed to charge vendor wallet/);
    });

    it('creates click with sessionId (no userId)', async () => {
      const mockCampaign = {
        vendorId: 'vid',
        vendor: 'vid',
        _id: 'cid',
        product: 'pid',
        recordClick: jest.fn().mockResolvedValue(undefined),
        canServe: jest.fn().mockReturnValue(true),
      };
      AdCampaign.findById.mockImplementation(() => ({ populate: async () => mockCampaign }));
      (MockAdClick as any).findOne.mockResolvedValue(null);
      Vendor.findById.mockResolvedValue({
        wallet: { charge: jest.fn().mockResolvedValue(true) },
        updateOne: jest.fn().mockResolvedValue(undefined),
      });
      const result = await adTracking.recordClick({
        campaignId: 'cid',
        placement: 'main',
        sessionId: 'sess123',
      });
      expect(result.success).toBe(true);
      expect(result.clickId).toBe('clickid');
    });
    describe('recordImpression', () => {
      it('returns false if campaign not found', async () => {
        AdCampaign.findById.mockResolvedValue(null);
        const result = await adTracking.recordImpression({ campaignId: 'cid', placement: 'main' });
        expect(result).toBe(false);
      });
      it('returns false if error thrown', async () => {
        AdCampaign.findById.mockImplementation(() => {
          throw new Error('fail');
        });
        const result = await adTracking.recordImpression({ campaignId: 'cid', placement: 'main' });
        expect(result).toBe(false);
      });
      it('returns true if impression recorded', async () => {
        const mockCampaign = { recordImpression: jest.fn().mockResolvedValue(undefined) };
        AdCampaign.findById.mockResolvedValue(mockCampaign);
        const result = await adTracking.recordImpression({ campaignId: 'cid', placement: 'main' });
        expect(result).toBe(true);
      });
    });

    describe('recordConversion', () => {
      it('returns false if click not found', async () => {
        (MockAdClick as any).findById.mockResolvedValue(null);
        const result = await adTracking.recordConversion('clickid', 'orderid');
        expect(result).toBe(false);
      });
      it('returns false if error thrown', async () => {
        (MockAdClick as any).findById.mockImplementation(() => {
          throw new Error('fail');
        });
        const result = await adTracking.recordConversion('clickid', 'orderid');
        expect(result).toBe(false);
      });
      it('returns true if conversion recorded', async () => {
        const mockClick = {
          save: jest.fn().mockResolvedValue(undefined),
          convertedToOrder: false,
          orderId: undefined,
        };
        (MockAdClick as any).findById.mockResolvedValue(mockClick);
        const result = await adTracking.recordConversion('clickid', '507f1f77bcf86cd799439011'); // valid ObjectId string
        expect(result).toBe(true);
      });
    });
  });
});
