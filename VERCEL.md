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

## Režim „sajt u izradi"

**Početna stranica JESTE pokazna stranica.** `index.html` je fajl sa banerom
i dugmetom za Discord — nije preusmerenje, nije pravilo, nego sam fajl na
korenu.

| Adresa | Šta servira |
|---|---|
| `/` | `index.html` — pokazna stranica |
| `/app` | `app.html` — pun sajt |
| `/app#/admin` | admin panel |
| bilo šta drugo | `index.html` — pokazna stranica |

### Zašto fajl, a ne pravilo

Prvo je ovde stajalo pravilo `{ "source": "/", "destination": "/uskoro.html" }`.
**Nije radilo, i nije moglo da radi.** Na Vercelu se `rewrites` primenjuju tek
ako na toj adresi NE postoji fajl — a na `/` je stajao `index.html`, pa se
pravilo nikad nije izvršilo. Provereno na živom sajtu: koren je vraćao pun
sajt, ne pokaznu stranicu.

Zato je sada obrnuto: fajl na korenu je pokazna stranica, a sajt je pomeren u
`app.html`. Nema pravila koje može da zakaže, i radi isto na Vercelu, na
Netlify-u, na običnom serveru i pri otvaranju foldera duplim klikom.

### Kad se sajt pušta uživo

```bash
git rm index.html
git mv app.html index.html
```

Pa u `vercel.json` obriši oba pravila iz `rewrites` — više ne trebaju.

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
