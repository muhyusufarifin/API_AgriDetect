const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const cors = require("cors"); // <<< TAMBAHKAN BARIS INI

// Load environment variables from .env file
dotenv.config();

// Import routes
const authRoutes = require("./routes/auth");
const imageRoutes = require("./routes/images");
const analyzeRoutes = require("./routes/analyze");

const app = express();

// --- CORS Middleware ---
app.use(cors()); // <<< TAMBAHKAN BARIS INI DI SINI, SEBELUM ROUTE APAPUN

// --- Database Connection ---
const mongoURI = process.env.MONGO_URI;

mongoose
  .connect(mongoURI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

// --- Middleware ---
app.use(express.json()); // For parsing JSON request bodies

// Serve static files from the 'uploads' directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- Penanganan HEAD Request ---
app.head("/api", (req, res) => {
  res.status(200).end();
});

// --- API Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/images", analyzeRoutes);

// --- Global Error Handling Middleware ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Server error", error: err.message });
});

// --- Start Server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Base URL: http://localhost:${PORT}/api`);
});    
