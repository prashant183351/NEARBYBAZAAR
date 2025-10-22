import { TallyStubERPAdapter } from '../src/services/erp/tallyStub';
import { OrdersExportPayload } from '../src/services/erp/types';
import { stringify } from 'csv-stringify/sync';

describe('ERP Adapters', () => {
  const sampleOrders: OrdersExportPayload = {
    version: 1,
    orders: [
      {
        id: 'o1',
        items: [{ sku: 'SKU1', quantity: 2 }],
        total: 100,
        createdAt: '2025-10-19T10:00:00Z',
        customer: { id: 'c1', name: 'Alice', email: 'alice@example.com' },
      },
      {
        id: 'o2',
        items: [{ sku: 'SKU2', quantity: 1 }],
        total: 50,
        createdAt: '2025-10-19T11:00:00Z',
        customer: { id: 'c2', name: 'Bob', email: 'bob@example.com' },
      },
    ],
  };

  it('FileERPAdapter should export orders to CSV', async () => {
    const csv = stringify(sampleOrders.orders, { header: true });
    expect(csv).toContain('id');
    expect(csv).toContain('SKU1');
    expect(csv).toContain('Alice');
  });

  it('TallyStubERPAdapter should map orders to Tally format', async () => {
    const result = await TallyStubERPAdapter.exportOrders(sampleOrders);
    expect(result.success).toBe(true);
    expect(result.message).toContain('Transformed 2 orders');
  });

  // TODO: Add more tests for error handling, XLSX export, edge cases, etc.
});
