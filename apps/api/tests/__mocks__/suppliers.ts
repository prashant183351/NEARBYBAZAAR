/**
 * Mock Implementations for External Supplier APIs
 *
 * These mocks simulate external supplier API behavior for testing
 * without making actual HTTP calls.
 */

import { DropshipSupplier } from '../../src/services/dropship/types';

/**
 * Mock supplier that simulates realistic API behavior
 */
export class RealisticMockSupplier implements DropshipSupplier {
  name = 'realistic-mock';
  private connected = false;
  private inventory: Record<string, number> = {
    'SUP-WIDGET-001': 150,
    'SUP-GADGET-200': 75,
    'SUP-ITEM-A': 200,
    'SUP-ITEM-B': 50,
  };
  private prices: Record<string, number> = {
    'SUP-WIDGET-001': 19.99,
    'SUP-GADGET-200': 39.99,
    'SUP-ITEM-A': 9.99,
    'SUP-ITEM-B': 24.99,
  };

  async connect(): Promise<void> {
    if (this.connected) {
      throw new Error('Already connected');
    }
    // Simulate connection delay
    await new Promise((resolve) => setTimeout(resolve, 100));
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    if (!this.connected) {
      throw new Error('Not connected');
    }
    this.connected = false;
  }

  async syncStock(sku: string): Promise<number> {
    if (!this.connected) {
      throw new Error('Not connected to supplier');
    }
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 50));
    return this.inventory[sku] || 0;
  }

  async syncPrice(sku: string): Promise<number> {
    if (!this.connected) {
      throw new Error('Not connected to supplier');
    }
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 50));
    return this.prices[sku] || 0;
  }

  mapSku(localSku: string): string {
    return `SUP-${localSku}`;
  }

  // Test helper methods
  setInventory(sku: string, quantity: number): void {
    this.inventory[sku] = quantity;
  }

  setPrice(sku: string, price: number): void {
    this.prices[sku] = price;
  }

  resetInventory(): void {
    this.inventory = {};
  }
}

/**
 * Mock supplier that always fails (for error testing)
 */
export class FailingMockSupplier implements DropshipSupplier {
  name = 'failing-mock';

  async connect(): Promise<void> {
    throw new Error('Connection failed: Network timeout');
  }

  async disconnect(): Promise<void> {
    throw new Error('Disconnect failed');
  }

  async syncStock(_sku: string): Promise<number> {
    throw new Error('Stock sync failed: API error 500');
  }

  async syncPrice(_sku: string): Promise<number> {
    throw new Error('Price sync failed: API error 500');
  }

  mapSku(_localSku: string): string {
    throw new Error('SKU mapping not available');
  }
}

/**
 * Mock supplier with slow responses (for timeout testing)
 */
export class SlowMockSupplier implements DropshipSupplier {
  name = 'slow-mock';
  private delay: number;

  constructor(delay = 5000) {
    this.delay = delay;
  }

  async connect(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, this.delay));
  }

  async disconnect(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, this.delay));
  }

  async syncStock(_sku: string): Promise<number> {
    await new Promise((resolve) => setTimeout(resolve, this.delay));
    return 100;
  }

  async syncPrice(_sku: string): Promise<number> {
    await new Promise((resolve) => setTimeout(resolve, this.delay));
    return 9.99;
  }

  mapSku(localSku: string): string {
    return `SLOW-${localSku}`;
  }
}

/**
 * Factory for creating mock suppliers
 */
export const mockSupplierFactory = {
  createRealistic: () => new RealisticMockSupplier(),
  createFailing: () => new FailingMockSupplier(),
  createSlow: (delay?: number) => new SlowMockSupplier(delay),
};

/**
 * Mock axios responses for supplier API calls
 */
export const mockAxiosResponses = {
  orderAccepted: {
    status: 200,
    data: {
      orderId: 'SUP-ORD-12345',
      status: 'accepted',
      estimatedShipDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      trackingNumber: null,
    },
  },
  orderRejected: {
    status: 400,
    data: {
      error: 'Out of stock',
      code: 'INSUFFICIENT_INVENTORY',
    },
  },
  serverError: {
    status: 500,
    data: {
      error: 'Internal server error',
    },
  },
  networkTimeout: new Error('Network timeout after 10000ms'),
  inventorySync: {
    status: 200,
    data: {
      sku: 'SUP-WIDGET-001',
      available: 150,
      reserved: 25,
      lastUpdated: new Date().toISOString(),
    },
  },
  priceSync: {
    status: 200,
    data: {
      sku: 'SUP-WIDGET-001',
      price: 19.99,
      currency: 'USD',
      lastUpdated: new Date().toISOString(),
    },
  },
};

/**
 * Helper to create mock supplier API server responses
 */
export class MockSupplierAPI {
  private orders: any[] = [];
  private stockLevels: Record<string, number> = {};
  private prices: Record<string, number> = {};

  recordOrder(order: any): void {
    this.orders.push(order);
  }

  getOrders(): any[] {
    return [...this.orders];
  }

  setStock(sku: string, quantity: number): void {
    this.stockLevels[sku] = quantity;
  }

  getStock(sku: string): number {
    return this.stockLevels[sku] || 0;
  }

  setPrice(sku: string, price: number): void {
    this.prices[sku] = price;
  }

  getPrice(sku: string): number {
    return this.prices[sku] || 0;
  }

  reset(): void {
    this.orders = [];
    this.stockLevels = {};
    this.prices = {};
  }

  /**
   * Simulate order acceptance
   */
  acceptOrder(orderId: string): any {
    return {
      orderId,
      status: 'accepted',
      supplierOrderId: `SUP-${orderId}`,
      estimatedShipDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    };
  }

  /**
   * Simulate order rejection
   */
  rejectOrder(orderId: string, reason: string): any {
    return {
      orderId,
      status: 'rejected',
      reason,
    };
  }

  /**
   * Simulate stock check
   */
  checkStock(sku: string): any {
    return {
      sku,
      available: this.getStock(sku),
      reserved: Math.floor(this.getStock(sku) * 0.1), // 10% reserved
      lastUpdated: new Date(),
    };
  }

  /**
   * Simulate price check
   */
  checkPrice(sku: string): any {
    return {
      sku,
      price: this.getPrice(sku),
      currency: 'USD',
      lastUpdated: new Date(),
    };
  }
}
