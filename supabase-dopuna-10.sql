-- ============================================================================
--  WOLFPACK — DOPUNA 10: IZBOR PROIZVODA ZA POČETNU
--  ---------------------------------------------------------------------------
--  Pokreni u Supabase → SQL Editor. Sme da se pokrene više puta.
--
--  Na početnoj, u „Izdvajamo iz shopa", stoje tri proizvoda. Do sada su to
--  bila prva tri iz redosleda u shopu, pa se nisu mogla birati posebno.
--
--  `featured_slot` je mesto na toj polici:
--     0  — ne prikazuje se na početnoj
--     1, 2, 3 — prikazuje se, i to tim redom
--
--  Merch i digitalno imaju svoje tri pozicije, jer prekidač na početnoj
--  bira koju policu posetilac gleda.
-- ============================================================================

alter table public.products
  add column if not exists featured_slot smallint not null default 0;

alter table public.products drop constraint if exists products_featured_slot_ck;
alter table public.products add constraint products_featured_slot_ck
  check (featured_slot between 0 and 3);

comment on column public.products.featured_slot is
  'Mesto na početnoj, u „Izdvajamo iz shopa": 0 = ne prikazuje se, 1–3 = redom.';


-- ============================================================================
-- PROVERA
-- ============================================================================

select name, shop, featured_slot, sort_order
  from public.products
 order by featured_slot = 0, featured_slot, sort_order, name;
