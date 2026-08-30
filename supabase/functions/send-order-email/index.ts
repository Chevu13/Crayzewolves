/* ============================================================================
   CRAZYWOLVES — MEJL POTVRDE PORUDŽBINE
   ----------------------------------------------------------------------------
   Ova funkcija NE PRAVI porudžbinu. Porudžbinu pravi `create_order` u bazi,
   i ona je već upisana kad ovo krene. Ovde se samo šalje potvrda.

   Zašto tako: da mejl padne — pogrešna lozinka, Gmail nedostupan, dnevna
   kvota potrošena — porudžbina i dalje stoji u bazi i vidi se u panelu.
   Slanje mejla ne sme da bude uslov za prodaju.

   ----------------------------------------------------------------------------
   ZAŠTO SMTP, A NE RESEND

   Mejlovi treba da stižu sa `info.crazywolves@gmail.com`. Resend i slični
   servisi šalju samo sa adresa na domenu koji si verifikovao — a gmail.com
   nije tvoj domen i ne može se verifikovati.

   Gmail SMTP može, i to je isti nalog i ista App Password koju Supabase već
   koristi za mejlove registracije i promene lozinke. Jedno podešavanje
   pokriva sve mejlove sa sajta.

   ----------------------------------------------------------------------------
   TAJNE  (Supabase → Edge Functions → Secrets)

     SMTP_HOST   smtp.gmail.com
     SMTP_PORT   465
     SMTP_USER   info.crazywolves@gmail.com
     SMTP_PASS   App Password, 16 znakova bez razmaka
     SMTP_FROM   CrazyWolves <info.crazywolves@gmail.com>     (neobavezno)

   SUPABASE_URL i SUPABASE_SERVICE_ROLE_KEY Supabase dodaje sam.

   ----------------------------------------------------------------------------
   ULAZ:   { "orderNumber": "CW-2026-0001" }
   IZLAZ:  { "sent": true }  ili  { "sent": false, "reason": "..." }

   ----------------------------------------------------------------------------
   ZAŠTITA OD ZLOUPOTREBE

   Funkcija je otvorena (kupac koji poručuje nije prijavljen), pa bi neko
   mogao da je gađa tuđim brojevima porudžbina i tako šalje mejlove.

   Zato: mejl se šalje SAMO ako `email_sent_at` još nije upisan. Jedan mejl
   po porudžbini, i to je to. Adresa primaoca se NE prima spolja — čita se
   iz same porudžbine.
   ============================================================================ */

import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const SMTP_HOST = Deno.env.get('SMTP_HOST') ?? 'smtp.gmail.com';
const SMTP_PORT = Number(Deno.env.get('SMTP_PORT') ?? '465');
const SMTP_USER = Deno.env.get('SMTP_USER');
const SMTP_PASS = Deno.env.get('SMTP_PASS');
const SMTP_FROM = Deno.env.get('SMTP_FROM');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' }
  });

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

/* Statusi onako kako ih kupac razume. */
const STATUS: Record<string, string> = {
  new:       'Nova — javljamo se čim je potvrdimo',
  confirmed: 'Potvrđena',
  shipped:   'Poslata',
  picked_up: 'Preuzeta',
  cancelled: 'Otkazana'
};

function telo(o: any, items: any[]): string {
  const red = items.map((i) => `
      <tr>
        <td style="padding:11px 0;border-bottom:1px solid #E4DDCB;font-size:14px;">
          ${esc(i.name)}<br>
          <span style="color:#6F654F;font-size:13px;">${i.quantity} × ${novac(i.unit_price, o.currency)}</span>
        </td>
        <td style="padding:11px 0;border-bottom:1px solid #E4DDCB;text-align:right;white-space:nowrap;font-size:14px;">
          ${novac(i.line_total, o.currency)}
        </td>
      </tr>`).join('');

  return `
<div style="background:#F4F0E6;padding:28px 12px;font-family:Arial,Helvetica,sans-serif;color:#403829;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #DCD2BC;border-radius:4px;">

    <tr>
      <td style="background:#14120E;padding:22px 24px;">
        <div style="color:#D4A24E;font-size:21px;font-weight:bold;letter-spacing:.04em;line-height:1;">CRAZYWOLVES</div>
        <div style="color:#AFA697;font-size:11px;letter-spacing:.26em;margin-top:4px;">COMMUNITY</div>
      </td>
    </tr>

    <tr>
      <td style="padding:26px 24px 6px;">
        <h1 style="margin:0 0 6px;font-size:22px;line-height:1.25;color:#171309;">Porudžbina je primljena</h1>
        <p style="margin:0 0 4px;font-size:14px;color:#6F654F;">
          Broj <b style="color:#171309;">${esc(o.order_number)}</b>
        </p>
        <p style="margin:0 0 18px;font-size:13px;color:#6F654F;">
          Status: <b style="color:#8A5714;">${esc(STATUS[o.status] || o.status)}</b>
        </p>
        <p style="margin:0 0 4px;font-size:15px;line-height:1.65;">
          Zdravo ${esc(o.first_name)}, hvala na porudžbini. Evo šta smo primili:
        </p>
      </td>
    </tr>

    <tr>
      <td style="padding:8px 24px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          ${red}
          <tr>
            <td style="padding:12px 0 2px;color:#6F654F;font-size:14px;">Cena</td>
            <td style="padding:12px 0 2px;text-align:right;font-size:14px;">${novac(o.subtotal, o.currency)}</td>
          </tr>
          <tr>
            <td style="padding:2px 0;color:#6F654F;font-size:14px;">Dostava${o.shipping_method ? ' — ' + esc(o.shipping_method) : ''}</td>
            <td style="padding:2px 0;text-align:right;font-size:14px;">${o.shipping_cost ? novac(o.shipping_cost, o.currency) : 'Besplatno'}</td>
          </tr>
          <tr>
            <td style="padding:14px 0 0;border-top:2px solid #171309;font-weight:bold;font-size:17px;color:#171309;">Ukupno</td>
            <td style="padding:14px 0 0;border-top:2px solid #171309;text-align:right;font-weight:bold;font-size:17px;color:#171309;">${novac(o.total, o.currency)}</td>
          </tr>
        </table>
      </td>
    </tr>

    ${o.address_line ? `
    <tr>
      <td style="padding:22px 24px 0;">
        <div style="padding:14px 16px;background:#F4F0E6;border-radius:4px;font-size:14px;line-height:1.6;">
          <div style="color:#6F654F;font-size:11px;text-transform:uppercase;letter-spacing:.12em;margin-bottom:6px;">Adresa za dostavu</div>
          ${esc(o.first_name)} ${esc(o.last_name)}<br>
          ${esc(o.address_line)}<br>
          ${esc(o.postcode || '')} ${esc(o.city || '')}
          ${o.phone ? '<br>' + esc(o.phone) : ''}
        </div>
      </td>
    </tr>` : `
    <tr>
      <td style="padding:22px 24px 0;">
        <div style="padding:14px 16px;background:#F4F0E6;border-radius:4px;font-size:14px;line-height:1.6;">
          <div style="color:#6F654F;font-size:11px;text-transform:uppercase;letter-spacing:.12em;margin-bottom:6px;">Preuzimanje</div>
          ${esc(o.shipping_method || 'Dogovaramo se preko Discorda.')}
        </div>
      </td>
    </tr>`}

    <tr>
      <td style="padding:20px 24px 26px;">
        <p style="margin:0;font-size:13px;color:#6F654F;line-height:1.75;">
          Javićemo ti čim porudžbina bude potvrđena i poslata.<br>
          Pitanja? Odgovori na ovaj mejl ili nam piši na Discordu.
        </p>
      </td>
    </tr>

    <tr>
      <td style="background:#F4F0E6;padding:16px 24px;text-align:center;font-size:12px;color:#6F654F;">
        One pack. One goal. Endless victories.<br>
        <span style="color:#8A7A55;">crazywolves.rs</span>
      </td>
    </tr>

  </table>
</div>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Samo POST.' }, 405);

  let client: SMTPClient | null = null;

  try {
    const { orderNumber } = await req.json();
    if (!orderNumber || typeof orderNumber !== 'string') {
      return json({ sent: false, reason: 'nedostaje orderNumber' }, 400);
    }

    const rows = await db(
      `orders?order_number=eq.${encodeURIComponent(orderNumber)}&select=*&limit=1`
    );
    if (!rows?.length) return json({ sent: false, reason: 'nema takve porudžbine' }, 404);

    const o = rows[0];

    /* Jedan mejl po porudžbini — i odbrana od zloupotrebe i od dupliranja
       kad kupac osveži stranicu potvrde. */
    if (o.email_sent_at) return json({ sent: false, reason: 'already_sent' });

    if (!SMTP_USER || !SMTP_PASS) {
      return json({ sent: false, reason: 'SMTP_USER / SMTP_PASS nisu podešeni' });
    }

    const items = await db(
      `order_items?order_id=eq.${o.id}&select=name,quantity,unit_price,line_total`
    );

    /* Kopija vlasniku shopa. Adresa stoji u podešavanjima, da se menja iz
       baze a ne kroz novi deploy funkcije. */
    const settings = await db(`settings?key=in.(order_email_to,order_email_from)&select=key,value`);
    const s: Record<string, string> = {};
    for (const row of settings ?? []) s[row.key] = row.value;

    const from = SMTP_FROM || s.order_email_from || `CrazyWolves <${SMTP_USER}>`;
    const bcc  = s.order_email_to || null;

    client = new SMTPClient({
      connection: {
        hostname: SMTP_HOST,
        port: SMTP_PORT,
        tls: SMTP_PORT === 465,       /* 465 = odmah TLS, 587 = STARTTLS */
        auth: { username: SMTP_USER, password: SMTP_PASS }
      }
    });

    await client.send({
      from,
      to: o.email,
      ...(bcc && bcc.toLowerCase() !== String(o.email).toLowerCase() ? { bcc } : {}),
      subject: `Porudžbina ${o.order_number} — CrazyWolves`,
      html: telo(o, items ?? []),
      /* Tekstualna verzija za klijente koji ne prikazuju HTML, i zato što
         mejl bez nje češće završi u neželjenoj pošti. */
      content: `Porudzbina ${o.order_number} je primljena.\n\n` +
        (items ?? []).map((i: any) => `${i.quantity} x ${i.name} — ${novac(i.line_total, o.currency)}`).join('\n') +
        `\n\nUkupno: ${novac(o.total, o.currency)}\n\nCrazyWolves — crazywolves.rs`
    });

    await db(`orders?id=eq.${o.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ email_sent_at: new Date().toISOString() })
    });

    return json({ sent: true });
  } catch (e) {
    /* Porudžbina OSTAJE u bazi. Razlog se vraća da se u konzoli i u panelu
       vidi zašto potvrda nije otišla. */
    return json({ sent: false, reason: String((e as Error)?.message || e) }, 500);
  } finally {
    try { await client?.close(); } catch { /* veza je već pala */ }
  }
});
