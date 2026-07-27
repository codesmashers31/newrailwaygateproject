import RailwayGate from '../models/RailwayGate.js';
import ESP32Device from '../models/ESP32Device.js';
import GateEventLog from '../models/GateEventLog.js';

const sendResponse = (res, statusCode, success, message, data = null, error = null) => {
  const response = { success, message };
  if (data) response.data = data;
  if (error) response.error = error;
  return res.status(statusCode).json(response);
};

export const createGate = async (req, res) => {
  try {
    const { gateCode, gateName, latitude, longitude, address, city, state, installationDate } = req.body;

    if (!gateCode || !gateName || latitude === undefined || longitude === undefined) {
      return sendResponse(res, 400, false, 'gateCode, gateName, latitude, and longitude are required');
    }

    const existingGate = await RailwayGate.findOne({ gateCode });
    if (existingGate) {
      return sendResponse(res, 400, false, 'Gate with this code already exists');
    }

    const newGate = await RailwayGate.create({
      gateCode,
      gateName,
      latitude,
      longitude,
      address,
      city,
      state,
      installationDate,
    });

    return sendResponse(res, 201, true, 'Gate created successfully', newGate);
  } catch (error) {
    return sendResponse(res, 500, false, 'Failed to create gate', null, error.message);
  }
};

export const updateGate = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const gate = await RailwayGate.findByIdAndUpdate(id, updateData, { new: true });
    if (!gate) {
      return sendResponse(res, 404, false, 'Gate not found');
    }

    return sendResponse(res, 200, true, 'Gate updated successfully', gate);
  } catch (error) {
    return sendResponse(res, 500, false, 'Failed to update gate', null, error.message);
  }
};

export const deleteGate = async (req, res) => {
  try {
    const { id } = req.params;

    // Soft delete preferred
    const gate = await RailwayGate.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!gate) {
      return sendResponse(res, 404, false, 'Gate not found');
    }

    return sendResponse(res, 200, true, 'Gate soft-deleted successfully', gate);
  } catch (error) {
    return sendResponse(res, 500, false, 'Failed to delete gate', null, error.message);
  }
};

export const getAllGates = async (req, res) => {
  try {
    const gates = await RailwayGate.find({ isActive: true }).populate('currentDevice');
    return sendResponse(res, 200, true, 'Gates retrieved successfully', gates);
  } catch (error) {
    return sendResponse(res, 500, false, 'Failed to get gates', null, error.message);
  }
};

export const getGateById = async (req, res) => {
  try {
    const { id } = req.params;
    const gate = await RailwayGate.findById(id).populate('currentDevice');
    
    if (!gate) {
      return sendResponse(res, 404, false, 'Gate not found');
    }

    return sendResponse(res, 200, true, 'Gate retrieved successfully', gate);
  } catch (error) {
    return sendResponse(res, 500, false, 'Failed to get gate', null, error.message);
  }
};

export const getGateByCode = async (req, res) => {
  try {
    const { gateCode } = req.params;
    const gate = await RailwayGate.findOne({ gateCode }).populate('currentDevice');
    
    if (!gate) {
      return sendResponse(res, 404, false, 'Gate not found');
    }

    return sendResponse(res, 200, true, 'Gate retrieved successfully', gate);
  } catch (error) {
    return sendResponse(res, 500, false, 'Failed to get gate by code', null, error.message);
  }
};

export const getCurrentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const gate = await RailwayGate.findById(id).select('currentStatus lastStatusChangedAt lastOpenedAt lastClosedAt currentDevice');
    
    if (!gate) {
      return sendResponse(res, 404, false, 'Gate not found');
    }

    return sendResponse(res, 200, true, 'Current status retrieved successfully', gate);
  } catch (error) {
    return sendResponse(res, 500, false, 'Failed to get current status', null, error.message);
  }
};

export const getGateHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const history = await GateEventLog.find({ railwayGate: id })
      .sort({ eventTime: -1 })
      .limit(limit)
      .populate('device', 'deviceCode firmwareVersion');

    return sendResponse(res, 200, true, 'Gate history retrieved successfully', history);
  } catch (error) {
    return sendResponse(res, 500, false, 'Failed to get gate history', null, error.message);
  }
};

export const assignESP32Device = async (req, res) => {
  try {
    const { id } = req.params;
    const { deviceId } = req.body;

    if (!deviceId) {
      return sendResponse(res, 400, false, 'deviceId is required');
    }

    const device = await ESP32Device.findById(deviceId);
    if (!device) {
      return sendResponse(res, 404, false, 'Device not found');
    }

    const gate = await RailwayGate.findByIdAndUpdate(
      id,
      { currentDevice: deviceId },
      { new: true }
    ).populate('currentDevice');

    if (!gate) {
      return sendResponse(res, 404, false, 'Gate not found');
    }

    // Also update the device's reference to the gate
    device.railwayGate = id;
    await device.save();

    return sendResponse(res, 200, true, 'Device assigned to gate successfully', gate);
  } catch (error) {
    return sendResponse(res, 500, false, 'Failed to assign device', null, error.message);
  }
};

export const unassignDevice = async (req, res) => {
  try {
    const { id } = req.params;

    const gate = await RailwayGate.findById(id);
    if (!gate) {
      return sendResponse(res, 404, false, 'Gate not found');
    }

    if (gate.currentDevice) {
      const device = await ESP32Device.findById(gate.currentDevice);
      if (device) {
        device.railwayGate = null;
        await device.save();
      }
    }

    gate.currentDevice = null;
    await gate.save();

    return sendResponse(res, 200, true, 'Device unassigned from gate successfully', gate);
  } catch (error) {
    return sendResponse(res, 500, false, 'Failed to unassign device', null, error.message);
  }
};

export const updateCurrentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['OPEN', 'CLOSED', 'UNKNOWN'].includes(status)) {
      return sendResponse(res, 400, false, 'Invalid status value');
    }

    const updatePayload = { 
      currentStatus: status,
      lastStatusChangedAt: new Date()
    };
    if (status === 'OPEN') updatePayload.lastOpenedAt = new Date();
    else if (status === 'CLOSED') updatePayload.lastClosedAt = new Date();

    const gate = await RailwayGate.findByIdAndUpdate(
      id,
      updatePayload,
      { new: true }
    );

    if (!gate) {
      return sendResponse(res, 404, false, 'Gate not found');
    }

    return sendResponse(res, 200, true, 'Gate status manually updated successfully', gate);
  } catch (error) {
    return sendResponse(res, 500, false, 'Failed to update current status', null, error.message);
  }
};
