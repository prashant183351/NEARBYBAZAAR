import { Types } from 'mongoose';
import { sendNotification } from './notifications';

/**
 * Notify supplier about new order.
 */
export async function notifyNewOrder(
  supplierId: Types.ObjectId,
  orderId: string,
  orderUrl: string,
): Promise<void> {
  await sendNotification({
    userId: supplierId,
    userType: 'supplier',
    type: 'order_received',
    title: 'New Order Received',
    message: `You have received a new order: ${orderId}`,
    data: { orderId, orderUrl },
  });
}

/**
 * Notify vendor about order shipment.
 */
export async function notifyOrderShipped(
  vendorId: Types.ObjectId,
  orderId: string,
  trackingNumber: string,
  carrier: string,
): Promise<void> {
  await sendNotification({
    userId: vendorId,
    userType: 'vendor',
    type: 'order_shipped',
    title: 'Order Shipped',
    message: `Order ${orderId} has been shipped`,
    data: { orderId, trackingNumber, carrier },
  });
}

/**
 * Notify vendor about low stock.
 */
export async function notifyLowStock(
  vendorId: Types.ObjectId,
  products: Array<{ name: string; stock: number }>,
): Promise<void> {
  await sendNotification({
    userId: vendorId,
    userType: 'vendor',
    type: 'stock_low',
    title: 'Low Stock Alert',
    message: `${products.length} product(s) are running low on stock`,
    data: { products },
  });
}

/**
 * Notify vendor about out of stock.
 */
export async function notifyOutOfStock(
  vendorId: Types.ObjectId,
  products: Array<{ name: string }>,
): Promise<void> {
  await sendNotification({
    userId: vendorId,
    userType: 'vendor',
    type: 'stock_out',
    title: 'Out of Stock Alert',
    message: `${products.length} product(s) are now out of stock`,
    data: { products },
  });
}

/**
 * Notify vendor about price updates.
 */
export async function notifyPriceUpdated(
  vendorId: Types.ObjectId,
  products: Array<{ name: string; oldPrice: number; newPrice: number }>,
): Promise<void> {
  await sendNotification({
    userId: vendorId,
    userType: 'vendor',
    type: 'price_updated',
    title: 'Price Update',
    message: `Prices updated for ${products.length} product(s)`,
    data: { products },
  });
}

/**
 * Notify vendor about supplier sync failure.
 */
export async function notifySupplierSyncFailed(
  vendorId: Types.ObjectId,
  supplierName: string,
  error: string,
): Promise<void> {
  await sendNotification({
    userId: vendorId,
    userType: 'vendor',
    type: 'supplier_sync_failed',
    title: 'Supplier Sync Failed',
    message: `Failed to sync data from ${supplierName}`,
    data: { supplierName, error },
  });
}

/**
 * Notify user about compliance requirement.
 */
export async function notifyComplianceRequired(
  userId: Types.ObjectId,
  userType: 'vendor' | 'supplier',
  agreementTitle: string,
  version: string,
  acceptUrl: string,
): Promise<void> {
  await sendNotification({
    userId,
    userType,
    type: 'compliance_required',
    title: 'Compliance Acceptance Required',
    message: `Please accept the latest ${agreementTitle}`,
    data: { agreementTitle, version, acceptUrl },
  });
}

/**
 * Notify vendor about SKU mapping conflict.
 */
export async function notifySkuMappingConflict(
  vendorId: Types.ObjectId,
  supplierSku: string,
  conflictReason: string,
  resolutionUrl: string,
): Promise<void> {
  await sendNotification({
    userId: vendorId,
    userType: 'vendor',
    type: 'sku_mapping_conflict',
    title: 'SKU Mapping Conflict',
    message: `Conflict detected for SKU: ${supplierSku}`,
    data: { supplierSku, conflictReason, resolutionUrl },
  });
}
