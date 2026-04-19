// ─────────────────────────────────────────────────────────────
// auth.js
// Shared token helpers and authenticated fetch wrapper.
// Loaded by both auth.html and index.html.
// ─────────────────────────────────────────────────────────────

// ⚠️  Must match the PORT in your backend .env
const BASE_URL = "http://localhost:5004";

/* ── Token storage ────────────────────────────────────────── */

function saveAuth(token, user) {
  localStorage.setItem("sms_token", token);
  localStorage.setItem("sms_user",  JSON.stringify(user));
}

function getToken() {
  return localStorage.getItem("sms_token");
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("sms_user")) || null;
  } catch {
    return null;
  }
}

function clearAuth() {
  localStorage.removeItem("sms_token");
  localStorage.removeItem("sms_user");
}

function isLoggedIn() {
  return !!getToken();
}

/* ── Route guards ─────────────────────────────────────────── */

// Call at the top of index.html — redirects to auth if no token
function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = "auth.html";
  }
}

// Call at the top of auth.html — skips to dashboard if already logged in
function redirectIfLoggedIn() {
  if (isLoggedIn()) {
    window.location.href = "index.html";
  }
}

// Log out and go back to auth page
function logout() {
  clearAuth();
  window.location.href = "auth.html";
}

/* ── Authenticated fetch ──────────────────────────────────── */

/**
 * Drop-in replacement for fetch() that:
 *  • Injects Authorization: Bearer <token>
 *  • Sets Content-Type: application/json
 *  • On 401 → clears storage and redirects to auth.html
 *
 * @param {string} path   Path relative to BASE_URL (e.g. "/students")
 * @param {object} opts   Standard fetch options
 */
async function authFetch(path, opts = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(opts.headers || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...opts, headers });

  if (res.status === 401) {
    clearAuth();
    window.location.href = "auth.html";
    return res;
  }

  return res;
}

/* ── Auth API calls ───────────────────────────────────────── */

/**
 * Register a new user.
 * Does NOT save a token — frontend shows "please log in" message.
 */
async function apiRegister(name, email, password) {
  const res  = await fetch(`${BASE_URL}/auth/register`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ name, email, password }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Registration failed.");
  return json;
}

/**
 * Log in with email + password.
 * Saves token and user to localStorage on success.
 */
async function apiLogin(email, password) {
  const res  = await fetch(`${BASE_URL}/auth/login`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ email, password }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Login failed.");
  saveAuth(json.token, json.user);
  return json;
}
