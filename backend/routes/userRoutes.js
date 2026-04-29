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

    // 1. Validation check
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // 2. Check if user exists
    let user = await User.findOne({ email: email.toLowerCase().trim() });

    if (user) {
      // Validate password (Note: plain text comparison used as per your existing code)
      if (user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Update login analytics in user record
      user.previousLogin = user.lastLogin; 
      user.loginCount = (user.loginCount || 0) + 1;
      user.lastLogin = new Date();
      
      // Explicitly mark modified if using { strict: false } to ensure Mongoose detects changes
      user.markModified('lastLogin');
      user.markModified('previousLogin');
      
      await user.save();

      // Record login event in analyticslogs
      try {
        await Analytics.create({
          actionType: "login",
          userId: user._id,
          itemName: "User Login"
        });
      } catch (err) {
        console.error("Login analytics log error:", err);
      }

      return res.status(200).json({ message: "Login successful", user });
    }

    // 3. Create new user if they don't exist
    const newUser = new User({
      email: email.toLowerCase().trim(),
      password: password,
      name: email.split("@")[0],
      created_at: new Date(),
      loginCount: 1,
      lastLogin: new Date(),
      previousLogin: null,
      searches: []
    });

    await newUser.save();

    // Record login event for the new user
    try {
      await Analytics.create({
        actionType: "registration_login",
        userId: newUser._id,
        itemName: "New User Registered"
      });
    } catch (err) {
      console.error("Registration analytics log error:", err);
    }

    res.status(201).json({ message: "User created and logged in", user: newUser });

  } catch (err) {
    console.error("Login route error:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});

module.exports = router;