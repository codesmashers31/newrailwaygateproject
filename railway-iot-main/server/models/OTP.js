import mongoose from 'mongoose';

/**
 * WHY THIS MODEL EXISTS:
 * Manages One-Time Passwords (OTPs) for phone number verification and login.
 * It uses a MongoDB TTL (Time-To-Live) index to automatically self-destruct 
 * documents after they expire, preventing database bloat.
 * 
 * EXAMPLE MONGODB DOCUMENT:
 * {
 *   "_id": ObjectId("60d5ec49f1b2c8b1f8e4b7a7"),
 *   "phone": "+919876543210",
 *   "otp": "459812",
 *   "expiresAt": ISODate("2026-06-25T10:10:00Z"),
 *   "verified": false,
 *   "createdAt": ISODate("2026-06-25T10:05:00Z"),
 *   "updatedAt": ISODate("2026-06-25T10:05:00Z")
 * }
 */

const otpSchema = new mongoose.Schema(
  {
    // The target email address the OTP was sent to
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    // The randomly generated passcode
    otp: {
      type: String,
      required: true,
    },
    // Expiration timestamp determining validity
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: '1m' }, // TTL Index: MongoDB deletes this doc ~1 minute after expiresAt
    },
    // Flag indicating if the user successfully proved ownership of this OTP
    verified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

export default mongoose.model('OTP', otpSchema);
