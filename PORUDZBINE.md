# Porudžbine i mejl potvrde

## Korak 1 — SQL

Supabase → SQL Editor → nalepi **`supabase-orders.sql`** → Run.

Na kraju izlazi tabela sa `orders` i `order_items`, obe sa `rls_ukljucen = t`.

Pravi dve tabele i dodaje proizvodima dva polja: `fulfillment`
(fizičko / digitalno) i `allow_cod` (sme li pouzećem).

## Korak 2 — Resend

1. Otvori nalog na [resend.com](https://resend.com) — besplatno 3.000 mejlova mesečno
2. **API Keys** → Create API Key → kopiraj ključ (počinje sa `re_`)

Dok nemaš domen, Resend šalje sa `onboarding@resend.dev` i **samo na adresu
kojom si otvorio nalog**. Za testiranje je to tačno ono što ti treba — otvori
nalog svojim Gmail-om i potvrde stižu tamo.

Kad kupiš domen: **Domains** → Add Domain → upiši tri DNS zapisa (SPF, DKIM,
DMARC) → onda promeni `order_email_from` u tabeli `settings` na
`CrazyWolves <porudzbine@crazywolves.rs>`.

## Korak 3 — Edge funkcija

**Ako imaš Supabase CLI:**

```bash
npx supabase login
npx supabase link --project-ref fhwctgnendvbkwhoevbi
npx supabase secrets set RESEND_API_KEY=re_tvoj_kljuc
npx supabase functions deploy create-order --no-verify-jwt
```

**Ako nemaš CLI**, kroz sajt:

1. Supabase → **Edge Functions** → **Deploy a new function**
2. Ime: `create-order`
3. Nalepi sadržaj `supabase/functions/create-order/index.ts`
4. Isključi **Verify JWT** — kupac koji poručuje nije prijavljen
5. **Settings → Edge Functions → Secrets** → dodaj `RESEND_API_KEY`

`SUPABASE_URL` i `SUPABASE_SERVICE_ROLE_KEY` Supabase dodaje sam.

## Korak 4 — kome stiže kopija

U tabeli `settings`, ključ `order_email_to` — tu upiši svoj Gmail. Svaka
porudžbina ide kupcu, a tebi kao skrivena kopija.

---

## Kako radi

```
kupac popuni kasu
      ↓
sajt šalje SAMO: id proizvoda, količinu, podatke o kupcu
      ↓
Edge funkcija čita cene IZ BAZE, sabira, proverava pravila
      ↓
upisuje porudžbinu i stavke
      ↓
šalje mejl kupcu + kopiju tebi
      ↓
sajt prikazuje potvrdu sa iznosom KOJI JE VRATIO SERVER
```

### Zašto server računa cenu

Da pregledač šalje cenu, svako bi mogao da otvori alatke za programere,
promeni jedan broj i naruči duks za jedan dinar. Provereno: kada pregledač
pošalje cenu `1`, server upiše `169000` — onu iz baze.

### Pravila koja server sam sprovodi

| Situacija | Šta se desi |
|---|---|
| Digitalno + pouzećem | Odbijeno — nema kurira da naplati kod poslat mejlom |
| Digitalno + kartica | Prolazi, bez troška dostave, status „čeka uplatu" |
| Fizička roba bez adrese | Odbijeno |
| Nepostojeći proizvod | Odbijeno |
| Količina 0 ili preko 20 | Odbijeno |
| Neispravan imejl | Odbijeno |
| Proizvod nije na stanju | Odbijeno |
| Nema cene u traženoj valuti | Odbijeno — bolje greška nego pogrešan iznos |

### Statusi

- **kartica** → `pending_payment` (čeka uplatu; ovde ide procesor kad ga izabereš)
- **pouzeće i uplata na račun** → `confirmed` odmah

### Ako mejl ne prođe

Porudžbina **ostaje u bazi**. Slanje mejla je odvojeno od upisa — pad
provajdera ne sme da poništi porudžbinu. Kolona `email_sent_at` pokazuje
da li je potvrda otišla.

---

## Testiranje na Vercelu

1. Dodaj proizvod u korpu
2. Kasa → popuni podatke → **Plaćanje pouzećem**
3. Potvrda stiže na Gmail kojim si otvorio Resend nalog

Za digitalno: postavi proizvodu `fulfillment = 'digital'` i `allow_cod = false`,
pa proveri da pouzeće bude odbijeno.

## Šta još nije urađeno

- **Kartično plaćanje** — mesto je pripremljeno (`payment_ref`,
  status `pending_payment`), čeka izbor procesora
- **Ekran porudžbina u panelu** — tabele postoje, pregled još ne
- **Skidanje sa lagera** posle porudžbine
- **Mejl o slanju pošiljke** sa brojem za praćenje
