-- ============================================================================
--  CRAZYWOLVES — DOPUNA 04: KONTAKT ADRESA
--  ---------------------------------------------------------------------------
--  Pokreni u Supabase → SQL Editor. Sme da se pokrene više puta.
--
--  Zašto posebna skripta: seed u supabase-postavka.sql koristi
--  `on conflict (key) do nothing`, pa NE menja redove koji već postoje —
--  namerno, da ponovno pokretanje ne pregazi podešavanja koja si ti menjao
--  kroz panel. Posledica je da se izmena adrese mora upisati ovako.
-- ============================================================================

insert into public.settings (key, value) values
  -- Adresa koju sajt prikazuje posetiocu.
  ('email', 'info.crazywolves@gmail.com'),

  -- Kome ide skrivena kopija svake porudžbine.
  ('order_email_to', 'info.crazywolves@gmail.com'),

  -- Pošiljalac mejla potvrde porudžbine. Mora se poklapati sa SMTP_USER u
  -- tajnama Edge funkcije — Gmail odbija da šalje sa tuđe adrese.
  ('order_email_from', 'CrazyWolves <info.crazywolves@gmail.com>')
on conflict (key) do update set value = excluded.value;


-- ============================================================================
-- PROVERA
-- ============================================================================

select key, value
  from public.settings
 where key in ('email', 'order_email_to', 'order_email_from')
 order by key;
