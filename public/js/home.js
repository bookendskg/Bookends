"use strict";

/* Bookends home — fetches /api/content and renders every section
   in the teal glassmorphism theme. */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

/* fallback decorative images (committed in assets/) */
const HERO_FALLBACK = "assets/images.jpg";
const ABOUT_FALLBACK = "assets/capiche.png";

/* ---------- brands ---------- */
function renderBrands(list) {
  const grid = $("#brandGrid");
  if (!list.length) {
    grid.innerHTML = '<p class="empty">No brands yet.</p>';
    return;
  }
  grid.innerHTML = list
    .map((c) => {
      const img = c.image_path
        ? `<div class="brand-img" style="background-image:url('/${esc(c.image_path)}')"></div>`
        : "";
      const coming = c.coming_soon ? '<span class="coming-tag">Coming Soon</span>' : "";
      const tag = c.subtitle ? `<div class="brand-tag">${esc(c.subtitle)}</div>` : "";
      const cta = c.cta_label
        ? `<a class="brand-cta" href="${esc(c.cta_url || "#")}">${esc(c.cta_label)} <span class="ms" style="font-size:15px">arrow_forward</span></a>`
        : "";
      return `
        <article class="brand-card reveal">
          ${img}
          <div class="brand-scrim"></div>
          ${coming}
          <div class="brand-overlay">
            <div class="brand-name">${esc(c.title)}</div>
            ${tag}${cta}
          </div>
        </article>`;
    })
    .join("");
}

/* ---------- services / automations (rich cards) ---------- */
const SVC_ICONS = [
  [/operation/, "settings_suggest"],
  [/supply|logistic/, "local_shipping"],
  [/brand|market(?!ing automation)/, "campaign"],
  [/people|culture|staff|hr/, "groups"],
  [/financ|account|revenue|cost/, "payments"],
  [/concept|design|develop/, "lightbulb"],
  [/inventory/, "inventory_2"],
  [/workflow|process/, "account_tree"],
  [/report|analytic|insight/, "monitoring"],
  [/reservation|booking|table/, "event_available"],
  [/marketing/, "send"],
  [/integration|connect|api/, "hub"],
  [/menu|recipe|food/, "restaurant_menu"],
];
function svcIcon(title) {
  const t = (title || "").toLowerCase();
  for (const [re, name] of SVC_ICONS) if (re.test(t)) return name;
  return "auto_awesome";
}

function renderSvc(list, targetSel) {
  const grid = $(targetSel);
  if (!list.length) {
    grid.innerHTML = '<p class="empty">Nothing here yet.</p>';
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
      const attrs = href
        ? ` href="${esc(href)}" target="_blank" rel="noopener"`
        : "";
      return `
        <${tag} class="svc-card reveal${href ? " clickable" : ""}"${attrs}>
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

/* ---------- sites ---------- */
function renderSites(list) {
  const grid = $("#siteGrid");
  if (!list.length) {
    grid.innerHTML = '<p class="empty">No sites yet.</p>';
    return;
  }
  grid.innerHTML = list
    .map((c) => {
      const img = c.image_path
        ? `<div class="site-img" style="background-image:url('/${esc(c.image_path)}')"></div>`
        : `<div class="site-ph"></div>`;
      const loc = c.location
        ? `<div class="site-loc"><span class="ms">location_on</span> ${esc(c.location)}</div>`
        : "";
      return `
        <article class="site-card reveal">
          ${img}
          <div class="site-scrim"></div>
          <div class="site-meta">
            <div class="site-name">${esc(c.title)}</div>
            ${loc}
          </div>
        </article>`;
    })
    .join("");
}

/* ---------- settings-driven bits ---------- */
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
  const c1 = $("#heroCta1"), c2 = $("#heroCta2");
  if (hero.cta1_label) c1.querySelector(".lbl").textContent = hero.cta1_label;
  if (hero.cta1_url) c1.setAttribute("href", hero.cta1_url);
  if (hero.cta2_label) c2.querySelector(".lbl").textContent = hero.cta2_label;
  if (hero.cta2_url) c2.setAttribute("href", hero.cta2_url);
  $("#heroPhoto").src = "/" + (hero.image || HERO_FALLBACK);
}

function renderAbout(about, siteCount) {
  if (about) {
    if (about.title) $('[data-about="title"]').textContent = about.title;
    if (about.body) $('[data-about="body"]').textContent = about.body;
    $("#aboutPhoto").src = "/" + (about.image || ABOUT_FALLBACK);
  } else {
    $("#aboutPhoto").src = "/" + ABOUT_FALLBACK;
  }
  $("#siteCount").textContent = siteCount > 0 ? siteCount + "+" : "—";
}

const SOCIAL = {
  instagram: ["photo_camera", "Instagram"],
  linkedin: ["work", "LinkedIn"],
  email: ["mail", "Email"],
};
function renderFooter(footer, socials) {
  if (footer && footer.copyright) $('[data-footer="copyright"]').textContent = footer.copyright;
  const wrap = $("#footerLinks");
  const items = [];
  if (socials) {
    if (socials.instagram) items.push(`<a href="${esc(socials.instagram)}" target="_blank" rel="noopener"><span class="ms" style="font-size:18px">${SOCIAL.instagram[0]}</span> Instagram</a>`);
    if (socials.linkedin) items.push(`<a href="${esc(socials.linkedin)}" target="_blank" rel="noopener"><span class="ms" style="font-size:18px">${SOCIAL.linkedin[0]}</span> LinkedIn</a>`);
    if (socials.email) items.push(`<a href="mailto:${esc(socials.email)}"><span class="ms" style="font-size:18px">mail</span> Email</a>`);
  }
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
    { threshold: 0.1 }
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
    renderAbout(settings.about, (cards.sites || []).length);
    renderFooter(settings.footer, settings.socials);

    renderBrands(cards.brands || []);
    renderSvc(cards.services || [], "#serviceGrid");
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
  $$("#navLinks a").forEach((a) => a.addEventListener("click", () => links.classList.remove("open")));
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

/* smooth-scroll in-page links without putting #hash in the URL */
function wireAnchors() {
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    e.preventDefault();
    const id = a.getAttribute("href").slice(1);
    if (!id || id === "top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    // keep the address bar clean (no #hash)
    history.replaceState(null, "", location.pathname + location.search);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  wireNav();
  wireSignup();
  wireAnchors();
  load();
});
