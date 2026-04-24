const mongoose = require("mongoose");

/**
 * MongoDB schema for reuse ideas.
 * Stores instructions and metadata for reusing a waste item.
 */
const schema = new mongoose.Schema({
  waste_name: String,
  category: String,
  title: String,
  description: String,
  video_link: String,
  difficulty: String
}, { strict: false });

// IMPORTANT: explicitly bind to correct collection
module.exports = mongoose.model("ReuseIdea", schema, "reuse_ideas");