const express = require("express");
const router = express.Router();
const Analytics = require("../models/Analytics");

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
            { $match: { actionType: "search" } },
            { $group: { _id: "$itemName", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
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