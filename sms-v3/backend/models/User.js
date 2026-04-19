// ─────────────────────────────────────────────────────────────
// models/User.js
// Mongoose schema for registered users.
//
// Key features:
//  • Passwords are bcrypt-hashed automatically before saving
//  • matchPassword() instance method for login comparison
//  • Duplicate email prevented at the DB level (unique index)
// ─────────────────────────────────────────────────────────────

const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type:      String,
      required:  [true, "Full name is required"],
      trim:      true,
      minlength: [2,  "Name must be at least 2 characters"],
      maxlength: [60, "Name cannot exceed 60 characters"],
    },

    email: {
      type:      String,
      required:  [true, "Email is required"],
      unique:    true,          // MongoDB unique index — prevents duplicates
      lowercase: true,          // always stored in lowercase
      trim:      true,
      match: [
        /^\S+@\S+\.\S+$/,
        "Please enter a valid email address",
      ],
    },

    password: {
      type:      String,
      required:  [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select:    false,         // never returned in query results by default
    },
  },
  {
    timestamps: true,           // adds createdAt and updatedAt fields
  }
);

// ── Pre-save hook: hash password before storing ──────────────
// Only re-hashes when the password field was actually modified
// (prevents double-hashing on unrelated updates)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt    = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Instance method: compare plain-text password with hash ───
userSchema.methods.matchPassword = async function (plainText) {
  return bcrypt.compare(plainText, this.password);
};

module.exports = mongoose.model("User", userSchema);
