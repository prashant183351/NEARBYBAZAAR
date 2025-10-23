// @ts-nocheck
// Mock Order model with chainable .populate and .sort
let mockFind = jest.fn();
jest.mock('../src/models/Order', () => ({
  __esModule: true,
  Order: Object.assign(jest.fn(), {
    find: (...args) => {
      const data = mockFind(...args);
      const chain = {
        populate: function () { return this; },
        sort: function () { return this; },
        exec: function () { return Promise.resolve(data); },
        then: function (resolve, reject) { return Promise.resolve(data).then(resolve, reject); }
      };
      return chain;
    }
  })
}));
let b2b = require('../src/services/analytics/b2bAnalytics');
let { Order } = require('../src/models/Order');

const mockOrders = [
  // Bulk order
  {
    _id: '1',
    vendor: 'v1',
    isBulkOrder: true,
    createdAt: new Date('2025-10-01'),
    deleted: false,
    status: 'confirmed',
    total: 1000,
    subtotal: 900,
    tax: 100,
    bulkOrderType: 'wholesale',
    industry: 'Retail',
    region: 'North',
    user: { name: 'Buyer1', companyName: 'CompA' },
    paymentStatus: 'paid',
    paidAmount: 1000,
    outstandingAmount: 0,
    creditUsed: 0,
    paymentTerms: { dueDate: new Date('2025-10-10') },
    items: [{ product: {} }],
  },
  // Retail order
  {
    _id: '2',
    vendor: 'v1',
    isBulkOrder: false,
    createdAt: new Date('2025-10-02'),
    deleted: false,
    status: 'confirmed',
    total: 200,
    subtotal: 180,
    tax: 20,
    user: { name: 'Buyer2', companyName: 'CompB' },
    paymentStatus: 'paid',
    paidAmount: 200,
    outstandingAmount: 0,
    creditUsed: 0,
    items: [{ product: {} }],
  },
  // Cancelled bulk order
  {
    _id: '3',
    vendor: 'v1',
    isBulkOrder: true,
    createdAt: new Date('2025-10-03'),
    deleted: false,
    status: 'cancelled',
    total: 500,
    subtotal: 450,
    tax: 50,
    bulkOrderType: 'custom',
    industry: 'Manufacturing',
    region: 'South',
    user: { name: 'Buyer3', companyName: 'CompC' },
    paymentStatus: 'unpaid',
    paidAmount: 0,
    outstandingAmount: 500,
    creditUsed: 100,
    paymentTerms: { dueDate: new Date('2025-10-15') },
    items: [{ product: {} }],
  },
];

describe('b2bAnalytics Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFind.mockReset();
  });

  describe('getVendorB2BSummary', () => {
    it('returns correct summary for mixed bulk/retail orders', async () => {
  mockFind.mockResolvedValueOnce(mockOrders);
      const res = await b2b.getVendorB2BSummary('v1');
  expect(res.totalBulkRevenue).toBe(1500);
      expect(res.totalRetailRevenue).toBe(200);
  expect(res.bulkOrderCount).toBe(2);
      expect(res.retailOrderCount).toBe(1);
      expect(res.topBulkOrderType).toBe('wholesale');
      expect(res.topIndustry).toBe('Retail');
      expect(res.topRegion).toBe('North');
    });
    it('handles no orders', async () => {
  mockFind.mockResolvedValueOnce([]);
      const res = await b2b.getVendorB2BSummary('v1');
      expect(res.totalBulkRevenue).toBe(0);
      expect(res.totalRetailRevenue).toBe(0);
      expect(res.retailOrderCount).toBe(0);
      expect(res.topBulkOrderType).toBeNull();
      expect(res.topIndustry).toBeNull();
      expect(res.topRegion).toBeNull();
    });
  });

  describe('getAdminB2BBreakdown', () => {
    it('returns correct breakdown for regions/industries/types', async () => {
  mockFind.mockResolvedValueOnce([mockOrders[0]]);
      const res = await b2b.getAdminB2BBreakdown();
      expect(res.totalBulkRevenue).toBe(1000);
      expect(res.byRegion[0].region).toBe('North');
      expect(res.byIndustry[0].industry).toBe('Retail');
      expect(res.byBulkOrderType[0].type).toBe('wholesale');
    });
    it('handles no orders', async () => {
  mockFind.mockResolvedValueOnce([]);
      const res = await b2b.getAdminB2BBreakdown();
      expect(res.totalBulkRevenue).toBe(0);
      expect(res.byRegion).toEqual([]);
      expect(res.byIndustry).toEqual([]);
      expect(res.byBulkOrderType).toEqual([]);
    });
  });

  describe('getVendorB2BExport', () => {
    it('returns correct export data', async () => {
  mockFind.mockResolvedValueOnce([mockOrders[0]]);
      const res = await b2b.getVendorB2BExport('v1');
      expect(res[0].orderId).toBe('1');
      expect(res[0].buyerName).toBe('Buyer1');
      expect(res[0].buyerCompany).toBe('CompA');
      expect(res[0].industry).toBe('Retail');
      expect(res[0].region).toBe('North');
      expect(res[0].dueDate).toBe('2025-10-10');
    });
    it('handles missing optional fields', async () => {
      const order = { ...mockOrders[0], industry: undefined, region: undefined, paymentTerms: undefined };
  mockFind.mockResolvedValueOnce([order]);
      const res = await b2b.getVendorB2BExport('v1');
      expect(res[0].industry).toBeUndefined();
      expect(res[0].region).toBeUndefined();
    });
    it('handles no orders', async () => {
  mockFind.mockResolvedValueOnce([]);
      const res = await b2b.getVendorB2BExport('v1');
      expect(res).toEqual([]);
    });
  });
});
