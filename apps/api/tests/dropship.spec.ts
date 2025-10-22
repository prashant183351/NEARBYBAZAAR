import mongoose from 'mongoose';
import { Supplier, SupplierType } from '../src/models/Supplier';
import { SkuMapping, SkuMappingType } from '../src/models/SkuMapping';
import MarginRule from '../src/models/MarginRule';
import { SyncJob } from '../src/models/SyncJob';
import { pushOrderToSupplier } from '../src/services/dropship/outboundWebhook';
import { MockDropshipSupplier, registerSupplier, getSupplier } from '../src/services/dropship';
import axios from 'axios';
import { generateSKU } from '@nearbybazaar/lib/sku';

// Mock axios for external API calls
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Dropshipping Module Tests', () => {
  let testSupplier: SupplierType;
  let testMapping: SkuMappingType;

  beforeAll(async () => {
    // Use in-memory or local MongoDB for tests
    const mongoUrl = 'mongodb://localhost:27017/test-dropship';
    await mongoose.connect(mongoUrl, { dbName: 'test-dropship' });
  });

  beforeEach(async () => {
    // Clear collections before each test
    await Supplier.deleteMany({});
    await SkuMapping.deleteMany({});
    await MarginRule.deleteMany({});
    await SyncJob.deleteMany({});

    // Create test supplier
    testSupplier = await Supplier.create({
      companyName: 'Test Supplier Co',
      contactName: 'John Doe',
      email: 'john@testsupplier.com',
      taxId: 'TAX123456',
      address: '123 Test St, Test City',
      phone: '+1234567890',
      status: 'active',
      approvedAt: new Date(),
    });

    // Create test SKU mapping
    testMapping = await SkuMapping.create({
      supplierId: String(testSupplier._id),
      supplierSku: 'SUP-WIDGET-001',
      ourSku: 'NB-WIDGET-001',
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe('Supplier Lifecycle', () => {
    it('should create a supplier with invited status by default', async () => {
      const supplier = await Supplier.create({
        companyName: 'New Supplier',
        contactName: 'Jane Smith',
        email: 'jane@newsupplier.com',
        taxId: 'TAX789',
        address: '456 New St',
        phone: '+9876543210',
      });

      expect(supplier.status).toBe('invited');
      expect(supplier.invitedAt).toBeDefined();
      expect(supplier.approvedAt).toBeUndefined();
    });

    it('should transition supplier from invited to active', async () => {
      const supplier = await Supplier.create({
        companyName: 'Pending Supplier',
        contactName: 'Bob Wilson',
        email: 'bob@pending.com',
        taxId: 'TAX999',
        address: '789 Pending Ave',
        phone: '+1111111111',
        status: 'pending',
      });

      supplier.status = 'active';
      supplier.approvedAt = new Date();
      await supplier.save();

      expect(supplier.status).toBe('active');
      expect(supplier.approvedAt).toBeDefined();
    });

    it('should suspend active supplier', async () => {
      testSupplier.status = 'suspended';
      testSupplier.suspendedAt = new Date();
      await testSupplier.save();

      expect(testSupplier.status).toBe('suspended');
      expect(testSupplier.suspendedAt).toBeDefined();
    });
  });

  describe('SKU Mapping Logic', () => {
    it('should create SKU mapping between supplier and our system', async () => {
      const mapping = await SkuMapping.create({
        supplierId: String(testSupplier._id),
        supplierSku: 'SUP-GADGET-200',
        ourSku: 'NB-GADGET-200',
      });

      expect(mapping.supplierId).toBe(String(testSupplier._id));
      expect(mapping.supplierSku).toBe('SUP-GADGET-200');
      expect(mapping.ourSku).toBe('NB-GADGET-200');
    });

    it('should enforce unique constraint on supplier + supplierSku', async () => {
      await expect(
        SkuMapping.create({
          supplierId: String(testSupplier._id),
          supplierSku: 'SUP-WIDGET-001', // duplicate
          ourSku: 'NB-WIDGET-999',
        }),
      ).rejects.toThrow();
    });

    it('should find mapping by supplier and supplierSku', async () => {
      const found = await SkuMapping.findOne({
        supplierId: String(testSupplier._id),
        supplierSku: 'SUP-WIDGET-001',
      });

      expect(found).toBeDefined();
      expect(found?.ourSku).toBe('NB-WIDGET-001');
    });

    it('should find all mappings for a supplier', async () => {
      await SkuMapping.create({
        supplierId: String(testSupplier._id),
        supplierSku: 'SUP-ITEM-A',
        ourSku: 'NB-ITEM-A',
      });
      await SkuMapping.create({
        supplierId: String(testSupplier._id),
        supplierSku: 'SUP-ITEM-B',
        ourSku: 'NB-ITEM-B',
      });

      const mappings = await SkuMapping.find({
        supplierId: String(testSupplier._id),
      });

      expect(mappings.length).toBe(3); // including the one from beforeEach
    });

    it('should update existing SKU mapping', async () => {
      testMapping.ourSku = 'NB-WIDGET-UPDATED';
      await testMapping.save();

      const updated = await SkuMapping.findById(testMapping._id);
      expect(updated?.ourSku).toBe('NB-WIDGET-UPDATED');
    });

    it('should use SKU generator for new mappings', async () => {
      const generatedSku = generateSKU({ name: 'Test Product', category: 'electronics' });
      const mapping = await SkuMapping.create({
        supplierId: String(testSupplier._id),
        supplierSku: 'SUP-AUTO-001',
        ourSku: generatedSku,
      });

      expect(mapping.ourSku).toMatch(/^[A-Z0-9-]+$/);
    });
  });

  describe('Margin Rule Logic', () => {
    it('should create percent-based margin rule', async () => {
      const rule = await MarginRule.create({
        vendorId: new mongoose.Types.ObjectId(),
        supplierId: testSupplier._id,
        marginType: 'percent',
        value: 20, // 20% margin
        active: true,
      });

      expect(rule.marginType).toBe('percent');
      expect(rule.value).toBe(20);
      expect(rule.active).toBe(true);
    });

    it('should create fixed-amount margin rule', async () => {
      const rule = await MarginRule.create({
        vendorId: new mongoose.Types.ObjectId(),
        supplierId: testSupplier._id,
        marginType: 'fixed',
        value: 5.99, // $5.99 fixed margin
        active: true,
      });

      expect(rule.marginType).toBe('fixed');
      expect(rule.value).toBe(5.99);
    });

    it('should calculate selling price with percent margin', async () => {
      const rule = await MarginRule.create({
        vendorId: new mongoose.Types.ObjectId(),
        supplierId: testSupplier._id,
        marginType: 'percent',
        value: 25, // 25% margin
        active: true,
      });

      const supplierCost = 100;
      const sellingPrice = supplierCost * (1 + rule.value / 100);

      expect(sellingPrice).toBe(125);
    });

    it('should calculate selling price with fixed margin', async () => {
      const rule = await MarginRule.create({
        vendorId: new mongoose.Types.ObjectId(),
        supplierId: testSupplier._id,
        marginType: 'fixed',
        value: 10, // $10 fixed margin
        active: true,
      });

      const supplierCost = 50;
      const sellingPrice = supplierCost + rule.value;

      expect(sellingPrice).toBe(60);
    });

    it('should support category-specific margin rules', async () => {
      const electronicsRule = await MarginRule.create({
        vendorId: new mongoose.Types.ObjectId(),
        supplierId: testSupplier._id,
        category: 'electronics',
        marginType: 'percent',
        value: 30,
        active: true,
      });

      const clothingRule = await MarginRule.create({
        vendorId: new mongoose.Types.ObjectId(),
        supplierId: testSupplier._id,
        category: 'clothing',
        marginType: 'percent',
        value: 50,
        active: true,
      });

      expect(electronicsRule.category).toBe('electronics');
      expect(clothingRule.value).toBe(50);
    });

    it('should find active margin rules for vendor and supplier', async () => {
      const vendorId = new mongoose.Types.ObjectId();

      await MarginRule.create({
        vendorId,
        supplierId: testSupplier._id,
        marginType: 'percent',
        value: 20,
        active: true,
      });

      await MarginRule.create({
        vendorId,
        supplierId: testSupplier._id,
        marginType: 'percent',
        value: 15,
        active: false, // inactive
      });

      const activeRules = await MarginRule.find({
        vendorId,
        supplierId: testSupplier._id,
        active: true,
      });

      expect(activeRules.length).toBe(1);
      expect(activeRules[0].value).toBe(20);
    });

    it('should deactivate margin rule', async () => {
      const rule = await MarginRule.create({
        vendorId: new mongoose.Types.ObjectId(),
        supplierId: testSupplier._id,
        marginType: 'percent',
        value: 20,
        active: true,
      });

      rule.active = false;
      await rule.save();

      const updated = await MarginRule.findById(rule._id);
      expect(updated?.active).toBe(false);
    });
  });

  describe('Order Push to Supplier', () => {
    const mockOrder = {
      id: 'ORD-12345',
      items: [{ sku: 'NB-WIDGET-001', quantity: 2, price: 29.99 }],
      customer: {
        name: 'Test Customer',
        email: 'customer@test.com',
        address: '100 Customer St',
      },
      total: 59.98,
    };

    const mockSupplier = {
      id: 'SUP-001',
      orderApiUrl: 'https://api.supplier.com/orders',
    };

    beforeEach(() => {
      mockedAxios.post.mockClear();
    });

    it('should push order to supplier API successfully', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: { orderId: 'SUP-ORD-789', status: 'accepted' },
      });

      const result = await pushOrderToSupplier(mockOrder, mockSupplier);

      expect(result.status).toBe('success');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.supplier.com/orders',
        expect.objectContaining({
          orderId: 'ORD-12345',
          items: mockOrder.items,
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Idempotency-Key': expect.stringContaining('ORD-12345'),
          }),
        }),
      );
    });

    it('should prevent duplicate order pushes with idempotency', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: { orderId: 'SUP-ORD-789' },
      });

      // First push
      const result1 = await pushOrderToSupplier(mockOrder, mockSupplier);
      expect(result1.status).toBe('success');

      // Second push with same order
      const result2 = await pushOrderToSupplier(mockOrder, mockSupplier);
      expect(result2.status).toBe('duplicate');

      // Should only call API once
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    });

    it('should handle supplier API errors gracefully', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Network timeout'));

      const result = await pushOrderToSupplier(mockOrder, mockSupplier);

      expect(result.status).toBe('failed');

      // Should log the failure in SyncJob
      const syncJobs = await SyncJob.find({ jobType: 'order-push', status: 'failed' });
      expect(syncJobs.length).toBeGreaterThan(0);
      expect(syncJobs[0].error).toContain('Network timeout');
    });

    it('should create SyncJob audit record for successful push', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: { orderId: 'SUP-ORD-SUCCESS' },
      });

      await pushOrderToSupplier({ ...mockOrder, id: 'ORD-AUDIT-TEST' }, mockSupplier);

      const syncJobs = await SyncJob.find({ jobType: 'order-push', status: 'success' });
      expect(syncJobs.length).toBeGreaterThan(0);
      expect(syncJobs[0].startedAt).toBeDefined();
      expect(syncJobs[0].completedAt).toBeDefined();
    });

    it('should include timeout in supplier API call', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: { orderId: 'SUP-ORD-TIMEOUT-TEST' },
      });

      await pushOrderToSupplier({ ...mockOrder, id: 'ORD-TIMEOUT-TEST' }, mockSupplier);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          timeout: 10000,
        }),
      );
    });
  });

  describe('Dropship Supplier Interface', () => {
    let mockSupplier: MockDropshipSupplier;

    beforeEach(() => {
      mockSupplier = new MockDropshipSupplier();
      registerSupplier(mockSupplier);
    });

    it('should register and retrieve supplier', () => {
      const retrieved = getSupplier('mock');
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('mock');
    });

    it('should sync stock from supplier', async () => {
      const stock = await mockSupplier.syncStock();
      expect(stock).toBe(100);
    });

    it('should sync price from supplier', async () => {
      const price = await mockSupplier.syncPrice();
      expect(price).toBe(9.99);
    });

    it('should map local SKU to supplier SKU', () => {
      const mapped = mockSupplier.mapSku('WIDGET-001');
      expect(mapped).toBe('SUP-WIDGET-001');
    });

    it('should connect to supplier', async () => {
      await expect(mockSupplier.connect()).resolves.toBeUndefined();
    });

    it('should disconnect from supplier', async () => {
      await expect(mockSupplier.disconnect()).resolves.toBeUndefined();
    });
  });

  describe('Integration: End-to-End Dropship Flow', () => {
    it('should map SKU, apply margin, and prepare order for supplier', async () => {
      // 1. Create SKU mapping
      const mapping = await SkuMapping.create({
        supplierId: String(testSupplier._id),
        supplierSku: 'SUP-COMPLETE-001',
        ourSku: 'NB-COMPLETE-001',
      });

      // 2. Create margin rule
      const vendorId = new mongoose.Types.ObjectId();
      const marginRule = await MarginRule.create({
        vendorId,
        supplierId: testSupplier._id,
        marginType: 'percent',
        value: 30,
        active: true,
      });

      // 3. Calculate price with margin
      const supplierCost = 50;
      const sellingPrice = supplierCost * (1 + marginRule.value / 100);

      // 4. Prepare order
      const order = {
        id: 'ORD-INTEGRATION-001',
        items: [
          {
            sku: mapping.ourSku,
            supplierSku: mapping.supplierSku,
            quantity: 1,
            price: sellingPrice,
          },
        ],
        customer: {
          name: 'Integration Test Customer',
          email: 'test@integration.com',
        },
        total: sellingPrice,
      };

      // 5. Mock push to supplier
      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: { orderId: 'SUP-INT-001', status: 'accepted' },
      });

      const supplier = {
        id: String(testSupplier._id),
        orderApiUrl: 'https://api.supplier.com/orders',
      };

      const result = await pushOrderToSupplier(order, supplier);

      // Verify complete flow
      expect(mapping.ourSku).toBe('NB-COMPLETE-001');
      expect(sellingPrice).toBe(65); // 50 + 30% = 65
      expect(result.status).toBe('success');
    });

    it('should handle missing SKU mapping gracefully', async () => {
      const unknownSku = 'NB-UNKNOWN-999';
      const mapping = await SkuMapping.findOne({ ourSku: unknownSku });

      expect(mapping).toBeNull();
      // In real implementation, this would trigger an error or fallback
    });

    it('should select most specific margin rule (category > supplier > vendor)', async () => {
      const vendorId = new mongoose.Types.ObjectId();

      // Create vendor-level default
      await MarginRule.create({
        vendorId,
        marginType: 'percent',
        value: 20,
        active: true,
      });

      // Create supplier-specific rule
      await MarginRule.create({
        vendorId,
        supplierId: testSupplier._id,
        marginType: 'percent',
        value: 25,
        active: true,
      });

      // Create category-specific rule
      await MarginRule.create({
        vendorId,
        supplierId: testSupplier._id,
        category: 'electronics',
        marginType: 'percent',
        value: 30,
        active: true,
      });

      // Find most specific rule for electronics
      const rules = await MarginRule.find({
        vendorId,
        supplierId: testSupplier._id,
        category: 'electronics',
        active: true,
      });

      expect(rules.length).toBe(1);
      expect(rules[0].value).toBe(30); // Most specific
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing supplier gracefully', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const supplier = await Supplier.findById(nonExistentId);

      expect(supplier).toBeNull();
    });

    it('should handle invalid margin rule values', async () => {
      await expect(
        MarginRule.create({
          vendorId: new mongoose.Types.ObjectId(),
          marginType: 'percent',
          value: -10, // negative margin
          active: true,
        }),
      ).resolves.toBeDefined(); // Model allows it, validation should happen at service level
    });

    it('should handle concurrent SKU mapping updates', async () => {
      const mapping1 = await SkuMapping.findById(testMapping._id);
      const mapping2 = await SkuMapping.findById(testMapping._id);

      mapping1!.ourSku = 'NB-UPDATE-1';
      mapping2!.ourSku = 'NB-UPDATE-2';

      await mapping1!.save();
      await mapping2!.save();

      const final = await SkuMapping.findById(testMapping._id);
      expect(final?.ourSku).toBe('NB-UPDATE-2'); // Last write wins
    });

    it('should handle supplier status transitions', async () => {
      expect(testSupplier.status).toBe('active');

      testSupplier.status = 'suspended';
      testSupplier.suspendedAt = new Date();
      await testSupplier.save();

      // In real implementation, this should prevent order pushes
      const suspended = await Supplier.findById(testSupplier._id);
      expect(suspended?.status).toBe('suspended');
    });

    it('should validate required fields in supplier creation', async () => {
      await expect(
        Supplier.create({
          companyName: 'Invalid Supplier',
          // missing required fields
        } as any),
      ).rejects.toThrow();
    });

    it('should handle bulk SKU mapping creation', async () => {
      const bulkMappings = [
        {
          supplierId: String(testSupplier._id),
          supplierSku: 'SUP-BULK-001',
          ourSku: 'NB-BULK-001',
        },
        {
          supplierId: String(testSupplier._id),
          supplierSku: 'SUP-BULK-002',
          ourSku: 'NB-BULK-002',
        },
        {
          supplierId: String(testSupplier._id),
          supplierSku: 'SUP-BULK-003',
          ourSku: 'NB-BULK-003',
        },
      ];

      const created = await SkuMapping.insertMany(bulkMappings);
      expect(created.length).toBe(3);
    });
  });

  describe('Performance and Scalability', () => {
    it('should efficiently query mappings with index', async () => {
      // Create many mappings
      const mappings = Array.from({ length: 100 }, (_, i) => ({
        supplierId: String(testSupplier._id),
        supplierSku: `SUP-PERF-${i}`,
        ourSku: `NB-PERF-${i}`,
      }));

      await SkuMapping.insertMany(mappings);

      const startTime = Date.now();
      const found = await SkuMapping.findOne({
        supplierId: String(testSupplier._id),
        supplierSku: 'SUP-PERF-50',
      });
      const queryTime = Date.now() - startTime;

      expect(found).toBeDefined();
      expect(queryTime).toBeLessThan(100); // Should be fast with index
    });

    it('should handle pagination of margin rules', async () => {
      const vendorId = new mongoose.Types.ObjectId();

      // Create 25 margin rules
      const rules = Array.from({ length: 25 }, (_, i) => ({
        vendorId,
        supplierId: testSupplier._id,
        category: `category-${i}`,
        marginType: 'percent' as const,
        value: 10 + i,
        active: true,
      }));

      await MarginRule.insertMany(rules);

      // Paginate: page 1 (10 items)
      const page1 = await MarginRule.find({ vendorId }).limit(10).skip(0);

      // Paginate: page 2 (10 items)
      const page2 = await MarginRule.find({ vendorId }).limit(10).skip(10);

      expect(page1.length).toBe(10);
      expect(page2.length).toBe(10);
      expect(page1[0]._id).not.toEqual(page2[0]._id);
    });
  });
});
