/* ============================================================================
   WOLFPACK — NEWSLETTER  (Resend)
   ----------------------------------------------------------------------------
   Jedna funkcija, tri posla:

     kind: "confirm"      mejl sa linkom za potvrdu prijave — zove sajt
     kind: "send"         slanje svima koji su potvrdili    — zove panel, admin
     kind: "test"         isti mejl na jednu adresu         — zove panel, admin

   ----------------------------------------------------------------------------
   ZAŠTO ODVOJENO OD `send-order-email`

   Mejlovi o porudžbinama su novac. Newsletter je sadržaj. Da su u istoj
   funkciji, svaka izmena teksta newslettera tražila bi ponovni deploy koda
   kroz koji prolaze potvrde kupovine — jedna greška u kucanju i staju mejlovi
   o porudžbinama. Ovako su razdvojeni i kvar jednog ne dira drugo.

   Cena te odluke je omot mejla (zaglavlje, boje, podnožje), koji postoji na
   oba mesta. Kad se menja izgled, menja se dvaput — svesno, jer je to jeftinije
   od rizika.

   ----------------------------------------------------------------------------
   TAJNE  (Supabase → Edge Functions → Secrets)

     RESEND_API_KEY   re_...                          (obavezno)
     MAIL_FROM        Wolfpack <office@wolfpack.rs>   (neobavezno)

   SUPABASE_URL i SUPABASE_SERVICE_ROLE_KEY Supabase dodaje sam.

   ----------------------------------------------------------------------------
   KO SME ŠTA

     confirm  otvoreno — posetilac koji se prijavljuje nije ulogovan. Zaštita
              nije u tokenu nego u tome ŠTA se šalje: mejl ide isključivo na
              adresu iz baze, nosi samo link za potvrdu, i ne ponavlja se dok
              ne prođu tri minuta. Ko upiše tuđu adresu, pošalje toj adresi
              jednu ponudu da se prijavi — i ništa više.
     send     traži token prijavljenog admina (provera kroz is_admin).
     test     isto, samo jedan primalac.
   ============================================================================ */

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY     = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const RESEND_KEY   = Deno.env.get('RESEND_API_KEY');
const MAIL_FROM    = Deno.env.get('MAIL_FROM');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const json = (body: unknown, status = 200) => {
  try { console.log('[newsletter]', status, JSON.stringify(body)); } catch { /* bez loga */ }
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' }
  });
};

const esc = (s: unknown) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                 .replace(/"/g, '&quot;');

async function db(path: string, init: RequestInit = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {})
    }
  });
  if (!r.ok) throw new Error(`db ${r.status}: ${await r.text()}`);
  return r.status === 204 ? null : r.json();
}

async function podesavanja(): Promise<Record<string, string>> {
  const rows = await db('settings?select=key,value');
  const out: Record<string, string> = {};
  for (const r of rows ?? []) out[r.key] = r.value;
  return out;
}

/* Ko je pozvao — iz Authorization zaglavlja, isto kao u `send-order-email`. */
async function korisnikIzTokena(req: Request) {
  const auth = req.headers.get('Authorization') ?? '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!token) return null;

  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: ANON_KEY || SERVICE_KEY, Authorization: `Bearer ${token}` }
  });
  if (!r.ok) return null;
  const u = await r.json();
  return u?.id ? { id: u.id as string, email: u.email as string } : null;
}

async function jeAdmin(userId: string): Promise<boolean> {
  const rows = await db(`admins?user_id=eq.${userId}&select=user_id&limit=1`);
  return Boolean(rows?.length);
}

/* ============================================================================
   IZGLED MEJLA
   ========================================================================== */

const ZLATNA = '#D4A24E';
const CRNA   = '#14120E';
const KREM   = '#F4F0E6';
const SIVA   = '#6F654F';

function omot(naslov: string, telo: string, sajt: string): string {
  return `
<div style="background:${KREM};padding:28px 12px;font-family:Arial,Helvetica,sans-serif;color:#403829;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;margin:0 auto;background:#FFFFFF;border:1px solid #E4DDCB;">

    <tr>
      <td style="background:${CRNA};padding:22px 24px;">
        <div style="color:#FFFFFF;font-size:21px;font-weight:bold;letter-spacing:.04em;line-height:1;">WOLF<span style="color:${ZLATNA};">PACK</span></div>
        <div style="color:#AFA697;font-size:11px;letter-spacing:.26em;margin-top:4px;">COMMUNITY</div>
      </td>
    </tr>

    <tr><td style="padding:26px 24px 0;">
      <h1 style="margin:0 0 14px;font-size:22px;line-height:1.3;color:#171309;">${esc(naslov)}</h1>
    </td></tr>

    ${telo}

    <tr>
      <td style="background:${KREM};padding:16px 24px;text-align:center;font-size:12px;color:${SIVA};">
        One pack. One goal. Endless victories.<br>
        <a href="${esc(sajt)}" style="color:#8A5714;text-decoration:none;">wolfpack.rs</a>
        &nbsp;·&nbsp; office@wolfpack.rs
      </td>
    </tr>

  </table>
</div>`;
}

function dugme(tekst: string, href: string): string {
  return `
    <tr><td style="padding:22px 24px 4px;">
      <a href="${esc(href)}" style="display:inline-block;background:${ZLATNA};color:#14110C;text-decoration:none;font-weight:bold;font-size:15px;padding:12px 22px;border-radius:4px;">${esc(tekst)}</a>
    </td></tr>`;
}

/* Odjava stoji u SVAKOM newsletter mejlu, kao običan link bez prijave na sajt.
   To nije ljubaznost nego uslov: bez vidljive odjave pošiljalac brzo završi u
   spam filterima, a i zakon je traži. */
function podnozjeOdjave(token: string, sajt: string): string {
  const veza = `${sajt}#/newsletter/odjava?token=${encodeURIComponent(token)}`;
  return `
    <tr><td style="padding:18px 24px 26px;border-top:1px solid #EFE9DC;">
      <p style="margin:0;font-size:12px;color:${SIVA};line-height:1.7;">
        Dobijaš ovaj mejl jer si se prijavio na Wolfpack newsletter.
        <a href="${esc(veza)}" style="color:#8A5714;">Odjavi se</a> — jedan klik, bez pitanja.
      </p>
    </td></tr>`;
}

function mejlPotvrde(token: string, sajt: string) {
  const veza = `${sajt}#/newsletter/potvrda?token=${encodeURIComponent(token)}`;
  const telo = `
    <tr><td style="padding:0 24px;">
      <p style="margin:0 0 12px;font-size:15px;line-height:1.7;">
        Još jedan klik i upisan si. Potvrda postoji da niko ne bi mogao da prijavi
        tuđu adresu.
      </p>
      <p style="margin:0;font-size:14px;color:${SIVA};line-height:1.7;">
        Jedan mejl nedeljno: najave, drops i događaji. Ništa više od toga.
      </p>
    </td></tr>

    ${dugme('Potvrdi prijavu', veza)}

    <tr><td style="padding:14px 24px 26px;">
      <p style="margin:0;font-size:13px;color:${SIVA};line-height:1.75;">
        Ako ovo nisi bio ti, nemoj ništa da radiš — bez potvrde adresa se ne
        koristi i sama ispada iz spiska.
      </p>
    </td></tr>`;

  return {
    subject: 'Potvrdi prijavu na Wolfpack newsletter',
    html: omot('Potvrdi prijavu', telo, sajt),
    text:
      `Jos jedan klik i upisan si na Wolfpack newsletter.\n\n${veza}\n\n` +
      `Ako ovo nisi bio ti, nemoj nista da radis - bez potvrde adresa se ne koristi.`
  };
}

/* Telo piše urednik u panelu, kao običan tekst. Prazan red deli pasuse; sve
   ostalo prolazi kroz esc(), da nalepljen tekst iz Worda ne može da unese HTML
   u mejl koji ide stotinama ljudi. */
function mejlNewslettera(naslov: string, telo: string, token: string, sajt: string) {
  const pasusi = String(telo || '')
    .split(/\n\s*\n/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.7;">${esc(t).replace(/\n/g, '<br>')}</p>`)
    .join('');

  const telo2 = `
    <tr><td style="padding:0 24px;">${pasusi}</td></tr>
    ${dugme('Otvori shop', `${sajt}#/shop/all`)}
    ${podnozjeOdjave(token, sajt)}`;

  return {
    subject: naslov,
    html: omot(naslov, telo2, sajt),
    text: `${telo}\n\n---\nOdjava: ${sajt}#/newsletter/odjava?token=${encodeURIComponent(token)}`
  };
}

/* ============================================================================
   SLANJE
   ========================================================================== */

async function posalji(opts: { from: string; to: string; subject: string; html: string; text: string }) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: opts.from,
      to: [opts.to],
      reply_to: 'office@wolfpack.rs',
      subject: opts.subject,
      html: opts.html,
      text: opts.text
    })
  });

  if (!r.ok) throw new Error(`resend ${r.status}: ${await r.text()}`);
  return r.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Samo POST.' }, 405);

  try {
    if (!RESEND_KEY) return json({ sent: false, reason: 'RESEND_API_KEY nije podešen' });

    const body = await req.json().catch(() => ({}));
    const kind = String(body.kind || 'confirm');

    const s = await podesavanja();
    const sajt = s.site_url || 'https://www.wolfpack.rs/';
    const from = MAIL_FROM || s.order_email_from || 'Wolfpack <office@wolfpack.rs>';

    /* ------------------------------------------------------------- potvrda */
    if (kind === 'confirm') {
      const adresa = String(body.email || '').trim().toLowerCase();
      if (!adresa) return json({ sent: false, reason: 'nedostaje email' }, 400);

      const red = await db(
        `newsletter_subscribers?email=eq.${encodeURIComponent(adresa)}` +
        `&select=id,email,status,token,last_mail_at&limit=1`
      );
      const pret = red?.[0];

      /* Nema reda, ili je već potvrđen — u oba slučaja ne šaljemo ništa, i u
         oba slučaja sajt dobija isti odgovor. Razlika bi od forme napravila
         proveru da li neka adresa ima pretplatu. */
      if (!pret || pret.status === 'confirmed') return json({ sent: true });

      if (pret.last_mail_at && Date.now() - Date.parse(pret.last_mail_at) < 3 * 60 * 1000) {
        return json({ sent: true, reason: 'throttled' });
      }

      const m = mejlPotvrde(pret.token, sajt);
      await posalji({ from, to: pret.email, subject: m.subject, html: m.html, text: m.text });

      await db(`newsletter_subscribers?id=eq.${pret.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ last_mail_at: new Date().toISOString() })
      });
      return json({ sent: true });
    }

    /* ------------------------------------------------- slanje (proba i svima) */
    if (kind === 'send' || kind === 'test') {
      const u = await korisnikIzTokena(req);
      if (!u || !(await jeAdmin(u.id))) return json({ sent: false, reason: 'samo admin' }, 403);

      const naslov = String(body.subject || '').trim();
      const tekst = String(body.body || '').trim();
      if (!naslov || !tekst) return json({ sent: false, reason: 'nedostaje naslov ili tekst' }, 400);

      let primaoci: Array<{ email: string; token: string }>;

      if (kind === 'test') {
        /* Proba ide na jednu adresu, ali kroz ISTI šablon i isti put kao pravo
           slanje — proba koja ide drugim putem ne dokazuje ništa. Ako ta adresa
           nije pretplatnik, link za odjavu je prazan hod, pa se i to vidi. */
        const adresa = String(body.testTo || u.email).trim().toLowerCase();
        const red = await db(
          `newsletter_subscribers?email=eq.${encodeURIComponent(adresa)}&select=email,token&limit=1`
        );
        primaoci = red?.length ? red : [{ email: adresa, token: 'proba' }];
      } else {
        primaoci = await db(
          `newsletter_subscribers?status=eq.confirmed&select=email,token&order=created_at.asc&limit=500`
        ) ?? [];
      }

      if (!primaoci.length) return json({ sent: false, reason: 'nema nijednog potvrđenog pretplatnika' });

      let poslato = 0;
      const greske: string[] = [];

      for (const pr of primaoci) {
        const m = mejlNewslettera(naslov, tekst, pr.token, sajt);
        try {
          await posalji({ from, to: pr.email, subject: m.subject, html: m.html, text: m.text });
          poslato++;
        } catch (e) {
          greske.push(`${pr.email}: ${String((e as Error)?.message || e)}`);
        }
        /* Resend prima oko dva mejla u sekundi. Bez pauze veći spisak počne da
           se odbija na pola, pa bi deo ljudi dobio mejl a deo ne. */
        if (primaoci.length > 1) await new Promise((r) => setTimeout(r, 600));
      }

      return json({ sent: poslato > 0, poslato, ukupno: primaoci.length, greske });
    }

    return json({ sent: false, reason: `nepoznat kind: ${kind}` }, 400);
  } catch (e) {
    return json({ sent: false, reason: String((e as Error)?.message || e) }, 500);
  }
});
