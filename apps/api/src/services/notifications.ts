import { Types } from 'mongoose';
import NotificationModel from '../models/Notification';
import NotificationPreferenceModel, {
  NotificationType,
  NotificationChannel,
} from '../models/NotificationPreference';

interface NotificationPayload {
  userId: Types.ObjectId;
  userType: 'vendor' | 'supplier';
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
}

interface AggregatedNotification {
  type: NotificationType;
  count: number;
  lastMessage: string;
  items: any[];
}

// In-memory store for pending aggregated notifications
const aggregationBuffer = new Map<string, AggregatedNotification>();

/**
 * Get user's notification preferences for a specific type.
 */
async function getPreferences(
  userId: Types.ObjectId,
  userType: 'vendor' | 'supplier',
  notificationType: NotificationType,
) {
  let pref = await NotificationPreferenceModel.findOne({
    userId,
    userType,
    notificationType,
  });

  // Create default preference if not exists
  if (!pref) {
    pref = await NotificationPreferenceModel.create({
      userId,
      userType,
      notificationType,
      channels: ['email', 'in_app'],
      enabled: true,
    });
  }

  return pref;
}

/**
 * Send a notification through specified channels.
 */
export async function sendNotification(payload: NotificationPayload): Promise<void> {
  const prefs = await getPreferences(payload.userId, payload.userType, payload.type);

  if (!prefs.enabled) {
    return; // User opted out
  }

  // Check if aggregation is enabled
  if (prefs.aggregateEnabled && prefs.aggregateIntervalMinutes) {
    await bufferForAggregation(payload, prefs.aggregateIntervalMinutes);
    return;
  }

  // Send immediately through enabled channels
  await sendThroughChannels(payload, prefs.channels);
}

/**
 * Buffer notification for aggregation.
 */
async function bufferForAggregation(
  payload: NotificationPayload,
  intervalMinutes: number,
): Promise<void> {
  const key = `${payload.userId}_${payload.type}`;

  if (!aggregationBuffer.has(key)) {
    aggregationBuffer.set(key, {
      type: payload.type,
      count: 0,
      lastMessage: payload.message,
      items: [],
    });

    // Schedule flush after interval
    setTimeout(
      () => {
        flushAggregatedNotifications(payload.userId, payload.userType, payload.type);
      },
      intervalMinutes * 60 * 1000,
    );
  }

  const buffer = aggregationBuffer.get(key)!;
  buffer.count++;
  buffer.lastMessage = payload.message;
  buffer.items.push(payload.data);
}

/**
 * Flush aggregated notifications.
 */
async function flushAggregatedNotifications(
  userId: Types.ObjectId,
  userType: 'vendor' | 'supplier',
  type: NotificationType,
): Promise<void> {
  const key = `${userId}_${type}`;
  const buffer = aggregationBuffer.get(key);

  if (!buffer || buffer.count === 0) {
    return;
  }

  const prefs = await getPreferences(userId, userType, type);

  const aggregatedPayload: NotificationPayload = {
    userId,
    userType,
    type,
    title: `${buffer.count} ${type} notifications`,
    message:
      buffer.count === 1
        ? buffer.lastMessage
        : `You have ${buffer.count} ${type} events. Last: ${buffer.lastMessage}`,
    data: { count: buffer.count, items: buffer.items },
  };

  await sendThroughChannels(aggregatedPayload, prefs.channels);

  // Clear buffer
  aggregationBuffer.delete(key);
}

/**
 * Send notification through specified channels.
 */
async function sendThroughChannels(
  payload: NotificationPayload,
  channels: NotificationChannel[],
): Promise<void> {
  const promises = [];

  if (channels.includes('in_app')) {
    promises.push(sendInApp(payload));
  }

  if (channels.includes('email')) {
    promises.push(sendEmail(payload));
  }

  if (channels.includes('web_push')) {
    promises.push(sendWebPush(payload));
  }

  if (channels.includes('sms')) {
    promises.push(sendSMS(payload));
  }

  await Promise.allSettled(promises);
}

/**
 * Send in-app notification.
 */
async function sendInApp(payload: NotificationPayload): Promise<void> {
  await NotificationModel.create({
    userId: payload.userId,
    userType: payload.userType,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    data: payload.data,
    read: false,
  });
}

/**
 * Send email notification.
 */
async function sendEmail(payload: NotificationPayload): Promise<void> {
  // TODO: Integrate with existing mailer queue
  // For now, just log
  console.log(`[EMAIL] To: ${payload.userId}, Subject: ${payload.title}`);

  // Example integration:
  // await mailerQueue.add('send-email', {
  //   to: userEmail,
  //   subject: payload.title,
  //   template: getTemplateForType(payload.type),
  //   data: payload.data,
  // });
}

/**
 * Send web push notification.
 */
async function sendWebPush(payload: NotificationPayload): Promise<void> {
  // TODO: Integrate with web push service
  console.log(`[WEB_PUSH] To: ${payload.userId}, Title: ${payload.title}`);
}

/**
 * Send SMS notification.
 */
async function sendSMS(payload: NotificationPayload): Promise<void> {
  // TODO: Integrate with SMS service (e.g., Twilio)
  console.log(`[SMS] To: ${payload.userId}, Message: ${payload.message}`);
}

/**
 * Mark notification as read.
 */
export async function markAsRead(notificationId: Types.ObjectId): Promise<void> {
  await NotificationModel.findByIdAndUpdate(notificationId, {
    read: true,
    readAt: new Date(),
  });
}

/**
 * Mark all notifications as read for a user.
 */
export async function markAllAsRead(
  userId: Types.ObjectId,
  userType: 'vendor' | 'supplier',
): Promise<void> {
  await NotificationModel.updateMany(
    { userId, userType, read: false },
    { read: true, readAt: new Date() },
  );
}

/**
 * Get unread notification count.
 */
export async function getUnreadCount(
  userId: Types.ObjectId,
  userType: 'vendor' | 'supplier',
): Promise<number> {
  return await NotificationModel.countDocuments({ userId, userType, read: false });
}
