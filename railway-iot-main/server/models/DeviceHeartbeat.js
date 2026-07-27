import mongoose from 'mongoose';

/**
 * WHY THIS MODEL EXISTS:
 * Stores high-frequency, periodic health "pings" from ESP32 devices in the field.
 * Every heartbeat is recorded as a NEW document to preserve an audit trail of network
 * stability, memory usage, and uptime without updating or locking existing documents.
 * 
 * EXAMPLE MONGODB DOCUMENT:
 * {
 *   "_id": ObjectId("60d5ec49f1b2c8b1f8e4b5a5"),
 *   "device": ObjectId("60d5ec49f1b2c8b1f8e4b3a3"),
 *   "online": true,
 *   "rssi": -65,
 *   "freeHeap": 245000,
 *   "uptimeSeconds": 86400,
 *   "wifiReconnectCount": 3,
 *   "ipAddress": "192.168.1.105",
 *   "firmwareVersion": "v1.2.4",
 *   "heartbeatAt": ISODate("2026-06-25T10:05:00Z"),
 *   "createdAt": ISODate("2026-06-25T10:05:01Z"),
 *   "updatedAt": ISODate("2026-06-25T10:05:01Z")
 * }
 */

const deviceHeartbeatSchema = new mongoose.Schema(
  {
    // Relationship: The device that sent this heartbeat
    device: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ESP32Device',
      required: true,
      index: true,
    },
    // Health: Indicates if the device reported itself as online
    online: {
      type: Boolean,
      required: true,
    },
    // Health: Received Signal Strength Indicator to diagnose poor WiFi
    rssi: {
      type: Number,
    },
    // Health: Remaining RAM on the ESP32 (diagnose memory leaks)
    freeHeap: {
      type: Number,
    },
    // Health: Time in seconds since the ESP32 last rebooted
    uptimeSeconds: {
      type: Number,
    },
    // Health: How many times the device dropped and reconnected to WiFi
    wifiReconnectCount: {
      type: Number,
    },
    // Network: Current IP address of the device
    ipAddress: {
      type: String,
    },
    // Network: Firmware version currently running
    firmwareVersion: {
      type: String,
    },
    // Timing: When the ESP32 generated the heartbeat
    heartbeatAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

// Compound index for efficiently looking up the heartbeat history of a specific device
deviceHeartbeatSchema.index({ device: 1, heartbeatAt: -1 });

export default mongoose.model('DeviceHeartbeat', deviceHeartbeatSchema);
