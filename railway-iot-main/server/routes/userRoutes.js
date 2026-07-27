import express from 'express';
import { 
  getProfile, updateProfile, getFavouriteGates, 
  updateFavouriteGates, enableNotifications, disableNotifications 
} from '../controllers/userController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all user routes
router.use(authMiddleware);

router.route('/profile')
  .get(getProfile)
  .patch(updateProfile);

router.route('/favourite-gates')
  .get(getFavouriteGates)
  .put(updateFavouriteGates);

// Using explicit enable/disable for clarity based on controller logic
router.patch('/notifications/enable', enableNotifications);
router.patch('/notifications/disable', disableNotifications);

export default router;
