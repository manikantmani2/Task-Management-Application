import { Notification } from '../models/Notification.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { ApiError } from '../middleware/errorHandler.js';

export const listNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  res.json({ notifications });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({ _id: req.params.notificationId, user: req.user.id });

  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  notification.readAt = notification.readAt || new Date();
  await notification.save();

  res.json({ notification });
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user: req.user.id, readAt: null },
    { $set: { readAt: new Date() } }
  );

  res.json({ success: true });
});