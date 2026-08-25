/* Supabase SQL Editor pusta ceo fajl kao JEDNU transakciju.
   Ako bilo sta u fajlu ne sme unutar transakcije, ovde ce puci. */
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import fs from 'node:fs';

const SQL = fs.readFileSync(new URL('../../supabase-postavka.sql', import.meta.url), 'utf8');
const STUB = fs.readFileSync(new URL('./stub.sql', import.meta.url), 'utf8');
const db = new PGlite({ extensions: { pgcrypto } });

await db.exec('create extension if not exists pgcrypto;');
await db.exec(STUB);

try {
  await db.exec('begin;\n' + SQL + '\ncommit;');
  console.log('✓ ceo fajl prolazi kao JEDNA transakcija (kao u Supabase SQL Editoru)');
} catch (e) {
  console.error('✗ pada u transakciji:', e.message);
  process.exit(1);
}

/* Drugi put, opet u jednoj transakciji — Supabase korisnik ume da pokrene dvaput. */
try {
  await db.exec('begin;\n' + SQL + '\ncommit;');
  console.log('✓ i drugo pokretanje u transakciji prolazi');
} catch (e) {
  console.error('✗ drugo pokretanje pada:', e.message);
  process.exit(1);
}

const r = await db.query(`select count(*)::int n from products`);
console.log('  proizvoda u bazi:', r.rows[0].n, '(nije se udvostrucilo)');
