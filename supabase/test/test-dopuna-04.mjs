import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import fs from 'node:fs';
const db = new PGlite({ extensions: { pgcrypto } });
const rd = f => fs.readFileSync(new URL(f, import.meta.url), 'utf8');
let pass=0, fail=0;
const ok=(n,c,d)=>{c?(pass++,console.log('  OK   '+n)):(fail++,console.log('  PALO '+n+(d?'  -> '+d:'')))};

await db.exec('create extension if not exists pgcrypto;');
await db.exec(rd('./stub.sql'));
await db.exec('alter table auth.users add column if not exists email_confirmed_at timestamptz;');
await db.exec(rd('../../supabase-postavka.sql'));

/* Glumimo bazu koja vec postoji sa starom adresom. */
await db.exec("update settings set value='kontakt@crazywolves.rs' where key='email'");
await db.exec("update settings set value='crazywolves.shop@gmail.com' where key='order_email_to'");

await db.exec(rd('../../supabase-dopuna-04.sql'));
await db.exec(rd('../../supabase-dopuna-04.sql'));
console.log('\ndopuna-04 prosla dvaput\n');

const g = async k => (await db.query('select value from settings where key=$1',[k])).rows[0]?.value;
ok('email prepisan', await g('email') === 'info.crazywolves@gmail.com', await g('email'));
ok('order_email_to prepisan', await g('order_email_to') === 'info.crazywolves@gmail.com', await g('order_email_to'));
ok('order_email_from prepisan', (await g('order_email_from')).includes('info.crazywolves@gmail.com'), await g('order_email_from'));

/* Ponovno pokretanje glavne skripte NE sme da vrati staru adresu. */
await db.exec(rd('../../supabase-postavka.sql'));
ok('postavka.sql ne vraca staru adresu', await g('email') === 'info.crazywolves@gmail.com', await g('email'));

console.log('\n' + '='.repeat(40) + `\n  ${pass} proslo, ${fail} palo\n` + '='.repeat(40));
if (fail) process.exit(1);
