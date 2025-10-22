export interface DropshipSupplier {
  name: string;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  syncStock(sku: string): Promise<number>; // returns available stock
  syncPrice(sku: string): Promise<number>; // returns current price
  mapSku(localSku: string): string; // map local SKU to supplier SKU
}
