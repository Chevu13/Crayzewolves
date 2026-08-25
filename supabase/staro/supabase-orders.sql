-- ============================================================================
-- CRAZYWOLVES — PORUDŽBINE
-- ----------------------------------------------------------------------------
-- Dopuna postojeće šeme. Pokreni posle supabase-schema.sql.
-- Sme da se pokrene više puta.
--
-- IZNOSI SU U NAJMANJOJ JEDINICI: pare za RSD, centi za EUR.
-- ============================================================================


-- ============================================================================
-- 1. NAČIN ISPORUKE PO PROIZVODU
-- ----------------------------------------------------------------------------
-- Steam kodovi i merch se ne isporučuju isto, pa ni ne smeju da se plaćaju
-- isto: kod se šalje odmah, pa pouzeće za njega nema smisla.
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'fulfillment_type') then
    create type public.fulfillment_type as enum ('physical', 'digital');
  end if;
end
$$;

alter table public.products
  add column if not exists fulfillment public.fulfillment_type not null default 'physical';

-- Digitalna roba ne ide pouzećem — nema kurira da naplati kod poslat mejlom.
alter table public.products
  add column if not exists allow_cod boolean not null default true;

alter table public.products drop constraint if exists products_digital_no_cod;
alter table public.products add constraint products_digital_no_cod
  check (fulfillment = 'physical' or allow_cod = false);

update public.products
   set fulfillment = 'digital', allow_cod = false
 where category_id = 'digital' and fulfillment <> 'digital';


-- ============================================================================
-- 2. NAČINI PLAĆANJA
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'payment_method') then
    create type public.payment_method as enum ('card', 'cod', 'bank');
  end if;
  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type public.order_status as enum
      ('pending_payment', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
  end if;
  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type public.payment_status as enum ('unpaid', 'paid', 'failed', 'refunded');
  end if;
end
$$;


-- ============================================================================
-- 3. PORUDŽBINE
-- ============================================================================

create table if not exists public.orders (
  id             uuid primary key default gen_random_uuid(),
  -- Broj koji kupac vidi i navodi u prepisci. Generiše ga funkcija.
  order_number   text not null unique,

  -- Kupac
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

  -- Novac. Valuta se bira po zemlji kupca i ne menja se posle.
  currency       text not null default 'RSD' references public.currencies(code),
  subtotal       int  not null check (subtotal >= 0),
  shipping_cost  int  not null default 0 check (shipping_cost >= 0),
  discount       int  not null default 0 check (discount >= 0),
  total          int  not null check (total >= 0),

  payment_method public.payment_method not null,
  payment_status public.payment_status not null default 'unpaid',
  status         public.order_status   not null default 'pending_payment',

  -- Popunjava se kada dođe kartično plaćanje; sada stoji prazno.
  payment_ref    text,

  shipping_method text,
  -- Da li je potvrda otišla; sprečava dupli mejl pri ponovnom pokušaju.
  email_sent_at  timestamptz,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists orders_email_idx   on public.orders (email);
create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_status_idx  on public.orders (status);

drop trigger if exists trg_orders_touch on public.orders;
create trigger trg_orders_touch
  before update on public.orders
  for each row execute function public.touch_updated_at();


-- ============================================================================
-- 4. STAVKE PORUDŽBINE
-- ----------------------------------------------------------------------------
-- Naziv i cena se PREPISUJU u stavku, ne čitaju kroz vezu na proizvod.
-- Ako sutra promeniš cenu ili naziv, stara porudžbina mora da ostane
-- onakva kakva je bila kada je kupac poručio.
-- ============================================================================

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


-- ============================================================================
-- 5. BEZBEDNOST
-- ----------------------------------------------------------------------------
-- Porudžbine ne pravi pregledač nego Edge funkcija, koja koristi service
-- role ključ i zaobilazi RLS. Zato ovde NEMA pravila za anon: niko sa
-- sajta ne može ni da pročita ni da upiše tuđu porudžbinu.
--
-- Bez ovoga bi svako mogao da pročita imejlove i adrese svih kupaca.
-- ============================================================================

alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

-- Prijavljen korisnik (admin panel) vidi sve.
drop policy if exists "porudzbine: admin cita" on public.orders;
create policy "porudzbine: admin cita"
  on public.orders for select to authenticated using (true);

drop policy if exists "porudzbine: admin menja" on public.orders;
create policy "porudzbine: admin menja"
  on public.orders for update to authenticated using (true) with check (true);

drop policy if exists "stavke: admin cita" on public.order_items;
create policy "stavke: admin cita"
  on public.order_items for select to authenticated using (true);


-- ============================================================================
-- 6. BROJ PORUDŽBINE
-- ----------------------------------------------------------------------------
-- Niz brojeva po godini: CW-2026-0001. Čitljiviji je kupcu od uuid-a,
-- a niz garantuje da se ne ponovi — nasumičan broj bi se pre ili kasnije
-- sudario.
-- ============================================================================

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
-- 7. PODEŠAVANJA VEZANA ZA PORUDŽBINE
-- ============================================================================

insert into public.settings (key, value) values
  ('order_email_to',   'crazywolves.shop@gmail.com'),  -- kopija svake porudžbine tebi
  ('order_email_from', 'CrazyWolves <onboarding@resend.dev>'),
  ('shop_open',        'true')
on conflict (key) do nothing;


-- ============================================================================
-- 8. PROVERA
-- ============================================================================

select
  c.relname as tabela,
  c.relrowsecurity as rls_ukljucen,
  (select count(*) from pg_policies p
     where p.schemaname = 'public' and p.tablename = c.relname) as broj_pravila
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in ('orders', 'order_items')
order by c.relname;
