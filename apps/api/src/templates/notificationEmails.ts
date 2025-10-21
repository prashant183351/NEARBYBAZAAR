import { NotificationType } from '../models/NotificationPreference';

interface EmailTemplate {
    subject: string;
    html: (data: any) => string;
    text: (data: any) => string;
}

export const emailTemplates: Record<NotificationType, EmailTemplate> = {
    order_received: {
        subject: 'New Order Received',
        html: (data) => `
      <h2>New Order Received</h2>
      <p>You have received a new order: <strong>${data.orderId}</strong></p>
      <p>Please process this order within 24 hours.</p>
      <p><a href="${data.orderUrl}">View Order</a></p>
    `,
        text: (data) => `
      New Order Received
      
      You have received a new order: ${data.orderId}
      Please process this order within 24 hours.
      
      View order: ${data.orderUrl}
    `,
    },

    order_shipped: {
        subject: 'Order Shipped',
        html: (data) => `
      <h2>Order Shipped</h2>
      <p>Order <strong>${data.orderId}</strong> has been shipped.</p>
      <p>Tracking Number: <strong>${data.trackingNumber}</strong></p>
      <p>Carrier: ${data.carrier}</p>
    `,
        text: (data) => `
      Order Shipped
      
      Order ${data.orderId} has been shipped.
      Tracking Number: ${data.trackingNumber}
      Carrier: ${data.carrier}
    `,
    },

    stock_low: {
        subject: 'Low Stock Alert',
        html: (data) => `
      <h2>Low Stock Alert</h2>
      <p>The following products are running low on stock:</p>
      <ul>
        ${data.products?.map((p: any) => `
          <li><strong>${p.name}</strong> - ${p.stock} units remaining</li>
        `).join('') || ''}
      </ul>
      <p>Please restock soon to avoid stockouts.</p>
    `,
        text: (data) => `
      Low Stock Alert
      
      The following products are running low on stock:
      ${data.products?.map((p: any) => `- ${p.name}: ${p.stock} units remaining`).join('\n') || ''}
      
      Please restock soon to avoid stockouts.
    `,
    },

    stock_out: {
        subject: 'Out of Stock Alert',
        html: (data) => `
      <h2>Out of Stock Alert</h2>
      <p>The following products are now out of stock:</p>
      <ul>
        ${data.products?.map((p: any) => `<li><strong>${p.name}</strong></li>`).join('') || ''}
      </ul>
      <p>These products are no longer available for purchase until restocked.</p>
    `,
        text: (data) => `
      Out of Stock Alert
      
      The following products are now out of stock:
      ${data.products?.map((p: any) => `- ${p.name}`).join('\n') || ''}
      
      These products are no longer available for purchase until restocked.
    `,
    },

    price_updated: {
        subject: 'Price Update Notification',
        html: (data) => `
      <h2>Price Update Notification</h2>
      <p>Prices have been updated for the following products:</p>
      <ul>
        ${data.products?.map((p: any) => `
          <li><strong>${p.name}</strong>: ${p.oldPrice} → ${p.newPrice}</li>
        `).join('') || ''}
      </ul>
    `,
        text: (data) => `
      Price Update Notification
      
      Prices have been updated for the following products:
      ${data.products?.map((p: any) => `- ${p.name}: ${p.oldPrice} → ${p.newPrice}`).join('\n') || ''}
    `,
    },

    supplier_sync_failed: {
        subject: 'Supplier Sync Failed',
        html: (data) => `
      <h2>Supplier Sync Failed</h2>
      <p>Failed to sync data from supplier: <strong>${data.supplierName}</strong></p>
      <p>Error: ${data.error}</p>
      <p>Please check your supplier integration settings.</p>
    `,
        text: (data) => `
      Supplier Sync Failed
      
      Failed to sync data from supplier: ${data.supplierName}
      Error: ${data.error}
      
      Please check your supplier integration settings.
    `,
    },

    compliance_required: {
        subject: 'Compliance Acceptance Required',
        html: (data) => `
      <h2>Compliance Acceptance Required</h2>
      <p>You must accept the latest compliance terms to continue using the platform.</p>
      <p>Agreement: <strong>${data.agreementTitle}</strong> (${data.version})</p>
      <p><a href="${data.acceptUrl}">Review and Accept</a></p>
    `,
        text: (data) => `
      Compliance Acceptance Required
      
      You must accept the latest compliance terms to continue using the platform.
      Agreement: ${data.agreementTitle} (${data.version})
      
      Review and accept: ${data.acceptUrl}
    `,
    },

    sku_mapping_conflict: {
        subject: 'SKU Mapping Conflict',
        html: (data) => `
      <h2>SKU Mapping Conflict</h2>
      <p>A conflict was detected in SKU mapping:</p>
      <p>Supplier SKU: <strong>${data.supplierSku}</strong></p>
      <p>Conflict: ${data.conflictReason}</p>
      <p><a href="${data.resolutionUrl}">Resolve Conflict</a></p>
    `,
        text: (data) => `
      SKU Mapping Conflict
      
      A conflict was detected in SKU mapping:
      Supplier SKU: ${data.supplierSku}
      Conflict: ${data.conflictReason}
      
      Resolve conflict: ${data.resolutionUrl}
    `,
    },
};

export function getEmailTemplate(type: NotificationType): EmailTemplate {
    return emailTemplates[type];
}
