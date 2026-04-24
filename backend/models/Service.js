const mongoose = require("mongoose");

/**
 * MongoDB schema for local recycling and collector services.
 * Maps waste types to contact and location information.
 */
const schema = new mongoose.Schema({
  name: String,
  type: String,
  address: String,
  phone: String,
  icon: String,
  wasteTypes: [String],
  description: String
}, { strict: false });

module.exports = mongoose.model("Service", schema, "services");