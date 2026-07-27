import express from 'express';
import { 
  registerDevice, updateDevice, deleteDevice, getDeviceById, getDeviceByCode, 
  getAllDevices, updateFirmwareVersion, markOnline, markOffline, updateRSSI, 
  updateLastHeartbeat, assignRailwayGate, unassignRailwayGate 
} from '../controllers/deviceController.js';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin Only for all device management
router.use(authMiddleware, adminMiddleware);

router.post('/', registerDevice);
router.get('/', getAllDevices);
router.get('/:id', getDeviceById);
router.get('/code/:deviceCode', getDeviceByCode);
router.patch('/:id', updateDevice);
router.delete('/:id', deleteDevice);

router.patch('/:id/firmware', updateFirmwareVersion);
router.patch('/:id/online', markOnline);
router.patch('/:id/offline', markOffline);
router.patch('/:id/rssi', updateRSSI);
router.patch('/:id/heartbeat', updateLastHeartbeat);

router.put('/:id/assign-gate', assignRailwayGate);
router.delete('/:id/unassign-gate', unassignRailwayGate);

export default router;
