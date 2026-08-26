-- ============================================================================
--  CRAZYWOLVES — PROVERA I DODAVANJE ADMINA
--  ---------------------------------------------------------------------------
--  Pokreni u Supabase → SQL Editor kad se neko ne može prijaviti u panel.
--  Sme da se pokrene više puta.
--
--  UPIŠI SVOJ MEJL NA JEDNOM MESTU, u prvom redu ispod.
-- ============================================================================

-- >>>>>>>>>>>>>>>>>>>>  OVDE UPIŠI MEJL  <<<<<<<<<<<<<<<<<<<<
--  (zameni samo tekst između navodnika, ostalo ne diraj)

drop table if exists _ja;
create temporary table _ja as select 'wolf3tv@gmail.com'::text as mejl;


-- ============================================================================
-- 1. DIJAGNOZA — šta baza zna o tom nalogu
-- ----------------------------------------------------------------------------
-- Pročitaj tabelu koja izađe. Kolona `sta_je_problem` kaže šta dalje.
-- ============================================================================

select
  j.mejl,
  u.id                                          as user_id,
  (u.id is not null)                            as nalog_postoji,
  (u.email_confirmed_at is not null)            as mejl_potvrdjen,
  (a.user_id is not null)                       as je_admin,
  u.created_at                                  as nalog_napravljen,
  case
    when u.id is null
      then 'NALOG NE POSTOJI → Authentication → Users → Add user'
    when u.email_confirmed_at is null
      then 'MEJL NIJE POTVRDJEN → odeljak 2 ovog fajla to rešava'
    when a.user_id is null
      then 'NIJE ADMIN → odeljak 3 ovog fajla to rešava'
    else 'SVE JE U REDU — ako se i dalje ne prijavljuje, lozinka je pogrešna'
  end                                           as sta_je_problem
from _ja j
left join auth.users   u on lower(u.email) = lower(j.mejl)
left join public.admins a on a.user_id = u.id;


-- ============================================================================
-- 2. POTVRDA MEJLA
-- ----------------------------------------------------------------------------
-- Projekat traži potvrdu mejlom. Nalog napravljen kroz „Add user" bez
-- uključenog „Auto Confirm User" ostaje nepotvrđen i prijava mu ne prolazi.
-- Ovo ga potvrđuje ručno.
-- ============================================================================

update auth.users u
   set email_confirmed_at = coalesce(u.email_confirmed_at, now())
  from _ja j
 where lower(u.email) = lower(j.mejl);


-- ============================================================================
-- 3. UPIS U ADMINE
-- ----------------------------------------------------------------------------
-- Bez reda u ovoj tabeli, nalog je običan KUPAC: prijaviće se, videće shop i
-- svoje porudžbine, ali mu RLS neće dozvoliti nijednu izmenu. Panel se otvori,
-- a ništa ne može da se sačuva.
-- ============================================================================

insert into public.admins (user_id, email, note)
select u.id, u.email, 'dodat kroz supabase-admin.sql'
  from auth.users u, _ja j
 where lower(u.email) = lower(j.mejl)
on conflict (user_id) do nothing;


-- ============================================================================
-- 4. PROVERA POSLE POPRAVKE
-- ----------------------------------------------------------------------------
-- Treba da izađe red sa `mejl_potvrdjen = true` i `je_admin = true`.
-- ============================================================================

select
  u.email,
  (u.email_confirmed_at is not null) as mejl_potvrdjen,
  (a.user_id is not null)            as je_admin
from auth.users u
left join public.admins a on a.user_id = u.id
where lower(u.email) in (select lower(mejl) from _ja);


-- ============================================================================
-- 5. SVI ADMINI — ko sve može u panel
-- ============================================================================

select a.email, a.note, a.created_at
  from public.admins a
 order by a.created_at;


-- ============================================================================
--  AKO PRIJAVA I DALJE NE PROLAZI
--  ---------------------------------------------------------------------------
--  Onda je lozinka pogrešna. Lozinka se NE menja odavde — menja se u:
--
--    Authentication → Users → klik na korisnika → Reset password
--
--  Napomena: lozinka mora imati najmanje 6 znakova.
--
--  ---------------------------------------------------------------------------
--  DA ODUZMEŠ NEKOME PRAVA
--
--    delete from public.admins where email = 'nekome@mejl.com';
--
--  Nalog ostaje i dalje radi — samo postaje običan kupac.
-- ============================================================================
