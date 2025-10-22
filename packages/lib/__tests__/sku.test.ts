import { generateSKU } from '../src/sku';

describe('generateSKU', () => {
  it('is deterministic for same input', () => {
    const sku1 = generateSKU({
      name: 'Test Product',
      category: 'Books',
      date: '2025-10-19',
      id: '123',
    });
    const sku2 = generateSKU({
      name: 'Test Product',
      category: 'Books',
      date: '2025-10-19',
      id: '123',
    });
    expect(sku1).toBe(sku2);
  });

  it('is unique for different names', () => {
    const sku1 = generateSKU({
      name: 'Product A',
      category: 'Books',
      date: '2025-10-19',
      id: '123',
    });
    const sku2 = generateSKU({
      name: 'Product B',
      category: 'Books',
      date: '2025-10-19',
      id: '123',
    });
    expect(sku1).not.toBe(sku2);
  });

  it('is unique for different categories', () => {
    const sku1 = generateSKU({ name: 'Product', category: 'Books', date: '2025-10-19', id: '123' });
    const sku2 = generateSKU({
      name: 'Product',
      category: 'Electronics',
      date: '2025-10-19',
      id: '123',
    });
    expect(sku1).not.toBe(sku2);
  });

  it('is unique for different dates', () => {
    const sku1 = generateSKU({ name: 'Product', category: 'Books', date: '2025-10-19', id: '123' });
    const sku2 = generateSKU({ name: 'Product', category: 'Books', date: '2025-10-20', id: '123' });
    expect(sku1).not.toBe(sku2);
  });

  it('is unique for different ids', () => {
    const sku1 = generateSKU({ name: 'Product', category: 'Books', date: '2025-10-19', id: '123' });
    const sku2 = generateSKU({ name: 'Product', category: 'Books', date: '2025-10-19', id: '456' });
    expect(sku1).not.toBe(sku2);
  });
});
