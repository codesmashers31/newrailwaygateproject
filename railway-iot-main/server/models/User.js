import mongoose from 'mongoose';

/**
 * WHY THIS MODEL EXISTS:
 * Represents mobile application users who interact with the Railway Gate Live Monitoring MVP.
 * It manages their profile, authentication, role-based access, preferences, and push notification tokens.
 * 
 * EXAMPLE MONGODB DOCUMENT:
 * {
 *   "_id": ObjectId("60d5ec49f1b2c8b1f8e4b1a1"),
 *   "name": "John Doe",
 *   "phone": "+919876543210",
 *   "email": "john.doe@example.com",
 *   "role": "USER",
 *   "favouriteGates": [ObjectId("60d5ec49f1b2c8b1f8e4b2a2")],
 *   "notificationEnabled": true,
 *   "fcmToken": "eXfD9...",
 *   "lastLoginAt": ISODate("2026-06-25T10:00:00Z"),
 *   "createdAt": ISODate("2026-06-25T08:00:00Z"),
 *   "updatedAt": ISODate("2026-06-25T10:00:00Z")
 * }
 */

const userSchema = new mongoose.Schema(
  {
    // The full name of the user
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    // Unique phone number used for login and OTP verification
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      index: true,
    },
    // Optional email address
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    // Optional password, keeping the door open for future traditional authentication
    password: {
      type: String,
      select: false,
    },
    // System role to separate normal users from administrators
    role: {
      type: String,
      enum: ['USER', 'ADMIN'],
      default: 'USER',
    },
    // References to gates the user wants to monitor specifically
    favouriteGates: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RailwayGate',
      },
    ],
    // Boolean flag allowing users to turn off all notifications
    notificationEnabled: {
      type: Boolean,
      default: true,
    },
    // Device token for Firebase Cloud Messaging push notifications
    fcmToken: {
      type: String,
    },
    // Tracks the most recent time the user logged into the app
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

export default mongoose.model('User', userSchema);
