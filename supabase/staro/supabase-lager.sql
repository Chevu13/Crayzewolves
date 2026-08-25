-- ============================================================================
-- CRAZYWOLVES — LAGER I ISTORIJA STATUSA
-- Pokreni posle supabase-orders.sql. Sme više puta.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Lager se prati samo tamo gde ima smisla.
--    Steam kod se ne troši kao šolja, pa digitalna roba ne ide u minus.
-- ---------------------------------------------------------------------------
alter table public.products
  add column if not exists track_stock boolean not null default true;

update public.products set track_stock = false where fulfillment = 'digital';

alter table public.products drop constraint if exists products_stock_not_negative;
alter table public.products add constraint products_stock_not_negative
  check (stock >= 0);


-- ---------------------------------------------------------------------------
-- 2. Skidanje sa lagera
--    Radi se u JEDNOJ naredbi po stavci, sa uslovom na količinu. Ako dva
--    kupca istovremeno uzmu poslednji komad, drugi ne prođe — provera i
--    upis su isti korak, pa nema procepa između njih.
-- ---------------------------------------------------------------------------
create or replace function public.reserve_stock(p_product_id text, p_qty int)
returns boolean
language plpgsql
as $$
declare
  updated int;
begin
  -- Kod robe koja se ne prati (Steam kodovi) stanje se NE dira — inače bi
  -- otišlo u minus i naredba bi pukla na ograničenju stock >= 0.
  update public.products
     set stock = case when track_stock then stock - p_qty else stock end
   where id = p_product_id
     and (track_stock = false or stock >= p_qty);

  get diagnostics updated = row_count;
  return updated > 0;
end;
$$;

-- Vraćanje na lager kada se porudžbina otkaže.
create or replace function public.release_stock(p_order_id uuid)
returns void
language plpgsql
as $$
begin
  update public.products p
     set stock = p.stock + oi.quantity
    from public.order_items oi
   where oi.order_id = p_order_id
     and oi.product_id = p.id
     and p.track_stock;
end;
$$;


-- ---------------------------------------------------------------------------
-- 3. Istorija statusa — ko je šta menjao i kada
-- ---------------------------------------------------------------------------
create table if not exists public.order_events (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders(id) on delete cascade,
  from_status text,
  to_status   text not null,
  note        text,
  created_at timestamptz not null default now()
);

create index if not exists order_events_order_idx on public.order_events (order_id, created_at);

alter table public.order_events enable row level security;

drop policy if exists "dogadjaji: admin cita" on public.order_events;
create policy "dogadjaji: admin cita"
  on public.order_events for select to authenticated using (true);

drop policy if exists "dogadjaji: admin upisuje" on public.order_events;
create policy "dogadjaji: admin upisuje"
  on public.order_events for insert to authenticated with check (true);

-- Svaka promena statusa se sama upisuje — da se ne oslanjamo na to da
-- panel to uradi svaki put.
create or replace function public.log_order_status()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status then
    insert into public.order_events (order_id, from_status, to_status)
    values (new.id, old.status::text, new.status::text);

    -- Otkazivanje vraća robu na lager.
    if new.status = 'cancelled' and old.status <> 'cancelled' then
      perform public.release_stock(new.id);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_orders_log_status on public.orders;
create trigger trg_orders_log_status
  after update on public.orders
  for each row execute function public.log_order_status();


-- ---------------------------------------------------------------------------
-- 4. Broj pošiljke za praćenje
-- ---------------------------------------------------------------------------
alter table public.orders add column if not exists tracking_number text;
alter table public.orders add column if not exists tracking_url    text;
alter table public.orders add column if not exists shipped_at      timestamptz;


-- ---------------------------------------------------------------------------
-- 5. Provera
-- ---------------------------------------------------------------------------
select id, name, stock, track_stock, fulfillment from public.products order by id;
