"use strict";

const express = require("express");
const rateLimit = require("express-rate-limit");
const { login, logout, isAuthed, isAdmin } = require("../auth");

const router = express.Router();

// Brute-force protection on login.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Try again later." },
});

router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const result = await login(req, email, password);
    if (!result.ok) {
      return res.status(401).json({ error: result.error });
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error("[auth] login error:", err.message);
    return res.status(500).json({ error: "Login failed. Please try again." });
  }
});

router.post("/logout", (req, res) => {
  logout(req);
  res.json({ ok: true });
});

router.get("/me", (req, res) => {
  if (!isAuthed(req)) {
    return res.status(401).json({ error: "Not authenticated." });
  }
  res.json({ email: req.session.email, isAdmin: isAdmin(req) });
});

module.exports = router;
