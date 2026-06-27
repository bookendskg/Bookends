"use strict";

/* Bookends home page — fetches /api/content and renders every section. */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

const ARROW =
  '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

/* ---------- rendering ---------- */

function bgStyle(imagePath) {
  return imagePath ? ` style="background-image:url('${esc(imagePath)}')"` : ' class="bg ph"';
}

function renderBrands(list) {
  const grid = $("#brandGrid");
  if (!list.length) {
    grid.innerHTML = '<p class="empty">No brands yet.</p>';
    return;
  }
  grid.innerHTML = list
    .map((c) => {
      const img = c.image_path
        ? `<div class="bg" style="background-image:url('/${esc(c.image_path)}')"></div>`
        : `<div class="bg ph"></div>`;
      const cta = c.cta_label
        ? `<a class="card-cta" href="${esc(c.cta_url || "#")}">${esc(c.cta_label)} ${ARROW}</a>`
        : "";
      const tag = c.subtitle ? `<div class="tag">${esc(c.subtitle)}</div>` : "";
      const small =
        c.coming_soon && c.description ? `<div class="small">${esc(c.description)}</div>` : "";
      return `
        <article class="brand-card reveal ${c.coming_soon ? "coming" : ""}">
          ${img}
          <div class="brand-body">
            <div class="name">${esc(c.title)}</div>
            ${tag}${small}
          </div>
          ${cta}
        </article>`;
    })
    .join("");
}

/* line icons mapped to service / automation titles */
const PILL_ICONS = {
  gear: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.6-2-3.4-2.4 1a7 7 0 0 0-1.7-1l-.4-2.5H9.6L9.2 4.5a7 7 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.6a7 7 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 1.7 1l.4 2.5h4.8l.4-2.5a7 7 0 0 0 1.7-1l2.4 1 2-3.4-2-1.6a7 7 0 0 0 .1-1z"/></svg>',
  box: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M21 16V8l-9-5-9 5v8l9 5 9-5z"/><path d="M3.3 7.5 12 12.5l8.7-5M12 12.5V22"/></svg>',
  megaphone: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 11v2a1 1 0 0 0 1 1h2l4 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M14 8a4 4 0 0 1 0 8M18 5a8 8 0 0 1 0 14"/></svg>',
  users: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0M16 5.5a3 3 0 0 1 0 5M21 20a6 6 0 0 0-4-5.7"/></svg>',
  dollar: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><path d="M14.5 9a2.5 2.5 0 0 0-2.5-1.5c-1.4 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2A2.5 2.5 0 0 1 9.5 16M12 6v1.5M12 16.5V18"/></svg>',
  bulb: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.2 1 2.5h6c0-1.3.3-1.8 1-2.5A6 6 0 0 0 12 3z"/></svg>',
  workflow: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="9" y="3" width="6" height="4" rx="1"/><rect x="3" y="17" width="6" height="4" rx="1"/><rect x="15" y="17" width="6" height="4" rx="1"/><path d="M12 7v4M12 11H6v6M12 11h6v6"/></svg>',
  chart: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>',
  plane: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M21 3 3 10.5l6 2.5 2.5 6L21 3z"/><path d="M9 13l3.5-3.5"/></svg>',
  plug: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M9 2v5M15 2v5M7 7h10v3a5 5 0 0 1-10 0V7zM12 15v5"/></svg>',
  spark: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/></svg>',
};

function pillIcon(title) {
  const t = (title || "").toLowerCase();
  if (t.includes("operation")) return PILL_ICONS.gear;
  if (t.includes("supply")) return PILL_ICONS.box;
  if (t.includes("brand") || (t.includes("marketing") && !t.includes("automation"))) return PILL_ICONS.megaphone;
  if (t.includes("people") || t.includes("culture")) return PILL_ICONS.users;
  if (t.includes("financ")) return PILL_ICONS.dollar;
  if (t.includes("concept")) return PILL_ICONS.bulb;
  if (t.includes("inventory")) return PILL_ICONS.box;
  if (t.includes("workflow")) return PILL_ICONS.workflow;
  if (t.includes("report") || t.includes("analytic")) return PILL_ICONS.chart;
  if (t.includes("reservation")) return PILL_ICONS.calendar;
  if (t.includes("marketing")) return PILL_ICONS.plane;
  if (t.includes("integration")) return PILL_ICONS.plug;
  return PILL_ICONS.spark;
}

function renderPills(list, targetSel) {
  const grid = $(targetSel);
  if (!list.length) {
    grid.innerHTML = '<p class="empty">Nothing here yet.</p>';
    return;
  }
  grid.innerHTML = list
    .map((c) => {
      const ico = c.image_path
        ? `<span class="pill-ico"><img src="/${esc(c.image_path)}" alt="" /></span>`
        : `<span class="pill-ico">${pillIcon(c.title)}</span>`;
      return `<div class="pill-card reveal">${ico}<div class="pill-title">${esc(c.title)}</div></div>`;
    })
    .join("");
}

const PIN_ICON =
  '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s7-5.2 7-11a7 7 0 0 0-14 0c0 5.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>';

function renderSites(list) {
  const grid = $("#siteGrid");
  if (!list.length) {
    grid.innerHTML = '<p class="empty">No sites yet.</p>';
    return;
  }
  let html = list
    .map((c) => {
      const img = c.image_path
        ? `<div class="bg" style="background-image:url('/${esc(c.image_path)}')"></div>`
        : `<div class="bg ph"></div>`;
      const loc = c.location ? `<div class="loc">${esc(c.location)}</div>` : "";
      return `
        <article class="site-card reveal">
          ${img}
          <div class="name">${esc(c.title)}</div>
          ${loc}
        </article>`;
    })
    .join("");
  html += `<a class="site-card more reveal" href="#sites">${PIN_ICON}<span class="more-label">View All Sites ${ARROW}</span></a>`;
  grid.innerHTML = html;
}

function applyText(scope, obj) {
  if (!obj) return;
  $$(`[data-${scope}]`).forEach((el) => {
    const key = el.getAttribute(`data-${scope}`);
    if (obj[key] != null && obj[key] !== "") el.textContent = obj[key];
  });
}

function renderHero(hero) {
  if (!hero) return;
  applyText("hero", hero);
  const c1 = $("#heroCta1");
  const c2 = $("#heroCta2");
  if (hero.cta1_label) c1.querySelector("span").textContent = hero.cta1_label;
  if (hero.cta1_url) c1.setAttribute("href", hero.cta1_url);
  if (hero.cta2_label) c2.querySelector("span").textContent = hero.cta2_label;
  if (hero.cta2_url) c2.setAttribute("href", hero.cta2_url);
}

const SOCIAL_ICONS = {
  instagram:
    '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>',
  linkedin:
    '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 10v7M7 7v.01M11 17v-4a2 2 0 0 1 4 0v4M11 17v-7"/></svg>',
  email:
    '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/></svg>',
};

function renderSocials(socials) {
  const wrap = $("#socials");
  if (!socials) return;
  const items = [];
  if (socials.instagram)
    items.push(`<a href="${esc(socials.instagram)}" aria-label="Instagram" target="_blank" rel="noopener">${SOCIAL_ICONS.instagram}</a>`);
  if (socials.linkedin)
    items.push(`<a href="${esc(socials.linkedin)}" aria-label="LinkedIn" target="_blank" rel="noopener">${SOCIAL_ICONS.linkedin}</a>`);
  if (socials.email)
    items.push(`<a href="mailto:${esc(socials.email)}" aria-label="Email">${SOCIAL_ICONS.email}</a>`);
  wrap.innerHTML = items.join("");
}

/* ---------- scroll reveal ---------- */
function observeReveal() {
  const els = $$(".reveal");
  if (!("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  els.forEach((el) => io.observe(el));
}

/* ---------- load ---------- */
async function load() {
  try {
    const res = await fetch("/api/content");
    if (!res.ok) throw new Error("bad status");
    const { settings, cards } = await res.json();

    renderHero(settings.hero);
    applyText("about", settings.about);
    applyText("footer", settings.footer);
    renderSocials(settings.socials);

    renderBrands(cards.brands || []);
    renderPills(cards.services || [], "#serviceGrid");
    renderPills(cards.automations || [], "#automationGrid");
    renderSites(cards.sites || []);

    observeReveal();
  } catch (err) {
    console.error("Failed to load content", err);
    $("#brandGrid").innerHTML =
      '<p class="empty">Content is loading slowly or unavailable. Please refresh in a moment.</p>';
  }
}

/* ---------- nav + signup ---------- */
function wireNav() {
  const toggle = $("#navToggle");
  const links = $("#navLinks");
  if (toggle) toggle.addEventListener("click", () => links.classList.toggle("open"));
  $$("#navLinks a").forEach((a) =>
    a.addEventListener("click", () => links.classList.remove("open"))
  );
}

function wireSignup() {
  const form = $("#notify");
  const email = $("#email");
  const note = $("#note");
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const value = email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      note.className = "note";
      note.textContent = "Please enter a valid email address.";
      email.focus();
      return;
    }
    try {
      const res = await fetch("/api/signups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "failed");
      note.className = "note ok";
      note.textContent = "Thank you — we'll be in touch soon.";
      form.reset();
    } catch (err) {
      note.className = "note";
      note.textContent = err.message || "Something went wrong. Please try again.";
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  wireNav();
  wireSignup();
  load();
});
