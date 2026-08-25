# CrazyWolves Community

Zvanični sajt i prodavnica CrazyWolves zajednice.

**Dve prodavnice** — merch (šolje, odeća, dodaci) i Wolfpack Store (igre,
gift kartice, Steam ključevi, pretplate) — plus blog i admin panel, na
jednoj ljusci, jednom dizajn sistemu i jednoj bazi.

---

## Pokretanje

```bash
npx serve -l 4321 .
```

Otvori `http://localhost:4321`.

Radi i duplim klikom na `index.html`, bez servera. Skripte su namerno
klasične (ne ES moduli) baš zato — `file://` blokira module.

**Nema build koraka.** Nema `npm install`, nema bundler-a. Ono što je u
repou je ono što se servira.

---

## Fajlovi

| Fajl | Sadrži |
|---|---|
| `index.html` | Ljuska, učitavanje fontova, redosled skripti, pre-boot ekran |
| `cw-config.js` | **Ključevi.** Jedino mesto gde stoje |
| `cw-theme.css` | **Dizajn tokeni.** Svaka boja, font, razmak, radijus, senka |
| `cw-base.css` | Reset, tipografija, raspored, pristupačnost |
| `cw-components.css` | Biblioteka komponenti i sva njihova stanja |
| `cw-pages.css` | Rasporedi stranica + responzivni sistem |
| `cw-images.js` | Registar slika sa dimenzijama i kadriranjem |
| `cw-supabase.js` | Klijent za bazu — prijava, čitanje, upis, otpremanje |
| `cw-hydrate.js` | Puni sajt iz baze; ugrađeni podaci su rezerva |
| `cw-core.js` | Alati, ikone, formatiranje, korpa, ruter, poruke |
| `cw-components.js` | Zaglavlje, navigacija, podnožje, fioke, kartice |
| `cw-data-*.js` | Ugrađeni sadržaj — rezerva kad baza ćuti |
| `cw-pages-*.js` | Prikazi stranica: zajednica, shop, nalog |
| `cw-orders.js` | Slanje porudžbine |
| `cw-admin*.js` | Admin panel — podaci, ekrani, porudžbine, slike |
| `cw-app.js` | Tabela ruta, ponašanje stranica, provera formi, boot |

---

## Baza

Supabase. Kompletna postavka je **jedan fajl**:
[`supabase-postavka.sql`](supabase-postavka.sql) — nalepiš ceo u SQL Editor.
Uputstvo korak po korak je u [BAZA.md](BAZA.md).

Šema je pokrenuta nad pravim Postgres-om pre nego što je puštena u rad —
**31 provera**, uključujući napad u kojem kupac pokušava da obriše proizvod:

```bash
cd supabase/test && npm install && npm test
```

### Ko šta sme

| | anon (posetilac) | kupac | admin |
|---|---|---|---|
| Objavljene objave, aktivni proizvodi | čita | čita | čita |
| Nacrti, neaktivni proizvodi | — | — | čita |
| Svoj profil i svoje porudžbine | — | čita, menja profil | — |
| Sve porudžbine, kupci, Steam kodovi | — | — | čita, menja |
| Proizvodi, objave, cene, podešavanja | — | — | menja |

Razlika između kupca i admina je tabela `admins`. Bez nje bi „prijavljen
korisnik" značilo i kupca — pa bi svaki registrovani kupac mogao da obriše
ceo shop.

### Cene

U **najmanjoj jedinici valute**: `149000` = 1.490 RSD, `1290` = 12,90 €.
Cena u evrima se upisuje **ručno**, nije preračun — shop radi za ceo region
i cena po zemlji sme da se razlikuje iz komercijalnih razloga.

---

## Objavljivanje

Vercel, bez build koraka. Podešavanja i režim „sajt u izradi" su u
[VERCEL.md](VERCEL.md).

Dok je taj režim uključen, koren domena pokazuje informativnu stranicu, a
pun sajt radi na **`/app`**, panel na **`/app#/admin`**.

---

## Dizajn

Jedan izvor istine: [`cw-theme.css`](cw-theme.css). Nijedan drugi fajl ne
sme da upiše boju direktno.

Sajt je zlato na crnom, ali **nije taman svuda**. Zaglavlje, hero blokovi,
CTA trake i podnožje su zlatno-crni; sadržaj koji se čita i kupuje stoji na
kremastoj podlozi. To radi klasa `.on-light`, koja ne piše nove boje
komponentama nego **predefiniše iste tokene** — pa svaka komponenta radi u
obe teme bez ijedne izmene.

Kontrast je meren u pregledaču nad svakom rutom; nijedan tekst nije ispod
WCAG AA praga.

---

## Slike

Sve u `images/`, u WebP formatu. Registar je `cw-images.js` — svaki unos
nosi prave dimenzije (`w`, `h`) i oznaku `crop`, pa pregledač rezerviše
prostor pre učitavanja i raspored ne poskakuje.

`CW.img()` sam bira kadriranje: fotografija sme da se seče, poster sa
tekstom ne. Ako fajl nedostaje, na njegovom mestu se pojavi stilizovani
placeholder — raspored se ne lomi.

Originali su u `Nove slike/`.

---

## Šta još nije gotovo

- **Razdvajanje dve prodavnice u navigaciji** — baza ih razlikuje kolonom
  `shop`, sajt još ne. Digitalni proizvod se trenutno pojavljuje u merch
  mreži.
- **Prava registracija kupca** — dugme „Napravi nalog" sada piše u
  `localStorage`, ne pravi nalog u bazi. `cw-supabase.js` zna `signIn` i
  `signOut`, ali ne i `signUp`.
- **Profil kupca** — istorija kupovine i lični podaci.
- **Admin: porudžbine i Steam kodovi** — tabele i funkcije u bazi postoje,
  ekrani još ne.
- **Kartično plaćanje** — mesto je pripremljeno (`payment_ref`), čeka izbor
  procesora.
- **Podaci firme** u Uslovima korišćenja (naziv, PIB, matični broj, adresa).
- **Pravna provera** teksta o povraćaju, privatnosti i uslovima — sada su
  označeni u interfejsu kao nedovršeni.
