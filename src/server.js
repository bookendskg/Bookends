"use strict";

require("dotenv").config();

const path = require("path");
const express = require("express");
const helmet = require("helmet");
const cookieSession = require("cookie-session");

const { sessionOptions, requireAuthPage, requireAdminPage, isAuthed } = require("./auth");
const authRoutes = require("./routes/auth");
const publicRoutes = require("./routes/public");
const portalRoutes = require("./routes/portal");
const adminRoutes = require("./routes/admin");

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "public");
const ASSETS_DIR = path.join(ROOT, "assets");

// Behind Render's proxy — required for secure cookies to be set.
app.set("trust proxy", 1);

// Security headers. Allow Google Fonts + inline styles used by the pages.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(express.json({ limit: "256kb" }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieSession(sessionOptions));

// Static assets (logo + admin-referenced card images), cached long.
app.use(
  "/assets",
  express.static(ASSETS_DIR, { maxAge: "1y", immutable: true })
);

// ---- API ----
app.use("/api", authRoutes); // /api/login, /api/logout, /api/me
app.use("/api", publicRoutes); // /api/content, /api/signups
app.use("/api", portalRoutes); // /api/automations (auth required)
app.use("/api/admin", adminRoutes); // /api/admin/*

// ---- Pages ----
app.get("/", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "index.html")));

app.get("/login", (req, res) => {
  if (isAuthed(req)) return res.redirect("/automations");
  res.sendFile(path.join(PUBLIC_DIR, "login.html"));
});

// Logged-in portal — any authenticated user.
app.get("/automations", requireAuthPage, (req, res) =>
  res.sendFile(path.join(PUBLIC_DIR, "automations.html"))
);

// Admin dashboard — admins only (ADMIN_EMAILS allowlist).
app.get("/admin", requireAdminPage, (req, res) =>
  res.sendFile(path.join(PUBLIC_DIR, "admin.html"))
);

// Normalize direct .html hits to the canonical (auth-enforcing) routes.
app.get("/admin.html", (req, res) => res.redirect("/admin"));
app.get("/automations.html", (req, res) => res.redirect("/automations"));
app.get("/login.html", (req, res) => res.redirect("/login"));
app.get("/index.html", (req, res) => res.redirect("/"));

// Static frontend files (css/js). Served after explicit routes above.
app.use(express.static(PUBLIC_DIR));

// Health check for Render.
app.get("/healthz", (req, res) => res.json({ ok: true }));

// 404 fallback.
app.use((req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "Not found." });
  }
  res.status(404).sendFile(path.join(PUBLIC_DIR, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Bookends running on http://localhost:${PORT}`);
  if (process.env.NODE_ENV !== "production") {
    console.log("Mode: development");
  }
});
