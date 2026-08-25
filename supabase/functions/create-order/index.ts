// ============================================================================
// CRAZYWOLVES — create-order
// ----------------------------------------------------------------------------
// Prima korpu iz pregledača, ali joj NE VERUJE.
//
// Iz zahteva se uzimaju samo: id proizvoda, količina i podaci o kupcu.
// Cene, nazivi i pravila plaćanja čitaju se IZ BAZE. Da se cena uzima iz
// zahteva, svako bi mogao da naruči duks za jedan dinar tako što izmeni
// jedan broj u pregledaču.
//
// Funkcija radi sa service role ključem, pa zaobilazi RLS. Zato je ona i
// jedini put do tabele porudžbina.
//
// Podešavanja (Supabase → Edge Functions → Secrets):
//   SUPABASE_URL              (postoji automatski)
//   SUPABASE_SERVICE_ROLE_KEY (postoji automatski)
//   RESEND_API_KEY            (ti dodaješ)
// ============================================================================

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_KEY   = Deno.env.get('RESEND_API_KEY') ?? ''

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })

/** Poziv ka bazi sa service role ključem. */
async function db(path: string, init: RequestInit = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) throw new Error(data?.message ?? `Greška baze ${res.status}`)
  return data
}

/** Iznos u najmanjoj jedinici -> čitljiv zapis. */
function money(minor: number, currency: string): string {
  const value = (minor / 100).toFixed(2)
  const [whole, cents] = value.split('.')
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return currency === 'EUR' ? `€${grouped},${cents}` : `${grouped},${cents} RSD`
}

const esc = (s: string) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// ---------------------------------------------------------------- mejl ------

function emailHtml(order: any, items: any[], hasDigital: boolean) {
  const rows = items.map(i => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #2A241A;color:#F3EEE4;font-size:14px">
        ${esc(i.name)}${i.variant ? `<span style="color:#9C927E"> · ${esc(i.variant)}</span>` : ''}
        <span style="color:#9C927E"> × ${i.quantity}</span>
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #2A241A;color:#F3EEE4;font-size:14px;text-align:right;white-space:nowrap">
        ${money(i.line_total, order.currency)}
      </td>
    </tr>`).join('')

  const line = (label: string, value: string, gold = false) => `
    <tr>
      <td style="padding:6px 0;color:#9C927E;font-size:13px">${esc(label)}</td>
      <td style="padding:6px 0;text-align:right;font-size:${gold ? '18px' : '13px'};
                 color:${gold ? '#D4A24E' : '#C9C2B4'};font-weight:${gold ? '700' : '400'}">${value}</td>
    </tr>`

  const payLabel = { card: 'Karticom', cod: 'Pouzećem — plaćaš kuriru', bank: 'Uplata na račun' }[
    order.payment_method as 'card' | 'cod' | 'bank'
  ]

  return `<!doctype html>
<html lang="sr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0B0B0A;font-family:Arial,Helvetica,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0B0B0A;padding:32px 16px">
<tr><td align="center">
  <table width="100%" style="max-width:560px" cellpadding="0" cellspacing="0">

    <tr><td style="padding-bottom:24px;text-align:center">
      <div style="font-size:22px;font-weight:bold;color:#F3EEE4;letter-spacing:1px">
        CRAZY<span style="color:#D4A24E">WOLVES</span>
      </div>
      <div style="font-size:10px;color:#9C927E;letter-spacing:3px;margin-top:4px">
        THE HUNT NEVER ENDS
      </div>
    </td></tr>

    <tr><td style="background:#161310;border:1px solid #2A241A;border-radius:4px;padding:28px">

      <div style="color:#D4A24E;font-size:11px;letter-spacing:2px;text-transform:uppercase">
        Porudžbina primljena
      </div>
      <div style="color:#F3EEE4;font-size:24px;font-weight:bold;margin-top:8px">
        ${esc(order.order_number)}
      </div>
      <p style="color:#C9C2B4;font-size:14px;line-height:1.6;margin:16px 0 0">
        Hvala, ${esc(order.first_name)}. Primili smo tvoju porudžbinu i javljamo se
        čim krene ka tebi.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px">
        <tr><td colspan="2" style="color:#B8752E;font-size:11px;letter-spacing:2px;
            text-transform:uppercase;padding-bottom:8px">Stavke</td></tr>
        ${rows}
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px">
        ${line('Međuzbir', money(order.subtotal, order.currency))}
        ${order.shipping_cost > 0
          ? line('Dostava', money(order.shipping_cost, order.currency))
          : (hasDigital && !order.address_line ? '' : line('Dostava', 'Besplatno'))}
        ${order.discount > 0 ? line('Popust', '− ' + money(order.discount, order.currency)) : ''}
        <tr><td colspan="2" style="border-top:1px solid #2A241A;padding-top:8px"></td></tr>
        ${line('Ukupno', money(order.total, order.currency), true)}
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px">
        <tr><td colspan="2" style="color:#B8752E;font-size:11px;letter-spacing:2px;
            text-transform:uppercase;padding-bottom:8px">Plaćanje i isporuka</td></tr>
        ${line('Način plaćanja', esc(payLabel ?? ''))}
        ${order.address_line ? line('Adresa',
            esc(`${order.address_line}, ${order.postcode ?? ''} ${order.city ?? ''}`)) : ''}
        ${order.shipping_method ? line('Dostava', esc(order.shipping_method)) : ''}
      </table>

      ${hasDigital ? `
      <div style="margin-top:24px;padding:14px;background:#1A1611;border-left:3px solid #D4A24E">
        <div style="color:#D4A24E;font-size:13px;font-weight:bold">Digitalni artikli</div>
        <p style="color:#C9C2B4;font-size:13px;line-height:1.6;margin:6px 0 0">
          Kodove šaljemo na ovu adresu čim potvrdimo uplatu. Digitalna roba se
          ne plaća pouzećem.
        </p>
      </div>` : ''}

      ${order.payment_method === 'cod' ? `
      <div style="margin-top:16px;padding:14px;background:#1A1611;border-left:3px solid #B8752E">
        <p style="color:#C9C2B4;font-size:13px;line-height:1.6;margin:0">
          Iznos od <strong style="color:#F3EEE4">${money(order.total, order.currency)}</strong>
          plaćaš kuriru pri preuzimanju.
        </p>
      </div>` : ''}

      ${order.notes ? `
      <div style="margin-top:16px">
        <div style="color:#9C927E;font-size:11px;letter-spacing:2px;text-transform:uppercase">Napomena</div>
        <p style="color:#C9C2B4;font-size:13px;margin:6px 0 0">${esc(order.notes)}</p>
      </div>` : ''}

    </td></tr>

    <tr><td style="padding-top:24px;text-align:center">
      <p style="color:#9C927E;font-size:12px;line-height:1.7;margin:0">
        Pitanja? Odgovori na ovaj mejl ili nam piši na Discordu.<br>
        <a href="https://discord.gg/crazywolves" style="color:#D4A24E;text-decoration:none">
          discord.gg/crazywolves</a>
      </p>
      <p style="color:#6B5A38;font-size:11px;margin:16px 0 0">
        CrazyWolves Community · Beograd, Srbija
      </p>
    </td></tr>

  </table>
</td></tr></table>
</body></html>`
}

async function sendEmail(to: string, subject: string, html: string, from: string, bcc?: string) {
  if (!RESEND_KEY) {
    console.warn('RESEND_API_KEY nije podešen — mejl se preskače.')
    return { skipped: true }
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, html, ...(bcc ? { bcc: [bcc] } : {}) }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.message ?? `Resend greška ${res.status}`)
  return data
}

// --------------------------------------------------------------- funkcija ---

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'Metod nije dozvoljen' }, 405)

  try {
    const body = await req.json()
    const { customer, items, paymentMethod, shippingMethod, currency = 'RSD', notes } = body

    // ---------- provera oblika ----------
    if (!Array.isArray(items) || items.length === 0) {
      return json({ error: 'Korpa je prazna.' }, 400)
    }
    if (items.length > 50) {
      return json({ error: 'Previše stavki u jednoj porudžbini.' }, 400)
    }
    if (!customer?.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(customer.email)) {
      return json({ error: 'Imejl adresa nije ispravna.' }, 400)
    }
    if (!customer?.firstName?.trim() || !customer?.lastName?.trim()) {
      return json({ error: 'Ime i prezime su obavezni.' }, 400)
    }
    if (!['card', 'cod', 'bank'].includes(paymentMethod)) {
      return json({ error: 'Način plaćanja nije prepoznat.' }, 400)
    }
    if (!['RSD', 'EUR'].includes(currency)) {
      return json({ error: 'Valuta nije podržana.' }, 400)
    }

    // ---------- proizvodi iz baze ----------
    const ids = [...new Set(items.map((i: any) => String(i.productId)))]
    const inList = ids.map(id => `"${id.replace(/"/g, '')}"`).join(',')
    const products = await db(
      `products?id=in.(${encodeURIComponent(inList)})&select=id,name,price,price_eur,is_active,stock_status,fulfillment,allow_cod,stock,track_stock`)

    const byId = new Map(products.map((p: any) => [p.id, p]))
    let subtotal = 0
    let hasDigital = false
    let hasPhysical = false
    const rows: any[] = []

    for (const item of items) {
      const p: any = byId.get(String(item.productId))
      if (!p) return json({ error: `Proizvod nije pronađen: ${item.productId}` }, 400)
      if (!p.is_active || p.stock_status === 'out_of_stock') {
        return json({ error: `„${p.name}" trenutno nije dostupan.` }, 409)
      }

      const qty = Math.floor(Number(item.quantity))
      if (!Number.isFinite(qty) || qty < 1 || qty > 20) {
        return json({ error: `Neispravna količina za „${p.name}".` }, 400)
      }

      // Cena iz BAZE. Ako nema cene u traženoj valuti, porudžbina se odbija —
      // bolje jasna greška nego naplata pogrešnog iznosa.
      const unit = currency === 'EUR' ? p.price_eur : p.price
      if (unit == null) {
        return json({ error: `„${p.name}" nema cenu u ${currency}.` }, 409)
      }

      if (p.fulfillment === 'digital') hasDigital = true
      else hasPhysical = true

      if (paymentMethod === 'cod' && !p.allow_cod) {
        return json({
          error: `„${p.name}" se ne može platiti pouzećem. Digitalni artikli se plaćaju karticom.`,
        }, 409)
      }

      // Provera zaliha pre upisa. Prava rezervacija ide posle, u jednoj
      // naredbi — ovde samo odbijamo očigledno nemoguće, da kupac dobije
      // jasnu poruku umesto opšte greške.
      if (p.track_stock && p.stock < qty) {
        return json({
          error: p.stock === 0
            ? `„${p.name}" je rasprodat.`
            : `Od „${p.name}" je ostalo još ${p.stock}.`,
        }, 409)
      }

      const lineTotal = unit * qty
      subtotal += lineTotal
      rows.push({
        product_id: p.id, name: p.name, variant: item.variant ?? null,
        unit_price: unit, quantity: qty, line_total: lineTotal,
        fulfillment: p.fulfillment,
      })
    }

    // Fizička roba traži adresu; čisto digitalna ne.
    if (hasPhysical) {
      if (!customer.addressLine?.trim() || !customer.city?.trim()) {
        return json({ error: 'Adresa i grad su obavezni za slanje robe.' }, 400)
      }
    }

    // ---------- dostava ----------
    const settingsRows = await db('settings?select=key,value')
    const cfg: Record<string, string> = {}
    for (const r of settingsRows) cfg[r.key] = r.value

    const flat = parseInt(currency === 'EUR' ? cfg.shipping_flat_eur : cfg.shipping_flat, 10) || 0
    const freeOver = parseInt(
      currency === 'EUR' ? cfg.free_shipping_over_eur : cfg.free_shipping_over, 10) || 0

    // Bez fizičke robe nema ni troška dostave.
    const shippingCost = !hasPhysical ? 0 : (freeOver > 0 && subtotal >= freeOver ? 0 : flat)
    const total = subtotal + shippingCost

    // ---------- upis ----------
    const numberRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/next_order_number`, {
      method: 'POST',
      headers: {
        apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
    })
    const orderNumber = (await numberRes.json()) as string

    // Kartica se plaća pre slanja; pouzeće i uplata na račun čekaju.
    const status = paymentMethod === 'card' ? 'pending_payment' : 'confirmed'

    const [order] = await db('orders', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        order_number: orderNumber,
        email: customer.email.trim().toLowerCase(),
        first_name: customer.firstName.trim(),
        last_name: customer.lastName.trim(),
        phone: customer.phone ?? null,
        address_line: customer.addressLine ?? null,
        city: customer.city ?? null,
        postcode: customer.postcode ?? null,
        country: customer.country ?? 'RS',
        notes: notes ?? null,
        currency,
        subtotal, shipping_cost: shippingCost, discount: 0, total,
        payment_method: paymentMethod,
        payment_status: 'unpaid',
        status,
        shipping_method: shippingMethod ?? null,
      }),
    })

    await db('order_items', {
      method: 'POST',
      body: JSON.stringify(rows.map(r => ({ ...r, order_id: order.id }))),
    })

    // Skidanje sa lagera. reserve_stock proverava i umanjuje u istoj
    // naredbi, pa dva kupca ne mogu uzeti isti poslednji komad.
    for (const r of rows) {
      if (!r.product_id) continue
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/reserve_stock`, {
        method: 'POST',
        headers: {
          apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ p_product_id: r.product_id, p_qty: r.quantity }),
      })
      const ok = await res.json().catch(() => false)
      if (ok !== true) {
        // Neko je uzeo poslednji komad između provere i upisa. Porudžbina
        // se poništava, a već skinute stavke vraćaju na lager.
        await fetch(`${SUPABASE_URL}/rest/v1/rpc/release_stock`, {
          method: 'POST',
          headers: {
            apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ p_order_id: order.id }),
        })
        await db(`orders?id=eq.${order.id}`, { method: 'DELETE' })
        return json({
          error: `„${r.name}" je u međuvremenu rasprodat. Porudžbina nije poslata.`,
        }, 409)
      }
    }

    // ---------- mejl ----------
    // Neuspeh slanja ne sme da poništi porudžbinu — ona je već u bazi.
    let emailStatus = 'poslato'
    try {
      const from = cfg.order_email_from ?? 'CrazyWolves <onboarding@resend.dev>'
      const html = emailHtml(order, rows, hasDigital)
      await sendEmail(order.email, `Porudžbina ${orderNumber} — CrazyWolves`, html, from,
                      cfg.order_email_to)
      await db(`orders?id=eq.${order.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ email_sent_at: new Date().toISOString() }),
      })
    } catch (e) {
      emailStatus = 'nije poslato'
      console.error('Mejl nije poslat:', e instanceof Error ? e.message : e)
    }

    return json({
      ok: true,
      orderNumber,
      total,
      currency,
      shippingCost,
      subtotal,
      status,
      email: emailStatus,
      items: rows.map(r => ({ name: r.name, quantity: r.quantity, lineTotal: r.line_total })),
    })

  } catch (e) {
    console.error(e)
    return json({ error: e instanceof Error ? e.message : 'Neočekivana greška.' }, 500)
  }
})
