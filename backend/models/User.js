const mongoose = require("mongoose");

/**
 * MongoDB schema for application users.
 * Stores credentials and account creation timestamps.
 */
const schema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  created_at: Date,
  loginCount: { type: Number, default: 0 },
  searches: { type: [String], default: [] },
  lastLogin: Date
}, { strict: false });

module.exports = mongoose.model("User", schema, "users");