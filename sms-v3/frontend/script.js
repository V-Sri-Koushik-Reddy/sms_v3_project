// ─────────────────────────────────────────────────────────────
// script.js  —  Scholar Dashboard Logic
// Depends on auth.js being loaded first (provides authFetch,
// requireAuth, getUser, logout, BASE_URL).
// ─────────────────────────────────────────────────────────────

"use strict";

/* ── Auth guard ───────────────────────────────────────────── */
requireAuth(); // redirects to auth.html if no token

/* ── Populate sidebar user info ───────────────────────────── */
(function initUser() {
  const user = getUser();
  if (!user) return;

  const initials = (user.name || user.email || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  document.getElementById("user-avatar").textContent = initials;
  document.getElementById("user-name").textContent   = user.name  || "User";
  document.getElementById("user-email").textContent  = user.email || "";
  document.getElementById("badge-label").textContent = user.name ? `Hi, ${user.name.split(" ")[0]}` : "Authenticated";
})();

/* ── DOM refs ─────────────────────────────────────────────── */
const inpName    = document.getElementById("inp-name");
const inpRoll    = document.getElementById("inp-roll");
const inpMarks   = document.getElementById("inp-marks");
const inpSearch  = document.getElementById("inp-search");
const inpFilter  = document.getElementById("inp-filter");
const btnSubmit  = document.getElementById("btn-submit");
const submitSpinner = document.getElementById("submit-spinner");
const submitIcon = document.getElementById("submit-icon");
const submitLbl  = document.getElementById("submit-label");
const btnCancel  = document.getElementById("btn-cancel");
const btnRefresh = document.getElementById("btn-refresh");
const btnClear   = document.getElementById("btn-clear");
const editIdInp  = document.getElementById("edit-id");
const formTitle  = document.getElementById("form-title-el");
const formBadge  = document.getElementById("form-badge");
const tbody      = document.getElementById("tbody");
const skeleton   = document.getElementById("skeleton");
const tableWrap  = document.getElementById("table-wrap");
const emptyState = document.getElementById("empty-state");
const resCount   = document.getElementById("result-count");
const chipsEl    = document.getElementById("filter-chips");
const toastEl    = document.getElementById("toast");
const modalEl    = document.getElementById("modal");
const modalMsg   = document.getElementById("modal-msg");
const modalOk    = document.getElementById("modal-confirm");
const modalCancel= document.getElementById("modal-cancel");
const delSpinner = document.getElementById("del-spinner");

/* ── State ────────────────────────────────────────────────── */
let deleteId    = null;
let searchTerm  = "";
let markFilter  = "";
let searchTimer = null;
let markTimer   = null;

/* ════════════════════════════════════════════════════════════
   TOAST
   ════════════════════════════════════════════════════════════ */
let toastTimer = null;
function showToast(msg, type = "info") {
  toastEl.textContent = msg;
  toastEl.className   = `show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.className = ""; }, 3500);
}

/* ════════════════════════════════════════════════════════════
   MODAL
   ════════════════════════════════════════════════════════════ */
function openModal(id, name) {
  deleteId = id;
  modalMsg.textContent    = `"${name}" will be permanently removed from the database.`;
  modalEl.style.display   = "grid";
}
function closeModal() {
  deleteId = null;
  modalEl.style.display = "none";
}
modalCancel.addEventListener("click", closeModal);
modalEl.addEventListener("click", (e) => { if (e.target === modalEl) closeModal(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

/* ════════════════════════════════════════════════════════════
   LOADING STATES
   ════════════════════════════════════════════════════════════ */
const showSkeleton = () => { skeleton.style.display = "flex";  tableWrap.style.display = "none";  emptyState.style.display = "none"; };
const showTable    = () => { skeleton.style.display = "none";  tableWrap.style.display = "block"; emptyState.style.display = "none"; };
const showEmpty    = () => { skeleton.style.display = "none";  tableWrap.style.display = "none";  emptyState.style.display = "block"; };

/* ════════════════════════════════════════════════════════════
   GRADE COLOR MAP
   ════════════════════════════════════════════════════════════ */
const GRADE_COLORS = {
  O: "#f59e0b",
  A: "#22c55e",
  B: "#2dd4bf",
  C: "#a78bfa",
  F: "#ef4444",
};

/* ════════════════════════════════════════════════════════════
   STATS
   ════════════════════════════════════════════════════════════ */
function updateStats(students) {
  const n    = students.length;
  const avg  = n ? students.reduce((s, st) => s + st.marks, 0) / n : 0;
  const top  = n ? Math.max(...students.map((s) => s.marks)) : 0;
  const pass = n ? Math.round((students.filter((s) => s.marks >= 35).length / n) * 100) : 0;

  document.getElementById("stat-total").textContent = n;
  document.getElementById("stat-avg").textContent   = avg.toFixed(1);
  document.getElementById("stat-top").textContent   = top;
  document.getElementById("stat-pass").textContent  = `${pass}%`;

  requestAnimationFrame(() => {
    document.getElementById("bar-avg").style.width  = `${avg}%`;
    document.getElementById("bar-pass").style.width = `${pass}%`;
  });
}

/* ════════════════════════════════════════════════════════════
   FILTER CHIPS
   ════════════════════════════════════════════════════════════ */
function renderChips() {
  chipsEl.innerHTML = "";
  if (searchTerm) chipsEl.appendChild(mkChip(`Name: "${searchTerm}"`, () => { inpSearch.value = ""; searchTerm = ""; renderChips(); fetchStudents(); }));
  if (markFilter) chipsEl.appendChild(mkChip(`Marks > ${markFilter}`,  () => { inpFilter.value = ""; markFilter  = ""; renderChips(); fetchStudents(); }));
}
function mkChip(label, onRemove) {
  const c = document.createElement("span");
  c.className = "chip";
  c.innerHTML = `${esc(label)} <span class="chip-x" title="Remove filter" role="button" tabindex="0">✕</span>`;
  c.querySelector(".chip-x").addEventListener("click", onRemove);
  return c;
}

/* ════════════════════════════════════════════════════════════
   TABLE ROW BUILDER
   ════════════════════════════════════════════════════════════ */
function buildRow(student, idx) {
  const tr = document.createElement("tr");
  // MongoDB uses _id; fall back to id for safety
  const id    = student._id || student.id;
  const grade = student.grade || "F";
  const color = GRADE_COLORS[grade] || "#ef4444";

  tr.innerHTML = `
    <td class="td-num">${idx}</td>
    <td class="td-name">${esc(student.name)}</td>
    <td class="td-roll">${esc(student.rollNo)}</td>
    <td>
      <div class="marks-wrap">
        <span class="marks-val">${student.marks}</span>
        <div class="marks-bg">
          <div class="marks-fill" data-w="${student.marks}" style="width:0;background:${color}"></div>
        </div>
      </div>
    </td>
    <td><span class="grade-badge g-${grade}">${grade}</span></td>
    <td class="td-acts">
      <button class="btn btn-edit" type="button">✎ Edit</button>
      <button class="btn btn-del"  type="button">✕ Delete</button>
    </td>
  `;

  tr.querySelector(".btn-edit").addEventListener("click", () => startEdit(student));
  tr.querySelector(".btn-del").addEventListener("click",  () => openModal(id, student.name));
  return tr;
}

function animateBars() {
  setTimeout(() => {
    document.querySelectorAll(".marks-fill[data-w]").forEach((b) => {
      b.style.width = `${b.dataset.w}%`;
    });
  }, 80);
}

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ════════════════════════════════════════════════════════════
   API — FETCH STUDENTS
   ════════════════════════════════════════════════════════════ */
async function fetchStudents() {
  showSkeleton();

  const params = new URLSearchParams();
  if (searchTerm) params.append("search",     searchTerm);
  if (markFilter) params.append("marksAbove",  markFilter);
  const qs = params.toString() ? `?${params}` : "";

  try {
    const res  = await authFetch(`/students${qs}`);
    const json = await res.json();

    if (!res.ok) {
      showToast(json.message || "Failed to load students.", "error");
      showEmpty();
      return;
    }

    const students = json.data || [];
    updateStats(students);
    tbody.innerHTML = "";

    if (!students.length) {
      showEmpty();
      resCount.textContent = "(0 results)";
      return;
    }

    students.forEach((s, i) => tbody.appendChild(buildRow(s, i + 1)));
    showTable();
    animateBars();
    resCount.textContent = `(${students.length} record${students.length !== 1 ? "s" : ""})`;

  } catch (err) {
    showEmpty();
    showToast("Cannot connect to server. Is the backend running?", "error");
    console.error("fetchStudents error:", err);
  }
}

/* ════════════════════════════════════════════════════════════
   API — ADD / UPDATE / DELETE
   ════════════════════════════════════════════════════════════ */
async function apiAdd(name, rollNo, marks) {
  const res  = await authFetch("/students", {
    method: "POST",
    body:   JSON.stringify({ name, rollNo, marks }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to add student.");
  return json;
}

async function apiUpdate(id, name, rollNo, marks) {
  const res  = await authFetch(`/students/${id}`, {
    method: "PUT",
    body:   JSON.stringify({ name, rollNo, marks }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to update student.");
  return json;
}

async function apiDelete(id) {
  const res  = await authFetch(`/students/${id}`, { method: "DELETE" });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to delete student.");
  return json;
}

/* ════════════════════════════════════════════════════════════
   FORM — Add / Edit / Reset
   ════════════════════════════════════════════════════════════ */
function resetForm() {
  inpName.value = inpRoll.value = inpMarks.value = editIdInp.value = "";
  formTitle.textContent    = "Add Student";
  formBadge.textContent    = "NEW";
  submitLbl.textContent    = "Add Student";
  submitIcon.textContent   = "＋";
  btnCancel.style.display  = "none";
  inpName.focus();
}

function startEdit(student) {
  const id = student._id || student.id;
  editIdInp.value  = id;
  inpName.value    = student.name;
  inpRoll.value    = student.rollNo;
  inpMarks.value   = student.marks;
  formTitle.textContent   = "Edit Student";
  formBadge.textContent   = "EDIT";
  submitLbl.textContent   = "Save Changes";
  submitIcon.textContent  = "✓";
  btnCancel.style.display = "inline-flex";
  document.querySelector(".card").scrollIntoView({ behavior: "smooth", block: "nearest" });
  inpName.focus();
}

btnCancel.addEventListener("click", resetForm);

/* ── Form submit ──────────────────────────────────────────── */
btnSubmit.addEventListener("click", async () => {
  const name   = inpName.value.trim();
  const rollNo = inpRoll.value.trim();
  const marks  = parseFloat(inpMarks.value);
  const editId = editIdInp.value;

  // Client-side validation
  if (!name)                                     { showToast("Name is required.",          "error"); inpName.focus();  return; }
  if (!rollNo)                                   { showToast("Roll number is required.",   "error"); inpRoll.focus();  return; }
  if (isNaN(marks) || marks < 0 || marks > 100) { showToast("Marks must be 0–100.",       "error"); inpMarks.focus(); return; }

  // Loading state
  btnSubmit.disabled          = true;
  submitSpinner.style.display = "block";
  submitIcon.style.display    = "none";

  try {
    if (editId) {
      await apiUpdate(editId, name, rollNo, marks);
      showToast(`${name} updated successfully!`, "success");
    } else {
      await apiAdd(name, rollNo, marks);
      showToast(`${name} added successfully!`, "success");
    }
    resetForm();
    fetchStudents();
  } catch (err) {
    showToast(err.message || "Operation failed.", "error");
  } finally {
    btnSubmit.disabled          = false;
    submitSpinner.style.display = "none";
    submitIcon.style.display    = "";
  }
});

// Enter key in form fields
[inpName, inpRoll, inpMarks].forEach((inp) =>
  inp.addEventListener("keydown", (e) => { if (e.key === "Enter") btnSubmit.click(); })
);

/* ── Delete confirm ───────────────────────────────────────── */
modalOk.addEventListener("click", async () => {
  if (!deleteId) return;

  modalOk.disabled         = true;
  delSpinner.style.display = "block";

  try {
    await apiDelete(deleteId);
    showToast("Student deleted successfully.", "success");
    closeModal();
    fetchStudents();
  } catch (err) {
    showToast(err.message || "Delete failed.", "error");
  } finally {
    modalOk.disabled         = false;
    delSpinner.style.display = "none";
  }
});

/* ════════════════════════════════════════════════════════════
   SEARCH & FILTER
   ════════════════════════════════════════════════════════════ */
inpSearch.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    searchTerm = inpSearch.value.trim();
    renderChips();
    fetchStudents();
  }, 350);
});

inpFilter.addEventListener("input", () => {
  clearTimeout(markTimer);
  markTimer = setTimeout(() => {
    markFilter = inpFilter.value.trim();
    renderChips();
    fetchStudents();
  }, 400);
});

inpFilter.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    clearTimeout(markTimer);
    markFilter = inpFilter.value.trim();
    renderChips();
    fetchStudents();
  }
});

btnClear.addEventListener("click", () => {
  inpSearch.value = inpFilter.value = "";
  searchTerm = markFilter = "";
  renderChips();
  fetchStudents();
  showToast("Filters cleared.", "info");
});

/* ── Refresh ──────────────────────────────────────────────── */
btnRefresh.addEventListener("click", () => {
  btnRefresh.style.transition = "transform 0.5s ease";
  btnRefresh.style.transform  = "rotate(360deg)";
  setTimeout(() => { btnRefresh.style.transform = ""; }, 600);
  fetchStudents();
});

/* ── Logout ───────────────────────────────────────────────── */
document.getElementById("btn-logout").addEventListener("click", () => {
  if (confirm("Log out of Scholar?")) logout();
});

/* ════════════════════════════════════════════════════════════
   INIT — load students when page is ready
   ════════════════════════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", fetchStudents);
