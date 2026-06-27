"use strict";

/**
 * Supabase clients (server-side only).
 *
 * - `supabaseAnon`    : uses the public anon key. Used ONLY to verify admin
 *                       credentials via Supabase Auth (signInWithPassword).
 * - `supabaseAdmin`   : uses the service-role key. Full DB access, bypasses RLS.
 *                       Used for all data reads/writes. NEVER expose this to the
 *                       browser.
 */

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const missing = [];
if (!SUPABASE_URL) missing.push("SUPABASE_URL");
if (!SUPABASE_ANON_KEY) missing.push("SUPABASE_ANON_KEY");
if (!SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");

if (missing.length) {
  console.error(
    `[supabase] Missing required env var(s): ${missing.join(", ")}.\n` +
      `           Copy .env.example to .env and fill them in (see README).`
  );
}

// Don't persist/refresh sessions on the server — each client is stateless.
const noSession = {
  auth: { autoRefreshToken: false, persistSession: false },
};

const supabaseAnon = createClient(
  SUPABASE_URL || "http://localhost",
  SUPABASE_ANON_KEY || "anon",
  noSession
);

const supabaseAdmin = createClient(
  SUPABASE_URL || "http://localhost",
  SUPABASE_SERVICE_ROLE_KEY || "service",
  noSession
);

module.exports = { supabaseAnon, supabaseAdmin };
