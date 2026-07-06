"use strict";

/**
 * Logged-in "portal" endpoints — data that is NOT public.
 * Any authenticated user (not just admins) may read these.
 */

const express = require("express");
const { supabaseAdmin } = require("../supabase");
const { requireAuthApi } = require("../auth");

const router = express.Router();

// GET /api/automations — published automation cards, for logged-in users only.
router.get("/automations", requireAuthApi, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("cards")
      .select("id, title, subtitle, description, cta_label, cta_url, image_path, sort_order")
      .eq("section", "automations")
      .eq("published", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    res.set("Cache-Control", "no-store");
    res.json({ automations: data });
  } catch (err) {
    console.error("[portal] /automations error:", err.message);
    res.status(500).json({ error: "Failed to load automations." });
  }
});

module.exports = router;
