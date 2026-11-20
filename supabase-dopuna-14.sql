-- ============================================================================
--  WOLFPACK — DOPUNA 14: NEWSLETTER
--  ---------------------------------------------------------------------------
--  Pokreni u Supabase → SQL Editor. Sme da se pokrene više puta.
--
--  ---------------------------------------------------------------------------
--  ŠTA RADI
--
--  Do sada forma za newsletter nije radila ništa: sačekala bi 700 milisekundi
--  i ispisala „Prijavljen si". Nijedna adresa nije nigde upisana.
--
--  Ova dopuna pravi tabelu pretplatnika i tri funkcije kroz koje sajt radi
--  sa njom. Tabela se NE čita i NE piše direktno sa sajta — spisak adresa
--  nije nešto što sme da se povuče iz pregledača.
--
--  ---------------------------------------------------------------------------
--  KAKO TEČE PRIJAVA  (dvostruka potvrda)
--
--    1. posetilac upiše adresu     → newsletter_signup()  upiše red „pending"
--    2. sajt zove edge funkciju    → ona pročita token servisnim ključem
--                                     i pošalje mejl sa linkom za potvrdu
--    3. posetilac klikne link      → newsletter_confirm() prebaci u „confirmed"
--
--  Zašto dvostruko: bez potvrde svako može da upiše tuđu adresu. Uz to,
--  potvrđena lista je uslov da mejlovi ne završe u spamu.
--
--  Token se nikada ne vraća pregledaču. Sajt zna samo da je prijava primljena;
--  token čita isključivo edge funkcija, servisnim ključem, da ga pošalje na
--  samu adresu. Zato upis tuđe adrese nikome ništa ne donosi.
--
--  ---------------------------------------------------------------------------
--  ODJAVA
--
--  Isti token nosi i odjavu. Svaki mejl ima link na dnu, odjava je jedan
--  klik i ne traži prijavu na sajt.
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- TABELA
-- ----------------------------------------------------------------------------
create table if not exists public.newsletter_subscribers (
  id              uuid        primary key default gen_random_uuid(),

  -- Adresa se čuva malim slovima: „Pera@Gmail.com" i „pera@gmail.com" su
  -- isti sanduče, a bez ovoga bi stajali kao dva pretplatnika.
  email           text        not null,

  status          text        not null default 'pending'
                              check (status in ('pending', 'confirmed', 'unsubscribed')),

  -- Jedan token po redu nosi i potvrdu i odjavu. To je ključ od TOG reda,
  -- ne od naloga, pa nema šta da otkrije ako procuri iz mejla.
  token           text        not null default encode(extensions.gen_random_bytes(18), 'hex'),

  -- Odakle je stigla prijava (podnožje, blog, kasa…) — da se posle zna šta
  -- donosi pretplatnike.
  source          text,

  -- Kočnica protiv slanja u krug: edge funkcija neće poslati nov mejl
  -- potvrde dok od prethodnog ne prođe nekoliko minuta.
  last_mail_at    timestamptz,

  created_at      timestamptz not null default now(),
  confirmed_at    timestamptz,
  unsubscribed_at timestamptz
);

create unique index if not exists newsletter_subscribers_email_key
  on public.newsletter_subscribers (lower(email));

create index if not exists newsletter_subscribers_status_idx
  on public.newsletter_subscribers (status);

-- ----------------------------------------------------------------------------
-- RLS — spisak vidi samo admin
-- ----------------------------------------------------------------------------
alter table public.newsletter_subscribers enable row level security;

drop policy if exists "newsletter: samo admin" on public.newsletter_subscribers;
create policy "newsletter: samo admin"
  on public.newsletter_subscribers
  for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- Anon namerno nema nijednu politiku: sve ide kroz funkcije ispod.

-- ----------------------------------------------------------------------------
-- PRIJAVA
--
-- Vraća uvek isto, bez obzira na to da li adresa već postoji. Da vraća
-- „već si prijavljen", forma bi postala provera da li neka adresa ima
-- pretplatu — a to nije podatak koji sme da se čita sa ulice.
-- ----------------------------------------------------------------------------
create or replace function public.newsletter_signup(p_email text, p_source text default null)
returns void
language plpgsql
security definer
-- pgcrypto u Supabase sedi u semi `extensions`, pa mora i ona na putanju:
-- bez toga funkcija ne vidi gen_random_bytes i prijava puca na upisu.
set search_path = public, extensions
as $$
declare
  v_email text := lower(trim(p_email));
begin
  if v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$' then
    raise exception 'Neispravna imejl adresa.' using errcode = '22023';
  end if;

  insert into public.newsletter_subscribers (email, source)
  values (v_email, nullif(trim(coalesce(p_source, '')), ''))
  on conflict (lower(email)) do update
    -- Ko se ranije odjavio pa se opet prijavljuje, kreće iz početka: nov
    -- token i nova potvrda. Bez ovoga bi odjavljeni ostao odjavljen zauvek.
    set status = case
                   when newsletter_subscribers.status = 'confirmed' then 'confirmed'
                   else 'pending'
                 end,
        token = case
                  when newsletter_subscribers.status = 'confirmed'
                  then newsletter_subscribers.token
                  else encode(extensions.gen_random_bytes(18), 'hex')
                end,
        unsubscribed_at = null;
end;
$$;

-- ----------------------------------------------------------------------------
-- POTVRDA
-- ----------------------------------------------------------------------------
create or replace function public.newsletter_confirm(p_token text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
begin
  update public.newsletter_subscribers
     set status = 'confirmed',
         confirmed_at = coalesce(confirmed_at, now()),
         unsubscribed_at = null
   where token = p_token
   returning email into v_email;

  if v_email is null then
    raise exception 'Link nije ispravan ili je istekao.' using errcode = '22023';
  end if;

  return v_email;
end;
$$;

-- ----------------------------------------------------------------------------
-- ODJAVA
-- ----------------------------------------------------------------------------
create or replace function public.newsletter_unsubscribe(p_token text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
begin
  update public.newsletter_subscribers
     set status = 'unsubscribed',
         unsubscribed_at = now()
   where token = p_token
   returning email into v_email;

  if v_email is null then
    raise exception 'Link nije ispravan.' using errcode = '22023';
  end if;

  return v_email;
end;
$$;

-- ----------------------------------------------------------------------------
-- PRAVA
--
-- Funkcije su SECURITY DEFINER i rade nad tabelom koju pozivalac ne vidi.
-- Svaka dira tačno jedan red i ne vraća ništa osim adrese koju je pozivalac
-- već znao (iz linka u sopstvenom mejlu).
-- ----------------------------------------------------------------------------
revoke all on function public.newsletter_signup(text, text)      from public;
revoke all on function public.newsletter_confirm(text)           from public;
revoke all on function public.newsletter_unsubscribe(text)       from public;

grant execute on function public.newsletter_signup(text, text)   to anon, authenticated;
grant execute on function public.newsletter_confirm(text)        to anon, authenticated;
grant execute on function public.newsletter_unsubscribe(text)    to anon, authenticated;

-- ----------------------------------------------------------------------------
-- PROVERA
-- ----------------------------------------------------------------------------
do $$
begin
  raise notice 'Newsletter: tabela i funkcije su spremne.';
end;
$$;
