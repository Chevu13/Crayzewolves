-- ============================================================================
--  WOLFPACK — DOPUNA 06: „NEMA NA STANJU" ZAUSTAVLJA PRODAJU
--  ---------------------------------------------------------------------------
--  Pokreni u Supabase → SQL Editor. Sme da se pokrene više puta.
--
--  ---------------------------------------------------------------------------
--  ŠTA JE BILO POKVARENO
--
--  U panelu postoji „Dostupnost: Nema na stanju", ali ju je `create_order`
--  ignorisao — odbijao je samo „U pripremi". Dok god je lager bio veći od
--  nule, roba je mogla da se poruči iako je prodavac rekao da se ne prodaje.
--
--  Sada baza odbija i `out_of_stock`. Sajt isto to radi u pregledaču
--  (cw-hydrate.js), ali odluka mora da stoji i ovde — pregledač se može
--  zaobići, baza ne.
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

  v_physical   boolean := false;
  v_digital    boolean := false;

  v_rate       numeric;
  v_ship       int := 0;
  v_free_over  int;

  sm           public.shipping_methods%rowtype;
  v_ship_id    text := nullif(trim(coalesce(payload ->> 'shippingMethodId', '')), '');

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
    -- NOVO: odluka prodavca iz panela.
    if p.stock_status = 'out_of_stock' then
      raise exception '% trenutno nije u prodaji.', p.name;
    end if;

    if v_currency = 'EUR' then
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
  end loop;

  -- --------------------------------------------------------------- pravila
  if v_digital and v_pay = 'cod' then
    raise exception 'Digitalna roba se ne plaća pouzećem — kod stiže mejlom.';
  end if;

  -- ================================================================ DOSTAVA
  if v_physical then
    if v_ship_id is not null then
      select * into sm from public.shipping_methods
       where id = v_ship_id and is_active = true;
      if not found then
        raise exception 'Način dostave nije dostupan.';
      end if;
    else
      select * into sm from public.shipping_methods
       where is_active = true order by sort_order limit 1;
      if not found then
        raise exception 'Nijedan način dostave nije podešen.';
      end if;
    end if;

    if v_currency = 'EUR' then
      v_ship      := coalesce(sm.price_eur, 0);
      v_free_over := public.setting_int('free_shipping_over_eur', 3500);
    else
      v_ship      := sm.price;
      v_free_over := public.setting_int('free_shipping_over', 400000);
    end if;

    if sm.free_over_applies and v_free_over > 0 and v_subtotal >= v_free_over then
      v_ship := 0;
    end if;

    if sm.price > 0 or sm.id <> 'licno' then
      if coalesce(c ->> 'addressLine', '') = '' or coalesce(c ->> 'city', '') = '' then
        raise exception 'Za dostavu na adresu su ulica i grad obavezni.';
      end if;
    end if;
  end if;

  v_kind := case when v_physical then 'merch' else 'digital' end;

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
    v_pay::public.payment_method, 'unpaid'::public.payment_status, v_status,
    coalesce(sm.name, nullif(payload ->> 'shippingMethod', ''))
  )
  returning id into v_order_id;

  -- --------------------------------------------------------------- stavke
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
    'id',            v_order_id,
    'orderNumber',   v_number,
    'currency',      v_currency,
    'subtotal',      v_subtotal,
    'shipping',      v_ship,
    'total',         v_subtotal + v_ship,
    'status',        v_status,
    'shippingName',  sm.name,
    'items',         v_items_out
  );
end;
$$;

revoke all on function public.create_order(jsonb) from public;
grant execute on function public.create_order(jsonb) to anon, authenticated;
