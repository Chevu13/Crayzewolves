# Postavljanje baze — korak po korak

Ceo posao je **jedan fajl**: [`supabase-postavka.sql`](supabase-postavka.sql).

Stari `supabase-schema.sql`, `supabase-orders.sql` i `supabase-lager.sql` više
ne trebaju — sadržaj im je ušao u novi fajl, a njih sam sklonio u
`supabase/staro/` da se ne pomešaju.

> **Stari Supabase projekat više ne postoji.** Adresa `fhwctgnendvbkwhoevbi.supabase.co`
> se ne rezolvuje — projekat je obrisan. Anon ključ koji stoji u `cw-supabase.js`
> ne vredi ništa. Pravimo nov.

---

## 1. Napravi projekat

[supabase.com](https://supabase.com) → **New project**

| Polje | Šta upisati |
|---|---|
| Name | `crazywolves` |
| Database Password | Generiši i **sačuvaj ga** — treba za direktan pristup bazi |
| Region | **Frankfurt (eu-central-1)** — najbliži Srbiji, najmanje kašnjenje |
| Plan | Free je dovoljan za početak |

Pravljenje traje minut-dva.

---

## 2. Pokreni SQL

**SQL Editor** → **New query** → nalepi **ceo** `supabase-postavka.sql` → **Run**.

Traje 5–10 sekundi. Na kraju ispisuje tabelu koja izgleda ovako:

| tabela | rls_ukljucen | broj_pravila |
|---|---|---|
| admins | true | 1 |
| currencies | true | 2 |
| customers | true | 2 |
| order_events | true | 2 |
| order_items | true | 1 |
| orders | true | 2 |
| post_categories | true | 2 |
| posts | true | 2 |
| product_keys | true | 1 |
| products | true | 2 |
| settings | true | 2 |
| shop_categories | true | 2 |

**Ako je ijedan `rls_ukljucen` na `false`, stani i javi mi.** To znači da su
podaci otvoreni svakome ko zna adresu.

Skripta sme da se pokrene više puta — ništa ne kvari i ne briše tvoje izmene.

---

## 3. Napravi sebi nalog

**Authentication** → **Users** → **Add user** → **Create new user**

- upiši svoj imejl i lozinku
- **„Auto Confirm User" ostavi UKLJUČENO** (inače moraš da potvrđuješ mejlom)

---

## 4. Upiši se kao admin — bez ovoga ništa ne radi

**SQL Editor** → nova upitnica → zameni mejl svojim i pokreni:

```sql
insert into public.admins (user_id, email)
select id, email from auth.users where email = 'tvoj@mejl.com'
on conflict (user_id) do nothing;

select * from public.admins;
```

Drugi red mora da vrati **tvoj red**. Ako je tabela prazna, panel će te pustiti
da se prijaviš ali nećeš moći ništa da sačuvaš.

### Zašto ovaj korak uopšte postoji

Stara šema je imala pravilo **„upisivati sme svaki prijavljen korisnik"**. Dok
si ti bio jedini prijavljen korisnik, to je radilo. Sada dodajemo naloge
kupaca — a isto pravilo bi značilo da **svaki registrovani kupac sme da obriše
sve proizvode, promeni cene i objavi šta hoće na blogu**.

Zato sada postoji tabela `admins`. Ko je u njoj — sme sve. Ko nije — vidi shop
i svoje porudžbine, i ništa više. Svaki nalog napravljen kroz sajt je kupac.

---

## 5. Uzmi ključeve

**Settings** → **API**:

| Ključ | Gde ide |
|---|---|
| **Project URL** | u `cw-config.js` — javno, sme u git |
| **anon public** | u `cw-config.js` — javno, sme u git |
| **service_role** | **NIGDE u sajt.** Samo u Supabase Edge Functions secrets |

`service_role` zaobilazi sva pravila iz koraka 2. Ako završi u pregledaču,
cela zaštita pada.

Pošalji mi prva dva i povezujem sajt.

### Zašto anon ključ sme da stoji u kodu

Zato što je javan po nameni — svako ko otvori sajt može da ga pročita iz izvora
stranice. Zaštita nije u tajnosti ključa nego u pravilima iz koraka 2, koja se
primenjuju na svaki zahtev bez obzira na to ko ga šalje.

---

## 6. Adrese za prijavu

**Authentication** → **URL Configuration**:

| Polje | Vrednost |
|---|---|
| Site URL | adresa sa Vercela, npr. `https://crazywolves.vercel.app` |
| Redirect URLs | ista adresa + `http://localhost:4321` za lokalni rad |

Bez ovoga potvrda registracije i resetovanje lozinke ne rade.

---

## Šta je baza dobila

### Dve prodavnice

Kolona `shop` na proizvodu i kategoriji: `merch` ili `digital`.

- **Merch** — šolje, odeća, dodaci. Fizička roba, dostava, pouzeće, lager.
- **Wolfpack Store** — igre, gift kartice, ključevi, pretplate. Bez dostave,
  bez pouzeća, zaliha je broj slobodnih kodova.

Baza sama odbija besmislice: digitalni proizvod ne može pouzećem, i ne može da
stoji u merch prodavnici.

### Steam kodovi

Tabela `product_keys` — **jedan red je jedan kod**.

Proizvod uneseš jednom. Posle toga samo dosipaš kodove. Kad neko kupi, funkcija
`assign_keys()` uzme prvi slobodan, označi ga prodatim i veže za porudžbinu.

Zašto red po kodu, a ne spisak u polju proizvoda:

- kod mora da bude jedinstven u celoj bazi, da se isti ne proda dvaput
- mora da se zna kojoj je porudžbini otišao i kada
- dva kupca koji u istoj sekundi kupe poslednja dva koda moraju da dobiju
  **različite** — to rešava `for update skip locked`, što nad poljem sa
  spiskom ne bi bilo moguće

### Statusi porudžbine

`Nova → Potvrđena → Poslata → Preuzeta`

Dodao sam i **Otkazana**, iako nije traženo: bez nje otkazana porudžbina zauvek
stoji kao aktivna, roba se ne vraća na lager, a Steam kod ostaje zauvek prodat
nekome ko nije platio. Otkazivanje vraća oboje.

Svaka promena se sama upisuje u `order_events` — ne oslanja se na to da panel
to uradi.

**Digitalni proizvodi nemaju statuse.** Za njih postoji pogled `digital_sales`:
šta je prodato, kome, kada i koji je kod otišao.

### Nalozi kupaca

Tabela `customers`, vezana 1:1 na nalog. Profil se pravi **sam** pri
registraciji — da se pravi iz pregledača, kupac bi mogao da napravi profil sa
tuđim imejlom.

Kupac vidi svoje porudžbine na dva načina: one vezane za njegov nalog, i one
poručene **bez naloga sa istim imejlom**. Zato porudžbina napravljena pre
registracije ipak osvane u profilu.

---

## Provereno, ne pretpostavljeno

Šema je pokrenuta nad **pravim Postgres-om** (PGlite, WASM build PG 16) pre
nego što je stigla do tebe. Testovi su u `supabase/test/`:

```bash
cd supabase/test && npm install && npm test
```

Provereno je da:

| | |
|---|---|
| ✓ | skripta prolazi i drugo pokretanje ne duplira podatke |
| ✓ | prolazi i kad se ceo fajl pusti kao jedna transakcija (tako radi Supabase SQL Editor) |
| ✓ | **kupac ne može da obriše proizvod ni da promeni cenu** — provereno napadom, cena posle stoji netaknuta |
| ✓ | kupac ne može da objavi na blogu |
| ✓ | kupac ne vidi nijedan Steam kod |
| ✓ | nacrti se ne vide ni posetiocu ni prijavljenom kupcu |
| ✓ | profil se pravi sam pri registraciji, sa imenom iz registracije |
| ✓ | isti Steam kod ne može dvaput u bazu |
| ✓ | dve porudžbine iste igre dobijaju **različite** kodove |
| ✓ | kupac vidi svoju porudžbinu, tuđu ne; posetilac nijednu |
| ✓ | gost-porudžbina se poklapa po imejlu posle registracije |
| ✓ | istorija beleži svaku promenu statusa, vreme slanja se upisuje samo |
| ✓ | otkazivanje vraća šolju na lager i oslobađa kod — a ne dira kodove drugih porudžbina |
| ✓ | baza odbija: digitalno pouzećem, digitalno u merch shopu, staru cenu nižu od nove, lager u minusu, dve podrazumevane valute |

**31 provera, sve prolaze.**

---

## Šta još nije povezano

Baza je spremna, sajt još ne zna za nju. Sledeće što radim:

1. `cw-config.js` — jedno mesto za URL i anon ključ
2. Prijava i profil kupca (istorija kupovine + lični podaci, ništa više)
3. Dve prodavnice u navigaciji
4. Admin: porudžbine sa statusima, Steam kodovi, jednostavniji editor objava
5. Edge funkcija `create-order` prilagođena novim statusima
6. Git i Vercel

Dok to ne završim, poručivanje sa sajta ne radi — trenutni kod još govori
starim nazivima statusa.
