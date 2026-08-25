-- ============================================================================
--  CRAZYWOLVES — KOMPLETNA POSTAVKA BAZE
--  ---------------------------------------------------------------------------
--  JEDAN fajl. Zamenjuje ranija tri (supabase-schema / -orders / -lager),
--  koja su sklonjena u supabase/staro/.
--
--  KAKO SE POKREĆE
--    Supabase → SQL Editor → New query → nalepi CEO fajl → Run.
--    Traje 5–10 sekundi. Na kraju ispisuje tabelu za proveru.
--
--  Sme da se pokrene više puta. Sve je pisano sa IF NOT EXISTS, ON CONFLICT
--  i DROP ... IF EXISTS, pa ponovno pokretanje ne briše tvoje izmene.
--
--  ---------------------------------------------------------------------------
--  IZNOSI SU U NAJMANJOJ JEDINICI VALUTE
--    RSD:  149000  =  1.490,00 RSD   (pare)
--    EUR:    1290  =     12,90 EUR   (centi)
--  Ako u polje za dinare upišeš 1490, cena izlazi kao 14,90 RSD.
--
--  ---------------------------------------------------------------------------
--  ŠTA OVAJ FAJL PRAVI
--    1.  Pripremu i pomoćne funkcije
--    2.  ADMINE — ko sme da menja sajt          ← najvažnije, vidi dole
--    3.  KUPCE — nalozi, profil, istorija kupovine
--    4.  Rubrike i objave (blog)
--    5.  Valute
--    6.  Dve prodavnice: MERCH i WOLFPACK STORE (digitalno)
--    7.  Proizvode
--    8.  STEAM KODOVE — unos jednom, kodovi se dosipaju
--    9.  Porudžbine, stavke, istoriju statusa
--   10.  Lager i dodelu kodova
--   11.  Podešavanja
--   12.  Bezbednost (RLS) nad svim tim
--   13.  Skladište slika
--   14.  Početni sadržaj
--   15.  Proveru
--
--  ---------------------------------------------------------------------------
--  ZAŠTO POSTOJI TABELA `admins`
--
--  Stara šema je imala pravilo „upisivati sme svaki prijavljen korisnik".
--  Dok je jedini prijavljen korisnik bio ti, to je radilo. Čim se dodaju
--  nalozi kupaca, isto pravilo znači da SVAKI REGISTROVANI KUPAC sme da
--  obriše sve proizvode, promeni cene i objavi šta hoće na blogu.
--
--  Zato sada postoji `public.admins` i funkcija `public.is_admin()`. Svako
--  pravilo za upis prolazi kroz nju. Kupac je prijavljen korisnik koji NIJE
--  u toj tabeli — vidi shop i svoje porudžbine, i ništa više.
--
--  Posle pokretanja OBAVEZNO uradi korak iz odeljka 16 na dnu, inače ni ti
--  nećeš moći da uđeš u panel.
-- ============================================================================


-- ============================================================================
-- 1. PRIPREMA
-- ============================================================================

create extension if not exists pgcrypto;

-- Jedna funkcija za sve tabele: pri svakoj izmeni osvežava updated_at, da se
-- ne oslanjamo na to da klijent pošalje tačno vreme.
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
-- 2. ADMINI
-- ----------------------------------------------------------------------------
-- Ko sme da menja sadržaj sajta. Ne uloga u nalogu nego red u ovoj tabeli —
-- da bi se pravo oduzimalo brisanjem jednog reda, bez diranja naloga.
-- ============================================================================

create table if not exists public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text,
  note       text,
  created_at timestamptz not null default now()
);

-- SECURITY DEFINER: funkcija čita `admins` pravima vlasnika, pa pravilo nad
-- `admins` ne mora da dozvoli čitanje svima da bi provera radila.
-- Fiksiran search_path je obavezan uz SECURITY DEFINER — bez njega bi neko
-- mogao da podmetne svoju šemu ispred `public`.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;


-- ============================================================================
-- 3. KUPCI
-- ----------------------------------------------------------------------------
-- Profil kupca. `id` je isti kao id naloga u auth.users, pa je veza 1:1 i ne
-- treba posebna kolona.
--
-- Red se pravi SAM pri registraciji (okidač dole). Da se pravi iz pregledača,
-- kupac bi mogao da napravi profil sa tuđim imejlom.
-- ============================================================================

create table if not exists public.customers (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  first_name   text,
  last_name    text,
  phone        text,

  -- Adresa za dostavu. Jedna, ne spisak — kupcu koji naruči duks dvaput
  -- godišnje spisak adresa je više posla nego koristi.
  address_line text,
  city         text,
  postcode     text,
  country      text not null default 'RS',

  marketing_ok boolean not null default false,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists customers_email_idx on public.customers (lower(email));

drop trigger if exists trg_customers_touch on public.customers;
create trigger trg_customers_touch
  before update on public.customers
  for each row execute function public.touch_updated_at();

-- Pravljenje profila pri registraciji.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.customers (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'first_name', ''),
    nullif(new.raw_user_meta_data ->> 'last_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_auth_user_created on auth.users;
create trigger trg_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Nalozi napravljeni pre ove skripte takođe dobijaju profil.
insert into public.customers (id, email)
select u.id, u.email from auth.users u
on conflict (id) do nothing;


-- ============================================================================
-- 4. RUBRIKE I OBJAVE
-- ----------------------------------------------------------------------------
-- Blog i novosti su jedna vrsta zapisa — razlikovale su se samo po nazivu.
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

create index if not exists posts_status_published_idx on public.posts (status, published_at desc);
create index if not exists posts_category_idx         on public.posts (category_id);

drop trigger if exists trg_posts_touch on public.posts;
create trigger trg_posts_touch
  before update on public.posts
  for each row execute function public.touch_updated_at();


-- ============================================================================
-- 5. VALUTE
-- ----------------------------------------------------------------------------
-- Evro pokriva Hrvatsku, Sloveniju, Crnu Goru i Kosovo.
--
-- `rate_from_rsd` NIJE cena — služi samo kao rezerva ako proizvod nema
-- upisanu cenu u evrima, da posetiocu nikad ne izađe prazno polje.
-- ============================================================================

create table if not exists public.currencies (
  code          text primary key,               -- 'RSD', 'EUR'
  name          text not null,
  symbol        text not null,
  symbol_after  boolean not null default true,  -- '1.490 RSD' vs '€12,90'
  decimals      int  not null default 2,
  minor_units   int  not null default 100,
  rate_from_rsd numeric(12,6),
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
-- 6. DVE PRODAVNICE
-- ----------------------------------------------------------------------------
-- 'merch'   — šolje, odeća, dodaci. Fizička roba, dostava, pouzeće.
-- 'digital' — Wolfpack Store: igre, gift kartice, ključevi, pretplate.
--
-- Razdvojene su kolonom umesto dve tabele proizvoda: naziv, cena, opis i
-- slika su im isti, a razlikuju se samo u isporuci. Dve tabele bi značile
-- dva editora i duplu logiku korpe za istu stvar.
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'shop_kind') then
    create type public.shop_kind as enum ('merch', 'digital');
  end if;
end
$$;

create table if not exists public.shop_categories (
  id         text primary key,
  name       text not null,
  slug       text not null unique,
  shop       public.shop_kind not null default 'merch',
  icon       text,
  blurb      text,
  sort_order int not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ako je ranija verzija već pokrenuta, kolona se dodaje bez diranja podataka.
alter table public.shop_categories add column if not exists shop public.shop_kind not null default 'merch';

drop trigger if exists trg_shop_categories_touch on public.shop_categories;
create trigger trg_shop_categories_touch
  before update on public.shop_categories
  for each row execute function public.touch_updated_at();


-- ============================================================================
-- 7. PROIZVODI
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'stock_status') then
    create type public.stock_status as enum ('in_stock', 'out_of_stock', 'coming_soon');
  end if;
  if not exists (select 1 from pg_type where typname = 'fulfillment_type') then
    create type public.fulfillment_type as enum ('physical', 'digital');
  end if;
end
$$;

create table if not exists public.products (
  id            text primary key default gen_random_uuid()::text,
  name          text not null,
  slug          text not null unique,
  category_id   text references public.shop_categories(id) on delete set null,
  collection_id text,

  shop          public.shop_kind not null default 'merch',

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
  stock        int not null default 0 check (stock >= 0),
  -- Digitalna roba se ne troši kao šolja: stanje joj je broj slobodnih
  -- kodova u product_keys, pa se `stock` kod nje ne prati.
  track_stock  boolean not null default true,

  fulfillment  public.fulfillment_type not null default 'physical',
  allow_cod    boolean not null default true,
  -- Da li se kod šalje sam čim je porudžbina potvrđena.
  auto_delivery boolean not null default true,

  is_active    boolean not null default true,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Dopune za slučaj da tabela postoji od ranije.
alter table public.products add column if not exists price_eur      int;
alter table public.products add column if not exists compare_at_eur int;
alter table public.products add column if not exists shop           public.shop_kind not null default 'merch';
alter table public.products add column if not exists fulfillment    public.fulfillment_type not null default 'physical';
alter table public.products add column if not exists allow_cod      boolean not null default true;
alter table public.products add column if not exists track_stock    boolean not null default true;
alter table public.products add column if not exists auto_delivery  boolean not null default true;

-- Digitalna roba ne ide pouzećem — nema kurira da naplati kod poslat mejlom.
alter table public.products drop constraint if exists products_digital_no_cod;
alter table public.products add constraint products_digital_no_cod
  check (fulfillment = 'physical' or allow_cod = false);

-- Prodavnica i način isporuke moraju da se slažu. Digitalni proizvod u
-- merch prodavnici bi značio da kupac plati dostavu za Steam kod.
alter table public.products drop constraint if exists products_shop_matches_fulfillment;
alter table public.products add constraint products_shop_matches_fulfillment
  check ((shop = 'digital') = (fulfillment = 'digital'));

create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_active_idx   on public.products (is_active, sort_order);
create index if not exists products_shop_idx     on public.products (shop, is_active, sort_order);

drop trigger if exists trg_products_touch on public.products;
create trigger trg_products_touch
  before update on public.products
  for each row execute function public.touch_updated_at();


-- ============================================================================
-- 8. STEAM KODOVI
-- ----------------------------------------------------------------------------
-- Proizvod se unosi JEDNOM. Posle toga se samo dosipaju kodovi — jedan red
-- po kodu.
--
-- Zašto red po kodu, a ne polje sa spiskom u proizvodu:
--   • kod mora da bude jedinstven u celoj bazi, da se isti ne proda dvaput
--   • mora da se zna kojoj je porudžbini otišao i kada
--   • dva kupca koji istovremeno kupe poslednja dva koda moraju da dobiju
--     RAZLIČITE — to rešava `for update skip locked` u funkciji dole, što
--     nad poljem sa spiskom ne bi bilo moguće
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'key_status') then
    create type public.key_status as enum ('available', 'sold', 'void');
  end if;
end
$$;

create table if not exists public.product_keys (
  id            uuid primary key default gen_random_uuid(),
  product_id    text not null references public.products(id) on delete cascade,
  code          text not null,
  status        public.key_status not null default 'available',

  order_id      uuid,
  order_item_id uuid,
  sold_at       timestamptz,

  -- Odakle je kod nabavljen, za tvoju evidenciju. Kupac ovo ne vidi.
  note          text,

  created_at    timestamptz not null default now()
);

-- Jedinstven u celoj bazi, ne samo unutar proizvoda: Steam kod je jedinstven
-- po sebi, a ovo hvata i grešku pri lepljenju istog spiska dvaput.
create unique index if not exists product_keys_code_uidx on public.product_keys (code);
create index if not exists product_keys_lookup_idx on public.product_keys (product_id, status);
create index if not exists product_keys_order_idx  on public.product_keys (order_id);

-- Koliko kodova ima slobodno po proizvodu — panel čita ovo umesto da broji.
-- security_invoker: pogled poštuje RLS onoga ko ga čita, a ne vlasnika.
drop view if exists public.product_key_stock;
create view public.product_key_stock
with (security_invoker = true) as
select
  p.id   as product_id,
  p.name,
  p.slug,
  count(*) filter (where k.status = 'available') as available,
  count(*) filter (where k.status = 'sold')      as sold,
  count(*) filter (where k.status = 'void')      as void
from public.products p
left join public.product_keys k on k.product_id = p.id
where p.shop = 'digital'
group by p.id, p.name, p.slug;


-- ============================================================================
-- 9. PORUDŽBINE
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'payment_method') then
    create type public.payment_method as enum ('card', 'cod', 'bank');
  end if;

  -- Statusi tačno onako kako se vode: Nova, Potvrđena, Poslata, Preuzeta.
  -- 'cancelled' nije bio tražen ali mora da postoji — bez njega otkazana
  -- porudžbina zauvek stoji kao aktivna i roba se ne vraća na lager.
  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type public.order_status as enum
      ('new', 'confirmed', 'shipped', 'picked_up', 'cancelled');
  end if;

  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type public.payment_status as enum ('unpaid', 'paid', 'failed', 'refunded');
  end if;
end
$$;

-- Ako tip postoji od ranije sa starim vrednostima, dopunjavamo ga.
alter type public.order_status add value if not exists 'new';
alter type public.order_status add value if not exists 'confirmed';
alter type public.order_status add value if not exists 'shipped';
alter type public.order_status add value if not exists 'picked_up';
alter type public.order_status add value if not exists 'cancelled';

create table if not exists public.orders (
  id             uuid primary key default gen_random_uuid(),
  -- Broj koji kupac vidi i navodi u prepisci. Generiše ga funkcija.
  order_number   text not null unique,

  -- Kupac. `customer_id` je prazan kod kupovine bez naloga; porudžbina se
  -- tada i dalje pojavi u profilu, ako se imejl poklopi (vidi pravilo dole).
  customer_id    uuid references public.customers(id) on delete set null,
  email          text not null,
  first_name     text not null,
  last_name      text not null,
  phone          text,

  -- Adresa; kod čisto digitalne porudžbine ostaje prazna.
  address_line   text,
  city           text,
  postcode       text,
  country        text not null default 'RS',
  notes          text,

  -- Da li porudžbina ide u „Porudžbine" ili u „Digitalna prodaja".
  kind           public.shop_kind not null default 'merch',

  -- Novac. Valuta se bira po zemlji kupca i ne menja se posle.
  currency       text not null default 'RSD' references public.currencies(code),
  subtotal       int  not null check (subtotal >= 0),
  shipping_cost  int  not null default 0 check (shipping_cost >= 0),
  discount       int  not null default 0 check (discount >= 0),
  total          int  not null check (total >= 0),

  payment_method public.payment_method not null,
  payment_status public.payment_status not null default 'unpaid',
  status         public.order_status   not null default 'new',

  -- Popunjava se kada dođe kartično plaćanje; sada stoji prazno.
  payment_ref    text,

  shipping_method text,
  tracking_number text,
  tracking_url    text,
  shipped_at      timestamptz,

  -- Da li je potvrda otišla; sprečava dupli mejl pri ponovnom pokušaju.
  email_sent_at  timestamptz,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.orders add column if not exists customer_id uuid references public.customers(id) on delete set null;
alter table public.orders add column if not exists kind        public.shop_kind not null default 'merch';

create index if not exists orders_email_idx    on public.orders (lower(email));
create index if not exists orders_customer_idx on public.orders (customer_id, created_at desc);
create index if not exists orders_created_idx  on public.orders (created_at desc);
create index if not exists orders_status_idx   on public.orders (status);
create index if not exists orders_kind_idx     on public.orders (kind, created_at desc);

drop trigger if exists trg_orders_touch on public.orders;
create trigger trg_orders_touch
  before update on public.orders
  for each row execute function public.touch_updated_at();


-- ----------------------------------------------------------------------------
-- Stavke porudžbine
-- ----------------------------------------------------------------------------
-- Naziv i cena se PREPISUJU u stavku, ne čitaju kroz vezu na proizvod. Ako
-- sutra promeniš cenu ili naziv, stara porudžbina mora da ostane onakva kakva
-- je bila kada je kupac poručio.
-- ----------------------------------------------------------------------------

create table if not exists public.order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  product_id  text references public.products(id) on delete set null,
  name        text not null,
  variant     text,
  unit_price  int  not null check (unit_price >= 0),
  quantity    int  not null check (quantity > 0),
  line_total  int  not null check (line_total >= 0),
  fulfillment public.fulfillment_type not null default 'physical',
  created_at  timestamptz not null default now()
);

create index if not exists order_items_order_idx on public.order_items (order_id);

-- Veze kodova na porudžbinu se dodaju tek sada, kada obe tabele postoje.
alter table public.product_keys drop constraint if exists product_keys_order_fk;
alter table public.product_keys add constraint product_keys_order_fk
  foreign key (order_id) references public.orders(id) on delete set null;

alter table public.product_keys drop constraint if exists product_keys_order_item_fk;
alter table public.product_keys add constraint product_keys_order_item_fk
  foreign key (order_item_id) references public.order_items(id) on delete set null;


-- ----------------------------------------------------------------------------
-- Istorija statusa — ko je šta menjao i kada
-- ----------------------------------------------------------------------------

create table if not exists public.order_events (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  from_status text,
  to_status   text not null,
  note        text,
  created_at  timestamptz not null default now()
);

create index if not exists order_events_order_idx on public.order_events (order_id, created_at);


-- ----------------------------------------------------------------------------
-- Broj porudžbine
-- ----------------------------------------------------------------------------
-- Niz po godini: CW-2026-0001. Čitljiviji je kupcu od uuid-a, a niz garantuje
-- da se ne ponovi — nasumičan broj bi se pre ili kasnije sudario.
-- ----------------------------------------------------------------------------

create sequence if not exists public.order_number_seq;

create or replace function public.next_order_number()
returns text
language plpgsql
as $$
declare
  n bigint;
begin
  select nextval('public.order_number_seq') into n;
  return 'CW-' || to_char(now(), 'YYYY') || '-' || lpad(n::text, 4, '0');
end;
$$;


-- ============================================================================
-- 10. LAGER I DODELA KODOVA
-- ============================================================================

-- Skidanje sa lagera u JEDNOJ naredbi, sa uslovom na količinu. Ako dva kupca
-- istovremeno uzmu poslednji komad, drugi ne prođe — provera i upis su isti
-- korak, pa nema procepa između njih.
create or replace function public.reserve_stock(p_product_id text, p_qty int)
returns boolean
language plpgsql
as $$
declare
  updated int;
begin
  update public.products
     set stock = case when track_stock then stock - p_qty else stock end
   where id = p_product_id
     and (track_stock = false or stock >= p_qty);

  get diagnostics updated = row_count;
  return updated > 0;
end;
$$;

-- Vraćanje na lager kada se porudžbina otkaže.
create or replace function public.release_stock(p_order_id uuid)
returns void
language plpgsql
as $$
begin
  update public.products p
     set stock = p.stock + oi.quantity
    from public.order_items oi
   where oi.order_id = p_order_id
     and oi.product_id = p.id
     and p.track_stock;
end;
$$;


-- ----------------------------------------------------------------------------
-- Dodela Steam kodova
-- ----------------------------------------------------------------------------
-- Poziva se kad porudžbina bude plaćena. Za svaku digitalnu stavku uzima
-- onoliko slobodnih kodova kolika je količina i označava ih kao prodate.
--
-- `for update skip locked` je ovde srž: red koji je drugi zahtev već zaključao
-- se PRESKAČE umesto da se čeka. Dva kupca koji u istoj sekundi kupe istu igru
-- tako dobiju različite kodove — bez toga bi oba pročitala isti slobodan red.
--
-- Vraća broj dodeljenih kodova. Ako ih nema dovoljno, dodeljuje koliko ima i
-- vraća manji broj — porudžbina se NE ruši, nego se u panelu vidi da nedostaje.
-- ----------------------------------------------------------------------------
create or replace function public.assign_keys(p_order_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  it       record;
  assigned int := 0;
  taken    int;
begin
  for it in
    select oi.id, oi.product_id, oi.quantity
      from public.order_items oi
     where oi.order_id = p_order_id
       and oi.fulfillment = 'digital'
       and oi.product_id is not null
  loop
    with slobodni as (
      select k.id
        from public.product_keys k
       where k.product_id = it.product_id
         and k.status = 'available'
       order by k.created_at
       limit it.quantity
       for update skip locked
    )
    update public.product_keys k
       set status        = 'sold',
           order_id      = p_order_id,
           order_item_id = it.id,
           sold_at       = now()
      from slobodni s
     where k.id = s.id;

    get diagnostics taken = row_count;
    assigned := assigned + taken;
  end loop;

  return assigned;
end;
$$;

-- Svaka promena statusa se sama upisuje u istoriju — da se ne oslanjamo na to
-- da panel to uradi svaki put.
create or replace function public.log_order_status()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status then
    insert into public.order_events (order_id, from_status, to_status)
    values (new.id, old.status::text, new.status::text);

    -- Otkazivanje vraća robu na lager i oslobađa kodove.
    if new.status = 'cancelled' and old.status <> 'cancelled' then
      perform public.release_stock(new.id);

      update public.product_keys
         set status = 'available', order_id = null, order_item_id = null, sold_at = null
       where order_id = new.id and status = 'sold';
    end if;

    -- Poslata roba dobija vreme slanja, da se ne kuca ručno.
    if new.status = 'shipped' and new.shipped_at is null then
      new.shipped_at = now();
    end if;
  end if;
  return new;
end;
$$;

-- BEFORE, ne AFTER: okidač menja `new.shipped_at`, a to posle upisa nema
-- efekta. Sve što dira sopstveni red mora da bude BEFORE.
drop trigger if exists trg_orders_log_status on public.orders;
create trigger trg_orders_log_status
  before update on public.orders
  for each row execute function public.log_order_status();


-- ----------------------------------------------------------------------------
-- Pregled digitalne prodaje
-- ----------------------------------------------------------------------------
-- Digitalni proizvodi nemaju statuse — samo se vidi šta je prodato i koji je
-- kod otišao. Ovo je taj pregled, spreman za panel.
-- ----------------------------------------------------------------------------
drop view if exists public.digital_sales;
create view public.digital_sales
with (security_invoker = true) as
select
  o.id            as order_id,
  o.order_number,
  o.created_at,
  o.email,
  o.first_name,
  o.last_name,
  o.currency,
  o.payment_method,
  o.payment_status,
  oi.id           as item_id,
  oi.product_id,
  oi.name         as product_name,
  oi.quantity,
  oi.unit_price,
  oi.line_total,
  (select count(*) from public.product_keys k where k.order_item_id = oi.id) as keys_delivered,
  (select string_agg(k.code, ', ' order by k.created_at)
     from public.product_keys k where k.order_item_id = oi.id)               as keys_codes
from public.order_items oi
join public.orders o on o.id = oi.order_id
where oi.fulfillment = 'digital';


-- ============================================================================
-- 11. PODEŠAVANJA
-- ----------------------------------------------------------------------------
-- Ključ/vrednost umesto kolone po podešavanju — dodavanje novog podešavanja
-- ne traži izmenu šeme.
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
-- 12. BEZBEDNOST (RLS)
-- ----------------------------------------------------------------------------
-- Anon ključ stoji u frontendu i svako ga može pročitati. Zaštita nije u
-- tajnosti ključa nego OVDE.
--
-- Tri uloge:
--   anon           — posetilac: čita objavljeno i aktivno, ne piše ništa
--   authenticated  — KUPAC: uz to vidi i menja SVOJ profil i SVOJE porudžbine
--   is_admin()     — ti: sve
--
-- Razlika između druge i treće je cela poenta ovog odeljka. Bez nje bi svaki
-- registrovani kupac mogao da obriše ceo shop.
-- ============================================================================

alter table public.admins         enable row level security;
alter table public.customers      enable row level security;
alter table public.posts          enable row level security;
alter table public.post_categories enable row level security;
alter table public.products       enable row level security;
alter table public.shop_categories enable row level security;
alter table public.product_keys   enable row level security;
alter table public.orders         enable row level security;
alter table public.order_items    enable row level security;
alter table public.order_events   enable row level security;
alter table public.settings       enable row level security;
alter table public.currencies     enable row level security;


-- ---- ADMINI ----
-- Čitanje samo svog reda. Spisak admina nije javan podatak.
drop policy if exists "admini: vidi sebe" on public.admins;
create policy "admini: vidi sebe"
  on public.admins for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- Dodavanje admina ide ISKLJUČIVO kroz SQL Editor (service role zaobilazi
-- RLS). Namerno nema pravila za insert — inače bi prvi admin mogao tiho da
-- doda drugog, a to je odluka koja treba da ostavi trag.


-- ---- KUPCI ----
drop policy if exists "kupci: vidi svoj profil" on public.customers;
create policy "kupci: vidi svoj profil"
  on public.customers for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists "kupci: menja svoj profil" on public.customers;
create policy "kupci: menja svoj profil"
  on public.customers for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Insert nema: profil pravi okidač pri registraciji.


-- ---- OBJAVE ----
-- `is_admin()` umesto ranijeg `auth.role() = 'authenticated'`: nacrte sme da
-- vidi admin, a ne svaki prijavljen kupac.
drop policy if exists "objave: javno čitanje objavljenih" on public.posts;
create policy "objave: javno čitanje objavljenih"
  on public.posts for select to anon, authenticated
  using (status = 'published' or public.is_admin());

drop policy if exists "objave: upis samo prijavljenima" on public.posts;
drop policy if exists "objave: upis samo admin" on public.posts;
create policy "objave: upis samo admin"
  on public.posts for all to authenticated
  using (public.is_admin()) with check (public.is_admin());


-- ---- RUBRIKE ----
drop policy if exists "rubrike: javno čitanje" on public.post_categories;
create policy "rubrike: javno čitanje"
  on public.post_categories for select to anon, authenticated using (true);

drop policy if exists "rubrike: upis samo prijavljenima" on public.post_categories;
drop policy if exists "rubrike: upis samo admin" on public.post_categories;
create policy "rubrike: upis samo admin"
  on public.post_categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());


-- ---- PROIZVODI ----
drop policy if exists "proizvodi: javno čitanje aktivnih" on public.products;
create policy "proizvodi: javno čitanje aktivnih"
  on public.products for select to anon, authenticated
  using (is_active = true or public.is_admin());

drop policy if exists "proizvodi: upis samo prijavljenima" on public.products;
drop policy if exists "proizvodi: upis samo admin" on public.products;
create policy "proizvodi: upis samo admin"
  on public.products for all to authenticated
  using (public.is_admin()) with check (public.is_admin());


-- ---- KATEGORIJE SHOPA ----
drop policy if exists "kategorije: javno čitanje" on public.shop_categories;
create policy "kategorije: javno čitanje"
  on public.shop_categories for select to anon, authenticated using (true);

drop policy if exists "kategorije: upis samo prijavljenima" on public.shop_categories;
drop policy if exists "kategorije: upis samo admin" on public.shop_categories;
create policy "kategorije: upis samo admin"
  on public.shop_categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());


-- ---- STEAM KODOVI ----
-- NEMA pravila za anon i NEMA za običnog kupca. Kod je roba: ko ga pročita,
-- ima ga. Kupac svoj kod dobija mejlom i kroz pogled na svoju porudžbinu,
-- nikad direktnim čitanjem ove tabele.
drop policy if exists "kodovi: samo admin" on public.product_keys;
create policy "kodovi: samo admin"
  on public.product_keys for all to authenticated
  using (public.is_admin()) with check (public.is_admin());


-- ---- PORUDŽBINE ----
-- Kupac vidi svoje: one vezane za njegov nalog, ili one poručene bez naloga
-- sa istim imejlom. Drugi uslov je razlog što porudžbina napravljena pre
-- registracije ipak osvane u profilu.
drop policy if exists "porudzbine: admin cita" on public.orders;
drop policy if exists "porudzbine: kupac vidi svoje" on public.orders;
create policy "porudzbine: kupac vidi svoje"
  on public.orders for select to authenticated
  using (
    public.is_admin()
    or customer_id = auth.uid()
    or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

drop policy if exists "porudzbine: admin menja" on public.orders;
create policy "porudzbine: admin menja"
  on public.orders for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Insert nema ni za koga: porudžbinu upisuje Edge funkcija service role
-- ključem. Da pregledač sme da upisuje, svako bi mogao da naruči duks za
-- jedan dinar.

drop policy if exists "stavke: admin cita" on public.order_items;
drop policy if exists "stavke: kupac vidi svoje" on public.order_items;
create policy "stavke: kupac vidi svoje"
  on public.order_items for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.orders o
       where o.id = order_items.order_id
         and (o.customer_id = auth.uid()
              or lower(o.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
    )
  );

drop policy if exists "dogadjaji: admin cita" on public.order_events;
create policy "dogadjaji: admin cita"
  on public.order_events for select to authenticated using (public.is_admin());

drop policy if exists "dogadjaji: admin upisuje" on public.order_events;
create policy "dogadjaji: admin upisuje"
  on public.order_events for insert to authenticated with check (public.is_admin());


-- ---- VALUTE ----
drop policy if exists "valute: javno čitanje" on public.currencies;
create policy "valute: javno čitanje"
  on public.currencies for select to anon, authenticated using (true);

drop policy if exists "valute: upis samo prijavljenima" on public.currencies;
drop policy if exists "valute: upis samo admin" on public.currencies;
create policy "valute: upis samo admin"
  on public.currencies for all to authenticated
  using (public.is_admin()) with check (public.is_admin());


-- ---- PODEŠAVANJA ----
drop policy if exists "podesavanja: javno čitanje" on public.settings;
create policy "podesavanja: javno čitanje"
  on public.settings for select to anon, authenticated using (true);

drop policy if exists "podesavanja: upis samo prijavljenima" on public.settings;
drop policy if exists "podesavanja: upis samo admin" on public.settings;
create policy "podesavanja: upis samo admin"
  on public.settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());


-- ============================================================================
-- 13. SKLADIŠTE SLIKA
-- ----------------------------------------------------------------------------
-- Bucket "media" je javan za čitanje (slike se prikazuju na sajtu), a
-- otpremanje i brisanje sme samo admin — ne svaki prijavljen kupac.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

drop policy if exists "media: javno čitanje" on storage.objects;
create policy "media: javno čitanje"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'media');

drop policy if exists "media: otpremanje samo prijavljenima" on storage.objects;
drop policy if exists "media: otpremanje samo admin" on storage.objects;
create policy "media: otpremanje samo admin"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_admin());

drop policy if exists "media: izmena samo prijavljenima" on storage.objects;
drop policy if exists "media: izmena samo admin" on storage.objects;
create policy "media: izmena samo admin"
  on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_admin());

drop policy if exists "media: brisanje samo prijavljenima" on storage.objects;
drop policy if exists "media: brisanje samo admin" on storage.objects;
create policy "media: brisanje samo admin"
  on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_admin());


-- ============================================================================
-- 14. POČETNI SADRŽAJ
-- ----------------------------------------------------------------------------
-- Isto ono što sajt sada prikazuje, da baza od prvog trenutka nije prazna.
-- ON CONFLICT DO NOTHING znači da ponovno pokretanje neće pregaziti izmene
-- koje si u međuvremenu napravio kroz panel.
-- ============================================================================

insert into public.post_categories (id, name, slug, sort_order) values
  ('objave',    'Objave',    'objave',    0),
  ('shop',      'Shop',      'shop',      1),
  ('wolfpack',  'Wolfpack Store', 'wolfpack', 2),
  ('zajednica', 'Zajednica', 'zajednica', 3),
  ('partneri',  'Partneri',  'partneri',  4),
  ('usluge',    'Usluge',    'usluge',    5)
on conflict (id) do nothing;

-- Kurs je samo rezerva za slučaj da proizvod nema upisanu cenu u evrima.
insert into public.currencies
  (code, name, symbol, symbol_after, decimals, minor_units, rate_from_rsd, is_default, sort_order)
values
  ('RSD', 'Srpski dinar', 'RSD', true,  2, 100, 1.0,      true,  0),
  ('EUR', 'Evro',         '€',   false, 2, 100, 0.008547, false, 1)
on conflict (code) do nothing;

-- --- MERCH SHOP ---
insert into public.shop_categories (id, name, slug, shop, icon, blurb, sort_order) values
  ('drinkware',   'Šolje',  'solje',  'merch', 'mug',     'Keramika sa zvaničnim grbom.',   0),
  ('apparel',     'Odeća',  'odeca',  'merch', 'shirt',   'Majice i duksevi. U pripremi.',  1),
  ('accessories', 'Dodaci', 'dodaci', 'merch', 'sticker', 'Stikeri, podloge i sitnice.',    2)
on conflict (id) do update set shop = excluded.shop;

-- --- WOLFPACK STORE (digitalno) ---
insert into public.shop_categories (id, name, slug, shop, icon, blurb, sort_order) values
  ('games',         'Igre',           'igre',           'digital', 'monitor', 'Steam, Epic i konzolni ključevi.', 10),
  ('gift-cards',    'Gift kartice',   'gift-kartice',   'digital', 'gift',    'Steam, PSN, Xbox i Google Play.',  11),
  ('subscriptions', 'Pretplate',      'pretplate',      'digital', 'card',    'Game Pass, PS Plus, Discord Nitro.', 12),
  ('topup',         'Dopune',         'dopune',         'digital', 'zap',     'In-game valuta i dopune naloga.',  13)
on conflict (id) do update set shop = excluded.shop;

-- Cene u evrima su zaokružene na lepe iznose, a ne bukvalno preračunate
-- (1.490 RSD po kursu daje 12,73 € — na sajtu stoji 12,90 €).
insert into public.products
  (id, name, slug, category_id, shop, price, price_eur, short_desc, image,
   stock_status, stock, is_active, sort_order,
   fulfillment, allow_cod, track_stock)
values
  ('solja-zvanicna', 'Zvanična CrazyWolves šolja', 'zvanicna-solja', 'drinkware', 'merch',
   149000, 1290,
   'Keramička šolja sa zvaničnim grbom. Limitirano izdanje.',
   'product-mug', 'in_stock', 25, true, 0,
   'physical', true, true),

  ('majica-grb', 'Majica sa grbom', 'majica-grb', 'apparel', 'merch',
   249000, 2190,
   'Majica sa zvaničnim grbom na grudima. U pripremi.',
   'sablon-proizvod-2', 'coming_soon', 0, false, 1,
   'physical', true, true),

  ('duks-grb', 'Duks sa grbom', 'duks-grb', 'apparel', 'merch',
   549000, 4790,
   'Duks sa vezenim grbom. U pripremi.',
   'sablon-proizvod-2', 'coming_soon', 0, false, 2,
   'physical', true, true),

  ('stikeri', 'Set stikera', 'set-stikera', 'accessories', 'merch',
   59000, 490,
   'Die-cut stikeri sa grbom i wordmarkom. U pripremi.',
   'sablon-proizvod-2', 'coming_soon', 0, false, 3,
   'physical', true, true)
on conflict (id) do nothing;

-- Primer digitalnog proizvoda. Obriši ga kad uneseš prave.
-- Zaliha mu NIJE `stock` nego broj slobodnih kodova u product_keys.
insert into public.products
  (id, name, slug, category_id, shop, price, price_eur, short_desc, description, image,
   stock_status, stock, is_active, sort_order,
   fulfillment, allow_cod, track_stock, auto_delivery)
values
  ('primer-steam-kljuc', 'Primer — Steam ključ', 'primer-steam-kljuc', 'games', 'digital',
   199000, 1690,
   'Primer digitalnog proizvoda. Kod stiže mejlom odmah po uplati.',
   E'Ovo je primer, da vidiš kako izgleda digitalni proizvod.\n\n'
   'Proizvod se unosi jednom. Posle toga se u panelu samo dosipaju kodovi — '
   'sajt sam bira prvi slobodan i šalje ga kupcu.\n\n'
   'Kad uneseš prave proizvode, ovaj obriši.',
   'product-wolfpack', 'in_stock', 0, true, 0,
   'digital', false, false, true)
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
   'banner-nova-era', 'objave', 'published', true,
   array['discord','najava'], now() - interval '9 days'),

  ('sajt-u-izradi', 'Web sajt je u izradi', 'web-sajt-u-izradi',
   'CrazyWolves dobija svoj dom na internetu. Ovo je prva faza.',
   E'CrazyWolves dobija svoj dom na internetu.\n\n'
   'Prva faza donosi zvanični shop, Wolfpack Store i blog. Sve ostalo stiže kasnije.',
   'banner-construction-sr', 'objave', 'published', false,
   array['sajt'], now() - interval '4 days'),

  ('wolfpack-store', 'Otvaramo Wolfpack Store', 'wolfpack-store',
   'Digitalna prodavnica: igre, gift kartice, ključevi i pretplate — na jednom mestu.',
   E'Wolfpack Store je zvanična digitalna prodavnica CrazyWolves zajednice.\n\n'
   '## Šta se prodaje\n\n'
   '- Steam, Epic i konzolni ključevi\n'
   '- Gift kartice: Steam, PSN, Xbox, Google Play\n'
   '- Pretplate: Game Pass, PS Plus, Discord Nitro\n'
   '- Dopune naloga i in-game valuta\n\n'
   '> Kod stiže mejlom odmah po uplati.',
   'banner-wolfpack-store', 'wolfpack', 'published', false,
   array['wolfpack','digitalno'], now() - interval '2 days'),

  ('partnerstvo-wolf3tv', 'Zvanična saradnja sa WOLF3TV', 'saradnja-wolf3tv',
   'Zajednički sadržaj, gostovanja i uzajamna podrška.',
   E'Potpisali smo zvaničnu saradnju sa streamerom WOLF3TV.\n\n'
   '## Šta to znači\n\n'
   '- Zajednički stream sadržaj\n'
   '- Gostovanja na oba kanala\n'
   '- Uzajamna podrška zajednica',
   'banner-saradnja-wolf3tv', 'partneri', 'published', false,
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
  ('default_currency',       'RSD'),
  -- Kome stiže kopija svake porudžbine. UPIŠI SVOJ MEJL.
  ('order_email_to',   'crazywolves.shop@gmail.com'),
  ('order_email_from', 'CrazyWolves <onboarding@resend.dev>'),
  ('shop_open',        'true'),
  ('wolfpack_open',    'true')
on conflict (key) do nothing;


-- ============================================================================
-- 15. PROVERA
-- ----------------------------------------------------------------------------
-- Treba da izađe po jedan red za svaku tabelu, svi sa rls_ukljucen = true.
-- Ako je ijedan false, stani i javi — to znači da su podaci otvoreni.
-- ============================================================================

select
  c.relname                                       as tabela,
  c.relrowsecurity                                as rls_ukljucen,
  (select count(*) from pg_policies p
     where p.schemaname = 'public' and p.tablename = c.relname) as broj_pravila
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'admins','customers','posts','post_categories','products','shop_categories',
    'product_keys','orders','order_items','order_events','settings','currencies'
  )
order by c.relname;


-- ============================================================================
-- 16. POSLEDNJI KORAK — BEZ OVOGA NE MOŽEŠ U PANEL
-- ----------------------------------------------------------------------------
-- 1) Napravi sebi nalog:
--       Authentication → Users → Add user → Create new user
--       ostavi „Auto Confirm User" UKLJUČENO
--
-- 2) Pokreni ovo, sa SVOJIM mejlom umesto onog dole:
--
--       insert into public.admins (user_id, email)
--       select id, email from auth.users where email = 'tvoj@mejl.com'
--       on conflict (user_id) do nothing;
--
-- 3) Proveri da je prošlo:
--
--       select * from public.admins;
--
--    Ako je tabela prazna, panel će te pustiti da se prijaviš ali nećeš moći
--    ništa da sačuvaš — RLS će odbiti svaki upis.
--
-- Svaki sledeći nalog koji se registruje kroz sajt je KUPAC, ne admin.
-- ============================================================================
