-- ============================================================================
--  CRAZYWOLVES — DOPUNA 05: PRIJAVA PREKO GOOGLE-A
--  ---------------------------------------------------------------------------
--  Pokreni u Supabase → SQL Editor. Sme da se pokrene više puta.
--
--  ---------------------------------------------------------------------------
--  ZAŠTO
--
--  Kad se nalog pravi kroz formu na sajtu, sajt uz registraciju šalje
--  `first_name` i `last_name`, pa ih `handle_new_user()` prepiše u
--  public.customers.
--
--  Google ta ista imena šalje pod svojim nazivima — `given_name`,
--  `family_name`, `name` — pa bi kupac prijavljen Google-om dobio red u
--  customers BEZ imena. Na nalogu i na kasi bi mu stajalo prazno polje, a
--  porudžbina bi tražila da ime upiše ručno.
--
--  Ovde se čitaju oba oblika. Ostalo je isto.
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  m       jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_first text;
  v_last  text;
  v_full  text;
begin
  -- Naša registracija piše first_name/last_name, Google given_name/family_name.
  v_first := nullif(trim(coalesce(m ->> 'first_name',  m ->> 'given_name',  '')), '');
  v_last  := nullif(trim(coalesce(m ->> 'last_name',   m ->> 'family_name', '')), '');

  -- Neki nalozi (npr. Google bez odvojenih polja) daju samo puno ime.
  v_full  := nullif(trim(coalesce(m ->> 'full_name', m ->> 'name', '')), '');
  if v_first is null and v_full is not null then
    v_first := split_part(v_full, ' ', 1);
    if v_last is null then
      v_last := nullif(trim(substr(v_full, length(split_part(v_full, ' ', 1)) + 1)), '');
    end if;
  end if;

  insert into public.customers (id, email, first_name, last_name)
  values (new.id, new.email, v_first, v_last)
  on conflict (id) do nothing;

  return new;
end;
$$;


-- ============================================================================
-- PROVERA — kupci bez imena (posle prve Google prijave treba da bude prazno)
-- ============================================================================

select id, email, first_name, last_name
  from public.customers
 where first_name is null
 order by created_at desc;
