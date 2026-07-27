import express from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import railwayGateRoutes from './railwayGateRoutes.js';
import deviceRoutes from './deviceRoutes.js';
import iotRoutes from './iotRoutes.js';
import notificationRoutes from './notificationRoutes.js';

const router = express.Router();

// Mount API Route Modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/gates', railwayGateRoutes);
router.use('/devices', deviceRoutes);
router.use('/iot', iotRoutes);
router.use('/notifications', notificationRoutes);

export default router;
