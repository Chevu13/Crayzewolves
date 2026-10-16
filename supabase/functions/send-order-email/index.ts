/* ============================================================================
   WOLFPACK — MEJLOVI SAJTA  (Resend)
   ----------------------------------------------------------------------------
   Jedna funkcija, tri mejla:

     kind: "order"    potvrda porudžbine          — zove sajt posle kupovine
     kind: "status"   promena statusa porudžbine  — zove panel, samo admin
     kind: "welcome"  dobrodošlica posle prve prijave — zove sajt, sam korisnik

   Funkcija NE PRAVI porudžbinu. Porudžbina je već u bazi kad ovo krene, pa
   pad mejla ne ruši prodaju: ostaje zapisana i vidi se u panelu.

   ----------------------------------------------------------------------------
   ZAŠTO RESEND, A NE SMTP

   Mejlovi idu sa office@wolfpack.rs — adresa na našem domenu, verifikovana
   u Resend-u (SPF i DKIM). Ranije je stajao Gmail SMTP, jer se gmail.com
   adresa ne može verifikovati ni kod jednog servisa. Sada je domen naš, pa
   ide HTTP API: bez SMTP veze, bez dnevne kvote od 500 mejlova, i sa
   izveštajem o isporuci u Resend konzoli.

   ----------------------------------------------------------------------------
   TAJNE  (Supabase → Edge Functions → Secrets)

     RESEND_API_KEY   re_...                               (obavezno)
     MAIL_FROM        Wolfpack <office@wolfpack.rs>        (neobavezno)

   SUPABASE_URL i SUPABASE_SERVICE_ROLE_KEY Supabase dodaje sam.
   Adrese i adresa sajta se inače čitaju iz tabele `settings`, pa se menjaju
   bez novog deploy-a.

   ----------------------------------------------------------------------------
   KO SME ŠTA

     order    otvoreno — kupac koji poručuje nije prijavljen. Zaštita: mejl
              ide samo ako `email_sent_at` još nije upisan, i to na adresu IZ
              porudžbine, nikad na onu koja stigne u zahtevu.
     status   traži token prijavljenog admina (proverava se kroz is_admin).
     welcome  traži token samog korisnika; ide na adresu sa tokena i samo
              jednom po nalogu (`customers.welcomed_at`).
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

/* Svaki ishod ide i u Supabase logove. Bez toga se posle ne zna zašto mejl
   nije otišao — u pregledaču se vidi samo da nije. */
const json = (body: unknown, status = 200) => {
  try { console.log('[mail]', status, JSON.stringify(body)); } catch { /* bez loga */ }
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' }
  });
};

/* Iznosi su u najmanjoj jedinici — 149000 = 1.490 RSD. */
function novac(minor: number, currency: string): string {
  if (currency === 'EUR') return '€' + (minor / 100).toFixed(2).replace('.', ',');
  const din = Math.round(minor / 100);
  return String(din).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' RSD';
}

const esc = (s: unknown) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function db(path: string, init: RequestInit = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers || {})
    }
  });
  if (!r.ok) throw new Error(`baza ${r.status}: ${await r.text()}`);
  return r.status === 204 ? null : r.json();
}

async function podesavanja(): Promise<Record<string, string>> {
  const rows = await db('settings?key=in.(order_email_to,order_email_from,site_url)&select=key,value');
  const out: Record<string, string> = {};
  for (const row of rows ?? []) out[row.key] = row.value;
  return out;
}

/* Ko je pozvao: token iz zaglavlja se proverava kod Supabase Auth-a. */
async function korisnikIzTokena(req: Request) {
  const auth = req.headers.get('Authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  if (!token || token === ANON_KEY) return null;

  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: ANON_KEY || SERVICE_KEY, Authorization: `Bearer ${token}` }
  });
  if (!r.ok) return null;
  const u = await r.json();
  return u?.id ? { id: u.id as string, email: String(u.email || ''), token } : null;
}

async function jeAdmin(userId: string): Promise<boolean> {
  const rows = await db(`admins?user_id=eq.${userId}&select=user_id&limit=1`);
  return Boolean(rows?.length);
}

/* ============================================================================
   IZGLED
   ----------------------------------------------------------------------------
   Tabele i stilovi u atributima, bez <style> u zaglavlju: Outlook i Gmail
   brišu zaglavlje i ne podržavaju moderan raspored.
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
      <h1 style="margin:0 0 14px;font-size:22px;line-height:1.3;color:#171309;">${naslov}</h1>
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

const red = (levo: string, desno: string, jako = false) => `
  <tr>
    <td style="padding:${jako ? '14px 0 0' : '2px 0'};${jako ? 'border-top:2px solid #171309;font-weight:bold;font-size:17px;color:#171309;' : `color:${SIVA};font-size:14px;`}">${levo}</td>
    <td style="padding:${jako ? '14px 0 0' : '2px 0'};text-align:right;${jako ? 'border-top:2px solid #171309;font-weight:bold;font-size:17px;color:#171309;' : 'font-size:14px;'}">${desno}</td>
  </tr>`;

function stavke(o: any, items: any[]): string {
  return items.map((i) => `
      <tr>
        <td style="padding:11px 0;border-bottom:1px solid #E4DDCB;font-size:14px;">
          ${esc(i.name)}<br>
          <span style="color:${SIVA};font-size:13px;">${i.quantity} × ${novac(i.unit_price, o.currency)}</span>
        </td>
        <td style="padding:11px 0;border-bottom:1px solid #E4DDCB;text-align:right;white-space:nowrap;font-size:14px;">
          ${novac(i.line_total, o.currency)}
        </td>
      </tr>`).join('');
}

/* Cena, popust, dostava, ukupno — isti račun u svakom mejlu, da kupac ne
   mora da pogađa odakle razlika između cene i iznosa koji plaća. */
function iznosi(o: any, items: any[]): string {
  const digitalno = items.some((i: any) => i.fulfillment === 'digital') && !o.address_line;
  return `
        ${red('Cena', novac(o.subtotal, o.currency))}
        ${o.discount ? red('Popust', '− ' + novac(o.discount, o.currency)) : ''}
        ${red(
          digitalno ? 'Isporuka' : 'Dostava' + (o.shipping_method ? ' — ' + esc(o.shipping_method) : ''),
          o.shipping_cost ? novac(o.shipping_cost, o.currency) : 'Besplatno'
        )}
        ${red('Ukupno', novac(o.total, o.currency), true)}`;
}

function kutija(naslov: string, sadrzaj: string): string {
  return `
    <tr><td style="padding:20px 24px 0;">
      <div style="padding:14px 16px;background:${KREM};border-radius:4px;font-size:14px;line-height:1.6;">
        <div style="color:${SIVA};font-size:11px;text-transform:uppercase;letter-spacing:.12em;margin-bottom:6px;">${naslov}</div>
        ${sadrzaj}
      </div>
    </td></tr>`;
}

function dugme(tekst: string, href: string): string {
  return `
    <tr><td style="padding:22px 24px 4px;">
      <a href="${esc(href)}" style="display:inline-block;background:${ZLATNA};color:#14110C;text-decoration:none;font-weight:bold;font-size:15px;padding:12px 22px;border-radius:4px;">${esc(tekst)}</a>
    </td></tr>`;
}

/* ---------------------------------------------------------------- porudžbina */
function mejlPorudzbine(o: any, items: any[], sajt: string): { subject: string; html: string; text: string } {
  const digitalno = items.some((i) => i.fulfillment === 'digital');

  const telo = `
    <tr><td style="padding:0 24px;">
      <p style="margin:0 0 4px;font-size:15px;line-height:1.65;">
        Zdravo ${esc(o.first_name)}, primili smo tvoju porudžbinu <b>${esc(o.order_number)}</b>.
      </p>
      <p style="margin:0 0 16px;font-size:14px;color:${SIVA};line-height:1.65;">
        ${digitalno
          ? 'Čim potvrdimo uplatu, kod ti stiže na ovu adresu.'
          : 'Javljamo ti se čim je spakujemo i predamo kuriru.'}
      </p>
    </td></tr>

    <tr><td style="padding:8px 24px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        ${stavke(o, items)}
        ${iznosi(o, items)}
      </table>
    </td></tr>

    ${o.address_line
      ? kutija('Adresa za dostavu',
          `${esc(o.first_name)} ${esc(o.last_name)}<br>${esc(o.address_line)}<br>` +
          `${esc(o.postcode || '')} ${esc(o.city || '')}${o.phone ? '<br>' + esc(o.phone) : ''}`)
      : kutija('Isporuka', digitalno
          ? 'Kod stiže na ovu imejl adresu, čim vidimo uplatu.'
          : esc(o.shipping_method || 'Dogovaramo se preko Discorda.'))}

    ${dugme('Pogledaj porudžbinu', `${sajt}#/nalog/porudzbine`)}

    <tr><td style="padding:14px 24px 26px;">
      <p style="margin:0;font-size:13px;color:${SIVA};line-height:1.75;">
        Nešto nije u redu? Odgovori na ovaj mejl i ispravljamo.
      </p>
    </td></tr>`;

  return {
    subject: `Porudžbina ${o.order_number} — Wolfpack`,
    html: omot('Porudžbina je primljena', telo, sajt),
    text:
      `Zdravo ${o.first_name},\n\nprimili smo porudzbinu ${o.order_number}.\n\n` +
      items.map((i) => `${i.quantity} x ${i.name} — ${novac(i.line_total, o.currency)}`).join('\n') +
      `\n\nCena: ${novac(o.subtotal, o.currency)}` +
      `\nDostava: ${o.shipping_cost ? novac(o.shipping_cost, o.currency) : 'besplatno'}` +
      `\nUkupno: ${novac(o.total, o.currency)}\n\n` +
      (digitalno ? 'Kod stize na ovu adresu cim potvrdimo uplatu.\n\n' : 'Javljamo se cim posaljemo.\n\n') +
      `Wolfpack — wolfpack.rs`
  };
}

/* ------------------------------------------------------------------- status */
const STATUS_NASLOV: Record<string, string> = {
  new:       'Porudžbina je primljena',
  confirmed: 'Porudžbina je potvrđena',
  shipped:   'Porudžbina je poslata',
  picked_up: 'Porudžbina je preuzeta',
  cancelled: 'Porudžbina je otkazana'
};

const STATUS_TEKST: Record<string, string> = {
  new:       'Porudžbina čeka na obradu. Javljamo se čim je pregledamo.',
  confirmed: 'Sve je u redu sa porudžbinom i krećemo da je spremamo.',
  shipped:   'Paket je predat kuriru. Očekuj ga u naredna 2–4 radna dana.',
  picked_up: 'Hvala što si svratio po svoju porudžbinu. Vidimo se na Discordu.',
  cancelled: 'Porudžbina je otkazana. Ako je ovo greška, odgovori na ovaj mejl.'
};

function mejlStatusa(o: any, items: any[], kodovi: any[], sajt: string) {
  const naslov = STATUS_NASLOV[o.status] || 'Porudžbina je ažurirana';

  const kodBlok = kodovi.length
    ? kutija('Tvoji kodovi',
        kodovi.map((k) =>
          `<div style="font-family:Consolas,monospace;font-size:15px;color:#8A5714;letter-spacing:1px;padding:4px 0;">${esc(k.code)}</div>`
        ).join('') +
        `<div style="color:${SIVA};font-size:12px;margin-top:6px;">Aktivacija: Steam → Games → Activate a Product on Steam.</div>`)
    : '';

  const telo = `
    <tr><td style="padding:0 24px;">
      <p style="margin:0 0 4px;font-size:15px;line-height:1.65;">
        Zdravo ${esc(o.first_name)}, porudžbina <b>${esc(o.order_number)}</b> ima novo stanje.
      </p>
      <p style="margin:0 0 16px;font-size:14px;color:${SIVA};line-height:1.65;">
        ${esc(STATUS_TEKST[o.status] || '')}
      </p>
    </td></tr>

    ${o.tracking_number && o.status === 'shipped'
      ? kutija('Broj pošiljke', `<b style="font-size:16px;">${esc(o.tracking_number)}</b>`)
      : ''}

    ${kodBlok}

    <tr><td style="padding:20px 24px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        ${stavke(o, items)}
        ${iznosi(o, items)}
      </table>
    </td></tr>

    ${dugme('Otvori porudžbinu', `${sajt}#/nalog/porudzbine`)}

    <tr><td style="padding:14px 24px 26px;">
      <p style="margin:0;font-size:13px;color:${SIVA};line-height:1.75;">
        Pitanja? Odgovori na ovaj mejl ili nam piši na Discordu.
      </p>
    </td></tr>`;

  return {
    subject: `${naslov} — ${o.order_number}`,
    html: omot(naslov, telo, sajt),
    text:
      `${naslov}\n\nPorudzbina ${o.order_number}\n${STATUS_TEKST[o.status] || ''}\n` +
      (o.tracking_number && o.status === 'shipped' ? `\nBroj posiljke: ${o.tracking_number}\n` : '') +
      (kodovi.length ? `\nKodovi:\n${kodovi.map((k) => k.code).join('\n')}\n` : '') +
      `\nCena: ${novac(o.subtotal, o.currency)}` +
      `\nDostava: ${o.shipping_cost ? novac(o.shipping_cost, o.currency) : 'besplatno'}` +
      `\nUkupno: ${novac(o.total, o.currency)}\n\nWolfpack — wolfpack.rs`
  };
}

/* ---------------------------------------------------------------- dobrodošlica */
function mejlDobrodoslice(ime: string, sajt: string) {
  const telo = `
    <tr><td style="padding:0 24px;">
      <p style="margin:0 0 12px;font-size:15px;line-height:1.7;">
        ${ime ? `Zdravo ${esc(ime)}, dobro` : 'Dobro'} došao u čopor. Nalog je napravljen i spreman.
      </p>
      <p style="margin:0 0 6px;font-size:14px;color:${SIVA};line-height:1.7;">
        Sa nalogom ti ostaje zapisano ono što se inače gubi:
      </p>
      <ul style="margin:0 0 4px;padding-left:18px;font-size:14px;line-height:1.8;color:#403829;">
        <li>sve porudžbine i njihovo stanje na jednom mestu</li>
        <li>Steam kodovi koje si kupio, uvek pri ruci</li>
        <li>lista želja i adresa koja se sama popuni na kasi</li>
      </ul>
    </td></tr>

    ${kutija('Prvo mesto gde sve ide',
      'Najave, drops i giveaway-i idu prvo na Discord, pa tek onda svuda drugde. ' +
      '<a href="https://discord.gg/crazywolves" style="color:#8A5714;">Uđi u čopor</a>.')}

    ${dugme('Otvori shop', `${sajt}#/shop/all`)}

    <tr><td style="padding:14px 24px 26px;">
      <p style="margin:0;font-size:13px;color:${SIVA};line-height:1.75;">
        Ako ovo nisi bio ti, javi nam odgovorom na ovaj mejl i brišemo nalog.
      </p>
    </td></tr>`;

  return {
    subject: 'Dobro došao u čopor — Wolfpack',
    html: omot('Nalog je spreman', telo, sajt),
    text:
      `Dobro dosao u copor.\n\nNalog je napravljen. Porudzbine, Steam kodovi i lista zelja ` +
      `sada stoje na jednom mestu: ${sajt}#/nalog\n\nWolfpack — wolfpack.rs`
  };
}

/* ============================================================================
   SLANJE
   ========================================================================== */
async function posalji(opts: {
  from: string; to: string; bcc?: string | null;
  subject: string; html: string; text: string;
}) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: opts.from,
      to: [opts.to],
      ...(opts.bcc && opts.bcc.toLowerCase() !== opts.to.toLowerCase() ? { bcc: [opts.bcc] } : {}),
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
    const kind = String(body.kind || 'order');
    console.log('[mail] zahtev', kind, body.orderNumber || '');
    const s = await podesavanja();
    const sajt = s.site_url || 'https://www.wolfpack.rs/app';
    const from = MAIL_FROM || s.order_email_from || 'Wolfpack <office@wolfpack.rs>';
    const kopija = s.order_email_to || null;

    /* ---------------------------------------------------------- dobrodošlica */
    if (kind === 'welcome') {
      const u = await korisnikIzTokena(req);
      if (!u) return json({ sent: false, reason: 'nije prijavljen' }, 401);

      const rows = await db(`customers?id=eq.${u.id}&select=first_name,welcomed_at&limit=1`);
      const c = rows?.[0];
      if (c?.welcomed_at) return json({ sent: false, reason: 'already_sent' });

      const m = mejlDobrodoslice(c?.first_name || '', sajt);
      await posalji({ from, to: u.email, subject: m.subject, html: m.html, text: m.text });

      await db(`customers?id=eq.${u.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ welcomed_at: new Date().toISOString() })
      });
      return json({ sent: true });
    }

    /* -------------------------------------------------------------- porudžbina */
    const orderNumber = String(body.orderNumber || '');
    if (!orderNumber) return json({ sent: false, reason: 'nedostaje orderNumber' }, 400);

    const rows = await db(`orders?order_number=eq.${encodeURIComponent(orderNumber)}&select=*&limit=1`);
    if (!rows?.length) return json({ sent: false, reason: 'nema takve porudžbine' }, 404);
    const o = rows[0];

    const items = await db(
      `order_items?order_id=eq.${o.id}&select=name,quantity,unit_price,line_total,fulfillment`
    ) ?? [];

    if (kind === 'status') {
      /* Promenu statusa javlja panel, pa mora da dokaže da je admin —
         inače bi svako mogao da šalje mejlove tuđim kupcima. */
      const u = await korisnikIzTokena(req);
      if (!u || !(await jeAdmin(u.id))) return json({ sent: false, reason: 'samo admin' }, 403);

      /* Kodovi se šalju tek kad je plaćeno — tada ih baza i dodeli. */
      const kodovi = o.payment_status === 'paid'
        ? (await db(`product_keys?order_id=eq.${o.id}&select=code`) ?? [])
        : [];

      const m = mejlStatusa(o, items, kodovi, sajt);
      await posalji({ from, to: o.email, bcc: null, subject: m.subject, html: m.html, text: m.text });
      return json({ sent: true });
    }

    /* Jedan mejl potvrde po porudžbini — i protiv dupliranja kad kupac
       osveži stranicu, i protiv gađanja tuđim brojevima. */
    if (o.email_sent_at) return json({ sent: false, reason: 'already_sent' });

    const m = mejlPorudzbine(o, items, sajt);
    await posalji({ from, to: o.email, bcc: kopija, subject: m.subject, html: m.html, text: m.text });

    await db(`orders?id=eq.${o.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ email_sent_at: new Date().toISOString() })
    });

    return json({ sent: true });
  } catch (e) {
    /* Porudžbina i nalog OSTAJU — vraća se samo razlog, da se vidi u konzoli
       i u panelu zašto mejl nije otišao. */
    return json({ sent: false, reason: String((e as Error)?.message || e) }, 500);
  }
});
