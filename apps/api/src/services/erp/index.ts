import type { ERPConnector } from './types';

const registry: Record<string, ERPConnector> = {};

export function registerERP(connector: ERPConnector) {
    registry[(connector as any).name] = connector;
}

export function getERP(name: string): ERPConnector | undefined {
    return registry[name];
}

// Mock adapter for testing
export class MockERPConnector implements ERPConnector {
    name = 'mock';
    async exportOrders(payload: any) {
        return { success: true, message: `Exported ${payload.orders?.length ?? 0} orders.` };
    }
    async importInventory(payload: any) {
        return { success: true, message: `Imported ${payload.updates?.length ?? 0} inventory updates.` };
    }
    async syncVendor(payload: any) {
        return { success: true, message: `Synced vendor ${payload.vendor?.name ?? ''}.` };
    }
}

// Register mock by default for dev/test
declare const process: { env: { NODE_ENV: string } };
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
    registerERP(new MockERPConnector());
}
