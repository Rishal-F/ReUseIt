const express = require("express");
const router = express.Router();
const Service = require("../models/Service");

/**
 * Service / collector routes.
 * GET /api/services      - list all services
 * GET /api/services/search - search services by waste type
 * POST /api/services/add - add a new service / collector
 */
// Get all services
router.get("/", async (req, res) => {
  try {
    const data = await Service.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Filter services by waste type
// Enhanced multi-keyword search for services
router.get("/search", async (req, res) => {
  try {
    const { type } = req.query;
    if (!type || typeof type !== "string" || !type.trim()) {
      return res.status(400).json({ error: "Please enter a valid recyclable item." });
    }

    // Normalize and split input into keywords
    const keywords = type
      .toLowerCase()
      .split(/\s+/)
      .map(k => k.trim())
      .filter(Boolean);

    if (keywords.length === 0) {
      return res.status(400).json({ error: "Please enter a valid recyclable item." });
    }

    // Build $or query for all keywords
    const orQueries = [];
    for (const keyword of keywords) {
      orQueries.push(
        { wasteTypes: { $regex: keyword, $options: "i" } },
        { name: { $regex: keyword, $options: "i" } },
        { type: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } }
      );
    }

    // Find all matching services (deduplicated)
    const data = await Service.find({ $or: orQueries });

    if (!data || data.length === 0) {
      return res.status(404).json({ error: "No recycling options found for this item. Please try a different keyword." });
    }

    // Only return relevant fields (name + contact)
    const result = data.map(s => ({
      name: s.name,
      address: s.address,
      phone: s.phone,
      type: s.type,
      wasteTypes: s.wasteTypes,
      description: s.description,
      icon: s.icon
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// ADD COLLECTOR/SERVICE ROUTE
// POST /api/services/add
// ─────────────────────────────────────────────
router.post("/add", async (req, res) => {
  try {
    const { name, type, address, phone, icon, wasteTypes, description } = req.body;

    if (!name || !type || !address || !phone) {
      return res.status(400).json({ message: "name, type, address, and phone are required" });
    }

    const newService = new Service({
      name,
      type,
      address,
      phone,
      icon: icon || "♻️",
      wasteTypes: wasteTypes || [],
      description: description || ""
    });

    const savedService = await newService.save();
    res.status(201).json(savedService);

  } catch (err) {
    console.error("Add Service Error:", err);
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
});

module.exports = router;