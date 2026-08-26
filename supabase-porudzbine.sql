-- ============================================================================
--  CRAZYWOLVES — PORUDŽBINE KOJE STVARNO ULAZE U BAZU
--  ---------------------------------------------------------------------------
--  Pokreni POSLE supabase-postavka.sql i supabase-dopuna-01.sql.
--  Sme da se pokrene više puta.
--
--  ---------------------------------------------------------------------------
--  ZAŠTO FUNKCIJA U BAZI, A NE EDGE FUNKCIJA
--
--  Sajt je dosad slao porudžbinu na Edge funkciju `create-order`. Ona nikad
--  nije bila deployovana, pa je svaka porudžbina padala na mreži.
--
--  Edge funkcija bi tražila: Supabase CLI ili ručno lepljenje koda, poseban
--  deploy, Resend nalog i tajni ključ. Sve to samo da bi se sabrala cena.
--
--  Postgres to ume sam. Ova funkcija je `security definer` — izvršava se
--  pravima vlasnika, pa sme da upiše u `orders` iako RLS to zabranjuje
--  svima. Time je sačuvano ono zbog čega je Edge funkcija i postojala:
--
--      PREGLEDAČ NIKAD NE ŠALJE CENU.
--
--  Šalje samo id proizvoda i količinu. Cenu, dostavu i ukupno čita i računa
--  baza. Ako neko otvori alatke za programere i pošalje cenu 1, baza je
--  ignoriše i upiše onu iz tabele — što je i provereno testom.
--
--  Mejl potvrde ovde NE ide. To ostaje za Edge funkciju kad je budeš
--  postavio; porudžbina je do tada uredno u bazi i vidi se u panelu.
-- ============================================================================


-- ============================================================================
-- 1. POMOĆNO — čitanje podešavanja
-- ============================================================================

create or replace function public.setting_int(p_key text, p_default int)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select nullif(value, '')::int from public.settings where key = p_key), p_default);
$$;


-- ============================================================================
-- 2. PRAVLJENJE PORUDŽBINE
-- ----------------------------------------------------------------------------
-- Ulaz (jsonb):
--   {
--     "items":    [ { "productId": "solja-zvanicna", "quantity": 2 } ],
--     "customer": { "email":"...", "firstName":"...", "lastName":"...",
--                   "phone":"...", "addressLine":"...", "city":"...",
--                   "postcode":"...", "country":"RS" },
--     "paymentMethod": "cod" | "card" | "bank",
--     "currency": "RSD" | "EUR",
--     "notes": "...",
--     "status": "confirmed"        -- POŠTUJE SE SAMO ADMINU (ručni unos)
--   }
--
-- Izlaz (jsonb): broj porudžbine, iznosi i stavke — onako kako ih je
-- izračunala BAZA, ne kako ih je pregledač prikazao.
-- ============================================================================

create or replace function public.create_order(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c            jsonb := coalesce(payload -> 'customer', '{}'::jsonb);
  v_email      text  := lower(trim(coalesce(c ->> 'email', '')));
  v_first      text  := trim(coalesce(c ->> 'firstName', ''));
  v_last       text  := trim(coalesce(c ->> 'lastName', ''));
  v_currency   text  := upper(coalesce(payload ->> 'currency', 'RSD'));
  v_pay        text  := lower(coalesce(payload ->> 'paymentMethod', 'cod'));

  it           jsonb;
  p            public.products%rowtype;
  v_qty        int;
  v_unit       int;
  v_subtotal   int := 0;
  v_count      int := 0;

  v_physical   boolean := false;
  v_digital    boolean := false;

  v_rate       numeric;
  v_ship       int := 0;
  v_free_over  int;

  v_order_id   uuid;
  v_number     text;
  v_kind       public.shop_kind;
  v_status     public.order_status := 'new';
  v_customer   uuid := auth.uid();
  v_admin      boolean := public.is_admin();
  v_item_id    uuid;
  v_items_out  jsonb := '[]'::jsonb;
begin
  -- ---------------------------------------------------------------- kupac
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Imejl adresa nije ispravna.';
  end if;
  if v_first = '' or v_last = '' then
    raise exception 'Ime i prezime su obavezni.';
  end if;

  if not exists (select 1 from public.currencies where code = v_currency and is_active) then
    raise exception 'Valuta % nije podržana.', v_currency;
  end if;
  if v_pay not in ('cod', 'card', 'bank') then
    raise exception 'Način plaćanja nije ispravan.';
  end if;

  if jsonb_typeof(payload -> 'items') <> 'array'
     or jsonb_array_length(payload -> 'items') = 0 then
    raise exception 'Korpa je prazna.';
  end if;

  -- ------------------------------------------------------------- proizvodi
  -- Cena se čita IZ BAZE. Ako je pregledač poslao svoju, ni ne gleda se.
  for it in select * from jsonb_array_elements(payload -> 'items')
  loop
    v_qty := coalesce((it ->> 'quantity')::int, 0);
    if v_qty < 1 or v_qty > 20 then
      raise exception 'Količina mora biti između 1 i 20.';
    end if;

    select * into p from public.products
     where id = (it ->> 'productId') and is_active = true;
    if not found then
      raise exception 'Proizvod nije dostupan: %', coalesce(it ->> 'productId', '?');
    end if;
    if p.stock_status = 'coming_soon' then
      raise exception '% još nije u prodaji.', p.name;
    end if;

    if v_currency = 'EUR' then
      -- Ručno upisana cena ima prednost; kurs je samo rezerva, da kupcu
      -- nikad ne izađe prazno polje.
      select rate_from_rsd into v_rate from public.currencies where code = 'EUR';
      v_unit := coalesce(p.price_eur, round(p.price * coalesce(v_rate, 0.008547))::int);
    else
      v_unit := p.price;
    end if;

    if v_unit is null or v_unit <= 0 then
      raise exception 'Za % nema cene u valuti %.', p.name, v_currency;
    end if;

    if p.fulfillment = 'digital' then
      v_digital := true;
      -- Zaliha digitalnog je broj slobodnih kodova, ne kolona `stock`.
      if (select count(*) from public.product_keys k
           where k.product_id = p.id and k.status = 'available') < v_qty then
        raise exception '% — nema dovoljno kodova na stanju.', p.name;
      end if;
    else
      v_physical := true;
      if p.track_stock and p.stock < v_qty then
        raise exception '% — nema dovoljno na stanju.', p.name;
      end if;
    end if;

    v_subtotal := v_subtotal + v_unit * v_qty;
    v_count := v_count + 1;
  end loop;

  -- --------------------------------------------------------------- pravila
  if v_digital and v_pay = 'cod' then
    raise exception 'Digitalna roba se ne plaća pouzećem — kod stiže mejlom.';
  end if;

  if v_physical and (coalesce(c ->> 'addressLine', '') = '' or coalesce(c ->> 'city', '') = '') then
    raise exception 'Za fizičku robu su adresa i grad obavezni.';
  end if;

  -- --------------------------------------------------------------- dostava
  -- Samo za fizičku robu. Steam kod se ne šalje kurirom.
  if v_physical then
    if v_currency = 'EUR' then
      v_ship      := public.setting_int('shipping_flat_eur', 390);
      v_free_over := public.setting_int('free_shipping_over_eur', 3500);
    else
      v_ship      := public.setting_int('shipping_flat', 39000);
      v_free_over := public.setting_int('free_shipping_over', 400000);
    end if;
    if v_free_over > 0 and v_subtotal >= v_free_over then
      v_ship := 0;
    end if;
  end if;

  v_kind := case when v_physical then 'merch' else 'digital' end;

  -- Status bira samo admin, i to za ručno unetu porudžbinu iz panela.
  -- Kupcu sa sajta svaka porudžbina ulazi kao „Nova", šta god poslao.
  if v_admin and payload ? 'status' then
    v_status := (payload ->> 'status')::public.order_status;
  end if;

  -- ----------------------------------------------------------------- upis
  v_number := public.next_order_number();

  insert into public.orders (
    order_number, customer_id, email, first_name, last_name, phone,
    address_line, city, postcode, country, notes, kind,
    currency, subtotal, shipping_cost, discount, total,
    payment_method, payment_status, status, shipping_method
  ) values (
    v_number, v_customer, v_email, v_first, v_last, nullif(trim(coalesce(c ->> 'phone','')), ''),
    nullif(trim(coalesce(c ->> 'addressLine','')), ''),
    nullif(trim(coalesce(c ->> 'city','')), ''),
    nullif(trim(coalesce(c ->> 'postcode','')), ''),
    coalesce(nullif(c ->> 'country',''), 'RS'),
    nullif(trim(coalesce(payload ->> 'notes','')), ''),
    v_kind, v_currency, v_subtotal, v_ship, 0, v_subtotal + v_ship,
    v_pay::public.payment_method,
    case when v_pay = 'cod' then 'unpaid' else 'unpaid' end::public.payment_status,
    v_status,
    nullif(payload ->> 'shippingMethod', '')
  )
  returning id into v_order_id;

  -- --------------------------------------------------------------- stavke
  -- Drugi prolaz kroz iste stavke: naziv i cena se PREPISUJU u porudžbinu,
  -- da izmena cene sutra ne promeni ono što je kupac tada platio.
  for it in select * from jsonb_array_elements(payload -> 'items')
  loop
    v_qty := (it ->> 'quantity')::int;
    select * into p from public.products where id = (it ->> 'productId');

    if v_currency = 'EUR' then
      select rate_from_rsd into v_rate from public.currencies where code = 'EUR';
      v_unit := coalesce(p.price_eur, round(p.price * coalesce(v_rate, 0.008547))::int);
    else
      v_unit := p.price;
    end if;

    insert into public.order_items (order_id, product_id, name, variant, unit_price, quantity, line_total, fulfillment)
    values (v_order_id, p.id, p.name, nullif(it ->> 'variant',''), v_unit, v_qty, v_unit * v_qty, p.fulfillment)
    returning id into v_item_id;

    if p.fulfillment = 'physical' and p.track_stock then
      if not public.reserve_stock(p.id, v_qty) then
        raise exception '% — neko je upravo uzeo poslednje komade.', p.name;
      end if;
    end if;

    v_items_out := v_items_out || jsonb_build_object(
      'name', p.name, 'quantity', v_qty, 'unitPrice', v_unit, 'lineTotal', v_unit * v_qty
    );
  end loop;

  return jsonb_build_object(
    'id',           v_order_id,
    'orderNumber',  v_number,
    'currency',     v_currency,
    'subtotal',     v_subtotal,
    'shipping',     v_ship,
    'total',        v_subtotal + v_ship,
    'status',       v_status,
    'items',        v_items_out
  );
end;
$$;

revoke all on function public.create_order(jsonb) from public;
grant execute on function public.create_order(jsonb) to anon, authenticated;


-- ============================================================================
-- 3. KODOVI SE DODELJUJU TEK KAD JE PLAĆENO
-- ----------------------------------------------------------------------------
-- Kod je roba. Da se dodeljuje pri poručivanju, svako bi mogao da „poruči"
-- igru, dobije kod i nikad ne plati.
--
-- Zato ovaj okidač: čim porudžbina pređe u plaćeno, kodovi se dodeljuju sami.
-- Ako se porudžbina otkaže, `log_order_status` ih vraća u slobodne.
-- ============================================================================

create or replace function public.assign_keys_on_paid()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.payment_status = 'paid' and old.payment_status is distinct from 'paid' then
    perform public.assign_keys(new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_orders_assign_keys on public.orders;
create trigger trg_orders_assign_keys
  after update on public.orders
  for each row execute function public.assign_keys_on_paid();


-- ============================================================================
-- 4. ŠTA KUPAC VIDI OD SVOJE PORUDŽBINE
-- ----------------------------------------------------------------------------
-- Kupac sme da vidi kodove SVOJE plaćene porudžbine — to je roba koju je
-- kupio. Tabela `product_keys` mu ostaje zatvorena; ide kroz ovu funkciju,
-- koja pušta samo kodove vezane za njegovu porudžbinu.
-- ============================================================================

create or replace function public.my_order_keys(p_order_number text)
returns table (product_name text, code text)
language sql
stable
security definer
set search_path = public
as $$
  select oi.name, k.code
    from public.orders o
    join public.order_items oi on oi.order_id = o.id
    join public.product_keys k on k.order_item_id = oi.id
   where o.order_number = p_order_number
     and o.payment_status = 'paid'
     and (
       public.is_admin()
       or o.customer_id = auth.uid()
       or lower(o.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
     )
   order by oi.name, k.created_at;
$$;

revoke all on function public.my_order_keys(text) from public;
grant execute on function public.my_order_keys(text) to authenticated;


-- ============================================================================
-- 5. PROVERA
-- ============================================================================

select
  p.proname                                       as funkcija,
  pg_get_function_identity_arguments(p.oid)       as argumenti,
  p.prosecdef                                     as security_definer
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('create_order', 'assign_keys', 'assign_keys_on_paid',
                    'my_order_keys', 'setting_int', 'reserve_stock')
order by p.proname;
