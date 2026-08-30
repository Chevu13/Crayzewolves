# Mejlovi — pošiljalac, šabloni i link koji radi

Tri stvari, tim redom. Prva je obavezna — bez nje link iz mejla ne radi.

---

## 1. SITE URL — zbog ovoga link javlja „requested path is invalid"

Link iz mejla je vodio ovde:

```
qesosyszxnzlnmwuhbaq.supabase.co/crayzewolves.rs#access_token=...
                                 ^^^^^^^^^^^^^^
```

Site URL je bio upisan **bez `https://`**, pa ga je Supabase shvatio kao
putanju na svom domenu umesto kao adresu sajta. Otuda greška.

**Supabase → Authentication → URL Configuration:**

| Polje | Vrednost |
|---|---|
| **Site URL** | `https://www.crazywolves.rs/app` |

Mora ceo, sa `https://`, **i sa `/app` na kraju**.

Zašto `/app`: na korenu domena stoji pokazna stranica, koja nema JavaScript
za obradu tokena. Kad Supabase nema drugu adresu, vraća korisnika baš na
Site URL — pa ako je to koren, token stigne na stranicu koja ne ume ništa s
njim da uradi.

**Redirect URLs** — dodaj sve četiri, svaku u svoj red:

```
https://www.crazywolves.rs/app
https://crazywolves.rs/app
https://crayzewolves.vercel.app/app
http://localhost:4321/app.html
```

Bez ovog spiska Supabase odbija adresu koju sajt pošalje i tiho pada nazad
na Site URL.

> Domen `crazywolves.rs` preusmerava na `www.crazywolves.rs`, zato **www**
> verzija ide kao Site URL, a obe stoje u Redirect URLs.

---

## 2. MEJLOVI DA STIŽU SA `info.crazywolves@gmail.com`

Sada stižu sa `noreply@mail.app.supabase.io`, jer se koristi Supabase-ov
ugrađeni servis. On se ne može prebrendirati — mora se uključiti **svoj
SMTP**.

**Supabase → Project Settings → Authentication → SMTP Settings** →
uključi **Enable Custom SMTP**:

| Polje | Vrednost |
|---|---|
| Sender email | `info.crazywolves@gmail.com` |
| Sender name | `CrazyWolves` |
| Host | `smtp.gmail.com` |
| Port | `465` |
| Username | `info.crazywolves@gmail.com` |
| Password | **App Password** (16 znakova) — vidi dole |

### App Password, ne obična lozinka

Gmail ne prima običnu lozinku naloga sa strane servisa. Treba poseban ključ:

1. Google nalog `info.crazywolves@gmail.com` → **Security**
2. Uključi **2-Step Verification** (bez toga nema App Password)
3. **App passwords** → Select app: *Other* → ime: `Supabase`
4. Google ispiše 16 znakova — to ide u polje Password (bez razmaka)

### Šta ovim dobijaš

- mejlovi stižu sa tvoje adrese, ne sa Supabase-ove
- nestaje ograničenje ugrađenog servisa (**2 mejla na sat**), koje je i
  najčešći razlog zašto potvrda „ne stigne"

### Ograničenje koje ostaje

Gmail dozvoljava oko **500 mejlova dnevno**. Za registracije i reset lozinke
je više nego dovoljno. Kad shop krene ozbiljno, prelazi se na svoj domen
(`noreply@crazywolves.rs`) preko Resend-a ili sličnog — gmail.com adresa se
kod njih ne može verifikovati, pa Gmail SMTP ostaje pravi izbor dok se to ne
uradi.

---

## 3. ŠABLONI NA SRPSKOM

Mejlovi su sada na engleskom, Supabase-ovi podrazumevani
(*„Confirm your email address"*, *„Reset your password"*).

**Supabase → Authentication → Email Templates** — za svaki šablon promeni
naslov i nalepi sadržaj fajla u polje **Message body**:

| Šablon | Subject | Fajl |
|---|---|---|
| Confirm signup | `Potvrdi svoj nalog — CrazyWolves` | [`potvrda-naloga.html`](potvrda-naloga.html) |
| Reset password | `Promena lozinke — CrazyWolves` | [`nova-lozinka.html`](nova-lozinka.html) |

Šabloni su u bojama sajta, sa grbom i porukom čopora. Pisani su tabelama i
sa stilovima u samim atributima — Outlook i Gmail brišu `<style>` iz
zaglavlja i ne podržavaju moderan raspored.

---

## 4. MEJL POSLE PORUDŽBINE

Ide **istim putem** — ista Gmail adresa, ista App Password. Nema drugog
servisa i nema drugog naloga.

**Supabase → Edge Functions → Deploy a new function**

- ime: `send-order-email`
- sadržaj: [`../functions/send-order-email/index.ts`](../functions/send-order-email/index.ts)
- **isključi Verify JWT** — kupac koji poručuje nije prijavljen

Pa **Edge Functions → Secrets**, dodaj:

| Ključ | Vrednost |
|---|---|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | `info.crazywolves@gmail.com` |
| `SMTP_PASS` | **ista App Password** iz odeljka 2 |
| `SMTP_FROM` | `CrazyWolves <info.crazywolves@gmail.com>` |

`SUPABASE_URL` i `SUPABASE_SERVICE_ROLE_KEY` Supabase dodaje sam.

### Kako radi

```
kupac potvrdi kasu
      ↓
create_order upiše porudžbinu u bazu        ← ovo je gotovo i bez mejla
      ↓
sajt zove send-order-email sa brojem porudžbine
      ↓
funkcija pročita porudžbinu, pošalje mejl kupcu + kopiju tebi
      ↓
upiše email_sent_at
```

**Pad mejla ne ruši prodaju.** Porudžbina je u bazi pre nego što se mejl
uopšte pošalje; ako Gmail ne odgovori, u panelu je i dalje sve, samo
`email_sent_at` ostane prazan.

**Jedan mejl po porudžbini.** Funkcija proverava `email_sent_at`, pa
osvežavanje stranice potvrde ne šalje drugi mejl — a i štiti od toga da
neko gađa funkciju tuđim brojevima porudžbina.

**Adresa primaoca se ne prima spolja** nego čita iz same porudžbine.

### Provera

1. Naruči nešto na `https://www.crazywolves.rs/app`
2. Mejl stigne na adresu koju si upisao na kasi, sa
   `info.crazywolves@gmail.com`
3. Kopija stigne na `info.crazywolves@gmail.com`
4. U bazi: `select order_number, email_sent_at from orders order by created_at desc limit 1;`
   — `email_sent_at` mora biti popunjen

Ako `email_sent_at` ostane prazan, otvori konzolu pregledača na stranici
potvrde — tamo piše tačan razlog (`[CW] Mejl potvrde nije poslat: ...`).

---

## Provera da sve radi

1. Otvori `https://www.crazywolves.rs/app#/nalog/zaboravljena`
2. Upiši svoju adresu → **Pošalji link**
3. Mejl treba da stigne **sa `info.crazywolves@gmail.com`**, na srpskom
4. Klik na dugme otvara `.../app#/nalog/nova-lozinka` sa formom za novu
   lozinku — **ne** Supabase grešku
5. Upiši novu lozinku dvaput → „Lozinka je promenjena"
6. Odjavi se i prijavi novom lozinkom

Ako korak 4 i dalje javlja `requested path is invalid`, Site URL nije
sačuvan — vrati se na odeljak 1.

---

## Adresa u samom sajtu

`info.crazywolves@gmail.com` je upisana i u sajt (podnožje pokazne stranice,
strukturirani podaci za pretragu, podrazumevana podešavanja panela).

Za bazu koja **već postoji** seed ne menja postojeće redove, pa pokreni
[`../../supabase-dopuna-04.sql`](../../supabase-dopuna-04.sql).
