// ─────────────────────────────────────────────────────────────
// models/Student.js
// Mongoose schema for student records.
//
// Key features:
//  • grade is auto-computed from marks (pre-save + pre-update hooks)
//  • rollNo is unique and always stored in uppercase
//  • Text index on name for fast case-insensitive search
// ─────────────────────────────────────────────────────────────

const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    name: {
      type:      String,
      required:  [true, "Student name is required"],
      trim:      true,
      minlength: [2,  "Name must be at least 2 characters"],
      maxlength: [80, "Name cannot exceed 80 characters"],
    },

    rollNo: {
      type:      String,
      required:  [true, "Roll number is required"],
      unique:    true,          // no two students can share a roll number
      trim:      true,
      uppercase: true,          // CS101, not cs101
    },

    marks: {
      type:     Number,
      required: [true, "Marks are required"],
      min:      [0,   "Marks cannot be less than 0"],
      max:      [100, "Marks cannot exceed 100"],
    },

    // Derived from marks — stored so it can be filtered/sorted in queries
    grade: {
      type: String,
      enum: ["O", "A", "B", "C", "F"],
    },
  },
  {
    timestamps: true,
  }
);

// ── Grade calculation helper ─────────────────────────────────
function computeGrade(marks) {
  if (marks >= 90) return "O"; // Outstanding
  if (marks >= 75) return "A"; // Excellent
  if (marks >= 60) return "B"; // Good
  if (marks >= 45) return "C"; // Average
  return "F";                   // Fail
}

// ── Pre-save: compute grade when creating ────────────────────
studentSchema.pre("save", function (next) {
  this.grade = computeGrade(this.marks);
  next();
});

// ── Pre-update: recompute grade when marks change ────────────
studentSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update.marks !== undefined) {
    update.grade = computeGrade(update.marks);
    // Also update the $set version in case caller used it
    if (update.$set && update.$set.marks !== undefined) {
      update.$set.grade = computeGrade(update.$set.marks);
    }
  }
  next();
});

// ── Indexes for performance ──────────────────────────────────
studentSchema.index({ name: "text" }); // enables $text search
studentSchema.index({ marks: -1 });

module.exports = mongoose.model("Student", studentSchema);
