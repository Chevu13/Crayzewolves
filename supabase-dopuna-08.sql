-- ============================================================================
--  WOLFPACK — DOPUNA 08: PREGLED NALOGA U PANELU
--  ---------------------------------------------------------------------------
--  Pokreni u Supabase → SQL Editor. Sme da se pokrene više puta.
--
--  ---------------------------------------------------------------------------
--  ZAŠTO
--
--  Panel je o kupcima znao samo ono što stoji u `customers` — ime, mejl,
--  adresu. Ko se kad poslednji put prijavio i da li se prijavljuje preko
--  Google-a ili lozinkom, piše u `auth.users`, a toj tabeli se iz pregledača
--  ne pristupa (i ne treba — tamo su i heševi lozinki).
--
--  Ovaj pogled spaja ono što panelu treba i NIŠTA više. Sam proverava da je
--  pozivalac admin, pa običan kupac kroz njega ne vidi tuđe naloge.
-- ============================================================================

drop view if exists public.customer_accounts;

create view public.customer_accounts
with (security_invoker = false) as
select
  c.id,
  c.email,
  c.first_name,
  c.last_name,
  c.phone,
  c.city,
  c.marketing_ok,
  c.created_at,
  u.last_sign_in_at,
  u.email_confirmed_at is not null                      as email_confirmed,
  coalesce(u.raw_app_meta_data ->> 'provider', 'email') as provider,
  exists (select 1 from public.admins a where a.user_id = c.id) as is_admin,
  (select count(*) from public.orders o
    where o.customer_id = c.id
       or lower(o.email) = lower(c.email))              as orders_count,
  (select coalesce(sum(o.total), 0) from public.orders o
    where (o.customer_id = c.id or lower(o.email) = lower(c.email))
      and o.currency = 'RSD'
      and o.status <> 'cancelled')                      as spent_rsd
from public.customers c
join auth.users u on u.id = c.id
where public.is_admin();

revoke all on public.customer_accounts from anon;
grant select on public.customer_accounts to authenticated;


-- ============================================================================
-- PROVERA
-- ============================================================================

select email, first_name, last_name, provider, orders_count, last_sign_in_at
  from public.customer_accounts
 order by created_at desc;
