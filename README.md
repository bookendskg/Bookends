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

---

&copy; 2026 Bookends Hospitality
