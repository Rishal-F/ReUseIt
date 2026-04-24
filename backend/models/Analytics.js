const mongoose = require("mongoose");

const analyticsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  actionType: { type: String, required: true }, // e.g., "search", "login"
  itemName: { type: String, default: null },
  timestamp: { type: Date, default: Date.now }
});

// CRITICAL: This must match the name seen in your MongoDB screenshot
module.exports = mongoose.model("Analytics", analyticsSchema, "analyticslogs");