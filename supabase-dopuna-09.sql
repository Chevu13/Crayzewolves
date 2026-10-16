-- ============================================================================
--  WOLFPACK — DOPUNA 09: MEJLOVI PREKO RESEND-a
--  ---------------------------------------------------------------------------
--  Pokreni u Supabase → SQL Editor. Sme da se pokrene više puta.
--
--  Priprema za Edge funkciju `send-order-email`, koja od sada šalje preko
--  Resend-a sa adrese office@wolfpack.rs:
--
--    1. adrese pošiljaoca i kopije,
--    2. adresa sajta (linkovi u mejlu),
--    3. `welcomed_at` — da pozdravni mejl ode tačno jednom po nalogu.
-- ============================================================================

insert into public.settings (key, value) values
  ('email',            'office@wolfpack.rs'),
  ('order_email_to',   'office@wolfpack.rs'),
  ('order_email_from', 'Wolfpack <office@wolfpack.rs>'),
  -- Linkovi u mejlu vode ovde. Kad domen bude prebačen, menja se samo ovaj red.
  ('site_url',         'https://www.wolfpack.rs/app')
on conflict (key) do update set value = excluded.value;

alter table public.customers
  add column if not exists welcomed_at timestamptz;

comment on column public.customers.welcomed_at is
  'Kad je poslat pozdravni mejl. Postoji da se ne pošalje dvaput.';


-- ============================================================================
-- PROVERA
-- ============================================================================

select key, value from public.settings
 where key in ('email','order_email_to','order_email_from','site_url')
 order by key;
