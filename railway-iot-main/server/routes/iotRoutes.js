import express from 'express';
import { processStatusEvent, processHeartbeat } from '../controllers/iotController.js';
import { getDeviceByCode } from '../controllers/deviceController.js';

const router = express.Router();

// Note: These endpoints are designed to be hit by ESP32 devices.
// Future enhancement: Protect these with device token or API key authentication.
router.post('/status', processStatusEvent);
router.post('/heartbeat', processHeartbeat);

// Retrieve latest known states, routed to getDeviceByCode as it contains lastHeartbeatAt and linked gate info
router.get('/device/:deviceCode/status', getDeviceByCode);
router.get('/device/:deviceCode/heartbeat', getDeviceByCode);

export default router;
