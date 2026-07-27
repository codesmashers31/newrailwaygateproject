import mongoose from 'mongoose';

/**
 * WHY THIS MODEL EXISTS:
 * Represents the physical ESP32 IoT board installed at a railway gate.
 * It tracks hardware-specific identity, network details, and live health metrics.
 * Separating device from gate allows swapping faulty hardware without losing gate history.
 * 
 * EXAMPLE MONGODB DOCUMENT:
 * {
 *   "_id": ObjectId("60d5ec49f1b2c8b1f8e4b3a3"),
 *   "deviceCode": "ESP-9988",
 *   "deviceName": "Gate Sensor Node Alpha",
 *   "serialNumber": "SN-ESP-2024-001",
 *   "macAddress": "00:1B:44:11:3A:B7",
 *   "firmwareVersion": "v1.2.4",
 *   "hardwareVersion": "v2.0",
 *   "wifiSSID": "RailNet_IoT",
 *   "ipAddress": "192.168.1.105",
 *   "railwayGate": ObjectId("60d5ec49f1b2c8b1f8e4b2a2"),
 *   "onlineStatus": true,
 *   "lastHeartbeatAt": ISODate("2026-06-25T10:05:30Z"),
 *   "rssi": -65,
 *   "batteryLevel": 98,
 *   "createdAt": ISODate("2024-01-15T08:00:00Z"),
 *   "updatedAt": ISODate("2026-06-25T10:05:30Z")
 * }
 */

const esp32DeviceSchema = new mongoose.Schema(
  {
    // Unique identifier for the hardware unit
    deviceCode: {
      type: String,
      required: [true, 'Device code is required'],
      unique: true,
      trim: true,
      index: true,
    },
    // Human-readable internal name for the device
    deviceName: {
      type: String,
      trim: true,
    },
    // Manufacturer serial number
    serialNumber: {
      type: String,
      trim: true,
    },
    // Physical MAC address of the ESP32 WiFi chip
    macAddress: {
      type: String,
      unique: true,
      trim: true,
      sparse: true,
    },
    // The current firmware code version running on the ESP32
    firmwareVersion: {
      type: String,
    },
    // Hardware board version
    hardwareVersion: {
      type: String,
    },
    // Last known WiFi network SSID the device connected to
    wifiSSID: {
      type: String,
    },
    // Last known local/public IP address
    ipAddress: {
      type: String,
    },
    // Relationship: The railway gate where this specific device is physically installed
    railwayGate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RailwayGate',
      index: true,
    },
    // Live Status: Boolean indicating if the device is currently transmitting heartbeats
    onlineStatus: {
      type: Boolean,
      default: false,
      index: true, // Quickly query for all offline devices
    },
    // Timestamp of the last received heartbeat ping
    lastHeartbeatAt: {
      type: Date,
      index: true,
    },
    // Received Signal Strength Indicator for WiFi health
    rssi: {
      type: Number,
    },
    // Future field: battery life remaining percentage
    batteryLevel: {
      type: Number,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

export default mongoose.model('ESP32Device', esp32DeviceSchema);
