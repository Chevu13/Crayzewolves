# Povezivanje sa Supabase-om

## Korak 1 — pokreni SQL

Supabase → **SQL Editor** → **New query** → nalepi ceo `supabase-schema.sql` → **Run**.

Na kraju treba da izađe tabela sa pet redova, svi sa `rls_ukljucen = t`.
Ako je tako, prošlo je.

Skripta se sme pokrenuti više puta — ništa ne kvari i ne briše tvoje izmene.

## Korak 2 — napravi nalog

Supabase → **Authentication** → **Users** → **Add user** → **Create new user**.

Upiši svoju imejl adresu i lozinku i **isključi** „Auto Confirm User" samo ako
želiš potvrdu mejlom; inače ostavi uključeno da odmah možeš da se prijaviš.

To je nalog kojim se ulazi u admin panel. Od tog trenutka lozinka nešto znači —
za razliku od sadašnjeg demo panela.

## Korak 3 — gotovo

Panel je povezan. Radi ovako:

- prijava ide preko Supabase Auth (pravi nalog, prava lozinka)
- izmene se čuvaju u bazu i **vide ih posetioci**
- sajt čita objave i proizvode iz baze pri svakom otvaranju
- cene u dinarima i evrima, obe ručne

Ako baza ne odgovori u dve sekunde, sajt se iscrta sa ugrađenim sadržajem.
Bolje malo stariji sadržaj nego prazan ekran.

## Šta je napravljeno

| Tabela | Sadrži |
|---|---|
| `posts` | Objave — blog i novosti zajedno, jedna vrsta |
| `post_categories` | Rubrike bloga |
| `products` | Proizvodi |
| `shop_categories` | Kategorije shopa |
| `settings` | Naziv, slogan, mreže, dostava |
| `currencies` | RSD i EUR — simbol, položaj, rezervni kurs |

Plus bucket `media` za slike.

## Cene — dve valute, obe ručno

Shop radi za ceo Balkan, pa svaki proizvod ima dve cene koje upisuješ **odvojeno**:

| Polje | Jedinica | Primer | Izlazi kao |
|---|---|---|---|
| `price` | pare | `149000` | 1.490 RSD |
| `price_eur` | centi | `1290` | €12,90 |

Evro pokriva Hrvatsku, Sloveniju, Crnu Goru i Kosovo.

**Nije preračun.** Cena u evrima se upisuje ručno baš zato da bi mogla da se
razlikuje iz komercijalnih razloga, a ne samo po kursu. Uporedi:

| Proizvod | Dinari | Upisano | Da se računalo |
|---|---|---|---|
| Šolja | 1.490 RSD | **€12,90** | €12,74 |
| Duks | 5.490 RSD | **€47,90** | €46,92 |
| Stikeri | 590 RSD | **€4,90** | €5,04 |

Kod stikera je evro cena čak *niža* nego po kursu — to je odluka, ne greška.

Ako `price_eur` ostane prazno, sajt računa iz dinarske cene po kursu iz tabele
`currencies`, da posetiocu nikad ne izađe prazno polje. Kurs je tu samo kao
rezerva; proveri ga povremeno.

Dostava je takođe u obe valute: `shipping_flat` / `shipping_flat_eur` i
`free_shipping_over` / `free_shipping_over_eur`.

**Pazi na jedinicu.** Ako u polje za dinare upišeš `1490`, cena će izaći kao
14,90 RSD. U editoru ću polja označiti jasno kad budem povezivao panel.

## Zašto anon ključ sme da stoji u sajtu

Anon ključ je javan po nameni — svako ko otvori sajt može da ga pročita.
Zaštita nije u tajnosti ključa nego u pravilima (RLS) koja su u skripti:

- **anon** čita samo objavljene objave i aktivne proizvode, i **ne može** da piše
- **prijavljen korisnik** može sve

Provereno pokretanjem na pravom Postgres-u:

- brisanje proizvoda kao anon → `permission denied`
- ubacivanje objave kao anon → `permission denied`
- izmena cene kao anon → `permission denied`
- nacrti se anon korisniku uopšte ne prikazuju (vidi 3 objave, admin vidi 4)
- dve podrazumevane valute → baza odbija
- stara cena niža od nove → baza odbija

**Service role ključ nikada ne stavljaj u sajt.** On zaobilazi sva pravila.
