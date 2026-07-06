"use strict";

const express = require("express");
const fs = require("fs");
const path = require("path");
const { supabaseAdmin } = require("../supabase");
const { requireAdminApi, sameOriginGuard } = require("../auth");

const router = express.Router();

const SECTIONS = ["brands", "services", "automations", "sites"];
const SETTINGS_KEYS = ["hero", "about", "contact", "socials", "footer"];
const ASSETS_DIR = path.join(__dirname, "..", "..", "assets");
const IMAGE_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".avif"]);

// All admin routes require an admin session (ADMIN_EMAILS allowlist).
router.use(requireAdminApi);
// State-changing methods additionally require the same-origin guard.
router.use((req, res, next) => {
  if (req.method === "GET") return next();
  return sameOriginGuard(req, res, next);
});

// Editable card columns (whitelist — never trust client keys blindly).
const CARD_FIELDS = [
  "section",
  "title",
  "subtitle",
  "description",
  "location",
  "cta_label",
  "cta_url",
  "coming_soon",
  "image_path",
  "sort_order",
  "published",
];

function pickCardFields(body) {
  const out = {};
  for (const k of CARD_FIELDS) {
    if (body[k] !== undefined) out[k] = body[k];
  }
  if (out.coming_soon !== undefined) out.coming_soon = Boolean(out.coming_soon);
  if (out.published !== undefined) out.published = Boolean(out.published);
  if (out.sort_order !== undefined) out.sort_order = Number(out.sort_order) || 0;
  return out;
}

// ---------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------

// GET /api/admin/cards?section=brands  (all cards incl. unpublished)
router.get("/cards", async (req, res) => {
  try {
    let q = supabaseAdmin
      .from("cards")
      .select("*")
      .order("section", { ascending: true })
      .order("sort_order", { ascending: true });

    const section = req.query.section;
    if (section) {
      if (!SECTIONS.includes(section)) {
        return res.status(400).json({ error: "Unknown section." });
      }
      q = q.eq("section", section);
    }

    const { data, error } = await q;
    if (error) throw error;
    res.json({ cards: data });
  } catch (err) {
    console.error("[admin] list cards:", err.message);
    res.status(500).json({ error: "Failed to load cards." });
  }
});

// POST /api/admin/cards
router.post("/cards", async (req, res) => {
  try {
    const fields = pickCardFields(req.body || {});
    if (!fields.section || !SECTIONS.includes(fields.section)) {
      return res.status(400).json({ error: "A valid section is required." });
    }
    if (!fields.title || !String(fields.title).trim()) {
      return res.status(400).json({ error: "Title is required." });
    }

    // Default sort_order to end of its section if not provided.
    if (fields.sort_order === undefined) {
      const { data: maxRow } = await supabaseAdmin
        .from("cards")
        .select("sort_order")
        .eq("section", fields.section)
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();
      fields.sort_order = (maxRow && maxRow.sort_order ? maxRow.sort_order : 0) + 10;
    }

    const { data, error } = await supabaseAdmin
      .from("cards")
      .insert(fields)
      .select()
      .single();
    if (error) throw error;
    res.status(201).json({ card: data });
  } catch (err) {
    console.error("[admin] create card:", err.message);
    res.status(500).json({ error: "Failed to create card." });
  }
});

// PUT /api/admin/cards/:id
router.put("/cards/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "Bad id." });

    const fields = pickCardFields(req.body || {});
    if (fields.section && !SECTIONS.includes(fields.section)) {
      return res.status(400).json({ error: "Unknown section." });
    }
    if (Object.keys(fields).length === 0) {
      return res.status(400).json({ error: "Nothing to update." });
    }

    const { data, error } = await supabaseAdmin
      .from("cards")
      .update(fields)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Card not found." });
    res.json({ card: data });
  } catch (err) {
    console.error("[admin] update card:", err.message);
    res.status(500).json({ error: "Failed to update card." });
  }
});

// DELETE /api/admin/cards/:id
router.delete("/cards/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "Bad id." });
    const { error } = await supabaseAdmin.from("cards").delete().eq("id", id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    console.error("[admin] delete card:", err.message);
    res.status(500).json({ error: "Failed to delete card." });
  }
});

// PATCH /api/admin/cards/:id/publish  { published }
router.patch("/cards/:id/publish", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "Bad id." });
    const published = Boolean(req.body && req.body.published);
    const { data, error } = await supabaseAdmin
      .from("cards")
      .update({ published })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    res.json({ card: data });
  } catch (err) {
    console.error("[admin] publish card:", err.message);
    res.status(500).json({ error: "Failed to update card." });
  }
});

// POST /api/admin/cards/reorder  { section, orderedIds: [...] }
router.post("/cards/reorder", async (req, res) => {
  try {
    const { section, orderedIds } = req.body || {};
    if (!SECTIONS.includes(section)) {
      return res.status(400).json({ error: "Unknown section." });
    }
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ error: "orderedIds must be an array." });
    }

    // Assign sort_order in steps of 10, one update per card.
    let order = 10;
    for (const rawId of orderedIds) {
      const id = Number(rawId);
      if (!Number.isInteger(id)) continue;
      const { error } = await supabaseAdmin
        .from("cards")
        .update({ sort_order: order })
        .eq("id", id)
        .eq("section", section);
      if (error) throw error;
      order += 10;
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("[admin] reorder:", err.message);
    res.status(500).json({ error: "Failed to reorder cards." });
  }
});

// ---------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------

// GET /api/admin/settings
router.get("/settings", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from("settings").select("key, value");
    if (error) throw error;
    const settings = {};
    for (const row of data || []) settings[row.key] = row.value;
    res.json({ settings });
  } catch (err) {
    console.error("[admin] get settings:", err.message);
    res.status(500).json({ error: "Failed to load settings." });
  }
});

// PUT /api/admin/settings/:key   { value: {...} }
router.put("/settings/:key", async (req, res) => {
  try {
    const key = req.params.key;
    if (!SETTINGS_KEYS.includes(key)) {
      return res.status(400).json({ error: "Unknown settings key." });
    }
    const value = req.body && req.body.value;
    if (value === undefined || typeof value !== "object" || value === null) {
      return res.status(400).json({ error: "value must be an object." });
    }
    const { data, error } = await supabaseAdmin
      .from("settings")
      .upsert({ key, value }, { onConflict: "key" })
      .select()
      .single();
    if (error) throw error;
    res.json({ setting: data });
  } catch (err) {
    console.error("[admin] put settings:", err.message);
    res.status(500).json({ error: "Failed to save settings." });
  }
});

// ---------------------------------------------------------------------
// Signups
// ---------------------------------------------------------------------

// GET /api/admin/signups   (?format=csv for download)
router.get("/signups", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("signups")
      .select("id, email, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;

    if (req.query.format === "csv") {
      const rows = ["email,created_at"];
      for (const r of data || []) {
        rows.push(`${r.email},${r.created_at}`);
      }
      res.set("Content-Type", "text/csv");
      res.set("Content-Disposition", 'attachment; filename="signups.csv"');
      return res.send(rows.join("\n"));
    }
    res.json({ signups: data });
  } catch (err) {
    console.error("[admin] signups:", err.message);
    res.status(500).json({ error: "Failed to load signups." });
  }
});

// DELETE /api/admin/signups/:id
router.delete("/signups/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "Bad id." });
    const { error } = await supabaseAdmin.from("signups").delete().eq("id", id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    console.error("[admin] delete signup:", err.message);
    res.status(500).json({ error: "Failed to delete signup." });
  }
});

// ---------------------------------------------------------------------
// Assets (image picker source)
// ---------------------------------------------------------------------

// GET /api/admin/assets -> { assets: ["assets/aiko.jpg", ...] }
router.get("/assets", (req, res) => {
  try {
    const files = fs.readdirSync(ASSETS_DIR, { withFileTypes: true });
    const images = files
      .filter((f) => f.isFile() && IMAGE_EXT.has(path.extname(f.name).toLowerCase()))
      .map((f) => `assets/${f.name}`)
      .sort();
    res.json({ assets: images });
  } catch (err) {
    console.error("[admin] assets:", err.message);
    res.json({ assets: [] });
  }
});

module.exports = router;
