import { ERPConnector, OrdersExportPayload, InventoryImportPayload, VendorSyncPayload, ERPResult } from './types';

// Example: Tally expects orders as XML or a specific JSON format. We'll simulate transformation.
function mapOrderToTallyFormat(order: OrdersExportPayload['orders'][0]) {
    // Simulate mapping to Tally's format (here, a simple JSON structure)
    return {
        OrderID: order.id,
        CustomerName: order.customer.name,
        CustomerEmail: order.customer.email,
        Items: order.items.map(item => ({ SKU: item.sku, Qty: item.quantity })),
        Total: order.total,
        Date: order.createdAt,
        // ...other fields as needed
    };
}

export const TallyStubERPAdapter: ERPConnector = {
    async exportOrders(payload: OrdersExportPayload): Promise<ERPResult> {
        try {
            const tallyOrders = payload.orders.map(mapOrderToTallyFormat);
            // Simulate sending to Tally (here, just log or return)
            // In real use, would POST to Tally API or write XML
            return { success: true, message: `Transformed ${tallyOrders.length} orders for Tally.` };
        } catch (err: any) {
            return { success: false, message: 'Export failed', errors: [err.message] };
        }
    },
    async importInventory(_payload: InventoryImportPayload): Promise<ERPResult> {
        // Tally stub: not implemented
        return { success: true, message: 'Inventory import not implemented for Tally stub.' };
    },
    async syncVendor(_payload: VendorSyncPayload): Promise<ERPResult> {
        // Tally stub: not implemented
        return { success: true, message: 'Vendor sync not implemented for Tally stub.' };
    },
};
