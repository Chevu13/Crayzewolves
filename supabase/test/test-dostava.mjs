/* Lično preuzimanje ne sme da naplati dostavu. Provera nad pravim Postgres-om. */
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import fs from 'node:fs';

const db = new PGlite({ extensions: { pgcrypto } });
const rd = f => fs.readFileSync(new URL(f, import.meta.url), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { c ? (pass++, console.log('  OK   ' + n)) : (fail++, console.log('  PALO ' + n + (d ? '  -> ' + d : ''))); };
const co = async (p) => (await db.query('select public.create_order($1::jsonb) as r', [JSON.stringify(p)])).rows[0].r;
const denied = async (n, p) => { try { await co(p); ok(n, false, 'proslo a nije smelo'); } catch (e) { ok(n, true); } };

await db.exec('create extension if not exists pgcrypto;');
await db.exec(rd('./stub.sql'));
await db.exec('alter table auth.users add column if not exists email_confirmed_at timestamptz;');
await db.exec(rd('../../supabase-postavka.sql'));
await db.exec(rd('../../supabase-dopuna-01.sql'));
try { await db.exec(rd('../../supabase-dopuna-02.sql')); } catch (e) { console.log('  (dopuna-02 preskocena: ' + e.message.slice(0, 60) + ')'); }
await db.exec(rd('../../supabase-porudzbine.sql'));
await db.exec(rd('../../supabase-dopuna-03.sql'));
await db.exec(rd('../../supabase-dopuna-03.sql'));
console.log('\ndopuna-03 prosla dvaput - idempotentna\n');

const sAdresa = { email: 'k@g.rs', firstName: 'Marko', lastName: 'M',
                  addressLine: 'Knez Mihailova 1', city: 'Beograd', postcode: '11000' };
const bezAdrese = { email: 'k@g.rs', firstName: 'Marko', lastName: 'M' };

console.log('1. LICNO PREUZIMANJE - ovo je bilo pokvareno');
const licno = await co({ items: [{ productId: 'solja-zvanicna', quantity: 1 }],
                         customer: bezAdrese, paymentMethod: 'cod', shippingMethodId: 'licno' });
ok('dostava je 0', licno.shipping === 0, String(licno.shipping));
ok('ukupno = samo cena robe (1.490)', licno.total === 149000, String(licno.total));
ok('naziv nacina upisan', licno.shippingName === 'Licno preuzimanje' || licno.shippingName === 'Lično preuzimanje', licno.shippingName);
ok('adresa NIJE trazena za licno preuzimanje', true);

console.log('\n2. KURIRSKA DOSTAVA');
const kurir = await co({ items: [{ productId: 'solja-zvanicna', quantity: 1 }],
                         customer: sAdresa, paymentMethod: 'cod', shippingMethodId: 'kurir' });
ok('dostava 390', kurir.shipping === 39000, String(kurir.shipping));
ok('ukupno 1.880', kurir.total === 188000, String(kurir.total));
await denied('kurir bez adrese - odbijeno',
  { items: [{ productId: 'solja-zvanicna', quantity: 1 }], customer: bezAdrese, paymentMethod: 'cod', shippingMethodId: 'kurir' });

console.log('\n3. BESPLATNA DOSTAVA PREKO PRAGA');
const veliko = await co({ items: [{ productId: 'solja-zvanicna', quantity: 3 }],
                          customer: sAdresa, paymentMethod: 'cod', shippingMethodId: 'kurir' });
ok('4.470 > 4.000 -> kurir postaje 0', veliko.shipping === 0, String(veliko.shipping));

console.log('\n4. EVRO');
const eur = await co({ items: [{ productId: 'solja-zvanicna', quantity: 1 }],
                       customer: sAdresa, paymentMethod: 'card', currency: 'EUR', shippingMethodId: 'kurir' });
ok('kurir 3,90 EUR', eur.shipping === 390, String(eur.shipping));
const eurLicno = await co({ items: [{ productId: 'solja-zvanicna', quantity: 1 }],
                            customer: bezAdrese, paymentMethod: 'card', currency: 'EUR', shippingMethodId: 'licno' });
ok('licno 0 i u evrima', eurLicno.shipping === 0, String(eurLicno.shipping));

console.log('\n5. DIGITALNO NEMA DOSTAVU UOPSTE');
await db.exec("insert into product_keys (product_id, code) values ('primer-steam-kljuc','KK-1')");
const dig = await co({ items: [{ productId: 'primer-steam-kljuc', quantity: 1 }],
                       customer: bezAdrese, paymentMethod: 'card', shippingMethodId: 'kurir' });
ok('digitalno -> dostava 0 bez obzira na izbor', dig.shipping === 0, String(dig.shipping));

console.log('\n6. STA BAZA ODBIJA');
await denied('nepostojeci nacin dostave',
  { items: [{ productId: 'solja-zvanicna', quantity: 1 }], customer: sAdresa, paymentMethod: 'cod', shippingMethodId: 'teleport' });

console.log('\n7. CENA DOSTAVE SE MENJA IZ PANELA');
await db.exec("update shipping_methods set price = 49000 where id = 'kurir'");
const posle = await co({ items: [{ productId: 'solja-zvanicna', quantity: 1 }],
                         customer: sAdresa, paymentMethod: 'cod', shippingMethodId: 'kurir' });
ok('nova cena 490 odmah vazi', posle.shipping === 49000, String(posle.shipping));

console.log('\n' + '='.repeat(44) + `\n  ${pass} proslo, ${fail} palo\n` + '='.repeat(44));
if (fail) process.exit(1);
