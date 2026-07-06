"use strict";

/**
 * Auth helpers.
 *
 * Login flow:
 *   browser -> POST /api/login {email, password}
 *           -> supabaseAnon.auth.signInWithPassword() verifies the credentials
 *           -> on success we drop a stateless, signed, httpOnly cookie
 *              (cookie-session) holding { email, sub }. We do NOT keep Supabase's
 *              session — we only used it to validate the password.
 *
 * Protected routes check `req.session.email`.
 */

const { supabaseAnon } = require("./supabase");

const isProd = process.env.NODE_ENV === "production";

/**
 * Admin allowlist. ADMIN_EMAILS is a comma-separated list of emails allowed into
 * the admin dashboard (/admin, /api/admin/*). Any logged-in user can reach the
 * automations page, but only these emails can manage content. If the list is
 * empty/unset, we fall back to "any authenticated user" so nothing breaks.
 */
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function isAdmin(req) {
  if (!isAuthed(req)) return false;
  if (ADMIN_EMAILS.length === 0) return true; // no allowlist configured
  return ADMIN_EMAILS.includes(String(req.session.email).toLowerCase());
}

/** cookie-session configuration. */
const sessionOptions = {
  name: "bookends_session",
  secret: process.env.SESSION_SECRET || "dev-insecure-secret-change-me",
  httpOnly: true,
  secure: isProd, // requires app.set('trust proxy', 1) on Render
  sameSite: "lax",
  maxAge: 12 * 60 * 60 * 1000, // 12h
};

/**
 * Verify email+password against Supabase Auth and start a session.
 * Returns { ok: true } or { ok: false, error }.
 */
async function login(req, email, password) {
  if (!email || !password) {
    return { ok: false, error: "Email and password are required." };
  }

  const { data, error } = await supabaseAnon.auth.signInWithPassword({
    email: String(email).trim(),
    password: String(password),
  });

  if (error || !data || !data.user) {
    return { ok: false, error: "Invalid email or password." };
  }

  req.session.email = data.user.email;
  req.session.sub = data.user.id;
  req.session.createdAt = Date.now();
  return { ok: true };
}

function logout(req) {
  req.session = null;
}

function isAuthed(req) {
  return Boolean(req.session && req.session.email);
}

/** Guard for API routes — returns 401 JSON when not logged in. */
function requireAuthApi(req, res, next) {
  if (!isAuthed(req)) {
    return res.status(401).json({ error: "Not authenticated." });
  }
  next();
}

/** Guard for HTML page routes — redirects to /login when not logged in. */
function requireAuthPage(req, res, next) {
  if (!isAuthed(req)) {
    return res.redirect("/login");
  }
  next();
}

/** Admin-only API guard — 401 if not logged in, 403 if not an admin. */
function requireAdminApi(req, res, next) {
  if (!isAuthed(req)) {
    return res.status(401).json({ error: "Not authenticated." });
  }
  if (!isAdmin(req)) {
    return res.status(403).json({ error: "Admins only." });
  }
  next();
}

/** Admin-only page guard — redirect to /login when not an admin. */
function requireAdminPage(req, res, next) {
  if (!isAuthed(req)) return res.redirect("/login");
  if (!isAdmin(req)) return res.redirect("/automations");
  next();
}

/**
 * Lightweight CSRF / same-origin guard for state-changing admin requests.
 * Browsers forbid cross-origin pages from setting custom headers without a
 * passing CORS preflight, and we enable no CORS — so requiring this header
 * (plus the SameSite=lax cookie) blocks cross-site forged writes.
 */
function sameOriginGuard(req, res, next) {
  if (req.get("X-Requested-With") !== "fetch") {
    return res.status(403).json({ error: "Forbidden." });
  }
  const origin = req.get("Origin");
  if (origin) {
    const host = req.get("Host");
    let originHost;
    try {
      originHost = new URL(origin).host;
    } catch (_) {
      return res.status(403).json({ error: "Forbidden." });
    }
    if (originHost !== host) {
      return res.status(403).json({ error: "Forbidden." });
    }
  }
  next();
}

module.exports = {
  sessionOptions,
  login,
  logout,
  isAuthed,
  isAdmin,
  requireAuthApi,
  requireAuthPage,
  requireAdminApi,
  requireAdminPage,
  sameOriginGuard,
};
