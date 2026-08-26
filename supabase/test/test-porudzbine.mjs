/* Porudžbine — da li stvarno ulaze u bazu i da li baza brani ono što tvrdi.
   Pokreće se nad pravim Postgres-om (PGlite), ne nad pretpostavkom. */
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import fs from 'node:fs';

const db = new PGlite({ extensions: { pgcrypto } });
const rd = f => fs.readFileSync(new URL(f, import.meta.url), 'utf8');

let pass = 0, fail = 0;
const ok = (n, c, d) => { c ? (pass++, console.log('  OK   ' + n))
                            : (fail++, console.log('  PALO ' + n + (d ? '  -> ' + d : ''))); };

const co = async (p) => (await db.query('select public.create_order($1::jsonb) as r', [JSON.stringify(p)])).rows[0].r;
const denied = async (n, p) => {
  try { await co(p); ok(n, false, 'proslo a nije smelo'); }
  catch (e) { ok(n, true); }
};
const lager  = (n) => db.exec(`update products set stock=${n} where id='solja-zvanicna'`);
const stanje = async () => (await db.query("select stock from products where id='solja-zvanicna'")).rows[0].stock;

await db.exec('create extension if not exists pgcrypto;');
await db.exec(rd('./stub.sql'));
await db.exec('alter table auth.users add column if not exists email_confirmed_at timestamptz;');
await db.exec(rd('../../supabase-postavka.sql'));
await db.exec(rd('../../supabase-dopuna-01.sql'));
await db.exec(rd('../../supabase-porudzbine.sql'));
await db.exec(rd('../../supabase-porudzbine.sql'));
console.log('\nskripta prosla dvaput - idempotentna\n');

const kupac = {
  email: 'kupac@gmail.com', firstName: 'Marko', lastName: 'Markovic',
  phone: '0601112223', addressLine: 'Knez Mihailova 1', city: 'Beograd', postcode: '11000'
};

console.log('1. OBICNA PORUDZBINA');
await lager(25);
const o1 = await co({ items: [{ productId: 'solja-zvanicna', quantity: 2 }], customer: kupac, paymentMethod: 'cod', currency: 'RSD' });
ok('napravljena', !!o1.orderNumber);
ok('broj u obliku CW-GGGG-NNNN', /^CW-\d{4}-\d{4}$/.test(o1.orderNumber), o1.orderNumber);
ok('cena 2 x 1.490 = 2.980', o1.subtotal === 298000, String(o1.subtotal));
ok('dostava 390', o1.shipping === 39000, String(o1.shipping));
ok('ukupno 3.370', o1.total === 337000, String(o1.total));
ok('status Nova', o1.status === 'new', o1.status);
ok('lager 25 -> 23', (await stanje()) === 23, String(await stanje()));

console.log('\n2. NAPAD - pregledac salje svoju cenu');
await lager(25);
const o2 = await co({ items: [{ productId: 'solja-zvanicna', quantity: 1, price: 1, unitPrice: 1 }],
                      customer: kupac, paymentMethod: 'cod', subtotal: 1, total: 1 });
const it2 = (await db.query('select unit_price from order_items where order_id=$1', [o2.id])).rows[0];
ok('cena 1 ignorisana, upisano 149000', it2.unit_price === 149000, String(it2.unit_price));
ok('ukupno racunato iz baze', o2.total === 149000 + 39000, String(o2.total));

console.log('\n3. LAGER');
await lager(3);
await denied('ne moze 5 kad ima 3', { items: [{ productId: 'solja-zvanicna', quantity: 5 }], customer: kupac, paymentMethod: 'cod' });
ok('neuspela porudzbina NIJE dirala lager', (await stanje()) === 3, String(await stanje()));
await co({ items: [{ productId: 'solja-zvanicna', quantity: 3 }], customer: kupac, paymentMethod: 'cod' });
ok('moze tacno koliko ima -> lager 0', (await stanje()) === 0, String(await stanje()));

console.log('\n4. BESPLATNA DOSTAVA PREKO 4.000');
await lager(25);
const o4 = await co({ items: [{ productId: 'solja-zvanicna', quantity: 3 }], customer: kupac, paymentMethod: 'cod' });
ok('3 x 1.490 = 4.470 -> dostava 0', o4.shipping === 0, String(o4.shipping));

console.log('\n5. EVRO');
await lager(25);
const o5 = await co({ items: [{ productId: 'solja-zvanicna', quantity: 1 }], customer: kupac, paymentMethod: 'card', currency: 'EUR' });
ok('rucno upisana evro cena 12,90', o5.subtotal === 1290, String(o5.subtotal));
ok('dostava 3,90', o5.shipping === 390, String(o5.shipping));

console.log('\n6. DIGITALNO');
await db.exec("insert into product_keys (product_id, code) values ('primer-steam-kljuc','K-1'),('primer-steam-kljuc','K-2')");
await denied('digitalno pouzecem - odbijeno', { items: [{ productId: 'primer-steam-kljuc', quantity: 1 }], customer: kupac, paymentMethod: 'cod' });
const o6 = await co({ items: [{ productId: 'primer-steam-kljuc', quantity: 1 }],
                      customer: { email: 'd@g.rs', firstName: 'D', lastName: 'D' }, paymentMethod: 'card' });
ok('digitalno karticom prolazi bez adrese', !!o6.orderNumber);
ok('bez troska dostave', o6.shipping === 0, String(o6.shipping));
ok('vrsta porudzbine = digital', (await db.query('select kind from orders where id=$1', [o6.id])).rows[0].kind === 'digital');
await denied('nema dovoljno kodova - trazi 5, ima 2',
  { items: [{ productId: 'primer-steam-kljuc', quantity: 5 }], customer: { email: 'd@g.rs', firstName: 'D', lastName: 'D' }, paymentMethod: 'card' });

console.log('\n7. KOD SE NE DAJE DOK NIJE PLACENO');
let k = (await db.query('select count(*)::int n from product_keys where order_id=$1', [o6.id])).rows[0].n;
ok('pri porucivanju kod NIJE dodeljen', k === 0, 'dodeljeno ' + k);
await db.exec(`update orders set payment_status='paid' where id='${o6.id}'`);
k = (await db.query(`select count(*)::int n from product_keys where order_id='${o6.id}' and status='sold'`)).rows[0].n;
ok('cim je placeno - kod dodeljen sam', k === 1, 'dodeljeno ' + k);

console.log('\n8. STA BAZA ODBIJA');
await lager(25);
await denied('prazna korpa',            { items: [], customer: kupac, paymentMethod: 'cod' });
await denied('neispravan imejl',        { items: [{ productId: 'solja-zvanicna', quantity: 1 }], customer: { ...kupac, email: 'nijemejl' }, paymentMethod: 'cod' });
await denied('bez imena',               { items: [{ productId: 'solja-zvanicna', quantity: 1 }], customer: { ...kupac, firstName: '' }, paymentMethod: 'cod' });
await denied('fizicka roba bez adrese', { items: [{ productId: 'solja-zvanicna', quantity: 1 }], customer: { email: 'a@b.rs', firstName: 'A', lastName: 'B' }, paymentMethod: 'cod' });
await denied('nepostojeci proizvod',    { items: [{ productId: 'nema-me', quantity: 1 }], customer: kupac, paymentMethod: 'cod' });
await denied('kolicina 0',              { items: [{ productId: 'solja-zvanicna', quantity: 0 }], customer: kupac, paymentMethod: 'cod' });
await denied('kolicina 21',             { items: [{ productId: 'solja-zvanicna', quantity: 21 }], customer: kupac, paymentMethod: 'cod' });
await denied('proizvod koji tek stize', { items: [{ productId: 'majica-grb', quantity: 1 }], customer: kupac, paymentMethod: 'cod' });
await denied('nepostojeca valuta',      { items: [{ productId: 'solja-zvanicna', quantity: 1 }], customer: kupac, paymentMethod: 'cod', currency: 'USD' });

console.log('\n9. STATUS SME DA BIRA SAMO ADMIN');
const o9 = await co({ items: [{ productId: 'solja-zvanicna', quantity: 1 }], customer: kupac, paymentMethod: 'cod', status: 'picked_up' });
ok('kupac ne moze sam sebi Preuzeta', o9.status === 'new', o9.status);

const admin = (await db.query("insert into auth.users (email, email_confirmed_at) values ('a@cw.rs', now()) returning id")).rows[0].id;
await db.exec(`insert into admins (user_id, email) values ('${admin}','a@cw.rs')`);
await db.query(`select set_config('request.jwt.claim.sub','${admin}',false)`);
const o9b = await co({ items: [{ productId: 'solja-zvanicna', quantity: 1 }], customer: kupac, paymentMethod: 'cod', status: 'confirmed' });
ok('admin SME - rucni unos iz panela', o9b.status === 'confirmed', o9b.status);

console.log('\n10. PORUDZBINA JE ZAISTA U BAZI');
const red = (await db.query('select order_number, email, total, currency, status, kind from orders where id=$1', [o1.id])).rows[0];
ok('red postoji sa svim podacima', red && red.email === 'kupac@gmail.com' && red.total === 337000, JSON.stringify(red));
const brStavki = (await db.query('select count(*)::int n from order_items where order_id=$1', [o1.id])).rows[0].n;
ok('stavka upisana', brStavki === 1, String(brStavki));
const ukupno = (await db.query('select count(*)::int n from orders')).rows[0].n;
console.log('       ukupno porudzbina u bazi na kraju:', ukupno);

console.log('\n' + '='.repeat(44) + `\n  ${pass} proslo, ${fail} palo\n` + '='.repeat(44));
if (fail) process.exit(1);
