// ─────────────────────────────────────────────────────────────
// server.js  —  Scholar SMS  |  Entry Point
// ─────────────────────────────────────────────────────────────

require("dotenv").config();                             // load .env first

const express       = require("express");
const cors          = require("cors");
const connectDatabase = require("./config/database");
const authRoutes    = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");

const app  = express();
const PORT = process.env.PORT || 5004;

// ── Connect to MongoDB ───────────────────────────────────────
connectDatabase();

// ── CORS ─────────────────────────────────────────────────────
// Allows requests from file://, any localhost port, and 127.0.0.1
// Adjust for production by restricting to your actual domain.
app.use(cors({
  origin: (origin, cb) => cb(null, true),   // allow all in development
  credentials: true,
  methods:     ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.options("*", cors());    // handle CORS preflight for all routes

// ── Body parsing ─────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ─────────────────────────────────────────────
app.get("/", (_, res) =>
  res.json({
    success: true,
    message: "🎓 Scholar SMS API is running!",
    version: "3.0.0",
    endpoints: {
      "POST /auth/register":   "Create a new account",
      "POST /auth/login":      "Log in and get JWT",
      "GET  /auth/me":         "Get my profile (auth required)",
      "GET  /students":        "List students (auth required)",
      "POST /students":        "Add a student (auth required)",
      "PUT  /students/:id":    "Update a student (auth required)",
      "DELETE /students/:id":  "Delete a student (auth required)",
    },
  })
);

// ── API Routes ────────────────────────────────────────────────
app.use("/auth",     authRoutes);
app.use("/students", studentRoutes);

// ── 404 handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route  ${req.method} ${req.originalUrl}  does not exist.`,
  });
});

// ── Global error handler ──────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(`[ERROR]  ${req.method} ${req.originalUrl}  →  ${err.message}`);

  let status  = err.statusCode || err.status || 500;
  let message = err.message    || "Internal Server Error";

  // Mongoose: bad ObjectId (e.g. "abc" as :id)
  if (err.name === "CastError") {
    status  = 400;
    message = `Invalid ID format: ${err.value}`;
  }

  // Mongoose: unique constraint violation
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    status  = 409;
    message = `Duplicate value for "${field}". Please use a different value.`;
  }

  // Mongoose: schema validation failed
  if (err.name === "ValidationError") {
    status  = 400;
    message = Object.values(err.errors).map((e) => e.message).join(". ");
  }

  res.status(status).json({ success: false, message });
});

// ── Start server ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀  Scholar SMS API ready`);
  console.log(`    URL  :  http://localhost:${PORT}`);
  console.log(`    Port :  ${PORT}\n`);
});
