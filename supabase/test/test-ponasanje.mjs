/* Ponašanje, ne sintaksa. Da li baza zaista brani ono što tvrdi da brani
   i da li kodovi zaista idu pravom kupcu. */
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import fs from 'node:fs';

const SQL = fs.readFileSync(new URL('../../supabase-postavka.sql', import.meta.url), 'utf8');
const db = new PGlite({ extensions: { pgcrypto } });

const STUB = `
create role anon; create role authenticated; create role service_role;
create schema if not exists auth;
create table auth.users (id uuid primary key default gen_random_uuid(), email text,
  raw_user_meta_data jsonb default '{}'::jsonb, created_at timestamptz default now());
create or replace function auth.uid() returns uuid language sql stable
  as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create or replace function auth.jwt() returns jsonb language sql stable
  as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
create or replace function auth.role() returns text language sql stable
  as $$ select coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), 'anon') $$;
create schema if not exists storage;
create table storage.buckets (id text primary key, name text not null, public boolean default false);
create table storage.objects (id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets(id), name text, owner uuid);
alter table storage.objects enable row level security;
`;

let pass = 0, fail = 0;
function check(name, ok, detail) {
  if (ok) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (detail ? '  → ' + detail : '')); }
}

/* Glumi jednog korisnika: postavi rolu i JWT tvrdnje, izvrši, pa vrati nazad. */
async function as(role, userId, email, fn) {
  /* `set local` vazi samo unutar transakcije, a svaki exec() je svoja
     transakcija — zato obicni `set`, koji ostaje na sesiji. */
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [userId || '']);
  await db.query(`select set_config('request.jwt.claims', $1, false)`, [JSON.stringify({ sub: userId, email })]);
  await db.exec(`set role ${role};`);
  try { return await fn(); } finally { await db.exec('reset role;'); }
}

async function denied(label, fn) {
  try { const r = await fn(); check(label, false, 'PROŠLO a nije smelo (' + (r?.rows?.length ?? '?') + ' redova)'); }
  catch (e) { check(label, true); }
}

async function main() {
  await db.exec('create extension if not exists pgcrypto;');
  await db.exec(STUB);
  await db.exec(SQL);
  await db.exec(`grant usage on schema public to anon, authenticated;
                 grant select, insert, update, delete on all tables in schema public to anon, authenticated;
                 grant usage on all sequences in schema public to anon, authenticated;
                 grant usage on schema auth to anon, authenticated;
                 grant select on auth.users to anon, authenticated;`);

  // --- nalozi ---
  const admin = (await db.query(`insert into auth.users (email) values ('admin@crazywolves.rs') returning id`)).rows[0].id;
  const kupac = (await db.query(`insert into auth.users (email, raw_user_meta_data) values ('kupac@gmail.com', '{"first_name":"Marko","last_name":"Marković"}') returning id`)).rows[0].id;
  const drugi = (await db.query(`insert into auth.users (email) values ('drugi@gmail.com') returning id`)).rows[0].id;
  await db.exec(`insert into public.admins (user_id, email) values ('${admin}', 'admin@crazywolves.rs')`);

  console.log('\n1. PROFIL KUPCA SE PRAVI SAM PRI REGISTRACIJI');
  const prof = await db.query(`select email, first_name, last_name from customers where id = '${kupac}'`);
  check('profil napravljen okidačem', prof.rows.length === 1);
  check('ime preuzeto iz registracije', prof.rows[0]?.first_name === 'Marko', JSON.stringify(prof.rows[0]));

  console.log('\n2. KUPAC NE SME DA MENJA SAJT  (glavna rupa u staroj šemi)');
  await as('authenticated', kupac, 'kupac@gmail.com', async () => {
    /* RLS kod delete/update NE baca gresku — filtrira redove, pa naredba
       prodje nad NULA redova. Zato se meri da roba i cena stvarno stoje. */
    const d = await db.query(`delete from products where id = 'solja-zvanicna' returning id`);
    check('kupac ne moze da obrise proizvod', d.rows.length === 0, 'obrisao ' + d.rows.length);
    const u = await db.query(`update products set price = 1 where id = 'solja-zvanicna' returning id`);
    check('kupac ne moze da promeni cenu', u.rows.length === 0, 'promenio ' + u.rows.length);
    await denied('kupac ne može da objavi na blogu', () =>
      db.query(`insert into posts (title, slug, content, status) values ('Hack','hack','x','published') returning id`));
    const k = await db.query(`select count(*)::int n from product_keys`);
    check('kupac ne vidi nijedan Steam kod', k.rows[0].n === 0, 'vidi ' + k.rows[0].n);
  });

  console.log('\n3. ADMIN SME SVE');
  await as('authenticated', admin, 'admin@crazywolves.rs', async () => {
    const u = await db.query(`update products set stock = 30 where id = 'solja-zvanicna' returning stock`);
    check('admin menja proizvod', u.rows[0]?.stock === 30);
    const p = await db.query(`insert into posts (title, slug, content, status) values ('Test','test-objava','x','draft') returning id`);
    check('admin upisuje objavu', p.rows.length === 1);
  });

  console.log('\n4. NACRTI SE NE VIDE POSETIOCU NI KUPCU');
  await as('anon', null, null, async () => {
    const r = await db.query(`select count(*)::int n from posts`);
    check('anon vidi samo objavljeno (4 od 5)', r.rows[0].n === 4, 'vidi ' + r.rows[0].n);
  });
  await as('authenticated', kupac, 'kupac@gmail.com', async () => {
    const r = await db.query(`select count(*)::int n from posts`);
    check('prijavljen kupac takođe vidi samo objavljeno', r.rows[0].n === 4, 'vidi ' + r.rows[0].n);
  });

  console.log('\n5. STEAM KODOVI — unos jednom, kodovi se dosipaju');
  await db.exec(`
    insert into product_keys (product_id, code) values
      ('primer-steam-kljuc', 'AAAA-1111-BBBB'),
      ('primer-steam-kljuc', 'CCCC-2222-DDDD'),
      ('primer-steam-kljuc', 'EEEE-3333-FFFF');`);
  const stock = await db.query(`select available, sold from product_key_stock where product_id='primer-steam-kljuc'`);
  check('slobodno 3 koda', Number(stock.rows[0].available) === 3, JSON.stringify(stock.rows[0]));
  await denied('isti kod ne može dvaput', () =>
    db.query(`insert into product_keys (product_id, code) values ('primer-steam-kljuc','AAAA-1111-BBBB')`));

  console.log('\n6. DODELA KODOVA PRI PORUDŽBINI');
  const o1 = (await db.query(`
    insert into orders (order_number, customer_id, email, first_name, last_name, kind,
                        currency, subtotal, total, payment_method, payment_status, status)
    values (next_order_number(), '${kupac}', 'kupac@gmail.com', 'Marko', 'Marković', 'digital',
            'RSD', 398000, 398000, 'card', 'paid', 'confirmed') returning id, order_number`)).rows[0];
  await db.exec(`insert into order_items (order_id, product_id, name, unit_price, quantity, line_total, fulfillment)
                 values ('${o1.id}', 'primer-steam-kljuc', 'Primer — Steam ključ', 199000, 2, 398000, 'digital')`);
  const n = (await db.query(`select assign_keys('${o1.id}')::int as n`)).rows[0].n;
  check('dodeljena 2 koda za količinu 2', n === 2, 'dodeljeno ' + n);

  const posle = await db.query(`select available, sold from product_key_stock where product_id='primer-steam-kljuc'`);
  check('ostao 1 slobodan, 2 prodata', Number(posle.rows[0].available) === 1 && Number(posle.rows[0].sold) === 2,
        JSON.stringify(posle.rows[0]));

  const ds = await db.query(`select keys_delivered, keys_codes from digital_sales where order_id = '${o1.id}'`);
  check('pregled digitalne prodaje pokazuje kodove', Number(ds.rows[0]?.keys_delivered) === 2, JSON.stringify(ds.rows[0]));

  console.log('\n7. ISTI KOD NE MOŽE DVAPUT DA SE PRODA');
  const o2 = (await db.query(`
    insert into orders (order_number, email, first_name, last_name, kind, currency, subtotal, total,
                        payment_method, payment_status, status)
    values (next_order_number(), 'drugi@gmail.com', 'Petar', 'Petrović', 'digital', 'RSD', 199000, 199000,
            'card', 'paid', 'confirmed') returning id`)).rows[0];
  await db.exec(`insert into order_items (order_id, product_id, name, unit_price, quantity, line_total, fulfillment)
                 values ('${o2.id}', 'primer-steam-kljuc', 'Primer — Steam ključ', 199000, 1, 199000, 'digital')`);
  await db.query(`select assign_keys('${o2.id}')`);
  const overlap = await db.query(`
    select count(*)::int n from product_keys k1
    join product_keys k2 on k1.code = k2.code and k1.id <> k2.id`);
  check('nijedan kod nije na dve porudžbine', overlap.rows[0].n === 0);
  const raspodela = await db.query(`select order_id, count(*)::int n from product_keys where status='sold' group by order_id`);
  check('kodovi raspoređeni 2 + 1', raspodela.rows.length === 2, JSON.stringify(raspodela.rows));

  console.log('\n8. KUPAC VIDI SVOJE PORUDŽBINE, TUĐE NE');
  await as('authenticated', kupac, 'kupac@gmail.com', async () => {
    const r = await db.query(`select order_number from orders`);
    check('kupac vidi tačno svoju porudžbinu', r.rows.length === 1 && r.rows[0].order_number === o1.order_number,
          JSON.stringify(r.rows));
    const it = await db.query(`select count(*)::int n from order_items`);
    check('kupac vidi stavke samo svoje porudžbine', it.rows[0].n === 1, 'vidi ' + it.rows[0].n);
  });
  await as('authenticated', drugi, 'drugi@gmail.com', async () => {
    const r = await db.query(`select order_number from orders`);
    check('gost-porudžbina se poklopila po imejlu', r.rows.length === 1, JSON.stringify(r.rows));
  });
  await as('anon', null, null, async () => {
    const r = await db.query(`select count(*)::int n from orders`);
    check('posetilac ne vidi nijednu porudžbinu', r.rows[0].n === 0, 'vidi ' + r.rows[0].n);
  });

  console.log('\n9. STATUSI: Nova → Potvrđena → Poslata → Preuzeta');
  const o3 = (await db.query(`
    insert into orders (order_number, email, first_name, last_name, kind, currency, subtotal, shipping_cost,
                        total, payment_method, status)
    values (next_order_number(), 'kupac@gmail.com', 'Marko', 'Marković', 'merch', 'RSD', 149000, 39000,
            188000, 'cod', 'new') returning id`)).rows[0];
  await db.exec(`insert into order_items (order_id, product_id, name, unit_price, quantity, line_total)
                 values ('${o3.id}', 'solja-zvanicna', 'Zvanična CrazyWolves šolja', 149000, 1, 149000)`);
  await db.exec(`select reserve_stock('solja-zvanicna', 1)`);

  for (const s of ['confirmed', 'shipped', 'picked_up']) {
    await db.exec(`update orders set status = '${s}' where id = '${o3.id}'`);
  }
  const ev = await db.query(`select from_status, to_status from order_events where order_id='${o3.id}' order by created_at`);
  check('istorija zapisala sve tri promene', ev.rows.length === 3, JSON.stringify(ev.rows));
  const ship = await db.query(`select shipped_at is not null as ima from orders where id='${o3.id}'`);
  check('vreme slanja upisano samo', ship.rows[0].ima === true);

  console.log('\n10. OTKAZIVANJE VRAĆA LAGER I OSLOBAĐA KODOVE');
  const pre = (await db.query(`select stock from products where id='solja-zvanicna'`)).rows[0].stock;
  await db.exec(`update orders set status='cancelled' where id='${o3.id}'`);
  const posleOtk = (await db.query(`select stock from products where id='solja-zvanicna'`)).rows[0].stock;
  check('šolja vraćena na lager', posleOtk === pre + 1, pre + ' → ' + posleOtk);

  await db.exec(`update orders set status='cancelled' where id='${o2.id}'`);
  const slobodni = await db.query(`select available from product_key_stock where product_id='primer-steam-kljuc'`);
  /* Od tri koda, porudzbina o1 i dalje drzi dva. Otkazivanje o2 vraca
     tacno jedan — ne sva tri. */
  check('kod otkazane digitalne porudzbine vracen u slobodne', Number(slobodni.rows[0].available) === 1,
        JSON.stringify(slobodni.rows[0]));
  const jos = await db.query(`select count(*)::int n from product_keys where status='sold' and order_id = '${o1.id}'`);
  check('kodovi druge porudzbine nisu dirani', jos.rows[0].n === 2, 'ostalo ' + jos.rows[0].n);

  console.log('\n11. OGRANIČENJA KOJA ČUVAJU OD GREŠKE PRI UNOSU');
  await denied('digitalni proizvod ne sme pouzećem', () =>
    db.query(`update products set allow_cod = true where id = 'primer-steam-kljuc'`));
  await denied('digitalni proizvod ne sme u merch prodavnicu', () =>
    db.query(`update products set shop = 'merch' where id = 'primer-steam-kljuc'`));
  await denied('stara cena ne sme biti niža od nove', () =>
    db.query(`update products set compare_at = 1000 where id = 'solja-zvanicna'`));
  await denied('lager ne sme u minus', () =>
    db.query(`update products set stock = -1 where id = 'solja-zvanicna'`));
  await denied('dve podrazumevane valute', () =>
    db.query(`update currencies set is_default = true where code = 'EUR'`));

  console.log('\n' + '═'.repeat(46));
  console.log(`  ${pass} prošlo, ${fail} palo`);
  console.log('═'.repeat(46));
  if (fail) process.exit(1);
}

main().catch(e => { console.error('\nPUKLO:', e.message); process.exit(1); });
