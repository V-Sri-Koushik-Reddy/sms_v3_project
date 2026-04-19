// ─────────────────────────────────────────────────────────────
// controllers/authController.js
// Handles user registration and login.
//  • register → creates a new User in MongoDB, hashed password
//  • login    → validates credentials, returns JWT
// ─────────────────────────────────────────────────────────────

const jwt  = require("jsonwebtoken");
const User = require("../models/User");

// ── Helper: sign a JWT ───────────────────────────────────────
const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// ────────────────────────────────────────────────────────────
// POST /auth/register
// Body: { name, email, password }
// ────────────────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // ── Validate presence ────────────────────────────────
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are all required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    // ── Check for duplicate email ────────────────────────
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "An account with that email already exists. Please log in.",
      });
    }

    // ── Create user (pre-save hook hashes the password) ──
    const user = await User.create({
      name:     name.trim(),
      email:    email.toLowerCase().trim(),
      password,
    });

    // ── Respond — do NOT send a token yet ────────────────
    // The frontend will show a "registered" message and switch
    // to the login form so the user explicitly signs in.
    res.status(201).json({
      success: true,
      message: "Registered successfully. Please log in.",
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
      },
    });

  } catch (err) {
    // Mongoose duplicate-key error (race condition fallback)
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with that email already exists.",
      });
    }
    next(err);
  }
};

// ────────────────────────────────────────────────────────────
// POST /auth/login
// Body: { email, password }
// ────────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // ── Validate presence ────────────────────────────────
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    // ── Find user and explicitly include password ────────
    // password is select:false on the schema so we must opt-in
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // ── Compare password with stored bcrypt hash ─────────
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // ── Sign JWT ─────────────────────────────────────────
    const token = signToken(user._id);

    res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
      },
    });

  } catch (err) {
    next(err);
  }
};

// ────────────────────────────────────────────────────────────
// GET /auth/me   (protected)
// Returns the currently authenticated user's profile.
// ────────────────────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe };
