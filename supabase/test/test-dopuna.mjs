/* Dopuna 01 mora da radi i sama i posle glavne skripte, i pogled sme da
   pusti SAMO broj — nikad kod. */
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import fs from 'node:fs';

const db = new PGlite({ extensions: { pgcrypto } });
const rd = f => fs.readFileSync(new URL(f, import.meta.url), 'utf8');

let pass = 0, fail = 0;
const ok = (n, c, d) => { c ? (pass++, console.log('  ✓ ' + n)) : (fail++, console.log('  ✗ ' + n + (d ? '  → ' + d : ''))); };

await db.exec('create extension if not exists pgcrypto;');
await db.exec(rd('./stub.sql'));
await db.exec(rd('../../supabase-postavka.sql'));
await db.exec(rd('../../supabase-dopuna-01.sql'));
console.log('\ndopuna prosla prvi put');
await db.exec(rd('../../supabase-dopuna-01.sql'));
console.log('dopuna prosla i drugi put\n');

await db.exec(`grant usage on schema public to anon, authenticated;
               grant select, insert, update, delete on all tables in schema public to anon, authenticated;
               grant select on public.product_availability to anon, authenticated;`);

const merch = await db.query(`select count(*)::int n from products where shop='merch' and is_active`);
ok('cetiri merch proizvoda su aktivna', merch.rows[0].n === 4, 'ima ' + merch.rows[0].n);

await db.exec(`insert into product_keys (product_id, code) values
  ('primer-steam-kljuc','K1'),('primer-steam-kljuc','K2')`);

const av = await db.query(`select * from product_availability`);
ok('pogled broji 2 slobodna koda', av.rows[0]?.available === 2, JSON.stringify(av.rows));

const cols = await db.query(`select column_name from information_schema.columns
                             where table_name='product_availability'`);
const names = cols.rows.map(r => r.column_name);
ok('pogled pusta SAMO product_id i available', names.length === 2 && names.includes('available') && names.includes('product_id'),
   names.join(','));
ok('pogled NE sadrzi kolonu sa kodom', !names.some(n => /code|kod|key/i.test(n)), names.join(','));

/* Kljucni test: posetilac vidi BROJ, ali ne i sam kod. */
await db.query(`select set_config('request.jwt.claim.sub','',false)`);
await db.exec('set role anon;');
const anonAv = await db.query(`select available from product_availability`);
ok('POSETILAC vidi broj slobodnih kodova', anonAv.rows[0]?.available === 2, JSON.stringify(anonAv.rows));
const anonKeys = await db.query(`select code from product_keys`);
ok('POSETILAC i dalje NE vidi nijedan kod', anonKeys.rows.length === 0, JSON.stringify(anonKeys.rows));
await db.exec('reset role;');

console.log('\n' + '═'.repeat(40) + `\n  ${pass} proslo, ${fail} palo\n` + '═'.repeat(40));
if (fail) process.exit(1);
