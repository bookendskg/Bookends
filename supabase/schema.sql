-- =====================================================================
-- Bookends Hospitality — Supabase schema
-- Run this ONCE in the Supabase SQL editor (Dashboard → SQL → New query).
-- Safe to re-run: tables use IF NOT EXISTS and seeds use ON CONFLICT DO NOTHING.
-- =====================================================================

-- ---------------------------------------------------------------------
-- CARDS: one generic table powering every card section on the home page.
--   section ∈ brands | services | automations | sites
-- ---------------------------------------------------------------------
create table if not exists public.cards (
  id          bigint generated always as identity primary key,
  section     text not null check (section in ('brands','services','automations','sites')),
  title       text not null,
  subtitle    text,            -- tagline (brands)
  description text,
  location    text,            -- sites/locations
  cta_label   text,
  cta_url     text,
  coming_soon boolean not null default false,
  image_path  text,            -- e.g. 'assets/aiko.jpg' (file committed in repo)
  sort_order  integer not null default 0,
  published   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_cards_section_order on public.cards (section, sort_order);

-- ---------------------------------------------------------------------
-- SETTINGS: key/value JSON for hero, about, contact, socials, footer.
-- ---------------------------------------------------------------------
create table if not exists public.settings (
  key   text primary key,      -- hero | about | contact | socials | footer
  value jsonb not null
);

-- ---------------------------------------------------------------------
-- SIGNUPS: captured "notify me" emails.
-- ---------------------------------------------------------------------
create table if not exists public.signups (
  id         bigint generated always as identity primary key,
  email      text not null unique,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Row Level Security.
-- The app talks to the DB exclusively with the service-role key, which
-- BYPASSES RLS. We still enable RLS (and add NO anon policies) so that the
-- public anon key cannot read/write these tables directly.
-- ---------------------------------------------------------------------
alter table public.cards    enable row level security;
alter table public.settings enable row level security;
alter table public.signups  enable row level security;

-- ---------------------------------------------------------------------
-- keep updated_at fresh on cards
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_cards_updated_at on public.cards;
create trigger trg_cards_updated_at
  before update on public.cards
  for each row execute function public.set_updated_at();

-- =====================================================================
-- SEED DATA (idempotent)
-- =====================================================================

-- ---- Settings -------------------------------------------------------
insert into public.settings (key, value) values
  ('hero', jsonb_build_object(
    'eyebrow', 'Coming Soon',
    'headline', 'Elevating Hospitality.',
    'headline_em', 'Building Experiences.',
    'body', 'Bookends Hospitality brings together a portfolio of exceptional restaurants, innovative services and powerful automations.',
    'cta1_label', 'Explore Our Ecosystem',
    'cta1_url', '#brands',
    'cta2_label', 'Contact Us',
    'cta2_url', '#contact',
    'wordmark', 'BOOKENDS'
  )),
  ('about', jsonb_build_object(
    'title', 'About Us',
    'body', 'Bookends Hospitality is a restaurant group dedicated to crafting memorable dining experiences across our growing portfolio of brands and locations.'
  )),
  ('contact', jsonb_build_object(
    'email', 'reservation.bookends@gmail.com',
    'phone', '',
    'address', ''
  )),
  ('socials', jsonb_build_object(
    'instagram', '',
    'linkedin', '',
    'email', 'reservation.bookends@gmail.com'
  )),
  ('footer', jsonb_build_object(
    'copyright', '© 2026 Bookends Hospitality. All Rights Reserved.'
  ))
on conflict (key) do nothing;

-- ---- Brands ---------------------------------------------------------
insert into public.cards (section, title, subtitle, description, cta_label, cta_url, coming_soon, sort_order)
select * from (values
  ('brands','AIKO','Elevated Asian Dining','Refined Asian cuisine in an intimate setting.','Explore AIKO','#',false,10),
  ('brands','CAPICHE','Modern Spanish Cuisine','Contemporary Spanish flavors, reimagined.','Explore CAPICHE','#',false,20),
  ('brands','CASA AMOR','Italian Soul. Timeless Taste.','Heartfelt Italian dining rooted in tradition.','Explore CASA AMOR','#',false,30),
  ('brands','STK','Steakhouse Redefined','A modern steakhouse experience.','Explore STK','#',false,40),
  ('brands','Coming Soon','New Experience','Stay tuned — a new concept is on the way.','View All Brands','#brands',true,50)
) as v(section,title,subtitle,description,cta_label,cta_url,coming_soon,sort_order)
where not exists (select 1 from public.cards where section = 'brands');

-- ---- Services -------------------------------------------------------
insert into public.cards (section, title, sort_order)
select * from (values
  ('services','Operations Management',10),
  ('services','Supply Chain Management',20),
  ('services','Marketing & Branding',30),
  ('services','People & Culture',40),
  ('services','Financial Management',50),
  ('services','Concept Development',60)
) as v(section,title,sort_order)
where not exists (select 1 from public.cards where section = 'services');

-- ---- Automations ----------------------------------------------------
insert into public.cards (section, title, sort_order)
select * from (values
  ('automations','Inventory Automation',10),
  ('automations','Workflow Automation',20),
  ('automations','Reporting & Analytics',30),
  ('automations','Reservations Automation',40),
  ('automations','Marketing Automation',50),
  ('automations','Integrations',60)
) as v(section,title,sort_order)
where not exists (select 1 from public.cards where section = 'automations');

-- ---- Sites / Locations ---------------------------------------------
insert into public.cards (section, title, location, sort_order)
select * from (values
  ('sites','AIKO Miami','Miami, FL',10),
  ('sites','CAPICHE Downtown','Miami, FL',20),
  ('sites','STK Orlando','Orlando, FL',30),
  ('sites','CASA AMOR Brickell','Miami, FL',40),
  ('sites','AIKO Fort Lauderdale','Fort Lauderdale, FL',50)
) as v(section,title,location,sort_order)
where not exists (select 1 from public.cards where section = 'sites');
