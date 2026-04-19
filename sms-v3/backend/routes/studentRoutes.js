// ─────────────────────────────────────────────────────────────
// routes/studentRoutes.js
// All student routes require a valid Bearer JWT.
// ─────────────────────────────────────────────────────────────

const express  = require("express");
const router   = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
} = require("../controllers/studentController");

// Apply auth middleware to every route in this file
router.use(protect);

router.get   ("/",    getStudents);                   // GET    /students
router.post  ("/",    createStudent);                 // POST   /students
router.put   ("/:id", updateStudent);                 // PUT    /students/:id
router.delete("/:id", deleteStudent);                 // DELETE /students/:id

module.exports = router;
