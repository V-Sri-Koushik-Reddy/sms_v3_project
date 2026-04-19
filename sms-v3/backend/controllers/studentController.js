// ─────────────────────────────────────────────────────────────
// controllers/studentController.js
// Full CRUD for Student resource — backed by MongoDB.
// All routes protected by JWT middleware.
// ─────────────────────────────────────────────────────────────

const Student = require("../models/Student");

// ────────────────────────────────────────────────────────────
// GET /students
// Query params:
//   ?search=<n>       case-insensitive name match (regex)
//   ?marksAbove=<n>   only students with marks > n
// ────────────────────────────────────────────────────────────
const getStudents = async (req, res, next) => {
  try {
    const { search, marksAbove } = req.query;
    const filter = {};

    // Name search — regex, case-insensitive
    if (search && search.trim()) {
      filter.name = { $regex: search.trim(), $options: "i" };
    }

    // Marks filter
    if (marksAbove !== undefined && marksAbove !== "") {
      const threshold = parseFloat(marksAbove);
      if (isNaN(threshold)) {
        return res.status(400).json({
          success: false,
          message: "marksAbove must be a valid number.",
        });
      }
      filter.marks = { $gt: threshold };
    }

    const students = await Student.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      count:   students.length,
      data:    students,
    });
  } catch (err) {
    next(err);
  }
};

// ────────────────────────────────────────────────────────────
// POST /students
// Body validated by middleware before reaching here.
// ────────────────────────────────────────────────────────────
const createStudent = async (req, res, next) => {
  try {
    const { name, rollNo, marks } = req.body;

    // grade is auto-set by the pre-save hook in the model
    const student = await Student.create({ name, rollNo, marks });

    res.status(201).json({
      success: true,
      message: `Student "${student.name}" added successfully.`,
      data:    student,
    });
  } catch (err) {
    // Duplicate rollNo → Mongo code 11000
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: `Roll number "${req.body.rollNo}" is already taken.`,
      });
    }
    next(err);
  }
};

// ────────────────────────────────────────────────────────────
// PUT /students/:id
// Partial update — only send fields that changed.
// ────────────────────────────────────────────────────────────
const updateStudent = async (req, res, next) => {
  try {
    const { name, rollNo, marks } = req.body;

    // Build the update object with only provided fields
    const updateData = {};
    if (name   !== undefined) updateData.name   = name.trim();
    if (rollNo !== undefined) updateData.rollNo = rollNo.trim().toUpperCase();
    if (marks  !== undefined) updateData.marks  = parseFloat(marks);

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new:           true,   // return the updated document
        runValidators: true,   // enforce schema rules on update
      }
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    res.json({
      success: true,
      message: `Student "${student.name}" updated successfully.`,
      data:    student,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: `Roll number "${req.body.rollNo}" is already taken.`,
      });
    }
    next(err);
  }
};

// ────────────────────────────────────────────────────────────
// DELETE /students/:id
// ────────────────────────────────────────────────────────────
const deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    res.json({
      success: true,
      message: `Student "${student.name}" deleted successfully.`,
      data:    student,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getStudents, createStudent, updateStudent, deleteStudent };
