import Notification from '../models/Notification.js';

const sendResponse = (res, statusCode, success, message, data = null, error = null) => {
  const response = { success, message };
  if (data) response.data = data;
  if (error) response.error = error;
  return res.status(statusCode).json(response);
};

export const createNotification = async (req, res) => {
  try {
    const { user, railwayGate, title, message, type } = req.body;

    if (!user || !title || !message) {
      return sendResponse(res, 400, false, 'User, title, and message are required');
    }

    const newNotification = await Notification.create({
      user,
      railwayGate,
      title,
      message,
      type: type || 'SYSTEM',
      sentAt: new Date(),
    });

    return sendResponse(res, 201, true, 'Notification created successfully', newNotification);
  } catch (error) {
    return sendResponse(res, 500, false, 'Failed to create notification', null, error.message);
  }
};

export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate('railwayGate', 'gateCode gateName');

    return sendResponse(res, 200, true, 'Notifications retrieved successfully', notifications);
  } catch (error) {
    return sendResponse(res, 500, false, 'Failed to get notifications', null, error.message);
  }
};

export const markRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return sendResponse(res, 404, false, 'Notification not found');
    }

    return sendResponse(res, 200, true, 'Notification marked as read', notification);
  } catch (error) {
    return sendResponse(res, 500, false, 'Failed to mark notification as read', null, error.message);
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByIdAndDelete(id);

    if (!notification) {
      return sendResponse(res, 404, false, 'Notification not found');
    }

    return sendResponse(res, 200, true, 'Notification deleted successfully');
  } catch (error) {
    return sendResponse(res, 500, false, 'Failed to delete notification', null, error.message);
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await Notification.countDocuments({ user: userId, isRead: false });

    return sendResponse(res, 200, true, 'Unread count retrieved successfully', { count });
  } catch (error) {
    return sendResponse(res, 500, false, 'Failed to get unread count', null, error.message);
  }
};
