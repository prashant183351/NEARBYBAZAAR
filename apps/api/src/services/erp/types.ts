// ERP Connector Interface
export type ERPEvent = any;
export interface ERPConnector {
  /** Export orders to ERP system */
  exportOrders(payload: OrdersExportPayload): Promise<ERPResult>;
  /** Import inventory updates from ERP system */
  importInventory(payload: InventoryImportPayload): Promise<ERPResult>;
  /** Optionally: sync vendor info, etc. */
  syncVendor(payload: VendorSyncPayload): Promise<ERPResult>;
}

// Versioned payloads
export interface OrdersExportPayload {
  version: number;
  orders: Array<{
    id: string;
    items: Array<{ sku: string; quantity: number }>;
    total: number;
    createdAt: string;
    customer: { id: string; name: string; email: string };
    // ...other fields
  }>;
}

export interface InventoryImportPayload {
  version: number;
  updates: Array<{
    sku: string;
    quantity: number;
    updatedAt: string;
  }>;
}

export interface VendorSyncPayload {
  version: number;
  vendor: {
    id: string;
    name: string;
    email: string;
    // ...other fields
  };
}

export interface ERPResult {
  success: boolean;
  message?: string;
  errors?: string[];
}

// Mock implementation for testing
export const MockERPConnector: ERPConnector = {
  async exportOrders(payload) {
    return { success: true, message: `Exported ${payload.orders.length} orders.` };
  },
  async importInventory(payload) {
    return { success: true, message: `Imported ${payload.updates.length} inventory updates.` };
  },
  async syncVendor(payload) {
    return { success: true, message: `Synced vendor ${payload.vendor.name}.` };
  },
};
