const express = require("express");
const router = express.Router();
const WasteItem = require("../models/WasteItem");
const Analytics = require("../models/Analytics"); 

/**
 * Waste item routes.
 * GET /api/waste       - list all waste items
 * POST /api/waste      - submit a new waste item row
 */
router.get("/", async (req, res) => {
  try {
    const data = await WasteItem.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// POST /api/waste
router.post("/", async (req, res) => {
  try {
    const { name, category, user } = req.body;
    if (!name || !user) {
      return res.status(400).json({ message: "name and user are required" });
    }
    const newWaste = new WasteItem({
      name,
      category: category || "General",
      user
    });
    const savedWaste = await newWaste.save();
    // Log to analytics
try {
  await Analytics.create({
    actionType: "search",
    itemName: name.toLowerCase().trim(),
    userId: user || null
  });
} catch (err) {
  console.error("Analytics log error:", err);
}
    res.status(201).json(savedWaste);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;