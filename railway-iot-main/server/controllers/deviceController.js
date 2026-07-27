import ESP32Device from '../models/ESP32Device.js';
import RailwayGate from '../models/RailwayGate.js';

const sendResponse = (res, statusCode, success, message, data = null, error = null) => {
  const response = { success, message };
  if (data) response.data = data;
  if (error) response.error = error;
  return res.status(statusCode).json(response);
};

export const registerDevice = async (req, res) => {
  try {
    const { deviceCode, deviceName, serialNumber, macAddress, hardwareVersion } = req.body;

    if (!deviceCode) {
      return sendResponse(res, 400, false, 'deviceCode is required');
    }

    const existingDevice = await ESP32Device.findOne({ deviceCode });
    if (existingDevice) {
      return sendResponse(res, 400, false, 'Device with this code already exists');
    }

    const newDevice = await ESP32Device.create({
      deviceCode,
      deviceName,
      serialNumber,
      macAddress,
      hardwareVersion,
    });

    return sendResponse(res, 201, true, 'Device registered successfully', newDevice);
  } catch (error) {
    return sendResponse(res, 500, false, 'Failed to register device', null, error.message);
  }
};

export const updateDevice = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const device = await ESP32Device.findByIdAndUpdate(id, updateData, { new: true });
    if (!device) {
      return sendResponse(res, 404, false, 'Device not found');
    }

    return sendResponse(res, 200, true, 'Device updated successfully', device);
  } catch (error) {
    return sendResponse(res, 500, false, 'Failed to update device', null, error.message);
  }
};

export const deleteDevice = async (req, res) => {
  try {
    const { id } = req.params;

    const device = await ESP32Device.findByIdAndDelete(id);
    if (!device) {
      return sendResponse(res, 404, false, 'Device not found');
    }

    // Also unassign from any linked gate
    if (device.railwayGate) {
      await RailwayGate.findByIdAndUpdate(device.railwayGate, { currentDevice: null });
    }

    return sendResponse(res, 200, true, 'Device deleted successfully');
  } catch (error) {
    return sendResponse(res, 500, false, 'Failed to delete device', null, error.message);
  }
};

export const getDeviceById = async (req, res) => {
  try {
    const { id } = req.params;
    const device = await ESP32Device.findById(id).populate('railwayGate');
    
    if (!device) {
      return sendResponse(res, 404, false, 'Device not found');
    }

    return sendResponse(res, 200, true, 'Device retrieved successfully', device);
  } catch (error) {
    return sendResponse(res, 500, false, 'Failed to get device', null, error.message);
  }
};

export const getDeviceByCode = async (req, res) => {
  try {
    const { deviceCode } = req.params;
    const device = await ESP32Device.findOne({ deviceCode }).populate('railwayGate');
    
    if (!device) {
      return sendResponse(res, 404, false, 'Device not found');
    }

    return sendResponse(res, 200, true, 'Device retrieved successfully', device);
  } catch (error) {
    return sendResponse(res, 500, false, 'Failed to get device by code', null, error.message);
  }
};

export const getAllDevices = async (req, res) => {
  try {
    const devices = await ESP32Device.find().populate('railwayGate', 'gateCode gateName');
    return sendResponse(res, 200, true, 'Devices retrieved successfully', devices);
  } catch (error) {
    return sendResponse(res, 500, false, 'Failed to get all devices', null, error.message);
  }
};

export const updateFirmwareVersion = async (req, res) => {
  try {
    const { id } = req.params;
    const { firmwareVersion } = req.body;

    if (!firmwareVersion) {
      return sendResponse(res, 400, false, 'firmwareVersion is required');
    }

    const device = await ESP32Device.findByIdAndUpdate(
      id,
      { firmwareVersion },
      { new: true }
    );

    if (!device) {
      return sendResponse(res, 404, false, 'Device not found');
    }

    return sendResponse(res, 200, true, 'Firmware version updated successfully', device);
  } catch (error) {
    return sendResponse(res, 500, false, 'Failed to update firmware version', null, error.message);
  }
};

export const markOnline = async (req, res) => {
  try {
    const { id } = req.params;

    const device = await ESP32Device.findByIdAndUpdate(
      id,
      { onlineStatus: true, lastHeartbeatAt: new Date() },
      { new: true }
    );

    if (!device) {
      return sendResponse(res, 404, false, 'Device not found');
    }

    return sendResponse(res, 200, true, 'Device marked as online', device);
  } catch (error) {
    return sendResponse(res, 500, false, 'Failed to mark device online', null, error.message);
  }
};

export const markOffline = async (req, res) => {
  try {
    const { id } = req.params;

    const device = await ESP32Device.findByIdAndUpdate(
      id,
      { onlineStatus: false },
      { new: true }
    );

    if (!device) {
      return sendResponse(res, 404, false, 'Device not found');
    }

    return sendResponse(res, 200, true, 'Device marked as offline', device);
  } catch (error) {
    return sendResponse(res, 500, false, 'Failed to mark device offline', null, error.message);
  }
};

export const updateRSSI = async (req, res) => {
  try {
    const { id } = req.params;
    const { rssi } = req.body;

    if (rssi === undefined) {
      return sendResponse(res, 400, false, 'rssi is required');
    }

    const device = await ESP32Device.findByIdAndUpdate(
      id,
      { rssi },
      { new: true }
    );

    if (!device) {
      return sendResponse(res, 404, false, 'Device not found');
    }

    return sendResponse(res, 200, true, 'RSSI updated successfully', device);
  } catch (error) {
    return sendResponse(res, 500, false, 'Failed to update RSSI', null, error.message);
  }
};

export const updateLastHeartbeat = async (req, res) => {
  try {
    const { id } = req.params;

    const device = await ESP32Device.findByIdAndUpdate(
      id,
      { lastHeartbeatAt: new Date(), onlineStatus: true },
      { new: true }
    );

    if (!device) {
      return sendResponse(res, 404, false, 'Device not found');
    }

    return sendResponse(res, 200, true, 'Last heartbeat updated successfully', device);
  } catch (error) {
    return sendResponse(res, 500, false, 'Failed to update heartbeat', null, error.message);
  }
};

export const assignRailwayGate = async (req, res) => {
  try {
    const { id } = req.params;
    const { gateId } = req.body;

    if (!gateId) {
      return sendResponse(res, 400, false, 'gateId is required');
    }

    const gate = await RailwayGate.findById(gateId);
    if (!gate) {
      return sendResponse(res, 404, false, 'Gate not found');
    }

    const device = await ESP32Device.findByIdAndUpdate(
      id,
      { railwayGate: gateId },
      { new: true }
    );

    if (!device) {
      return sendResponse(res, 404, false, 'Device not found');
    }

    // Also update the gate
    gate.currentDevice = id;
    await gate.save();

    return sendResponse(res, 200, true, 'Railway gate assigned to device', device);
  } catch (error) {
    return sendResponse(res, 500, false, 'Failed to assign railway gate', null, error.message);
  }
};

export const unassignRailwayGate = async (req, res) => {
  try {
    const { id } = req.params;

    const device = await ESP32Device.findById(id);
    if (!device) {
      return sendResponse(res, 404, false, 'Device not found');
    }

    if (device.railwayGate) {
      await RailwayGate.findByIdAndUpdate(device.railwayGate, { currentDevice: null });
    }

    device.railwayGate = null;
    await device.save();

    return sendResponse(res, 200, true, 'Railway gate unassigned successfully', device);
  } catch (error) {
    return sendResponse(res, 500, false, 'Failed to unassign railway gate', null, error.message);
  }
};
