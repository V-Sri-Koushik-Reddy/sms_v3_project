// ─────────────────────────────────────────────────────────────
// middleware/authMiddleware.js
// Protects routes by verifying the Bearer JWT.
// Attaches req.user = { id, name, email } on success.
// ─────────────────────────────────────────────────────────────

const jwt  = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    // ── 1. Extract token from header ─────────────────────
    const header = req.headers["authorization"] || req.headers["Authorization"];

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const token = header.split(" ")[1];

    // ── 2. Verify signature and expiry ───────────────────
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ── 3. Confirm user still exists in DB ───────────────
    // (protects against tokens issued to since-deleted accounts)
    const user = await User.findById(decoded.id).select("name email");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account no longer exists. Please register or log in again.",
      });
    }

    // ── 4. Attach to request ─────────────────────────────
    req.user = { id: user._id, name: user.name, email: user.email };
    next();

  } catch (err) {
    const msg =
      err.name === "TokenExpiredError"
        ? "Session expired. Please log in again."
        : "Invalid token. Please log in again.";

    return res.status(401).json({ success: false, message: msg });
  }
};

module.exports = { protect };
