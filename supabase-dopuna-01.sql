-- ============================================================================
--  CRAZYWOLVES — DOPUNA 01
--  ---------------------------------------------------------------------------
--  Pokreni POSLE supabase-postavka.sql, u istom SQL Editoru.
--  Sme da se pokrene više puta.
--
--  Rešava tri stvari koje su se videle tek kad je sajt povezan na pravu bazu:
--
--   1. Tri merch proizvoda („uskoro") su bila neaktivna, pa ih posetilac
--      uopšte nije video — shop je imao jedan proizvod umesto četiri.
--   2. Digitalni proizvod je pisao „Rasprodato", jer sajt gleda kolonu
--      `stock`, a zaliha digitalnog proizvoda je broj slobodnih kodova.
--   3. Posetilac ne sme da čita `product_keys` (kod je roba), ali sajt mora
--      nekako da zna ima li kodova na stanju.
-- ============================================================================


-- ============================================================================
-- 1. PROIZVODI „USKORO" SE PRIKAZUJU
-- ----------------------------------------------------------------------------
-- `is_active = false` znači „ne postoji za posetioca" i koristi se za
-- proizvod koji si povukao iz prodaje. Za najavu služi `stock_status`, koji
-- ima poseban status `coming_soon` i sajt ga crta kao pločicu „USKORO".
--
-- Ranije su ova tri bila i neaktivna i coming_soon — pa se nisu videla uopšte.
-- ============================================================================

update public.products
   set is_active = true
 where id in ('majica-grb', 'duks-grb', 'stikeri')
   and stock_status = 'coming_soon';


-- ============================================================================
-- 2. ZALIHA DIGITALNOG PROIZVODA = BROJ SLOBODNIH KODOVA
-- ----------------------------------------------------------------------------
-- Posetilac NE SME da vidi `product_keys` — kod je roba, ko ga pročita ima
-- ga. Ali sajt mora da zna da li da nacrta „Dodaj u korpu" ili „Nema na
-- stanju".
--
-- Zato ovaj pogled vraća SAMO BROJ, nikad kod.
--
-- Jedini pogled u celoj bazi koji NIJE `security_invoker`. Namerno: da jeste,
-- čitao bi `product_keys` pravima posetioca, a posetilac tu tabelu ne vidi —
-- pa bi svaki proizvod ispao rasprodat. Ovako pogled broji pravima vlasnika,
-- a napolje pušta samo cifru.
--
-- Ako se ikad doda kolona sa kodom u ovaj pogled, kodovi postaju javni.
-- Ovde ide samo `count`.
-- ============================================================================

drop view if exists public.product_availability;
create view public.product_availability
with (security_invoker = false) as
select
  p.id                                                        as product_id,
  count(k.id) filter (where k.status = 'available')::int       as available
from public.products p
left join public.product_keys k on k.product_id = p.id
where p.shop = 'digital'
  and p.is_active = true
group by p.id;

grant select on public.product_availability to anon, authenticated;


-- ============================================================================
-- 3. PROVERA
-- ----------------------------------------------------------------------------
-- Prvi upit: četiri merch proizvoda, svi aktivni.
-- Drugi upit: digitalni proizvodi i koliko kodova imaju na stanju.
-- ============================================================================

select id, name, shop, is_active, stock_status, stock
  from public.products
 order by shop, sort_order;

select * from public.product_availability;
