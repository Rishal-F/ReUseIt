const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

/**
 * Backend API server for Waste Reuse Helper.
 * Provides route mounting, middleware setup, and MongoDB connection.
 */
const app = express();

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());

// ================= ROUTES =================
app.use("/api/waste", require("./routes/wasteRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/services", require("./routes/serviceRoutes"));
app.use("/api/reuse", require("./routes/reuseIdeaRoutes"));
app.use("/api/stats", require("./routes/statsRoutes"));

// ================= MODEL SAFETY =================
try {
  require("./models/reuseIdeaModel");
} catch (err) {}

try {
  require("./models/serviceModel");
} catch (err) {}

// ================= TEST ROUTE =================
app.get("/", (req, res) => {
  res.send("API running...");
});

// ================= DATABASE CONNECTION =================
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 10000,
  family: 4
})
.then(() => {
  console.log("MongoDB Connected");
  console.log("DB:", mongoose.connection.name);
})
.catch((err) => {
  console.log("Mongo FULL Error:", err);
});

// ================= START SERVER =================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});