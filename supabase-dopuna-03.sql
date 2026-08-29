-- ============================================================================
--  CRAZYWOLVES — DOPUNA 03: NAČINI DOSTAVE
--  ---------------------------------------------------------------------------
--  Pokreni POSLE supabase-postavka.sql, -dopuna-01, -dopuna-02 i
--  supabase-porudzbine.sql. Sme da se pokrene više puta.
--
--  ---------------------------------------------------------------------------
--  ŠTA JE BILO POKVARENO
--
--  Kupac izabere „Lično preuzimanje", potvrdi porudžbinu — i na potvrdi mu
--  piše trošak dostave od 390 RSD.
--
--  Sajt je znao da lično preuzimanje košta 0 (stoji u cw-data-shop.js), ali
--  `create_order` u bazi to nije znao. On je gledao SAMO podešavanje
--  `shipping_flat` i naplaćivao ga svakoj fizičkoj porudžbini. Način dostave
--  je primao kao običan tekst i samo ga zapisivao uz porudžbinu.
--
--  A baza je merodavna — iznos na potvrdi je onaj koji ona vrati. Cenovnik
--  dostave zato mora da živi OVDE, a ne u JavaScript fajlu.
--
--  Uz to: sad se cena dostave menja iz panela, bez diranja koda.
-- ============================================================================


-- ============================================================================
-- 1. TABELA NAČINA DOSTAVE
-- ============================================================================

create table if not exists public.shipping_methods (
  id          text primary key,
  name        text not null,
  eta         text,
  description text,

  -- U PARAMA / CENTIMA, kao sve cene u bazi. 39000 = 390 RSD.
  price       int not null default 0 check (price >= 0),
  price_eur   int check (price_eur is null or price_eur >= 0),

  -- Da li za ovaj način važi prag za besplatnu dostavu. Kod ličnog
  -- preuzimanja je svejedno — ono je ionako 0 — ali kod nekog budućeg
  -- „ekspres" načina ne bi smelo da postane besplatno preko praga.
  free_over_applies boolean not null default true,

  is_active   boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_shipping_methods_touch on public.shipping_methods;
create trigger trg_shipping_methods_touch
  before update on public.shipping_methods
  for each row execute function public.touch_updated_at();

insert into public.shipping_methods
  (id, name, eta, description, price, price_eur, free_over_applies, sort_order)
values
  ('kurir', 'Kurirska dostava', '2–4 radna dana',
   'Dostava na adresu, praćenje pošiljke.', 39000, 390, true, 0),
  ('licno', 'Lično preuzimanje', 'Po dogovoru',
   'Dogovara se preko Discorda.', 0, 0, false, 1)
on conflict (id) do nothing;


-- ---- BEZBEDNOST ----
alter table public.shipping_methods enable row level security;

drop policy if exists "dostava: javno čitanje" on public.shipping_methods;
create policy "dostava: javno čitanje"
  on public.shipping_methods for select to anon, authenticated using (true);

drop policy if exists "dostava: upis samo admin" on public.shipping_methods;
create policy "dostava: upis samo admin"
  on public.shipping_methods for all to authenticated
  using (public.is_admin()) with check (public.is_admin());


-- ============================================================================
-- 2. create_order SADA ČITA CENU DOSTAVE IZ TABELE
-- ----------------------------------------------------------------------------
-- Jedina izmena u odnosu na supabase-porudzbine.sql je odeljak „dostava";
-- ostalo je isto i ponovo se upisuje celo, da funkcija ostane na jednom mestu.
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
  -- Cena dolazi iz tabele `shipping_methods`, po id-ju koji je kupac izabrao.
  -- Ovo je izmena zbog koje dopuna postoji: lično preuzimanje košta 0, i to
  -- sada zna i baza, ne samo sajt.
  if v_physical then
    if v_ship_id is not null then
      select * into sm from public.shipping_methods
       where id = v_ship_id and is_active = true;
      if not found then
        raise exception 'Način dostave nije dostupan.';
      end if;
    else
      -- Bez izabranog načina uzima se prvi aktivni — nikad se ne pretpostavlja
      -- da je besplatno.
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

    -- Adresa je obavezna samo kad roba stvarno putuje. Za lično preuzimanje
    -- se ne traži — ranije se tražila uvek, pa je i to bilo pogrešno.
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


-- ============================================================================
-- 3. PROVERA
-- ============================================================================

select id, name, price, price_eur, free_over_applies, is_active
  from public.shipping_methods
 order by sort_order;
