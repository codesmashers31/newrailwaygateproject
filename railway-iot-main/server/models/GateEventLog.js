import mongoose from 'mongoose';

/**
 * WHY THIS MODEL EXISTS:
 * This is the core time-series collection for gate status transitions.
 * It is an APPEND-ONLY ledger. Every time a gate opens or closes, a NEW document is created.
 * Existing records are never updated. This guarantees an immutable audit trail and historical timeline.
 * 
 * EXAMPLE MONGODB DOCUMENT:
 * {
 *   "_id": ObjectId("60d5ec49f1b2c8b1f8e4b4a4"),
 *   "railwayGate": ObjectId("60d5ec49f1b2c8b1f8e4b2a2"),
 *   "device": ObjectId("60d5ec49f1b2c8b1f8e4b3a3"),
 *   "status": "CLOSED",
 *   "sensorType": "REED_SWITCH",
 *   "source": "HTTP",
 *   "eventTime": ISODate("2026-06-25T10:04:59Z"),
 *   "receivedAt": ISODate("2026-06-25T10:05:00Z"),
 *   "processedAt": ISODate("2026-06-25T10:05:00Z"),
 *   "firmwareVersion": "v1.2.4",
 *   "ipAddress": "192.168.1.105",
 *   "rawPayload": "{\"gateCode\":\"LC-145\",\"status\":\"CLOSED\"}",
 *   "createdAt": ISODate("2026-06-25T10:05:00Z"),
 *   "updatedAt": ISODate("2026-06-25T10:05:00Z")
 * }
 */

const gateEventLogSchema = new mongoose.Schema(
  {
    // Relationship: The gate this event belongs to
    railwayGate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RailwayGate',
      required: true,
      index: true,
    },
    // Relationship: The specific ESP32 device that reported this event
    device: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ESP32Device',
      required: true,
      index: true,
    },
    // The detected physical state of the gate
    status: {
      type: String,
      enum: ['OPEN', 'CLOSED', 'UNKNOWN'],
      required: true,
    },
    // The type of hardware sensor that triggered this event
    sensorType: {
      type: String,
      enum: ['REED_SWITCH', 'LIMIT_SWITCH', 'MANUAL'],
      required: true,
    },
    // Protocol or source of the incoming event payload
    source: {
      type: String,
      enum: ['HTTP', 'MQTT', 'ADMIN'],
      required: true,
    },
    // Timing: When the ESP32 board recorded the event locally
    eventTime: {
      type: Date,
      required: true,
    },
    // Timing: When the Express.js server first received the payload
    receivedAt: {
      type: Date,
      required: true,
    },
    // Timing: When the Express.js server successfully persisted the payload
    processedAt: {
      type: Date,
      required: true,
    },
    // Metadata: The firmware version of the ESP32 at the time of event
    firmwareVersion: {
      type: String,
    },
    // Metadata: The network IP address the ESP32 used to send this event
    ipAddress: {
      type: String,
    },
    // Optional: Exact stringified JSON received from ESP32 for debugging
    rawPayload: {
      type: String,
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

// Compound index optimized for finding a gate's history in reverse chronological order
// Essential for fast time-series queries when the collection reaches millions of documents
gateEventLogSchema.index({ railwayGate: 1, eventTime: -1 });

export default mongoose.model('GateEventLog', gateEventLogSchema);
