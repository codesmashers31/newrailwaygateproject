import express from 'express';
import { 
  createNotification, getUserNotifications, markRead, 
  deleteNotification, getUnreadCount 
} from '../controllers/notificationController.js';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all notification routes
router.use(authMiddleware);

router.get('/', getUserNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/:id/read', markRead);
router.delete('/:id', deleteNotification);

// Creating a notification is typically a system or admin action
router.post('/', adminMiddleware, createNotification);

export default router;
