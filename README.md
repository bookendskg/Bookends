# Bookends Hospitality — Coming Soon

A single-page "coming soon" landing page for **Bookends Hospitality**, with an email
capture form and ambient animations. No build step, no dependencies — just open the file.

## Preview

Open `index.html` in any modern browser:

```sh
# Windows
start index.html

# macOS
open index.html

# Linux
xdg-open index.html
```

Or serve it locally (recommended, so the logo mask/shimmer load cleanly):

```sh
npx serve .
# or
python -m http.server 8000
```

## Project structure

```
.
├── index.html                          # the entire page (HTML + CSS + JS inline)
├── assets/
│   └── Bookends_Logo_RoyalBlue.png     # brand logo (also used as favicon)
└── README.md
```

## Features

- **Responsive** layout — form stacks on mobile.
- **Email capture** with inline validation.
- **Animations** — drifting aurora background, a shimmer sweep across the logo,
  gentle logo float, staggered entrance, pulsing "Coming Soon" dot, and an
  animated divider.
- **Accessible** — respects `prefers-reduced-motion` (all motion disabled),
  uses `aria-live` for form status.
- **Self-contained** — all styles and scripts are inline; the only external
  requests are Google Fonts and the local logo.

## Email signups

There is **no backend yet**. On submit, valid emails are stored in the browser's
`localStorage` under the key `bookends_signups` so nothing is lost before launch.

To inspect collected emails, run this in the browser console:

```js
JSON.parse(localStorage.getItem("bookends_signups") || "[]")
```

### Wiring up a real backend

Replace the `localStorage` block in the `<script>` at the bottom of `index.html`
with a POST to your provider (e.g. Formspree, Mailchimp, or a custom endpoint):

```js
await fetch("https://your-endpoint.example/subscribe", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: value }),
});
```

## Customization

| What | Where |
| --- | --- |
| Colors / theme | `:root` CSS variables at the top of `index.html` |
| Fonts | Google Fonts `<link>` in `<head>` |
| Headline & copy | `<h1>` and `.lede` in the markup |
| Logo | `assets/Bookends_Logo_RoyalBlue.png` (swap the file or update paths) |
| Animation intensity | `@keyframes` and `animation` durations in the `<style>` block |

## Deployment

Static files — host anywhere: Netlify, Vercel, GitHub Pages, Cloudflare Pages,
or any static web server. Just upload the folder.

### Deploy to Render

This repo includes a [`render.yaml`](render.yaml) Blueprint that defines a free
**Static Site** — no build step, asset caching, and a catch-all rewrite to
`index.html`.

**Option A — Blueprint (recommended, auto-deploy on push)**

1. Push the folder to GitHub (or GitLab/Bitbucket):

   ```sh
   git init
   git add .
   git commit -m "Bookends coming-soon landing page"
   git branch -M main
   git remote add origin https://github.com/<you>/bookends.git
   git push -u origin main
   ```

2. Go to **dashboard.render.com → New → Blueprint**.
3. Connect the repo. Render reads `render.yaml` and creates the static site.
4. Click **Apply**. Every push to `main` then auto-deploys.

**Option B — Manual static site (no `render.yaml` needed)**

1. Push the repo to GitHub (see step 1 above).
2. **dashboard.render.com → New → Static Site**, connect the repo.
3. Settings:
   - **Build Command:** leave empty
   - **Publish Directory:** `.`
4. Click **Create Static Site**.

---

&copy; 2026 Bookends Hospitality
