import ESP32Device from '../models/ESP32Device.js';
import RailwayGate from '../models/RailwayGate.js';
import GateEventLog from '../models/GateEventLog.js';
import DeviceHeartbeat from '../models/DeviceHeartbeat.js';

const sendResponse = (res, statusCode, success, message, data = null, error = null) => {
  const response = { success, message };
  if (data) response.data = data;
  if (error) response.error = error;
  return res.status(statusCode).json(response);
};

/**
 * Flow:
 * Receive JSON -> Validate payload -> Find Device -> Find Gate 
 * -> Update Gate Status -> Insert NEW Event Log -> Return 201
 */
export const processStatusEvent = async (req, res) => {
  try {
    const receivedAt = new Date();
    
    const { deviceCode, status, sensorType, source, eventTime, firmwareVersion } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    if (!deviceCode || !status || !sensorType || !source || !eventTime) {
      return sendResponse(res, 400, false, 'Missing required payload fields');
    }

    if (!['OPEN', 'CLOSED', 'UNKNOWN'].includes(status)) {
      return sendResponse(res, 400, false, 'Invalid status value');
    }

    // Find the device
    const device = await ESP32Device.findOne({ deviceCode });
    if (!device) {
      return sendResponse(res, 404, false, 'Device not found');
    }

    // Find the gate linked to this device
    if (!device.railwayGate) {
      return sendResponse(res, 400, false, 'Device is not assigned to any railway gate');
    }

    const gate = await RailwayGate.findById(device.railwayGate);
    if (!gate) {
      return sendResponse(res, 404, false, 'Linked Railway gate not found');
    }

    // Update Gate Current Status
    gate.currentStatus = status;
    gate.lastStatusChangedAt = new Date(eventTime);
    if (status === 'OPEN') {
      gate.lastOpenedAt = new Date(eventTime);
    } else if (status === 'CLOSED') {
      gate.lastClosedAt = new Date(eventTime);
    }
    await gate.save();

    // Insert NEW GateEventLog document (Append-only)
    const newLog = await GateEventLog.create({
      railwayGate: gate._id,
      device: device._id,
      status,
      sensorType,
      source,
      eventTime: new Date(eventTime),
      receivedAt,
      processedAt: new Date(),
      firmwareVersion: firmwareVersion || device.firmwareVersion,
      ipAddress,
      rawPayload: JSON.stringify(req.body),
    });

    return sendResponse(res, 201, true, 'Status event processed successfully', {
      gateStatus: gate.currentStatus,
      eventId: newLog._id,
    });
  } catch (error) {
    return sendResponse(res, 500, false, 'Failed to process status event', null, error.message);
  }
};

/**
 * Flow:
 * Receive heartbeat -> Find Device -> Update Device (lastHeartbeatAt, onlineStatus) 
 * -> Insert NEW DeviceHeartbeat -> Return Success
 */
export const processHeartbeat = async (req, res) => {
  try {
    const heartbeatAt = new Date();
    
    const { deviceCode, rssi, freeHeap, uptimeSeconds, wifiReconnectCount, firmwareVersion } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    if (!deviceCode) {
      return sendResponse(res, 400, false, 'deviceCode is required');
    }

    // Find the device
    const device = await ESP32Device.findOne({ deviceCode });
    if (!device) {
      return sendResponse(res, 404, false, 'Device not found');
    }

    // Update Device Status
    device.onlineStatus = true;
    device.lastHeartbeatAt = heartbeatAt;
    
    if (rssi !== undefined) device.rssi = rssi;
    if (ipAddress) device.ipAddress = ipAddress;
    if (firmwareVersion) device.firmwareVersion = firmwareVersion;

    await device.save();

    // Insert NEW DeviceHeartbeat document (never overwrite)
    const newHeartbeat = await DeviceHeartbeat.create({
      device: device._id,
      online: true,
      rssi,
      freeHeap,
      uptimeSeconds,
      wifiReconnectCount,
      ipAddress,
      firmwareVersion: firmwareVersion || device.firmwareVersion,
      heartbeatAt,
    });

    return sendResponse(res, 200, true, 'Heartbeat processed successfully', {
      heartbeatId: newHeartbeat._id,
    });
  } catch (error) {
    return sendResponse(res, 500, false, 'Failed to process heartbeat', null, error.message);
  }
};
