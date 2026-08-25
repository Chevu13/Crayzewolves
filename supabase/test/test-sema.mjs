/* Pokreće supabase-postavka.sql nad pravim Postgres-om (PGlite, WASM build
   PG 16). Supabase-a nema, pa se auth/storage šeme prave kao zamena — dovoljno
   da se proveri sve ostalo: sintaksa, redosled, ograničenja, RLS, seed. */
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import fs from 'node:fs';

const SQL = fs.readFileSync(new URL('../../supabase-postavka.sql', import.meta.url), 'utf8');

const db = new PGlite({ extensions: { pgcrypto } });

const STUB = `
create role anon;
create role authenticated;
create role service_role;

create schema if not exists auth;
create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  raw_user_meta_data jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
create or replace function auth.uid() returns uuid language sql stable
  as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create or replace function auth.jwt() returns jsonb language sql stable
  as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
create or replace function auth.role() returns text language sql stable
  as $$ select coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), 'anon') $$;

create schema if not exists storage;
create table storage.buckets (
  id text primary key, name text not null, public boolean default false,
  created_at timestamptz default now()
);
create table storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets(id),
  name text, owner uuid, created_at timestamptz default now()
);
alter table storage.objects enable row level security;
`;

async function main() {
  await db.exec('create extension if not exists pgcrypto;');
  await db.exec(STUB);
  console.log('stub auth/storage: ok\n');

  // Supabase SQL Editor šalje ceo fajl kao jedan zahtev. exec() radi isto.
  try {
    await db.exec(SQL);
    console.log('══ PRVO POKRETANJE: PROŠLO ══\n');
  } catch (e) {
    console.error('══ PRVO POKRETANJE PALO ══');
    console.error(e.message);
    process.exit(1);
  }

  // Skripta mora da preživi ponovno pokretanje.
  try {
    await db.exec(SQL);
    console.log('══ DRUGO POKRETANJE (idempotencija): PROŠLO ══\n');
  } catch (e) {
    console.error('══ DRUGO POKRETANJE PALO ══');
    console.error(e.message);
    process.exit(1);
  }

  const show = async (label, sql) => {
    const r = await db.query(sql);
    console.log('— ' + label);
    console.table(r.rows);
  };

  await show('RLS po tabeli', `
    select c.relname as tabela, c.relrowsecurity as rls,
      (select count(*) from pg_policies p where p.schemaname='public' and p.tablename=c.relname) as pravila
    from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relkind='r'
    order by c.relname`);

  await show('proizvodi', `select id, shop, fulfillment, allow_cod, track_stock, price, stock from products order by shop, sort_order`);
  await show('kategorije', `select id, name, shop, sort_order from shop_categories order by shop, sort_order`);
  await show('objave', `select id, category_id, status, image from posts order by published_at`);
  await show('pogledi', `select table_name from information_schema.views where table_schema='public'`);
  await show('funkcije', `select routine_name from information_schema.routines where routine_schema='public' order by routine_name`);
}

main().then(() => console.log('\ngotovo')).catch(e => { console.error(e); process.exit(1); });
