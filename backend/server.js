const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

// ROUTE IMPORTS
const wasteRoutes = require("./routes/wasteRoutes");
const userRoutes = require("./routes/userRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const reuseIdeaRoutes = require("./routes/reuseIdeaRoutes");
const statsRoutes = require("./routes/statsRoutes"); // Added this line

// MODEL IMPORTS (just load them once)
require("./models/ReuseIdea");
require("./models/Service");

const app = express();

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());

// ================= ROUTES =================
app.use("/api/waste", wasteRoutes);
app.use("/api/users", userRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/reuse", reuseIdeaRoutes);
app.use("/api/stats", statsRoutes); // Added this line

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