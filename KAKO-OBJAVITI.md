# Objavljivanje na Netlify

1. Otvori https://app.netlify.com/drop
2. Prevuci **ceo raspakovani folder** (ne sam .zip) na stranicu
3. Sajt je za ~20 sekundi živ na adresi tipa `random-ime.netlify.app`
4. Ime se menja u *Site configuration → Change site name*

Za svoj domen (`crazywolves.rs`): *Domain management → Add a domain*,
pa kod registrara postavi Netlify nameservere.

## Šta je već podešeno

| Fajl | Čemu služi |
|---|---|
| `_redirects` | Duboki linkovi rade i ako se pređe na rutiranje bez `#` |
| `netlify.toml` | Keširanje (slike godinu dana, HTML nikad) i sigurnosni headeri |
| `robots.txt` | Dozvoljava indeksiranje, pokazuje na sitemap |
| `sitemap.xml` | Jedna adresa — sajt je jednostrani |

## Lokalno otvaranje

Dupli klik na `index.html` radi bez servera — skripte su namerno klasične
(ne ES moduli), jer `file://` blokira module.

## Slike

Svih 19 slika je u `images/`, u WebP formatu (2.0 MB → 1.5 MB).
`images/og-banner.jpg` je namerno ostao JPEG — Facebook i WhatsApp
ne čitaju pouzdano WebP kada prave pregled linka.

Ako dodaješ novu sliku: ubaci fajl u `images/` i dopiši je u
`cw-images.js`. Ako fajl nedostaje, na njegovom mestu se pojavi
stilizovani placeholder — raspored se ne lomi.


## Kadriranje slika

`CW.img()` sam bira `object-fit`, umesto da svaku sliku slepo seče:

| Situacija | Postupak |
|---|---|
| Slot istog odnosa kao slika (±6%) | `cover` — puni bez gubitka |
| Fotografija (`crop: 'safe'`) | `cover` — sme da se seče |
| Slika **šira** od slota | `contain` — bočno sečenje bi odseklo grb ili natpis |
| Slika **viša** od slota | `cover` + poravnanje na vrh, gde poster nosi naslov |

Svaki unos u `cw-images.js` nosi prave dimenzije (`w`, `h`) i oznaku
`crop`. Dimenzije se ispisuju kao `width`/`height` atributi, pa browser
rezerviše prostor pre učitavanja i raspored ne poskakuje.

Kad se slika uklapa cela, prazan pojas dobija podlogu iz brenda
(`.cw-img--contain`) — tamna karta, dijagonalna vlas i jedan izvor
zlatnog svetla — pa letterbox čita kao postament, ne kao rupa.

**Ako dodaješ novu sliku:** upiši `w`, `h` i `crop` u registar.
Fotografije koje smeju da se seku dobijaju `crop: 'safe'`; sve što
nosi tekst, logo ili je snimak ekrana dobija `crop: 'none'`.


## Obim ove faze

Sajt ima dve celine: **shop** (početna) i **blog**.

Stranice zajednice, usluga, CS2 tima, događaja, partnera i „o nama" su
sklonjene iz navigacije. **Kod im nije obrisan** — stoji netaknut u
`cw-pages-community.js`. Vraćaju se dodavanjem jednog reda u tabelu ruta
u `cw-app.js` i jedne stavke u `CW.nav.primary` u `cw-components.js`.

Njihove stare adrese (`#/zajednica`, `#/cs2`, …) preusmeravaju na početnu
umesto da daju 404, jer stari linkovi sa Discorda i Instagrama i dalje
negde vode.
