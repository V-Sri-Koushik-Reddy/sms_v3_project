// ─────────────────────────────────────────────────────────────
// config/database.js
// Establishes a Mongoose connection to MongoDB.
// Reads MONGO_URI from .env — exits the process on failure
// so the app never starts without a working database.
// ─────────────────────────────────────────────────────────────

const mongoose = require("mongoose");

const connectDatabase = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`✅  MongoDB connected`);
    console.log(`    Host     : ${conn.connection.host}`);
    console.log(`    Database : ${conn.connection.name}\n`);
  } catch (err) {
    console.error("❌  MongoDB connection failed:", err.message);
    console.error(
      "\n    Checklist:\n" +
      "    1. Is MongoDB running?  →  mongod  (local) or check Atlas status\n" +
      "    2. Is MONGO_URI in .env correct?\n" +
      "    3. Is your IP whitelisted on Atlas?\n"
    );
    process.exit(1); // Hard exit — no DB = no app
  }
};

// Warn when the connection is lost at runtime (e.g. network hiccup)
mongoose.connection.on("disconnected", () =>
  console.warn("⚠️   MongoDB disconnected — retrying automatically...")
);

module.exports = connectDatabase;
