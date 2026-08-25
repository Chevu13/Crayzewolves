# Admin panel

> **Napomena o strukturi sajta.** Sajt je preuređen tako da je shop u prvom
> planu, a blog i zajednica uz njega. Panel to prati: Objave i Proizvodi su
> ravnopravni ekrani, ali podrazumevana vrsta nove objave je novost, jer
> najava proizvoda i drop-a ima više nego dugih tekstova.


Rađen po uzoru na Heng admin — ista podela na bočnu navigaciju i radnu
površinu, isti tok „lista → editor → sačuvaj", ali sa CrazyWolves tokenima
i u vanilla JavaScript-u, jer je sajt takav.

## Otvaranje

```
tvoj-sajt.netlify.app/#/admin
```

Prijava: **bilo koja ispravna imejl adresa i lozinka od šest ili više
znakova.** Nema pravog naloga jer nema servera koji bi ga proverio.

## Šta panel radi

| Ekran | Šta |
|---|---|
| Pregled | Brojevi, poslednje objave, brze radnje |
| Objave | Lista sa pretragom i filterima po vrsti i statusu |
| Editor objave | Markdown, živi pregled, rubrika, slika, oznake, istaknuto |
| Proizvodi | Lista i editor — naziv, cena, stara cena, opis, dostupnost, slika |
| Kategorije | Pregled sa brojem proizvoda, preimenovanje |
| Podešavanja | Naziv, slogan, mreže, cena dostave — plus izvoz i uvoz |

Objave se dele na **novosti** i **blog** kroz polje `type`. Razlog za jedan
model umesto dva: lista, rubrike, oznake i tok objavljivanja su im isti, a
razlika je samo u dužini i nameni. Ako se kasnije pokaže da traže različitu
formu, `type` je već tu kao tačka razdvajanja.

## Ograničenje koje moraš znati

**Izmene se čuvaju u tvom pregledaču, ne na sajtu.**

Panel piše u `localStorage`. To znači:

- izmene vidiš samo ti, samo na tom računaru i u tom pregledaču
- posetioci sajta ih **ne vide**
- brisanje podataka pregledača briše i izmene

To nije previd nego posledica toga što je sajt statički — nema servera koji
bi zapamtio šta si napisao. Panel je potpun kao alat i spreman za backend,
ali dok ga nema, promene ne napuštaju tvoj računar.

Zato postoji **Izvezi sve** u Podešavanjima: preuzme JSON sa svim objavama,
proizvodima i podešavanjima. Taj fajl se može preneti na drugi računar
(Uvezi) ili predati programeru za ubacivanje u bazu.

## Kako se dodaje pravi backend

Sve što panel čita i piše ide kroz `CW.api` u `cw-admin-data.js`. Metode su
namerno asinhrone iako trenutni adapter radi sinhrono — kada dođe server,
ekrani se ne diraju.

Zamena izgleda ovako:

```js
// bilo:
api.posts = collection('posts', seedPosts, 'post');

// postaje:
api.posts = {
  all:    ()        => fetch('/api/posts').then(r => r.json()),
  get:    (id)      => fetch('/api/posts/' + id).then(r => r.json()),
  create: (data)    => fetch('/api/posts', {
                         method: 'POST',
                         headers: { 'Content-Type': 'application/json' },
                         body: JSON.stringify(data)
                       }).then(r => r.json()),
  update: (id, p)   => fetch('/api/posts/' + id, {
                         method: 'PATCH',
                         headers: { 'Content-Type': 'application/json' },
                         body: JSON.stringify(p)
                       }).then(r => r.json()),
  remove: (id)      => fetch('/api/posts/' + id, { method: 'DELETE' })
};
```

Isto za `products`, `categories` i `settings`. Nijedan ekran se ne menja.

Za `session.login` isto — pravi backend vraća kolačić, a ne upisuje ništa u
`localStorage`.

## Bezbednost — pročitaj ovo

Zaštita rute (`CW.admin.guard`) sprečava da neko slučajno otvori panel.
**To nije bezbednost.** Ceo kod je u pregledaču i može se zaobići za minut.

Dok se ne poveže server koji proverava svaki zahtev, tretiraj panel kao
demonstraciju, ne kao zaključana vrata. `robots.txt` traži od pretraživača da
ga preskoče, ali i to je molba, ne brava.

Ono što **jeste** rešeno: telo objave se renderuje kroz `CW.md`, koji prvo
ceo ulaz eskejpuje pa tek onda ubacuje dozvoljene tagove. Provereno na
`<script>`, `javascript:` linkovima, `onerror` atributu i `<iframe>` — nijedan
ne prolazi. Taj redosled (escape → markdown) ne sme da se obrne.

## Slike

Biraju se iz registra u `cw-images.js`, iz spiska postojećih. Otpremanje
novih slika traži server koji će ih negde smestiti — Heng za to koristi
Supabase Storage, isto bi radilo i ovde.

## Šta nije urađeno

- **Porudžbine** — panel ih prikazuje kao broj, ali nema ekran, jer sajt
  još nema pravu naplatu ni mesto gde bi se porudžbina sačuvala.
- **Dodavanje i brisanje kategorija** — samo preimenovanje. Brisanje
  kategorije sa proizvodima traži odluku šta biva sa tim proizvodima.
- **Zakazivanje objave** za budući datum.
- **Više naloga i uloge** — traži backend.
