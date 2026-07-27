import mongoose from 'mongoose';

/**
 * WHY THIS MODEL EXISTS:
 * Supports secure stateless JWT authentication by storing long-lived Refresh Tokens.
 * It allows the server to forcefully revoke access by marking a token as revoked,
 * and automatically prunes expired tokens using a TTL index to maintain performance.
 * 
 * EXAMPLE MONGODB DOCUMENT:
 * {
 *   "_id": ObjectId("60d5ec49f1b2c8b1f8e4b8a8"),
 *   "user": ObjectId("60d5ec49f1b2c8b1f8e4b1a1"),
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "expiresAt": ISODate("2026-07-25T10:05:00Z"),
 *   "revoked": false,
 *   "createdAt": ISODate("2026-06-25T10:05:00Z"),
 *   "updatedAt": ISODate("2026-06-25T10:05:00Z")
 * }
 */

const refreshTokenSchema = new mongoose.Schema(
  {
    // The user who owns this session/token
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // The actual secure refresh token string
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // When this refresh token is no longer valid
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: '1m' }, // TTL Index: Document auto-deleted after expiration
    },
    // Flag allowing administrators or the system to manually kill a session early
    revoked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

export default mongoose.model('RefreshToken', refreshTokenSchema);
