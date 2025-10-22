import { Types } from 'mongoose';
import NotificationModel from '../src/models/Notification';
import NotificationPreferenceModel from '../src/models/NotificationPreference';
import {
  sendNotification,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from '../src/services/notifications';

describe('Notification Service', () => {
  const vendorId = new Types.ObjectId();
  const supplierId = new Types.ObjectId();

  beforeEach(async () => {
    await NotificationModel.deleteMany({});
    await NotificationPreferenceModel.deleteMany({});
  });

  describe('sendNotification', () => {
    it('creates in-app notification by default', async () => {
      await sendNotification({
        userId: vendorId,
        userType: 'vendor',
        type: 'order_received',
        title: 'New Order',
        message: 'You have a new order',
        data: { orderId: '123' },
      });

      const notifications = await NotificationModel.find({ userId: vendorId });
      expect(notifications).toHaveLength(1);
      expect(notifications[0].title).toBe('New Order');
      expect(notifications[0].type).toBe('order_received');
    });

    it('respects opt-out preferences', async () => {
      await NotificationPreferenceModel.create({
        userId: vendorId,
        userType: 'vendor',
        notificationType: 'order_received',
        channels: ['email'],
        enabled: false, // opted out
      });

      await sendNotification({
        userId: vendorId,
        userType: 'vendor',
        type: 'order_received',
        title: 'New Order',
        message: 'You have a new order',
      });

      const notifications = await NotificationModel.find({ userId: vendorId });
      expect(notifications).toHaveLength(0); // No notification sent
    });

    it('buffers notifications when aggregation is enabled', async () => {
      await NotificationPreferenceModel.create({
        userId: vendorId,
        userType: 'vendor',
        notificationType: 'stock_low',
        channels: ['email', 'in_app'],
        enabled: true,
        aggregateEnabled: true,
        aggregateIntervalMinutes: 1, // 1 minute for testing
      });

      // Send multiple notifications quickly
      for (let i = 0; i < 5; i++) {
        await sendNotification({
          userId: vendorId,
          userType: 'vendor',
          type: 'stock_low',
          title: 'Low Stock',
          message: `Product ${i} is low on stock`,
          data: { productId: `p${i}` },
        });
      }

      // Should not create notifications immediately
      const immediate = await NotificationModel.find({ userId: vendorId });
      expect(immediate).toHaveLength(0);

      // Wait for aggregation interval
      await new Promise((resolve) => setTimeout(resolve, 70000)); // 70 seconds

      // Should create aggregated notification
      const aggregated = await NotificationModel.find({ userId: vendorId });
      expect(aggregated).toHaveLength(1);
      expect(aggregated[0].title).toContain('5 stock_low notifications');
    }, 80000); // Increase test timeout
  });

  describe('getUnreadCount', () => {
    it('returns correct unread count', async () => {
      await NotificationModel.create([
        {
          userId: vendorId,
          userType: 'vendor',
          type: 'order_received',
          title: 'A',
          message: 'A',
          read: false,
        },
        {
          userId: vendorId,
          userType: 'vendor',
          type: 'order_received',
          title: 'B',
          message: 'B',
          read: false,
        },
        {
          userId: vendorId,
          userType: 'vendor',
          type: 'order_received',
          title: 'C',
          message: 'C',
          read: true,
        },
      ]);

      const count = await getUnreadCount(vendorId, 'vendor');
      expect(count).toBe(2);
    });
  });

  describe('markAsRead', () => {
    it('marks notification as read', async () => {
      const notif = await NotificationModel.create({
        userId: vendorId,
        userType: 'vendor',
        type: 'order_received',
        title: 'Test',
        message: 'Test',
        read: false,
      });

      await markAsRead(notif._id!);

      const updated = await NotificationModel.findById(notif._id);
      expect(updated?.read).toBe(true);
      expect(updated?.readAt).toBeTruthy();
    });
  });

  describe('markAllAsRead', () => {
    it('marks all notifications as read for a user', async () => {
      await NotificationModel.create([
        {
          userId: vendorId,
          userType: 'vendor',
          type: 'order_received',
          title: 'A',
          message: 'A',
          read: false,
        },
        {
          userId: vendorId,
          userType: 'vendor',
          type: 'order_received',
          title: 'B',
          message: 'B',
          read: false,
        },
        {
          userId: supplierId,
          userType: 'supplier',
          type: 'order_received',
          title: 'C',
          message: 'C',
          read: false,
        },
      ]);

      await markAllAsRead(vendorId, 'vendor');

      const vendorNotifs = await NotificationModel.find({ userId: vendorId });
      expect(vendorNotifs.every((n) => n.read)).toBe(true);

      const supplierNotifs = await NotificationModel.find({ userId: supplierId });
      expect(supplierNotifs[0].read).toBe(false); // Unaffected
    });
  });

  describe('rate limiting via aggregation', () => {
    it('prevents spam by aggregating multiple notifications', async () => {
      await NotificationPreferenceModel.create({
        userId: vendorId,
        userType: 'vendor',
        notificationType: 'price_updated',
        channels: ['in_app'],
        enabled: true,
        aggregateEnabled: true,
        aggregateIntervalMinutes: 1,
      });

      // Simulate rapid price updates
      const promises = [];
      for (let i = 0; i < 20; i++) {
        promises.push(
          sendNotification({
            userId: vendorId,
            userType: 'vendor',
            type: 'price_updated',
            title: 'Price Updated',
            message: `Price updated for product ${i}`,
            data: { productId: `p${i}` },
          }),
        );
      }
      await Promise.all(promises);

      // Should buffer all notifications
      const immediate = await NotificationModel.find({ userId: vendorId });
      expect(immediate.length).toBeLessThan(20); // Should be aggregated
    });
  });
});
