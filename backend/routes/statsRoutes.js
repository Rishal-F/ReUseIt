const express = require("express");
const router = express.Router();
const Analytics = require("../models/Analytics");

// In statsRoutes.js, inside $facet, add this:
totalSearchCount: [
  { $match: { actionType: "search" } },
  { $count: "count" }
],

router.get("/", async (req, res) => {
  try {
    const results = await Analytics.aggregate([
      {
        $facet: {
          totalLogins: [
            { $match: { actionType: "login" } },
            { $count: "count" }
          ],
          totalSearches: [
            { $match: { actionType: "search", itemName: { $ne: null } } },
            { $group: { _id: "$itemName", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ],
          activeUsers: [
            { $match: { userId: { $ne: null } } },
            { $group: { _id: "$userId" } },
            { $count: "count" }
          ]
        }
      }
    ]);

    const data = results[0] || {};
    res.json({
      totalSearches: data.totalSearchCount?.[0]?.count || 0,
      totalLogins: data.totalLogins?.[0]?.count || 0,
      activeUsers: data.activeUsers?.[0]?.count || 0,
      topSearchedWasteItems: (data.totalSearches || []).map(item => ({
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