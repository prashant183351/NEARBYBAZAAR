import type { DropshipSupplier } from './types';

const suppliers: Record<string, DropshipSupplier> = {};

export function registerSupplier(supplier: DropshipSupplier) {
    suppliers[supplier.name] = supplier;
}

export function getSupplier(name: string): DropshipSupplier | undefined {
    return suppliers[name];
}

// Stub supplier for dev/test
export class MockDropshipSupplier implements DropshipSupplier {
    name = 'mock';
    async connect() { }
    async disconnect() { }
    async syncStock() { return 100; }
    async syncPrice() { return 9.99; }
    mapSku(localSku: string) { return `SUP-${localSku}`; }
}

// Register mock by default for dev/test
declare const process: { env: { NODE_ENV: string } };
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
    registerSupplier(new MockDropshipSupplier());
}
