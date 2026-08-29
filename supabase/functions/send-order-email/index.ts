/* ============================================================================
   CRAZYWOLVES — MEJL POTVRDE PORUDŽBINE
   ----------------------------------------------------------------------------
   Ova funkcija NE PRAVI porudžbinu. Porudžbinu pravi `create_order` u bazi,
   i ona je već upisana kad ovo krene. Ovde se samo šalje potvrda.

   Zašto tako: da mejl padne — Resend nedostupan, ključ istekao, kvota
   potrošena — porudžbina i dalje stoji u bazi i vidi se u panelu. Slanje
   mejla ne sme da bude uslov za prodaju.

   ----------------------------------------------------------------------------
   ULAZ:   { "orderNumber": "CW-2026-0001" }
   IZLAZ:  { "sent": true }  ili  { "sent": false, "reason": "..." }

   ----------------------------------------------------------------------------
   ZAŠTITA OD ZLOUPOTREBE

   Funkcija je otvorena (kupac koji poručuje nije prijavljen), pa bi neko
   mogao da je gađa tuđim brojevima porudžbina i tako šalje mejlove.

   Zato: mejl se šalje SAMO ako `email_sent_at` još nije upisan. Jedan mejl
   po porudžbini, i to je to. Ponovljeni poziv vraća `already_sent` i ne
   šalje ništa.

   Adresa primaoca se NE prima spolja — čita se iz same porudžbine.
   ============================================================================ */

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_KEY   = Deno.env.get('RESEND_API_KEY');

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
  if (currency === 'EUR') {
    return '€' + (minor / 100).toFixed(2).replace('.', ',');
  }
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Samo POST.' }, 405);

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

    const items = await db(
      `order_items?order_id=eq.${o.id}&select=name,quantity,unit_price,line_total`
    );

    const settings = await db(`settings?key=in.(order_email_to,order_email_from)&select=key,value`);
    const s: Record<string, string> = {};
    for (const row of settings ?? []) s[row.key] = row.value;
    const from = s.order_email_from || 'CrazyWolves <onboarding@resend.dev>';
    const bcc  = s.order_email_to || null;

    if (!RESEND_KEY) {
      return json({ sent: false, reason: 'RESEND_API_KEY nije podešen' });
    }

    const red = (items ?? []).map((i: any) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #E4DDCB">
          ${esc(i.name)}<br><span style="color:#6F654F;font-size:13px">${i.quantity} kom</span>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #E4DDCB;text-align:right;white-space:nowrap">
          ${novac(i.line_total, o.currency)}
        </td>
      </tr>`).join('');

    const html = `
<div style="background:#F4F0E6;padding:28px 0;font-family:Arial,Helvetica,sans-serif;color:#403829">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #DCD2BC;border-radius:4px;overflow:hidden">
    <div style="background:#14120E;padding:20px 24px">
      <div style="color:#D4A24E;font-size:20px;font-weight:bold;letter-spacing:.04em">CRAZYWOLVES</div>
      <div style="color:#AFA697;font-size:11px;letter-spacing:.24em">COMMUNITY</div>
    </div>

    <div style="padding:24px">
      <h1 style="margin:0 0 6px;font-size:21px;color:#171309">Porudžbina je primljena</h1>
      <p style="margin:0 0 18px;color:#6F654F;font-size:14px">
        Broj <b style="color:#171309">${esc(o.order_number)}</b>
      </p>

      <p style="margin:0 0 18px">Zdravo ${esc(o.first_name)}, hvala na porudžbini. Evo šta smo primili:</p>

      <table style="width:100%;border-collapse:collapse;font-size:14px">${red}
        <tr><td style="padding:10px 0;color:#6F654F">Cena</td>
            <td style="padding:10px 0;text-align:right">${novac(o.subtotal, o.currency)}</td></tr>
        <tr><td style="padding:2px 0;color:#6F654F">Dostava${o.shipping_method ? ' — ' + esc(o.shipping_method) : ''}</td>
            <td style="padding:2px 0;text-align:right">${o.shipping_cost ? novac(o.shipping_cost, o.currency) : 'Besplatno'}</td></tr>
        <tr><td style="padding:12px 0 0;font-weight:bold;font-size:16px;color:#171309">Ukupno</td>
            <td style="padding:12px 0 0;text-align:right;font-weight:bold;font-size:16px;color:#171309">${novac(o.total, o.currency)}</td></tr>
      </table>

      ${o.address_line ? `
      <div style="margin-top:22px;padding:14px;background:#F4F0E6;border-radius:4px;font-size:14px">
        <div style="color:#6F654F;font-size:12px;text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px">Adresa</div>
        ${esc(o.first_name)} ${esc(o.last_name)}<br>
        ${esc(o.address_line)}<br>${esc(o.postcode || '')} ${esc(o.city || '')}
      </div>` : ''}

      <p style="margin:22px 0 0;color:#6F654F;font-size:13px;line-height:1.7">
        Javićemo ti čim porudžbina bude potvrđena i poslata.<br>
        Pitanja? Piši nam na Discordu.
      </p>
    </div>

    <div style="background:#F4F0E6;padding:14px 24px;font-size:12px;color:#6F654F;text-align:center">
      One pack. One goal. Endless victories.
    </div>
  </div>
</div>`;

    const send = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [o.email],
        ...(bcc ? { bcc: [bcc] } : {}),
        subject: `Porudžbina ${o.order_number} — CrazyWolves`,
        html
      })
    });

    if (!send.ok) {
      /* Porudžbina OSTAJE u bazi. Vraća se razlog, da se u panelu vidi da
         potvrda nije otišla. */
      return json({ sent: false, reason: `resend ${send.status}: ${await send.text()}` });
    }

    await db(`orders?id=eq.${o.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ email_sent_at: new Date().toISOString() })
    });

    return json({ sent: true });
  } catch (e) {
    return json({ sent: false, reason: String(e?.message || e) }, 500);
  }
});
