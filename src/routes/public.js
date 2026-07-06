"use strict";

const express = require("express");
const rateLimit = require("express-rate-limit");
const { supabaseAdmin } = require("../supabase");

const router = express.Router();

// Automations are private (login-gated) — never exposed on the public site.
const PUBLIC_SECTIONS = ["brands", "services", "sites"];

/**
 * GET /api/content
 * Returns site settings + published cards grouped by section (ordered).
 */
router.get("/content", async (req, res) => {
  try {
    const [settingsRes, cardsRes] = await Promise.all([
      supabaseAdmin.from("settings").select("key, value"),
      supabaseAdmin
        .from("cards")
        .select(
          "id, section, title, subtitle, description, location, cta_label, cta_url, coming_soon, image_path, sort_order"
        )
        .eq("published", true)
        .in("section", PUBLIC_SECTIONS)
        .order("section", { ascending: true })
        .order("sort_order", { ascending: true }),
    ]);

    if (settingsRes.error) throw settingsRes.error;
    if (cardsRes.error) throw cardsRes.error;

    const settings = {};
    for (const row of settingsRes.data || []) {
      settings[row.key] = row.value;
    }

    const cards = {};
    for (const s of PUBLIC_SECTIONS) cards[s] = [];
    for (const card of cardsRes.data || []) {
      if (cards[card.section]) cards[card.section].push(card);
    }

    res.set("Cache-Control", "no-store");
    res.json({ settings, cards });
  } catch (err) {
    console.error("[public] /content error:", err.message);
    res.status(500).json({ error: "Failed to load content." });
  }
});

/**
 * POST /api/signups  { email }
 * Stores a "notify me" email (idempotent on unique email).
 */
const signupLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Try again later." },
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post("/signups", signupLimiter, async (req, res) => {
  try {
    const email = String((req.body && req.body.email) || "").trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }

    // upsert so duplicates don't error; ignore conflict on unique email
    const { error } = await supabaseAdmin
      .from("signups")
      .upsert({ email }, { onConflict: "email", ignoreDuplicates: true });

    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    console.error("[public] /signups error:", err.message);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

module.exports = router;
