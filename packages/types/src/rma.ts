/**
 * RMA (Return Merchandise Authorization) Type Definitions
 * 
 * Shared types for return/refund workflows across the application.
 * @stub - Planning phase
 */

export type ReturnStatus =
    | 'requested'
    | 'vendor_reviewing'
    | 'vendor_approved'
    | 'vendor_rejected'
    | 'supplier_reviewing'
    | 'supplier_approved'
    | 'supplier_rejected'
    | 'return_label_sent'
    | 'shipped_back'
    | 'in_transit'
    | 'received_by_vendor'
    | 'received_by_supplier'
    | 'inspecting'
    | 'inspection_passed'
    | 'inspection_failed'
    | 'refund_processing'
    | 'refunded'
    | 'partially_refunded'
    | 'replaced'
    | 'closed'
    | 'cancelled';

export type ReturnReason =
    | 'defective'
    | 'wrong_item'
    | 'not_as_described'
    | 'changed_mind'
    | 'damaged_in_shipping'
    | 'sizing_issue'
    | 'quality_issue'
    | 'arrived_late'
    | 'other';

export type RefundMethod =
    | 'original_payment'
    | 'store_credit'
    | 'replacement'
    | 'partial_refund';

export interface ReturnItem {
    productId: string;
    variantId?: string;
    quantity: number;
    reason: ReturnReason;
    condition?: string;
    images?: string[];
}

export interface ReturnInspection {
    inspectedBy: string;
    inspectorType: 'vendor' | 'supplier';
    inspectedAt: Date;
    passed: boolean;
    notes?: string;
    images?: string[];
}

export interface ReturnShipment {
    carrier?: string;
    trackingNumber?: string;
    shippedAt?: Date;
    estimatedDelivery?: Date;
    actualDelivery?: Date;
    labelUrl?: string;
    labelCost?: number;
}

export interface ReturnRefund {
    method: RefundMethod;
    amount: number;
    currency: string;
    transactionId?: string;
    processedAt?: Date;
    notes?: string;
}

export interface Return {
    _id: string;
    rmaNumber: string;
    orderId: string;
    customerId: string;
    vendorId: string;
    supplierId?: string;

    items: ReturnItem[];
    status: ReturnStatus;
    isDropship: boolean;

    customerNotes?: string;
    vendorNotes?: string;
    supplierNotes?: string;
    internalNotes?: string;

    returnShipment?: ReturnShipment;
    inspection?: ReturnInspection;
    refund?: ReturnRefund;

    vendorApprovedBy?: string;
    vendorApprovedAt?: Date;
    vendorRejectedAt?: Date;
    vendorRejectionReason?: string;

    supplierApprovedBy?: string;
    supplierApprovedAt?: Date;
    supplierRejectedAt?: Date;
    supplierRejectionReason?: string;

    requestedAt: Date;
    expectedResolutionDate?: Date;
    resolvedAt?: Date;

    createdAt: Date;
    updatedAt: Date;
}

/**
 * Helper to get human-readable status label.
 */
export function getStatusLabel(status: ReturnStatus): string {
    const labels: Record<ReturnStatus, string> = {
        requested: 'Requested',
        vendor_reviewing: 'Under Vendor Review',
        vendor_approved: 'Vendor Approved',
        vendor_rejected: 'Vendor Rejected',
        supplier_reviewing: 'Under Supplier Review',
        supplier_approved: 'Supplier Approved',
        supplier_rejected: 'Supplier Rejected',
        return_label_sent: 'Return Label Sent',
        shipped_back: 'Shipped Back',
        in_transit: 'In Transit',
        received_by_vendor: 'Received by Vendor',
        received_by_supplier: 'Received by Supplier',
        inspecting: 'Inspecting',
        inspection_passed: 'Inspection Passed',
        inspection_failed: 'Inspection Failed',
        refund_processing: 'Refund Processing',
        refunded: 'Refunded',
        partially_refunded: 'Partially Refunded',
        replaced: 'Replaced',
        closed: 'Closed',
        cancelled: 'Cancelled',
    };
    return labels[status] || status;
}

/**
 * Helper to get human-readable reason label.
 */
export function getReasonLabel(reason: ReturnReason): string {
    const labels: Record<ReturnReason, string> = {
        defective: 'Defective/Broken',
        wrong_item: 'Wrong Item Shipped',
        not_as_described: 'Not As Described',
        changed_mind: 'Changed Mind',
        damaged_in_shipping: 'Damaged in Shipping',
        sizing_issue: 'Sizing Issue',
        quality_issue: 'Quality Issue',
        arrived_late: 'Arrived Too Late',
        other: 'Other',
    };
    return labels[reason] || reason;
}

/**
 * Check if status is terminal (no further actions).
 */
export function isTerminalStatus(status: ReturnStatus): boolean {
    return [
        'refunded',
        'partially_refunded',
        'replaced',
        'vendor_rejected',
        'supplier_rejected',
        'closed',
        'cancelled',
    ].includes(status);
}

/**
 * Check if status allows vendor action.
 */
export function allowsVendorAction(status: ReturnStatus): boolean {
    return [
        'requested',
        'vendor_reviewing',
        'received_by_vendor',
        'inspecting',
        'inspection_passed',
    ].includes(status);
}

/**
 * Check if status allows supplier action.
 */
export function allowsSupplierAction(status: ReturnStatus): boolean {
    return [
        'supplier_reviewing',
        'received_by_supplier',
        'inspecting',
    ].includes(status);
}
