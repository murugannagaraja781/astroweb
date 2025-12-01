const mongoose = require("mongoose");

const ChatCallDetailsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    astrologerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    initiatedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["requested", "accepted", "active", "completed", "rejected"],
      default: "requested",
    },
    acceptedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    duration: {
      type: Number,
      default: 0,
    },
    ratePerMinute: {
      type: Number,
      default: 0,
    },
    totalCost: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ChatCallDetailsSchema.index({ userId: 1, status: 1 });
ChatCallDetailsSchema.index({ astrologerId: 1, status: 1 });

// FORCE Mongoose to use existing collection in MongoDB
module.exports = mongoose.model(
  "ChatCallDetails",
  ChatCallDetailsSchema,
  "chatcalldetails" // <-- EXACT COLLECTION NAME
);
