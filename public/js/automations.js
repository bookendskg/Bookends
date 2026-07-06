"use strict";

/* Logged-in automations portal. Requires an authenticated session. */

const $ = (s, r = document) => r.querySelector(s);

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

function renderCards(list) {
  const grid = $("#automationGrid");
  if (!list || !list.length) {
    grid.innerHTML = '<p class="empty">No automations yet.</p>';
    return;
  }
  grid.innerHTML = list
    .map((c) => {
      const img = c.image_path
        ? `<div class="svc-img" style="background-image:url('/${esc(c.image_path)}')"></div>`
        : "";
      const desc = c.description ? `<p class="svc-desc">${esc(c.description)}</p>` : "";
      const href = c.cta_url && c.cta_url.trim() && c.cta_url.trim() !== "#" ? c.cta_url.trim() : "";
      const tag = href ? "a" : "div";
      const attrs = href ? ` href="${esc(href)}" target="_blank" rel="noopener"` : "";
      return `
        <${tag} class="svc-card${href ? " clickable" : ""}"${attrs}>
          ${img}
          <div class="svc-scrim"></div>
          <div class="svc-body">
            <h3>${esc(c.title)}</h3>
            ${desc}
          </div>
        </${tag}>`;
    })
    .join("");
}

async function boot() {
  // Confirm session; redirect to login if not authenticated.
  try {
    const meRes = await fetch("/api/me");
    if (meRes.status === 401) {
      window.location.href = "/login";
      return;
    }
    const me = await meRes.json();
    $("#who").textContent = me.email || "";
    if (me.isAdmin) $("#adminLink").style.display = "";
  } catch (_) {
    window.location.href = "/login";
    return;
  }

  // Load automations.
  try {
    const res = await fetch("/api/automations");
    if (res.status === 401) {
      window.location.href = "/login";
      return;
    }
    const data = await res.json();
    renderCards(data.automations || []);
  } catch (err) {
    $("#automationGrid").innerHTML =
      '<p class="empty">Failed to load. Please refresh in a moment.</p>';
  }

  $("#logoutBtn").addEventListener("click", async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
        headers: { "X-Requested-With": "fetch" },
      });
    } catch (_) {}
    window.location.href = "/login";
  });
}

document.addEventListener("DOMContentLoaded", boot);
