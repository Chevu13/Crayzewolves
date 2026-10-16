# Mejlovi sajta

Sve ide sa **office@wolfpack.rs**, preko **Resend-a**. Dva puta, jer su to
dve različite vrste mejlova:

| Mejl | Ko ga šalje | Gde se menja tekst |
|---|---|---|
| Potvrda naloga (registracija) | Supabase Auth, preko Resend SMTP | Supabase → Authentication → Email Templates |
| Promena lozinke | Supabase Auth, preko Resend SMTP | isto |
| **Potvrda porudžbine** | naša Edge funkcija `send-order-email` | [`../functions/send-order-email/index.ts`](../functions/send-order-email/index.ts) |
| **Promena statusa porudžbine** | ista funkcija (`kind: "status"`) | isto |
| **Dobrodošlica posle prve prijave** | ista funkcija (`kind: "welcome"`) | isto |

---

## 1. ŠTA TREBA PODESITI (jednom)

### Supabase → Edge Functions → Secrets

| Ključ | Vrednost |
|---|---|
| `RESEND_API_KEY` | `re_...` — isti ključ koji stoji u Vercel-u |
| `MAIL_FROM` | `Wolfpack <office@wolfpack.rs>` *(neobavezno)* |

Ovo je jedino što funkciji treba. `SUPABASE_URL` i
`SUPABASE_SERVICE_ROLE_KEY` Supabase dodaje sam.

> Ključ iz Vercel-a ne važi ovde — Vercel i Supabase su dva odvojena
> servera. Isti ključ, dva mesta.

### Supabase → Project Settings → Authentication → SMTP

Za mejlove registracije i promene lozinke (njih šalje sam Supabase):

| Polje | Vrednost |
|---|---|
| Sender email | `office@wolfpack.rs` |
| Sender name | `Wolfpack` |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | isti `re_...` ključ |

### Supabase → Authentication → Email Templates

| Šablon | Subject | Fajl |
|---|---|---|
| Confirm signup | `Potvrdi svoj nalog — Wolfpack` | [`potvrda-naloga.html`](potvrda-naloga.html) |
| Reset password | `Promena lozinke — Wolfpack` | [`nova-lozinka.html`](nova-lozinka.html) |

---

## 2. ADRESE I LINKOVI ŽIVE U BAZI

Funkcija ih čita iz tabele `settings`, pa se menjaju bez novog deploy-a:

| Ključ | Sada | Čemu služi |
|---|---|---|
| `order_email_from` | `Wolfpack <office@wolfpack.rs>` | pošiljalac |
| `order_email_to` | `office@wolfpack.rs` | skrivena kopija svake porudžbine |
| `site_url` | `https://www.wolfpack.rs/app` | linkovi u mejlu |

Promena ide kroz SQL Editor:

```sql
update public.settings set value = 'https://www.wolfpack.rs/app' where key = 'site_url';
```

---

## 3. KAKO RADI

```
kupac potvrdi kasu
      ↓
create_order upiše porudžbinu u bazu        ← gotovo i bez mejla
      ↓
sajt zove send-order-email  { kind: "order" }
      ↓
funkcija pročita porudžbinu, pošalje mejl kupcu + kopiju na office@
      ↓
upiše email_sent_at
```

```
admin u panelu menja status (ili klikne „Označi kao plaćeno")
      ↓
panel zove send-order-email  { kind: "status" }   sa svojim tokenom
      ↓
funkcija proverava da je pozivalac admin
      ↓
mejl kupcu: novo stanje, broj pošiljke, a kod plaćene digitalne
porudžbine i Steam kodovi
```

```
korisnik se prvi put prijavi
      ↓
sajt zove send-order-email  { kind: "welcome" }   sa svojim tokenom
      ↓
funkcija šalje pozdravni mejl i upiše customers.welcomed_at
```

**Pad mejla ne ruši ništa.** Porudžbina je u bazi pre nego što mejl krene;
ako Resend ne odgovori, u panelu je sve, samo `email_sent_at` ostane prazan.

**Jedan mejl po porudžbini.** Potvrda proverava `email_sent_at`, dobrodošlica
`welcomed_at` — osvežavanje stranice ne šalje drugi mejl.

**Ko sme šta:**

| Vrsta | Ko može da pozove |
|---|---|
| `order` | bilo ko, ali samo jednom po porudžbini i na adresu **iz** porudžbine |
| `status` | samo prijavljen admin |
| `welcome` | sam korisnik, za svoju adresu |

---

## 4. PROVERA

1. **Registracija:** napravi nalog → stiže „Potvrdi svoj nalog" sa
   office@wolfpack.rs. Posle prve prijave stiže i „Dobro došao u čopor".
2. **Kupovina:** poruči nešto → stiže „Porudžbina CW-… je primljena", a
   kopija na office@wolfpack.rs.
3. **Status:** u panelu prebaci na Potvrđena → kupcu stiže „Porudžbina je
   potvrđena". Kod digitalne: „Označi kao plaćeno" → mejl nosi Steam kod.

Ako mejl ne stigne:

```sql
select order_number, email, email_sent_at from public.orders
 order by created_at desc limit 5;
```

- `email_sent_at` prazan → mejl nije otišao. Razlog piše u
  **Supabase → Edge Functions → send-order-email → Logs**, i u konzoli
  pregledača (`[CW] Mejl nije poslat: …`).
- Najčešći razlog: `RESEND_API_KEY nije podešen` — tajna nije dodata u
  Supabase (vidi odeljak 1).
- `resend 403` → domen `wolfpack.rs` nije verifikovan u Resend-u, ili se
  šalje sa adrese van tog domena.
