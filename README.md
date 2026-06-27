# Bookends Hospitality

A Bookends Hospitality marketing site (one scrolling home page — Hero, Brands,
Services, Automations, Sites, footer) **plus an admin dashboard** where a
logged-in admin manages every card and the site's text.

- **App:** Node.js + Express, deployed as a Render Web Service.
- **Database:** Supabase (Postgres), accessed server-side via `@supabase/supabase-js`.
- **Admin auth:** Supabase Auth (server verifies the password, then issues a
  signed httpOnly session cookie). All Supabase keys stay on the server.
- **Card images:** image files committed to the `assets/` folder; the admin picks
  one per card from a dropdown.

```
.
├── src/
│   ├── server.js          # Express app (static + API)
│   ├── supabase.js        # anon + service-role clients
│   ├── auth.js            # login, requireAuth, same-origin guard
│   └── routes/            # auth.js, public.js, admin.js
├── public/
│   ├── index.html         # home (data-driven)
│   ├── admin.html         # admin dashboard
│   ├── login.html
│   ├── css/styles.css
│   └── js/                # home.js, admin.js, login.js
├── assets/                # logo + card images (committed)
├── supabase/schema.sql    # run once in the Supabase SQL editor
├── render.yaml            # Render Blueprint
└── package.json
```

## 1. One-time Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. **SQL editor → New query** → paste the contents of
   [`supabase/schema.sql`](supabase/schema.sql) → **Run**. This creates the
   `cards`, `settings`, `signups` tables and seeds sample content.
3. **Authentication → Users → Add user** → create your admin (email + password).
   Tip: set "Auto Confirm User" so the account is active immediately.
4. **Project Settings → API** → copy these three values for the next step:
   - Project URL → `SUPABASE_URL`
   - `anon` `public` key → `SUPABASE_ANON_KEY`
   - `service_role` key (secret) → `SUPABASE_SERVICE_ROLE_KEY`

## 2. Run locally

```sh
cp .env.example .env      # then fill in the 3 Supabase values
# generate a session secret:
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
# paste it as SESSION_SECRET in .env

npm install
npm start                 # http://localhost:3000
```

- Home: <http://localhost:3000>
- Admin: <http://localhost:3000/admin> (redirects to `/login`)

## 3. Managing content (admin)

Sign in at `/login`, then:

- **Brands / Services / Automations / Sites tabs** — add, edit, delete, reorder
  (drag rows), and show/hide (publish toggle) cards. Changes appear on the live
  site immediately.
- **Settings tab** — edit hero text & buttons, About, Contact, social links, and
  footer.
- **Signups tab** — view captured "notify me" emails; download CSV.

### Adding card images

1. Drop image files into the `assets/` folder (e.g. `assets/aiko.jpg`).
2. Commit & deploy (Render's filesystem is ephemeral, so images must live in the
   repo — they can't be uploaded at runtime).
3. In the admin card form, pick the image from the dropdown.

## 4. Deploy to Render

This repo includes [`render.yaml`](render.yaml) — a Node Web Service Blueprint.

1. If an old `bookends` service exists from a previous attempt, **delete it** in
   the Render dashboard (it was the wrong service type).
2. Push this code to GitHub (`bookendskg/Bookends`).
3. **dashboard.render.com → New → Blueprint** → connect the repo → Render reads
   `render.yaml`.
4. In the service's **Environment**, set the secret vars (the Blueprint marks them
   `sync:false` so they aren't stored in the repo):
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - (`SESSION_SECRET` is generated automatically; `NODE_ENV=production` is set.)
5. **Apply / Deploy.** Visit the `*.onrender.com` URL — the home page is populated
   from the seed data; log in at `/login` to manage it.

## Notes & gotchas

- **Supabase free projects pause after ~7 days of inactivity** — if the site shows
  errors, resume the project from the Supabase dashboard.
- **Render free Web Services sleep after ~15 min idle** — the first request after
  idle takes ~30–60s to wake (cold start).
- **Never expose the `service_role` key** to the browser. This app keeps it
  server-side only; the frontend talks only to this app's API.
- The `cards` table powers all four sections via a `section` column, so the same
  admin UI manages every section.
