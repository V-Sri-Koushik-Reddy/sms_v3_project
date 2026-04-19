// ─────────────────────────────────────────────────────────────
// routes/authRoutes.js
// Public authentication endpoints — no JWT required.
// ─────────────────────────────────────────────────────────────

const express                  = require("express");
const router                   = express.Router();
const { register, login, getMe } = require("../controllers/authController");
const { protect }              = require("../middleware/authMiddleware");

router.post("/register", register);           // POST /auth/register
router.post("/login",    login);              // POST /auth/login
router.get ("/me",       protect, getMe);     // GET  /auth/me  (protected)

module.exports = router;
