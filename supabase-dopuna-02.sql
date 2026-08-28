-- ============================================================================
--  CRAZYWOLVES — DOPUNA 02
--  ---------------------------------------------------------------------------
--  Pokreni POSLE supabase-postavka.sql i supabase-dopuna-01.sql, u istom
--  SQL Editoru. Sme da se pokrene više puta.
--
--  Dodaje objavama DRUGU sliku — za mobilni. Izvorne slike (baneri, najave)
--  često dolaze u dva različita formata: položen za PC, uspravan za telefon.
--  Dosad je objava imala samo `image`, pa je na mobilnom ili stajala ista
--  položena slika smanjena (tekst na njoj postane sitan), ili se ništa nije
--  moglo uraditi povodom toga.
--
--  `image_mobile` je NULL-abilna — stara objava bez mobilne slike i dalje
--  radi, sajt tad prikazuje `image` na svim širinama, kao i do sada.
-- ============================================================================

alter table public.posts add column if not exists image_mobile     text;
alter table public.posts add column if not exists image_mobile_alt text;


-- ============================================================================
-- PROVERA
-- ----------------------------------------------------------------------------
-- Treba da izađu obe nove kolone, tipa text, nullable.
-- ============================================================================

select column_name, data_type, is_nullable
  from information_schema.columns
 where table_schema = 'public' and table_name = 'posts'
   and column_name in ('image_mobile', 'image_mobile_alt')
 order by column_name;
