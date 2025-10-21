# Dropship Notifications

## Overview
Comprehensive notification system for dropship events with support for multiple channels (email, in-app, web push, SMS), user preferences, and intelligent aggregation to prevent spam.

## Features

### Multi-Channel Delivery
- **In-App**: Notifications stored in database, displayed in inbox
- **Email**: HTML/text templates for all event types
- **Web Push**: Browser notifications (integration ready)
- **SMS**: Text message alerts (integration ready)

### User Preferences
- Per-event-type configuration
- Channel selection (email, in-app, web push, SMS)
- Enable/disable individual notification types
- Aggregation settings per notification type

### Intelligent Aggregation
- Rate-limiting to prevent spam
- Configurable aggregation intervals (e.g., hourly summaries)
- Automatic batching of similar notifications
- Example: Instead of 50 "low stock" emails, send one summary email

### Notification Types

#### Order Events
- `order_received`: New order sent to supplier
- `order_shipped`: Order shipped by supplier

#### Stock Events
- `stock_low`: Product stock below threshold
- `stock_out`: Product completely out of stock

#### Pricing Events
- `price_updated`: Supplier price changes

#### Integration Events
- `supplier_sync_failed`: Failed to sync with supplier
- `sku_mapping_conflict`: SKU mapping conflict detected

#### Compliance Events
- `compliance_required`: User must accept new terms

## Usage

### Backend - Sending Notifications

```typescript
import { sendNotification } from './services/notifications';

// Send a notification
await sendNotification({
  userId: vendorId,
  userType: 'vendor',
  type: 'order_received',
  title: 'New Order',
  message: 'You have received order #12345',
  data: { orderId: '12345', orderUrl: '/orders/12345' },
});
```

### Backend - Using Helper Functions

```typescript
import {
  notifyNewOrder,
  notifyLowStock,
  notifySupplierSyncFailed,
} from './services/dropshipNotifications';

// Notify supplier about new order
await notifyNewOrder(supplierId, 'ORD-123', '/orders/ORD-123');

// Notify vendor about low stock
await notifyLowStock(vendorId, [
  { name: 'Product A', stock: 5 },
  { name: 'Product B', stock: 3 },
]);

// Notify vendor about sync failure
await notifySupplierSyncFailed(vendorId, 'Acme Corp', 'Connection timeout');
```

### Frontend - Displaying Inbox

```tsx
// apps/vendor/pages/notifications/inbox.tsx
import NotificationsInbox from '../pages/notifications/inbox';

function VendorDashboard() {
  return <NotificationsInbox />;
}
```

### Frontend - Preference Center

```tsx
// apps/vendor/pages/notifications/preferences.tsx
import NotificationPreferences from '../pages/notifications/preferences';

function Settings() {
  return <NotificationPreferences />;
}
```

## API Endpoints

### GET /api/notifications
Get notifications for current user.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `unreadOnly`: 'true' or 'false' (default: 'false')

**Response:**
```json
{
  "notifications": [
    {
      "_id": "...",
      "type": "order_received",
      "title": "New Order",
      "message": "You have received order #12345",
      "read": false,
      "createdAt": "2025-10-19T10:00:00Z"
    }
  ],
  "total": 42,
  "unreadCount": 5,
  "page": 1,
  "limit": 20
}
```

### PUT /api/notifications/:id/read
Mark a notification as read.

### PUT /api/notifications/read-all
Mark all notifications as read for current user.

### GET /api/notifications/preferences
Get notification preferences for current user.

**Response:**
```json
{
  "preferences": [
    {
      "notificationType": "order_received",
      "channels": ["email", "in_app"],
      "enabled": true,
      "aggregateEnabled": false,
      "aggregateIntervalMinutes": 60
    }
  ]
}
```

### PUT /api/notifications/preferences/:type
Update preference for a specific notification type.

**Request:**
```json
{
  "channels": ["email", "in_app", "web_push"],
  "enabled": true,
  "aggregateEnabled": true,
  "aggregateIntervalMinutes": 120
}
```

## Data Models

### Notification
```typescript
{
  userId: ObjectId,
  userType: 'vendor' | 'supplier',
  type: NotificationType,
  title: string,
  message: string,
  data?: any,
  read: boolean,
  readAt?: Date,
  createdAt: Date
}
```

### NotificationPreference
```typescript
{
  userId: ObjectId,
  userType: 'vendor' | 'supplier',
  notificationType: NotificationType,
  channels: ['email', 'in_app', 'web_push', 'sms'],
  enabled: boolean,
  aggregateEnabled?: boolean,
  aggregateIntervalMinutes?: number,
  createdAt: Date,
  updatedAt: Date
}
```

## Email Templates

All notification types have corresponding email templates in `apps/api/src/templates/notificationEmails.ts`:

```typescript
import { getEmailTemplate } from './templates/notificationEmails';

const template = getEmailTemplate('order_received');
const html = template.html({ orderId: '123', orderUrl: '/orders/123' });
const text = template.text({ orderId: '123', orderUrl: '/orders/123' });
```

## Aggregation System

### How It Works

1. **Buffer Phase**: When aggregation is enabled, notifications are buffered in memory
2. **Timer**: A timer starts for the configured interval (e.g., 60 minutes)
3. **Flush**: After the interval, all buffered notifications are combined into one
4. **Delivery**: Single aggregated notification sent through enabled channels

### Example

Without aggregation:
```
10:00 - Low stock: Product A
10:05 - Low stock: Product B
10:10 - Low stock: Product C
→ 3 separate emails
```

With aggregation (60 min interval):
```
10:00 - Low stock: Product A (buffered)
10:05 - Low stock: Product B (buffered)
10:10 - Low stock: Product C (buffered)
11:00 - Send: "3 stock_low notifications. Products: A, B, C"
→ 1 summary email
```

### Configuration

```typescript
await NotificationPreferenceModel.create({
  userId: vendorId,
  userType: 'vendor',
  notificationType: 'stock_low',
  channels: ['email'],
  enabled: true,
  aggregateEnabled: true,
  aggregateIntervalMinutes: 60, // Hourly summary
});
```

## Integration Points

### Supplier Sync Job
```typescript
// apps/api/src/jobs/supplierSync.ts
import { notifyLowStock, notifySupplierSyncFailed } from '../services/dropshipNotifications';

// After sync
if (syncFailed) {
  await notifySupplierSyncFailed(vendorId, supplier.name, error);
}

// Check stock levels
const lowStockProducts = products.filter(p => p.stock < threshold);
if (lowStockProducts.length > 0) {
  await notifyLowStock(vendorId, lowStockProducts);
}
```

### Outbound Order Webhook
```typescript
// apps/api/src/services/dropship/outboundWebhook.ts
import { notifyNewOrder } from '../services/dropshipNotifications';

// After sending order to supplier
await notifyNewOrder(supplierId, order._id, `/orders/${order._id}`);
```

### Fulfillment Webhook
```typescript
// apps/api/src/routes/webhooks/supplier/fulfillment.ts
import { notifyOrderShipped } from '../services/dropshipNotifications';

// When shipment status received
if (status === 'shipped') {
  await notifyOrderShipped(vendorId, orderId, trackingNumber, carrier);
}
```

## Testing

Run notification tests:
```bash
npm test -- notifications.test.ts
```

Tests cover:
- Default notification creation
- Preference-based filtering
- Opt-out behavior
- Aggregation logic
- Rate limiting
- Channel selection
- Read/unread management

## Best Practices

### 1. Use Aggregation for High-Frequency Events
```typescript
// Good for events that happen frequently
'stock_low', 'price_updated' → aggregateEnabled: true

// Don't aggregate critical real-time events
'order_received', 'compliance_required' → aggregateEnabled: false
```

### 2. Default Preferences
Create sensible defaults for new users:
```typescript
const defaultPreferences = {
  order_received: { channels: ['email', 'in_app'], aggregateEnabled: false },
  stock_low: { channels: ['email'], aggregateEnabled: true, aggregateIntervalMinutes: 120 },
  compliance_required: { channels: ['email', 'in_app'], aggregateEnabled: false },
};
```

### 3. Provide Context in Data
```typescript
// Good - includes actionable data
await sendNotification({
  type: 'order_received',
  title: 'New Order',
  message: 'Order #12345 received',
  data: {
    orderId: '12345',
    orderUrl: '/orders/12345',
    itemCount: 5,
    total: 125.50,
  },
});
```

### 4. Rate Limit External Services
```typescript
// For email/SMS, respect provider rate limits
if (channel === 'email') {
  await mailerQueue.add('send-email', data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  });
}
```

## Future Enhancements

- [ ] Web push integration (service worker)
- [ ] SMS integration (Twilio)
- [ ] Notification sound preferences
- [ ] Digest emails (daily/weekly summaries)
- [ ] Mobile app push notifications
- [ ] Webhook integration for third-party tools
- [ ] Analytics dashboard (notification engagement)
- [ ] A/B testing for notification templates

## Troubleshooting

### Notifications Not Appearing
1. Check user preferences: `GET /api/notifications/preferences`
2. Verify `enabled: true` for the notification type
3. Check if aggregation is delaying delivery
4. Verify user authentication in requests

### Too Many Notifications
1. Enable aggregation for high-frequency events
2. Increase `aggregateIntervalMinutes`
3. Disable non-critical notification types
4. Remove unused channels

### Aggregation Not Working
1. Verify `aggregateEnabled: true` in preferences
2. Check `aggregateIntervalMinutes` is set
3. Wait for full interval before expecting delivery
4. Check console logs for buffer status
