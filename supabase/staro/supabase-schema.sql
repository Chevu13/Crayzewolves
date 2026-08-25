-- ============================================================================
-- CRAZYWOLVES — ŠEMA BAZE ZA SUPABASE
-- ----------------------------------------------------------------------------
-- Kako se pokreće:
--   Supabase → SQL Editor → New query → nalepi ceo fajl → Run
--
-- Skripta se može pokrenuti više puta bez štete: sve je pisano sa
-- IF NOT EXISTS i ON CONFLICT, pa ponovno pokretanje ništa ne kvari.
--
-- VAŽNO — CENE SU U NAJMANJOJ JEDINICI VALUTE, ne u celim dinarima/evrima.
--   RSD:  149000  =  1.490,00 RSD      (pare)
--   EUR:    1290  =     12,90 EUR      (centi)
-- Ako se upiše 1490 u polje za dinare, cena će izaći kao 14,90 RSD.
--
-- Cena u evrima se upisuje RUČNO, posebno od dinarske. Nije preračun:
-- shop radi za ceo Balkan, pa cena po zemlji sme da se razlikuje iz
-- komercijalnih razloga, ne samo po kursu.
-- ============================================================================


-- ============================================================================
-- 1. PRIPREMA
-- ============================================================================

create extension if not exists pgcrypto;

-- Jedna funkcija za sve tabele: pri svakoj izmeni osvežava updated_at,
-- da se ne oslanjamo na to da klijent pošalje tačno vreme.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ============================================================================
-- 2. RUBRIKE BLOGA
-- ============================================================================

create table if not exists public.post_categories (
  id          text primary key,
  name        text not null,
  slug        text not null unique,
  description text,
  sort_order  int  not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_post_categories_touch on public.post_categories;
create trigger trg_post_categories_touch
  before update on public.post_categories
  for each row execute function public.touch_updated_at();


-- ============================================================================
-- 3. OBJAVE
-- ----------------------------------------------------------------------------
-- Blog i novosti su jedna vrsta zapisa — razlikovale su se samo po nazivu,
-- pa je podela uklonjena i iz panela i odavde.
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'post_status') then
    create type public.post_status as enum ('draft', 'published', 'archived');
  end if;
end
$$;

create table if not exists public.posts (
  id           text primary key default gen_random_uuid()::text,
  title        text not null,
  slug         text not null unique,
  excerpt      text,
  content      text not null default '',
  image        text,                 -- ključ iz cw-images.js ili puna adresa iz Storage-a
  image_alt    text,
  category_id  text references public.post_categories(id) on delete set null,
  status       public.post_status not null default 'draft',
  is_featured  boolean not null default false,
  tags         text[] not null default '{}',
  author       text,
  read_min     int,
  view_count   int not null default 0,
  -- Upisuje se pri PRVOM objavljivanju i posle se ne dira, da vraćanje u
  -- nacrt pa ponovno objavljivanje ne pomeri objavu na vrh liste.
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists posts_status_published_idx
  on public.posts (status, published_at desc);
create index if not exists posts_category_idx
  on public.posts (category_id);

drop trigger if exists trg_posts_touch on public.posts;
create trigger trg_posts_touch
  before update on public.posts
  for each row execute function public.touch_updated_at();


-- ============================================================================
-- 4. KATEGORIJE SHOPA
-- ============================================================================

create table if not exists public.shop_categories (
  id         text primary key,
  name       text not null,
  slug       text not null unique,
  icon       text,
  blurb      text,
  sort_order int not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_shop_categories_touch on public.shop_categories;
create trigger trg_shop_categories_touch
  before update on public.shop_categories
  for each row execute function public.touch_updated_at();


-- ============================================================================
-- 4b. VALUTE
-- ----------------------------------------------------------------------------
-- Evro pokriva Hrvatsku, Sloveniju, Crnu Goru i Kosovo, pa dve valute
-- pokrivaju najveći deo regiona.
--
-- `rate_from_rsd` NIJE cena — služi samo kao rezerva ako proizvod nema
-- upisanu cenu u evrima, da posetiocu nikad ne izađe prazno polje.
-- ============================================================================

create table if not exists public.currencies (
  code          text primary key,          -- 'RSD', 'EUR'
  name          text not null,
  symbol        text not null,
  symbol_after  boolean not null default true,   -- '1.490 RSD' vs '€12,90'
  decimals      int  not null default 2,
  minor_units   int  not null default 100,       -- koliko para/centi ide u jednu jedinicu
  rate_from_rsd numeric(12,6),                   -- rezervni kurs
  is_default    boolean not null default false,
  is_active     boolean not null default true,
  sort_order    int not null default 0,
  updated_at    timestamptz not null default now()
);

drop trigger if exists trg_currencies_touch on public.currencies;
create trigger trg_currencies_touch
  before update on public.currencies
  for each row execute function public.touch_updated_at();

-- Samo jedna valuta sme biti podrazumevana.
create unique index if not exists currencies_one_default_idx
  on public.currencies (is_default) where is_default;


-- ============================================================================
-- 5. PROIZVODI
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'stock_status') then
    create type public.stock_status as enum ('in_stock', 'out_of_stock', 'coming_soon');
  end if;
end
$$;

create table if not exists public.products (
  id           text primary key default gen_random_uuid()::text,
  name         text not null,
  slug         text not null unique,
  category_id  text references public.shop_categories(id) on delete set null,
  collection_id text,
  -- U PARAMA. 149000 = 1.490 RSD.
  price          int not null check (price >= 0),
  compare_at     int check (compare_at is null or compare_at > price),
  -- U CENTIMA. 1290 = 12,90 EUR. Upisuje se ručno; ako ostane prazno,
  -- sajt računa iz dinarske cene po kursu iz tabele valuta.
  price_eur      int check (price_eur is null or price_eur >= 0),
  compare_at_eur int check (compare_at_eur is null or price_eur is null
                            or compare_at_eur > price_eur),
  short_desc   text,
  description  text,
  image        text,
  images       text[] not null default '{}',
  badges       text[] not null default '{}',
  stock_status public.stock_status not null default 'in_stock',
  stock        int not null default 0,
  is_active    boolean not null default true,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Ako je ranija verzija skripte već pokrenuta, tabela postoji bez ovih
-- kolona — ALTER ih dodaje bez diranja podataka.
alter table public.products add column if not exists price_eur      int;
alter table public.products add column if not exists compare_at_eur int;

create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_active_idx   on public.products (is_active, sort_order);

drop trigger if exists trg_products_touch on public.products;
create trigger trg_products_touch
  before update on public.products
  for each row execute function public.touch_updated_at();


-- ============================================================================
-- 6. PODEŠAVANJA
-- ----------------------------------------------------------------------------
-- Ključ/vrednost umesto tabele sa kolonom po podešavanju — dodavanje novog
-- podešavanja ne traži izmenu šeme.
-- ============================================================================

create table if not exists public.settings (
  key        text primary key,
  value      text,
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_settings_touch on public.settings;
create trigger trg_settings_touch
  before update on public.settings
  for each row execute function public.touch_updated_at();


-- ============================================================================
-- 7. BEZBEDNOST (RLS)
-- ----------------------------------------------------------------------------
-- Anon ključ stoji u frontendu i svako ga može pročitati. Zaštita nije u
-- tajnosti ključa nego OVDE: anon sme samo da čita objavljeno, a piše
-- isključivo prijavljen korisnik.
--
-- Bez ovog odeljka bi svako ko otvori sajt mogao da obriše sve proizvode.
-- ============================================================================

alter table public.posts           enable row level security;
alter table public.post_categories enable row level security;
alter table public.products        enable row level security;
alter table public.shop_categories enable row level security;
alter table public.settings        enable row level security;
alter table public.currencies      enable row level security;

-- ---- OBJAVE ----
drop policy if exists "objave: javno čitanje objavljenih" on public.posts;
create policy "objave: javno čitanje objavljenih"
  on public.posts for select
  to anon, authenticated
  using (status = 'published' or auth.role() = 'authenticated');

drop policy if exists "objave: upis samo prijavljenima" on public.posts;
create policy "objave: upis samo prijavljenima"
  on public.posts for all
  to authenticated
  using (true) with check (true);

-- ---- RUBRIKE ----
drop policy if exists "rubrike: javno čitanje" on public.post_categories;
create policy "rubrike: javno čitanje"
  on public.post_categories for select
  to anon, authenticated using (true);

drop policy if exists "rubrike: upis samo prijavljenima" on public.post_categories;
create policy "rubrike: upis samo prijavljenima"
  on public.post_categories for all
  to authenticated using (true) with check (true);

-- ---- PROIZVODI ----
drop policy if exists "proizvodi: javno čitanje aktivnih" on public.products;
create policy "proizvodi: javno čitanje aktivnih"
  on public.products for select
  to anon, authenticated
  using (is_active = true or auth.role() = 'authenticated');

drop policy if exists "proizvodi: upis samo prijavljenima" on public.products;
create policy "proizvodi: upis samo prijavljenima"
  on public.products for all
  to authenticated using (true) with check (true);

-- ---- KATEGORIJE SHOPA ----
drop policy if exists "kategorije: javno čitanje" on public.shop_categories;
create policy "kategorije: javno čitanje"
  on public.shop_categories for select
  to anon, authenticated using (true);

drop policy if exists "kategorije: upis samo prijavljenima" on public.shop_categories;
create policy "kategorije: upis samo prijavljenima"
  on public.shop_categories for all
  to authenticated using (true) with check (true);

-- ---- VALUTE ----
drop policy if exists "valute: javno čitanje" on public.currencies;
create policy "valute: javno čitanje"
  on public.currencies for select
  to anon, authenticated using (true);

drop policy if exists "valute: upis samo prijavljenima" on public.currencies;
create policy "valute: upis samo prijavljenima"
  on public.currencies for all
  to authenticated using (true) with check (true);

-- ---- PODEŠAVANJA ----
drop policy if exists "podesavanja: javno čitanje" on public.settings;
create policy "podesavanja: javno čitanje"
  on public.settings for select
  to anon, authenticated using (true);

drop policy if exists "podesavanja: upis samo prijavljenima" on public.settings;
create policy "podesavanja: upis samo prijavljenima"
  on public.settings for all
  to authenticated using (true) with check (true);


-- ============================================================================
-- 8. SKLADIŠTE SLIKA
-- ----------------------------------------------------------------------------
-- Bucket "media" je javan za čitanje (slike se prikazuju na sajtu), a
-- otpremanje i brisanje sme samo prijavljen korisnik.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

drop policy if exists "media: javno čitanje" on storage.objects;
create policy "media: javno čitanje"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'media');

drop policy if exists "media: otpremanje samo prijavljenima" on storage.objects;
create policy "media: otpremanje samo prijavljenima"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'media');

drop policy if exists "media: izmena samo prijavljenima" on storage.objects;
create policy "media: izmena samo prijavljenima"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'media');

drop policy if exists "media: brisanje samo prijavljenima" on storage.objects;
create policy "media: brisanje samo prijavljenima"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'media');


-- ============================================================================
-- 9. POČETNI SADRŽAJ
-- ----------------------------------------------------------------------------
-- Isto ono što sajt sada prikazuje, da baza od prvog trenutka nije prazna.
-- ON CONFLICT DO NOTHING znači da ponovno pokretanje neće pregaziti izmene
-- koje si u međuvremenu napravio kroz panel.
-- ============================================================================

insert into public.post_categories (id, name, slug, sort_order) values
  ('objave',    'Objave',    'objave',    0),
  ('zajednica', 'Zajednica', 'zajednica', 1),
  ('usluge',    'Usluge',    'usluge',    2),
  ('shop',      'Shop',      'shop',      3),
  ('partneri',  'Partneri',  'partneri',  4),
  ('timovi',    'Timovi',    'timovi',    5)
on conflict (id) do nothing;

-- Kurs je samo rezerva za slučaj da proizvod nema upisanu cenu u evrima.
-- Proveri ga povremeno; ne utiče na proizvode kojima je cena upisana ručno.
insert into public.currencies
  (code, name, symbol, symbol_after, decimals, minor_units, rate_from_rsd, is_default, sort_order)
values
  ('RSD', 'Srpski dinar', 'RSD', true,  2, 100, 1.0,      true,  0),
  ('EUR', 'Evro',         '€',   false, 2, 100, 0.008547, false, 1)
on conflict (code) do nothing;

insert into public.shop_categories (id, name, slug, icon, blurb, sort_order) values
  ('drinkware',   'Šolje',               'drinkware',   'mug',     'Keramika sa zvaničnim grbom.',        0),
  ('apparel',     'Odeća',               'apparel',     'shirt',   'Majice i duksevi. U pripremi.',       1),
  ('accessories', 'Dodaci',              'accessories', 'sticker', 'Stikeri, podloge i sitnice.',         2),
  ('digital',     'Gaming Store',        'digital',     'monitor', 'Igre, DLC i in-game valuta.',         3)
on conflict (id) do nothing;

-- Cene u evrima su zaokružene na lepe iznose, a ne bukvalno preračunate
-- (1.490 RSD po kursu daje 12,73 € — na sajtu stoji 12,90 €).
insert into public.products
  (id, name, slug, category_id, price, price_eur, short_desc, image,
   stock_status, stock, is_active, sort_order)
values
  ('solja-zvanicna', 'Zvanična CrazyWolves šolja', 'zvanicna-solja', 'drinkware',
   149000, 1290,
   'Keramička šolja sa zvaničnim grbom. Limitirano izdanje.',
   'product-mug', 'in_stock', 25, true, 0),

  ('majica-grb', 'Majica sa grbom', 'majica-grb', 'apparel',
   249000, 2190,
   'Majica sa zvaničnim grbom na grudima. U pripremi.',
   'sablon-proizvod-2', 'coming_soon', 0, false, 1),

  ('duks-grb', 'Duks sa grbom', 'duks-grb', 'apparel',
   549000, 4790,
   'Duks sa vezenim grbom. U pripremi.',
   'sablon-proizvod-2', 'coming_soon', 0, false, 2),

  ('stikeri', 'Set stikera', 'set-stikera', 'accessories',
   59000, 490,
   'Die-cut stikeri sa grbom i wordmarkom. U pripremi.',
   'sablon-proizvod-2', 'coming_soon', 0, false, 3)
on conflict (id) do nothing;

insert into public.posts
  (id, title, slug, excerpt, content, image, category_id, status, is_featured, tags, published_at)
values
  ('nova-era', 'Stiže nova era', 'stize-nova-era',
   'Kapije se zatvaraju. Vukovi se okupljaju. Gradi se nešto veće nego ikada pre.',
   E'Kapije se zatvaraju. Vukovi se okupljaju.\n\n'
   '## Šta se sprema\n\n'
   'CrazyWolves Discord je trenutno u rekonstrukciji. Tokom radova deo kanala '
   'ostaje potpuno otvoren.\n\n'
   '> Ne pravimo još jedan server. Pravimo mesto gde se gejmeri, stratezi i '
   'takmičari okupljaju.\n\n'
   'Ostani u toku.',
   'discord-announce', 'objave', 'published', true,
   array['discord','najava'], now() - interval '9 days'),

  ('sajt-u-izradi', 'Web sajt je u izradi', 'web-sajt-u-izradi',
   'CrazyWolves dobija svoj dom na internetu. Ovo je prva faza.',
   E'CrazyWolves dobija svoj dom na internetu.\n\n'
   'Prva faza donosi zvanični shop i blog. Sve ostalo stiže kasnije.',
   'banner-website-soon', 'objave', 'published', false,
   array['sajt'], now() - interval '4 days'),

  ('partnerstvo-wolf3tv', 'Zvanična saradnja sa WOLF3TV', 'saradnja-wolf3tv',
   'Zajednički sadržaj, gostovanja i uzajamna podrška.',
   E'Potpisali smo zvaničnu saradnju sa streamerom WOLF3TV.\n\n'
   '## Šta to znači\n\n'
   '- Zajednički stream sadržaj\n'
   '- Gostovanja na oba kanala\n'
   '- Uzajamna podrška zajednica',
   'partner-wolf3tv', 'partneri', 'published', false,
   array['partnerstvo','stream'], now() - interval '14 days')
on conflict (id) do nothing;

insert into public.settings (key, value) values
  ('site_name',          'CrazyWolves Community'),
  ('tagline',            'The hunt never ends.'),
  ('discord',            'https://discord.gg/crazywolves'),
  ('instagram',          'https://instagram.com/crazywolves.rs'),
  ('email',              'kontakt@crazywolves.rs'),
  -- U parama: 39000 = 390 RSD, 400000 = 4.000 RSD
  ('shipping_flat',          '39000'),
  ('free_shipping_over',     '400000'),
  -- U centima: 390 = 3,90 EUR, 3500 = 35,00 EUR
  ('shipping_flat_eur',      '390'),
  ('free_shipping_over_eur', '3500'),
  ('default_currency',       'RSD')
on conflict (key) do nothing;


-- ============================================================================
-- 10. PROVERA
-- ----------------------------------------------------------------------------
-- Pokreni posle svega; treba da vrati po jedan red za svaku tabelu, sa
-- uključenim RLS-om i brojem redova.
-- ============================================================================

select
  c.relname                                as tabela,
  c.relrowsecurity                         as rls_ukljucen,
  (select count(*) from pg_policies p
     where p.schemaname = 'public' and p.tablename = c.relname) as broj_pravila
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('posts','post_categories','products','shop_categories','settings','currencies')
order by c.relname;
