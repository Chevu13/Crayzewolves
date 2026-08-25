# Pokretanje — redosled

## 1. Baza (Supabase → SQL Editor, jedan po jedan)

```
1. supabase-schema.sql     tabele, RLS, valute, početni sadržaj
2. supabase-orders.sql     porudžbine, pravila plaćanja
3. supabase-lager.sql      zalihe, istorija statusa, praćenje pošiljke
```

Svaki sme da se pokrene više puta.

## 2. Nalog za panel

Authentication → Users → **Add user** → tvoj mejl i lozinka.
Ostavi „Auto Confirm User" uključeno.

## 3. Resend

1. Nalog na resend.com — **otvori ga baš Gmail-om na koji hoćeš potvrde**
2. API Keys → kopiraj ključ (`re_...`)

Bez domena Resend šalje samo na adresu vlasnika naloga. Za testiranje dovoljno.

## 4. Edge funkcija

Supabase → Edge Functions → Deploy a new function
- ime: `create-order`
- sadržaj: `supabase/functions/create-order/index.ts`
- **isključi Verify JWT** (kupac nije prijavljen)
- Secrets → dodaj `RESEND_API_KEY`

## 5. Vercel

Prevuci raspakovan folder ili poveži repo. Nema build koraka.

---

# Šta panel radi

| Ekran | |
|---|---|
| Pregled | Brojevi, promet, upozorenje kad je nešto pri kraju |
| **Porudžbine** | Lista, pretraga po broju/imenu/mejlu, filter po statusu |
| **Porudžbina** | Stavke, kupac, istorija, promena statusa, broj pošiljke |
| Objave | Blog — pisanje, Markdown, slika, rubrike |
| Proizvodi | Cene u RSD i EUR, dostupnost, slika |
| Kategorije, Podešavanja | |

Ulaz: `tvoj-sajt.vercel.app/#/admin`

## Statusi porudžbine

`Čeka uplatu → Potvrđena → U pripremi → Poslata → Isporučena`

- **Otkazana** vraća robu na lager
- **Isporučena** označava plaćanje kao izvršeno
- Svaka promena se upisuje u istoriju

## Zalihe

- Skidaju se pri porudžbini, u jednoj naredbi — dva kupca ne mogu uzeti isti poslednji komad
- Digitalna roba (`track_stock = false`) se ne troši
- Kad nema dovoljno, porudžbina se odbija sa jasnom porukom
- Otkazivanje vraća komade nazad

## Ostalo pre pravog rada

- **Domen** — bez njega potvrde stižu samo tebi
- **Podaci firme** u Uslovima (naziv, PIB, matični broj, adresa)
- **Kartica** — mesto pripremljeno, čeka procesora
- **PDV na digitalnu robu** van Srbije se plaća u zemlji kupca — proveri sa knjigovođom
