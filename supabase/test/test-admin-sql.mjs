/* Provera da supabase-admin.sql zaista radi, nad pravim Postgres-om. */
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import fs from 'node:fs';
const db = new PGlite({ extensions: { pgcrypto } });
const rd = f => fs.readFileSync(new URL(f, import.meta.url), 'utf8');
let pass=0, fail=0;
const ok=(n,c,d)=>{c?(pass++,console.log('  ✓ '+n)):(fail++,console.log('  ✗ '+n+(d?'  → '+d:'')))};

await db.exec('create extension if not exists pgcrypto;');
await db.exec(rd('./stub.sql'));
/* stub auth.users nema email_confirmed_at — dodajemo, kao u pravom Supabase-u */
await db.exec('alter table auth.users add column if not exists email_confirmed_at timestamptz;');
await db.exec(rd('../../supabase-postavka.sql'));

/* nalog napravljen bez potvrde i bez admin prava — tacno slucaj sa terena */
await db.exec(`insert into auth.users (email, email_confirmed_at) values ('wolf3tv@gmail.com', null)`);

const pre = await db.query(`select (email_confirmed_at is not null) c from auth.users where email='wolf3tv@gmail.com'`);
ok('pre: mejl NIJE potvrdjen', pre.rows[0].c === false);
const preA = await db.query(`select count(*)::int n from admins`);
ok('pre: nije admin', preA.rows[0].n === 0);

await db.exec(rd('../../supabase-admin.sql'));
console.log('  skripta prosla prvi put');
await db.exec(rd('../../supabase-admin.sql'));
console.log('  skripta prosla i drugi put (idempotentna)');

const post = await db.query(`select (u.email_confirmed_at is not null) c, (a.user_id is not null) a
  from auth.users u left join admins a on a.user_id=u.id where u.email='wolf3tv@gmail.com'`);
ok('posle: mejl potvrdjen', post.rows[0].c === true);
ok('posle: JESTE admin', post.rows[0].a === true);
const dup = await db.query(`select count(*)::int n from admins`);
ok('nije se udvostrucio pri drugom pokretanju', dup.rows[0].n === 1, 'ima '+dup.rows[0].n);

/* i da admin stvarno moze da menja */
await db.query(`select set_config('request.jwt.claim.sub',(select id::text from auth.users where email='wolf3tv@gmail.com'),false)`);
await db.exec(`grant usage on schema public to authenticated;
               grant select,insert,update,delete on all tables in schema public to authenticated;
               set role authenticated;`);
const u = await db.query(`update products set stock=99 where id='solja-zvanicna' returning stock`);
ok('taj nalog sada SME da menja proizvod', u.rows[0]?.stock === 99, 'redova: '+u.rows.length);
await db.exec('reset role;');

console.log('\n'+'═'.repeat(40)+`\n  ${pass} proslo, ${fail} palo\n`+'═'.repeat(40));
if (fail) process.exit(1);
