const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const ReuseIdea = require("../models/ReuseIdea");
const Analytics = require("../models/Analytics");

function getGeminiApiKey() {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.Gemini_api_key ||
    process.env.GOOGLE_API_KEY ||
    process.env.API_KEY ||
    null
  );
}

async function fetchGeminiReuseIdeas(item) {
  const geminiApiKey = getGeminiApiKey();
  console.log("Gemini API Key:", geminiApiKey ? "Present (length: " + geminiApiKey.length + ")" : "Missing");
  if (!geminiApiKey) {
    throw new Error("Gemini API key is not configured.");
  }

  const prompt = `You are an eco-friendly reuse assistant. Provide 3 concrete reuse ideas for "${item}". Return only valid JSON in an array of objects with keys: waste_name, category, title, description, video_link, difficulty. Use difficulty values like "Easy", "Medium", or "Hard".`;

  const modelNames = [
    "models/gemini-pro-latest",
    "models/gemini-flash-latest",
    "models/gemini-flash-lite-latest"
  ];

  /*const modelNames = [
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
  "gemini-1.0-pro"
];*/

/*const modelNames = [
  "models/gemini-2.0-flash",
  "models/gemini-2.0-flash-lite",
  "models/gemini-1.5-flash-latest",
];*/
  let result;
  let lastError;
  const attemptedModels = [];

  for (const modelName of modelNames) {
    attemptedModels.push(modelName);
    try {
      const genai = new GoogleGenerativeAI(geminiApiKey);
      const model = genai.getGenerativeModel({ model: modelName });
      result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000
        }
      });
      break;
    } catch (err) {
      lastError = err;
      console.warn(`Gemini model ${modelName} failed:`, err?.message || err);
    }
  }

  if (!result) {
    throw new Error(
      `Gemini generation failed for all supported models (${attemptedModels.join(", ")}). ` +
      `Last error: ${lastError?.message || lastError || "unknown"}`
    );
  }

  const response = result?.response;
  const candidateContent = response?.candidates?.[0]?.content;
  const parts = candidateContent?.parts;
  const textResult = Array.isArray(parts)
    ? parts.map(part => part.text || "").join("")
    : candidateContent?.text || "";

  if (!textResult) {
    throw new Error("Gemini response did not contain parseable output.");
  }

  let items = [];
  try {
    items = JSON.parse(textResult);
  } catch (err) {
    const match = textResult.match(/(\[.*\])/s);
    if (match) {
      items = JSON.parse(match[1]);
    }
  }

  if (!Array.isArray(items)) {
    throw new Error("Gemini output was not a JSON array.");
  }

  return items.map(item => ({
    waste_name: item.waste_name || item.wasteName || item.item || "Unknown item",
    category: item.category || "General",
    title: item.title || "Reuse idea",
    description: item.description || item.details || "No description available.",
    difficulty: item.difficulty || item.level || "Easy",
    video_link: item.video_link || item.videoLink || ""
  }));
}

/**
 * Reuse idea routes.
 * GET /api/reuse/search - search reuse ideas for a waste item
 * POST /api/reuse/add   - create a new reuse idea suggestion
 */
// ─────────────────────────────────────────────
// SEARCH ROUTE
// GET /api/reuse/search?q=plastic bottle
// ─────────────────────────────────────────────
router.get("/search", async (req, res) => {
  try {
    const query = req.query.q;

    // Input validation
    if (!query || typeof query !== "string" || !query.trim()) {
      return res.status(400).json({ message: "Please enter a valid recyclable item." });
    }

    const normalizedQuery = query.toLowerCase().trim();

    // Normalize and split input into keywords
    const keywords = normalizedQuery
      .split(/\s+/)
      .map(k => k.trim())
      .filter(Boolean);

    if (keywords.length === 0) {
      return res.status(400).json({ message: "Please enter a valid recyclable item." });
    }

    // Log search analytics for every valid search
    // Log search analytics for every valid search
try {
  const mongoose = require("mongoose");
  const rawUserId = req.query.userId;
  const safeUserId = rawUserId && mongoose.isValidObjectId(rawUserId) ? rawUserId : null;

  await Analytics.create({
    actionType: "search",
    itemName: normalizedQuery,
    userId: safeUserId
  });
} catch (err) {
  console.error("Analytics log error:", err);
}

    // Build $or query for all keywords
    const orQueries = keywords.map(keyword => ({
      waste_name: { $regex: keyword, $options: "i" }
    }));

    // Find all matching reuse ideas (deduplicated)
    const data = await ReuseIdea.find({ $or: orQueries }).limit(20);

    if (!data || data.length === 0) {
      try {
        const generatedData = await fetchGeminiReuseIdeas(query);

        // save the generated reuse ideas so future searches can use local DB results
        await ReuseIdea.insertMany(
          generatedData.map(item => ({
            waste_name: item.waste_name || query,
            category: item.category,
            title: item.title,
            description: item.description,
            video_link: item.video_link,
            difficulty: item.difficulty
          }))
        );

        return res.json(generatedData);
      } catch (err) {
        console.error("Gemini fallback error:", err);
        return res.status(404).json({ message: "No recycling options found for this item. Please try a different keyword." });
      }
    }

    // Record search in user's analytics if userId provided
    if (req.query.userId) {
      try {
        const User = require("../models/User");
        const user = await User.findById(req.query.userId);
        if (user) {
          user.searches.push(query);
          await user.save();
        }
      } catch (err) {
        console.error("Error recording search:", err);
      }
    }

    res.json(data);

  } catch (err) {
    console.error("Search Error:", err);
    res.status(500).json({
      error: "Internal Server Error",
      message: err.message
    });
  }
});

// ─────────────────────────────────────────────
// ADD REUSE IDEA ROUTE
// POST /api/reuse/add
// ─────────────────────────────────────────────
router.post("/add", async (req, res) => {
  try {
    const { waste_name, category, title, description, video_link, difficulty } = req.body;

    if (!waste_name || !title) {
      return res.status(400).json({ message: "waste_name and title are required" });
    }

    const newIdea = new ReuseIdea({
      waste_name,
      category: category || "General",
      title,
      description: description || "",
      video_link: video_link || "",
      difficulty: difficulty || "Easy"
    });

    const savedIdea = await newIdea.save();
    res.status(201).json(savedIdea);

  } catch (err) {
    console.error("Add Error:", err);
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
});

module.exports = router;