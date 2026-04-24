const mongoose = require("mongoose");

/**
 * MongoDB schema for waste items submitted by users.
 * Each waste item links to the submitting user.
 */
const schema = new mongoose.Schema({
  name: String,
  category: String,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
}, { strict: false });

module.exports = mongoose.model("WasteItem", schema, "waste_items");