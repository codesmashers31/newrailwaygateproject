import express from 'express';
import { registerUser, loginUser, verifyOTP, refreshAccessToken, logout } from '../controllers/authController.js';
import { getProfile } from '../controllers/userController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-otp', verifyOTP);
router.post('/refresh-token', refreshAccessToken);

// Protected routes
router.post('/logout', authMiddleware, logout);
router.get('/me', authMiddleware, getProfile); // Reusing getProfile from userController for /me

export default router;
