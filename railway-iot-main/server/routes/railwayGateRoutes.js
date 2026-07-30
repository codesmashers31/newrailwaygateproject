import express from 'express';
import { 
  createGate, updateGate, deleteGate, getAllGates, getGateById, 
  getGateByCode, getCurrentStatus, getGateHistory, 
  assignESP32Device, unassignDevice, updateCurrentStatus
} from '../controllers/railwayGateController.js';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public or User-authenticated routes
router.get('/', authMiddleware, getAllGates);
router.get('/:id', authMiddleware, getGateById);
router.get('/code/:gateCode', authMiddleware, getGateByCode);
router.get('/:id/current-status', authMiddleware, getCurrentStatus);
router.get('/:id/history', authMiddleware, getGateHistory);

// Admin Only routes
router.post('/', authMiddleware, adminMiddleware, createGate);
router.patch('/:id', authMiddleware, adminMiddleware, updateGate);
router.delete('/:id', authMiddleware, adminMiddleware, deleteGate);
router.put('/:id/assign-device', authMiddleware, adminMiddleware, assignESP32Device);
router.delete('/:id/unassign-device', authMiddleware, adminMiddleware, unassignDevice);
router.patch('/:id/status', authMiddleware, updateCurrentStatus); // Manual override

export default router;
