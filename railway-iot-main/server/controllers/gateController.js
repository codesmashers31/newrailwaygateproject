import Gate from '../models/Gate.js';

// CREATE Gate
export const createGate = async (req, res) => {
  try {
    const { gateId, gateName, location } = req.body;
    
    const gateExists = await Gate.findOne({ gateId });
    if (gateExists) {
      return res.status(400).json({ message: 'Gate ID already exists' });
    }
    
    const gate = await Gate.create({
      gateId, gateName, location,
      status: 'Open', currentUpdate: 'System Initialized', lastUpdated: new Date()
    });
    
    res.status(201).json({ message: 'Gate created successfully', gate });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// GET All Gates
export const getGates = async (req, res) => {
  try {
    const gates = await Gate.find({});
    res.status(200).json(gates);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// GET Gate By ID
export const getGateById = async (req, res) => {
  try {
    const gate = await Gate.findById(req.params.id);
    if (!gate) return res.status(404).json({ message: 'Gate not found' });
    res.status(200).json(gate);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// UPDATE Gate (Generic)
export const updateGate = async (req, res) => {
  try {
    const gate = await Gate.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!gate) return res.status(404).json({ message: 'Gate not found' });
    res.status(200).json({ message: 'Gate updated successfully', gate });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// DELETE Gate
export const deleteGate = async (req, res) => {
  try {
    const gate = await Gate.findByIdAndDelete(req.params.id);
    if (!gate) return res.status(404).json({ message: 'Gate not found' });
    res.status(200).json({ message: 'Gate deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// UPDATE Gate Status (Sensor Specific)
export const updateGateStatus = async (req, res) => {
  try {
    const { gateId, sensorStatus } = req.body;

    if (!gateId || !sensorStatus) {
      return res.status(400).json({ message: 'Gate ID and sensor status are required' });
    }

    const gate = await Gate.findOne({ gateId });

    if (!gate) {
      return res.status(404).json({ message: 'Gate not found' });
    }

    if (sensorStatus === 'Train Approaching') {
      gate.status = 'Closed';
      gate.closeTime = new Date();
      gate.currentUpdate = 'Gate Closed - Train Approaching';
    } else if (sensorStatus === 'Train Passed') {
      gate.status = 'Open';
      gate.openTime = new Date();
      gate.currentUpdate = 'Gate Opened - Train Passed';
      
      if (gate.closeTime) {
        const waitingTimeMs = gate.openTime - gate.closeTime;
        gate.waitingTime = Math.round(waitingTimeMs / 60000); 
      }
    }

    gate.sensorStatus = sensorStatus;
    gate.lastUpdated = new Date();

    await gate.save();

    res.status(200).json({ message: 'Gate status updated successfully', gate });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
