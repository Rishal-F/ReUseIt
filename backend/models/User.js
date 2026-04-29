const mongoose = require("mongoose");
const bcrypt = require("bcryptjs"); // Ensure you run: npm install bcryptjs

/**
 * MongoDB schema for application users.
 */
const schema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  loginCount: { type: Number, default: 0 },
  searches: { type: [String], default: [] },
  lastLogin: Date,
  previousLogin: Date
}, { strict: false });

// Helper method to compare password during login
schema.methods.matchPassword = async function (enteredPassword) {
  // If you aren't using hashing yet, change this to: return enteredPassword === this.password;
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", schema, "users");