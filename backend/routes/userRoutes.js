const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Analytics = require("../models/Analytics");

/**
 * User authentication routes.
 * GET /api/users       - list registered users
 * POST /api/users/login - login or register on first access
 */
router.get("/", async (req, res) => {
  try {
    const data = await User.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // Validate password
      if (user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Update login analytics in user record
      user.loginCount = (user.loginCount || 0) + 1;
      user.lastLogin = new Date();
      await user.save();

      // Record login event in analyticslogs
      try {
        await Analytics.create({
          actionType: "login",
          userId: user._id,
          itemName: null
        });
      } catch (err) {
        console.error("Login analytics log error:", err);
      }

      return res.status(200).json({ message: "Login successful", user });
    }

    // Create new user
    user = new User({
      email,
      password,
      name: email.split("@")[0],
      created_at: new Date(),
      loginCount: 1,
      lastLogin: new Date(),
      searches: []
    });
    await user.save();

    // Record login event in analyticslogs for the new user
    try {
      await Analytics.create({
        actionType: "login",
        userId: user._id,
        itemName: null
      });
    } catch (err) {
      console.error("Login analytics log error:", err);
    }

    res.status(201).json({ message: "User created and logged in", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;