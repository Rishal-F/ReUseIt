const express = require("express");
const router = express.Router();
const Analytics = require("../models/Analytics");

router.get("/", async (req, res) => {
  try {
    const results = await Analytics.aggregate([
      {
        $facet: {
          // Counts every document where actionType is 'login'
          totalLogins: [
            { $match: { actionType: "login" } },
            { $count: "count" }
          ],
          // Aggregates top 10 specific items searched via Gemini
          topSearchedItems: [
            { $match: { actionType: "search", itemName: { $ne: null } } },
            { $group: { _id: "$itemName", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ],
          // Counts unique users who have performed any action
          activeUsers: [
            { $match: { userId: { $ne: null } } },
            { $group: { _id: "$userId" } },
            { $count: "count" }
          ],
          // New: Counts the total volume of all searches performed
          totalSearchCount: [
            { $match: { actionType: "search" } },
            { $count: "count" }
          ]
        }
      }
    ]);

    const data = results[0] || {};

    res.json({
      // We use the keys defined inside the $facet above
      totalSearches: data.totalSearchCount?.[0]?.count || 0,
      totalLogins: data.totalLogins?.[0]?.count || 0,
      activeUsers: data.activeUsers?.[0]?.count || 0,
      topSearchedWasteItems: (data.topSearchedItems || []).map(item => ({
        itemName: item._id || "Unknown",
        count: item.count
      }))
    });
  } catch (err) {
    console.error("Stats aggregation error:", err);
    res.status(500).json({ error: "Unable to calculate analytics statistics." });
  }
});

module.exports = router;