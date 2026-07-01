"use strict";

/* Bookends admin dashboard. Talks to /api/admin/* (cookie-authed). */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

const SECTIONS = ["brands", "services", "automations", "sites"];
const SECTION_LABEL = {
  brands: "Brands",
  services: "Services",
  automations: "Automations",
  sites: "Sites",
};

let currentTab = "brands";
let assetList = [];
let cardsCache = []; // cards for the current section

/* ---------- helpers ---------- */
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

async function api(path, opts = {}) {
  const o = Object.assign({ headers: {} }, opts);
  o.headers = Object.assign({ "X-Requested-With": "fetch" }, o.headers);
  if (o.body && typeof o.body === "object") {
    o.headers["Content-Type"] = "application/json";
    o.body = JSON.stringify(o.body);
  }
  const res = await fetch(path, o);
  if (res.status === 401) {
    window.location.href = "/login";
    throw new Error("Not authenticated");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

let toastTimer;
function toast(message, kind = "ok") {
  const t = $("#toast");
  t.textContent = message;
  t.className = `toast show ${kind}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.className = "toast"), 2600);
}

/* ---------- tabs ---------- */
const TAB_META = {
  brands: { title: "Brands", sub: "Manage your restaurant brands." },
  services: { title: "Services", sub: "What your group offers." },
  automations: { title: "Automations", sub: "Your automation suite." },
  sites: { title: "Sites", sub: "Your locations." },
  settings: { title: "Site Settings", sub: "Hero, about, contact, socials & footer." },
  signups: { title: "Email Signups", sub: "People waiting to hear from you." },
};

function switchTab(tab) {
  currentTab = tab;
  $$("#tabs .tab").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  const isCard = SECTIONS.includes(tab);
  const meta = TAB_META[tab] || {};
  $("#pageTitle").textContent = meta.title || "";
  $("#pageSub").textContent = meta.sub || "";
  $("#addCardBtn").style.display = isCard ? "" : "none";
  $("#statRow").style.display = isCard ? "" : "none";
  $("#cardsPanel").style.display = isCard ? "" : "none";
  $("#settingsPanel").style.display = tab === "settings" ? "" : "none";
  $("#signupsPanel").style.display = tab === "signups" ? "" : "none";

  if (isCard) loadCards();
  else if (tab === "settings") loadSettings();
  else if (tab === "signups") loadSignups();
}

function renderStats(cards) {
  const total = cards.length;
  const live = cards.filter((c) => c.published).length;
  const hidden = total - live;
  $("#statRow").innerHTML = `
    <div class="stat-card"><div class="stat-label">Total cards</div><div class="stat-value">${total}</div></div>
    <div class="stat-card"><div class="stat-label">Published</div><div class="stat-value ok">${live}</div></div>
    <div class="stat-card"><div class="stat-label">Hidden</div><div class="stat-value accent">${hidden}</div></div>`;
}

/* ---------- cards ---------- */
async function loadCards() {
  const list = $("#cardList");
  list.innerHTML = '<p class="empty">Loading…</p>';
  try {
    const { cards } = await api(`/api/admin/cards?section=${currentTab}`);
    cardsCache = cards;
    renderStats(cards);
    renderCardRows(cards);
  } catch (err) {
    list.innerHTML = `<p class="empty">${esc(err.message)}</p>`;
  }
}

function renderCardRows(cards) {
  const list = $("#cardList");
  if (!cards.length) {
    list.innerHTML = '<p class="empty">No cards yet. Click “Add card”.</p>';
    return;
  }
  list.innerHTML = cards
    .map((c) => {
      const thumb = c.image_path
        ? `<div class="thumb" style="background-image:url('/${esc(c.image_path)}')"></div>`
        : `<div class="thumb"></div>`;
      const sub = [c.subtitle, c.location].filter(Boolean).join(" · ");
      const badge = c.published
        ? '<span class="badge live">Live</span>'
        : '<span class="badge hidden">Hidden</span>';
      return `
        <div class="row" draggable="true" data-id="${c.id}">
          <span class="drag" title="Drag to reorder">⠿</span>
          ${thumb}
          <div class="row-main">
            <div class="row-title">${esc(c.title)}${c.coming_soon ? " · (coming soon)" : ""}</div>
            <div class="row-sub">${esc(sub || "—")}</div>
          </div>
          <div class="row-actions">
            ${badge}
            <label class="toggle" title="Toggle published">
              <input type="checkbox" data-pub="${c.id}" ${c.published ? "checked" : ""} />
              <span class="track"><span class="knob"></span></span>
            </label>
            <button class="btn btn-ghost btn-sm" data-edit="${c.id}">Edit</button>
            <button class="btn btn-danger btn-sm" data-del="${c.id}">Delete</button>
          </div>
        </div>`;
    })
    .join("");

  wireRowActions();
  wireDrag();
}

function wireRowActions() {
  $$("[data-edit]").forEach((b) =>
    b.addEventListener("click", () => openModal(Number(b.dataset.edit)))
  );
  $$("[data-del]").forEach((b) =>
    b.addEventListener("click", () => deleteCard(Number(b.dataset.del)))
  );
  $$("[data-pub]").forEach((cb) =>
    cb.addEventListener("change", () => togglePublish(Number(cb.dataset.pub), cb.checked))
  );
}

async function togglePublish(id, published) {
  try {
    await api(`/api/admin/cards/${id}/publish`, { method: "PATCH", body: { published } });
    toast(published ? "Card published" : "Card hidden");
    loadCards();
  } catch (err) {
    toast(err.message, "err");
    loadCards();
  }
}

async function deleteCard(id) {
  const card = cardsCache.find((c) => c.id === id);
  if (!confirm(`Delete “${card ? card.title : "this card"}”? This cannot be undone.`)) return;
  try {
    await api(`/api/admin/cards/${id}`, { method: "DELETE" });
    toast("Card deleted");
    loadCards();
  } catch (err) {
    toast(err.message, "err");
  }
}

/* ---------- drag reorder ---------- */
function wireDrag() {
  const list = $("#cardList");
  let dragEl = null;

  $$(".row", list).forEach((row) => {
    row.addEventListener("dragstart", () => {
      dragEl = row;
      row.classList.add("dragging");
    });
    row.addEventListener("dragend", () => {
      row.classList.remove("dragging");
      dragEl = null;
      persistOrder();
    });
  });

  list.addEventListener("dragover", (e) => {
    e.preventDefault();
    if (!dragEl) return;
    const after = getDragAfter(list, e.clientY);
    if (after == null) list.appendChild(dragEl);
    else list.insertBefore(dragEl, after);
  });
}

function getDragAfter(container, y) {
  const rows = $$(".row:not(.dragging)", container);
  let closest = { offset: Number.NEGATIVE_INFINITY, el: null };
  for (const row of rows) {
    const box = row.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) closest = { offset, el: row };
  }
  return closest.el;
}

async function persistOrder() {
  const orderedIds = $$("#cardList .row").map((r) => Number(r.dataset.id));
  try {
    await api("/api/admin/cards/reorder", {
      method: "POST",
      body: { section: currentTab, orderedIds },
    });
    toast("Order saved");
  } catch (err) {
    toast(err.message, "err");
    loadCards();
  }
}

/* ---------- modal (add/edit) ---------- */
function setFieldVisibility(section) {
  $$("[data-fields]").forEach((el) => {
    const list = el.getAttribute("data-fields").split(",");
    el.style.display = list.includes(section) ? "" : "none";
  });
}

function fillImageOptions(selected) {
  const sel = $("#f_image_path");
  sel.innerHTML =
    '<option value="">— No image —</option>' +
    assetList.map((a) => `<option value="${esc(a)}">${esc(a)}</option>`).join("");
  sel.value = selected || "";
  updatePreview();
}

function updatePreview() {
  const v = $("#f_image_path").value;
  $("#f_preview").style.backgroundImage = v ? `url('/${v}')` : "none";
}

function openModal(id) {
  const editing = cardsCache.find((c) => c.id === id);
  $("#modalTitle").textContent = editing ? "Edit card" : `Add ${SECTION_LABEL[currentTab].toLowerCase()} card`;
  $("#f_id").value = editing ? editing.id : "";
  $("#f_section").value = currentTab;
  $("#f_title").value = editing ? editing.title || "" : "";
  $("#f_subtitle").value = editing ? editing.subtitle || "" : "";
  $("#f_description").value = editing ? editing.description || "" : "";
  $("#f_cta_label").value = editing ? editing.cta_label || "" : "";
  $("#f_cta_url").value = editing ? editing.cta_url || "" : "";
  $("#f_location").value = editing ? editing.location || "" : "";
  $("#f_coming_soon").checked = editing ? !!editing.coming_soon : false;
  $("#f_published").checked = editing ? !!editing.published : true;

  setFieldVisibility(currentTab);
  fillImageOptions(editing ? editing.image_path : "");
  $("#modalBack").classList.add("open");
  $("#f_title").focus();
}

function closeModal() {
  $("#modalBack").classList.remove("open");
}

async function saveCard(e) {
  e.preventDefault();
  const id = $("#f_id").value;
  const payload = {
    section: $("#f_section").value,
    title: $("#f_title").value.trim(),
    subtitle: $("#f_subtitle").value.trim() || null,
    description: $("#f_description").value.trim() || null,
    cta_label: $("#f_cta_label").value.trim() || null,
    cta_url: $("#f_cta_url").value.trim() || null,
    location: $("#f_location").value.trim() || null,
    image_path: $("#f_image_path").value || null,
    coming_soon: $("#f_coming_soon").checked,
    published: $("#f_published").checked,
  };
  if (!payload.title) {
    toast("Title is required", "err");
    return;
  }
  $("#modalSave").disabled = true;
  try {
    if (id) {
      await api(`/api/admin/cards/${id}`, { method: "PUT", body: payload });
      toast("Card updated");
    } else {
      await api("/api/admin/cards", { method: "POST", body: payload });
      toast("Card created");
    }
    closeModal();
    loadCards();
  } catch (err) {
    toast(err.message, "err");
  } finally {
    $("#modalSave").disabled = false;
  }
}

/* ---------- settings ---------- */
const SETTINGS_SCHEMA = {
  hero: [
    ["headline", "Headline"],
    ["headline_em", "Headline (accent line)"],
    ["body", "Body", "textarea"],
    ["cta1_label", "Button 1 label"],
    ["cta1_url", "Button 1 link"],
    ["cta2_label", "Button 2 label"],
    ["cta2_url", "Button 2 link"],
    ["image", "Hero image path (e.g. assets/aiko.jpg)"],
  ],
  about: [
    ["title", "Title"],
    ["body", "Body", "textarea"],
    ["image", "About image path (e.g. assets/capiche.png)"],
  ],
  contact: [
    ["email", "Email"],
    ["phone", "Phone"],
    ["address", "Address"],
  ],
  socials: [
    ["instagram", "Instagram URL"],
    ["linkedin", "LinkedIn URL"],
    ["email", "Contact email"],
  ],
  footer: [["copyright", "Copyright text"]],
};

async function loadSettings() {
  const wrap = $("#settingsForms");
  wrap.innerHTML = '<p class="empty">Loading…</p>';
  try {
    const { settings } = await api("/api/admin/settings");
    wrap.innerHTML = Object.keys(SETTINGS_SCHEMA)
      .map((key) => {
        const val = settings[key] || {};
        const fields = SETTINGS_SCHEMA[key]
          .map(([f, label, type]) => {
            const v = esc(val[f] || "");
            const input =
              type === "textarea"
                ? `<textarea class="input" data-s="${key}.${f}">${v}</textarea>`
                : `<input class="input" data-s="${key}.${f}" value="${v}" />`;
            return `<label class="field" style="margin:0"><span style="font-size:.78rem;color:var(--muted)">${label}</span>${input}</label>`;
          })
          .join("");
        return `
          <div style="margin-bottom:1.6rem">
            <div class="panel-head" style="margin-bottom:.8rem">
              <h2 style="font-size:.95rem;text-transform:capitalize">${key}</h2>
              <button class="btn btn-primary btn-sm" data-save-settings="${key}">Save ${key}</button>
            </div>
            <div class="form-grid">${fields}</div>
          </div>`;
      })
      .join("");

    $$("[data-save-settings]").forEach((b) =>
      b.addEventListener("click", () => saveSettings(b.dataset.saveSettings))
    );
  } catch (err) {
    wrap.innerHTML = `<p class="empty">${esc(err.message)}</p>`;
  }
}

async function saveSettings(key) {
  const value = {};
  $$(`[data-s^="${key}."]`).forEach((el) => {
    const field = el.getAttribute("data-s").split(".")[1];
    value[field] = el.value;
  });
  try {
    await api(`/api/admin/settings/${key}`, { method: "PUT", body: { value } });
    toast(`${key} saved`);
  } catch (err) {
    toast(err.message, "err");
  }
}

/* ---------- signups ---------- */
async function loadSignups() {
  const wrap = $("#signupsTable");
  wrap.innerHTML = '<p class="empty">Loading…</p>';
  try {
    const { signups } = await api("/api/admin/signups");
    $("#signupCount").textContent = `${signups.length} total`;
    if (!signups.length) {
      wrap.innerHTML = '<p class="empty">No signups yet.</p>';
      return;
    }
    wrap.innerHTML = `
      <table class="tbl">
        <thead><tr><th>Email</th><th>Date</th><th></th></tr></thead>
        <tbody>
          ${signups
            .map(
              (s) => `<tr>
                <td>${esc(s.email)}</td>
                <td>${new Date(s.created_at).toLocaleString()}</td>
                <td style="text-align:right"><button class="btn btn-danger btn-sm" data-delsignup="${s.id}">Delete</button></td>
              </tr>`
            )
            .join("")}
        </tbody>
      </table>`;
    $$("[data-delsignup]").forEach((b) =>
      b.addEventListener("click", async () => {
        if (!confirm("Delete this signup?")) return;
        try {
          await api(`/api/admin/signups/${b.dataset.delsignup}`, { method: "DELETE" });
          toast("Deleted");
          loadSignups();
        } catch (err) {
          toast(err.message, "err");
        }
      })
    );
  } catch (err) {
    wrap.innerHTML = `<p class="empty">${esc(err.message)}</p>`;
  }
}

/* ---------- boot ---------- */
async function boot() {
  // confirm session + show who
  try {
    const me = await api("/api/me");
    $("#who").textContent = me.email;
    $("#avatar").textContent = (me.email || "B").charAt(0).toUpperCase();
  } catch (_) {
    return; // api() already redirected to /login on 401
  }

  // load asset list once for the image picker
  try {
    const { assets } = await api("/api/admin/assets");
    assetList = assets || [];
  } catch (_) {
    assetList = [];
  }

  $$("#tabs .tab").forEach((b) =>
    b.addEventListener("click", () => {
      switchTab(b.dataset.tab);
      $("#sidebar").classList.remove("open"); // close drawer on mobile
    })
  );
  const sidebarToggle = $("#sidebarToggle");
  if (sidebarToggle)
    sidebarToggle.addEventListener("click", () => $("#sidebar").classList.toggle("open"));
  $("#addCardBtn").addEventListener("click", () => openModal(null));
  $("#modalClose").addEventListener("click", closeModal);
  $("#modalCancel").addEventListener("click", closeModal);
  $("#modalBack").addEventListener("click", (e) => {
    if (e.target.id === "modalBack") closeModal();
  });
  $("#cardForm").addEventListener("submit", saveCard);
  $("#f_image_path").addEventListener("change", updatePreview);
  $("#logoutBtn").addEventListener("click", async () => {
    try {
      await api("/api/logout", { method: "POST" });
    } catch (_) {}
    window.location.href = "/login";
  });

  switchTab("brands");
}

document.addEventListener("DOMContentLoaded", boot);
