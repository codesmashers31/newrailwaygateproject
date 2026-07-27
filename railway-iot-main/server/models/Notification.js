import mongoose from 'mongoose';

/**
 * WHY THIS MODEL EXISTS:
 * Stores the history of push notifications sent to mobile application users.
 * This acts as an inbox or alert history within the React Native app.
 * 
 * EXAMPLE MONGODB DOCUMENT:
 * {
 *   "_id": ObjectId("60d5ec49f1b2c8b1f8e4b6a6"),
 *   "user": ObjectId("60d5ec49f1b2c8b1f8e4b1a1"),
 *   "railwayGate": ObjectId("60d5ec49f1b2c8b1f8e4b2a2"),
 *   "title": "Gate Closed",
 *   "message": "Main Street Level Crossing is now CLOSED.",
 *   "type": "GATE_STATUS",
 *   "isRead": false,
 *   "sentAt": ISODate("2026-06-25T10:06:00Z"),
 *   "readAt": null,
 *   "createdAt": ISODate("2026-06-25T10:06:00Z"),
 *   "updatedAt": ISODate("2026-06-25T10:06:00Z")
 * }
 */

const notificationSchema = new mongoose.Schema(
  {
    // The mobile app user who receives this notification
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Optional: The specific railway gate this notification relates to
    railwayGate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RailwayGate',
    },
    // Short headline of the notification
    title: {
      type: String,
      required: true,
      trim: true,
    },
    // Detailed description or body of the notification
    message: {
      type: String,
      required: true,
      trim: true,
    },
    // Categorization for varying icon or navigation logic in the mobile app
    type: {
      type: String,
      enum: ['SYSTEM', 'GATE_STATUS', 'ALERT'],
      default: 'GATE_STATUS',
    },
    // Status flag tracking if the user has opened this notification
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    // Exact time the push notification was dispatched by the server
    sentAt: {
      type: Date,
    },
    // Exact time the user opened the notification
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

// Compound index to quickly fetch unread notifications for a specific user
notificationSchema.index({ user: 1, isRead: 1 });

export default mongoose.model('Notification', notificationSchema);
