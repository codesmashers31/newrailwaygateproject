import mongoose from 'mongoose';

/**
 * WHY THIS MODEL EXISTS:
 * Serves as the master data record for a physical Railway Gate. It stores permanent location
 * and identification details. It also stores the single LATEST known state of the gate.
 * History is NEVER stored here to ensure this collection remains small and extremely fast to query.
 * 
 * EXAMPLE MONGODB DOCUMENT:
 * {
 *   "_id": ObjectId("60d5ec49f1b2c8b1f8e4b2a2"),
 *   "gateCode": "LC-145",
 *   "gateName": "Main Street Level Crossing",
 *   "latitude": 28.7041,
 *   "longitude": 77.1025,
 *   "address": "Intersection of Main St & 5th Ave",
 *   "city": "New Delhi",
 *   "state": "Delhi",
 *   "installationDate": ISODate("2024-01-15T00:00:00Z"),
 *   "isActive": true,
 *   "currentDevice": ObjectId("60d5ec49f1b2c8b1f8e4b3a3"),
 *   "currentStatus": "CLOSED",
 *   "lastStatusChangedAt": ISODate("2026-06-25T10:05:00Z"),
 *   "createdAt": ISODate("2024-01-15T08:00:00Z"),
 *   "updatedAt": ISODate("2026-06-25T10:05:00Z")
 * }
 */

const railwayGateSchema = new mongoose.Schema(
  {
    // Unique identifier for the gate (e.g., official railway code LC-145)
    gateCode: {
      type: String,
      required: [true, 'Gate code is required'],
      unique: true,
      trim: true,
      index: true,
    },
    // Human-readable name for the gate
    gateName: {
      type: String,
      required: [true, 'Gate name is required'],
      trim: true,
    },
    // GPS Latitude for mapping
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
    },
    // GPS Longitude for mapping
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
    },
    // Physical street address
    address: {
      type: String,
      trim: true,
    },
    // City where the gate is located
    city: {
      type: String,
      trim: true,
      index: true,
    },
    // State/Province where the gate is located
    state: {
      type: String,
      trim: true,
    },
    // Date the gate infrastructure was originally installed
    installationDate: {
      type: Date,
    },
    // Whether this gate is currently operational in the system
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    // Relationship: Links to the ESP32 hardware device currently assigned to this gate
    currentDevice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ESP32Device',
      index: true,
    },
    // Current Live State: OPEN, CLOSED, or UNKNOWN (if offline/error)
    currentStatus: {
      type: String,
      enum: ['OPEN', 'CLOSED', 'UNKNOWN'],
      default: 'UNKNOWN',
    },
    // The exact timestamp when currentStatus last changed
    lastStatusChangedAt: {
      type: Date,
    },
    // The exact timestamp when the gate was last opened
    lastOpenedAt: {
      type: Date,
      default: null,
    },
    // The exact timestamp when the gate was last closed
    lastClosedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

// Geo-index for future location radius searches
railwayGateSchema.index({ latitude: 1, longitude: 1 });

export default mongoose.model('RailwayGate', railwayGateSchema);
