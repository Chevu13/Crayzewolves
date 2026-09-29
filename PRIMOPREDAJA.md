# Primopredaja sajta

Šta gde živi, kojim redom se prenosi na klijenta i šta mora da se promeni
posle predaje. Sve se prenosi — ništa se ne pravi iznova.

---

## 1. Šta sve čini sajt

| Usluga | Šta drži | Gde |
|---|---|---|
| **GitHub** | Kod sajta i admin panela | `github.com/Chevu13/Crayzewolves` |
| **Vercel** | Objavljivanje sajta (svaki `git push` = novo izdanje) | projekat povezan sa tim repozitorijumom |
| **Supabase** | Baza: objave, proizvodi, porudžbine, nalozi kupaca, slike | projekat `qesosyszxnzlnmwuhbaq` |
| **Domen** | `crazywolves.rs` (prelazi na `wolfpack.rs`) | registrar `.rs` domena |
| **Gmail** | `info.crazywolves@gmail.com` — šalje mejlove sajta | Google nalog |
| **Google Cloud** | Prijava preko Google-a | OAuth klijent |

Sajt stoji na `/app`, na korenu domena je pokazna stranica „u izradi".
Admin panel je na `/app#/admin`.

---

## 2. Redosled prenosa

Klijentu prvo treba nalog na GitHub-u, Supabase-u i Vercel-u — dovoljna je
prijava preko Google-a.

### Korak 1 — GitHub
Repozitorijum → **Settings → General → Danger Zone → Transfer ownership** →
upiši njegov username. Istorija i grane ostaju, stari linkovi se
preusmeravaju. Kad prihvati, neka te vrati kao saradnika
(**Settings → Collaborators**).

### Korak 2 — Supabase
1. Klijent napravi svoju organizaciju i pozove te u nju
   (**Organization → Team → Invite**).
2. Ti: **Project Settings → General → Transfer project** → njegova
   organizacija.

Adresa projekta i ključevi ostaju isti, pa se u kodu **ne menja ništa**.
Naplata prelazi na njegovu organizaciju.

### Korak 3 — Vercel
**Project Settings → General → Transfer Project** → njegov nalog.
Posle prenosa on ponovo poveže repozitorijum (**Settings → Git → Connect**),
jer veza sa GitHub-om ne ide uvek uz projekat. Domen prelazi sa projektom.

### Korak 4 — Domen
Kod registrara zatraži **authorization code** i prosledi mu ga; on domen
prebacuje na svoj nalog. Sme i da ostane kod tebe dok traje saradnja.

### Korak 5 — Mejl
`info.crazywolves@gmail.com` se ne „prenosi" — to je Gmail nalog. Ili mu
predaš lozinku, ili on napravi svoj, pa se menja na tri mesta:

1. **Supabase → Project Settings → Authentication → SMTP Settings**
2. **Supabase → Edge Functions → Secrets**: `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
3. Baza: `supabase-dopuna-04.sql` sa novom adresom

Nova adresa traži novu **App Password** (Google nalog → Security →
2-Step Verification → App passwords).

### Korak 6 — Google prijava
**Google Cloud → IAM & Admin → IAM** → dodaj njegov mejl kao **Owner**.
Posle toga i sam može da premesti projekat.

### Korak 7 — Admin na sajtu
Kad napravi nalog na sajtu, u **Supabase → SQL Editor**:

```sql
insert into public.admins (user_id, email, note)
select id, email, 'vlasnik'
  from auth.users where lower(email) = 'njegov@mejl.com'
on conflict (user_id) do nothing;
```

Kome treba oduzeti pristup:

```sql
delete from public.admins where lower(email) = 'stara@adresa.com';
```

---

## 3. Šta promeniti posle predaje

- **Lozinke:** Gmail nalog, Supabase, Vercel, GitHub — sve što je bilo tvoje.
- **App Password** za SMTP — stara se poništava čim se promeni lozinka Gmail-a.
- **Admini u bazi** — proveri spisak: `select email, note from public.admins;`
- **Service role ključ** (Supabase → API Keys) — ako je negde deljen, uradi
  **Reset**. Taj ključ nikad ne sme u kod ni u pregledač.

Anon ključ u `cw-config.js` je javan po dizajnu i ostaje kakav jeste —
bazu čuva RLS, ne tajnost tog ključa.

---

## 4. Ako se menja domen

1. **Vercel → Settings → Domains** → dodaj `wolfpack.rs` i `www.wolfpack.rs`.
2. **Supabase → Authentication → URL Configuration:**
   - Site URL: `https://www.wolfpack.rs/app`
   - Redirect URLs: nove adrese (stare ostavi dok stari domen radi)
3. **Google Cloud → OAuth client** → dodaj `https://www.wolfpack.rs` u
   Authorized JavaScript origins.
4. U kodu su adrese već prebačene na `wolfpack.rs` (meta podaci,
   `sitemap.xml`, `robots.txt`).

---

## 5. Kako se radi na sajtu

Nema build koraka — obični HTML, CSS i JavaScript fajlovi.

```bash
npx serve --no-clipboard -l 4321 .
```

Pa otvori `http://localhost:4321/app`.

Objavljivanje: `git push` na `main` — Vercel sam objavi za oko minut.

### Ostala dokumentacija u repozitorijumu

| Fajl | O čemu |
|---|---|
| `README.md` | pregled projekta |
| `POKRETANJE.md` | pokretanje lokalno |
| `BAZA.md` | šema baze i RLS |
| `SUPABASE.md` | podešavanje Supabase projekta |
| `VERCEL.md` | objavljivanje |
| `ADMIN.md` | admin panel |
| `PORUDZBINE.md` | tok porudžbine |
| `KAKO-OBJAVITI.md` | objavljivanje sadržaja |
| `supabase/mejlovi/PROCITAJ.md` | mejlovi, SMTP i šabloni |
| `CrazyWolves-Admin-panel-uputstvo.pdf` | uputstvo za klijenta, sa slikama |

### SQL redosled na praznoj bazi

`supabase-postavka.sql` → `supabase-dopuna-01.sql` → `-02` →
`supabase-porudzbine.sql` → `-03` → `-04` → `-05` → `supabase-admin.sql`

---

## 6. Šta ostaje nedovršeno

- Steam kodovi za digitalne proizvode se unose kroz bazu, ne kroz panel.
- Ručno pravljenje porudžbine u panelu nije napravljeno.
- Ekran **Podešavanja** u panelu se čuva, ali sajt te vrednosti još ne čita.
- **Kategorije** u panelu su samo pregled — preimenovanje ne menja sajt.
- Slike sa starim logom (baneri, šolja) treba zameniti novim Wolfpack
  grafikama.
