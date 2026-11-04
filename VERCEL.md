# Vercel

Statički sajt, bez build koraka. Podešavanja pri uvozu:

| Polje | Vrednost |
|---|---|
| Application Preset | **Other** |
| Root Directory | `./` |
| Build and Output Settings | ostaviti prazno |
| Environment Variables | **ostaviti prazno** |

## Zašto nema environment promenljivih

Vercel env promenljive rade na dva mesta: u serverskoj funkciji, ili tokom
build koraka koji ih ubaci u kod. Ovaj sajt nema ni jedno ni drugo — nema
`/api` foldera, nema `package.json` u korenu, i nijedan fajl ne pominje
`process.env`. Browser nikad ne vidi Vercel env promenljive.

Ključevi žive ovde:

| Ključ | Gde | Zašto tu |
|---|---|---|
| Project URL | `cw-config.js`, u repou | Javan — vidi se u izvoru stranice |
| **anon** ključ | `cw-config.js`, u repou | Javan po nameni; zaštita je RLS, ne tajnost |
| **service_role** | Supabase → Edge Functions → Secrets | Zaobilazi sva pravila. Nikad na Vercel, nikad u repo |
| `RESEND_API_KEY` | isto tamo | Za mejl potvrde porudžbine |

## Komentari u vercel.json

**Nema ih i ne sme ih biti.** Vercel proverava `vercel.json` po svojoj šemi i
odbija svaki ključ koji ne poznaje — uključujući `"//"`, uobičajen trik za
komentar u JSON-u. Greška pri uvozu izgleda ovako:

```
Invalid request: should NOT have additional property `//`. Please remove it.
```

Zato objašnjenja stoje u ovom fajlu, a `vercel.json` ostaje čist.

## Sajt je na korenu

`index.html` je ljuska sajta. Nema preusmerenja ni pravila na putu do
početne — fajl stoji na korenu, pa radi isto na Vercelu, na Netlify-u, na
običnom serveru i pri otvaranju foldera duplim klikom.

| Adresa | Šta servira |
|---|---|
| `/` | `index.html` — sajt |
| `/app` | isto, preko `rewrites` — stara adresa iz mejlova i Supabase podešavanja |
| `/#/admin` | admin panel |
| `/najava` | `najava.html` — povučena pokazna stranica |
| bilo šta drugo | `index.html` — hash ruter pokaže 404 ekran |

### Kako je bilo pre

Dok je trajao režim „sajt u izradi", na korenu je stajala pokazna stranica, a
sajt je bio u `app.html`, na adresi `/app`. Razlog što je pokazna stranica
bila *fajl*, a ne pravilo: na Vercelu se `rewrites` primenjuju tek ako na toj
adresi NE postoji fajl, pa pravilo `{ "source": "/", ... }` nikad nije moglo
da se izvrši dok god `index.html` stoji na korenu.

Na dan lansiranja je zato urađeno `git mv`, ne menjanje pravila:

```bash
git mv index.html najava.html
git mv app.html index.html
```

`/app` je ostao da radi namerno — na njega pokazuju linkovi iz već poslatih
mejlova i **Site URL / Redirect URLs** u Supabase podešavanjima. Kad se tamo
sve prebaci na koren, to pravilo može da se obriše.

## Keširanje

| Šta | Koliko | Zašto |
|---|---|---|
| `images/*` | godinu dana, `immutable` | 2 MB banera koji se menjaju retko |
| sve ostalo | Vercel-ov podrazumevani | `max-age=0, must-revalidate` — svaka izmena je odmah vidljiva, a nepromenjen fajl vraća jeftin 304 |

Ranije je ovde stajalo i posebno pravilo za `cw-*.js` i `cw-*.css`. Izbačeno je
iz dva razloga: Vercel ga je odbijao (vidi dole), a podrazumevano ponašanje je
ionako bolje od onoga što je pravilo radilo.

## Šablon adrese u `source` nije regex

Vercel koristi **path-to-regexp**, ne običan regularni izraz. Ugnježdena grupa
ruši deploy:

```
Error: Header at index 2 has invalid `source` pattern "/(cw-.*\.(js|css))".
```

Dozvoljeno je jedno `(.*)` ili imenovani parametar `/:ime(sablon)`. Ako ovde
ikad zatreba složeniji šablon, napiši ga kao dva odvojena unosa umesto kao
jedan sa `|` unutar grupe.

## Posle prvog deploy-a

**Supabase → Authentication → URL Configuration:**

- **Site URL:** adresa sa Vercela
- **Redirect URLs:** ista adresa + `http://localhost:4321`

Bez toga potvrda registracije i resetovanje lozinke ne rade.

## `_redirects`

Netlify ekvivalent istih pravila. Vercel ga ignoriše, Netlify ignoriše
`vercel.json` — drže se usklađeni dok traje selidba sa Netlify-a.
