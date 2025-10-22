import { Router } from 'express';
import { Types } from 'mongoose';
import NotificationModel from '../models/Notification';
import NotificationPreferenceModel from '../models/NotificationPreference';
import { markAsRead, markAllAsRead, getUnreadCount } from '../services/notifications';

const router = Router();

/**
 * GET /api/notifications
 * Get notifications for current user.
 */
router.get('/', async (req, res) => {
  try {
    // @ts-ignore
    const { userId, userType } = req.user;

    if (!userId || !userType) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { page = 1, limit = 20, unreadOnly = 'false' } = req.query;
    const filter: any = { userId: new Types.ObjectId(userId), userType };

    if (unreadOnly === 'true') {
      filter.read = false;
    }

    const notifications = await NotificationModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await NotificationModel.countDocuments(filter);
    const unreadCount = await getUnreadCount(new Types.ObjectId(userId), userType);

    res.json({ notifications, total, unreadCount, page: Number(page), limit: Number(limit) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Mark a notification as read.
 */
router.put('/:id/read', async (req, res) => {
  try {
    await markAsRead(new Types.ObjectId(req.params.id));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read.
 */
router.put('/read-all', async (req, res) => {
  try {
    // @ts-ignore
    const { userId, userType } = req.user;

    if (!userId || !userType) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await markAllAsRead(new Types.ObjectId(userId), userType);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/notifications/preferences
 * Get notification preferences for current user.
 */
router.get('/preferences', async (req, res) => {
  try {
    // @ts-ignore
    const { userId, userType } = req.user;

    if (!userId || !userType) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const preferences = await NotificationPreferenceModel.find({
      userId: new Types.ObjectId(userId),
      userType,
    });

    res.json({ preferences });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/notifications/preferences/:type
 * Update notification preference for a specific type.
 */
router.put('/preferences/:type', async (req, res) => {
  try {
    // @ts-ignore
    const { userId, userType } = req.user;

    if (!userId || !userType) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { channels, enabled, aggregateEnabled, aggregateIntervalMinutes } = req.body;

    const preference = await NotificationPreferenceModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        userType,
        notificationType: req.params.type,
      },
      {
        channels,
        enabled,
        aggregateEnabled,
        aggregateIntervalMinutes,
        updatedAt: new Date(),
      },
      { new: true, upsert: true },
    );

    res.json({ preference });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
